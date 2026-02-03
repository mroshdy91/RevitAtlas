# Workflow: Data Exploration

Efficiently explore a Revit model's structure and contents using progressive enrichment.

## Overview

Data exploration is the most common workflow. It follows a funnel pattern: start broad with summaries, then drill down into specific areas of interest.

## The Exploration Funnel

```
┌─────────────────────────────────────────┐
│  1. Status Check    (snapshot_status)    │   "What's in the model?"
├─────────────────────────────────────────┤
│  2. Summary Query   (detail_level=      │   "How many of each?"
│                      summary)            │
├─────────────────────────────────────────┤
│  3. Basic Listing   (detail_level=      │   "Show me element IDs"
│                      basic)              │
├─────────────────────────────────────────┤
│  4. Detailed Data   (detail_level=      │   "What are their properties?"
│                      detailed)           │
├─────────────────────────────────────────┤
│  5. Full Analysis   (detail_level=      │   "Give me everything"
│                      full)               │
└─────────────────────────────────────────┘
```

## Step-by-Step

### Step 1: Check Model Status

```json
{
  "tool": "snapshot_status",
  "params": { "_placeholder": true }
}
```

Read the response:
- `element_count`: Total model size
- `category_distribution.top_10`: What categories exist
- `category_distribution.by_discipline`: Architecture vs MEP vs Structural
- `is_stale`: Whether to refresh

**Decision**: If no snapshot exists, run `snapshot_extract` first.

### Step 2: Get Category Overview

```json
{
  "tool": "snapshot_query",
  "params": {
    "sql": "SELECT * FROM elements",
    "detail_level": "summary"
  }
}
```

Returns counts per category without fetching element data. Token-efficient way to understand model composition.

### Step 3: Explore a Specific Category

Pick an interesting category from Step 2:

```json
{
  "tool": "snapshot_query",
  "params": {
    "sql": "SELECT element_id, type_name, level_name FROM elements WHERE category_name = 'Doors'",
    "detail_level": "basic",
    "max_rows": 50
  }
}
```

### Step 4: Get Parameters

```json
{
  "tool": "snapshot_query",
  "params": {
    "sql": "SELECT e.element_id, e.type_name, ep.value_string as mark FROM elements e JOIN element_parameters ep ON e.element_id = ep.element_id JOIN parameter_catalog pc ON ep.parameter_id = pc.parameter_id WHERE e.category_name = 'Doors' AND pc.parameter_name = 'Mark'",
    "detail_level": "detailed"
  }
}
```

### Step 5: Discover Available Parameters

```json
{
  "tool": "snapshot_schema",
  "params": {
    "table_name": "parameter_catalog",
    "include_sample_data": true
  }
}
```

Or query the catalog directly:

```json
{
  "tool": "snapshot_query",
  "params": {
    "sql": "SELECT DISTINCT pc.parameter_name, pc.storage_type FROM parameter_catalog pc JOIN element_parameters ep ON pc.parameter_id = ep.parameter_id JOIN elements e ON ep.element_id = e.element_id WHERE e.category_name = 'Doors' ORDER BY pc.parameter_name"
  }
}
```

## Common Exploration Queries

### Model Summary

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

### Type Distribution

```sql
SELECT category_name, type_name, COUNT(*) as count
FROM elements
WHERE category_name = 'Walls'
GROUP BY category_name, type_name
ORDER BY count DESC
```

### Parameters for a Category

```sql
SELECT DISTINCT pc.parameter_name, pc.storage_type, COUNT(*) as usage_count
FROM parameter_catalog pc
JOIN element_parameters ep ON pc.parameter_id = ep.parameter_id
JOIN elements e ON ep.element_id = e.element_id
WHERE e.category_name = 'Doors'
GROUP BY pc.parameter_name, pc.storage_type
ORDER BY usage_count DESC
```

### Elements Missing a Parameter

```sql
SELECT e.element_id, e.type_name
FROM elements e
LEFT JOIN element_parameters ep ON e.element_id = ep.element_id
LEFT JOIN parameter_catalog pc ON ep.parameter_id = pc.parameter_id AND pc.parameter_name = 'Mark'
WHERE e.category_name = 'Doors'
  AND ep.element_id IS NULL
```

### Workset Distribution

```sql
SELECT workset_name, COUNT(*) as count
FROM elements
WHERE workset_name IS NOT NULL
GROUP BY workset_name
ORDER BY count DESC
```

## Tips

1. **Start with snapshot_status** - The category_distribution gives you an instant overview
2. **Use summary level** - Saves 90% of tokens
3. **Follow drill_down_hint** - The response tells you how to get more detail
4. **Use suggest_query** - When unsure of SQL syntax
5. **Limit results** - Always add LIMIT for initial exploration
6. **Check schema** - When you get column errors

## Agent Skill Integration

This workflow maps naturally to a multi-step agent skill:

```
1. snapshot_status → Understand model
2. snapshot_query (summary) → Pick category
3. snapshot_query (basic) → Get element list
4. snapshot_query (detailed) → Get properties
5. Report findings
```

## Related Workflows

- [Quality Assurance](quality-assurance.md) - After exploration, check for issues
- [MEP Analysis](mep-analysis.md) - Explore MEP systems specifically
