# spatial_flow

Trace MEP system flow connections upstream and downstream.

## Overview

`spatial_flow` traces connected elements in duct, pipe, conduit, and cable tray systems. It uses connector data extracted from the Revit Connector API during snapshot extraction.

## When to Use

- Trace supply/return air paths
- Follow piping from source to fixtures
- Map electrical circuits
- Analyze MEP system topology

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `element_id` | number | No | - | Element to trace from |
| `direction` | enum | No | `both` | "upstream", "downstream", "both" |
| `system_type` | string | No | - | Filter: "Duct", "Pipe", "Conduit", "CableTray" |
| `system_name` | string | No | - | Filter by system name |
| `system_classification` | string | No | - | Filter: "Supply", "Return", "Exhaust" |
| `category_filter` | string | No | - | Filter source/target category |
| `include_terminals` | boolean | No | `true` | Include terminal elements |
| `limit` | number | No | 100 | Maximum results (1-1000) |

## Response Format

```json
{
  "source_element": {
    "element_id": 123456,
    "category_name": "Mechanical Equipment",
    "type_name": "Air Handler Unit"
  },
  "connections": [
    {
      "element_id": 234567,
      "category_name": "Ducts",
      "type_name": "Rectangular Duct",
      "flow_direction": "downstream",
      "connection_type": "Direct",
      "distance_from_source": 1,
      "system_name": "Supply Air 1",
      "system_classification": "Supply"
    },
    {
      "element_id": 345678,
      "category_name": "Duct Fittings",
      "type_name": "Elbow",
      "flow_direction": "downstream",
      "connection_type": "Fitting",
      "distance_from_source": 2
    }
  ],
  "terminals": [
    {
      "element_id": 456789,
      "category_name": "Air Terminals",
      "type_name": "Supply Diffuser",
      "distance_from_source": 5
    }
  ],
  "by_category": {
    "Ducts": 12,
    "Duct Fittings": 8,
    "Air Terminals": 4
  },
  "total_connections": 24,
  "execution_time_ms": 150
}
```

## Examples

### Trace Downstream from Air Handler

```json
{
  "tool": "spatial_flow",
  "params": {
    "element_id": 123456,
    "direction": "downstream"
  }
}
```

### Trace Supply Air System

```json
{
  "tool": "spatial_flow",
  "params": {
    "system_name": "Supply Air 1",
    "direction": "downstream"
  }
}
```

### Find All Pipe Connections

```json
{
  "tool": "spatial_flow",
  "params": {
    "system_type": "Pipe",
    "system_classification": "Supply"
  }
}
```

### Trace Upstream to Find Source

```json
{
  "tool": "spatial_flow",
  "params": {
    "element_id": 456789,
    "direction": "upstream"
  }
}
```

## System Types

| Type | Description | Categories |
|------|-------------|------------|
| `Duct` | HVAC air distribution | Ducts, Duct Fittings, Air Terminals |
| `Pipe` | Plumbing/hydronic | Pipes, Pipe Fittings, Plumbing Fixtures |
| `Conduit` | Electrical raceways | Conduits, Conduit Fittings |
| `CableTray` | Cable management | Cable Trays, Cable Tray Fittings |

## System Classifications

| Classification | Description |
|----------------|-------------|
| `Supply` | Source to delivery |
| `Return` | Delivery back to source |
| `Exhaust` | One-way out |
| `Other` | Unclassified |

## Connection Types

| Type | Description |
|------|-------------|
| `Direct` | Straight connection |
| `Fitting` | Through a fitting |
| `Equipment` | Through equipment |
| `Terminal` | End device |

## Use Cases

### HVAC System Analysis

```javascript
// Find air handler
const ahu = await snapshot_query({
  sql: "SELECT element_id FROM elements WHERE type_name LIKE '%Air Handler%'"
});

// Trace supply side
const supply = await spatial_flow({
  element_id: ahu.rows[0].element_id,
  direction: "downstream",
  system_classification: "Supply"
});

console.log(`Supply system has ${supply.total_connections} connections`);
console.log(`Terminals: ${supply.terminals.length}`);
```

### Find Terminal Devices

```javascript
// Get all air terminals on a system
const flow = await spatial_flow({
  system_name: "Supply Air 1",
  include_terminals: true
});

const terminals = flow.terminals;
console.log(`${terminals.length} air terminals on Supply Air 1`);
```

### Trace Back to Source

```javascript
// Start from a diffuser
const diffuserId = 456789;

const upstream = await spatial_flow({
  element_id: diffuserId,
  direction: "upstream"
});

// Find the equipment (source)
const equipment = upstream.connections.find(c =>
  c.category_name === "Mechanical Equipment"
);

console.log(`Diffuser connected to: ${equipment.type_name}`);
```

## Distance from Source

The `distance_from_source` field indicates connection depth:

```
AHU (0) → Duct (1) → Fitting (2) → Duct (3) → Terminal (4)
```

Use this for:
- Finding longest runs
- Calculating pressure drops
- Identifying system branches

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `NO_SNAPSHOT` | No snapshot exists | Run `snapshot_extract` |
| `ELEMENT_NOT_FOUND` | Invalid element ID | Check element exists |
| `NO_MEP_DATA` | Element not MEP | Use MEP element |

## Related Tools

- [spatial_related](spatial-related.md) - General relationships
- [spatial_describe](spatial-describe.md) - Full element context
- [snapshot_query](../snapshot-query.md) - Find MEP elements

## Agent Skill Hints

1. **Start from equipment** - Trace from AHUs, pumps, panels
2. **Use system_name** - Filter by named systems
3. **Check terminals** - Verify all endpoints connected
4. **Compare directions** - Trace both ways for full picture
5. **Use distance** - Analyze system depth
