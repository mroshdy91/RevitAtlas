import { env } from "node:process";
import { join } from "node:path";

/**
 * Generates MCP configuration snippets for different AI assistants.
 */
export function generateConfig(target) {
  switch (target) {
    case "--claude":
      printClaudeConfig();
      break;
    case "--cursor":
      printCursorConfig();
      break;
    default:
      printClaudeConfig();
      console.log("---\n");
      printCursorConfig();
      break;
  }
}

function printClaudeConfig() {
  const configPath = join(
    env.APPDATA || "",
    "Claude",
    "claude_desktop_config.json"
  );

  console.log("Claude Desktop Configuration");
  console.log("============================\n");
  console.log(`Add this to: ${configPath}\n`);
  console.log(
    JSON.stringify(
      {
        mcpServers: {
          revitatlas: {
            command: "revitatlas",
          },
        },
      },
      null,
      2
    )
  );
  console.log(
    '\nIf you already have other MCP servers configured, just add the "revitatlas" entry'
  );
  console.log('inside the existing "mcpServers" object.');
}

function printCursorConfig() {
  const configPath = join(
    env.USERPROFILE || "",
    ".cursor",
    "mcp.json"
  );

  console.log("Cursor Configuration");
  console.log("====================\n");
  console.log(`Add this to: ${configPath}\n`);
  console.log(
    JSON.stringify(
      {
        mcpServers: {
          revitatlas: {
            command: "revitatlas",
          },
        },
      },
      null,
      2
    )
  );
  console.log(
    '\nIf you already have other MCP servers configured, just add the "revitatlas" entry'
  );
  console.log('inside the existing "mcpServers" object.');
}
