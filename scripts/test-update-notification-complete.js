#!/usr/bin/env node

/**
 * Comprehensive Update Notification Test
 * 
 * This single script:
 * 1. Runs automated tests (21 checks)
 * 2. Shows the visual demo
 * 3. Verifies everything works
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
  bright: "\x1b[1m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function section(title) {
  log(`\n${"=".repeat(80)}`, colors.cyan);
  log(title, colors.bright);
  log(`${"=".repeat(80)}\n`, colors.cyan);
}

section("🧪 Update Notification System - Comprehensive Test");

log("This will:", colors.yellow);
log("  1. Run 21 automated tests", colors.dim);
log("  2. Show you the visual notification", colors.dim);
log("  3. Verify everything is ready to push\n", colors.dim);

// Step 1: Run automated tests
section("Step 1: Running Automated Tests");

try {
  const testOutput = execSync("node tests/update-notification.test.js", {
    cwd: path.join(__dirname, ".."),
    encoding: "utf8",
  });
  
  console.log(testOutput);
  
  if (testOutput.includes("All tests passed")) {
    log("✅ All automated tests passed!\n", colors.green);
  } else {
    log("⚠️  Some tests may have issues. Review output above.\n", colors.yellow);
  }
} catch (error) {
  log("❌ Automated tests failed!", colors.red);
  log(error.message, colors.dim);
  process.exit(1);
}

// Step 2: Show visual demo
section("Step 2: Visual Notification Demo");

log("This is what users will see:\n", colors.dim);

try {
  const demoOutput = execSync("node scripts/demo-notification.js", {
    cwd: path.join(__dirname, ".."),
    encoding: "utf8",
  });
  
  console.log(demoOutput);
} catch (error) {
  log("❌ Demo failed!", colors.red);
  log(error.message, colors.dim);
  process.exit(1);
}

// Step 3: Final verification
section("Step 3: Final Verification");

const checks = [
  {
    name: "Shared script exists",
    test: () => fs.existsSync(path.join(__dirname, "postinstall.js")),
  },
  {
    name: "No duplicate scripts in packages",
    test: () => {
      const packagesDir = path.join(__dirname, "../packages");
      const packages = fs.readdirSync(packagesDir).filter((name) => {
        const pkgPath = path.join(packagesDir, name);
        return fs.statSync(pkgPath).isDirectory();
      });
      
      for (const pkg of packages) {
        const scriptsDir = path.join(packagesDir, pkg, "scripts");
        if (fs.existsSync(scriptsDir)) {
          return false;
        }
      }
      return true;
    },
  },
  {
    name: "Build system works",
    test: () => {
      try {
        execSync("pnpm build:packages", {
          cwd: path.join(__dirname, ".."),
          stdio: "pipe",
        });
        return true;
      } catch {
        return false;
      }
    },
  },
];

let allPassed = true;

for (const check of checks) {
  try {
    const result = check.test();
    if (result) {
      log(`✅ ${check.name}`, colors.green);
    } else {
      log(`❌ ${check.name}`, colors.red);
      allPassed = false;
    }
  } catch (error) {
    log(`❌ ${check.name} - ${error.message}`, colors.red);
    allPassed = false;
  }
}

// Final summary
section("✅ Test Summary");

if (allPassed) {
  log("🎉 All checks passed! You're ready to push!", colors.green);
  log("", colors.reset);
  log("Next steps:", colors.cyan);
  log("  git add .", colors.dim);
  log("  git commit -m \"feat: update notification system\"", colors.dim);
  log("  git push", colors.dim);
  log("", colors.reset);
  process.exit(0);
} else {
  log("⚠️  Some checks failed. Please review the output above.", colors.yellow);
  log("", colors.reset);
  process.exit(1);
}

