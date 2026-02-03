# Common Pitfalls & Expert Tips

## Query Pitfalls

### Wrong Parameter Source

Type parameters like Fire Rating, Cost, and Manufacturer may be on the **TYPE**, not the instance.

**Problem:**
```sql
-- Returns NULL for many elements!
SELECT param_fire_rating FROM elements WHERE category_name = 'OST_Doors';
```

**Solution - Check both sources:**
```sql
-- Step 1: Check denormalized column first (fastest)
SELECT element_id, param_fire_rating
FROM elements
WHERE category_display_name = 'Doors'
  AND param_fire_rating IS NOT NULL;

-- Step 2: If NULL, check type_parameters table
SELECT e.element_id, tp.param_value_string AS fire_rating
FROM elements e
JOIN type_parameters tp ON e.type_id = tp.type_id
WHERE e.category_display_name = 'Doors'
  AND tp.param_name = 'Fire Rating';
```

### Unit Confusion

All numeric values are in **Revit internal units** (feet, square feet, cubic feet).

| Revit Type | Internal Unit | Conversion to Metric |
|------------|---------------|---------------------|
| Length | Feet | × 0.3048 = meters |
| Area | Square Feet | × 0.0929 = square meters |
| Volume | Cubic Feet | × 0.0283 = cubic meters |
| Angle | Radians | × 57.2958 = degrees |

**Wrong:**
```sql
-- Raw value is in feet, not meters!
SELECT element_id, param_length FROM elements;
```

**Correct:**
```sql
-- Convert to meters
SELECT element_id, param_length * 0.3048 AS length_meters
FROM elements;

-- Convert area to square meters
SELECT element_id, param_area * 0.0929 AS area_sqm
FROM elements;
```

### Case Sensitivity

DuckDB comparisons are **case-sensitive** by default.

**Wrong:**
```sql
-- Won't match "Wall" or "WALL"
SELECT * FROM elements WHERE category_display_name = 'wall';
```

**Correct:**
```sql
-- Use ILIKE for case-insensitive matching
SELECT * FROM elements WHERE category_display_name ILIKE 'wall%';

-- Or use LOWER()
SELECT * FROM elements WHERE LOWER(category_display_name) = 'walls';
```

### Category Name Format

RevitPilot uses **OST_** prefix format (Revit API names).

**Wrong:**
```sql
SELECT * FROM elements WHERE category_name = 'Walls';
```

**Correct:**
```sql
-- Use OST_ prefix
SELECT * FROM elements WHERE category_name = 'OST_Walls';

-- Or use display name for readability
SELECT * FROM elements WHERE category_display_name = 'Walls';
```

### Missing LIMIT Clause

Large models can have 100,000+ elements. Always use LIMIT.

**Wrong:**
```sql
-- May return millions of rows!
SELECT * FROM elements;
```

**Correct:**
```sql
-- Always use LIMIT
SELECT * FROM elements LIMIT 100;

-- For full counts, aggregate first
SELECT category_name, COUNT(*) as count
FROM elements
GROUP BY category_name
ORDER BY count DESC
LIMIT 20;
```

## Data Model Pitfalls

### Instance vs Type Parameters

Parameters exist at two levels:

| Level | Table | Example Parameters |
|-------|-------|-------------------|
| **Instance** | `elements` + `parameters` | Mark, Comments, Level, Phase |
| **Type** | `type_parameters` | Fire Rating, Cost, Manufacturer, Type Mark |

**Pattern for type parameters:**
```sql
-- Join elements to type_parameters via type_id
SELECT e.element_id, e.family_name,
       tp.param_name, tp.param_value_string
FROM elements e
JOIN type_parameters tp ON e.type_id = tp.type_id
WHERE e.category_name = 'OST_Doors'
  AND tp.param_name LIKE '%Fire%';
```

### Document ID for Linked Models

When querying across linked models, always filter by `document_id`:

```sql
-- Elements from specific document only
SELECT * FROM elements
WHERE document_id = 'abc123...'
  AND category_name = 'OST_Walls';

-- Elements from all documents
SELECT document_id, category_name, COUNT(*) as count
FROM elements
GROUP BY document_id, category_name
ORDER BY document_id, count DESC;
```

### Null Handling

Many columns can be NULL. Use COALESCE for defaults:

```sql
SELECT element_id,
       COALESCE(param_fire_rating, 'Not Specified') AS fire_rating,
       COALESCE(param_comments, '') AS comments
FROM elements
WHERE category_display_name = 'Doors';
```

## Performance Tips

### 1. Filter by category_name FIRST

Category filtering is highly selective and fast.

```sql
-- Good: Category filter first
SELECT * FROM elements
WHERE category_name = 'OST_Walls'
  AND level_name = 'Level 1';

-- Slower: Level filter first
SELECT * FROM elements
WHERE level_name = 'Level 1'
  AND category_name = 'OST_Walls';
```

### 2. Use denormalized columns

The elements table has common parameters pre-joined. Avoid the parameters table when possible.

```sql
-- Fast: Use denormalized column
SELECT element_id, param_volume FROM elements WHERE param_volume > 100;

-- Slower: Join to parameters table
SELECT e.element_id, p.param_value_double
FROM elements e
JOIN parameters p ON e.element_id = p.element_id
WHERE p.param_name = 'Volume'
  AND p.param_value_double > 100;
```

### 3. Check snapshot_status before analysis

Avoid working with stale data:

```python
# Check staleness first
status = await mcp.call_tool("snapshot_status", {"request_id": "..."})
if status.get("is_stale"):
    print(f"Warning: {status.get('stale_warning')}")
    if status.get("recommendation") == "refresh_recommended":
        # Consider re-exporting
        pass
```

### 4. Use spatial columns for location queries

New location columns avoid geometry table joins:

```sql
-- Fast: Use location_x/y/z columns
SELECT element_id, family_name, location_x, location_y
FROM elements
WHERE category_name = 'OST_MechanicalEquipment'
  AND location_x BETWEEN 0 AND 100;

-- Slower: Join geometry table
SELECT e.element_id, e.family_name, g.centroid_x, g.centroid_y
FROM elements e
JOIN geometry g ON e.element_id = g.element_id
WHERE e.category_name = 'OST_MechanicalEquipment'
  AND g.centroid_x BETWEEN 0 AND 100;
```

## MEP-Specific Pitfalls

### System Type vs System Name

MEP elements have two system parameters:

- **System Type**: Category (Fire Protection, Domestic Cold Water)
- **System Name**: Instance name (FP-01, DCW-Main)

```sql
-- Get elements by system type
SELECT e.element_id, e.family_name, p.param_value_string as system_type
FROM elements e
JOIN parameters p ON e.element_id = p.element_id
WHERE e.category_name IN ('OST_PipeCurves', 'OST_PipeFitting')
  AND p.param_name = 'System Type'
  AND p.param_value_string LIKE '%Fire%';
```

### Pipe/Duct Length Units

Linear elements use param_length but value is in **internal units (feet)**.

```sql
-- Total pipe length in meters
SELECT
    ROUND(SUM(param_length * 0.3048), 2) as total_length_meters
FROM elements
WHERE category_name = 'OST_PipeCurves';
```

### Diameter vs Size

Numeric diameter is in feet, string size includes units:

```sql
-- Numeric diameter (feet)
SELECT param_value_double * 304.8 as diameter_mm  -- Convert ft to mm
FROM parameters WHERE param_name = 'Diameter';

-- String size (includes units)
SELECT param_value_string as size  -- e.g., "100 mm"
FROM parameters WHERE param_name = 'Size';
```
