# snapshot_query

Execute SQL queries against the model snapshot with progressive enrichment.

## Overview

`snapshot_query` runs read-only SQL queries against Parquet files using DuckDB. It supports progressive enrichment to control response size and includes query complexity scoring.

## When to Use

- Analytics queries (counts, aggregations, grouping)
- Data exploration
- Bulk element lookups
- Complex queries with JOINs
- When snapshot freshness is acceptable

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sql` | string | Yes | - | SQL query (SELECT only) |
| `detail_level` | enum | No | `full` | `summary`, `basic`, `detailed`, `full` |
| `max_rows` | number | No | 10000 | Maximum rows to return (1-100000) |
| `timeout_ms` | number | No | 30000 | Query timeout (1000-120000) |
| `offset` | number | No | - | Pagination offset |
| `page_size` | number | No | - | Rows per page (1-10000) |
| `scope` | enum | No | `active` | `active` (current doc) or `global` (all snapshots) |

## Response Format

### Summary Level

```json
{
  "summary": {
    "total_matches": 234,
    "categories": ["Doors", "Windows"],
    "category_counts": {
      "Doors": 156,
      "Windows": 78
    }
  },
  "execution_time_ms": 45,
  "mode": "Turbo",
  "can_drill_down": true,
  "drill_down_hint": "Use detail_level='basic' to see element IDs"
}
```

### Basic Level

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
  "execution_time_ms": 120,
  "mode": "Turbo",
  "can_drill_down": true,
  "drill_down_hint": "Use detail_level='detailed' for parameters"
}
```

### Detailed Level

Adds:
- `snapshot_age_seconds`
- `is_stale`
- `unit_hints` (for dimension columns)
- `query_complexity` (score, level, warnings, hints)

### Full Level

Adds:
- `pagination` (offset, page_size, has_more, next_offset)
- `stale_warning` (if snapshot is old)

## Examples

### Quick Count (Summary)

```json
{
  "tool": "snapshot_query",
  "params": {
    "sql": "SELECT * FROM elements WHERE category_name = 'Doors'",
    "detail_level": "summary"
  }
}
```

Returns only counts without fetching element data.

### List Elements (Basic)

```json
{
  "tool": "snapshot_query",
  "params": {
    "sql": "SELECT element_id, type_name FROM elements WHERE category_name = 'Walls'",
    "detail_level": "basic",
    "max_rows": 100
  }
}
```

### Join with Parameters (Detailed)

```json
{
  "tool": "snapshot_query",
  "params": {
    "sql": "SELECT e.element_id, e.type_name, ep.value_string as mark FROM elements e JOIN element_parameters ep ON e.element_id = ep.element_id JOIN parameter_catalog pc ON ep.parameter_id = pc.parameter_id WHERE e.category_name = 'Doors' AND pc.parameter_name = 'Mark'",
    "detail_level": "detailed"
  }
}
```

### Paginated Query (Full)

```json
{
  "tool": "snapshot_query",
  "params": {
    "sql": "SELECT * FROM elements ORDER BY element_id",
    "detail_level": "full",
    "offset": 0,
    "page_size": 100
  }
}
```

## Available Tables

| Table | Description |
|-------|-------------|
| `elements` | Core element properties |
| `element_parameters` | Instance parameter values |
| `parameter_catalog` | Parameter definitions |
| `type_parameters` | Type-level parameter values |
| `geometry` | Bounding boxes and locations |
| `clashes` | Pre-computed clashes |
| `relationships` | Spatial relationships |
| `mep_flows` | MEP system connections |
| `clearances` | Code compliance clearances |

## Query Complexity

Every query returns complexity analysis:

```json
{
  "query_complexity": {
    "score": 35,
    "level": "moderate",
    "warnings": ["JOINs increase execution time"],
    "hints": ["Consider adding LIMIT with ORDER BY"]
  }
}
```

| Level | Score | Meaning |
|-------|-------|---------|
| `trivial` | 0-9 | Instant |
| `simple` | 10-24 | Fast |
| `moderate` | 25-49 | Normal |
| `complex` | 50-74 | Slow, optimize |
| `heavy` | 75-100 | May timeout |

## Common Patterns

### Category Distribution

```sql
SELECT category_name, COUNT(*) as count
FROM elements
GROUP BY category_name
ORDER BY count DESC
```

### Elements by Level

```sql
SELECT level_name, category_name, COUNT(*) as count
FROM elements
WHERE level_name IS NOT NULL
GROUP BY level_name, category_name
ORDER BY level_name, count DESC
```

### Elements with Specific Parameter

```sql
SELECT e.element_id, e.category_name, ep.value_string
FROM elements e
JOIN element_parameters ep ON e.element_id = ep.element_id
JOIN parameter_catalog pc ON ep.parameter_id = pc.parameter_id
WHERE pc.parameter_name = 'Comments'
  AND ep.value_string IS NOT NULL
```

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `NO_SNAPSHOT` | No snapshot exists | Run `snapshot_extract` |
| `SNAPSHOT_CORRUPT` | Metadata missing | Run `snapshot_extract` with `force_refresh` |
| `COLUMN_NOT_FOUND` | Invalid column name | Check `snapshot_schema` |
| `QUERY_TIMEOUT` | Query too slow | Add filters, reduce scope |
| `BLOCKED_OPERATION` | Non-SELECT query | Only SELECT queries allowed |

## Related Tools

- [snapshot_extract](snapshot-extract.md) - Create snapshots
- [snapshot_status](snapshot-status.md) - Check snapshot health
- [snapshot_schema](snapshot-schema.md) - Discover columns
- [suggest_query](suggest-query.md) - Generate SQL from natural language
- [live_query](../live-mode/live-query.md) - Query live data

## Agent Skill Hints

1. **Start with summary** - Use `detail_level='summary'` first
2. **Drill down as needed** - Follow `drill_down_hint` for more detail
3. **Check complexity** - Monitor `query_complexity.score`
4. **Use pagination** - For large result sets, use `offset`/`page_size`
5. **Cache results** - Snapshot data doesn't change until re-extraction
