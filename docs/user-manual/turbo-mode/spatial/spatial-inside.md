# spatial_inside

Find elements contained within a room, space, or bounding region.

## Overview

`spatial_inside` queries element containment. For rooms, it uses Revit room associations (the `room_id` field). For custom regions, it uses bounding box intersection.

## When to Use

- List furniture in a specific room
- Find MEP equipment in a zone
- Query elements in a custom region
- Audit room contents

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `room_id` | number | * | - | Room element ID |
| `room_name` | string | * | - | Room name (partial match) |
| `bounding_box` | object | * | - | Custom region {min_x, max_x, ...} |
| `category_filter` | string[] | No | - | Only return these categories |
| `include_partial` | boolean | No | `false` | Include partially contained elements |
| `limit` | number | No | 100 | Maximum results (1-1000) |

*One of `room_id`, `room_name`, or `bounding_box` is required.

## Response Format

```json
{
  "container": {
    "type": "room",
    "room_id": 123456,
    "room_name": "Conference Room 101",
    "room_number": "101",
    "level": "Level 1"
  },
  "elements": [
    {
      "element_id": 234567,
      "category_name": "Furniture",
      "type_name": "Conference Table",
      "family_name": "Table-Rectangular"
    }
  ],
  "by_category": {
    "Furniture": 8,
    "Lighting Fixtures": 4,
    "Mechanical Equipment": 2
  },
  "total_found": 14,
  "execution_time_ms": 95
}
```

## Examples

### Find Elements in Room by ID

```json
{
  "tool": "spatial_inside",
  "params": {
    "room_id": 123456
  }
}
```

### Find Elements by Room Name

```json
{
  "tool": "spatial_inside",
  "params": {
    "room_name": "Conference Room",
    "category_filter": ["Furniture", "Lighting Fixtures"]
  }
}
```

### Find Elements in Custom Region

```json
{
  "tool": "spatial_inside",
  "params": {
    "bounding_box": {
      "min_x": 0,
      "max_x": 200,
      "min_y": 100,
      "max_y": 300,
      "min_z": 0,
      "max_z": 15
    }
  }
}
```

### Find MEP Equipment in Data Center

```json
{
  "tool": "spatial_inside",
  "params": {
    "room_name": "Data Center",
    "category_filter": ["Mechanical Equipment", "Electrical Equipment"]
  }
}
```

## Use Cases

### Room Inventory

```javascript
// Get all rooms
const rooms = await snapshot_query({
  sql: "SELECT DISTINCT room_id, room_name FROM elements WHERE room_id IS NOT NULL"
});

// Inventory each room
for (const room of rooms.rows) {
  const contents = await spatial_inside({
    room_id: room.room_id
  });

  console.log(`${room.room_name}: ${contents.total_found} elements`);
  console.log(contents.by_category);
}
```

### Zone Analysis

Find all elements in the north wing:
```json
{
  "tool": "spatial_inside",
  "params": {
    "bounding_box": {
      "min_x": 0,
      "max_x": 500,
      "min_y": 200,
      "max_y": 400
    }
  }
}
```

### Equipment Audit

```javascript
const dataCenter = await spatial_inside({
  room_name: "Data Center",
  category_filter: ["Mechanical Equipment"]
});

// Check for required equipment
const hasAC = dataCenter.elements.some(e =>
  e.type_name.includes("Air Conditioning")
);
```

## Room vs Bounding Box

### Room-Based Query

Uses Revit's room association:
- More accurate (follows room boundaries)
- Only works for elements with room association
- Respects room bounds computed by Revit

### Bounding Box Query

Uses geometric intersection:
- Works for any region
- May include elements partially outside
- Use `include_partial: false` for strict containment

## Response: by_category

The `by_category` field provides a quick count:

```json
{
  "by_category": {
    "Furniture": 8,
    "Lighting Fixtures": 4,
    "Mechanical Equipment": 2
  }
}
```

Use this for quick audits without processing all elements.

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `NO_SNAPSHOT` | No snapshot exists | Run `snapshot_extract` |
| `ROOM_NOT_FOUND` | Invalid room ID/name | Check room exists |
| `INVALID_BOUNDING_BOX` | Missing min/max values | Provide complete bounds |

## Related Tools

- [spatial_near](spatial-near.md) - Distance-based queries
- [spatial_related](spatial-related.md) - Containment relationships
- [spatial_describe](spatial-describe.md) - Full spatial context

## Agent Skill Hints

1. **Use room_name for flexibility** - Partial match is forgiving
2. **Check by_category first** - Quick overview before details
3. **Use category filters** - Focus on relevant elements
4. **Combine with spatial_near** - Find elements near room contents
5. **Handle multiple rooms** - room_name may match multiple rooms
