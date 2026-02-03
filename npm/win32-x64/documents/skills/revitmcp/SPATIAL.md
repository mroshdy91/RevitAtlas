# Spatial Query Templates

Patterns for querying `geometry.parquet` in RevitMCP.

## 1. Distance (K-Nearest Neighbors)
Find the 5 closest elements to a point (10, 20, 0).

```sql
SELECT e.element_id, e.category_name,
       ST_Distance(
           ST_MakePoint(g.centroid_x, g.centroid_y, g.centroid_z),
           ST_MakePoint(10, 20, 0)
       ) as dist
FROM elements e
JOIN geometry g ON e.element_id = g.element_id
ORDER BY dist ASC
LIMIT 5
```

## 2. Containment (Bounding Box)
Find elements strictly inside a room volume (0,0 to 50,50).

```sql
SELECT e.element_id, e.family_name
FROM elements e
JOIN geometry g ON e.element_id = g.element_id
WHERE g.bbox_min_x >= 0 AND g.bbox_max_x <= 50
  AND g.bbox_min_y >= 0 AND g.bbox_max_y <= 50
```

## 3. Density (Spatial Aggregation)
Count elements per 10ft grid cell (using `spatial_hash`).

```sql
SELECT g.spatial_hash, COUNT(*) as count
FROM geometry g
GROUP BY g.spatial_hash
ORDER BY count DESC
```
