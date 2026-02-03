---
name: query-piping-systems
description: Resolves physical material names, descriptive system names, and resilient size mapping for piping elements. Use when analyzing piping quantities, validating system assignments, or extracting MEP takeoffs.
---

# Piping Systems Analysis

## Description
This skill extracts high-fidelity piping data from Revit snapshots. It resolves common data quality issues:
- **System Names**: Maps abbreviations (e.g., "FP") to full descriptive names via category joins.
- **Materials**: Resolves physical `Material` elements instead of unreliable text parameters.
- **Sizes**: Normalizes size strings using a fallback hierarchy (Size -> Overall Size -> Diameter).

## Usage

### Extract Piping Data
Run the master query to get aggregated lengths by system, material, and size.

```python
snapshot_query(sql=read_file("queries/extract-piping-systems.sql"))
```

## Resources
- **[extract-piping-systems.sql](queries/extract-piping-systems.sql)**: Master SQL logic for global piping extraction.
