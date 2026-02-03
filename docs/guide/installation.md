# RevitAtlas Installation Guide

## Prerequisites

- **Node.js 18+** - Required for running the MCP server
- **Revit 2021-2025** - Must be installed on Windows
- **An MCP-compatible AI client** - Claude Desktop, Cursor, Windsurf, Cline, etc.

## Quick Install (Recommended)

Run this command:

```bash
npm install -g revitatlas
```

This installs:
- The RevitAtlas MCP server executable
- The Revit plugin (auto-installs to all detected Revit versions)

## Configure Your AI Client

Add this to your MCP configuration file:

### Claude Desktop

Location: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "RevitAtlas": {
      "command": "revitatlas"
    }
  }
}
```

### Cursor

Location: `%APPDATA%\Cursor\User\globalStorage\cursor.mcp\mcp.json`

```json
{
  "mcpServers": {
    "RevitAtlas": {
      "command": "revitatlas"
    }
  }
}
```

### Windsurf / Cline / Other MCP Clients

Use the same format - check your client's documentation for the config location.

## Verify Installation

1. **Restart your AI client** after saving the config
2. **Open Revit** with a project
3. **Check for RevitAtlas** in the Add-ins tab (should show "Connected" status)
4. **Ask your AI** to "list all walls in this model" - if it responds with wall data, you're connected!

## Troubleshooting

### "Cannot find module" or "revitatlas not found"
- Ensure Node.js 18+ is installed: `node --version`
- Try reinstalling: `npm uninstall -g revitatlas && npm install -g revitatlas`

### "Connection refused" or tools not appearing
- Ensure Revit is open with a document
- Check only one Revit instance is running
- Restart both Revit and your AI client

### Plugin not loading in Revit
- Run `revitatlas setup` to reinstall the plugin
- Check `%APPDATA%\Autodesk\Revit\Addins\20XX\` for `RevitAtlas.addin`

## Uninstall

```bash
npm uninstall -g revitatlas
revitatlas uninstall  # removes plugin from Revit
```

## Need Help?

- [GitHub Issues](https://github.com/mroshdy91/RevitAtlas/issues)
- Run `revitatlas status` to see diagnostics
