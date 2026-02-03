# Project Problems and Fixes

> [!IMPORTANT]
> This document is a reference for bugs and fixes encountered in this project.
> **Note for AI Assistant:** This file must ONLY be updated upon the user's explicit request. Do not update this file on your own initiative. However, when a problem or fix is encountered, you should proactively offer to record it in this file.

## Log of Problems and Fixes

| ID | Date | Problem Description | Fix / Resolution | Status |
|----|----|----|----|----|
| 001 | 2026-01-25 | Hardcoded Skill Logic | `analyze-project-zones` uses static X-coords (0, -40). Models with different origins or scales return incorrect zone classification. | Implement Bounding Box center calculation or relative coordinate logic in skills. | Resolved (Workaround) |
| 002 | 2026-01-25 | Parameter ID Variation | Piping "Size" parameter ID varies (Diameter vs Overall Size). Initial queries returned 'Unknown Size'. | Updated SQL to `COALESCE` multiple standard Revit Parameter IDs. | Resolved |
| 003 | 2026-01-25 | System Name Ambiguity | `System Name` on pipes returns abbreviations (e.g., "FP 15") instead of full names (e.g., "Fire Protection Deluge"). | Implemented a JOIN to the `Piping Systems` category using a scoped string match in SQL. | Resolved |
| 004 | 2026-01-25 | Global Join Multiplication | Global queries joining on System Name strings can multiply results if document_id is not strictly scoped in the join predicate. | Refined JOIN logic to include `document_id` matching for all parameters and relationships. | Resolved |
