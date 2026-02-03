# spatial_related

Query spatial relationships between elements including hosting, containment, and vertical alignment.

## Overview

`spatial_related` queries the pre-computed relationship graph (Scene Graph) stored during snapshot extraction. Relationships include hosting, room containment, and vertical stacking.

## When to Use

- Find elements hosted by a wall
- Query room contents
- Find elements above/below
- Trace hosting chains

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `element_id` | number | No | - | Find relationships for this element |
| `relationship_types` | string[] | No | - | Filter: "HOSTS", "INSIDE", "ABOVE", etc. |
| `direction` | enum | No | `both` | "outgoing", "incoming", or "both" |
| `target_category_filter` | string[] | No | - | Filter target categories |
| `min_confidence` | number | No | 0.5 | Minimum confidence (0-1) |
| `include_element_details` | boolean | No | `true` | Include type names |
| `limit` | number | No | 100 | Maximum results (1-1000) |

## Response Format

```json
{
  "element": {
    "element_id": 123456,
    "category_name": "Walls",
    "type_name": "Basic Wall"
  },
  "relationships": [
    {
      "relationship_type": "HOSTS",
      "target": {
        "element_id": 234567,
        "category_name": "Doors",
        "type_name": "Single-Flush"
      },
      "confidence": 1.0,
      "direction": "outgoing"
    }
  ],
  "by_type": {
    "HOSTS": 3,
    "HOSTED_BY": 0
  },
  "total_found": 3,
  "execution_time_ms": 75
}
```

## Relationship Types

| Type | Inverse | Description |
|------|---------|-------------|
| `HOSTS` | `HOSTED_BY` | Wall hosts door/window |
| `CONTAINS` | `INSIDE` | Room contains furniture |
| `ABOVE` | `BELOW` | Vertical stacking |
| `DIRECTLY_ABOVE` | `DIRECTLY_BELOW` | Vertically aligned |

## Examples

### What Does This Wall Host?

```json
{
  "tool": "spatial_related",
  "params": {
    "element_id": 123456,
    "relationship_types": ["HOSTS"]
  }
}
```

### What Is Hosted By This Wall?

```json
{
  "tool": "spatial_related",
  "params": {
    "element_id": 123456,
    "relationship_types": ["HOSTS"],
    "direction": "outgoing"
  }
}
```

### What Room Contains This Element?

```json
{
  "tool": "spatial_related",
  "params": {
    "element_id": 234567,
    "relationship_types": ["INSIDE"]
  }
}
```

### What's Directly Above This Floor?

```json
{
  "tool": "spatial_related",
  "params": {
    "element_id": 345678,
    "relationship_types": ["DIRECTLY_ABOVE"]
  }
}
```

### Find All Room Containment

```json
{
  "tool": "spatial_related",
  "params": {
    "relationship_types": ["CONTAINS"],
    "target_category_filter": ["Furniture"]
  }
}
```

## Direction Explained

| Direction | Meaning | Example |
|-----------|---------|---------|
| `outgoing` | Element is source | Wall HOSTS doors |
| `incoming` | Element is target | Door HOSTED_BY wall |
| `both` | Either direction | All relationships |

## Confidence Scores

Relationships have confidence scores (0-1):

| Score | Meaning |
|-------|---------|
| 1.0 | Definite (Revit API confirms) |
| 0.8-0.99 | High confidence (spatial computation) |
| 0.5-0.79 | Moderate (heuristic-based) |
| < 0.5 | Low (filtered out by default) |

## Use Cases

### Trace Hosting Chain

```javascript
// Find what hosts a fixture
const hosting = await spatial_related({
  element_id: fixtureId,
  relationship_types: ["HOSTED_BY"]
});

// The fixture is hosted by a wall
const wall = hosting.relationships[0].target;

// Find what the wall hosts
const wallHosts = await spatial_related({
  element_id: wall.element_id,
  relationship_types: ["HOSTS"]
});

console.log(`Wall ${wall.element_id} hosts ${wallHosts.total_found} elements`);
```

### Room Contents

```javascript
const roomContents = await spatial_related({
  element_id: roomId,
  relationship_types: ["CONTAINS"]
});

// Group by category
const byCategory = {};
for (const rel of roomContents.relationships) {
  const cat = rel.target.category_name;
  byCategory[cat] = (byCategory[cat] || 0) + 1;
}
```

### Vertical Stack Analysis

```javascript
const above = await spatial_related({
  element_id: floorId,
  relationship_types: ["DIRECTLY_ABOVE"]
});

console.log(`Elements directly above: ${above.total_found}`);
```

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `NO_SNAPSHOT` | No snapshot exists | Run `snapshot_extract` |
| `ELEMENT_NOT_FOUND` | Invalid element ID | Check element exists |

## Related Tools

- [spatial_inside](spatial-inside.md) - Room containment queries
- [spatial_flow](spatial-flow.md) - MEP connections
- [spatial_describe](spatial-describe.md) - Full spatial context

## Agent Skill Hints

1. **Check direction** - Use "outgoing" for clear semantics
2. **Filter by type** - Focus on specific relationships
3. **Use min_confidence** - Filter uncertain relationships
4. **Combine with describe** - Get full element context
5. **Trace chains** - Follow hosting relationships
