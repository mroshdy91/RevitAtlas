# suggest_query

Generate SQL queries from natural language questions.

## Overview

`suggest_query` converts natural language questions into valid SQL queries for the snapshot database. It understands the table schema and generates syntactically correct DuckDB SQL.

## When to Use

- When unsure of SQL syntax
- For quick query generation
- When exploring data with natural questions
- As a learning tool for SQL patterns

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | string | Yes | - | Natural language question |

## Response Format

```json
{
  "suggested_sql": "SELECT category_name, COUNT(*) as count FROM elements GROUP BY category_name ORDER BY count DESC",
  "explanation": "Groups elements by category and counts them, sorted by count descending",
  "confidence": 0.95,
  "tables_used": ["elements"],
  "notes": ["Consider adding a LIMIT clause for large result sets"]
}
```

## Examples

### Count Query

**Input:**
```json
{
  "tool": "suggest_query",
  "params": {
    "query": "How many doors are in the model?"
  }
}
```

**Output:**
```json
{
  "suggested_sql": "SELECT COUNT(*) as door_count FROM elements WHERE category_name = 'Doors'"
}
```

### Aggregation Query

**Input:**
```json
{
  "tool": "suggest_query",
  "params": {
    "query": "Show me walls with their volume"
  }
}
```

**Output:**
```json
{
  "suggested_sql": "SELECT e.element_id, e.type_name, ep.value_double as volume FROM elements e JOIN element_parameters ep ON e.element_id = ep.element_id JOIN parameter_catalog pc ON ep.parameter_id = pc.parameter_id WHERE e.category_name = 'Walls' AND pc.parameter_name = 'Volume'"
}
```

### Level-Based Query

**Input:**
```json
{
  "tool": "suggest_query",
  "params": {
    "query": "Count elements on each level"
  }
}
```

**Output:**
```json
{
  "suggested_sql": "SELECT level_name, COUNT(*) as element_count FROM elements WHERE level_name IS NOT NULL GROUP BY level_name ORDER BY level_name"
}
```

### Spatial Query

**Input:**
```json
{
  "tool": "suggest_query",
  "params": {
    "query": "Find elements that clash with walls"
  }
}
```

**Output:**
```json
{
  "suggested_sql": "SELECT c.element_a_id, c.element_b_id, c.clash_type, c.severity FROM clashes c JOIN elements e ON c.element_a_id = e.element_id OR c.element_b_id = e.element_id WHERE e.category_name = 'Walls'",
  "notes": ["For clash analysis, consider using spatial_clash tool instead"]
}
```

## Supported Question Types

| Type | Example | Tables Used |
|------|---------|-------------|
| Count | "How many X?" | `elements` |
| List | "Show me all X" | `elements` |
| Filter | "Find X where Y" | `elements` |
| Aggregate | "Total volume of X" | `elements`, `element_parameters` |
| Group | "Count by category" | `elements` |
| Join | "Walls with fire rating" | `elements`, `element_parameters`, `parameter_catalog` |
| Spatial | "Elements near X" | `geometry`, `relationships` |

## Tips for Better Results

1. **Be specific** - "Count doors on Level 1" vs "How many doors?"
2. **Use category names** - "Walls", "Doors", "Windows" (proper case)
3. **Mention parameters** - "doors with Mark parameter"
4. **Specify output** - "list element IDs" vs "count"

## Limitations

- Only generates SELECT queries
- May not handle complex CTEs
- Parameter name matching is approximate
- Always verify generated SQL

## Workflow Pattern

```javascript
// 1. Generate SQL from natural language
const suggestion = await suggest_query({
  query: "Find all doors without a Mark value"
});

// 2. Review the suggested SQL
console.log(suggestion.suggested_sql);

// 3. Execute the query
const result = await snapshot_query({
  sql: suggestion.suggested_sql,
  detail_level: "basic"
});
```

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `AMBIGUOUS_QUERY` | Question too vague | Be more specific |
| `UNSUPPORTED_QUERY` | Can't translate to SQL | Rephrase or write SQL manually |

## Related Tools

- [snapshot_query](snapshot-query.md) - Execute the generated SQL
- [snapshot_schema](snapshot-schema.md) - Understand available columns

## Agent Skill Hints

1. **Use for exploration** - Quick way to understand data
2. **Verify output** - Always review generated SQL
3. **Combine with execution** - suggest_query → snapshot_query
4. **Learn patterns** - Use to learn common SQL patterns
5. **Fallback to schema** - If suggestions are wrong, check schema
