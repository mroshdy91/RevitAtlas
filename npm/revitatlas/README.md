# RevitAtlas

Connect AI assistants to Autodesk Revit via the Model Context Protocol (MCP).

RevitAtlas enables Claude Desktop, Cursor, and other MCP-compatible AI tools to query, modify, and create BIM elements in Revit through natural language. The server exposes **66+ tools** for interacting with Revit models.

## Installation

```bash
npm install -g revitatlas
```

**Requirements:** Windows x64, Node.js 18+, Autodesk Revit 2021-2026.

## Setup

### 1. Install the Revit Plugin

```bash
revitatlas setup
```

The setup wizard will auto-detect installed Revit versions and install the plugin.

To install for a specific version:

```bash
revitatlas setup --revit 2025
```

### 2. Configure Your AI Tool

```bash
revitatlas config --claude    # Claude Desktop
revitatlas config --cursor    # Cursor
```

This prints the JSON snippet to add to your MCP configuration file.

### 3. Start the Server

```bash
revitatlas
```

The server starts and waits for Revit to connect on port 8090. Open Revit and the plugin connects automatically.

## CLI Commands

| Command | Description |
|---------|-------------|
| `revitatlas` | Start the MCP server |
| `revitatlas setup` | Install the Revit plugin |
| `revitatlas setup --revit 2025` | Install for a specific Revit version |
| `revitatlas config --claude` | Print Claude Desktop config |
| `revitatlas config --cursor` | Print Cursor config |
| `revitatlas status` | Check installation status |
| `revitatlas uninstall` | Remove the plugin from Revit |
| `revitatlas --version` | Show version |
| `revitatlas --help` | Show help |

## Features

- **Standard Mode** - 50 tools for granular Revit operations (get/set parameters, move elements, create views)
- **Turbo Mode** - SQL queries against model snapshots via DuckDB for fast analytics
- **Spatial Intelligence** - Clash detection, MEP flow tracing, clearance checking, line-of-sight analysis
- **Live Execution** - SQL against live data and C# script execution inside Revit

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REVIT_ATLAS_PORT` | 8090 | TCP port for Revit connection |
| `REVIT_ATLAS_LOG_LEVEL` | info | Log level (debug, info, warn, error) |

## Troubleshooting

### Plugin not loading in Revit
- Run `revitatlas status` to verify installation
- Ensure Revit was restarted after setup
- Check the Revit Add-ins tab for "RevitAtlas"

### Connection issues
- Ensure only one Revit instance is running
- Check if port 8090 is available: `netstat -an | findstr 8090`
- Try `revitatlas --log-level debug` for detailed logs

### Reinstalling
```bash
npm uninstall -g revitatlas
npm install -g revitatlas
revitatlas setup
```

## Links

- [Documentation](https://github.com/mroshdy91/RevitAtlas)
- [Report an Issue](https://github.com/mroshdy91/RevitAtlas/issues)
- [Changelog](https://github.com/mroshdy91/RevitAtlas/blob/main/CHANGELOG.md)

## License

See [LICENSE](./LICENSE) for details.
