# snapshot_extract

Extract a snapshot of the current Revit document for high-performance analytics.

## Overview

`snapshot_extract` creates Parquet files containing elements, parameters, and spatial data from the active Revit document. These files enable fast SQL queries via DuckDB without blocking the Revit UI.

## When to Use

- Before running any `snapshot_query` or `spatial_*` tools
- When snapshot is stale (older than 5 minutes)
- After making significant changes in Revit
- When switching to a different Revit document

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `force_refresh` | boolean | No | `false` | Extract even if a valid snapshot exists |
| `include_linked_models` | boolean | No | `false` | Also extract data from linked Revit models |

## Response Format

```json
{
  "success": true,
  "document_id": "a1b2c3d4e5f6...",
  "document_path": "C:\\Projects\\Building.rvt",
  "extraction_timestamp": "2026-01-31T10:30:00Z",
  "extraction_duration_ms": 8500,
  "element_count": 45000,
  "parameter_count": 1250000,
  "file_sizes": {
    "elements": 2048000,
    "element_parameters": 15000000,
    "catalog": 50000
  }
}
```

## Examples

### Basic Extraction

```json
{
  "tool": "snapshot_extract",
  "params": {}
}
```

Extracts only if no valid snapshot exists.

### Force Refresh

```json
{
  "tool": "snapshot_extract",
  "params": {
    "force_refresh": true
  }
}
```

Always creates a fresh snapshot.

### Include Linked Models

```json
{
  "tool": "snapshot_extract",
  "params": {
    "include_linked_models": true
  }
}
```

Extracts main model and all linked Revit files.

## Extraction Process

1. **Collect Elements** - Iterates all model elements via FilteredElementCollector
2. **Extract Parameters** - Reads instance and type parameters
3. **Compute Spatial Data** - Calculates bounding boxes, relationships, clashes
4. **Write Parquet** - Atomic write to temp files, then rename

## Storage Location

Snapshots are stored in:
```
%LOCALAPPDATA%\RevitAtlas\snapshots\{document_hash}\
├── elements.parquet
├── element_parameters.parquet
├── catalog.parquet
├── geometry.parquet
├── clashes.parquet
├── relationships.parquet
├── mep_flows.parquet
├── clearances.parquet
└── metadata.json
```

## Performance

| Model Size | Elements | Duration |
|------------|----------|----------|
| Small | < 10,000 | ~5 seconds |
| Medium | 10,000 - 50,000 | ~10-15 seconds |
| Large | 50,000 - 200,000 | ~20-30 seconds |
| Very Large | > 200,000 | ~30-60 seconds |

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `NO_DOCUMENT` | No Revit document open | Open a Revit project |
| `EXTRACTION_FAILED` | Error during extraction | Check Revit plugin logs |
| `EXTRACTION_TIMEOUT` | Model too large | Try with smaller scope |

## Related Tools

- [snapshot_status](snapshot-status.md) - Check if extraction is needed
- [snapshot_query](snapshot-query.md) - Query the extracted data
- [snapshot_schema](snapshot-schema.md) - Explore table structure

## Agent Skill Hints

1. **Check status first** - Use `snapshot_status` before extracting
2. **Don't over-extract** - Extraction takes time, reuse when possible
3. **Handle async extraction** - Large models may take 30+ seconds
4. **Auto-extract pattern** - If `snapshot_status.exists = false`, auto-extract
