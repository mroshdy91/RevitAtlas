# Safety Patterns & Best Practices

## 1. The "Atomic Check"
Before trusting any analysis, verify that the data integrity is intact.

**Anti-Pattern:**
*   Querying blindly without checking dates.

**Safe Pattern:**
*   Check `metadata.json` first.
*   "Data captured at [TIMESTAMP]. Checksum: [HASH]. Is this current?"

## 2. The "Column First" Rule
RevitMCP flattens common data. Don't JOIN unless you have to.

**Anti-Pattern:**
```sql
-- SLOW: Joining EAV table for common data
SELECT * FROM element_parameters WHERE param_name = 'Volume'
```

**Safe Pattern:**
```sql
-- FAST: Using column
SELECT param_volume FROM elements
```

## 3. The "Limit" Rule
Revit models can be huge (100k+ elements).

**Anti-Pattern:**
```sql
SELECT * FROM elements
```

**Safe Pattern:**
```sql
SELECT element_id, category_name FROM elements LIMIT 100
```
