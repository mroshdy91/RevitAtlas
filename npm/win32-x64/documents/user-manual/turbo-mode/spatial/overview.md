# Spatial Intelligence Engine

The Spatial Intelligence Engine provides 9 specialized tools for spatial analysis, clash detection, MEP flow tracing, and code compliance checking.

## Overview

All spatial tools query pre-computed spatial data from snapshots. They use R-Tree indexed spatial lookups for fast proximity queries and maintain relationships, clashes, and clearances computed during extraction.

## Prerequisites

**All spatial tools require a snapshot.** Run `snapshot_extract` first:

```json
{
  "tool": "snapshot_extract",
  "params": {}
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Snapshot Extraction                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Geometry │  │ Clashes  │  │ Relation │  │ MEP Flow │    │
│  │  Table   │  │  Table   │  │  ships   │  │  Table   │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
└───────┼─────────────┼────────────┼─────────────┼───────────┘
        │             │            │             │
        ▼             ▼            ▼             ▼
┌──────────────────────────────────────────────────────────────┐
│                  Spatial Intelligence Engine                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐ │
│  │  Near   │ │ Inside  │ │  Clash  │ │ Related │ │  Flow  │ │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └────────┘ │
│  ┌──────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐          │
│  │Clearance │ │   LOS   │ │  Path   │ │ Describe │          │
│  └──────────┘ └─────────┘ └─────────┘ └──────────┘          │
└──────────────────────────────────────────────────────────────┘
```

## Available Tools

### Proximity & Containment

| Tool | Description | Use Case |
|------|-------------|----------|
| [spatial_near](spatial-near.md) | Find elements within distance | "Fire extinguishers within 75ft of exits" |
| [spatial_inside](spatial-inside.md) | Find elements in rooms/regions | "Equipment in the data center" |

### Clash Detection

| Tool | Description | Use Case |
|------|-------------|----------|
| [spatial_clash](spatial-clash.md) | Query pre-computed clashes | "Show all Critical clashes" |

### Relationships

| Tool | Description | Use Case |
|------|-------------|----------|
| [spatial_related](spatial-related.md) | Query hosting, containment | "What does this wall host?" |
| [spatial_flow](spatial-flow.md) | Trace MEP connections | "Trace supply duct downstream" |

### Code Compliance

| Tool | Description | Use Case |
|------|-------------|----------|
| [spatial_clearance](spatial-clearance.md) | Check required clearances | "NEC violations for panels" |

### Visibility & Access

| Tool | Description | Use Case |
|------|-------------|----------|
| [spatial_los](spatial-los.md) | Line of sight analysis | "Can sensor see this door?" |
| [spatial_path](spatial-path.md) | Path accessibility | "Distance from elevator to exit" |

### Natural Language

| Tool | Description | Use Case |
|------|-------------|----------|
| [spatial_describe](spatial-describe.md) | Full spatial context | "Describe equipment M-101" |

## Common Parameters

Most spatial tools share these parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `element_id` | number | Reference element for analysis |
| `category_filter` | string[] | Filter by category names |
| `limit` | number | Maximum results (default: 100) |
| `include_element_details` | boolean | Include type names (default: true) |

## Coordinate System

All coordinates use Revit internal units:
- **Distance**: Feet
- **Origin**: Project base point
- **Axes**: X (East), Y (North), Z (Up)

## Relationship Types

The `relationships` table stores these relationship types:

| Type | Description |
|------|-------------|
| `HOSTS` / `HOSTED_BY` | Element hosting (wall → door) |
| `INSIDE` / `CONTAINS` | Room containment |
| `ABOVE` / `BELOW` | Vertical stacking |
| `DIRECTLY_ABOVE` / `DIRECTLY_BELOW` | Vertically aligned |

## Clash Types

| Type | Description |
|------|-------------|
| `Hard` | Solid intersection |
| `Clearance` | Within minimum tolerance |

## Severity Levels

| Level | Description |
|-------|-------------|
| `Critical` | Structural/MEP conflicts |
| `Major` | Significant functional impact |
| `Minor` | Cosmetic or low-impact |

## Clearance Standards

Code references supported:

| Code | Standard | Elements |
|------|----------|----------|
| NEC 110.26 | Electrical panels | 3ft front, 2.5ft sides |
| ADA 404.2 | Doors | 5ft approach, 3ft swing |
| Service Access | Mechanical | 3ft front, 2ft back |
| ADA 604 | Plumbing fixtures | 4ft front, 1.5ft sides |

## Performance

| Tool | Typical Response Time |
|------|----------------------|
| `spatial_near` | 50-200ms |
| `spatial_inside` | 50-200ms |
| `spatial_clash` | 50-100ms |
| `spatial_related` | 50-150ms |
| `spatial_flow` | 100-300ms |
| `spatial_clearance` | 50-150ms |
| `spatial_los` | 100-300ms |
| `spatial_path` | 100-300ms |
| `spatial_describe` | 200-500ms |

## Best Practices

1. **Extract first** - All tools require snapshot
2. **Use category filters** - Reduce result set size
3. **Limit results** - Use `limit` parameter
4. **Combine tools** - Use `spatial_describe` for overview, then specific tools
5. **Check clashes early** - Part of QA workflow

## Workflow Patterns

### QA Workflow

```javascript
// 1. Check for clashes
const clashes = await spatial_clash({
  severity_filter: ["Critical", "Major"]
});

// 2. Check clearance violations
const violations = await spatial_clearance({
  violations_only: true
});

// 3. Describe problematic elements
for (const clash of clashes.clashes) {
  const context = await spatial_describe({
    element_id: clash.element_a_id
  });
}
```

### MEP Analysis

```javascript
// 1. Find all equipment
const equipment = await spatial_inside({
  room_name: "Mechanical Room"
});

// 2. Trace connections
for (const equip of equipment.elements) {
  const flow = await spatial_flow({
    element_id: equip.element_id,
    direction: "downstream"
  });
}
```

## Agent Skill Hints

1. **Always check snapshot first** - Spatial tools fail without it
2. **Start with spatial_describe** - Get full context
3. **Filter by severity** - Focus on Critical/Major issues
4. **Use category filters** - Reduce noise
5. **Combine with SQL** - Use snapshot_query for complex filters first
