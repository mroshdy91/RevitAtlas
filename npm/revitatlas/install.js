/**
 * Postinstall script for the revitatlas npm package.
 * Verifies that the platform-specific binary package was installed correctly.
 * This runs automatically after `npm install`.
 */

import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { platform, arch } from "node:process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));

function verify() {
  // Check platform
  if (platform !== "win32") {
    console.warn(
      "\n" +
        "  Warning: RevitAtlas only supports Windows (Revit is Windows-only).\n" +
        `  Current platform: ${platform}\n`
    );
    return;
  }

  if (arch !== "x64") {
    console.warn(
      "\n" +
        "  Warning: RevitAtlas requires x64 architecture.\n" +
        `  Current architecture: ${arch}\n`
    );
    return;
  }

  // Try to find the platform package
  const require = createRequire(import.meta.url);
  let pkgDir;
  try {
    const pkgJson = require.resolve("@revitatlas/win32-x64/package.json");
    pkgDir = dirname(pkgJson);
  } catch {
    console.warn(
      "\n" +
        "  Warning: @revitatlas/win32-x64 package not found.\n" +
        "  The RevitAtlas binary may not have been installed correctly.\n" +
        "\n" +
        "  Try reinstalling with:\n" +
        "    npm install -g revitatlas@latest\n" +
        "\n" +
        "  If you used --no-optional, the binary package was skipped.\n" +
        "  RevitAtlas requires optional dependencies to function.\n"
    );
    return;
  }

  // Check that the binary exists
  const binaryPath = join(pkgDir, "bin", "revitatlas-server.exe");
  if (!existsSync(binaryPath)) {
    console.warn(
      "\n" +
        "  Warning: revitatlas-server.exe not found in platform package.\n" +
        "  Expected at: " + binaryPath + "\n" +
        "\n" +
        "  Try reinstalling: npm install -g revitatlas@latest\n"
    );
    return;
  }

  console.log(
    "\n" +
      "  RevitAtlas installed successfully!\n" +
      "\n" +
      "  Quick start:\n" +
      "    revitatlas setup     Install the Revit plugin\n" +
      "    revitatlas config    Get MCP configuration\n" +
      "    revitatlas --help    Show all commands\n"
  );
}

verify();
