# RevitAtlas

**Connect AI assistants to Autodesk Revit via the Model Context Protocol (MCP).**

RevitAtlas enables Claude Desktop, Cursor, and other MCP-compatible AI tools to query, modify, and create BIM elements in Revit through natural language. The server exposes **66+ tools** for interacting with Revit models.

---

## Quick Install

### For Humans

Copy and paste this prompt to your LLM agent (Claude Code, Cursor, Windsurf, etc.):

> Install and configure RevitAtlas by following the instructions here:
> https://raw.githubusercontent.com/mroshdy91/RevitAtlas/main/docs/guide/installation.md

Or read the [Installation Guide](docs/guide/installation.md) directly—but we strongly recommend letting an agent handle it. Humans make mistakes.

### For LLM Agents

Fetch the installation guide and follow it:

```bash
curl -s https://raw.githubusercontent.com/mroshdy91/RevitAtlas/main/docs/guide/installation.md
```

---

## Installation

```bash
npm install -g revitatlas
```

**Requirements:** Windows x64, Node.js 18+, Autodesk Revit 2021-2026.

### Updating to Latest Version

```bash
npm install -g revitatlas@latest
```

Or force a clean reinstall:

```bash
npm uninstall -g revitatlas && npm install -g revitatlas
```

---

## Quick Start

### 1. Install the Revit Plugin

```bash
revitatlas setup
```

The setup wizard auto-detects installed Revit versions and installs the plugin. To target a specific version:

```bash
revitatlas setup --revit 2025
```

### 2. Configure Your AI Tool

**Claude Desktop:**
```bash
revitatlas config --claude
```

**Cursor:**
```bash
revitatlas config --cursor
```

This prints the JSON snippet to add to your MCP configuration file.

### 3. Start the Server

```bash
revitatlas
```

The MCP server starts and waits for Revit to connect on port 8090. Open Revit and the plugin connects automatically.

### 4. Use It

Open Claude Desktop or Cursor and start asking questions about your Revit model:

- *"How many doors are on each level?"*
- *"Show me all walls thicker than 300mm"*
- *"Find clashes between ducts and structural framing"*
- *"What's the total area of all floors?"*
- *"Trace the supply air path from AHU-1"*

---

## Features

### Standard Mode (50 tools)
Granular Revit API operations: query elements, set parameters, move/copy/rotate elements, manage views, graphic overrides, worksets.

### Turbo Mode (5 tools)
SQL queries against model snapshots via DuckDB. Extract your model to Parquet files, then run analytical queries across 12 data tables with sub-second response times.

### Spatial Intelligence Engine (9 tools)
Advanced spatial analysis pre-computed during snapshot extraction:
- **Proximity & Containment** - Find elements near a point or inside a room
- **Clash Detection** - Pre-computed interference detection with severity levels
- **Scene Graph** - Spatial relationships (hosts, above/below, contains)
- **MEP Flow Tracing** - Trace upstream/downstream through duct and pipe systems
- **Code Compliance** - NEC 110.26 (electrical), ADA 404.2 (doors), ADA 604 (plumbing) clearance checking
- **Visibility & Paths** - Line-of-sight analysis and path corridor checking

### Live Execution Engine (2 tools)
Real-time interaction with live Revit data:
- **Live SQL** - Auto-routes to fast path (~200ms) or full SQL (~5s) based on query complexity
- **C# Scripts** - Execute C# code inside Revit via Roslyn with transaction safety (read-only, auto-commit, dry-run)

---

## CLI Reference

| Command | Description |
|---------|-------------|
| `revitatlas` | Start the MCP server |
| `revitatlas setup` | Install the Revit plugin (interactive wizard) |
| `revitatlas setup --revit 2025` | Install for a specific Revit version |
| `revitatlas config --claude` | Print Claude Desktop MCP config |
| `revitatlas config --cursor` | Print Cursor MCP config |
| `revitatlas status` | Check plugin installation and connection status |
| `revitatlas uninstall` | Remove the plugin from all Revit versions |
| `revitatlas --version` | Show version |
| `revitatlas --help` | Show help |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REVIT_ATLAS_PORT` | `8090` | TCP port for Revit plugin connection |
| `REVIT_ATLAS_LOG_LEVEL` | `info` | Log level: `debug`, `info`, `warn`, `error` |
| `REVIT_ATLAS_SNAPSHOT_PATH` | `%LOCALAPPDATA%\RevitAtlas\snapshots` | Parquet snapshot storage location |
| `REVIT_ATLAS_MAX_ROWS` | `10000` | Maximum query result rows |

---

## Troubleshooting

### Plugin not loading in Revit
- Run `revitatlas status` to verify installation
- Ensure Revit was restarted after running `revitatlas setup`
- Check the Revit Add-ins tab for "RevitAtlas"
- Review Revit journal files for load errors

### Connection issues
- Ensure only one Revit instance is running
- Check if port 8090 is available: `netstat -an | findstr 8090`
- Review logs at `%LOCALAPPDATA%\RevitAtlas\logs\`

### Reinstalling
```bash
npm uninstall -g revitatlas
npm install -g revitatlas@latest
revitatlas setup
```

For more troubleshooting tips, see [docs/troubleshooting.md](docs/troubleshooting.md).

---

## Safety

RevitAtlas implements safety-first design:

- **Read-only SQL** - Snapshot queries block destructive SQL statements
- **Script sandboxing** - Two-layer validation (static blocklist + runtime sandbox)
- **Transaction safety** - Scripts default to read-only; dry-run mode for previewing changes
- **Blocked namespaces** - `System.IO`, `System.Net`, `System.Diagnostics.Process`, `System.Reflection.Emit`
- **Batch limits** - 1000 elements per request (configurable)
- **Atomic writes** - Partial snapshots are never visible

---

## License

[MIT](LICENSE)

---

## Links

- [Changelog](CHANGELOG.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Report an Issue](https://github.com/mroshdy91/RevitAtlas/issues)

