# RevitAtlas User Manual

This manual documents the Turbo Mode and Live Mode tools in RevitAtlas - the Model Context Protocol (MCP) server connecting AI assistants to Autodesk Revit.

## Quick Navigation

### Turbo Mode (Snapshot-Based Analytics)

Turbo Mode provides high-performance analytics via Parquet snapshots queried with DuckDB SQL.

| Tool | Description |
|------|-------------|
| [snapshot_extract](turbo-mode/snapshot-extract.md) | Extract model data to Parquet files |
| [snapshot_query](turbo-mode/snapshot-query.md) | Execute SQL queries with progressive enrichment |
| [snapshot_status](turbo-mode/snapshot-status.md) | Check snapshot freshness and category distribution |
| [snapshot_schema](turbo-mode/snapshot-schema.md) | Discover table schemas and columns |
| [suggest_query](turbo-mode/suggest-query.md) | Convert natural language to SQL |

### Spatial Intelligence Engine

Advanced spatial analysis tools (require snapshot extraction first).

| Tool | Description |
|------|-------------|
| [spatial_near](turbo-mode/spatial/spatial-near.md) | Find elements within distance of a point/element |
| [spatial_inside](turbo-mode/spatial/spatial-inside.md) | Find elements inside rooms or regions |
| [spatial_clash](turbo-mode/spatial/spatial-clash.md) | Query pre-computed clash detection |
| [spatial_related](turbo-mode/spatial/spatial-related.md) | Query spatial relationships (hosting, stacking) |
| [spatial_flow](turbo-mode/spatial/spatial-flow.md) | Trace MEP system connections |
| [spatial_clearance](turbo-mode/spatial/spatial-clearance.md) | Check code compliance clearances |
| [spatial_los](turbo-mode/spatial/spatial-los.md) | Line of sight analysis |
| [spatial_path](turbo-mode/spatial/spatial-path.md) | Path accessibility analysis |
| [spatial_describe](turbo-mode/spatial/spatial-describe.md) | Natural language spatial context |

### Live Mode (Real-Time Queries)

Live Mode queries current Revit data without requiring a snapshot.

| Tool | Description |
|------|-------------|
| [live_query](live-mode/live-query.md) | SQL queries against live data (FECQL/Micro-Snapshot) |
| [execute_script](live-mode/execute-script.md) | Run C# scripts inside Revit |

## Getting Started

New to RevitAtlas? Start here:

1. **[Getting Started](getting-started.md)** - Core concepts and quick start guide
2. **[Turbo Mode Overview](turbo-mode/overview.md)** - Understanding snapshot-based analytics
3. **[Live Mode Overview](live-mode/overview.md)** - Real-time query execution

## Workflows

Practical guides combining multiple tools:

- [Data Exploration](workflows/data-exploration.md) - Efficiently explore model data
- [Quality Assurance](workflows/quality-assurance.md) - Clash detection and compliance checks
- [MEP Analysis](workflows/mep-analysis.md) - Analyze MEP systems and flows

## Tool Categories

### By Use Case

| Use Case | Recommended Tools |
|----------|-------------------|
| Quick counts and summaries | `snapshot_query` with `detail_level='summary'` |
| Element lookups | `snapshot_query` or `live_query` |
| Spatial relationships | `spatial_related`, `spatial_inside` |
| Clash detection | `spatial_clash` |
| MEP system analysis | `spatial_flow` |
| Code compliance | `spatial_clearance` |
| Bulk modifications | `execute_script` with templates |

### By Performance Profile

| Speed | Tools |
|-------|-------|
| Instant (~200ms) | `live_query` (FECQL path), `snapshot_status` |
| Fast (~1-2s) | `snapshot_query`, all `spatial_*` tools |
| Moderate (~5-15s) | `live_query` (Micro-Snapshot), `snapshot_extract` |
| Variable | `execute_script` (depends on script complexity) |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Assistant (Claude)                     │
└─────────────────────────────────────────────────────────────┘
                              │ MCP Protocol
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     RevitAtlas MCP Server                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │   Turbo Mode    │  │   Live Mode     │  │  Standard   │  │
│  │  (DuckDB SQL)   │  │ (FECQL/Script)  │  │   (TCP)     │  │
│  └────────┬────────┘  └────────┬────────┘  └──────┬──────┘  │
└───────────┼────────────────────┼─────────────────┬┘         │
            │                    │                 │
            ▼                    ▼                 ▼
     ┌─────────────┐      ┌─────────────┐   ┌─────────────┐
     │   Parquet   │      │   Revit     │   │   Revit     │
     │   Files     │      │   Plugin    │   │   Plugin    │
     └─────────────┘      └─────────────┘   └─────────────┘
```

## Version

This documentation covers RevitAtlas v1.x with:
- Progressive Enrichment (detail_level parameter)
- Query Complexity Scoring
- Live Execution Engine (FECQL + Micro-Snapshot)
- Spatial Intelligence Engine
