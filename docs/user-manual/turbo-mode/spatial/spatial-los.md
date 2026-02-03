# spatial_los

Check line of sight between two points or elements.

## Overview

`spatial_los` performs ray-casting between two points to detect obstructions. It uses ray-AABB (axis-aligned bounding box) intersection to identify elements blocking the line of sight.

## When to Use

- Security camera coverage
- Sensor visibility checks
- Signage visibility
- View corridor analysis

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `start_element_id` | number | * | - | Start element (uses centroid) |
| `start_point` | object | * | - | Start point {x, y, z} in feet |
| `end_element_id` | number | * | - | End element (uses centroid) |
| `end_point` | object | * | - | End point {x, y, z} in feet |
| `mode` | enum | No | `3d` | "3d" or "2d" (plan view) |
| `exclude_element_ids` | number[] | No | - | Elements to ignore |
| `exclude_categories` | string[] | No | - | Categories to ignore |
| `max_obstructions` | number | No | 20 | Maximum obstructions to return |

*Must provide start (element or point) and end (element or point).

## Response Format

```json
{
  "start": {
    "element_id": 123456,
    "point": { "x": 50.0, "y": 100.0, "z": 8.0 }
  },
  "end": {
    "element_id": 234567,
    "point": { "x": 75.0, "y": 100.0, "z": 3.0 }
  },
  "has_line_of_sight": false,
  "distance_ft": 25.0,
  "obstructions": [
    {
      "element_id": 345678,
      "category_name": "Walls",
      "type_name": "Basic Wall",
      "intersection_point": { "x": 60.0, "y": 100.0, "z": 5.0 },
      "distance_from_start_ft": 10.0
    }
  ],
  "mode": "3d",
  "execution_time_ms": 85
}
```

## Examples

### Can Sensor See This Door?

```json
{
  "tool": "spatial_los",
  "params": {
    "start_element_id": 123456,
    "end_element_id": 234567
  }
}
```

### Check Point-to-Point Visibility

```json
{
  "tool": "spatial_los",
  "params": {
    "start_point": { "x": 50, "y": 100, "z": 8 },
    "end_point": { "x": 75, "y": 100, "z": 8 },
    "mode": "2d"
  }
}
```

### Exclude Certain Elements

```json
{
  "tool": "spatial_los",
  "params": {
    "start_element_id": 123456,
    "end_element_id": 234567,
    "exclude_categories": ["Air Terminals", "Lighting Fixtures"]
  }
}
```

### Camera to Multiple Points

```javascript
const cameraId = 123456;
const targets = [234567, 345678, 456789];

for (const targetId of targets) {
  const los = await spatial_los({
    start_element_id: cameraId,
    end_element_id: targetId
  });

  if (los.has_line_of_sight) {
    console.log(`Camera can see target ${targetId}`);
  } else {
    console.log(`Target ${targetId} blocked by ${los.obstructions[0].type_name}`);
  }
}
```

## 2D vs 3D Mode

### 3D Mode (default)

Full spatial ray test:
- Considers height differences
- Detects overhead obstructions
- More accurate for vertical spaces

### 2D Mode

Plan-view only:
- Ignores Z-axis
- Faster computation
- Good for floor plan analysis

## Obstructions

When line of sight is blocked, `obstructions` lists what's in the way:

```json
{
  "obstructions": [
    {
      "element_id": 345678,
      "category_name": "Walls",
      "type_name": "Basic Wall",
      "intersection_point": { "x": 60.0, "y": 100.0, "z": 5.0 },
      "distance_from_start_ft": 10.0
    }
  ]
}
```

Obstructions are sorted by distance from start.

## Use Cases

### Security Camera Coverage

```javascript
// Get all cameras
const cameras = await snapshot_query({
  sql: "SELECT element_id FROM elements WHERE category_name = 'Security Devices'"
});

// Get all entry points
const entries = await snapshot_query({
  sql: "SELECT element_id FROM elements WHERE type_name LIKE '%Entry%'"
});

// Check coverage
const coverage = [];
for (const camera of cameras.rows) {
  for (const entry of entries.rows) {
    const los = await spatial_los({
      start_element_id: camera.element_id,
      end_element_id: entry.element_id
    });

    if (los.has_line_of_sight) {
      coverage.push({ camera: camera.element_id, entry: entry.element_id });
    }
  }
}
```

### Exit Sign Visibility

```javascript
// Check if exit signs are visible from room centers
const rooms = await snapshot_query({
  sql: "SELECT element_id, location_x, location_y, location_z FROM elements WHERE category_name = 'Rooms'"
});

const exitSigns = await snapshot_query({
  sql: "SELECT element_id FROM elements WHERE type_name LIKE '%Exit%'"
});

for (const room of rooms.rows) {
  let visible = false;
  for (const sign of exitSigns.rows) {
    const los = await spatial_los({
      start_point: {
        x: room.location_x,
        y: room.location_y,
        z: room.location_z + 5 // Eye level
      },
      end_element_id: sign.element_id
    });

    if (los.has_line_of_sight) {
      visible = true;
      break;
    }
  }

  if (!visible) {
    console.log(`Room ${room.element_id} has no visible exit sign`);
  }
}
```

## Performance

| Ray Length | Typical Response |
|------------|------------------|
| < 50 ft | 50-100ms |
| 50-200 ft | 100-200ms |
| > 200 ft | 200-300ms |

Excluding categories significantly speeds up checks.

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `NO_SNAPSHOT` | No snapshot exists | Run `snapshot_extract` |
| `ELEMENT_NOT_FOUND` | Invalid element ID | Check element exists |
| `INVALID_POINT` | Missing coordinates | Provide complete point |

## Related Tools

- [spatial_near](spatial-near.md) - Proximity queries
- [spatial_path](spatial-path.md) - Path accessibility
- [spatial_describe](spatial-describe.md) - Full element context

## Agent Skill Hints

1. **Exclude irrelevant categories** - Speed up checks
2. **Use 2D for floor plans** - Faster for horizontal analysis
3. **Check first obstruction** - Usually the one to address
4. **Batch similar checks** - Multiple LOS from same source
5. **Combine with near** - Find elements then check visibility
