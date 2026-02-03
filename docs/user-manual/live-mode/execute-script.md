# execute_script

Execute C# scripts inside Revit via Roslyn compiler.

## Overview

`execute_script` runs C# code directly in the Revit process. It provides access to the full Revit API through global variables and supports three transaction modes for safe data modification.

## When to Use

- Bulk parameter updates
- Geometric clash detection
- Linked document queries
- Element renumbering
- Custom operations not covered by other tools
- Any write operation

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `script` | string | * | - | Custom C# code |
| `template` | string | * | - | Pre-built template name |
| `template_params` | object | ** | - | Template parameters |
| `transaction_mode` | enum | No | `read_only` | "read_only", "auto_commit", "dry_run" |
| `timeout_ms` | number | No | 30000 | Timeout (1000-120000) |
| `list_templates` | boolean | No | - | Returns available templates |

*One of `script` or `template` is required.
**Required when using `template`.

## Transaction Modes

| Mode | Description | Revit Changes | Use Case |
|------|-------------|---------------|----------|
| `read_only` | No transaction created | None | Querying data |
| `auto_commit` | Commits on success | Permanent | Modifying data |
| `dry_run` | Always rolls back | None (rolled back) | Testing changes |

## Global Variables

Available in all scripts:

| Variable | Type | Description |
|----------|------|-------------|
| `doc` | `Document` | Active Revit document |
| `uiDoc` | `UIDocument` | UI document |
| `app` | `UIApplication` | Revit application |
| `Return(obj)` | Method | Return a value |
| `Log(msg)` | Method | Log a message |

## Response Format

```json
{
  "success": true,
  "result": { ... },
  "logs": ["Processing 50 elements...", "Complete."],
  "execution_time_ms": 1200,
  "transaction_mode": "auto_commit",
  "elements_modified": 50
}
```

## Pre-Built Templates

### 1. count_by_category

Count elements grouped by category.

```json
{
  "tool": "execute_script",
  "params": {
    "template": "count_by_category",
    "template_params": {}
  }
}
```

Response:
```json
{
  "result": {
    "Walls": 520,
    "Doors": 180,
    "Windows": 120
  }
}
```

### 2. bulk_parameter_update

Set a parameter value for all elements in a category.

```json
{
  "tool": "execute_script",
  "params": {
    "template": "bulk_parameter_update",
    "template_params": {
      "category_name": "Doors",
      "parameter_name": "Comments",
      "new_value": "Reviewed 2026"
    },
    "transaction_mode": "auto_commit"
  }
}
```

Parameters:
| Param | Type | Description |
|-------|------|-------------|
| `category_name` | string | Target category |
| `parameter_name` | string | Parameter to update |
| `new_value` | string | New value |

### 3. detect_clashes

Find geometric clashes between two categories.

```json
{
  "tool": "execute_script",
  "params": {
    "template": "detect_clashes",
    "template_params": {
      "category_a": "Ducts",
      "category_b": "Structural Framing"
    }
  }
}
```

Parameters:
| Param | Type | Description |
|-------|------|-------------|
| `category_a` | string | First category |
| `category_b` | string | Second category |

### 4. query_linked_model

Query elements in linked Revit documents.

```json
{
  "tool": "execute_script",
  "params": {
    "template": "query_linked_model",
    "template_params": {
      "link_name": "Structural Model",
      "category_name": "Structural Columns"
    }
  }
}
```

Parameters:
| Param | Type | Description |
|-------|------|-------------|
| `link_name` | string | Link document name (partial match) |
| `category_name` | string | Category to query |

### 5. get_geometry

Extract geometry data for elements.

```json
{
  "tool": "execute_script",
  "params": {
    "template": "get_geometry",
    "template_params": {
      "element_ids": [123456, 234567]
    }
  }
}
```

Parameters:
| Param | Type | Description |
|-------|------|-------------|
| `element_ids` | number[] | Element IDs to analyze |

### 6. renumber_elements

Renumber element Mark values.

```json
{
  "tool": "execute_script",
  "params": {
    "template": "renumber_elements",
    "template_params": {
      "category_name": "Doors",
      "prefix": "D-",
      "start_number": 100
    },
    "transaction_mode": "auto_commit"
  }
}
```

Parameters:
| Param | Type | Description |
|-------|------|-------------|
| `category_name` | string | Category to renumber |
| `prefix` | string | Mark prefix |
| `start_number` | number | Starting number |

### 7. find_duplicates

Detect duplicate elements at the same location.

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

Parameters:
| Param | Type | Description |
|-------|------|-------------|
| `category_name` | string | Category to check |

## Custom Scripts

### Basic Custom Script

```json
{
  "tool": "execute_script",
  "params": {
    "script": "var walls = new FilteredElementCollector(doc).OfCategory(BuiltInCategory.OST_Walls).WhereElementIsNotElementType().ToElements(); Return(new { count = walls.Count });",
    "transaction_mode": "read_only"
  }
}
```

### Read Parameters

```json
{
  "tool": "execute_script",
  "params": {
    "script": "var doors = new FilteredElementCollector(doc).OfCategory(BuiltInCategory.OST_Doors).WhereElementIsNotElementType().ToElements(); var result = doors.Select(d => new { id = d.Id.IntegerValue, name = d.Name, mark = d.LookupParameter(\"Mark\")?.AsString() }).ToList(); Return(result);"
  }
}
```

### Modify Elements

```json
{
  "tool": "execute_script",
  "params": {
    "script": "var doors = new FilteredElementCollector(doc).OfCategory(BuiltInCategory.OST_Doors).WhereElementIsNotElementType().ToElements(); int count = 0; foreach(var door in doors) { var param = door.LookupParameter(\"Comments\"); if(param != null && !param.IsReadOnly) { param.Set(\"Verified\"); count++; } } Return(new { modified = count });",
    "transaction_mode": "auto_commit"
  }
}
```

### Query Linked Model

```json
{
  "tool": "execute_script",
  "params": {
    "script": "var links = new FilteredElementCollector(doc).OfClass(typeof(RevitLinkInstance)).Cast<RevitLinkInstance>().ToList(); var result = links.Select(l => new { name = l.Name, id = l.Id.IntegerValue }).ToList(); Return(result);"
  }
}
```

## Script Writing Guide

### Available Namespaces

```csharp
using Autodesk.Revit.DB;
using Autodesk.Revit.DB.Architecture;
using Autodesk.Revit.DB.Mechanical;
using Autodesk.Revit.DB.Plumbing;
using Autodesk.Revit.DB.Electrical;
using System;
using System.Linq;
using System.Collections.Generic;
```

### Common Patterns

**Filter elements by category:**
```csharp
var elements = new FilteredElementCollector(doc)
    .OfCategory(BuiltInCategory.OST_Doors)
    .WhereElementIsNotElementType()
    .ToElements();
```

**Get parameter value:**
```csharp
var param = element.LookupParameter("Mark");
var value = param?.AsString();
```

**Set parameter value (requires auto_commit):**
```csharp
var param = element.LookupParameter("Comments");
param.Set("New Value");
```

**Get element location:**
```csharp
var location = element.Location as LocationPoint;
var point = location.Point; // XYZ
```

**Return data:**
```csharp
Return(new {
    count = elements.Count,
    items = elements.Select(e => new {
        id = e.Id.IntegerValue,
        name = e.Name
    }).ToList()
});
```

## Safety Restrictions

### Blocked Operations

| Operation | Reason |
|-----------|--------|
| System.IO (file access) | Security |
| System.Net (network) | Security |
| System.Diagnostics.Process | Security |
| Reflection.Emit | Security |
| Registry access | Security |

### Two-Layer Validation

1. **MCP Server** (`scriptValidator.ts`): Static analysis before sending
2. **Revit Plugin** (`ScriptValidator.cs`): Runtime validation in sandbox

### Compilation Caching

Scripts are compiled once and cached (50 entries). Repeated execution of the same script skips compilation.

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `COMPILATION_ERROR` | Invalid C# syntax | Fix script code |
| `RUNTIME_ERROR` | Exception during execution | Check script logic |
| `BLOCKED_OPERATION` | Safety violation | Remove restricted operation |
| `TIMEOUT` | Script too slow | Optimize or increase timeout |
| `TRANSACTION_ERROR` | Can't commit changes | Check element editability |

## Workflow: Safe Modification

```javascript
// 1. Test with dry_run
const test = await execute_script({
  template: "bulk_parameter_update",
  template_params: {
    category_name: "Doors",
    parameter_name: "Comments",
    new_value: "Test"
  },
  transaction_mode: "dry_run"
});

console.log(`Would modify ${test.elements_modified} elements`);

// 2. If safe, commit
const result = await execute_script({
  template: "bulk_parameter_update",
  template_params: {
    category_name: "Doors",
    parameter_name: "Comments",
    new_value: "Reviewed 2026"
  },
  transaction_mode: "auto_commit"
});

// 3. Verify
const verify = await live_query({
  sql: "SELECT * FROM elements WHERE category_name = 'Doors'"
});
```

## Related Tools

- [live_query](live-query.md) - SQL queries for reads
- [snapshot_query](../turbo-mode/snapshot-query.md) - Cached analytics
- [snapshot_extract](../turbo-mode/snapshot-extract.md) - Full extraction

## Agent Skill Hints

1. **Template first** - Use pre-built templates when possible
2. **dry_run always** - Test before committing
3. **Small batches** - Don't modify thousands at once
4. **Return results** - Always Return() something useful
5. **Use Log()** - Debug complex scripts
6. **Check permissions** - Some parameters are read-only
7. **Verify after** - Use live_query to confirm changes
