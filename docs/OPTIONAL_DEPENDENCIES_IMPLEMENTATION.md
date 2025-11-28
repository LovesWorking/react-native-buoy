# Implementing Zero-Config Optional Dependencies in React Native

> A practical guide for library authors who need to support optional peer dependencies (like `expo-clipboard` vs `@react-native-clipboard/clipboard`) without requiring users to modify their Metro configuration.

## Table of Contents

1. [The Problem](#the-problem)
2. [The Solution: Postinstall Detection](#the-solution-postinstall-detection)
3. [Step-by-Step Implementation](#step-by-step-implementation)
4. [Complete Code Examples](#complete-code-examples)
5. [Do's and Don'ts](#dos-and-donts)
6. [Troubleshooting](#troubleshooting)
7. [Alternative Approaches (Not Recommended)](#alternative-approaches-not-recommended)

---

## The Problem

When building React Native libraries that need to support both Expo and React Native CLI projects, you often encounter optional dependencies. For example:

- **Expo projects** use `expo-clipboard`
- **RN CLI projects** use `@react-native-clipboard/clipboard`

### Why This Is Hard

Metro bundler performs **static analysis at build time**, creating a catch-22:

| Approach | Problem |
|----------|---------|
| Static imports: `import X from "expo-clipboard"` | Metro tries to resolve the module. If not installed, **build fails**. |
| Dynamic imports: `require(variableName)` | Metro can't statically analyze, so it **doesn't bundle the module** even if installed. |
| Try-catch with require: `try { require("expo-clipboard") } catch {}` | Requires `allowOptionalDependencies: true` in Metro config - **user must modify their config**. |

### What We Need

A solution where:
1. ✅ No user configuration required (zero-config)
2. ✅ Works in both Expo and RN CLI projects
3. ✅ Metro sees only static imports
4. ✅ Gracefully degrades if no dependency is installed

---

## The Solution: Postinstall Detection

The solution is to detect which optional dependency is installed **at install time** (not bundle time) and generate a file with the appropriate static import.

### How It Works

```
npm install @your-library/package
         ↓
   postinstall script runs
         ↓
   Detects: expo-clipboard installed? @react-native-clipboard/clipboard installed?
         ↓
   Generates: clipboard-impl.ts with correct static import
         ↓
   Metro bundles: Sees only static imports, works perfectly
```

### Why This Works

1. **Detection at install time** - Not bundle time, so no Metro involvement
2. **Static imports only** - Metro can analyze and bundle correctly
3. **No config needed** - Works with default Metro configuration
4. **Any Metro version** - No reliance on experimental features

---

## Step-by-Step Implementation

### Step 1: Create the Detection Script

Create `scripts/detect-clipboard.js` in your package:

```javascript
#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const OUTPUT_FILE = path.join(__dirname, "..", "src", "clipboard", "clipboard-impl.ts");

function moduleExists(name) {
  try {
    require.resolve(name);
    return true;
  } catch (e) {
    return false;
  }
}

let content;
let detectedModule;

if (moduleExists("expo-clipboard")) {
  detectedModule = "expo-clipboard";
  content = `// Generated file - DO NOT EDIT
import { setStringAsync } from "expo-clipboard";

export const clipboardType = "expo" as const;
export const isClipboardAvailable = () => true;

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await setStringAsync(text);
    return true;
  } catch (error) {
    console.error("Clipboard copy failed:", error);
    return false;
  }
}
`;
} else if (moduleExists("@react-native-clipboard/clipboard")) {
  detectedModule = "@react-native-clipboard/clipboard";
  content = `// Generated file - DO NOT EDIT
import Clipboard from "@react-native-clipboard/clipboard";

export const clipboardType = "react-native" as const;
export const isClipboardAvailable = () => true;

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    Clipboard.setString(text);
    return true;
  } catch (error) {
    console.error("Clipboard copy failed:", error);
    return false;
  }
}
`;
} else {
  detectedModule = null;
  content = `// Generated file - DO NOT EDIT
// No clipboard library detected

export const clipboardType = null;
export const isClipboardAvailable = () => false;

export async function copyToClipboard(text: string): Promise<boolean> {
  console.warn("No clipboard library installed. Install expo-clipboard or @react-native-clipboard/clipboard.");
  return false;
}
`;
}

// Ensure directory exists
const dir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(OUTPUT_FILE, content);
console.log(`Clipboard configured: ${detectedModule || "none"}`);
```

### Step 2: Update package.json

Add the postinstall script and include the scripts folder in published files:

```json
{
  "scripts": {
    "postinstall": "node scripts/detect-clipboard.js",
    "prepublishOnly": "node scripts/detect-clipboard.js && bob build"
  },
  "files": [
    "src",
    "lib",
    "scripts"
  ],
  "peerDependencies": {
    "expo-clipboard": "*",
    "@react-native-clipboard/clipboard": "*"
  },
  "peerDependenciesMeta": {
    "expo-clipboard": {
      "optional": true
    },
    "@react-native-clipboard/clipboard": {
      "optional": true
    }
  }
}
```

### Step 3: Create Type Declarations

Create `src/types/optionalModules.d.ts` to provide TypeScript types for optional modules:

```typescript
declare module "@react-native-clipboard/clipboard" {
  const Clipboard: {
    setString(text: string): void;
    getString(): Promise<string>;
  };
  export default Clipboard;
}

declare module "expo-clipboard" {
  export function setStringAsync(text: string): Promise<void>;
  export function getStringAsync(): Promise<string>;
}
```

### Step 4: Create the Public API

Create a wrapper file that re-exports from the generated file:

```typescript
// src/clipboard/index.ts
export {
  copyToClipboard,
  clipboardType,
  isClipboardAvailable,
} from "./clipboard-impl";
```

### Step 5: Add to .gitignore

The generated file should not be committed:

```gitignore
# Generated clipboard implementation (created by postinstall)
packages/shared/src/clipboard/clipboard-impl.ts
```

### Step 6: Generate Initial File for Development

Run the script once to generate the initial file:

```bash
node scripts/detect-clipboard.js
```

---

## Complete Code Examples

### Detection Script (Full Version)

See: `packages/shared/scripts/detect-clipboard.js`

```javascript
#!/usr/bin/env node
/**
 * Clipboard Detection Script
 *
 * This postinstall script detects which clipboard library is installed
 * and generates the appropriate implementation file.
 */

const fs = require("fs");
const path = require("path");

const OUTPUT_FILE = path.join(__dirname, "..", "src", "clipboard", "clipboard-impl.ts");

function moduleExists(name) {
  try {
    require.resolve(name);
    return true;
  } catch (e) {
    return false;
  }
}

let content;
let detectedModule;

if (moduleExists("expo-clipboard")) {
  detectedModule = "expo-clipboard";
  content = `/**
 * Auto-generated clipboard implementation
 * Detected: expo-clipboard
 * Generated at: ${new Date().toISOString()}
 *
 * DO NOT EDIT - This file is generated by scripts/detect-clipboard.js
 */

import { setStringAsync } from "expo-clipboard";

export type ClipboardFunction = (text: string) => Promise<boolean>;

export const clipboardType: "expo" | "react-native" | null = "expo";

export const isClipboardAvailable = (): boolean => true;

export const clipboardFunction: ClipboardFunction = async (text: string): Promise<boolean> => {
  try {
    await setStringAsync(text);
    return true;
  } catch (error) {
    console.error("[YourLibrary] Clipboard copy failed:", error);
    return false;
  }
};
`;
} else if (moduleExists("@react-native-clipboard/clipboard")) {
  detectedModule = "@react-native-clipboard/clipboard";
  content = `/**
 * Auto-generated clipboard implementation
 * Detected: @react-native-clipboard/clipboard
 * Generated at: ${new Date().toISOString()}
 *
 * DO NOT EDIT - This file is generated by scripts/detect-clipboard.js
 */

import Clipboard from "@react-native-clipboard/clipboard";

export type ClipboardFunction = (text: string) => Promise<boolean>;

export const clipboardType: "expo" | "react-native" | null = "react-native";

export const isClipboardAvailable = (): boolean => true;

export const clipboardFunction: ClipboardFunction = async (text: string): Promise<boolean> => {
  try {
    Clipboard.setString(text);
    return true;
  } catch (error) {
    console.error("[YourLibrary] Clipboard copy failed:", error);
    return false;
  }
};
`;
} else {
  detectedModule = null;
  content = `/**
 * Auto-generated clipboard implementation
 * Detected: none
 * Generated at: ${new Date().toISOString()}
 *
 * DO NOT EDIT - This file is generated by scripts/detect-clipboard.js
 */

export type ClipboardFunction = (text: string) => Promise<boolean>;

export const clipboardType: "expo" | "react-native" | null = null;

export const isClipboardAvailable = (): boolean => false;

export const clipboardFunction: ClipboardFunction = async (text: string): Promise<boolean> => {
  console.error(
    "[YourLibrary] Copy failed: No clipboard library found.\\n" +
      "Install expo-clipboard or @react-native-clipboard/clipboard."
  );
  return false;
};
`;
}

// Ensure directory exists
const dir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(OUTPUT_FILE, content);

console.log(
  `[YourLibrary] Clipboard implementation configured: ${detectedModule || "none"}`
);
```

---

## Do's and Don'ts

### ✅ DO

1. **Use `require.resolve()` for detection** - It checks if a module exists without importing it
   ```javascript
   function moduleExists(name) {
     try {
       require.resolve(name);
       return true;
     } catch (e) {
       return false;
     }
   }
   ```

2. **Generate static imports** - Metro can analyze these
   ```typescript
   // GOOD - Generated file with static import
   import { setStringAsync } from "expo-clipboard";
   ```

3. **Include `scripts` folder in `files` array** - So the postinstall script is published
   ```json
   "files": ["src", "lib", "scripts"]
   ```

4. **Add generated file to `.gitignore`** - It's generated, not source code

5. **Run detection in `prepublishOnly`** - Ensures a valid file exists when publishing
   ```json
   "prepublishOnly": "node scripts/detect-clipboard.js && bob build"
   ```

6. **Provide proper TypeScript declarations** - For optional modules that might not be installed

7. **Check the actual module's export pattern** - Some use default exports, others use named exports
   ```typescript
   // expo-clipboard uses named exports
   import { setStringAsync } from "expo-clipboard";

   // @react-native-clipboard/clipboard uses default export
   import Clipboard from "@react-native-clipboard/clipboard";
   ```

### ❌ DON'T

1. **Don't use dynamic requires with variables**
   ```javascript
   // BAD - Metro can't statically analyze
   const moduleName = "expo-clipboard";
   const clipboard = require(moduleName);
   ```

2. **Don't rely on try-catch requires at bundle time**
   ```javascript
   // BAD - Requires allowOptionalDependencies config
   try {
     const clipboard = require("expo-clipboard");
   } catch {}
   ```

3. **Don't use `import()` for optional dependencies**
   ```javascript
   // BAD - Still requires Metro to resolve the module
   const clipboard = await import("expo-clipboard");
   ```

4. **Don't commit the generated file** - It should be generated on each install

5. **Don't forget to handle the "none" case** - When no optional dependency is installed

6. **Don't assume export patterns** - Always verify how the actual module exports its API
   ```javascript
   // BAD - Assuming default export when it uses named exports
   import ExpoClipboard from "expo-clipboard";
   ExpoClipboard.setStringAsync(text); // undefined!

   // GOOD - Using correct named export
   import { setStringAsync } from "expo-clipboard";
   setStringAsync(text); // works!
   ```

---

## Troubleshooting

### Problem: "Cannot read property 'X' of undefined"

**Cause**: Wrong import pattern (default vs named exports)

**Solution**: Check how the module actually exports its API:
```javascript
// Check in node_modules/expo-clipboard/build/Clipboard.js
// or look at the package's TypeScript definitions
```

### Problem: TypeScript errors on generated file

**Cause**: Missing or incorrect type declarations

**Solution**: Create/update `src/types/optionalModules.d.ts` with correct types:
```typescript
declare module "expo-clipboard" {
  export function setStringAsync(text: string): Promise<void>;
}
```

### Problem: Postinstall doesn't run

**Cause**: npm/yarn/pnpm might skip postinstall in some cases

**Solution**:
1. Users can manually run: `node node_modules/@your-package/scripts/detect-clipboard.js`
2. Or add instructions to run it after install

### Problem: Generated file not found at runtime

**Cause**: File wasn't generated before build

**Solution**: Ensure `prepublishOnly` runs the detection script:
```json
"prepublishOnly": "node scripts/detect-clipboard.js && bob build"
```

### Problem: Wrong module detected in monorepo

**Cause**: `require.resolve()` might find the module in a different workspace

**Solution**: The detection runs in the consumer's context at install time, so it should find the right module. If issues persist, consider checking `process.cwd()` or parent directories.

---

## Alternative Approaches (Not Recommended)

These approaches were considered but have drawbacks:

### 1. Metro's `allowOptionalDependencies`

```javascript
// metro.config.js
config.transformer.allowOptionalDependencies = true;
```

**Why not**: Requires users to modify their Metro config - not zero-config.

### 2. Separate Entry Points

```javascript
// User imports based on what they have
import { clipboard } from "your-library/with-expo-clipboard";
```

**Why not**: Poor UX - users must know which import to use.

### 3. Custom Metro Resolver

```javascript
// Ship a resolver wrapper
const { withOptionalDependencies } = require("your-library/metro");
module.exports = withOptionalDependencies(config);
```

**Why not**: Still requires users to modify their Metro config.

### 4. Runtime Detection with try-catch

```javascript
let clipboard;
try {
  clipboard = require("expo-clipboard");
} catch {
  clipboard = require("@react-native-clipboard/clipboard");
}
```

**Why not**: Requires `allowOptionalDependencies: true` in Metro config.

---

## Summary

The postinstall detection pattern provides **true zero-config** optional dependencies:

1. **Create detection script** (`scripts/detect-clipboard.js`)
2. **Add postinstall hook** to `package.json`
3. **Include scripts in published files**
4. **Add generated file to .gitignore**
5. **Create proper type declarations**
6. **Verify module export patterns** (default vs named)

This approach works because:
- Detection happens at **install time**, not bundle time
- Generated file contains **static imports** that Metro can analyze
- No user configuration required
- Works with any Metro version

---

## Files Reference

| File | Purpose |
|------|---------|
| `scripts/detect-clipboard.js` | Postinstall script that detects and generates implementation |
| `src/clipboard/clipboard-impl.ts` | **Generated** - Contains static import for detected library |
| `src/clipboard/index.ts` | Public API - Re-exports from generated file |
| `src/types/optionalModules.d.ts` | TypeScript declarations for optional modules |
| `.gitignore` | Must include the generated file |
| `package.json` | Must have postinstall script and include scripts folder |

---

*This pattern was successfully implemented in `@react-buoy/shared-ui` to support both Expo and React Native CLI projects with zero configuration required from users.*
