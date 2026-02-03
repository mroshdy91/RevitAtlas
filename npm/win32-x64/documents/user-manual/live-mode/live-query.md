# live_query

Execute SQL queries against live Revit data with automatic routing to the optimal execution path.

## Overview

`live_query` always queries current Revit data, unlike `snapshot_query` which uses cached snapshots. It auto-routes queries to FECQL (fast, ~200ms) for simple queries or Micro-Snapshot (full SQL, ~5-15s) for complex ones.

## When to Use

- Data must be current (model just changed)
- Quick element lookups
- Verification after modifications
- When snapshot doesn't exist or is stale

## When NOT to Use

- Complex analytics (use `snapshot_query` - faster)
- Spatial analysis (use `spatial_*` tools)
- Repeated queries (snapshot is cached, live is not)

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sql` | string | Yes | - | SQL query (SELECT only) |
| `prefer` | enum | No | `auto` | Force: "auto", "fecql", "micro_snapshot" |
| `timeout_ms` | number | No | 30000 | Timeout (1000-120000) |
| `scope_hints` | object | No | - | Optimization hints |

### scope_hints

| Field | Type | Description |
|-------|------|-------------|
| `categories` | string[] | Category names to extract |
| `parameters` | string[] | Parameter names to extract |
| `view_id` | number | View to scope extraction |
| `max_elements` | number | Max elements (default: 10000) |

## Response Format

```json
{
  "columns": [
    { "name": "element_id", "type": "INTEGER" },
    { "name": "category_name", "type": "VARCHAR" }
  ],
  "rows": [
    { "element_id": 123456, "category_name": "Doors" }
  ],
  "row_count": 50,
  "execution_time_ms": 180,
  "mode": "Live (FECQL)",
  "execution_path": "fecql",
  "query_complexity": {
    "score": 5,
    "level": "trivial"
  }
}
```

## Execution Paths

### FECQL (~200ms)

Translates SQL to Revit's FilteredElementCollector. Used for:

```sql
-- All FECQL-compatible
SELECT * FROM elements WHERE category_name = 'Doors'
SELECT element_id, type_name FROM elements WHERE category_name = 'Walls'
SELECT * FROM elements WHERE category_name = 'Windows' LIMIT 50
```

Requirements:
- Single table (`elements` only)
- Simple WHERE on `category_name` or `type_name`
- No JOINs, CTEs, GROUP BY, or aggregations
- Optional LIMIT

### Micro-Snapshot (~5-15s)

Creates a temporary scoped extraction, then queries with DuckDB. Used for:

```sql
-- All require Micro-Snapshot
SELECT e.*, ep.value_string
FROM elements e
JOIN element_parameters ep ON e.element_id = ep.element_id

SELECT category_name, COUNT(*) FROM elements GROUP BY category_name

WITH door_params AS (...)
SELECT ...
```

Trigger conditions:
- JOINs
- CTEs (WITH clauses)
- GROUP BY / aggregations
- Subqueries
- Window functions
- Multiple tables

## Examples

### Simple Query (FECQL)

```json
{
  "tool": "live_query",
  "params": {
    "sql": "SELECT * FROM elements WHERE category_name = 'Doors'"
  }
}
```

Response includes `"execution_path": "fecql"`, `"mode": "Live (FECQL)"`.

### Complex Query (Micro-Snapshot)

```json
{
  "tool": "live_query",
  "params": {
    "sql": "SELECT e.element_id, e.type_name, ep.value_string as mark FROM elements e JOIN element_parameters ep ON e.element_id = ep.element_id JOIN parameter_catalog pc ON ep.parameter_id = pc.parameter_id WHERE e.category_name = 'Doors' AND pc.parameter_name = 'Mark'"
  }
}
```

Response includes `"execution_path": "micro_snapshot"`, `"mode": "Live (Micro-Snapshot)"`.

### With Scope Hints

```json
{
  "tool": "live_query",
  "params": {
    "sql": "SELECT e.*, ep.value_string FROM elements e JOIN element_parameters ep ON e.element_id = ep.element_id WHERE e.category_name = 'Doors'",
    "scope_hints": {
      "categories": ["Doors"],
      "parameters": ["Mark", "Comments"],
      "max_elements": 500
    }
  }
}
```

Scope hints tell the Micro-Snapshot path to only extract door elements with Mark/Comments parameters, making extraction faster.

### Force FECQL

```json
{
  "tool": "live_query",
  "params": {
    "sql": "SELECT * FROM elements WHERE category_name = 'Walls'",
    "prefer": "fecql"
  }
}
```

### Force Micro-Snapshot

```json
{
  "tool": "live_query",
  "params": {
    "sql": "SELECT * FROM elements WHERE category_name = 'Walls'",
    "prefer": "micro_snapshot"
  }
}
```

## Query Complexity

Every response includes complexity scoring:

```json
{
  "query_complexity": {
    "score": 35,
    "level": "moderate",
    "warnings": ["JOINs increase execution time"],
    "hints": ["Add scope_hints.categories for faster extraction"]
  }
}
```

## FECQL vs Micro-Snapshot Decision

| Query Feature | FECQL | Micro-Snapshot |
|---------------|-------|----------------|
| Single table | Yes | Yes |
| JOINs | No | Yes |
| CTEs | No | Yes |
| GROUP BY | No | Yes |
| Aggregations | No | Yes |
| Subqueries | No | Yes |
| Window functions | No | Yes |
| LIMIT | Yes | Yes |
| WHERE on category | Yes | Yes |
| WHERE on parameters | No | Yes |

## live_query vs snapshot_query

| Aspect | live_query | snapshot_query |
|--------|-----------|----------------|
| Data freshness | Always current | Snapshot time |
| Simple query speed | ~200ms (FECQL) | ~50ms |
| Complex query speed | ~5-15s | ~200ms-2s |
| Requires extraction | No | Yes |
| Progressive enrichment | No | Yes (detail_level) |
| Spatial tools | No | Yes |

## Caching

Micro-Snapshot results are cached with 60-second TTL using an LRU cache. Repeated identical queries within 60 seconds return cached results instantly.

## Use Cases

### Verify After Modification

```javascript
// After execute_script modified doors
const doors = await live_query({
  sql: "SELECT * FROM elements WHERE category_name = 'Doors'"
});

console.log(`Current door count: ${doors.row_count}`);
```

### Quick Element Count

```javascript
const count = await live_query({
  sql: "SELECT COUNT(*) as total FROM elements WHERE category_name = 'Walls'",
  prefer: "micro_snapshot"
});
```

### Check Specific Parameter

```javascript
const result = await live_query({
  sql: `SELECT e.element_id, ep.value_string as mark
        FROM elements e
        JOIN element_parameters ep ON e.element_id = ep.element_id
        JOIN parameter_catalog pc ON ep.parameter_id = pc.parameter_id
        WHERE e.category_name = 'Doors' AND pc.parameter_name = 'Mark'`,
  scope_hints: {
    categories: ["Doors"],
    parameters: ["Mark"]
  }
});
```

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `CONNECTION_ERROR` | Can't connect to Revit | Check plugin is running |
| `QUERY_TIMEOUT` | Query too slow | Add scope_hints or simplify |
| `FECQL_UNSUPPORTED` | Query can't use FECQL | Use `prefer: "auto"` |
| `EXTRACTION_FAILED` | Micro-Snapshot failed | Check Revit plugin logs |
| `BLOCKED_OPERATION` | Non-SELECT query | Only SELECT allowed |

## Related Tools

- [snapshot_query](../turbo-mode/snapshot-query.md) - Cached snapshot queries
- [execute_script](execute-script.md) - C# scripting for writes
- [snapshot_extract](../turbo-mode/snapshot-extract.md) - Full extraction

## Agent Skill Hints

1. **Use for freshness** - When data must be current
2. **Prefer FECQL queries** - Write simple SQL when possible
3. **Add scope_hints** - Speed up Micro-Snapshot path
4. **Check execution_path** - Know which path was used
5. **Cache awareness** - Micro-Snapshot results cached 60s
6. **Fall back to snapshot** - For complex analytics
