# snapshot_status

Get the status of the current document's snapshot including freshness and category distribution.

## Overview

`snapshot_status` checks whether a snapshot exists for the active Revit document and provides metadata about its freshness. It includes category distribution to help understand model composition without running queries.

## When to Use

- Before running any Turbo Mode query
- To check if a snapshot refresh is needed
- To get a quick overview of model composition
- To decide between Turbo Mode and Live Mode

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `_placeholder` | boolean | No | - | Placeholder (always pass `true`) |

## Response Format

```json
{
  "exists": true,
  "metadata": {
    "version": "1.0.0",
    "document_id": "a1b2c3d4...",
    "document_path": "C:\\Projects\\Building.rvt",
    "extraction_timestamp": "2026-01-31T10:30:00Z",
    "extraction_duration_ms": 8500,
    "element_count": 45000,
    "parameter_count": 1250000
  },
  "age_seconds": 180,
  "is_stale": false,
  "stale_threshold_seconds": 300,
  "recommendation": "use_snapshot",
  "category_distribution": {
    "top_10": [
      { "category": "Walls", "count": 5200, "percentage": 11.5 },
      { "category": "Doors", "count": 1800, "percentage": 4.0 },
      { "category": "Windows", "count": 1200, "percentage": 2.7 }
    ],
    "by_discipline": {
      "Architectural": 25000,
      "Structural": 8000,
      "MEP": 12000
    }
  }
}
```

## Response Fields

| Field | Description |
|-------|-------------|
| `exists` | Whether a snapshot exists |
| `metadata` | Full snapshot metadata |
| `age_seconds` | Seconds since extraction |
| `is_stale` | True if age > 5 minutes |
| `stale_threshold_seconds` | Staleness threshold (300s) |
| `recommendation` | Suggested action |
| `category_distribution` | Top categories and discipline breakdown |

## Recommendations

| Value | Meaning | Action |
|-------|---------|--------|
| `use_snapshot` | Snapshot is fresh | Proceed with queries |
| `refresh_recommended` | Snapshot is stale | Consider `snapshot_extract` |
| `extraction_required` | No snapshot exists | Run `snapshot_extract` |
| `wait_for_extraction` | Extraction in progress | Wait and retry |

## Examples

### Basic Status Check

```json
{
  "tool": "snapshot_status",
  "params": {
    "_placeholder": true
  }
}
```

### Decision Flow

```javascript
const status = await snapshot_status();

if (!status.exists) {
  await snapshot_extract();
} else if (status.is_stale) {
  // Optional: refresh or use existing
  if (needsFreshData) {
    await snapshot_extract({ force_refresh: true });
  }
}

// Proceed with queries
await snapshot_query({ sql: "SELECT ..." });
```

## Category Distribution

The `category_distribution` field provides:

### top_10

Top 10 categories by element count:
```json
{
  "category": "Walls",
  "count": 5200,
  "percentage": 11.5
}
```

### by_discipline

Aggregate counts by Revit discipline:
- **Architectural**: Walls, Doors, Windows, Floors, Ceilings, Rooms
- **Structural**: Structural Columns, Beams, Foundations
- **MEP**: Ducts, Pipes, Conduits, Cable Trays, Equipment

## Use Cases

### Pre-Query Check

```javascript
// Always check status before querying
const status = await snapshot_status();

if (status.recommendation === 'extraction_required') {
  await snapshot_extract();
}

// Now safe to query
const result = await snapshot_query({ sql: "..." });
```

### Model Overview

```javascript
// Get quick model overview without running queries
const status = await snapshot_status();

console.log(`Model has ${status.metadata.element_count} elements`);
console.log(`Top category: ${status.category_distribution.top_10[0].category}`);
console.log(`MEP elements: ${status.category_distribution.by_discipline.MEP}`);
```

### Staleness Decision

```javascript
const status = await snapshot_status();

if (status.age_seconds > 600) {
  // More than 10 minutes old
  // User likely made changes, refresh
  await snapshot_extract({ force_refresh: true });
}
```

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `NO_DOCUMENT` | No Revit document open | Open a project in Revit |
| `CONNECTION_ERROR` | Can't connect to Revit | Check Revit plugin is running |

## Related Tools

- [snapshot_extract](snapshot-extract.md) - Create/refresh snapshots
- [snapshot_query](snapshot-query.md) - Query snapshot data
- [snapshot_schema](snapshot-schema.md) - Explore table structure

## Agent Skill Hints

1. **Call status first** - Always check before querying
2. **Use category_distribution** - Avoid redundant COUNT queries
3. **Handle recommendations** - Follow the `recommendation` field
4. **Cache status** - Status doesn't change until extraction
5. **Check age for critical queries** - Use `live_query` if freshness matters
