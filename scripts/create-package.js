#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Parse command line arguments
const args = process.argv.slice(2);
const packageName = args[0];
const packageType = args[1] || "standard"; // standard, ui, hook, util

if (!packageName) {
  console.error("❌ Error: Package name is required");
  console.log("\nUsage: pnpm create:package <package-name> [type]");
  console.log("\nTypes:");
  console.log("  standard (default) - Regular React Native package");
  console.log("  ui                 - UI component library");
  console.log("  hook               - Custom hooks package");
  console.log("  util               - Utility functions package");
  console.log("\nExample: pnpm create:package my-feature");
  process.exit(1);
}

// Validate package name
if (!/^[a-z0-9-]+$/.test(packageName)) {
  console.error("❌ Error: Package name must be lowercase with hyphens only");
  process.exit(1);
}

const rootDir = path.resolve(__dirname, "..");
const packagesDir = path.join(rootDir, "packages");
const packageDir = path.join(packagesDir, packageName);

// Check if package already exists
if (fs.existsSync(packageDir)) {
  console.error(`❌ Error: Package "${packageName}" already exists`);
  process.exit(1);
}

console.log(`\n🚀 Creating new package: @react-buoy/${packageName}`);
console.log(`   Type: ${packageType}`);
console.log(`   Location: packages/${packageName}\n`);

// Create package directory structure
const createDirectoryStructure = () => {
  console.log("📁 Creating directory structure...");

  fs.mkdirSync(packageDir, { recursive: true });
  fs.mkdirSync(path.join(packageDir, "src"), { recursive: true });

  if (packageType === "ui") {
    fs.mkdirSync(path.join(packageDir, "src", "components"), {
      recursive: true,
    });
    fs.mkdirSync(path.join(packageDir, "src", "styles"), { recursive: true });
  } else if (packageType === "hook") {
    fs.mkdirSync(path.join(packageDir, "src", "hooks"), { recursive: true });
  } else if (packageType === "util") {
    fs.mkdirSync(path.join(packageDir, "src", "utils"), { recursive: true });
  }
};

// Create package.json
const createPackageJson = () => {
  console.log("📝 Creating package.json...");

  const packageJson = {
    name: `@react-buoy/${packageName}`,
    version: "0.1.0",
    description: `${packageName} package`,
    main: "lib/commonjs/index.js",
    module: "lib/module/index.js",
    types: "lib/typescript/module/index.d.ts",
    exports: {
      ".": {
        source: "./src/index.ts",
        import: {
          default: "./lib/module/index.js",
          types: "./lib/typescript/module/index.d.ts",
        },
        require: {
          default: "./lib/commonjs/index.js",
          types: "./lib/typescript/commonjs/index.d.ts",
        },
      },
    },
    files: ["src", "lib"],
    sideEffects: false,
    scripts: {
      build: "bob build",
      typecheck: "tsc --noEmit",
      clean: "rimraf lib",
      test: "pnpm run typecheck",
      // Note: 'prepare' script will be added after first install
      postinstall: 'echo "Run pnpm build to compile this package"',
    },
    dependencies: {
      "@react-buoy/shared-ui": "workspace:*",
    },
    peerDependencies: {
      react: "*",
      "react-native": "*",
    },
    devDependencies: {
      "@types/react": "^19.1.0",
      "@types/react-native": "^0.73.0",
      typescript: "~5.8.3",
    },
    "react-native-builder-bob": {
      source: "src",
      output: "lib",
      targets: [
        [
          "commonjs",
          {
            esm: true,
          },
        ],
        [
          "module",
          {
            esm: true,
          },
        ],
        "typescript",
      ],
    },
  };

  fs.writeFileSync(
    path.join(packageDir, "package.json"),
    JSON.stringify(packageJson, null, 2) + "\n"
  );
};

// Create tsconfig.json
const createTsConfig = () => {
  console.log("📝 Creating tsconfig.json...");

  const tsConfig = {
    extends: "../../tsconfig.json",
    compilerOptions: {
      rootDir: "./src",
      outDir: "./lib/typescript",
    },
    include: ["src/**/*"],
    exclude: ["node_modules", "lib"],
  };

  fs.writeFileSync(
    path.join(packageDir, "tsconfig.json"),
    JSON.stringify(tsConfig, null, 2) + "\n"
  );
};

// Create index file based on package type
const createIndexFile = () => {
  const isReactComponent = packageType === "standard" || packageType === "ui";
  const fileName = isReactComponent ? "index.tsx" : "index.ts";

  console.log(`📝 Creating ${fileName}...`);

  let indexContent = "";

  switch (packageType) {
    case "ui":
      indexContent = `// Export all UI components
export * from './components';

// Re-export commonly used shared components if needed
export { Button, Card } from '@react-buoy/shared-ui';
`;
      break;

    case "hook":
      indexContent = `// Export all custom hooks
export * from './hooks';

// Re-export commonly used shared hooks if needed
export { useCounter, useToggle } from '@react-buoy/shared-ui';
`;
      break;

    case "util":
      indexContent = `// Export all utility functions
export * from './utils';

// Re-export commonly used shared utilities if needed
export { formatNumber, debounce } from '@react-buoy/shared-ui';
`;
      break;

    default:
      indexContent = `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface ${toPascalCase(packageName)}Props {
  title?: string;
}

export function ${toPascalCase(packageName)}Component({
  title = '${packageName} Component'
}: ${toPascalCase(packageName)}Props) {
  return (
    <View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>
        This is a new package created with create-package script
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
  },
});
`;
  }

  fs.writeFileSync(path.join(packageDir, "src", fileName), indexContent);
};

// Create additional files based on type
const createTypeSpecificFiles = () => {
  switch (packageType) {
    case "ui":
      console.log("📝 Creating UI component example...");
      fs.writeFileSync(
        path.join(packageDir, "src", "components", "index.ts"),
        `export * from './ExampleComponent';
`
      );

      fs.writeFileSync(
        path.join(packageDir, "src", "components", "ExampleComponent.tsx"),
        `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '@react-buoy/shared-ui';

export interface ExampleComponentProps {
  text?: string;
  onPress?: () => void;
}

export function ExampleComponent({
  text = 'Example Component',
  onPress
}: ExampleComponentProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{text}</Text>
      <Button title="Click Me" onPress={onPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  text: {
    fontSize: 16,
    marginBottom: 12,
  },
});
`
      );
      break;

    case "hook":
      console.log("📝 Creating hook example...");
      fs.writeFileSync(
        path.join(packageDir, "src", "hooks", "index.ts"),
        `export * from './useExample';
`
      );

      fs.writeFileSync(
        path.join(packageDir, "src", "hooks", "useExample.ts"),
        `import { useState, useCallback } from 'react';

export interface UseExampleReturn {
  value: string;
  updateValue: (newValue: string) => void;
  reset: () => void;
}

/**
 * Example custom hook
 * @param initialValue - Initial value for the hook
 * @returns Object with value and control functions
 */
export function useExample(initialValue = ''): UseExampleReturn {
  const [value, setValue] = useState(initialValue);

  const updateValue = useCallback((newValue: string) => {
    setValue(newValue);
  }, []);

  const reset = useCallback(() => {
    setValue(initialValue);
  }, [initialValue]);

  return {
    value,
    updateValue,
    reset,
  };
}
`
      );
      break;

    case "util":
      console.log("📝 Creating utility example...");
      fs.writeFileSync(
        path.join(packageDir, "src", "utils", "index.ts"),
        `export * from './helpers';
`
      );

      fs.writeFileSync(
        path.join(packageDir, "src", "utils", "helpers.ts"),
        `/**
 * Example utility function
 * @param input - Input string to process
 * @returns Processed string
 */
export function processString(input: string): string {
  return input.trim().toLowerCase();
}

/**
 * Example async utility
 * @param data - Data to process
 * @returns Promise with processed result
 */
export async function processAsync<T>(data: T): Promise<T> {
  // Simulate async processing
  await new Promise(resolve => setTimeout(resolve, 100));
  return data;
}
`
      );
      break;
  }
};

// Create README
const createReadme = () => {
  console.log("📝 Creating README.md...");

  const readmeContent = `# @react-buoy/${packageName}

## Description

${packageName} package for the monorepo.

## Installation

This package is part of the monorepo and is automatically available to other packages and the example app.

## Usage

\`\`\`typescript
import { ${toPascalCase(
    packageName
  )}Component } from '@react-buoy/${packageName}';

// Use in your component
<${toPascalCase(packageName)}Component title="Hello World" />
\`\`\`

## Development

### Building

\`\`\`bash
pnpm build
\`\`\`

### Type Checking

\`\`\`bash
pnpm typecheck
\`\`\`

### Clean Build

\`\`\`bash
pnpm clean
\`\`\`

## Structure

\`\`\`
${packageName}/
├── src/
│   └── index.ts        # Main export file
├── lib/                # Built output (git ignored)
├── package.json
├── tsconfig.json
└── README.md
\`\`\`

## Dependencies

- Uses \`@react-buoy/shared-ui\` for common components and utilities
- React and React Native as peer dependencies
`;

  fs.writeFileSync(path.join(packageDir, "README.md"), readmeContent);
};

// Create .gitignore
const createGitignore = () => {
  console.log("📝 Creating .gitignore...");

  const gitignoreContent = `# Dependencies
node_modules/

# Build output
lib/

# TypeScript
*.tsbuildinfo

# Testing
coverage/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
`;

  fs.writeFileSync(path.join(packageDir, ".gitignore"), gitignoreContent);
};

// Add package to example app dependencies
const addToExampleApp = () => {
  console.log("📝 Adding package to example app dependencies...");

  const examplePackageJsonPath = path.join(rootDir, "example", "package.json");

  if (fs.existsSync(examplePackageJsonPath)) {
    const examplePackageJson = JSON.parse(
      fs.readFileSync(examplePackageJsonPath, "utf8")
    );

    // Add the new package to dependencies
    examplePackageJson.dependencies[`@react-buoy/${packageName}`] = "workspace:*";

    // Sort dependencies alphabetically (keeping @react-buoy packages together)
    const sortedDeps = {};
    const reactBuoyPackages = [];
    const otherPackages = [];

    for (const [key, value] of Object.entries(
      examplePackageJson.dependencies
    )) {
      if (key.startsWith("@react-buoy/")) {
        reactBuoyPackages.push([key, value]);
      } else {
        otherPackages.push([key, value]);
      }
    }

    // Sort each group
    reactBuoyPackages.sort((a, b) => a[0].localeCompare(b[0]));
    otherPackages.sort((a, b) => a[0].localeCompare(b[0]));

    // Combine them
    [...reactBuoyPackages, ...otherPackages].forEach(([key, value]) => {
      sortedDeps[key] = value;
    });

    examplePackageJson.dependencies = sortedDeps;

    // Write back to file
    fs.writeFileSync(
      examplePackageJsonPath,
      JSON.stringify(examplePackageJson, null, 2) + "\n"
    );

    console.log("✅ Added to example app dependencies");
  } else {
    console.log("⚠️  Example app not found, skipping dependency addition");
  }
};

// Helper function to convert kebab-case to PascalCase
function toPascalCase(str) {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

// Main execution
try {
  createDirectoryStructure();
  createPackageJson();
  createTsConfig();
  createIndexFile();
  createTypeSpecificFiles();
  createReadme();
  createGitignore();
  addToExampleApp();

  console.log("\n✅ Package created successfully!");

  // Run pnpm install to link the new package
  console.log("\n📦 Installing dependencies...");
  try {
    execSync("pnpm install", {
      cwd: rootDir,
      stdio: "inherit",
    });
    console.log("✅ Dependencies installed");
  } catch (error) {
    console.log("⚠️  Failed to run pnpm install automatically");
    console.log("   Please run manually: pnpm install");
  }

  // Build the new package
  console.log(`\n🔨 Building @react-buoy/${packageName}...`);
  try {
    execSync(`pnpm --filter @react-buoy/${packageName} build`, {
      cwd: rootDir,
      stdio: "inherit",
    });
    console.log("✅ Package built successfully");
  } catch (error) {
    console.log("⚠️  Failed to build package automatically");
    console.log(
      `   Please run manually: pnpm --filter @react-buoy/${packageName} build`
    );
  }

  console.log("\n💡 To use in the example app:");
  console.log(
    `   import { ${toPascalCase(
      packageName
    )}Component } from '@react-buoy/${packageName}';`
  );
  console.log("\n🔥 Package is ready and hot reload is configured!");
} catch (error) {
  console.error("\n❌ Error creating package:", error.message);

  // Clean up on error
  if (fs.existsSync(packageDir)) {
    fs.rmSync(packageDir, { recursive: true, force: true });
  }

  process.exit(1);
}
