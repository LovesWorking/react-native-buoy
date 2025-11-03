#!/usr/bin/env node

/**
 * Unified update notifier for all @react-buoy packages
 * 
 * This is a SHARED script used by all packages via their postinstall hooks.
 * Location: /scripts/postinstall.js (root of monorepo)
 * 
 * Strategy:
 * - All @react-buoy packages are version-locked (same version)
 * - Checks @react-buoy/core as reference package
 * - Shows notification ONCE even if multiple packages install
 * - Finds package.json dynamically (works from any package)
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

// Find the nearest package.json (the package being installed)
function findPackageJson() {
  let dir = __dirname;
  
  // Try different possible locations
  const possiblePaths = [
    path.join(dir, "../package.json"),           // From /scripts
    path.join(dir, "../../package.json"),        // From /scripts in monorepo
    path.join(process.cwd(), "package.json"),    // Current working directory
  ];
  
  for (const pkgPath of possiblePaths) {
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
        // Verify it's a @react-buoy package
        if (pkg.name && pkg.name.startsWith("@react-buoy/")) {
          return pkg;
        }
      } catch (error) {
        // Continue searching
      }
    }
  }
  
  // Fallback: return minimal package info
  return { name: "@react-buoy/core", version: "0.0.0" };
}

const pkg = findPackageJson();
const CURRENT_VERSION = pkg.version;
const PACKAGE_NAME = pkg.name;

// Always check @react-buoy/core as the reference package
const REFERENCE_PACKAGE = "@react-buoy/core";
const REGISTRY_URL = `https://registry.npmjs.org/${REFERENCE_PACKAGE}/latest`;

// ANSI color codes
const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
};

/**
 * Detect which package manager is being used
 * Based on npm's standard detection method
 */
function detectPackageManager() {
  const userAgent = process.env.npm_config_user_agent || "";
  
  if (userAgent.includes("yarn")) return "yarn";
  if (userAgent.includes("pnpm")) return "pnpm";
  if (userAgent.includes("bun")) return "bun";
  
  // Default to npm
  return "npm";
}

/**
 * Get the update command for the detected package manager
 */
function getUpdateCommand(packageManager) {
  switch (packageManager) {
    case "yarn":
      return "yarn upgrade '@react-buoy/*'";
    case "pnpm":
      return "pnpm update '@react-buoy/*'";
    case "bun":
      return "bun update '@react-buoy/*'";
    case "npm":
    default:
      return "npm update '@react-buoy/*'";
  }
}

function compareVersions(current, latest) {
  const currentParts = current.split(".").map(Number);
  const latestParts = latest.split(".").map(Number);

  for (let i = 0; i < 3; i++) {
    if (latestParts[i] > currentParts[i]) return 1;
    if (latestParts[i] < currentParts[i]) return -1;
  }
  return 0;
}

function checkForUpdates() {
  // Skip in CI environments
  if (process.env.CI || process.env.NODE_ENV === "test") {
    return;
  }

  // Skip if not a real install (e.g., during workspace setup)
  if (process.env.npm_config_global) {
    return;
  }

  // Create a lock file to prevent duplicate notifications
  const lockFile = path.join(
    require("os").tmpdir(),
    ".react-buoy-update-check"
  );

  try {
    // Check if we recently showed a notification (within last 60 seconds)
    if (fs.existsSync(lockFile)) {
      const lockTime = fs.statSync(lockFile).mtime.getTime();
      const now = Date.now();
      if (now - lockTime < 60000) {
        // Already showed notification recently, skip
        return;
      }
    }
  } catch (error) {
    // Ignore lock file errors
  }

  https
    .get(REGISTRY_URL, { timeout: 3000 }, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const latestVersion = JSON.parse(data).version;

          if (compareVersions(CURRENT_VERSION, latestVersion) < 0) {
            // Create/update lock file
            try {
              fs.writeFileSync(lockFile, new Date().toISOString());
            } catch (error) {
              // Ignore
            }

            // Detect package manager and get appropriate command
            const packageManager = detectPackageManager();
            const updateCommand = getUpdateCommand(packageManager);

            // Strip ANSI codes for length calculation
            const stripAnsi = (str) => str.replace(/\x1b\[[0-9;]*m/g, "");

            // Build the notification messages
            const messages = [
              "",
              `${COLORS.yellow}⚠${COLORS.reset}  Your React Native DevTools have an update available!`,
              "",
              `${COLORS.dim}Current version:${COLORS.reset} ${CURRENT_VERSION}`,
              `${COLORS.green}Latest version:${COLORS.reset}  ${COLORS.bright}${latestVersion}${COLORS.reset}`,
              "",
              `${COLORS.dim}All @react-buoy packages are version-locked and should be updated together.${COLORS.reset}`,
              "",
              `${COLORS.dim}Run this command to update all packages:${COLORS.reset}`,
              `${COLORS.bright}${updateCommand}${COLORS.reset}`,
              "",
            ];

            // Calculate box width based on longest line (after stripping ANSI codes)
            const maxLength = Math.max(...messages.map((m) => stripAnsi(m).length));
            const boxWidth = maxLength + 4; // Add padding
            const line = "─".repeat(boxWidth);

            console.log("");
            console.log(`${COLORS.cyan}${COLORS.bright}╭${line}╮${COLORS.reset}`);
            
            messages.forEach((msg) => {
              const plainText = stripAnsi(msg);
              const padding = " ".repeat(boxWidth - plainText.length);
              console.log(`${COLORS.cyan}${COLORS.bright}│${COLORS.reset}  ${msg}${padding}${COLORS.cyan}${COLORS.bright}│${COLORS.reset}`);
            });
            
            console.log(`${COLORS.cyan}${COLORS.bright}╰${line}╯${COLORS.reset}`);
            console.log("");
          }
        } catch (error) {
          // Silently fail
        }
      });
    })
    .on("error", () => {
      // Silently fail
    })
    .on("timeout", () => {
      // Silently fail
    });
}

checkForUpdates();

