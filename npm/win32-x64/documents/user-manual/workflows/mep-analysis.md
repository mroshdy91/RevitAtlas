# Workflow: MEP Analysis

Analyze mechanical, electrical, and plumbing systems using flow tracing, spatial queries, and system mapping.

## Overview

The MEP analysis workflow provides comprehensive analysis of building systems:

1. System inventory (what systems exist)
2. Flow tracing (connections and paths)
3. Equipment analysis (location and context)
4. Cross-discipline coordination

## Prerequisites

```json
{
  "tool": "snapshot_extract",
  "params": { "force_refresh": true }
}
```

## Phase 1: System Inventory

### MEP Element Overview

```json
{
  "tool": "snapshot_query",
  "params": {
    "sql": "SELECT category_name, COUNT(*) as count FROM elements WHERE category_name IN ('Ducts', 'Duct Fittings', 'Air Terminals', 'Pipes', 'Pipe Fittings', 'Plumbing Fixtures', 'Conduits', 'Conduit Fittings', 'Cable Trays', 'Cable Tray Fittings', 'Mechanical Equipment', 'Electrical Equipment') GROUP BY category_name ORDER BY count DESC",
    "detail_level": "basic"
  }
}
```

### System Names

```sql
SELECT DISTINCT system_name, system_type, system_classification, COUNT(*) as element_count
FROM mep_flows
GROUP BY system_name, system_type, system_classification
ORDER BY element_count DESC
```

### Equipment Inventory

```sql
SELECT e.type_name, COUNT(*) as count, e.level_name
FROM elements e
WHERE e.category_name IN ('Mechanical Equipment', 'Electrical Equipment')
GROUP BY e.type_name, e.level_name
ORDER BY e.level_name, count DESC
```

## Phase 2: HVAC Analysis

### Duct System Mapping

```json
{
  "tool": "spatial_flow",
  "params": {
    "system_type": "Duct",
    "system_classification": "Supply"
  }
}
```

### Trace from Air Handler

```json
{
  "tool": "spatial_flow",
  "params": {
    "element_id": 123456,
    "direction": "downstream",
    "system_type": "Duct"
  }
}
```

### Count Air Terminals per System

```javascript
const supply = await spatial_flow({
  system_name: "Supply Air 1",
  include_terminals: true
});

console.log(`Supply Air 1: ${supply.terminals.length} terminals`);
console.log(`Total connections: ${supply.total_connections}`);
```

### HVAC Equipment Context

```json
{
  "tool": "spatial_describe",
  "params": {
    "element_id": 123456,
    "include_mep_flow": true,
    "include_nearby": true
  }
}
```

## Phase 3: Plumbing Analysis

### Piping Systems

```json
{
  "tool": "spatial_flow",
  "params": {
    "system_type": "Pipe",
    "system_classification": "Supply"
  }
}
```

### Fixture Count by Room

```sql
SELECT e.room_id, r.room_name, COUNT(*) as fixture_count
FROM elements e
JOIN elements r ON e.room_id = r.element_id
WHERE e.category_name = 'Plumbing Fixtures'
GROUP BY e.room_id, r.room_name
ORDER BY fixture_count DESC
```

### Trace from Fixture to Source

```json
{
  "tool": "spatial_flow",
  "params": {
    "element_id": 234567,
    "direction": "upstream",
    "system_type": "Pipe"
  }
}
```

## Phase 4: Electrical Analysis

### Electrical Equipment

```sql
SELECT e.element_id, e.type_name, e.level_name
FROM elements e
WHERE e.category_name = 'Electrical Equipment'
ORDER BY e.level_name
```

### Panel Clearances

```json
{
  "tool": "spatial_clearance",
  "params": {
    "category_filter": "Electrical Equipment",
    "code_reference": "NEC 110.26"
  }
}
```

### Conduit Routing

```json
{
  "tool": "spatial_flow",
  "params": {
    "system_type": "Conduit",
    "element_id": 345678,
    "direction": "downstream"
  }
}
```

## Phase 5: Cross-Discipline Coordination

### MEP vs Structural Clashes

```json
{
  "tool": "spatial_clash",
  "params": {
    "category_filter": ["Ducts", "Pipes", "Conduits", "Cable Trays"],
    "severity_filter": ["Critical"]
  }
}
```

### MEP vs MEP Clashes

```json
{
  "tool": "spatial_clash",
  "params": {
    "category_pair": {
      "category_a": "Ducts",
      "category_b": "Pipes"
    }
  }
}
```

### Equipment Proximity

```json
{
  "tool": "spatial_near",
  "params": {
    "reference_element_id": 123456,
    "distance_feet": 20,
    "category_filter": ["Electrical Equipment", "Plumbing Fixtures"]
  }
}
```

## Phase 6: Mechanical Room Analysis

### List Mechanical Rooms

```sql
SELECT element_id, room_name, room_number, level_name
FROM elements
WHERE category_name = 'Rooms'
  AND (room_name LIKE '%Mechanical%' OR room_name LIKE '%Mech%'
       OR room_name LIKE '%Electrical%' OR room_name LIKE '%Elec%')
```

### Audit Mechanical Room Contents

```json
{
  "tool": "spatial_inside",
  "params": {
    "room_name": "Mechanical Room",
    "category_filter": ["Mechanical Equipment", "Electrical Equipment", "Pipes", "Ducts"]
  }
}
```

### Check Service Access

```json
{
  "tool": "spatial_clearance",
  "params": {
    "clearance_type": "Service",
    "violations_only": true
  }
}
```

## MEP Report Template

```markdown
## MEP Systems Report

### System Inventory
| System | Type | Classification | Elements | Terminals |
|--------|------|----------------|----------|-----------|
| Supply Air 1 | Duct | Supply | 120 | 24 |
| Return Air 1 | Duct | Return | 80 | 18 |
| DHW | Pipe | Supply | 45 | 12 |

### Equipment Summary
| Equipment | Count | Levels |
|-----------|-------|--------|
| Air Handler Unit | 2 | B1, L3 |
| Panelboard | 8 | All |

### Issues Found
- Critical clashes: X (Ducts vs Structure)
- NEC violations: Y (panel clearances)
- Service access violations: Z

### Recommendations
1. [Reroute duct at Grid A-5]
2. [Move storage from panel clearance zone]
```

## Automated MEP Workflow

```javascript
// 1. System inventory
const systems = await snapshot_query({
  sql: "SELECT DISTINCT system_name, system_type FROM mep_flows GROUP BY system_name, system_type"
});

// 2. For each HVAC system, count terminals
for (const system of systems.rows) {
  if (system.system_type === 'Duct') {
    const flow = await spatial_flow({
      system_name: system.system_name,
      include_terminals: true
    });
    console.log(`${system.system_name}: ${flow.terminals.length} terminals`);
  }
}

// 3. Check MEP clashes
const mepClashes = await spatial_clash({
  category_filter: ["Ducts", "Pipes", "Conduits"],
  severity_filter: ["Critical", "Major"]
});

// 4. Check clearances
const clearances = await spatial_clearance({
  violations_only: true
});

// 5. Compile report
```

## Agent Skill Hints

1. **Start with inventory** - Know what systems exist
2. **Trace from equipment** - Follow connections downstream
3. **Check clashes per discipline** - MEP vs Structural, MEP vs MEP
4. **Audit mechanical rooms** - spatial_inside for room contents
5. **Code compliance** - NEC for panels, ADA for access
6. **Cross-reference** - Combine flow data with spatial context

## Related Workflows

- [Data Exploration](data-exploration.md) - Model overview first
- [Quality Assurance](quality-assurance.md) - Full QA including MEP
