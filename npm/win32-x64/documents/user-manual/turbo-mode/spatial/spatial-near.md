# spatial_near

Find elements within a specified distance of a reference element or point.

## Overview

`spatial_near` performs proximity searches using R-Tree indexed spatial queries. It returns elements sorted by distance with full element details.

## When to Use

- Find equipment near specific elements
- Check spacing requirements
- Locate nearby fire safety equipment
- Identify elements in a radius

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `reference_element_id` | number | * | - | Element ID to measure from |
| `reference_point` | object | * | - | Point {x, y, z?} in feet |
| `distance_feet` | number | No | 10 | Maximum distance in feet |
| `category_filter` | string[] | No | - | Only return these categories |
| `limit` | number | No | 100 | Maximum results (1-1000) |

*One of `reference_element_id` or `reference_point` is required.

## Response Format

```json
{
  "reference": {
    "element_id": 123456,
    "category_name": "Doors",
    "type_name": "Exit Door",
    "location": { "x": 50.0, "y": 100.0, "z": 0.0 }
  },
  "nearby_elements": [
    {
      "element_id": 234567,
      "category_name": "Fire Protection",
      "type_name": "Fire Extinguisher",
      "distance_ft": 12.5,
      "location": { "x": 55.0, "y": 105.0, "z": 0.0 }
    }
  ],
  "total_found": 15,
  "search_radius_ft": 75,
  "execution_time_ms": 85
}
```

## Examples

### Find Fire Extinguishers Near Exits

```json
{
  "tool": "spatial_near",
  "params": {
    "reference_element_id": 123456,
    "distance_feet": 75,
    "category_filter": ["Fire Protection"]
  }
}
```

### Find All Elements Near a Point

```json
{
  "tool": "spatial_near",
  "params": {
    "reference_point": { "x": 100, "y": 200, "z": 0 },
    "distance_feet": 25
  }
}
```

### Find Electrical Panels Near Water Sources

```json
{
  "tool": "spatial_near",
  "params": {
    "reference_element_id": 345678,
    "distance_feet": 20,
    "category_filter": ["Electrical Equipment"]
  }
}
```

## Use Cases

### Code Compliance

Check fire extinguisher spacing:
```javascript
// Get all exit doors
const exits = await snapshot_query({
  sql: "SELECT element_id FROM elements WHERE type_name LIKE '%Exit%'"
});

// Check each exit has nearby fire protection
for (const exit of exits.rows) {
  const nearby = await spatial_near({
    reference_element_id: exit.element_id,
    distance_feet: 75,
    category_filter: ["Fire Protection"]
  });

  if (nearby.total_found === 0) {
    console.log(`Exit ${exit.element_id} has no fire protection within 75ft`);
  }
}
```

### Safety Check

Find electrical panels near plumbing:
```javascript
const panels = await snapshot_query({
  sql: "SELECT element_id FROM elements WHERE category_name = 'Electrical Equipment'"
});

for (const panel of panels.rows) {
  const water = await spatial_near({
    reference_element_id: panel.element_id,
    distance_feet: 10,
    category_filter: ["Plumbing Fixtures", "Pipes"]
  });

  if (water.total_found > 0) {
    console.log(`Warning: Panel ${panel.element_id} near water source`);
  }
}
```

## Distance Calculation

Distance is calculated as 3D Euclidean distance between element centroids:

```
distance = sqrt((x2-x1)² + (y2-y1)² + (z2-z1)²)
```

If only 2D (plan) distance is needed, use `spatial_los` with `mode: "2d"` or filter by level first.

## Performance

| Search Radius | Typical Response |
|---------------|------------------|
| < 10 ft | 30-50ms |
| 10-50 ft | 50-100ms |
| 50-200 ft | 100-200ms |
| > 200 ft | 200-500ms |

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `NO_SNAPSHOT` | No snapshot exists | Run `snapshot_extract` |
| `ELEMENT_NOT_FOUND` | Invalid element ID | Check element exists |
| `INVALID_POINT` | Missing x/y coordinates | Provide valid point |

## Related Tools

- [spatial_inside](spatial-inside.md) - Containment queries
- [spatial_los](spatial-los.md) - Line of sight with distance
- [spatial_describe](spatial-describe.md) - Full spatial context

## Agent Skill Hints

1. **Use category filters** - Reduce result size
2. **Start with reasonable radius** - 10-50 ft typically
3. **Check total_found** - May need to paginate
4. **Combine with queries** - Filter elements first with SQL
5. **Consider 2D vs 3D** - Use spatial_los for plan-view only
