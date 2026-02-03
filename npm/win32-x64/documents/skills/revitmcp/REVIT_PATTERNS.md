# Revit-Specific Patterns and Domain Knowledge

Revit BIM models have unique patterns and conventions that affect how you query and interpret the data. This guide covers the most important ones.

## Unit Conversions

Revit stores **all measurements internally in decimal feet**. When querying numeric parameters (diameter, length, width, height, volume, area), you need to convert units.

### Common Conversions

| From | To | Multiply By |
|------|-----|-------------|
| Millimeters | Feet | 0.00328084 |
| Feet | Millimeters | 304.8 |
| Inches | Feet | 0.0833333 |
| Feet | Inches | 12.0 |
| Meters | Feet | 3.28084 |
| Feet | Meters | 0.3048 |

### Example: Diameter Query

```sql
-- Find pipes with diameter > 50mm
-- 50mm = 50 * 0.00328084 = 0.164 feet

SELECT e.element_id, e.family_name, e.type_name,
       p.param_value_double * 304.8 as diameter_mm
FROM elements e
JOIN parameters p ON e.element_id = p.element_id
WHERE e.category_name = 'OST_PipeSegments'
  AND p.param_name = 'Diameter'
  AND p.param_value_double > 0.164  -- 50mm in feet
ORDER BY diameter_mm;
```

### Example: Length Query

```sql
-- Find walls longer than 5 meters
-- 5m = 5 * 3.28084 = 16.404 feet

SELECT element_id, family_name,
       param_length * 0.3048 as length_meters
FROM elements
WHERE category_name = 'OST_Walls'
  AND param_length > 16.404  -- 5m in feet
ORDER BY length_meters DESC;
```

---

## Level Name Variability

Level names **are not standardized** across Revit projects. You'll see variations like:
- "Level 1", "Level 2", "Level 3"
- "L1", "L2", "L3"
- "GROUND FLOOR", "FIRST FLOOR", "SECOND FLOOR"
- "ROOF LEVEL"
- "For space" (unassigned elements)

### Pattern: Use Fuzzy Matching

```sql
-- ❌ BAD: Exact match misses variations
WHERE level_name = 'Level 1'

-- ✅ GOOD: Pattern matching catches variations
WHERE level_name LIKE '%Level 1%'
   OR level_name LIKE '%L1%'
   OR level_name LIKE '%Ground%'
   OR level_name LIKE '%1%'
```

### Pattern: Include NULL Levels

Some elements legitimately have NULL level names (ducts, pipes, equipment). Always decide if you want to include them:

```sql
-- Include both specified level and unassigned
WHERE category_name = 'OST_MechanicalEquipment'
  AND (level_name = 'GROUND FLOOR' OR level_name IS NULL)
```

---

## Categories Without Levels

Many Revit categories **do not have associated levels**. This is normal behavior.

### Categories with NULL Levels

| Category | Reason |
|----------|--------|
| `OST_DuctCurves` | MEP elements (often assigned to zones, not levels) |
| `OST_PipeCurves` | MEP elements |
| `OST_MechanicalEquipment` | Equipment may be unassigned |
| `OST_ElectricalEquipment` | Electrical devices |
| `OST_LightingDevices` | Light fixtures |
| `OST_StructuralFraming` | Sometimes NULL (depends on modeling) |
| `OST_Materials` | Material definitions (not placed objects) |
| `OST_Lines` | Detail lines in views (2D annotations) |
| `OST_TextNotes` | View-specific text annotations |
| `OST_Dimensions` | Dimension annotations |
| `OST_Views` / `OST_Sheets` | Documentation (not model elements) |

### Pattern: Filter with NULL Awareness

```sql
-- Count by level, excluding non-model elements
SELECT level_name, COUNT(*) as count
FROM elements
WHERE category_name IN ('OST_Walls', 'OST_Doors', 'OST_Windows')  -- Model elements only
  AND level_name IS NOT NULL
GROUP BY level_name
ORDER BY level_elevation;
```

---

## Parameter Naming Conventions

### ⚠️ CRITICAL: Use `param_name`, NOT `parameter_name`

The parameters table uses a **specific column naming convention**:

| Correct | Wrong | Description |
|---------|-------|-------------|
| `param_name` | `parameter_name` | Parameter name |
| `param_type` | `parameter_type` | Parameter data type |
| `param_value_string` | `parameter_value_string` | String value |
| `param_value_double` | `parameter_value_double` | Numeric value |
| `param_value_int64` | `parameter_value_int64` | Integer value |
| `param_value_element` | `parameter_value_element` | Element ID reference |

### Correct Query Pattern

```sql
-- ✅ CORRECT
SELECT e.element_id, e.family_name,
       p.param_name, p.param_value_double
FROM elements e
JOIN parameters p ON e.element_id = p.element_id
WHERE p.param_name = 'Diameter'
  AND p.param_value_double > 0.5;

-- ❌ WRONG - will fail with "column not found"
SELECT e.element_id, p.parameter_name, p.parameter_value_double
FROM elements e
JOIN parameters p ON e.element_id = p.element_id;
```

---

## Common Parameters by Category

### MEP (Mechanical/Electrical/Plumbing)

| Parameter | Type | Description |
|-----------|------|-------------|
| `Diameter` | double | Pipe/duct diameter (in feet!) |
| `Length` | double | Element length (in feet!) |
| `Flow` | double | Flow rate (CFM, GPM, etc.) |
| `Pressure` | double | Pressure drop |
| `Velocity` | double | Fluid velocity |
| `System Name` | string | MEP system name |
| `System Type` | string | Supply/Return/Exhaust |
| `Insulation Type` | string | Insulation material |
| `Rating` | string | Equipment rating |

### Structural

| Parameter | Type | Description |
|-----------|------|-------------|
| `Volume` | double | Element volume (cubic feet) |
| `Area` | double | Cross-section area (sq feet) |
| `Length` | double | Member length (feet) |
| `Material` | string | Material name |
| `Strength` | string | Strength grade |
| `Grade` | string | Quality grade |
| `Reinforcement Number` | int | Rebar count |
| `Cover` | double | Concrete cover (feet) |

### Architectural

| Parameter | Type | Description |
|-----------|------|-------------|
| `Width` | double | Element width (feet) |
| `Height` | double | Element height (feet) |
| `Thickness` | double | Wall/floor thickness (feet) |
| `Mark` | string | Element mark/tag |
| `Type Mark` | string | Type identifier |
| `Fire Rating` | string | Fire resistance rating |
| `Sound Transmission Class` | string | STC rating |
| `Rough Width` | double | Rough opening width |
| `Rough Height` | double | Rough opening height |

---

## Element Priority Tiers

When querying "all elements," the results can be overwhelming. Use priority tiers to focus on what matters.

### Tier 1: Core Model Elements (Highest Priority)

These are the primary building elements you typically care about:

**Categories**: `OST_Walls`, `OST_Doors`, `OST_Windows`, `OST_Floors`, `OST_Ceilings`, `OST_Roofs`, `OST_Stairs`, `OST_Ramps`, `OST_Railings`

**Use for**: Overall model composition, spatial analysis, quantity takeoffs

### Tier 2: MEP Elements

Mechanical, electrical, and plumbing systems:

**Categories**: `OST_DuctCurves`, `OST_PipeCurves`, `OST_MechanicalEquipment`, `OST_ElectricalEquipment`, `OST_LightingDevices`, `OST_PlumbingFixtures`, `OST_FireProtectionDevices`, `OST_Sprinklers`

**Use for**: MEP system analysis, equipment sizing, system routing

### Tier 3: Structural Elements

Structural framing and foundations:

**Categories**: `OST_StructuralFraming`, `OST_StructuralColumns`, `OST_StructuralFoundation`, `OST_StructuralRebar`, `OST_StructuralConnections`

**Use for**: Structural analysis, material calculations

### Tier 4: Architectural Details

Furniture, casework, specialty equipment:

**Categories**: `OST_Casework`, `OST_Furniture`, `OST_SpecialtyEquipment`, `OST_FloorOpening`, `OST_CeilingOpening`

**Use for**: Interior design, equipment placement

### Tier 5: Annotations (Medium-Low Priority)

View-specific annotations (not model elements):

**Categories**: `OST_Dimensions`, `OST_TextNotes`, `OST_Tags`, `OST_Keynotes`, `OST_SectionMarks`, `OST_DetailMarks`

**Use for**: Documentation review (usually exclude from model analysis)

### Tier 6: Lines/Graphics (Low Priority)

2D graphics and sketch elements:

**Categories**: `OST_Lines`, `OST_DetailLines`, `<Sketch>`, `OST_Grids`

**Use for**: Detailing review (usually exclude from model analysis)

### Tier 7: System/Documentation (Lowest Priority)

Non-model elements:

**Categories**: `OST_Materials`, `OST_Views`, `OST_Sheets`, `OST_Schedules`, `OST_Levels`, `OST_GridLines`, `Unknown`

**Use for**: Project documentation (usually exclude from model analysis)

### Pattern: Filter by Priority

```sql
-- Focus on Tier 1 model elements only
SELECT category_name, COUNT(*) as count
FROM elements
WHERE category_name IN (
    'OST_Walls', 'OST_Doors', 'OST_Windows', 'OST_Floors',
    'OST_Ceilings', 'OST_Roofs', 'OST_Stairs', 'OST_Ramps', 'OST_Railings'
)
GROUP BY category_name
ORDER BY count DESC;

-- Exclude annotations and system elements
SELECT category_name, COUNT(*) as count
FROM elements
WHERE category_name NOT IN (
    'OST_Materials', 'OST_Lines', 'OST_TextNotes', 'OST_Dimensions',
    'OST_Tags', 'OST_Views', 'OST_Sheets', 'OST_Schedules',
    'OST_Levels', 'Unknown'
)
GROUP BY category_name
ORDER BY count DESC;
```

---

## Quick Reference Card

### Unit Conversion
- **mm to feet**: `mm * 0.00328084`
- **feet to mm**: `feet * 304.8`
- **meters to feet**: `m * 3.28084`

### Level Matching
- Use `LIKE '%pattern%'` for fuzzy matching
- Always consider `OR level_name IS NULL`

### Parameter Columns
- Use `param_name`, NOT `parameter_name`
- Values: `param_value_string`, `param_value_double`, `param_value_int64`

### Priority Filtering
- **Tier 1**: Walls, doors, windows, floors, ceilings, roofs
- **Tier 2**: MEP (ducts, pipes, equipment)
- **Tier 3**: Structural (framing, columns, foundations)
- **Tiers 4-7**: Details, annotations, graphics, system (often exclude)

---

## Common Gotchas

1. **"Unnamed" elements (83,000+ count)**: These are non-model elements like Materials, Lines, Text Notes. Use category filtering to exclude them.

2. **Diameter seems wrong**: Values are in feet, not mm. Multiply by 304.8 to convert to mm.

3. **Level filtering shows no results**: The level might be named differently (L1 vs Level 1) or elements have NULL levels. Use pattern matching.

4. **"Column not found" error**: Check column naming convention. Parameters table uses `param_name` not `parameter_name`.

5. **Huge result sets**: Filter by priority tier. Focus on Tier 1-3 for model analysis.
