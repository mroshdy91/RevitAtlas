# spatial_path

Analyze spatial connectivity and path accessibility between elements.

## Overview

`spatial_path` computes spatial metrics between two elements or points. It calculates distances, identifies elements along the path corridor, and finds doors/openings between rooms.

## When to Use

- Egress distance calculations
- Path accessibility analysis
- Identify elements between points
- Door/opening detection

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `start_element_id` | number | * | - | Start element |
| `start_point` | object | * | - | Start point {x, y, z} in feet |
| `end_element_id` | number | * | - | End element |
| `end_point` | object | * | - | End point {x, y, z} in feet |
| `corridor_width_ft` | number | No | 5 | Width of path corridor to analyze |
| `category_filter` | string[] | No | - | Only include these categories |
| `include_elements_along_path` | boolean | No | `true` | Include elements in corridor |
| `include_doors` | boolean | No | `true` | Include doors/openings |
| `limit` | number | No | 50 | Maximum elements (1-500) |

*Must provide start (element or point) and end (element or point).

## Response Format

```json
{
  "start": {
    "element_id": 123456,
    "point": { "x": 50.0, "y": 100.0, "z": 0.0 },
    "room_name": "Office 101"
  },
  "end": {
    "element_id": 234567,
    "point": { "x": 150.0, "y": 100.0, "z": 0.0 },
    "room_name": "Exit Stair"
  },
  "distances": {
    "direct_ft": 100.0,
    "manhattan_ft": 120.0,
    "vertical_ft": 0.0
  },
  "elements_along_path": [
    {
      "element_id": 345678,
      "category_name": "Furniture",
      "type_name": "Desk",
      "distance_from_path_ft": 2.5
    }
  ],
  "doors": [
    {
      "element_id": 456789,
      "type_name": "Single-Flush",
      "from_room": "Office 101",
      "to_room": "Corridor"
    }
  ],
  "rooms_traversed": ["Office 101", "Corridor", "Exit Stair"],
  "total_doors": 2,
  "execution_time_ms": 120
}
```

## Distance Calculations

| Type | Description |
|------|-------------|
| `direct_ft` | Euclidean (straight-line) distance |
| `manhattan_ft` | Axis-aligned walking distance |
| `vertical_ft` | Vertical separation (floor-to-floor) |

## Examples

### Distance from Office to Exit

```json
{
  "tool": "spatial_path",
  "params": {
    "start_element_id": 123456,
    "end_element_id": 234567
  }
}
```

### Egress Path Analysis

```json
{
  "tool": "spatial_path",
  "params": {
    "start_point": { "x": 50, "y": 100, "z": 0 },
    "end_element_id": 234567,
    "include_doors": true,
    "include_elements_along_path": true
  }
}
```

### Find Furniture Along Path

```json
{
  "tool": "spatial_path",
  "params": {
    "start_element_id": 123456,
    "end_element_id": 234567,
    "category_filter": ["Furniture"],
    "corridor_width_ft": 3
  }
}
```

### Check Vertical Separation

```json
{
  "tool": "spatial_path",
  "params": {
    "start_element_id": 123456,
    "end_element_id": 234567
  }
}
// Response includes: distances.vertical_ft
```

## Use Cases

### Egress Distance Compliance

```javascript
// Get all exit points
const exits = await snapshot_query({
  sql: "SELECT element_id FROM elements WHERE type_name LIKE '%Exit%'"
});

// Get all workstations
const workstations = await snapshot_query({
  sql: "SELECT element_id FROM elements WHERE category_name = 'Furniture' AND type_name LIKE '%Desk%'"
});

// Check each workstation has exit within 250ft
for (const ws of workstations.rows) {
  let minDistance = Infinity;

  for (const exit of exits.rows) {
    const path = await spatial_path({
      start_element_id: ws.element_id,
      end_element_id: exit.element_id
    });

    minDistance = Math.min(minDistance, path.distances.direct_ft);
  }

  if (minDistance > 250) {
    console.log(`Workstation ${ws.element_id} is ${minDistance}ft from nearest exit`);
  }
}
```

### Door Count Between Rooms

```javascript
const path = await spatial_path({
  start_element_id: officeId,
  end_element_id: exitId,
  include_doors: true
});

console.log(`Path traverses ${path.total_doors} doors`);
console.log(`Rooms: ${path.rooms_traversed.join(' → ')}`);
```

### Obstacle Detection

```javascript
const path = await spatial_path({
  start_element_id: startId,
  end_element_id: endId,
  category_filter: ["Furniture", "Mechanical Equipment"],
  corridor_width_ft": 4
});

if (path.elements_along_path.length > 0) {
  console.log("Obstacles in path corridor:");
  for (const el of path.elements_along_path) {
    console.log(`  ${el.type_name} at ${el.distance_from_path_ft}ft from centerline`);
  }
}
```

## Corridor Width

The `corridor_width_ft` parameter defines the analysis zone:

```
        ←── corridor_width_ft ──→
        ┌───────────────────────┐
Start ──┼───────────────────────┼── End
        └───────────────────────┘
```

Elements within this zone are included in `elements_along_path`.

## Rooms Traversed

The `rooms_traversed` field shows the sequence of rooms:

```json
{
  "rooms_traversed": ["Office 101", "Corridor", "Lobby", "Exit Stair"]
}
```

Use this for:
- Understanding path routing
- Identifying bottlenecks
- Security zone tracking

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `NO_SNAPSHOT` | No snapshot exists | Run `snapshot_extract` |
| `ELEMENT_NOT_FOUND` | Invalid element ID | Check element exists |
| `INVALID_POINT` | Missing coordinates | Provide complete point |

## Related Tools

- [spatial_los](spatial-los.md) - Line of sight (no obstructions)
- [spatial_near](spatial-near.md) - Proximity queries
- [spatial_inside](spatial-inside.md) - Room containment

## Agent Skill Hints

1. **Use for egress** - Check exit distances
2. **Count doors** - Important for accessibility
3. **Check vertical_ft** - Identify multi-floor paths
4. **Adjust corridor_width** - Wider for more context
5. **Filter categories** - Focus on relevant obstacles
