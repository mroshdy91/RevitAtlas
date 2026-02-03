# spatial_describe

Generate a natural language description of an element's spatial context.

## Overview

`spatial_describe` produces a rich textual description of an element's location, relationships, nearby elements, clashes, clearances, and MEP connectivity. It's the go-to tool for understanding an element's full spatial context.

## When to Use

- Get comprehensive element context
- Understand element location and relationships
- Quick spatial summary before detailed analysis
- Generate human-readable reports

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `element_id` | number | Yes | - | Element to describe |
| `include_nearby` | boolean | No | `true` | Include nearby element summary |
| `include_relationships` | boolean | No | `true` | Include spatial relationships |
| `include_clashes` | boolean | No | `true` | Include clash information |
| `include_clearance` | boolean | No | `true` | Include clearance status |
| `include_mep_flow` | boolean | No | `true` | Include MEP connectivity |
| `nearby_radius_ft` | number | No | 30 | Radius for nearby search (1-200) |

## Response Format

```json
{
  "element": {
    "element_id": 123456,
    "category_name": "Mechanical Equipment",
    "type_name": "Air Handler Unit",
    "family_name": "AHU-Horizontal"
  },
  "location": {
    "level_name": "Level 1",
    "room_name": "Mechanical Room 101",
    "coordinates": { "x": 50.0, "y": 100.0, "z": 0.0 },
    "bounding_box": {
      "min": { "x": 45.0, "y": 95.0, "z": 0.0 },
      "max": { "x": 55.0, "y": 105.0, "z": 8.0 }
    }
  },
  "nearby_summary": {
    "total_elements": 25,
    "by_category": {
      "Ducts": 8,
      "Pipes": 5,
      "Electrical Equipment": 2
    },
    "landmarks": ["Exterior Wall to West", "Column Grid A-5"]
  },
  "relationships": [
    {
      "type": "HOSTS",
      "target": "Duct Connection",
      "count": 4
    }
  ],
  "clashes": {
    "total": 0,
    "critical": 0,
    "major": 0
  },
  "clearance": {
    "status": "compliant",
    "violations": [],
    "notes": "All service clearances met"
  },
  "mep_flow": {
    "system_name": "Supply Air 1",
    "connections": {
      "upstream": 0,
      "downstream": 12
    },
    "terminals": 6
  },
  "description": "Air Handler Unit 'AHU-01' is located in Mechanical Room 101 on Level 1, near the exterior wall to the west. It serves 6 air terminals via 12 duct connections on the Supply Air 1 system. No clashes or clearance violations detected.",
  "execution_time_ms": 250
}
```

## Examples

### Full Context

```json
{
  "tool": "spatial_describe",
  "params": {
    "element_id": 123456
  }
}
```

### Location Only

```json
{
  "tool": "spatial_describe",
  "params": {
    "element_id": 123456,
    "include_nearby": false,
    "include_relationships": false,
    "include_clashes": false,
    "include_clearance": false,
    "include_mep_flow": false
  }
}
```

### Focus on Issues

```json
{
  "tool": "spatial_describe",
  "params": {
    "element_id": 123456,
    "include_nearby": false,
    "include_clashes": true,
    "include_clearance": true
  }
}
```

### Wide Area Context

```json
{
  "tool": "spatial_describe",
  "params": {
    "element_id": 123456,
    "nearby_radius_ft": 100
  }
}
```

## Response Sections

### location

Core location information:
- `level_name`: Which level
- `room_name`: Containing room
- `coordinates`: Centroid XYZ
- `bounding_box`: Full extent

### nearby_summary

Elements within search radius:
- `total_elements`: Count
- `by_category`: Breakdown
- `landmarks`: Reference points (walls, columns)

### relationships

Spatial relationships:
- Hosting relationships
- Room containment
- Vertical stacking

### clashes

Clash status:
- `total`: Total clashes involving element
- `critical`/`major`: By severity

### clearance

Code compliance:
- `status`: "compliant" or "violations"
- `violations`: List of issues
- `notes`: Additional context

### mep_flow

MEP connectivity (if applicable):
- `system_name`: Connected system
- `connections`: Upstream/downstream counts
- `terminals`: Terminal device count

### description

Human-readable summary combining all data.

## Use Cases

### Quick Element Check

```javascript
const context = await spatial_describe({
  element_id: elementId
});

console.log(context.description);
// "Air Handler Unit 'AHU-01' is located in Mechanical Room 101..."
```

### Issue Detection

```javascript
const context = await spatial_describe({
  element_id: elementId,
  include_clashes: true,
  include_clearance: true
});

if (context.clashes.critical > 0) {
  console.log(`Critical clashes: ${context.clashes.critical}`);
}

if (context.clearance.status !== "compliant") {
  console.log(`Clearance issues: ${context.clearance.violations.length}`);
}
```

### Report Generation

```javascript
const elements = [123456, 234567, 345678];
const report = [];

for (const id of elements) {
  const context = await spatial_describe({ element_id: id });
  report.push({
    element: context.element.type_name,
    location: `${context.location.room_name} on ${context.location.level_name}`,
    issues: context.clashes.total + context.clearance.violations.length
  });
}
```

### MEP Analysis

```javascript
const equipment = await spatial_describe({
  element_id: equipmentId,
  include_mep_flow: true
});

if (equipment.mep_flow) {
  console.log(`System: ${equipment.mep_flow.system_name}`);
  console.log(`Serves ${equipment.mep_flow.terminals} terminals`);
}
```

## Performance

Response time depends on options:

| Options | Typical Response |
|---------|------------------|
| All defaults | 200-500ms |
| Location only | 50-100ms |
| No nearby | 100-200ms |
| Large radius (100ft) | 300-600ms |

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `NO_SNAPSHOT` | No snapshot exists | Run `snapshot_extract` |
| `ELEMENT_NOT_FOUND` | Invalid element ID | Check element exists |

## Related Tools

- [spatial_near](spatial-near.md) - Detailed proximity
- [spatial_clash](spatial-clash.md) - Detailed clashes
- [spatial_clearance](spatial-clearance.md) - Detailed clearances
- [spatial_flow](spatial-flow.md) - Detailed MEP flow

## Agent Skill Hints

1. **Use as starting point** - Get overview before specific tools
2. **Read the description** - Natural language summary
3. **Check for issues** - Quick clash/clearance detection
4. **Disable unused sections** - Faster response
5. **Adjust nearby_radius** - Balance context vs speed
