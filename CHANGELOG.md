# Changelog

All notable changes to RevitAtlas will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.9] - 2026-02-03

### Fixed
- minor fixes and enhancements.

## [1.0.0] - 2026-02-02

### Added

- **npm Distribution**: Install globally with `npm install -g revitatlas`
- **CLI Interface**: `revitatlas setup`, `revitatlas config`, `revitatlas status`, `revitatlas uninstall`
- **Standard Mode**: 50 tools for granular Revit API operations
  - Query elements, categories, parameters, views, families, worksets
  - Set parameter values, selection, graphic overrides, view filters
  - Create, copy, move, rotate, and delete elements
- **Turbo Mode 2.0**: 5 tools for model analytics via DuckDB SQL
  - Snapshot extraction to Parquet files
  - SQL queries against 12 pre-computed data tables
  - Schema introspection and natural language query suggestions
- **Spatial Intelligence Engine**: 9 tools for advanced spatial analysis
  - Proximity and containment queries (`spatial_near`, `spatial_inside`)
  - Pre-computed clash detection with severity levels (`spatial_clash`)
  - Scene graph relationships (`spatial_related`)
  - MEP flow tracing (`spatial_flow`)
  - Code compliance clearance checking (`spatial_clearance`)
  - Line-of-sight and path analysis (`spatial_los`, `spatial_path`)
  - Natural language spatial descriptions (`spatial_describe`)
- **Live Execution Engine**: 2 tools for real-time interaction
  - SQL against live Revit data with auto-routing (`live_query`)
  - C# script execution inside Revit via Roslyn (`execute_script`)
- **Agentic Skills**: Pre-built SQL skill packs for common workflows
- **Revit Support**: Revit 2021, 2022, 2023, 2024, 2025, 2026
- **Safety**: Read-only SQL validation, script sandboxing, transaction safety modes
