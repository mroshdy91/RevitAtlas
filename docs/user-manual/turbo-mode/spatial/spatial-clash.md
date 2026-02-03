# spatial_clash

Query pre-computed clashes and interferences between elements.

## Overview

`spatial_clash` queries clash detection results computed during snapshot extraction. Clashes are detected using spatial hash broad-phase and bounding box narrow-phase collision detection.

## When to Use

- QA workflows to find model issues
- Identify MEP/structural conflicts
- Find clearance violations
- Prioritize coordination issues

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `severity_filter` | string[] | No | - | Filter: "Critical", "Major", "Minor" |
| `clash_type_filter` | string[] | No | - | Filter: "Hard", "Clearance" |
| `category_filter` | string[] | No | - | Categories to include |
| `category_pair` | object | No | - | Specific {category_a, category_b} |
| `element_id` | number | No | - | Clashes involving this element |
| `include_element_details` | boolean | No | `true` | Include type names |
| `limit` | number | No | 100 | Maximum results (1-1000) |

## Response Format

```json
{
  "clashes": [
    {
      "clash_id": 1,
      "element_a": {
        "element_id": 123456,
        "category_name": "Ducts",
        "type_name": "Rectangular Duct"
      },
      "element_b": {
        "element_id": 234567,
        "category_name": "Structural Framing",
        "type_name": "W12x26"
      },
      "clash_type": "Hard",
      "severity": "Critical",
      "overlap_volume_cf": 0.5,
      "intersection_point": { "x": 50.0, "y": 100.0, "z": 12.0 }
    }
  ],
  "summary": {
    "total_clashes": 45,
    "by_severity": { "Critical": 5, "Major": 15, "Minor": 25 },
    "by_type": { "Hard": 30, "Clearance": 15 },
    "top_categories": [
      { "pair": "Ducts vs Structural Framing", "count": 12 }
    ]
  },
  "execution_time_ms": 65
}
```

## Examples

### Get Critical Clashes

```json
{
  "tool": "spatial_clash",
  "params": {
    "severity_filter": ["Critical"]
  }
}
```

### Duct vs Structural Clashes

```json
{
  "tool": "spatial_clash",
  "params": {
    "category_pair": {
      "category_a": "Ducts",
      "category_b": "Structural Framing"
    }
  }
}
```

### Clashes Involving Specific Element

```json
{
  "tool": "spatial_clash",
  "params": {
    "element_id": 123456
  }
}
```

### MEP Clashes Only

```json
{
  "tool": "spatial_clash",
  "params": {
    "category_filter": ["Ducts", "Pipes", "Conduits", "Cable Trays"],
    "severity_filter": ["Critical", "Major"]
  }
}
```

## Clash Types

| Type | Description | Detection |
|------|-------------|-----------|
| `Hard` | Solid intersection | Bounding box overlap |
| `Clearance` | Within tolerance | Distance < threshold |

## Severity Levels

| Severity | Description | Priority |
|----------|-------------|----------|
| `Critical` | Structural/MEP conflicts | Immediate action |
| `Major` | Significant impact | High priority |
| `Minor` | Cosmetic/low-impact | Low priority |

## Severity Assignment

Severity is assigned based on category pairs:

| Category Pair | Severity |
|---------------|----------|
| Structural + MEP | Critical |
| MEP + MEP (different systems) | Major |
| Architectural + MEP | Major |
| Same category | Minor |

## Use Cases

### QA Workflow

```javascript
// 1. Get clash summary
const clashes = await spatial_clash({
  severity_filter: ["Critical", "Major"]
});

console.log(`Critical: ${clashes.summary.by_severity.Critical}`);
console.log(`Major: ${clashes.summary.by_severity.Major}`);

// 2. Focus on worst clashes
for (const clash of clashes.clashes.filter(c => c.severity === "Critical")) {
  // Get context for each element
  const contextA = await spatial_describe({ element_id: clash.element_a.element_id });
  console.log(`Clash at Level ${contextA.level}: ${clash.element_a.type_name} vs ${clash.element_b.type_name}`);
}
```

### Discipline Coordination

```javascript
// Find all MEP vs Structural clashes
const mepStructural = await spatial_clash({
  category_pair: {
    category_a: "Ducts",
    category_b: "Structural Framing"
  }
});

// Find Pipe vs Structural
const pipeStructural = await spatial_clash({
  category_pair: {
    category_a: "Pipes",
    category_b: "Structural Framing"
  }
});
```

## Summary Response

The `summary` field provides quick statistics:

```json
{
  "summary": {
    "total_clashes": 45,
    "by_severity": { "Critical": 5, "Major": 15, "Minor": 25 },
    "by_type": { "Hard": 30, "Clearance": 15 },
    "top_categories": [
      { "pair": "Ducts vs Structural Framing", "count": 12 },
      { "pair": "Pipes vs Ducts", "count": 8 }
    ]
  }
}
```

Use for quick model health assessment.

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `NO_SNAPSHOT` | No snapshot exists | Run `snapshot_extract` |
| `ELEMENT_NOT_FOUND` | Invalid element ID | Check element exists |

## Related Tools

- [spatial_clearance](spatial-clearance.md) - Code compliance checks
- [spatial_describe](spatial-describe.md) - Context for clash elements
- [spatial_near](spatial-near.md) - Find nearby elements

## Agent Skill Hints

1. **Start with summary** - Get overview before details
2. **Filter by severity** - Focus on Critical first
3. **Use category_pair** - For discipline coordination
4. **Combine with describe** - Get context for clashes
5. **Track over time** - Compare before/after extraction
