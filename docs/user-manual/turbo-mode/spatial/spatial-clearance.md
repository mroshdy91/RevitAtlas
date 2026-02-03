# spatial_clearance

Check clearance requirements and detect code violations.

## Overview

`spatial_clearance` analyzes pre-computed clearance zones against building code standards. It identifies elements that violate required clearances and provides violation details with code references.

## When to Use

- Code compliance checking
- NEC electrical panel clearances
- ADA door clearances
- Mechanical service access

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `element_id` | number | No | - | Check specific element |
| `violations_only` | boolean | No | `false` | Only return violations |
| `category_filter` | string | No | - | Filter by category |
| `clearance_type` | string | No | - | Filter: "Service", "Access", "Code", "Safety" |
| `code_reference` | string | No | - | Filter: "NEC 110.26", "ADA 404.2", etc. |
| `direction` | string | No | - | Filter: "Front", "Back", "Left", "Right", "Top", "Bottom" |
| `limit` | number | No | 100 | Maximum results (1-1000) |

## Response Format

```json
{
  "clearances": [
    {
      "element_id": 123456,
      "category_name": "Electrical Equipment",
      "type_name": "Panelboard",
      "clearance_type": "Code",
      "code_reference": "NEC 110.26",
      "direction": "Front",
      "required_ft": 3.0,
      "actual_ft": 2.1,
      "is_violation": true,
      "violation_ft": 0.9,
      "blocking_elements": [
        {
          "element_id": 234567,
          "category_name": "Mechanical Equipment",
          "type_name": "Storage Tank"
        }
      ]
    }
  ],
  "summary": {
    "total_checked": 45,
    "total_violations": 12,
    "by_code": {
      "NEC 110.26": 5,
      "ADA 404.2": 4,
      "Service Access": 3
    },
    "by_direction": {
      "Front": 8,
      "Left": 2,
      "Right": 2
    }
  },
  "execution_time_ms": 95
}
```

## Code References

| Code | Standard | Description |
|------|----------|-------------|
| NEC 110.26 | National Electrical Code | Electrical panel clearances |
| ADA 404.2 | ADA Standards | Door clearances |
| Service Access | Mechanical | Equipment service access |
| ADA 604 | ADA Standards | Plumbing fixture clearances |

## Default Clearance Requirements

### NEC 110.26 (Electrical Panels)

| Direction | Required |
|-----------|----------|
| Front | 3.0 ft |
| Left | 2.5 ft |
| Right | 2.5 ft |

### ADA 404.2 (Doors)

| Direction | Required |
|-----------|----------|
| Approach (front) | 5.0 ft |
| Swing clearance | 3.0 ft |

### Mechanical Equipment

| Direction | Required |
|-----------|----------|
| Front (service) | 3.0 ft |
| Back | 2.0 ft |
| Sides | 2.0 ft |

### ADA 604 (Plumbing Fixtures)

| Direction | Required |
|-----------|----------|
| Front | 4.0 ft |
| Sides | 1.5 ft |

## Examples

### Find All Violations

```json
{
  "tool": "spatial_clearance",
  "params": {
    "violations_only": true
  }
}
```

### Check NEC Compliance

```json
{
  "tool": "spatial_clearance",
  "params": {
    "code_reference": "NEC 110.26",
    "violations_only": true
  }
}
```

### Check Specific Panel

```json
{
  "tool": "spatial_clearance",
  "params": {
    "element_id": 123456
  }
}
```

### ADA Door Clearances

```json
{
  "tool": "spatial_clearance",
  "params": {
    "code_reference": "ADA 404.2",
    "violations_only": true
  }
}
```

### Front Clearance Issues Only

```json
{
  "tool": "spatial_clearance",
  "params": {
    "direction": "Front",
    "violations_only": true
  }
}
```

## Use Cases

### Electrical Panel Audit

```javascript
// Check all electrical panels
const panels = await spatial_clearance({
  category_filter: "Electrical Equipment",
  code_reference: "NEC 110.26"
});

// Report violations
const violations = panels.clearances.filter(c => c.is_violation);

for (const v of violations) {
  console.log(`Panel ${v.element_id}: ${v.direction} clearance`);
  console.log(`  Required: ${v.required_ft}ft, Actual: ${v.actual_ft}ft`);
  console.log(`  Blocked by: ${v.blocking_elements[0]?.type_name}`);
}
```

### Pre-Permit Check

```javascript
// Check all code requirements
const allViolations = await spatial_clearance({
  violations_only: true
});

console.log(`Total violations: ${allViolations.summary.total_violations}`);
console.log(`By code:`);
for (const [code, count] of Object.entries(allViolations.summary.by_code)) {
  console.log(`  ${code}: ${count}`);
}
```

### Fix Recommendations

```javascript
const violation = clearances.clearances[0];

if (violation.is_violation) {
  const blocking = violation.blocking_elements[0];

  console.log(`To fix: Move ${blocking.type_name} at least ${violation.violation_ft}ft away`);

  // Get full context of blocking element
  const context = await spatial_describe({
    element_id: blocking.element_id
  });
}
```

## Blocking Elements

When a clearance violation occurs, `blocking_elements` identifies what's in the way:

```json
{
  "blocking_elements": [
    {
      "element_id": 234567,
      "category_name": "Mechanical Equipment",
      "type_name": "Storage Tank",
      "distance_ft": 2.1
    }
  ]
}
```

Use this to:
- Identify what needs to move
- Calculate required adjustment
- Generate coordination requests

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `NO_SNAPSHOT` | No snapshot exists | Run `snapshot_extract` |
| `ELEMENT_NOT_FOUND` | Invalid element ID | Check element exists |
| `NO_CLEARANCE_DATA` | Element type not tracked | Not all elements have clearances |

## Related Tools

- [spatial_clash](spatial-clash.md) - Physical clashes
- [spatial_near](spatial-near.md) - Proximity queries
- [spatial_describe](spatial-describe.md) - Full element context

## Agent Skill Hints

1. **Use violations_only** - Focus on issues
2. **Filter by code** - Address one standard at a time
3. **Check blocking_elements** - Identify what to move
4. **Calculate violation_ft** - Know exactly how much clearance needed
5. **Combine with describe** - Get context for fixes
