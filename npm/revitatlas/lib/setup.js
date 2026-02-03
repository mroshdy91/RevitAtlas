import { existsSync, mkdirSync, copyFileSync, readdirSync, readFileSync, writeFileSync, rmSync, statSync } from "node:fs";
import { join, basename } from "node:path";
import { env, stdout, stdin } from "node:process";
import { createInterface } from "node:readline";
import { execSync } from "node:child_process";
import { getPluginDirectory, getSkillsDirectory, getDocumentsDirectory, getUserManualDirectory } from "./platform.js";

// ─── Constants ───────────────────────────────────────────────────────────────
const SUPPORTED_YEARS = ["2021", "2022", "2023", "2024", "2025", "2026"];
const PLUGIN_INSTALL_DIR = join(env.LOCALAPPDATA || "", "RevitAtlas", "plugin");
const CLIENT_ID = "B8E5A6C4-3D2F-4A1E-9B8C-7D6E5F4A3B2C";

// ─── ANSI Colors ─────────────────────────────────────────────────────────────
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
  bgCyan: "\x1b[46m",
  bgGreen: "\x1b[42m",
  bgRed: "\x1b[41m",
  bgYellow: "\x1b[43m",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAddinsPath(year) {
  return join(env.APPDATA || "", "Autodesk", "Revit", "Addins", year);
}

function detectRevitVersions() {
  const found = [];
  for (const year of SUPPORTED_YEARS) {
    if (existsSync(getAddinsPath(year))) {
      found.push(year);
    }
  }
  return found;
}

function isRevitRunning() {
  try {
    const result = execSync(
      'tasklist /FI "IMAGENAME eq Revit.exe" /NH',
      { encoding: "utf8", windowsHide: true }
    );
    return result.includes("Revit.exe");
  } catch {
    return false;
  }
}

function generateAddinManifest(pluginPath) {
  const assemblyPath = join(pluginPath, "RevitAtlas.dll");
  return `<?xml version="1.0" encoding="utf-8"?>
<RevitAddIns>
  <AddIn Type="Application">
    <Name>RevitAtlas</Name>
    <Assembly>${assemblyPath}</Assembly>
    <FullClassName>RevitAtlas.App</FullClassName>
    <AddInId>${CLIENT_ID}</AddInId>
    <VendorId>RevitAtlas</VendorId>
    <VendorDescription>RevitAtlas - MCP Server for Revit</VendorDescription>
  </AddIn>
</RevitAddIns>`;
}

function countSkills() {
  const skillsDir = getSkillsDirectory();
  if (!skillsDir) return { count: 0, names: [] };
  try {
    const names = readdirSync(skillsDir).filter((f) => {
      try { return existsSync(join(skillsDir, f, "SKILL.md")); } catch { return false; }
    });
    return { count: names.length, names };
  } catch {
    return { count: 0, names: [] };
  }
}

function countUserManualPages() {
  const manualDir = getUserManualDirectory();
  if (!manualDir) return 0;
  try {
    let count = 0;
    const countMdFiles = (dir) => {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          countMdFiles(join(dir, entry.name));
        } else if (entry.name.endsWith(".md")) {
          count++;
        }
      }
    };
    countMdFiles(manualDir);
    return count;
  } catch {
    return 0;
  }
}

function countDocuments() {
  const docsDir = getDocumentsDirectory();
  if (!docsDir) return { hasDocuments: false, skills: 0, manualPages: 0 };

  const skills = countSkills();
  const manualPages = countUserManualPages();

  return {
    hasDocuments: skills.count > 0 || manualPages > 0,
    skills: skills.count,
    skillNames: skills.names,
    manualPages
  };
}

function copyDirRecursive(src, dest) {
  mkdirSync(dest, { recursive: true });
  const entries = readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

/** Prompts user and returns their answer */
function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

/** Waits for a keypress (Enter) */
function waitForEnter(rl, prompt = `\n  Press ${c.bold}Enter${c.reset} to continue...`) {
  return new Promise((resolve) => {
    rl.question(prompt, () => resolve());
  });
}

function printHeader() {
  console.log();
  const a = `${c.cyan}${c.bold}`;
  const r = c.reset;
  console.log(`  ${a}         /\\${r}`);
  console.log(`  ${a}        /  \\${r}`);
  console.log(`  ${a}       / /\\ \\${r}`);
  console.log(`  ${a}      / /  \\ \\${r}`);
  console.log(`  ${a}     / /____\\ \\${r}`);
  console.log(`  ${a}    / /______\\ \\${r}`);
  console.log(`  ${a}   / /        \\ \\${r}`);
  console.log(`  ${a}  /_/          \\_\\${r}`);
  console.log();
  console.log(`  ${c.white}${c.bold}   R E V I T  A T L A S${r}`);
  console.log(`  ${c.cyan}${c.dim}     Navigate & Build${r}`);
  console.log();
}

function printDivider() {
  console.log(`  ${c.gray}──────────────────────────────────────────────────${c.reset}`);
}

function printStep(num, total, title) {
  console.log();
  console.log(`  ${c.cyan}${c.bold}[${num}/${total}]${c.reset} ${c.bold}${title}${c.reset}`);
  printDivider();
}

function printOK(msg) {
  console.log(`  ${c.green}✓${c.reset} ${msg}`);
}

function printWarn(msg) {
  console.log(`  ${c.yellow}!${c.reset} ${msg}`);
}

function printErr(msg) {
  console.log(`  ${c.red}✗${c.reset} ${msg}`);
}

function printInfo(msg) {
  console.log(`  ${c.gray}${msg}${c.reset}`);
}

// ─── Interactive Setup Wizard ────────────────────────────────────────────────

/**
 * Main interactive setup wizard — mimics the Inno Setup installer experience.
 * Guides user through Revit detection, component selection, and installation.
 */
export async function setup({ revitYear }) {
  const rl = createInterface({ input: stdin, output: stdout });

  try {
    // ── Welcome Screen ──
    printHeader();
    console.log(`  Welcome to the RevitAtlas Setup Wizard.`);
    console.log();
    console.log(`  This will install the RevitAtlas plugin for Autodesk Revit`);
    console.log(`  and configure it for use with AI assistants (Claude, Cursor).`);
    console.log();
    console.log(`  ${c.yellow}Please close Revit before continuing.${c.reset}`);

    // Skip interactive prompts if --revit flag is passed (non-interactive mode)
    const nonInteractive = !!revitYear;

    if (!nonInteractive) {
      await waitForEnter(rl);
    }

    const totalSteps = 5;

    // ── Step 1: Pre-flight Checks ──
    printStep(1, totalSteps, "Pre-flight Checks");

    // Check if Revit is running
    if (isRevitRunning()) {
      printWarn(`${c.yellow}Revit is currently running!${c.reset}`);
      console.log(`  Plugin files cannot be updated while Revit is open.`);
      console.log();
      if (!nonInteractive) {
        const answer = await ask(rl, `  Close Revit and continue? (${c.bold}y${c.reset}/n): `);
        if (answer.toLowerCase() === "n") {
          console.log(`\n  Setup cancelled. Close Revit and try again.`);
          return;
        }
        // Re-check
        if (isRevitRunning()) {
          printErr("Revit is still running. Please close it and run setup again.");
          return;
        }
      } else {
        printErr("Revit is running. Close it and try again.");
        return;
      }
    }
    printOK("Revit is not running");

    // Check plugin source
    const sourceDir = getPluginDirectory();
    if (!sourceDir) {
      printErr("Plugin files not found in @revitatlas/win32-x64 package.");
      printInfo("Try reinstalling: npm install -g revitatlas@latest");
      return;
    }
    printOK("Plugin package found");

    // Check documents (skills, user manual, etc.)
    const docs = countDocuments();
    if (docs.hasDocuments) {
      if (docs.skills > 0) {
        printOK(`${docs.skills} agentic skills available`);
      }
      if (docs.manualPages > 0) {
        printOK(`${docs.manualPages} user manual pages available`);
      }
    } else {
      printWarn("No documentation found in package");
    }

    // ── Step 2: Revit Version Detection ──
    printStep(2, totalSteps, "Revit Version Detection");

    let targetYears;
    if (nonInteractive) {
      // Non-interactive: use specified year
      if (!SUPPORTED_YEARS.includes(revitYear)) {
        printErr(`Revit ${revitYear} is not supported.`);
        printInfo(`Supported versions: ${SUPPORTED_YEARS.join(", ")}`);
        return;
      }
      if (!existsSync(getAddinsPath(revitYear))) {
        printErr(`Revit ${revitYear} addins folder not found.`);
        return;
      }
      targetYears = [revitYear];
      printOK(`Revit ${revitYear} (specified)`);
    } else {
      // Interactive: detect and let user choose
      console.log(`  Scanning for installed Revit versions...\n`);
      const detected = detectRevitVersions();

      if (detected.length === 0) {
        printWarn("No Revit installations detected.");
        printInfo("Expected: %APPDATA%\\Autodesk\\Revit\\Addins\\{year}");
        console.log();
        const answer = await ask(rl, `  Continue anyway? (y/${c.bold}n${c.reset}): `);
        if (answer.toLowerCase() !== "y") {
          console.log("\n  Setup cancelled.");
          return;
        }
        // Let user type a year manually
        const yearInput = await ask(rl, `\n  Enter Revit year to install for (e.g. 2025): `);
        if (SUPPORTED_YEARS.includes(yearInput)) {
          targetYears = [yearInput];
        } else {
          printErr(`"${yearInput}" is not a valid Revit year.`);
          return;
        }
      } else {
        // Show detected versions with toggle selection
        console.log(`  Detected Revit installations:\n`);
        const selection = {};
        for (const year of SUPPORTED_YEARS) {
          const installed = detected.includes(year);
          selection[year] = installed; // Pre-select installed versions
          const status = installed
            ? `${c.green}[x]${c.reset}`
            : `${c.gray}[ ]${c.reset}`;
          const label = installed
            ? `Revit ${year} ${c.green}(installed)${c.reset}`
            : `Revit ${year} ${c.gray}(not found)${c.reset}`;
          console.log(`    ${status} ${label}`);
        }

        console.log();
        const selectedYears = detected.join(", ");
        printInfo(`Auto-selected: ${selectedYears}`);
        console.log();
        const answer = await ask(rl, `  Install for these versions? (${c.bold}y${c.reset}/n/custom): `);

        if (answer.toLowerCase() === "n") {
          console.log("\n  Setup cancelled.");
          return;
        } else if (answer.toLowerCase() === "custom") {
          // Let user specify which years
          const customInput = await ask(rl, `  Enter Revit years (comma-separated, e.g. 2024,2025): `);
          targetYears = customInput
            .split(",")
            .map((y) => y.trim())
            .filter((y) => SUPPORTED_YEARS.includes(y));
          if (targetYears.length === 0) {
            printErr("No valid Revit years specified.");
            return;
          }
        } else {
          targetYears = detected;
        }
      }
    }

    console.log();
    for (const year of targetYears) {
      printOK(`Revit ${year} selected`);
    }

    // ── Step 3: Component Selection ──
    printStep(3, totalSteps, "Component Selection");

    let installPlugin = true;
    let installDocs = docs.hasDocuments;

    if (!nonInteractive) {
      console.log(`  Components to install:\n`);
      console.log(`    ${c.green}[x]${c.reset} ${c.bold}RevitAtlas Plugin${c.reset} ${c.gray}(required)${c.reset}`);
      console.log(`        Plugin DLL + dependencies for Revit`);
      if (docs.skills > 0) {
        console.log(`    ${c.green}[x]${c.reset} ${c.bold}Agentic Skills${c.reset} ${c.gray}(${docs.skills} skills)${c.reset}`);
        console.log(`        Pre-built SQL skills for Claude/Cursor`);
        for (const name of docs.skillNames) {
          console.log(`        ${c.gray}- ${name}${c.reset}`);
        }
      }
      if (docs.manualPages > 0) {
        console.log(`    ${c.green}[x]${c.reset} ${c.bold}User Manual${c.reset} ${c.gray}(${docs.manualPages} pages)${c.reset}`);
        console.log(`        Documentation for using RevitAtlas`);
      }
      console.log(`    ${c.green}[x]${c.reset} ${c.bold}MCP Server${c.reset} ${c.gray}(included in package)${c.reset}`);
      console.log(`        Runs automatically via 'revitatlas' command`);

      console.log();
      await waitForEnter(rl, `  Press ${c.bold}Enter${c.reset} to begin installation...`);
    }

    // ── Step 4: Installation ──
    printStep(4, totalSteps, "Installing Components");

    // 4a. Copy plugin files
    console.log(`\n  ${c.bold}Plugin files:${c.reset}`);
    try {
      mkdirSync(PLUGIN_INSTALL_DIR, { recursive: true });
      const files = readdirSync(sourceDir);
      let copied = 0;
      for (const file of files) {
        const src = join(sourceDir, file);
        // Skip directories — only copy files
        try {
          if (statSync(src).isDirectory()) continue;
        } catch { continue; }
        const dest = join(PLUGIN_INSTALL_DIR, file);
        copyFileSync(src, dest);
        copied++;
      }
      printOK(`Copied ${copied} files to ${PLUGIN_INSTALL_DIR}`);
    } catch (err) {
      printErr(`Failed to copy plugin files: ${err.message}`);
      return;
    }

    // 4b. Register with Revit versions
    console.log(`\n  ${c.bold}Revit registration:${c.reset}`);
    const addinContent = generateAddinManifest(PLUGIN_INSTALL_DIR);

    for (const year of targetYears) {
      const addinsPath = getAddinsPath(year);
      const addinFile = join(addinsPath, "RevitAtlas.addin");
      try {
        // Create addins dir if needed
        mkdirSync(addinsPath, { recursive: true });
        writeFileSync(addinFile, addinContent, "utf8");
        printOK(`Registered for Revit ${year}`);
      } catch (err) {
        printErr(`Failed for Revit ${year}: ${err.message}`);
      }
    }

    // 4c. Copy documentation to user Documents folder
    if (installDocs && docs.hasDocuments) {
      console.log(`\n  ${c.bold}Documentation:${c.reset}`);
      const userDocsDir = join(env.USERPROFILE || "", "Documents", "RevitAtlas");

      // Copy user manual
      const manualSrc = getUserManualDirectory();
      if (manualSrc && docs.manualPages > 0) {
        try {
          const manualDest = join(userDocsDir, "user-manual");
          copyDirRecursive(manualSrc, manualDest);
          printOK(`${docs.manualPages} user manual pages copied`);
          printInfo(`  ${manualDest}`);
        } catch (err) {
          printWarn(`Failed to copy user manual: ${err.message}`);
        }
      }

      // Copy skills
      const skillsSrc = getSkillsDirectory();
      if (skillsSrc && docs.skills > 0) {
        try {
          const skillsDest = join(userDocsDir, "skills");
          copyDirRecursive(skillsSrc, skillsDest);
          printOK(`${docs.skills} agentic skills copied`);
          printInfo(`  ${skillsDest}`);
        } catch (err) {
          printWarn(`Failed to copy skills: ${err.message}`);
        }
      }
    }

    // ── Step 5: Complete ──
    printStep(5, totalSteps, "Setup Complete");

    console.log();
    console.log(`  ${c.green}${c.bold}RevitAtlas has been installed successfully!${c.reset}`);
    console.log();
    console.log(`  ${c.bold}What's next:${c.reset}`);
    console.log();
    console.log(`    1. ${c.bold}Restart Revit${c.reset} to load the plugin`);
    console.log(`       The RevitAtlas tab will appear in the Revit ribbon.`);
    console.log();
    console.log(`    2. ${c.bold}Configure your AI tool:${c.reset}`);
    console.log(`       ${c.cyan}revitatlas config --claude${c.reset}   (Claude Desktop)`);
    console.log(`       ${c.cyan}revitatlas config --cursor${c.reset}   (Cursor)`);
    console.log();
    console.log(`    3. ${c.bold}Start the MCP server:${c.reset}`);
    console.log(`       ${c.cyan}revitatlas${c.reset}`);
    console.log();
    printDivider();
    console.log();
    const userDocsDir = join(env.USERPROFILE || "", "Documents", "RevitAtlas");
    console.log(`  ${c.bold}Installation summary:${c.reset}`);
    console.log(`    Plugin:     ${PLUGIN_INSTALL_DIR}`);
    console.log(`    Revit:      ${targetYears.map((y) => `${y}`).join(", ")}`);
    if (docs.skills > 0) {
      console.log(`    Skills:     ${userDocsDir}\\skills`);
    }
    if (docs.manualPages > 0) {
      console.log(`    Manual:     ${userDocsDir}\\user-manual`);
    }
    console.log();
  } finally {
    rl.close();
  }
}

// ─── Status Command ──────────────────────────────────────────────────────────

/**
 * Shows the current installation status.
 */
export async function showStatus() {
  printHeader();
  console.log(`  ${c.bold}Installation Status${c.reset}`);
  printDivider();

  // Check plugin files
  const pluginInstalled = existsSync(join(PLUGIN_INSTALL_DIR, "RevitAtlas.dll"));
  if (pluginInstalled) {
    printOK(`Plugin: Installed`);
    printInfo(`  ${PLUGIN_INSTALL_DIR}`);
  } else {
    printErr(`Plugin: Not installed`);
    printInfo(`  Run 'revitatlas setup' to install`);
  }

  // Check Revit registrations
  console.log();
  const versions = detectRevitVersions();
  if (versions.length === 0) {
    printWarn("No Revit installations detected");
  } else {
    console.log(`  ${c.bold}Revit registrations:${c.reset}`);
    for (const year of versions) {
      const addinFile = join(getAddinsPath(year), "RevitAtlas.addin");
      const registered = existsSync(addinFile);
      if (registered) {
        printOK(`Revit ${year}: Registered`);
      } else {
        printWarn(`Revit ${year}: Not registered`);
      }
    }
  }

  // Check server binary
  console.log();
  const { getServerBinaryPath } = await import("./platform.js");
  const binaryPath = getServerBinaryPath();
  if (binaryPath) {
    printOK(`MCP Server: Available`);
    printInfo(`  ${binaryPath}`);
  } else {
    printErr(`MCP Server: Not found`);
  }

  // Check documentation
  console.log();
  const docs = countDocuments();
  if (docs.hasDocuments) {
    if (docs.skills > 0) {
      printOK(`Agentic Skills: ${docs.skills} available`);
    }
    if (docs.manualPages > 0) {
      printOK(`User Manual: ${docs.manualPages} pages available`);
    }
    const docsDir = getDocumentsDirectory();
    if (docsDir) printInfo(`  ${docsDir}`);
  } else {
    printWarn(`Documentation: None found`);
  }

  // Check if Revit is running
  console.log();
  if (isRevitRunning()) {
    printOK(`Revit: Running`);
  } else {
    printInfo(`Revit: Not running`);
  }

  console.log();
}

// ─── Uninstall Command ───────────────────────────────────────────────────────

/**
 * Removes the plugin from all Revit versions and deletes plugin files.
 */
export async function uninstall() {
  const rl = createInterface({ input: stdin, output: stdout });

  try {
    printHeader();
    console.log(`  ${c.bold}${c.red}RevitAtlas Uninstall${c.reset}`);
    printDivider();
    console.log();
    console.log(`  This will remove the RevitAtlas plugin from your system.`);
    console.log();

    const answer = await ask(rl, `  Are you sure? (y/${c.bold}n${c.reset}): `);
    if (answer.toLowerCase() !== "y") {
      console.log("\n  Uninstall cancelled.");
      return;
    }

    // Check if Revit is running
    if (isRevitRunning()) {
      printWarn("Revit is running. Close it first for a clean uninstall.");
      const proceed = await ask(rl, `  Continue anyway? (y/${c.bold}n${c.reset}): `);
      if (proceed.toLowerCase() !== "y") {
        console.log("\n  Uninstall cancelled.");
        return;
      }
    }

    console.log();

    // Remove .addin files from all Revit versions
    const versions = detectRevitVersions();
    for (const year of versions) {
      const addinFile = join(getAddinsPath(year), "RevitAtlas.addin");
      if (existsSync(addinFile)) {
        try {
          rmSync(addinFile);
          printOK(`Removed from Revit ${year}`);
        } catch (err) {
          printErr(`Failed for Revit ${year}: ${err.message}`);
        }
      }
    }

    // Remove plugin directory
    if (existsSync(PLUGIN_INSTALL_DIR)) {
      try {
        rmSync(PLUGIN_INSTALL_DIR, { recursive: true, force: true });
        printOK(`Removed plugin files`);
      } catch (err) {
        printErr(`Failed to remove plugin files: ${err.message}`);
      }
    }

    console.log();
    printDivider();
    console.log();
    console.log(`  ${c.bold}Uninstall complete.${c.reset}`);
    console.log(`  Restart Revit to fully unload the plugin.`);
    console.log();
    printInfo("To reinstall: npm install -g revitatlas@latest && revitatlas setup");
    console.log();
  } finally {
    rl.close();
  }
}
