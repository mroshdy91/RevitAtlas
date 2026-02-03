# Workflow: Quality Assurance

Systematic QA workflow for detecting model issues using clash detection, clearance checking, and data validation.

## Overview

The QA workflow combines spatial analysis with data queries to identify issues in the model:

1. Clash detection (physical conflicts)
2. Clearance violations (code compliance)
3. Data quality (missing parameters, duplicates)
4. Warning analysis (Revit model warnings)

## Prerequisites

```json
{
  "tool": "snapshot_extract",
  "params": { "force_refresh": true }
}
```

Always extract a fresh snapshot for QA to ensure current data.

## Phase 1: Clash Detection

### Get Clash Summary

```json
{
  "tool": "spatial_clash",
  "params": {
    "severity_filter": ["Critical", "Major"],
    "limit": 200
  }
}
```

### Focus on Critical Categories

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

### Get Context for Each Clash

```json
{
  "tool": "spatial_describe",
  "params": {
    "element_id": 123456,
    "include_clashes": true,
    "include_nearby": false
  }
}
```

### Common Clash Pairs to Check

| Category A | Category B | Severity |
|------------|------------|----------|
| Ducts | Structural Framing | Critical |
| Pipes | Structural Framing | Critical |
| Ducts | Pipes | Major |
| Conduits | Ducts | Major |
| Cable Trays | Pipes | Major |

## Phase 2: Clearance Violations

### Check All Violations

```json
{
  "tool": "spatial_clearance",
  "params": {
    "violations_only": true
  }
}
```

### Check by Code

```json
{
  "tool": "spatial_clearance",
  "params": {
    "code_reference": "NEC 110.26",
    "violations_only": true
  }
}
```

```json
{
  "tool": "spatial_clearance",
  "params": {
    "code_reference": "ADA 404.2",
    "violations_only": true
  }
}
```

### Code Compliance Checklist

| Code | Check | Tool |
|------|-------|------|
| NEC 110.26 | Panel clearances | `spatial_clearance` |
| ADA 404.2 | Door clearances | `spatial_clearance` |
| ADA 604 | Fixture clearances | `spatial_clearance` |
| Service Access | Equipment access | `spatial_clearance` |

## Phase 3: Data Quality

### Missing Parameters

```sql
-- Doors without Mark
SELECT e.element_id, e.type_name
FROM elements e
WHERE e.category_name = 'Doors'
  AND e.element_id NOT IN (
    SELECT ep.element_id
    FROM element_parameters ep
    JOIN parameter_catalog pc ON ep.parameter_id = pc.parameter_id
    WHERE pc.parameter_name = 'Mark' AND ep.value_string IS NOT NULL
  )
```

### Duplicate Elements

```json
{
  "tool": "execute_script",
  "params": {
    "template": "find_duplicates",
    "template_params": {
      "category_name": "Walls"
    }
  }
}
```

### Unplaced Elements

```sql
SELECT element_id, category_name, type_name
FROM elements
WHERE level_name IS NULL
  AND category_name IN ('Doors', 'Windows', 'Walls')
```

### Orphaned Elements

```sql
SELECT element_id, category_name, type_name
FROM elements
WHERE room_id IS NULL
  AND category_name IN ('Furniture', 'Plumbing Fixtures', 'Lighting Fixtures')
```

## Phase 4: Model Warnings

Use the standard mode tool:

```json
{
  "tool": "get_all_warnings_in_the_model",
  "params": { "_placeholder": true }
}
```

## QA Report Template

After running all phases, compile findings:

```markdown
## Model QA Report

### Clashes
- Critical: X issues
- Major: Y issues
- Top conflict: [Category A] vs [Category B]

### Clearance Violations
- NEC 110.26: X violations
- ADA 404.2: Y violations
- Total blocking elements: Z

### Data Quality
- Missing Mark values: X doors
- Duplicate elements: Y walls
- Unplaced elements: Z

### Recommendations
1. [Most critical issue and fix]
2. [Second issue and fix]
3. [Third issue and fix]
```

## Automated QA Workflow

```javascript
// Phase 1: Clash Detection
const clashes = await spatial_clash({
  severity_filter: ["Critical", "Major"]
});

// Phase 2: Clearance Violations
const necViolations = await spatial_clearance({
  code_reference: "NEC 110.26",
  violations_only: true
});

const adaViolations = await spatial_clearance({
  code_reference: "ADA 404.2",
  violations_only: true
});

// Phase 3: Data Quality
const missingMarks = await snapshot_query({
  sql: "SELECT COUNT(*) as count FROM elements WHERE category_name = 'Doors' AND element_id NOT IN (SELECT ep.element_id FROM element_parameters ep JOIN parameter_catalog pc ON ep.parameter_id = pc.parameter_id WHERE pc.parameter_name = 'Mark' AND ep.value_string IS NOT NULL)",
  detail_level: "basic"
});

const duplicates = await execute_script({
  template: "find_duplicates",
  template_params: { category_name: "Walls" }
});

// Compile report
const report = {
  clashes: clashes.summary,
  clearance: {
    nec: necViolations.summary.total_violations,
    ada: adaViolations.summary.total_violations
  },
  data_quality: {
    missing_marks: missingMarks.rows[0].count,
    duplicates: duplicates.result.count
  }
};
```

## Agent Skill Hints

1. **Fresh snapshot** - Always extract before QA
2. **Prioritize Critical** - Focus on Critical severity first
3. **Combine phases** - Run phases in sequence
4. **Generate report** - Compile findings into structured output
5. **Track over time** - Compare QA runs to show improvement

## Related Workflows

- [Data Exploration](data-exploration.md) - Understand model first
- [MEP Analysis](mep-analysis.md) - Deep MEP system checks
