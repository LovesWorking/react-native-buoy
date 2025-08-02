#!/usr/bin/env node

/**
 * JSX Transform Checker and Fixer
 *
 * This script checks for outdated JSX transform patterns and can automatically fix them.
 *
 * Issues it detects:
 * 1. Unnecessary `import React from 'react'` statements
 * 2. Manual `React.createElement` calls
 * 3. Files with JSX that don't need React import with modern transform
 *
 * Usage:
 *   node check-jsx-transform.js --check         # Check only (no changes)
 *   node check-jsx-transform.js --fix           # Check and fix issues
 *   node check-jsx-transform.js --help          # Show help
 */

const fs = require("fs");
const path = require("path");

class JSXTransformChecker {
  constructor() {
    this.results = {
      filesChecked: 0,
      unnecessaryReactImports: [],
      createElementCalls: [],
      filesWithJSXButNoReactUsage: [],
      summary: {},
    };
  }

  /**
   * Main entry point
   */
  async run(options = {}) {
    const { fix = false, check = true } = options;

    console.log("🔍 Checking JSX transform usage...\n");

    // Start from src directory
    const srcDir = path.join(process.cwd(), "src");
    if (!fs.existsSync(srcDir)) {
      console.error(
        "❌ src directory not found. Run this script from project root."
      );
      process.exit(1);
    }

    await this.scanDirectory(srcDir, fix);
    this.printResults(fix);

    return this.results;
  }

  /**
   * Recursively scan directory for JS/TS files
   */
  async scanDirectory(dirPath, fix = false) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and other irrelevant directories
        if (!["node_modules", ".git", "dist", "build"].includes(entry.name)) {
          await this.scanDirectory(fullPath, fix);
        }
      } else if (this.isReactFile(entry.name)) {
        await this.checkFile(fullPath, fix);
      }
    }
  }

  /**
   * Check if file is a React component file
   */
  isReactFile(filename) {
    const reactExtensions = [".tsx", ".jsx", ".ts", ".js"];
    return reactExtensions.some((ext) => filename.endsWith(ext));
  }

  /**
   * Check individual file for JSX transform issues
   */
  async checkFile(filePath, fix = false) {
    this.results.filesChecked++;

    try {
      const content = fs.readFileSync(filePath, "utf8");
      const lines = content.split("\n");

      const analysis = this.analyzeFile(content, lines, filePath);

      if (analysis.hasIssues) {
        if (fix) {
          await this.fixFile(filePath, content, analysis);
        }
        this.recordIssues(filePath, analysis);
      }
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }

  /**
   * Analyze file content for JSX transform issues
   */
  analyzeFile(content, lines, filePath) {
    const analysis = {
      hasIssues: false,
      unnecessaryReactImport: null,
      createElementCalls: [],
      hasJSX: false,
      usesReactDirectly: false,
      importLineIndex: -1,
    };

    // Check for JSX usage
    analysis.hasJSX = /<[A-Z]/.test(content) || /<[a-z]/.test(content);

    // Check for React.createElement calls
    const createElementMatches = content.match(/React\.createElement\(/g);
    if (createElementMatches) {
      analysis.createElementCalls = createElementMatches;
      analysis.hasIssues = true;
    }

    // Check for direct React usage (beyond JSX)
    const reactUsagePatterns = [
      /React\.Component/,
      /React\.PureComponent/,
      /React\.memo/,
      /React\.forwardRef/,
      /React\.useEffect/,
      /React\.useState/,
      /React\.useCallback/,
      /React\.useMemo/,
      /React\.useRef/,
      /React\.useContext/,
      /React\.createContext/,
      /React\.Fragment/,
      /React\.StrictMode/,
      /React\.Suspense/,
      /React\.lazy/,
      /React\.cloneElement/,
      /React\.isValidElement/,
      /React\.Children/,
    ];

    analysis.usesReactDirectly = reactUsagePatterns.some((pattern) =>
      pattern.test(content)
    );

    // Check for React import
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Match various React import patterns
      const reactImportPatterns = [
        /^import\s+React\s+from\s+['"]react['"];?\s*$/,
        /^import\s+React\s*,\s*\{[^}]*\}\s+from\s+['"]react['"];?\s*$/,
        /^import\s+\*\s+as\s+React\s+from\s+['"]react['"];?\s*$/,
      ];

      if (reactImportPatterns.some((pattern) => pattern.test(trimmedLine))) {
        analysis.importLineIndex = index;

        // Check if this React import is unnecessary
        if (
          analysis.hasJSX &&
          !analysis.usesReactDirectly &&
          !createElementMatches
        ) {
          analysis.unnecessaryReactImport = {
            line: index + 1,
            content: trimmedLine,
          };
          analysis.hasIssues = true;
        }
      }
    });

    return analysis;
  }

  /**
   * Fix issues in a file
   */
  async fixFile(filePath, content, analysis) {
    let lines = content.split("\n");
    let modified = false;

    // Remove unnecessary React import
    if (analysis.unnecessaryReactImport && analysis.importLineIndex >= 0) {
      const line = lines[analysis.importLineIndex];

      // Check if it's a combined import like: import React, { useState } from 'react'
      const combinedImportMatch = line.match(
        /^import\s+React\s*,\s*(\{[^}]*\})\s+from\s+['"]react['"];?\s*$/
      );

      if (combinedImportMatch) {
        // Keep the named imports, remove React default import
        lines[
          analysis.importLineIndex
        ] = `import ${combinedImportMatch[1]} from 'react';`;
      } else {
        // Remove the entire line if it's just React default import
        lines.splice(analysis.importLineIndex, 1);
      }

      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, lines.join("\n"));
      console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
    }
  }

  /**
   * Record issues found in analysis
   */
  recordIssues(filePath, analysis) {
    const relativePath = path.relative(process.cwd(), filePath);

    if (analysis.unnecessaryReactImport) {
      this.results.unnecessaryReactImports.push({
        file: relativePath,
        line: analysis.unnecessaryReactImport.line,
        content: analysis.unnecessaryReactImport.content,
      });
    }

    if (analysis.createElementCalls.length > 0) {
      this.results.createElementCalls.push({
        file: relativePath,
        count: analysis.createElementCalls.length,
      });
    }

    if (
      analysis.hasJSX &&
      !analysis.usesReactDirectly &&
      !analysis.unnecessaryReactImport
    ) {
      this.results.filesWithJSXButNoReactUsage.push({
        file: relativePath,
      });
    }
  }

  /**
   * Print results summary
   */
  printResults(fixed = false) {
    console.log("\n📊 JSX Transform Analysis Results");
    console.log("================================\n");

    console.log(`📁 Files checked: ${this.results.filesChecked}`);

    // Unnecessary React imports
    if (this.results.unnecessaryReactImports.length > 0) {
      console.log(
        `\n❌ Unnecessary React imports found: ${this.results.unnecessaryReactImports.length}`
      );
      this.results.unnecessaryReactImports.forEach((item) => {
        const status = fixed ? "✅ FIXED" : "⚠️  FOUND";
        console.log(`   ${status} ${item.file}:${item.line} - ${item.content}`);
      });

      if (!fixed) {
        console.log(
          "\n💡 These imports can be removed with modern JSX transform."
        );
        console.log("   Run with --fix flag to automatically remove them.");
      }
    }

    // React.createElement calls
    if (this.results.createElementCalls.length > 0) {
      console.log(
        `\n❌ Manual React.createElement calls found: ${this.results.createElementCalls.length} files`
      );
      this.results.createElementCalls.forEach((item) => {
        console.log(`   ⚠️  ${item.file} - ${item.count} calls`);
      });
      console.log("\n💡 Consider refactoring these to use JSX syntax.");
    }

    // Files with JSX but no React usage
    if (this.results.filesWithJSXButNoReactUsage.length > 0) {
      console.log(
        `\n✅ Files correctly using modern JSX transform: ${this.results.filesWithJSXButNoReactUsage.length}`
      );
      if (process.env.VERBOSE) {
        this.results.filesWithJSXButNoReactUsage.forEach((item) => {
          console.log(`   ✅ ${item.file}`);
        });
      }
    }

    // Summary
    const totalIssues =
      this.results.unnecessaryReactImports.length +
      this.results.createElementCalls.length;

    if (totalIssues === 0) {
      console.log(
        "\n🎉 No JSX transform issues found! Your app is using modern JSX transform correctly."
      );
    } else {
      console.log(
        `\n📋 Summary: ${totalIssues} issue(s) found${
          fixed ? " and fixed" : ""
        }`
      );

      if (!fixed) {
        console.log("\nTo fix automatically run:");
        console.log("  node check-jsx-transform.js --fix");
      }
    }

    // Configuration check
    console.log("\n🔧 Configuration Check:");
    this.checkConfiguration();
  }

  /**
   * Check project configuration
   */
  checkConfiguration() {
    // Check tsconfig.json
    const tsconfigPath = path.join(process.cwd(), "tsconfig.json");
    if (fs.existsSync(tsconfigPath)) {
      try {
        const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf8"));
        const jsxSetting = tsconfig.compilerOptions?.jsx;

        if (jsxSetting === "react-jsx" || jsxSetting === "react-jsxdev") {
          console.log(
            `   ✅ tsconfig.json: jsx set to "${jsxSetting}" (modern transform)`
          );
        } else {
          console.log(
            `   ⚠️  tsconfig.json: jsx set to "${jsxSetting}" (consider "react-jsx")`
          );
        }
      } catch (error) {
        console.log("   ❌ Error reading tsconfig.json");
      }
    }

    // Check package.json for React version
    const packagePath = path.join(process.cwd(), "package.json");
    if (fs.existsSync(packagePath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
        const reactVersion =
          pkg.dependencies?.react ||
          pkg.devDependencies?.react ||
          pkg.peerDependencies?.react;

        if (reactVersion) {
          // Extract version number
          const versionMatch = reactVersion.match(/(\d+)/);
          const majorVersion = versionMatch ? parseInt(versionMatch[1]) : 0;

          if (majorVersion >= 17) {
            console.log(
              `   ✅ React version: ${reactVersion} (supports modern JSX transform)`
            );
          } else {
            console.log(
              `   ⚠️  React version: ${reactVersion} (upgrade to 17+ for modern JSX transform)`
            );
          }
        }
      } catch (error) {
        console.log("   ❌ Error reading package.json");
      }
    }
  }
}

// CLI handling
function showHelp() {
  console.log(`
JSX Transform Checker and Fixer

Usage:
  node check-jsx-transform.js [options]

Options:
  --check     Check for issues without fixing (default)
  --fix       Check and automatically fix issues
  --help      Show this help message

Environment Variables:
  VERBOSE=1   Show detailed output including all files checked

Examples:
  node check-jsx-transform.js --check
  node check-jsx-transform.js --fix
  VERBOSE=1 node check-jsx-transform.js --check
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    return;
  }

  const options = {
    check: !args.includes("--fix"),
    fix: args.includes("--fix"),
  };

  const checker = new JSXTransformChecker();
  const results = await checker.run(options);

  // Exit with error code if issues found and not fixed
  const totalIssues =
    results.unnecessaryReactImports.length + results.createElementCalls.length;
  if (totalIssues > 0 && !options.fix) {
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
}

module.exports = { JSXTransformChecker };
