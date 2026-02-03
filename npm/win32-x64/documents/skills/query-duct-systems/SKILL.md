---
name: query-duct-systems
description: Resolves physical material names, descriptive system names, and resilient size mapping for duct elements. Use when analyzing duct quantities, validating system assignments, or extracting MEP takeoffs.
---

# Duct Systems Analysis

## Description
This skill extracts high-fidelity duct data from Revit snapshots. It resolves common data quality issues and provides advanced segmentation:
- **System Names**: Maps system classifications and names to full descriptive names via category joins.
- **Shape Detection**: Automatically classifies elements as 'Rectangular', 'Round', or 'Oval' based on parameters and naming.
- **Level Distribution**: Segregates takeoff by Reference Level (Floors).
- **Insulation & Lining**: Calculates surface area of Insulated or Lined ducts separately from bare metal.
- **Shape & Component**: Retains Shape (Rect/Round/Oval) and Component (Straight/Fitting) segmentation.

## Usage

### Extract Comprehensive Duct Takeoff
Run the master query to get Area quantities by System, Level, Component, Shape, and Insulation/Lining status.

```python
snapshot_query(sql=read_file("queries/extract-duct-systems.sql"))
```

## Resources
- **[extract-duct-systems.sql](queries/extract-duct-systems.sql)**: Master SQL logic for global duct extraction.
