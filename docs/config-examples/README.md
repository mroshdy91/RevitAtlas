# MCP Configuration Examples

This directory contains sample configuration files for different MCP clients.

## Files

| File | Client | Location |
|------|--------|----------|
| `claude_desktop_config.json` | Claude Desktop | `%APPDATA%\Claude\claude_desktop_config.json` |
| `cursor_mcp.json` | Cursor | Settings > Extensions > MCP |
| `opencode.json` | OpenCode | Project root `opencode.json` |

## Setup Instructions

### 1. Update Paths

Replace `C:\path\to\RevitAtlas` with the actual path to your RevitAtlas installation:

```json
"args": ["C:\\actual\\path\\to\\RevitAtlas\\mcp-server\\dist\\index.js"]
```

### 2. Build the MCP Server

Before using these configs, ensure the MCP server is built:

```bash
cd mcp-server
npm install
npm run build
```

### 3. Install the Revit Plugin

Copy the plugin files to your Revit add-ins folder:

```
%APPDATA%\Autodesk\Revit\Addins\2024\
```

Required files:
- `RevitAtlas.dll`
- `RevitAtlas.addin`

### 4. Verify Connection

1. Open Revit with a project
2. Open your MCP client (Claude Desktop, Cursor, etc.)
3. Look for Revit tools in the available tools list

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REVIT_MCP_HOST` | 127.0.0.1 | Revit plugin host (localhost only) |
| `REVIT_MCP_PORT` | 8080 | Revit plugin TCP port |
| `REVIT_MCP_TIMEOUT` | 120000 | Request timeout in milliseconds |
| `REVIT_MCP_LOG_LEVEL` | info | Log level: debug, info, warn, error |

## Troubleshooting

### Connection Issues

1. Ensure Revit is running with a document open
2. Check if port 8080 is available: `netstat -an | findstr 8080`
3. Review logs at `%LOCALAPPDATA%\RevitAtlas\logs\`

### Tools Not Appearing

1. Verify the MCP server path is correct
2. Check that Node.js is installed: `node --version`
3. Ensure `npm run build` completed successfully
4. Check your MCP client's logs for errors
