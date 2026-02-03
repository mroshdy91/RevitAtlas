# RevitMCP Data Schema

The **Hybrid Schema** combines the speed of "Wide Tables" with the flexibility of "EAV".

## 1. `elements.parquet` ( The "Head" )
Contains the most accessing data as direct columns.

| Column | Type | Description |
| :--- | :--- | :--- |
| `element_id` | LONG | Primary Key. |
| `category_name` | STRING | e.g. `OST_Walls`. Indexed. |
| `param_volume` | DOUBLE | Native Revit Volume. |
| `param_area` | DOUBLE | Native Revit Area. |
| `param_mark` | STRING | Element Mark. |
| `param_fire_rating` | STRING | Fire Rating. |
| `location_x/y/z` | DOUBLE | Point location (Center or Start). |

## 2. `geometry.parquet` ( The "Body" )
Spatial data for geometric queries.

| Column | Type | Description |
| :--- | :--- | :--- |
| `element_id` | LONG | FK to elements. |
| `bbox_min/max_x/y/z` | DOUBLE | Axis Aligned Bounding Box. |
| `centroid_x/y/z` | DOUBLE | Geometric Center. |
| `spatial_hash` | STRING | Grid Index (10ft bucket). |

## 3. `categories.parquet` ( The "Map" )
Summary of the model contents.

| Column | Type | Description |
| :--- | :--- | :--- |
| `category_name` | STRING | Unique ID. |
| `element_count` | LONG | Cache of count(*). |

## 4. `element_parameters.parquet` ( The "Tail" )
Everything else. Sparse EAV format.

| Column | Type | Description |
| :--- | :--- | :--- |
| `element_id` | LONG | FK to elements. |
| `param_name` | STRING | Name of parameter. |
| `value_string` | STRING | Value if text. |
| `value_double` | DOUBLE | Value if number. |

## 5. `metadata.json` ( The "Passport" )
| Field | Description |
| :--- | :--- |
| `checksum` | SHA256 hash of the dataset. **Verify this matches!** |
| `extraction_timestamp` | UTC Time. |

## Element priority tiers

Revit models contain many types of elements, from walls to annotations. Priority tiers help focus queries on the most important model elements.

### Tier definitions

| Tier | Name | Focus | Example Categories |
|------|------|-------|-------------------|
| **1** | Core Model Elements | Primary building elements | Walls, Doors, Windows, Floors, Ceilings, Roofs, Stairs |
| **2** | MEP Elements | Mechanical/electrical/plumbing systems | Ducts, Pipes, Equipment, Lighting, Fixtures |
| **3** | Structural Elements | Structural framing and foundations | Columns, Beams, Foundations, Rebar |
| **4** | Architectural Details | Furniture, casework, specialties | Furniture, Casework, Equipment |
| **5** | Annotations | View-specific annotations | Dimensions, Text, Tags, Keynotes |
| **6** | Lines/Graphics | 2D graphics and sketch elements | Lines, Detail Lines, Grids, Levels |
| **7** | System/Documentation | Non-model elements | Materials, Views, Sheets, Schedules |

### Priority tier quick reference

**Always include** (Tier 1):
- `OST_Walls`, `OST_Doors`, `OST_Windows`
- `OST_Floors`, `OST_Ceilings`, `OST_Roofs`
- `OST_Stairs`, `OST_Ramps`, `OST_Railings`

**Usually include** (Tier 2-3):
- MEP: `OST_DuctCurves`, `OST_PipeCurves`, `OST_MechanicalEquipment`
- Structural: `OST_StructuralFraming`, `OST_StructuralColumns`, `OST_StructuralFoundation`

**Usually exclude** (Tier 5-7):
- Annotations: `OST_Dimensions`, `OST_TextNotes`, `OST_Tags`
- Graphics: `OST_Lines`, `OST_DetailLines`, `OST_Grids`
- System: `OST_Materials`, `OST_Views`, `OST_Sheets`, `Unknown`

