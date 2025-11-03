#!/usr/bin/env node

/**
 * Visual Demo: Force Show Update Notification
 * 
 * This creates a MOCK notification to show you exactly what users will see.
 * It doesn't actually check npm - it just renders the notification box.
 */

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
};

const CURRENT_VERSION = "0.1.10";  // Simulated old version
const LATEST_VERSION = "0.1.17";   // Simulated new version
const UPDATE_COMMAND = "pnpm update '@react-buoy/*'"; // Example command

console.log("\n");
console.log(`${colors.cyan}${colors.bright}${"=".repeat(80)}${colors.reset}`);
console.log(`${colors.cyan}${colors.bright}🎬 VISUAL DEMO: Update Notification${colors.reset}`);
console.log(`${colors.cyan}${colors.bright}${"=".repeat(80)}${colors.reset}`);
console.log("");
console.log(`${colors.dim}This is what users will see when they have an old version:${colors.reset}`);
console.log(`${colors.dim}(The actual command shown will match their package manager)${colors.reset}`);
console.log("");

// Strip ANSI codes for accurate length calculation
const stripAnsi = (str) => str.replace(/\x1b\[[0-9;]*m/g, "");

// Build the notification messages (same as real script)
const messages = [
  "",
  `${colors.yellow}⚠${colors.reset}  Your React Native DevTools have an update available!`,
  "",
  `${colors.dim}Current version:${colors.reset} ${CURRENT_VERSION}`,
  `${colors.green}Latest version:${colors.reset}  ${colors.bright}${LATEST_VERSION}${colors.reset}`,
  "",
  `${colors.dim}All @react-buoy packages are version-locked and should be updated together.${colors.reset}`,
  "",
  `${colors.dim}Run this command to update all packages:${colors.reset}`,
  `${colors.bright}${UPDATE_COMMAND}${colors.reset}`,
  "",
];

// Calculate box width based on longest line (after stripping ANSI codes)
const maxLength = Math.max(...messages.map((m) => stripAnsi(m).length));
const boxWidth = maxLength + 4; // Add padding
const line = "─".repeat(boxWidth);

console.log(`${colors.cyan}${colors.bright}╭${line}╮${colors.reset}`);

messages.forEach((msg) => {
  const plainText = stripAnsi(msg);
  const padding = " ".repeat(boxWidth - plainText.length);
  console.log(`${colors.cyan}${colors.bright}│${colors.reset}  ${msg}${padding}${colors.cyan}${colors.bright}│${colors.reset}`);
});

console.log(`${colors.cyan}${colors.bright}╰${line}╯${colors.reset}`);

console.log("");
console.log(`${colors.green}${colors.bright}✅ This is EXACTLY what users will see!${colors.reset}`);
console.log("");
console.log(`${colors.cyan}Scenario simulated:${colors.reset}`);
console.log(`  ${colors.dim}• User has version: ${CURRENT_VERSION}${colors.reset}`);
console.log(`  ${colors.dim}• npm has version: ${LATEST_VERSION}${colors.reset}`);
console.log(`  ${colors.dim}• User runs: npm install @react-buoy/core${colors.reset}`);
console.log(`  ${colors.dim}• Notification appears automatically ✨${colors.reset}`);
console.log("");

console.log(`${colors.cyan}${colors.bright}${"=".repeat(70)}${colors.reset}`);
console.log("");

