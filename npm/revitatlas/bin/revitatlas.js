#!/usr/bin/env node

import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { argv, exit, env } from "node:process";
import { fileURLToPath } from "node:url";
import { getServerBinaryPath, getModulesDirectory, getSkillsDirectory, getDocumentsDirectory } from "../lib/platform.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = argv.slice(2);
const command = args[0];

async function main() {
  switch (command) {
    case "setup":
      await runSetup(args.slice(1));
      break;
    case "config":
      await runConfig(args.slice(1));
      break;
    case "status":
      await runStatus();
      break;
    case "uninstall":
      await runUninstall();
      break;
    case "version":
    case "--version":
    case "-v":
      printVersion();
      break;
    case "help":
    case "--help":
    case "-h":
      printHelp();
      break;
    default:
      // Default: start the MCP server
      await startServer(args);
      break;
  }
}

async function startServer(serverArgs) {
  const binaryPath = getServerBinaryPath();
  if (!binaryPath) {
    console.error(
      "Error: RevitAtlas server binary not found.\n" +
        "Try reinstalling: npm install -g revitatlas@latest"
    );
    exit(1);
  }

  // Set up environment so the server binary can locate native modules and documents
  const modulesDir = getModulesDirectory();
  const skillsDir = getSkillsDirectory();
  const docsDir = getDocumentsDirectory();
  const childEnv = { ...env };
  if (modulesDir) {
    childEnv.REVIT_ATLAS_MODULES_PATH = modulesDir;
  }
  if (skillsDir) {
    childEnv.REVIT_ATLAS_SKILLS_PATH = skillsDir;
  }
  if (docsDir) {
    childEnv.REVIT_ATLAS_DOCUMENTS_PATH = docsDir;
  }

  const child = spawn(binaryPath, serverArgs, {
    stdio: "inherit",
    env: childEnv,
    windowsHide: false,
  });

  child.on("error", (err) => {
    console.error(`Failed to start RevitAtlas server: ${err.message}`);
    exit(1);
  });

  child.on("exit", (code) => {
    exit(code ?? 0);
  });
}

async function runSetup(setupArgs) {
  const { setup } = await import("../lib/setup.js");
  const revitYear = parseRevitYear(setupArgs);
  await setup({ revitYear });
}

async function runConfig(configArgs) {
  const { generateConfig } = await import("../lib/config.js");
  const target = configArgs[0]; // --claude, --cursor, or undefined
  generateConfig(target);
}

async function runStatus() {
  const { showStatus } = await import("../lib/setup.js");
  await showStatus();
}

async function runUninstall() {
  const { uninstall } = await import("../lib/setup.js");
  await uninstall();
}

function parseRevitYear(args) {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--revit" && args[i + 1]) {
      return args[i + 1];
    }
  }
  return null; // auto-detect all versions
}

function printVersion() {
  try {
    const pkg = JSON.parse(
      readFileSync(join(__dirname, "..", "package.json"), "utf8")
    );
    console.log(`revitatlas v${pkg.version}`);
  } catch {
    console.log("revitatlas v1.0.0");
  }
}

function printHelp() {
  console.log(`
RevitAtlas - Connect AI assistants to Autodesk Revit via MCP

Usage:
  revitatlas                       Start the MCP server
  revitatlas setup                 Auto-detect Revit and install plugin
  revitatlas setup --revit 2025    Install plugin for specific Revit version
  revitatlas config --claude       Print Claude Desktop config snippet
  revitatlas config --cursor       Print Cursor config snippet
  revitatlas status                Check plugin installation status
  revitatlas uninstall             Remove plugin from all Revit versions
  revitatlas --version             Show version
  revitatlas --help                Show this help

Environment Variables:
  REVIT_ATLAS_PORT        TCP port for Revit connection (default: 8090)
  REVIT_ATLAS_LOG_LEVEL   Log level: debug, info, warn, error (default: info)

Documentation: https://github.com/mroshdy91/RevitAtlas
`);
}

main().catch((err) => {
  console.error(err.message || err);
  exit(1);
});
