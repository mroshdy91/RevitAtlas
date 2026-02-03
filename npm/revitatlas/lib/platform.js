import { createRequire } from "node:module";
import { join, dirname } from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Resolves path to the platform-specific binary package.
 * Tries require.resolve first (standard npm install), then falls back
 * to checking common global install locations.
 */
function findPlatformPackage() {
  const require = createRequire(import.meta.url);
  const packageName = "@revitatlas/win32-x64";

  // Method 1: Standard require.resolve
  try {
    const pkgJson = require.resolve(`${packageName}/package.json`);
    return dirname(pkgJson);
  } catch {
    // Not found via require.resolve
  }

  // Method 2: Check sibling directory (for local development)
  const sibling = join(__dirname, "..", "..", packageName.replace("/", "+"));
  if (existsSync(sibling)) {
    return sibling;
  }

  return null;
}

/**
 * Returns the absolute path to the revitatlas-server executable.
 */
export function getServerBinaryPath() {
  const pkgDir = findPlatformPackage();
  if (!pkgDir) {
    return null;
  }
  const binary = join(pkgDir, "bin", "revitatlas-server.exe");
  return existsSync(binary) ? binary : null;
}

/**
 * Returns the absolute path to the plugin directory containing
 * RevitAtlas.dll and all its dependencies.
 */
export function getPluginDirectory() {
  const pkgDir = findPlatformPackage();
  if (!pkgDir) {
    return null;
  }
  const pluginDir = join(pkgDir, "plugin");
  return existsSync(pluginDir) ? pluginDir : null;
}

/**
 * Returns the absolute path to the DuckDB modules directory.
 */
export function getModulesDirectory() {
  const pkgDir = findPlatformPackage();
  if (!pkgDir) {
    return null;
  }
  const modulesDir = join(pkgDir, "modules");
  return existsSync(modulesDir) ? modulesDir : null;
}

/**
 * Returns the absolute path to the documents directory containing
 * skills, user-manual, workflows, and other documentation.
 */
export function getDocumentsDirectory() {
  const pkgDir = findPlatformPackage();
  if (!pkgDir) {
    return null;
  }
  const docsDir = join(pkgDir, "documents");
  return existsSync(docsDir) ? docsDir : null;
}

/**
 * Returns the absolute path to the skills directory containing
 * agentic skills (SKILL.md files and SQL queries).
 */
export function getSkillsDirectory() {
  const docsDir = getDocumentsDirectory();
  if (!docsDir) {
    return null;
  }
  const skillsDir = join(docsDir, "skills");
  return existsSync(skillsDir) ? skillsDir : null;
}

/**
 * Returns the absolute path to the user manual directory.
 */
export function getUserManualDirectory() {
  const docsDir = getDocumentsDirectory();
  if (!docsDir) {
    return null;
  }
  const manualDir = join(docsDir, "user-manual");
  return existsSync(manualDir) ? manualDir : null;
}
