# Turbo Mode Overview

Turbo Mode is RevitAtlas's high-performance analytics engine. It extracts model data to Parquet files and queries them with DuckDB SQL, enabling complex analytics without blocking the Revit UI.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    snapshot_extract                      │
│           Extracts Revit data to Parquet files          │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Parquet Files                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │  elements   │ │ parameters  │ │   catalog   │  ...  │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    DuckDB Engine                         │
│              Fast SQL query execution                    │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│            snapshot_query / spatial_* tools              │
│           Returns results to AI assistant                │
└─────────────────────────────────────────────────────────┘
```

## Data Tables

### Core Tables

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `elements` | All Revit elements | `element_id`, `category_name`, `family_name`, `type_name`, `level_name` |
| `element_parameters` | Parameter values (EAV) | `element_id`, `parameter_id`, `value_string`, `value_double` |
| `parameter_catalog` | Parameter definitions | `parameter_id`, `parameter_name`, `storage_type` |
| `type_parameters` | Type-level parameters | `type_id`, `parameter_id`, `value_*` |

### Spatial Tables

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `geometry` | Bounding boxes | `element_id`, `min_x`, `max_x`, `min_y`, `max_y`, `min_z`, `max_z` |
| `clashes` | Pre-computed clashes | `element_a_id`, `element_b_id`, `clash_type`, `severity` |
| `relationships` | Spatial relationships | `source_id`, `target_id`, `relationship_type`, `confidence` |
| `mep_flows` | MEP connections | `source_id`, `target_id`, `system_type`, `flow_direction` |
| `clearances` | Code clearances | `element_id`, `direction`, `required_ft`, `actual_ft` |

## Snapshot Lifecycle

### 1. Extraction

```json
{
  "tool": "snapshot_extract",
  "params": {
    "force_refresh": false,
    "include_linked_models": false
  }
}
```

Duration: 5-30 seconds depending on model size.

### 2. Status Check

```json
{
  "tool": "snapshot_status",
  "params": {}
}
```

Returns:
- `exists`: Whether a snapshot exists
- `age_seconds`: How old the snapshot is
- `is_stale`: True if older than 5 minutes
- `element_count`: Total elements extracted
- `category_distribution`: Top categories with counts

### 3. Querying

```json
{
  "tool": "snapshot_query",
  "params": {
    "sql": "SELECT * FROM elements WHERE category_name = 'Doors'",
    "detail_level": "basic",
    "max_rows": 1000
  }
}
```

## Progressive Enrichment

Control response size with `detail_level`:

### Summary Level
```json
{
  "sql": "SELECT * FROM elements WHERE category_name = 'Doors'",
  "detail_level": "summary"
}
```

Response:
```json
{
  "summary": {
    "total_matches": 234,
    "categories": ["Doors"],
    "category_counts": { "Doors": 234 }
  },
  "can_drill_down": true,
  "drill_down_hint": "Use detail_level='basic' to see element IDs"
}
```

### Basic Level
Returns element IDs and names without extra metadata.

### Detailed Level
Adds unit hints and complexity scoring.

### Full Level
Includes pagination metadata and stale warnings.

## Query Complexity Scoring

Turbo Mode analyzes queries and provides complexity feedback:

```json
{
  "query_complexity": {
    "score": 45,
    "level": "moderate",
    "warnings": ["JOINs increase execution time"],
    "hints": ["Add WHERE category_name = '...' for faster queries"]
  }
}
```

Complexity levels:
- `trivial` (0-9): Instant execution
- `simple` (10-24): Fast execution
- `moderate` (25-49): Acceptable performance
- `complex` (50-74): Consider optimization
- `heavy` (75-100): May timeout, optimize query

## Common Query Patterns

### Count by Category
```sql
SELECT category_name, COUNT(*) as count
FROM elements
GROUP BY category_name
ORDER BY count DESC
```

### Elements with Parameters
```sql
SELECT e.element_id, e.category_name, ep.value_string
FROM elements e
JOIN element_parameters ep ON e.element_id = ep.element_id
JOIN parameter_catalog pc ON ep.parameter_id = pc.parameter_id
WHERE pc.parameter_name = 'Mark'
  AND e.category_name = 'Doors'
```

### Elements on Level
```sql
SELECT *
FROM elements
WHERE level_name = 'Level 1'
  AND category_name IN ('Walls', 'Doors', 'Windows')
```

### Type Parameters
```sql
SELECT e.element_id, e.type_name, tp.value_string as fire_rating
FROM elements e
JOIN type_parameters tp ON e.type_id = tp.type_id
JOIN parameter_catalog pc ON tp.parameter_id = pc.parameter_id
WHERE pc.parameter_name = 'Fire Rating'
  AND e.category_name = 'Doors'
```

## Tools Reference

| Tool | Purpose | When to Use |
|------|---------|-------------|
| [snapshot_extract](snapshot-extract.md) | Create/refresh snapshot | Before first query or when data is stale |
| [snapshot_query](snapshot-query.md) | Execute SQL queries | Analytics, data exploration |
| [snapshot_status](snapshot-status.md) | Check snapshot health | Before querying |
| [snapshot_schema](snapshot-schema.md) | Discover columns | When unsure of table structure |
| [suggest_query](suggest-query.md) | Natural language to SQL | Quick query generation |

## Spatial Intelligence

Turbo Mode includes a Spatial Intelligence Engine with 9 specialized tools:

- [spatial_near](spatial/spatial-near.md) - Proximity queries
- [spatial_inside](spatial/spatial-inside.md) - Containment queries
- [spatial_clash](spatial/spatial-clash.md) - Clash detection
- [spatial_related](spatial/spatial-related.md) - Relationship queries
- [spatial_flow](spatial/spatial-flow.md) - MEP flow tracing
- [spatial_clearance](spatial/spatial-clearance.md) - Code compliance
- [spatial_los](spatial/spatial-los.md) - Line of sight
- [spatial_path](spatial/spatial-path.md) - Path analysis
- [spatial_describe](spatial/spatial-describe.md) - Natural language context

See [Spatial Overview](spatial/overview.md) for details.

## Best Practices

1. **Check status before querying** - Avoid stale data surprises
2. **Start with summary** - Use progressive enrichment
3. **Add category filters** - Dramatically improves performance
4. **Use pagination** - For large result sets
5. **Extract once, query many** - Snapshots are reusable

## Agent Skill Hints

When building skills around Turbo Mode:

1. **Always check snapshot_status first** - If `is_stale=true`, consider refresh
2. **Use summary level for exploration** - Saves tokens
3. **Cache category distribution** - Avoid repeated status calls
4. **Handle NO_SNAPSHOT error** - Auto-extract if missing
5. **Combine with spatial tools** - Powerful analysis workflows
