---
name: query-project-info
description: Project metadata extraction skill for Revit Snapshots. Retrieves global model attributes (Name, Number, Client, Address) and model inventory (Levels, Sheets, Links).
---

# Skill: Project Metadata & Inventory

This skill provides a standardized set of queries for auditing top-level project information and model structure. It acts as the "Project Passport," giving agents immediate context about the model's identity and discipline.

## 1. Core Logic & Assumptions

### Categorical Filtering
- **Metadata**: Extracted from the `elements` table where `category_name = 'Project Information'`.
- **Inventory**: Levels, Sheets, and Links are identified by their specific `category_name` (e.g., `Levels`, `Sheets`).

### Scoping
This skill distinguishes between the active document (`scope: 'active'`) and the entire loaded ecosystem (`scope: 'global'`). 

## 2. Capability Manifest (Query Map)

The skill is modularized into dedicated SQL files:

| Query File | Description | Output |
| :--- | :--- | :--- |
| **`extract-project-info.sql`** | **Project Passport** | Name, Number, Client, Discipline, Address. |
| **`list-levels.sql`** | **Spatial Context** | Elevation-sorted list of project levels. |
| **`list-sheets.sql`** | **Drawing List** | Comprehensive sheet index. |
| **`list-linked-models.sql`** | **Link Registry** | Inventory of all attached Revit models. |

## 3. Best Practices for Developers
- **Verification First**: Always run `extract-project-info.sql` during the planning phase to confirm you are in the correct model.
- **Elevation Logic**: When listing levels, always sort by `elevation` to maintain spatial hierarchy.
- **Global Awareness**: Use the `global/` variant of these queries if the task requires cross-model coordination (e.g., "Find all architectural sheets across all links").

## 4. When to use this skill
- At the start of a task to gather project-wide context.
- When the user asks for high-level statistics (e.g., "How many levels are in this building?").
- When auditing sheet numbers or project addresses for documentation.

## 5. When NOT to use this skill
- For quantitative element takeoffs (Pipes, Walls). Use category-specific analytical skills instead.
- For detailed parameter inspection of individual instances.
