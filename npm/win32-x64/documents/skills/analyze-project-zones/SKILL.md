---
name: analyze-project-zones
description: Dynamic spatial analysis skill for Revit Snapshots. Segregates project elements into architectural zones (East/West/Center) based on the model's actual bounding box extents rather than hardcoded coordinates.
---

# Skill: Dynamic Spatial Zone Analysis

This skill provides a robust framework for segregating project elements into distinct architectural zones. It is designed to be model-agnostic, calculating boundaries dynamically based on the specific extents of the loaded snapshot.

## 1. Core Logic & Assumptions

### Dynamic Extents
The skill calculates the project boundaries by querying the minimum and maximum X-coordinates of key spatial categories (`Rooms`, `Walls`, `Pipes`). This ensures the analysis works regardless of the model origin (Project Base Point) or project scale.

### Zone Segmentation
The project width is divided into three segments:
- **Zone 1 (East)**: The primary wing occupying the upper 40% of the X-range.
- **Zone 2 (West)**: The primary wing occupying the lower 40% of the X-range.
- **Center/Gap Zone**: The middle 20% transition area or courtyard void.

## 2. Standard SQL Template

```sql
WITH ProjectExtents AS (
    SELECT 
        document_id,
        MIN(location_x) as min_x,
        MAX(location_x) as max_x
    FROM elements_global
    WHERE category_name IN ('Rooms', 'Walls', 'Pipes')
    GROUP BY document_id
)
SELECT 
    e.document_id,
    CASE 
        WHEN e.location_x >= pe.max_x - ((pe.max_x - pe.min_x) * 0.4) THEN 'Zone 1 (East)'
        WHEN e.location_x <= pe.min_x + ((pe.max_x - pe.min_x) * 0.4) THEN 'Zone 2 (West)'
        ELSE '⚠️ Center Zone / Gap'
    END as ProjectZone,
    COUNT(*) as Count
FROM elements_global e
JOIN ProjectExtents pe ON e.document_id = pe.document_id
WHERE e.category_name = '{CATEGORY_NAME}'
GROUP BY ALL
ORDER BY e.document_id, ProjectZone
```

## 3. Best Practices for Developers
- **Category Selection**: When calculating extents, use stable categories like `Walls` or `Rooms` to define the "building" shell accurately.
- **Threshold Adjustment**: If a project has significantly asymmetrical wings, adjust the `0.4` (40%) threshold in the SQL `CASE` statement.
- **Global Scoping**: Always `JOIN` on `document_id` to ensure extents are calculated per individual model in multi-model snapshots.

## 4. When to use this skill
- When reporting quantities (e.g., "Length of pipe") by project wing or phase.
- When identifying misplaced elements outside of the expected building wings.

## 5. When NOT to use this skill
- For vertical segregation (Levels). Use the `level_name` or `level_id` columns instead.
- For precise room-based filtering. Use a spatial join or room parameters if available.
