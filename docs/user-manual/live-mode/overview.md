# Live Mode Overview

Live Mode provides real-time query execution against the current Revit document without requiring a snapshot. It includes two tools: `live_query` for SQL queries and `execute_script` for C# scripting.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        live_query                            │
│                    SQL Query Input                            │
└─────────────────────────────────────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    │ Query Router │
                    └──────┬──────┘
                     ┌─────┴─────┐
                     ▼           ▼
              ┌──────────┐ ┌─────────────┐
              │  FECQL   │ │   Micro-    │
              │  Path    │ │  Snapshot   │
              │ (~200ms) │ │  (~5-15s)   │
              └────┬─────┘ └──────┬──────┘
                   │              │
                   ▼              ▼
              ┌──────────────────────────┐
              │  Revit Plugin (Live)     │
              │  FilteredElementCollector │
              │  or Scoped Extraction    │
              └──────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────┐
│                      execute_script                          │
│                    C# Script Input                            │
└─────────────────────────────────────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    │  Validator  │
                    │ (blocklist) │
                    └──────┬──────┘
                           ▼
              ┌─────────────────────────┐
              │   Revit Plugin          │
              │   Roslyn Compiler       │
              │   Sandbox Runtime       │
              └─────────────────────────┘
```

## When to Use Live Mode

| Scenario | Use Live Mode? |
|----------|----------------|
| Data must be current (just edited in Revit) | Yes |
| Simple element queries | Yes (FECQL path is fast) |
| Modifying model data | Yes (execute_script) |
| Complex analytics | No (use Turbo Mode) |
| Spatial analysis | No (use spatial_* tools) |
| Bulk reads | Depends on query complexity |

## Tools

| Tool | Purpose | Speed |
|------|---------|-------|
| [live_query](live-query.md) | SQL queries against live data | 200ms - 15s |
| [execute_script](execute-script.md) | Run C# scripts in Revit | Variable |

## live_query: Two Execution Paths

### FECQL Path (~200ms)

**Fast path** for simple queries that translate to Revit's FilteredElementCollector:

```sql
-- FECQL-compatible
SELECT * FROM elements WHERE category_name = 'Doors'
SELECT * FROM elements WHERE category_name = 'Walls' LIMIT 10
```

Characteristics:
- Single table (elements)
- Simple WHERE clause on category/type
- No JOINs, CTEs, or aggregations
- Fastest possible live data access

### Micro-Snapshot Path (~5-15s)

**Full SQL path** for complex queries that need a temporary extraction:

```sql
-- Requires Micro-Snapshot
SELECT e.*, ep.value_string
FROM elements e
JOIN element_parameters ep ON e.element_id = ep.element_id
WHERE e.category_name = 'Doors'
```

Characteristics:
- JOINs, CTEs, subqueries, GROUP BY
- Any aggregation (COUNT, SUM, AVG)
- Window functions
- Scoped extraction (only relevant categories)

### Routing Logic

The query router automatically selects the path:

```
SQL Input → Parse → Analyze features → Route
                                          │
                    ┌─────────────────────┤
                    │                     │
              Simple query          Complex query
              (single table,        (JOINs, CTEs,
               basic WHERE)          aggregations)
                    │                     │
                    ▼                     ▼
                  FECQL            Micro-Snapshot
```

## execute_script: C# Scripting

### Transaction Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `read_only` | No writes allowed | Querying data |
| `auto_commit` | Commits on success | Modifying data |
| `dry_run` | Always rolls back | Testing changes |

### Pre-built Templates

7 templates for common operations:

| Template | Description |
|----------|-------------|
| `count_by_category` | Count elements per category |
| `bulk_parameter_update` | Set parameter values |
| `detect_clashes` | Find geometric clashes |
| `query_linked_model` | Query linked documents |
| `get_geometry` | Extract geometry data |
| `renumber_elements` | Renumber element marks |
| `find_duplicates` | Detect duplicate elements |

### Safety

Two-layer validation:
1. **MCP Server**: Static blocklist (`scriptValidator.ts`)
2. **Revit Plugin**: Runtime sandbox (`ScriptValidator.cs`)

Blocked operations:
- File system access (System.IO)
- Network access (System.Net)
- Process spawning (System.Diagnostics.Process)
- Reflection emit (Reflection.Emit)
- Registry access

## Choosing Between Modes

```
                    ┌──────────────────┐
                    │  Need live data? │
                    └────────┬─────────┘
                     ┌───────┴───────┐
                    Yes              No
                     │                │
              ┌──────┴──────┐  ┌─────┴─────┐
              │  Simple     │  │ Turbo Mode │
              │  query?     │  │ (snapshot) │
              └──────┬──────┘  └────────────┘
               ┌─────┴─────┐
              Yes           No
               │             │
        ┌──────┴─────┐ ┌────┴──────┐
        │ live_query  │ │  Need     │
        │ (FECQL)    │ │  writes?  │
        └────────────┘ └────┬──────┘
                       ┌────┴────┐
                      Yes        No
                       │          │
                ┌──────┴──────┐ ┌─┴────────────┐
                │ execute_    │ │  live_query   │
                │ script     │ │  (Micro-Snap) │
                └─────────────┘ └──────────────┘
```

## Performance Comparison

| Operation | Turbo Mode | Live FECQL | Live Micro-Snapshot |
|-----------|-----------|------------|---------------------|
| Count doors | 50ms | 200ms | 5s |
| List walls | 100ms | 200ms | 5s |
| Doors + params | 200ms | N/A | 8s |
| Complex analytics | 500ms | N/A | 15s |
| Parameter update | N/A | N/A | execute_script |

## Best Practices

1. **Use FECQL-compatible queries** when possible (~200ms)
2. **Add scope_hints** to Micro-Snapshot queries for faster extraction
3. **Test with dry_run** before committing script changes
4. **Use templates** instead of custom scripts when available
5. **Prefer Turbo Mode** for analytics (faster for complex queries)
6. **Use Live Mode** only when freshness matters or writes needed

## Agent Skill Hints

1. **Start with live_query** - For quick element checks
2. **Check query routing** - Response includes `execution_path`
3. **Use scope_hints** - Category hints speed up Micro-Snapshot
4. **Template first** - Prefer templates over custom scripts
5. **dry_run safety** - Always test scripts before committing
