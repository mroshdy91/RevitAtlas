# Getting Started with RevitAtlas

This guide covers the core concepts and helps you get productive quickly.

## Core Concepts

### Modes of Operation

RevitAtlas provides three modes for interacting with Revit:

| Mode | Speed | Data Freshness | Best For |
|------|-------|----------------|----------|
| **Turbo Mode** | Fast (~1-2s) | Snapshot (may be stale) | Analytics, bulk queries |
| **Live Mode** | Variable (~200ms - 15s) | Always current | Real-time data, modifications |
| **Standard Mode** | Moderate | Always current | Specific Revit API operations |

### Snapshots

A **snapshot** is a point-in-time extraction of your Revit model stored as Parquet files. Snapshots enable:

- **Fast SQL queries** via DuckDB
- **Spatial analysis** (clashes, proximity, relationships)
- **Offline analysis** (no Revit connection needed)

Snapshots are stored in `%LOCALAPPDATA%\RevitAtlas\snapshots\`.

### SQL Tables

Turbo Mode exposes these tables for querying:

| Table | Description |
|-------|-------------|
| `elements` | All Revit elements with core properties |
| `element_parameters` | Parameter values (EAV format) |
| `parameter_catalog` | Parameter metadata |
| `geometry` | Bounding boxes and locations |
| `clashes` | Pre-computed clash detection |
| `relationships` | Spatial relationships (hosting, containment) |
| `mep_flows` | MEP system connections |
| `clearances` | Code compliance clearances |

### Progressive Enrichment

The `snapshot_query` tool supports **progressive enrichment** via the `detail_level` parameter:

| Level | Returns | Token Usage |
|-------|---------|-------------|
| `summary` | Counts and category breakdown | ~90% reduction |
| `basic` | Element IDs and names | ~50% reduction |
| `detailed` | + Parameters, complexity scoring | Standard |
| `full` | + Pagination, stale warnings | Full data |

Start with `summary` for exploration, then drill down as needed.

## Quick Start

### 1. Extract a Snapshot

Before using Turbo Mode or spatial tools, extract a snapshot:

```json
{
  "tool": "snapshot_extract",
  "params": {}
}
```

This takes 5-30 seconds depending on model size.

### 2. Check Status

Verify the snapshot is ready:

```json
{
  "tool": "snapshot_status",
  "params": {}
}
```

Response includes element count, age, and category distribution.

### 3. Query Elements

Run a SQL query:

```json
{
  "tool": "snapshot_query",
  "params": {
    "sql": "SELECT category_name, COUNT(*) as count FROM elements GROUP BY category_name ORDER BY count DESC",
    "detail_level": "summary"
  }
}
```

### 4. Explore Spatially

Find clashes in the model:

```json
{
  "tool": "spatial_clash",
  "params": {
    "severity_filter": ["Critical", "Major"]
  }
}
```

## When to Use Each Mode

### Use Turbo Mode When:
- Running analytics queries (counts, aggregations)
- Exploring model structure
- Performing spatial analysis
- Data doesn't need to be real-time

### Use Live Mode When:
- Data must be current (just made changes in Revit)
- Running simple queries (FECQL path is fast)
- Executing scripts to modify the model

### Use Standard Mode When:
- Setting specific parameters
- Creating elements
- Making precise modifications

## Common Patterns

### Pattern 1: Explore → Query → Analyze

```
1. snapshot_status (check if extraction needed)
2. snapshot_extract (if needed)
3. snapshot_query with detail_level='summary' (explore)
4. snapshot_query with detail_level='full' (detailed data)
5. spatial_* tools (analysis)
```

### Pattern 2: Quick Count

```json
{
  "tool": "snapshot_query",
  "params": {
    "sql": "SELECT * FROM elements WHERE category_name = 'Doors'",
    "detail_level": "summary"
  }
}
```

Returns just counts without fetching all door data.

### Pattern 3: Real-Time Check

```json
{
  "tool": "live_query",
  "params": {
    "sql": "SELECT COUNT(*) FROM elements WHERE category_name = 'Walls'"
  }
}
```

Always queries current Revit data.

### Pattern 4: Bulk Update

```json
{
  "tool": "execute_script",
  "params": {
    "template": "bulk_parameter_update",
    "template_params": {
      "category_name": "Doors",
      "parameter_name": "Comments",
      "new_value": "Reviewed 2026"
    },
    "transaction_mode": "auto_commit"
  }
}
```

## Performance Tips

1. **Use `detail_level='summary'` first** - Don't fetch all data until you need it
2. **Add category filters** - `WHERE category_name = '...'` dramatically speeds queries
3. **Use LIMIT** - Cap large result sets: `LIMIT 100`
4. **Prefer FECQL-compatible queries** - Simple single-table queries use the fast path
5. **Reuse snapshots** - Check `snapshot_status` before extracting

## Error Handling

Common errors and solutions:

| Error | Solution |
|-------|----------|
| `NO_SNAPSHOT` | Run `snapshot_extract` first |
| `SNAPSHOT_STALE` | Run `snapshot_extract` with `force_refresh=true` |
| `QUERY_TIMEOUT` | Add filters or reduce result size |
| `COLUMN_NOT_FOUND` | Check `snapshot_schema` for correct column names |

## Next Steps

- [Turbo Mode Overview](turbo-mode/overview.md) - Deep dive into snapshot-based analytics
- [Live Mode Overview](live-mode/overview.md) - Real-time query execution
- [Data Exploration Workflow](workflows/data-exploration.md) - Practical exploration guide
