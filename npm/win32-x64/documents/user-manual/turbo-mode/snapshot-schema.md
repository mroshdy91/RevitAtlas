# snapshot_schema

Discover the schema of snapshot tables including column names, types, and optional sample data.

## Overview

`snapshot_schema` returns table schemas for the DuckDB snapshot database. Use it to discover available columns before writing queries, especially for the `element_parameters` table which has dynamic content.

## When to Use

- Before writing a query, to discover available columns
- When getting "column not found" errors
- To understand the data model
- To see sample data for a table

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `table_name` | enum | No | - | Specific table to get schema for |
| `include_sample_data` | boolean | No | `false` | Include sample rows |
| `include_statistics` | boolean | No | `false` | Include column statistics |

### Valid Table Names

- `elements`
- `element_parameters`
- `parameter_catalog`
- `type_parameters`
- `geometry`
- `categories`
- `clashes`
- `relationships`
- `mep_flows`
- `clearances`
- `room_boundaries`
- `room_adjacencies`

## Response Format

```json
{
  "tables": [
    {
      "table_name": "elements",
      "columns": [
        {
          "name": "document_id",
          "type": "VARCHAR",
          "nullable": false,
          "description": "Snapshot document identifier"
        },
        {
          "name": "element_id",
          "type": "INTEGER",
          "nullable": false,
          "description": "Revit ElementId"
        }
      ],
      "row_count": 45000,
      "sample_data": [
        { "element_id": 123456, "category_name": "Walls" }
      ],
      "statistics": {
        "element_id": {
          "distinct_count": 45000,
          "null_count": 0,
          "min": 1001,
          "max": 9999999
        }
      }
    }
  ],
  "snapshot_age_seconds": 180,
  "is_stale": false,
  "query_examples": [
    {
      "description": "Count elements by category",
      "sql": "SELECT category_name, COUNT(*) FROM elements GROUP BY category_name"
    }
  ]
}
```

## Examples

### Get All Core Tables

```json
{
  "tool": "snapshot_schema",
  "params": {}
}
```

Returns schemas for `elements`, `element_parameters`, and `parameter_catalog`.

### Get Specific Table

```json
{
  "tool": "snapshot_schema",
  "params": {
    "table_name": "clashes"
  }
}
```

### With Sample Data

```json
{
  "tool": "snapshot_schema",
  "params": {
    "table_name": "elements",
    "include_sample_data": true
  }
}
```

### With Statistics

```json
{
  "tool": "snapshot_schema",
  "params": {
    "table_name": "geometry",
    "include_statistics": true
  }
}
```

## Table Schemas

### elements

| Column | Type | Description |
|--------|------|-------------|
| `document_id` | VARCHAR | Snapshot identifier |
| `element_id` | INTEGER | Revit ElementId |
| `category_id` | INTEGER | Category ID |
| `category_name` | VARCHAR | Category name |
| `family_name` | VARCHAR | Family name (null for system families) |
| `type_name` | VARCHAR | Type name |
| `type_id` | INTEGER | Type ElementId |
| `level_id` | INTEGER | Level ElementId |
| `level_name` | VARCHAR | Level name |
| `phase_id` | INTEGER | Phase ElementId |
| `workset_id` | INTEGER | Workset ID |
| `workset_name` | VARCHAR | Workset name |
| `host_id` | INTEGER | Host element ID |
| `room_id` | INTEGER | Room containing element |
| `location_x` | DOUBLE | X coordinate (feet) |
| `location_y` | DOUBLE | Y coordinate (feet) |
| `location_z` | DOUBLE | Z coordinate (feet) |

### element_parameters

| Column | Type | Description |
|--------|------|-------------|
| `document_id` | VARCHAR | Snapshot identifier |
| `element_id` | INTEGER | Foreign key to elements |
| `parameter_id` | INTEGER | Foreign key to catalog |
| `value_string` | VARCHAR | String value |
| `value_double` | DOUBLE | Numeric value |
| `value_int` | INTEGER | Integer/ElementId value |
| `storage_type` | VARCHAR | String, Double, Integer, ElementId |
| `unit` | VARCHAR | Display unit |

### parameter_catalog

| Column | Type | Description |
|--------|------|-------------|
| `parameter_id` | INTEGER | Parameter ID |
| `parameter_name` | VARCHAR | Parameter name |
| `storage_type` | VARCHAR | Data type |
| `is_shared` | BOOLEAN | Is shared parameter |
| `is_readonly` | BOOLEAN | Is read-only |
| `group_name` | VARCHAR | Parameter group |

### geometry

| Column | Type | Description |
|--------|------|-------------|
| `element_id` | INTEGER | Element ID |
| `min_x` | DOUBLE | Bounding box min X |
| `max_x` | DOUBLE | Bounding box max X |
| `min_y` | DOUBLE | Bounding box min Y |
| `max_y` | DOUBLE | Bounding box max Y |
| `min_z` | DOUBLE | Bounding box min Z |
| `max_z` | DOUBLE | Bounding box max Z |

### clashes

| Column | Type | Description |
|--------|------|-------------|
| `element_a_id` | INTEGER | First element |
| `element_b_id` | INTEGER | Second element |
| `clash_type` | VARCHAR | Hard, Clearance |
| `severity` | VARCHAR | Critical, Major, Minor |
| `overlap_volume` | DOUBLE | Overlap volume (cubic feet) |

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `NO_SNAPSHOT` | No snapshot exists | Run `snapshot_extract` |
| `TABLE_NOT_FOUND` | Invalid table name | Check valid table names |

## Related Tools

- [snapshot_query](snapshot-query.md) - Execute SQL queries
- [suggest_query](suggest-query.md) - Generate SQL from natural language

## Agent Skill Hints

1. **Use for discovery** - When unsure of column names
2. **Request sample data** - Helps understand data format
3. **Check statistics** - Understand value ranges
4. **Prefer specific tables** - Don't fetch all schemas if you know the table
5. **Use in subagent** - Good for exploratory research
