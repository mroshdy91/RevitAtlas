---
name: query-material-data
description: High-fidelity material extraction skill for Revit Snapshots. Resolves physical material names (e.g., "Steel, Carbon") by joining ElementId references to the Material category, bypassing unreliable text parameters.
---

# Skill: Robust Material Resolution

This skill provides a standardized method for resolving physical material names from Revit snapshots. It addresses the common issue where text-based "Material" parameters are empty, inconsistent, or hold internal Type names instead of physical material identities.

## 1. Core Logic & Assumptions

### ElementId Referencing
In Revit, the `Material` parameter typically stores the **ElementId** of a Material element, not a string. This skill assumes that the true material name is stored in the `Name` parameter of the associated Material element.

### Join Hierarchy
1.  Identify the parameter ID for "Material" on the host element.
2.  Extract the `value_int` (ElementId) from that parameter.
3.  Join this ID to the `elements_global` table to find the Material element.
4.  Join the `Name` parameter ID from the `parameter_catalog_global` to extract the final string.

## 2. Standard SQL Template (Global Scoped)

```sql
SELECT 
    e.document_id,
    e.element_id,
    mat_name.value_string as ResolvedMaterial
FROM elements_global e
-- 1. Get the Material ElementId from the host
JOIN element_parameters_global ep_ref ON e.document_id = ep_ref.document_id AND e.element_id = ep_ref.element_id 
    AND ep_ref.parameter_id = (SELECT parameter_id FROM parameter_catalog_global WHERE parameter_name = 'Material' LIMIT 1)
-- 2. Join to the Material Element's 'Name' parameter
JOIN element_parameters_global mat_name ON ep_ref.document_id = mat_name.document_id AND ep_ref.value_int = mat_name.element_id
    AND mat_name.parameter_id = (SELECT parameter_id FROM parameter_catalog_global WHERE parameter_name = 'Name' LIMIT 1)
WHERE e.category_name = '{CATEGORY_NAME}'
LIMIT 100
```

## 3. Best Practices for Developers
- **Token Efficiency**: Material joins can be expensive. Always use `DISTINCT` or `GROUP BY` when performing takeoffs to minimize the result size.
- **Parameter Lookup**: Use `(SELECT parameter_id FROM parameter_catalog_global WHERE parameter_name = '...' LIMIT 1)` instead of hardcoded negative IDs to ensure compatibility across different snapshot versions.
- **Scoping**: Always include `document_id` in joins to prevent cross-model data contamination.

## 4. When to use this skill
- When "Pipe Material" or "Wall Material" parameters return empty strings or numeric IDs.
- For specialized takeoffs where the exact physical substance (e.g., "Concrete - Cast-in-Place Gray") is required.

## 5. When NOT to use this skill
- When the `type_name` or `family_name` is sufficient for the user's request.
- When querying non-physical elements (e.g., Views, Sheets, Schedules).
