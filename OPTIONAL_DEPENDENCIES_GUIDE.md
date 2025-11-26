# Metro Optional Dependencies: Complete Technical Reference

> A comprehensive guide to handling optional peer dependencies in React Native/Metro, backed by source code references from the Metro bundler repository.

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [The Problem](#the-problem)
3. [**ZERO-CONFIG SOLUTIONS**](#zero-config-solutions) _(Start Here!)_
4. [Metro's Built-in Solution](#metros-built-in-solution) _(Requires Config)_
5. [Configuration Reference](#configuration-reference)
6. [Code Patterns](#code-patterns)
7. [How Metro Detects Optional Dependencies](#how-metro-detects-optional-dependencies)
8. [How Metro Resolves Optional Dependencies](#how-metro-resolves-optional-dependencies)
9. [Dependency Registration & Precedence](#dependency-registration--precedence)
10. [Graph Handling](#graph-handling)
11. [Complete Implementation Example](#complete-implementation-example)
12. [Integration Test Evidence](#integration-test-evidence)
13. [API Reference](#api-reference)
14. [Source File Index](#source-file-index)

---

## Executive Summary

Metro has **native support** for optional dependencies through the `allowOptionalDependencies` configuration option. When enabled, Metro automatically detects `require()` calls wrapped in try-catch blocks and marks them as optional. If an optional dependency is missing at build time, Metro gracefully skips it instead of failing the build.

**Key Insight**: This is NOT a hack or workaround - it's an official, tested feature of Metro.

---

## The Problem

Metro (React Native's bundler) performs static analysis at build time, creating a catch-22:

| Approach                                 | Problem                                                                                |
| ---------------------------------------- | -------------------------------------------------------------------------------------- |
| Static imports: `import X from "pkg"`    | Metro tries to resolve the module. If not installed, **build fails**.                  |
| Dynamic imports: `require(variableName)` | Metro can't statically analyze, so it **doesn't bundle the module** even if installed. |

**What We Need**: A pattern where Metro bundles a module if installed, but doesn't fail if it's missing.

---

## ZERO-CONFIG SOLUTIONS

These approaches work **without requiring users to modify their metro.config.js**.

### Option 1: Custom Resolver via `resolveRequest` (Library-Level)

You can ship a custom resolver with your library that users import, which handles missing modules gracefully by resolving them to an empty module.

**Source Reference**: `packages/metro-resolver/src/resolve.js:43-59`

```javascript
export default function resolve(
  context: ResolutionContext,
  moduleName: string,
  platform: string | null
): Resolution {
  const resolveRequest = context.resolveRequest;
  if (
    resolveRequest &&
    // Prevent infinite recursion in the trivial case
    resolveRequest !== resolve
  ) {
    return resolveRequest(
      Object.freeze({ ...context, resolveRequest: resolve }),
      moduleName,
      platform
    );
  }
  // ... continues with normal resolution
}
```

**Implementation - Ship this with your library:**

```javascript
// your-library/withOptionalDeps.js
// Users add this to their metro.config.js resolver

const OPTIONAL_MODULES = [
  "expo-clipboard",
  "@react-native-clipboard/clipboard",
];

function withOptionalDependencies(config) {
  const originalResolver = config.resolver?.resolveRequest;

  return {
    ...config,
    resolver: {
      ...config.resolver,
      resolveRequest: (context, moduleName, platform) => {
        // Check if this is one of our optional modules
        if (OPTIONAL_MODULES.includes(moduleName)) {
          try {
            // Try the original resolver first
            if (originalResolver) {
              return originalResolver(context, moduleName, platform);
            }
            return context.resolveRequest(context, moduleName, platform);
          } catch (error) {
            // Module not found - return empty module
            // Uses Metro's built-in emptyModulePath
            return {
              type: "empty",
            };
          }
        }

        // For all other modules, use default resolution
        if (originalResolver) {
          return originalResolver(context, moduleName, platform);
        }
        return context.resolveRequest(context, moduleName, platform);
      },
    },
  };
}

module.exports = { withOptionalDependencies };
```

**User's metro.config.js (minimal change):**

```javascript
const { getDefaultConfig } = require("expo/metro-config");
const { withOptionalDependencies } = require("your-library/withOptionalDeps");

const config = getDefaultConfig(__dirname);
module.exports = withOptionalDependencies(config);
```

---

### Option 2: Use `resolver.emptyModulePath` (Redirect Missing to Empty)

Metro has a built-in empty module that you can leverage.

**Source Reference**: `packages/metro-config/src/defaults/index.js:41-43`

```javascript
emptyModulePath: require.resolve(
  'metro-runtime/src/modules/empty-module.js',
),
```

**The empty module** (`packages/metro-runtime/src/modules/empty-module.js`) is literally empty:

```javascript
// (empty file - just copyright header)
```

**Resolution behavior** from `docs/Resolution.md:48-50`:

> **Empty module**: The request is resolved to a built-in empty module, namely the one specified in `resolver.emptyModulePath`.

---

### Option 3: Runtime Detection with Shim Package (TRUE Zero-Config)

**The cleanest approach**: Create a shim package that users install as a regular dependency. The shim handles detection internally.

```javascript
// @your-org/clipboard-shim/index.js
// This file uses Node.js-style detection that works at BUNDLE time

let ClipboardImpl = null;
let clipboardSource = null;

// These are evaluated at bundle time by Metro
// The try-catch is preserved in the bundle for runtime

// Method 1: Check if module exists via require.resolve pattern
// This works because Metro statically analyzes the string literals

const checkModule = (moduleName) => {
  try {
    return require(moduleName);
  } catch (e) {
    return null;
  }
};

// Attempt to load expo-clipboard
const expoClipboard = checkModule("expo-clipboard");
if (expoClipboard) {
  ClipboardImpl = expoClipboard;
  clipboardSource = "expo";
}

// Attempt to load react-native clipboard
if (!ClipboardImpl) {
  const rnClipboard = checkModule("@react-native-clipboard/clipboard");
  if (rnClipboard) {
    ClipboardImpl = rnClipboard.default || rnClipboard;
    clipboardSource = "react-native";
  }
}

// Export unified API
export const isAvailable = () => ClipboardImpl !== null;
export const getSource = () => clipboardSource;

export const setString = async (text) => {
  if (!ClipboardImpl) return false;

  if (clipboardSource === "expo") {
    await ClipboardImpl.setStringAsync(text);
  } else {
    ClipboardImpl.setString(text);
  }
  return true;
};

export const getString = async () => {
  if (!ClipboardImpl) return null;

  if (clipboardSource === "expo") {
    return ClipboardImpl.getStringAsync();
  }
  return ClipboardImpl.getString();
};
```

**BUT WAIT** - This still requires `allowOptionalDependencies: true` to work!

---

### Option 4: The REAL Zero-Config Solution - Separate Entry Points

The **only true zero-config approach** is to NOT bundle optional dependencies at all, but instead have users explicitly choose:

```
your-library/
├── index.js              # Core functionality (no clipboard)
├── with-expo-clipboard.js     # Adds expo-clipboard support
├── with-rn-clipboard.js       # Adds @react-native-clipboard support
└── clipboard/
    ├── expo.js           # Direct expo-clipboard wrapper
    ├── react-native.js   # Direct RN clipboard wrapper
    └── none.js           # No-op implementation
```

**User imports what they have installed:**

```javascript
// If user has expo-clipboard
import { clipboard } from "your-library/with-expo-clipboard";

// If user has @react-native-clipboard/clipboard
import { clipboard } from "your-library/with-rn-clipboard";

// If user wants no clipboard (graceful degradation)
import { clipboard } from "your-library"; // Uses none.js internally
```

**your-library/with-expo-clipboard.js:**

```javascript
import * as ExpoClipboard from "expo-clipboard";
export const clipboard = {
  isAvailable: () => true,
  setString: (text) => ExpoClipboard.setStringAsync(text),
  getString: () => ExpoClipboard.getStringAsync(),
};
```

**your-library/clipboard/none.js:**

```javascript
export const clipboard = {
  isAvailable: () => false,
  setString: () => {
    console.warn("No clipboard installed");
    return false;
  },
  getString: () => null,
};
```

---

### Option 5: Auto-Detection via package.json (Recommended for Libraries)

Create a postinstall script that detects what's installed and generates the right imports:

**package.json:**

```json
{
  "scripts": {
    "postinstall": "node ./scripts/detect-clipboard.js"
  }
}
```

**scripts/detect-clipboard.js:**

```javascript
const fs = require("fs");
const path = require("path");

const OUTPUT_FILE = path.join(__dirname, "..", "clipboard-impl.js");

function moduleExists(name) {
  try {
    require.resolve(name);
    return true;
  } catch (e) {
    return false;
  }
}

let content;

if (moduleExists("expo-clipboard")) {
  content = `
export { setStringAsync as setString, getStringAsync as getString } from 'expo-clipboard';
export const isAvailable = () => true;
export const source = 'expo';
`;
} else if (moduleExists("@react-native-clipboard/clipboard")) {
  content = `
import Clipboard from '@react-native-clipboard/clipboard';
export const setString = Clipboard.setString;
export const getString = Clipboard.getString;
export const isAvailable = () => true;
export const source = 'react-native';
`;
} else {
  content = `
export const setString = () => { console.warn('No clipboard'); return false; };
export const getString = () => null;
export const isAvailable = () => false;
export const source = null;
`;
}

fs.writeFileSync(OUTPUT_FILE, content);
console.log(
  "Clipboard implementation configured:",
  moduleExists("expo-clipboard")
    ? "expo"
    : moduleExists("@react-native-clipboard/clipboard")
    ? "react-native"
    : "none"
);
```

**your-library/index.js:**

```javascript
// Import from the generated file
export * as clipboard from "./clipboard-impl";
```

**This is TRUE zero-config** because:

1. No metro.config.js changes needed
2. Detection happens at install time (not bundle time)
3. Metro sees static imports only
4. Works with any Metro version

---

### Comparison Table

| Solution                            | Config Required                   | Complexity | Reliability | User Experience       |
| ----------------------------------- | --------------------------------- | ---------- | ----------- | --------------------- |
| Option 1: Custom Resolver           | Minimal (1 line)                  | Medium     | High        | Good                  |
| Option 2: emptyModulePath           | Yes                               | Low        | Medium      | OK                    |
| Option 3: Runtime Shim              | Yes (`allowOptionalDependencies`) | Low        | High        | Great                 |
| **Option 4: Separate Entry Points** | **NONE**                          | Low        | **Highest** | OK (explicit imports) |
| **Option 5: postinstall Detection** | **NONE**                          | Medium     | **Highest** | **Great**             |

---

### Recommendation

For **maximum compatibility with zero user config**:

1. **Use Option 5 (postinstall)** for the best balance of zero-config and great UX
2. **Fall back to Option 4 (separate entry points)** if postinstall scripts are problematic

For **best UX with minimal config**:

1. Use Metro's `allowOptionalDependencies: true` with try-catch patterns (documented below)
2. Provide a one-liner wrapper function users can apply to their config

---

## Metro's Built-in Solution

Metro solves this with the `allowOptionalDependencies` transformer option combined with try-catch detection.

> **Note**: This solution **requires users to modify their metro.config.js**. See [Zero-Config Solutions](#zero-config-solutions) above for alternatives.

### Source Reference

**File**: `packages/metro-config/src/defaults/index.js`
**Lines**: 129

```javascript
transformer: {
  // ... other config
  allowOptionalDependencies: false,  // Default: DISABLED
  // ...
}
```

> **Important**: This feature is **disabled by default**. You must explicitly enable it.

---

## Configuration Reference

### Type Definitions

**File**: `packages/metro/src/DeltaBundler/types.js`
**Lines**: 137-142

```typescript
export type AllowOptionalDependenciesWithOptions = {
  +exclude: Array<string>,
};

export type AllowOptionalDependencies =
  | boolean
  | AllowOptionalDependenciesWithOptions;
```

### Configuration Options

| Option                                                    | Description                                                              |
| --------------------------------------------------------- | ------------------------------------------------------------------------ |
| `allowOptionalDependencies: false`                        | Disables optional dependency handling (default)                          |
| `allowOptionalDependencies: true`                         | Enables optional dependency detection for all try-catch wrapped requires |
| `allowOptionalDependencies: { exclude: ['module-name'] }` | Enable with specific modules excluded from optional handling             |

### Metro Config Example

```javascript
// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
// OR for RN CLI:
// const { getDefaultConfig } = require('@react-native/metro-config');

const config = getDefaultConfig(__dirname);

// Enable optional dependencies
config.transformer.allowOptionalDependencies = true;

// OR with exclusions (these modules will ALWAYS be required, even in try-catch):
// config.transformer.allowOptionalDependencies = {
//   exclude: ['critical-module', 'must-have-module']
// };

module.exports = config;
```

### Programmatic Configuration

**File**: `packages/metro/src/integration_tests/__tests__/optional-dependencies-test.js`
**Lines**: 19-28

```javascript
const config = await Metro.loadConfig(
  {
    config: require.resolve("../metro.config.js"),
  },
  {
    transformer: {
      allowOptionalDependencies: true,
    },
  }
);
```

---

## Code Patterns

### Valid Patterns (Metro WILL detect as optional)

**File**: `packages/metro/src/integration_tests/basic_bundle/optional-dependencies/index.js`
**Lines**: 1-35

```javascript
"use strict";

let shouldBeB, shouldBeC;

// Pattern 1: Simple try-catch with fallback
try {
  shouldBeB = require("./not-exists");
} catch {
  shouldBeB = require("./optional-b");
}

// Pattern 2: IIFE wrapper (preserves variable hoisting)
(function requireOptionalC() {
  try {
    shouldBeC = require("./optional-c");
  } catch (e) {
    // If the optional module is not found, we can ignore the error.
  }
})();

// Pattern 3: Non-optional require (always required)
export const a = require("./required-a");
export const b = shouldBeB;
export const c = shouldBeC;
```

### Invalid Patterns (Metro will NOT detect as optional)

Based on the detection algorithm in `collectDependencies.js:627-647`:

```javascript
// INVALID: Too deeply nested (more than 3 statement levels)
if (someCondition) {
  try {
    const x = require("optional-pkg"); // NOT optional - too nested
  } catch (e) {}
}

// INVALID: In catch block
try {
  doSomething();
} catch (e) {
  const x = require("pkg"); // NOT optional - in catch, not try
}

// INVALID: In finally block
try {
  doSomething();
} finally {
  const x = require("pkg"); // NOT optional - key is 'finalizer', not 'block'
}

// INVALID: Dynamic string (can't be statically analyzed)
const moduleName = "expo-clipboard";
require(moduleName); // Won't work - Metro can't evaluate variable
```

---

## How Metro Detects Optional Dependencies

### Core Detection Algorithm

**File**: `packages/metro/src/ModuleGraph/worker/collectDependencies.js`
**Lines**: 607-647

```javascript
function isOptionalDependency(
  name: string,
  path: NodePath<>,
  state: State
): boolean {
  const { allowOptionalDependencies } = state;

  // The async require module is a 'built-in'. Resolving should never fail
  // -> treat it as non-optional.
  if (name === state.asyncRequireModulePathStringLiteral?.value) {
    return false;
  }

  const isExcluded = () =>
    Array.isArray(allowOptionalDependencies.exclude) &&
    allowOptionalDependencies.exclude.includes(name);

  if (!allowOptionalDependencies || isExcluded()) {
    return false;
  }

  // Valid statement stack for single-level try-block:
  // expressionStatement -> blockStatement -> tryStatement
  let sCount = 0;
  let p = path;
  while (p && sCount < 3) {
    if (p.isStatement()) {
      if (p.node.type === "BlockStatement") {
        // A single-level should have the tryStatement immediately followed
        // BlockStatement with the key 'block' to distinguish from the finally
        // block, which has key = 'finalizer'
        return (
          p.parentPath != null &&
          p.parentPath.node.type === "TryStatement" &&
          p.key === "block"
        );
      }
      sCount += 1;
    }
    p = p.parentPath;
  }

  return false;
}
```

### Detection Rules Summary

| Rule                            | Explanation                                                                   |
| ------------------------------- | ----------------------------------------------------------------------------- |
| **Max 3 statement levels**      | Algorithm walks up max 3 statement nodes from the require call                |
| **Must be in try block**        | Checks `p.key === 'block'` to ensure it's in the try block, not catch/finally |
| **Parent must be TryStatement** | Verifies the BlockStatement's parent is a TryStatement                        |
| **Exclusion list respected**    | Modules in `exclude` array are never treated as optional                      |
| **Async require excluded**      | Built-in async require module is always required                              |

---

## How Metro Resolves Optional Dependencies

### Graceful Resolution Failure

**File**: `packages/metro/src/DeltaBundler/buildSubgraph.js`
**Lines**: 71-85

```javascript
try {
  maybeResolvedDep = {
    absolutePath: resolve(parentPath, dep).filePath,
    data: dep,
  };
} catch (error) {
  // Ignore unavailable optional dependencies. They are guarded
  // with a try-catch block and will be handled during runtime.
  if (dep.data.isOptional !== true) {
    throw error;
  }
  maybeResolvedDep = {
    data: dep,
  };
}
```

### Key Behavior

| Scenario                            | Result                                         |
| ----------------------------------- | ---------------------------------------------- |
| Optional dependency **exists**      | Resolved normally with `absolutePath` set      |
| Optional dependency **missing**     | Error swallowed, `absolutePath` is `undefined` |
| Non-optional dependency **missing** | Error thrown, build fails                      |

### Checking if Dependency is Resolved

**File**: `packages/metro/src/lib/isResolvedDependency.js`
**Lines**: 14-18

```javascript
export function isResolvedDependency(
  dep: Dependency,
): dep is ResolvedDependency {
  return dep.absolutePath != null;
}
```

---

## Dependency Registration & Precedence

### Registration Logic

**File**: `packages/metro/src/ModuleGraph/worker/collectDependencies.js`
**Lines**: 885-924

```javascript
class DependencyRegistry {
  _dependencies: Map<string, InternalDependency> = new Map();

  registerDependency(qualifier: ImportQualifier): InternalDependency {
    const key = getKeyForDependency(qualifier);
    let dependency = this._dependencies.get(key);

    if (dependency == null) {
      const newDependency = {
        name: qualifier.name,
        asyncType: qualifier.asyncType,
        isESMImport: qualifier.isESMImport,
        locs: [],
        index: this._dependencies.size,
        key: crypto.createHash("sha1").update(key).digest("base64"),
      };

      if (qualifier.optional) {
        newDependency.isOptional = true;
      }
      // ...
      dependency = newDependency;
    } else {
      if (dependency.isOptional && !qualifier.optional) {
        // A previously optionally required dependency was required
        // non-optionally. Mark it non optional for the whole module
        dependency = {
          ...dependency,
          isOptional: false,
        };
      }
    }

    this._dependencies.set(key, dependency);
    return dependency;
  }
}
```

### Precedence Rule

**Important**: If a module is required both optionally (in try-catch) AND non-optionally (outside try-catch), the **non-optional usage takes precedence**.

**File**: `packages/metro/src/ModuleGraph/worker/__tests__/collectDependencies-test.js`
**Lines**: 1596-1607

```javascript
test("collapses optional and non-optional requires of the same module", () => {
  const ast = astFromCode(`
    const nonOptional = require('foo');
    try {
      const optional = require('foo');
    } catch {}
  `);
  const { dependencies } = collectDependencies(ast, opts);
  expect(dependencies).toEqual([
    { name: "foo", data: expect.not.objectContaining({ isOptional: true }) },
  ]);
});
```

---

## Graph Handling

### Missing Optional Dependencies in Graph

**File**: `packages/metro/src/DeltaBundler/Graph.js`
**Lines**: 516-518

```javascript
} else if (!isResolvedDependency(dependency)) {
  // If the dependency is a missing optional dependency, it has no node of
  // its own. We just need to add it to the parent's dependency map.
}
```

### Graph Test: Missing Optional Dependency Skipped

**File**: `packages/metro/src/DeltaBundler/__tests__/Graph-test.js`
**Lines**: 3612-3655

```javascript
test("missing optional dependency will be skipped", async () => {
  localOptions = {
    ...options,
    transform: createMockTransform(),
  };

  const result = await localGraph.initialTraverseDependencies(localOptions);

  expect(result.added).toEqual(
    new Map([
      [
        "/bundle-o",
        expect.objectContaining({
          dependencies: new Map([
            [
              dependencyKeys.get("/regular-a"),
              expect.objectContaining({
                absolutePath: "/regular-a",
                data: expect.objectContaining({
                  isOptional: false,
                }),
              }),
            ],
            [
              dependencyKeys.get("/optional-b"),
              expect.objectContaining({
                absolutePath: null, // <-- Missing but NOT an error!
                data: expect.objectContaining({
                  isOptional: true,
                }),
              }),
            ],
          ]),
        }),
      ],
      // ...
    ])
  );
});
```

### Graph Test: Missing Non-Optional Dependency Throws

**File**: `packages/metro/src/DeltaBundler/__tests__/Graph-test.js`
**Lines**: 3656-3664

```javascript
test("missing non-optional dependency will throw", async () => {
  localOptions = {
    ...options,
    transform: createMockTransform(["optional-b"]), // Force non-optional
  };
  await expect(
    localGraph.initialTraverseDependencies(localOptions)
  ).rejects.toThrow();
});
```

---

## Complete Implementation Example

### Use Case: Optional Clipboard with Expo/RN CLI Support

```javascript
// src/utils/clipboard.js

let ClipboardModule = null;
let clipboardType = null;

// Try expo-clipboard first (for Expo apps)
try {
  ClipboardModule = require("expo-clipboard");
  clipboardType = "expo";
} catch (e) {
  // Not installed - this is fine
}

// Fallback to @react-native-clipboard/clipboard (for RN CLI apps)
if (!ClipboardModule) {
  try {
    ClipboardModule = require("@react-native-clipboard/clipboard");
    clipboardType = "react-native";
  } catch (e) {
    // Not installed - this is also fine
  }
}

/**
 * Check if any clipboard module is available
 */
export const isClipboardAvailable = () => ClipboardModule !== null;

/**
 * Get the type of clipboard module being used
 * @returns {'expo' | 'react-native' | null}
 */
export const getClipboardType = () => clipboardType;

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Success status
 */
export const setString = async (text) => {
  if (!ClipboardModule) {
    console.warn(
      "Clipboard: No clipboard module installed. Install expo-clipboard or @react-native-clipboard/clipboard."
    );
    return false;
  }

  try {
    if (clipboardType === "expo") {
      await ClipboardModule.setStringAsync(text);
    } else {
      // @react-native-clipboard/clipboard uses default export
      ClipboardModule.default.setString(text);
    }
    return true;
  } catch (error) {
    console.error("Clipboard: Failed to set string", error);
    return false;
  }
};

/**
 * Get text from clipboard
 * @returns {Promise<string | null>} - Clipboard contents or null
 */
export const getString = async () => {
  if (!ClipboardModule) {
    console.warn("Clipboard: No clipboard module installed.");
    return null;
  }

  try {
    if (clipboardType === "expo") {
      return await ClipboardModule.getStringAsync();
    } else {
      return await ClipboardModule.default.getString();
    }
  } catch (error) {
    console.error("Clipboard: Failed to get string", error);
    return null;
  }
};
```

### Required Metro Configuration

```javascript
// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
// OR: const { getDefaultConfig } = require('@react-native/metro-config');

const config = getDefaultConfig(__dirname);

// REQUIRED: Enable optional dependencies support
config.transformer.allowOptionalDependencies = true;

module.exports = config;
```

### Package.json (Optional Peer Dependencies)

```json
{
  "peerDependencies": {
    "expo-clipboard": ">=4.0.0",
    "@react-native-clipboard/clipboard": ">=1.10.0"
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

---

## Integration Test Evidence

### Test: Bundle Output with Optional Dependencies

**File**: `packages/metro/src/integration_tests/__tests__/optional-dependencies-test.js`
**Lines**: 18-80

```javascript
test("builds a simple bundle", async () => {
  const config = await Metro.loadConfig(
    {
      config: require.resolve("../metro.config.js"),
    },
    {
      transformer: {
        allowOptionalDependencies: true,
      },
    }
  );

  const result = await Metro.runBuild(config, {
    entry: "optional-dependencies/index.js",
    dev: true,
    minify: false,
  });

  // Verify the bundled output preserves try-catch structure
  expect(match[0]).toMatchInlineSnapshot(`
"__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  'use strict';

  Object.defineProperty(exports, '__esModule', {
    value: true
  });
  var shouldBeB, shouldBeC;
  try {
    shouldBeB = _$$_REQUIRE(_dependencyMap[0], \\"./not-exists\\");
  } catch (_unused) {
    shouldBeB = _$$_REQUIRE(_dependencyMap[1], \\"./optional-b\\");
  }
  (function requireOptionalC() {
    try {
      shouldBeC = _$$_REQUIRE(_dependencyMap[2], \\"./optional-c\\");
    } catch (e) {}
  })();
  var a = _$$_REQUIRE(_dependencyMap[3], \\"./required-a\\");
  var b = shouldBeB;
  var c = shouldBeC;
  exports.a = a;
  exports.b = b;
  exports.c = c;
},0,[null,1,2,3],\\"optional-dependencies/index.js\\");"
`);

  // Note: _dependencyMap[0] is null because "./not-exists" doesn't exist
  // but the build succeeded and the try-catch handles it at runtime

  const object = execBundle(result.code);
  expect(object).toEqual({
    a: "a",
    b: "b",
    c: "c",
  });
});
```

### Test: Exclude Specific Modules from Optional Handling

**File**: `packages/metro/src/ModuleGraph/worker/__tests__/collectDependencies-test.js`
**Lines**: 1563-1595

```javascript
test("can exclude optional dependency", () => {
  const ast = () =>
    astFromCode(`
    const n = 2;
    try {
      const a = require(\`A-\${1 + n}\`);
      const b = require(\`A-\${3 + n}\`);
    } catch (e) {}
  `);

  // Without exclusion: both are optional
  const { dependencies: deps1 } = collectDependencies(ast(), opts);
  expect(deps1).toEqual([
    { name: "A-3", data: objectContaining({ isOptional: true }) },
    { name: "A-5", data: objectContaining({ isOptional: true }) },
  ]);

  // With allowOptionalDependencies: false - none are optional
  const { dependencies: deps2 } = collectDependencies(ast(), {
    ...opts,
    allowOptionalDependencies: false,
  });
  expect(deps2).toEqual([
    { name: "A-3", data: expect.not.objectContaining({ isOptional: true }) },
    { name: "A-5", data: expect.not.objectContaining({ isOptional: true }) },
  ]);

  // With exclusion for 'A-5' - only 'A-3' is optional
  const { dependencies: deps3 } = collectDependencies(ast(), {
    ...opts,
    allowOptionalDependencies: { exclude: ["A-5"] },
  });
  expect(deps3).toEqual([
    { name: "A-3", data: objectContaining({ isOptional: true }) },
    { name: "A-5", data: expect.not.objectContaining({ isOptional: true }) },
  ]);
});
```

---

## API Reference

### TransformResultDependency Type

**File**: `packages/metro/src/DeltaBundler/types.js`
**Lines**: 26-60

```typescript
export type TransformResultDependency = $ReadOnly<{
  /**
   * The literal name provided to a require or import call.
   * For example 'foo' in case of `require('foo')`.
   */
  name: string;

  /**
   * Extra data returned by the dependency extractor.
   */
  data: $ReadOnly<{
    /**
     * A locally unique key for this dependency within the current module.
     */
    key: string;

    /**
     * If not null, this dependency is due to a dynamic `import()` or
     * `__prefetchImport()` call.
     */
    asyncType: AsyncDependencyType | null;

    /**
     * True if the dependency is declared with a static "import x from 'y'"
     * or an import() call.
     */
    isESMImport: boolean;

    /**
     * The dependency is enclosed in a try/catch block.
     */
    isOptional?: boolean;

    locs: $ReadOnlyArray<BabelSourceLocation>;

    /** Context for requiring a collection of modules. */
    contextParams?: RequireContextParams;
  }>;
}>;
```

### Dependency Types

**File**: `packages/metro/src/DeltaBundler/types.js`
**Lines**: 62-71

```typescript
export type ResolvedDependency = $ReadOnly<{
  absolutePath: string;
  data: TransformResultDependency;
}>;

export type Dependency =
  | ResolvedDependency
  | $ReadOnly<{
      data: TransformResultDependency;
    }>;
```

### JsTransformerConfig

**File**: `packages/metro-transform-worker/src/index.js`
**Lines**: 86-113

```typescript
export type JsTransformerConfig = $ReadOnly<{
  assetPlugins: $ReadOnlyArray<string>;
  assetRegistryPath: string;
  asyncRequireModulePath: string;
  babelTransformerPath: string;
  dynamicDepsInPackages: DynamicRequiresBehavior;
  enableBabelRCLookup: boolean;
  enableBabelRuntime: boolean | string;
  globalPrefix: string;
  hermesParser: boolean;
  minifierConfig: MinifierConfig;
  minifierPath: string;
  optimizationSizeLimit: number;
  publicPath: string;
  allowOptionalDependencies: AllowOptionalDependencies; // <-- HERE
  unstable_dependencyMapReservedName: ?string;
  unstable_disableModuleWrapping: boolean;
  unstable_disableNormalizePseudoGlobals: boolean;
  unstable_compactOutput: boolean;
  unstable_allowRequireContext: boolean;
  unstable_memoizeInlineRequires?: boolean;
  unstable_nonMemoizedInlineRequires?: $ReadOnlyArray<string>;
  unstable_renameRequire?: boolean;
}>;
```

### Configuration Passed to collectDependencies

**File**: `packages/metro-transform-worker/src/index.js`
**Lines**: 388-409

```javascript
const opts = {
  allowOptionalDependencies: config.allowOptionalDependencies,
  asyncRequireModulePath: config.asyncRequireModulePath,
  dependencyMapName: config.unstable_dependencyMapReservedName,
  dependencyTransformer:
    config.unstable_disableModuleWrapping === true
      ? disabledDependencyTransformer
      : undefined,
  dynamicRequires: getDynamicDepsBehavior(
    config.dynamicDepsInPackages,
    file.filename
  ),
  inlineableCalls: [importDefault, importAll],
  keepRequireNames: options.dev,
  unstable_allowRequireContext: config.unstable_allowRequireContext,
  // ...
};
({ ast, dependencies, dependencyMapName } = collectDependencies(ast, opts));
```

---

## Source File Index

| File                                                                               | Purpose                                                         | Key Lines                                                              |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `packages/metro/src/ModuleGraph/worker/collectDependencies.js`                     | Core detection algorithm for optional dependencies              | 607-647 (isOptionalDependency), 885-924 (DependencyRegistry)           |
| `packages/metro/src/DeltaBundler/types.js`                                         | Type definitions for dependencies and AllowOptionalDependencies | 26-60 (TransformResultDependency), 137-142 (AllowOptionalDependencies) |
| `packages/metro/src/DeltaBundler/buildSubgraph.js`                                 | Graceful resolution failure handling                            | 71-85                                                                  |
| `packages/metro/src/DeltaBundler/Graph.js`                                         | Graph handling for missing optional deps                        | 516-518                                                                |
| `packages/metro/src/lib/isResolvedDependency.js`                                   | Helper to check if dependency was resolved                      | 14-18                                                                  |
| `packages/metro-config/src/defaults/index.js`                                      | Default configuration (disabled by default)                     | 129                                                                    |
| `packages/metro-transform-worker/src/index.js`                                     | Transformer config type and usage                               | 86-113 (type), 388-409 (usage)                                         |
| `packages/metro/src/integration_tests/basic_bundle/optional-dependencies/index.js` | Example source code demonstrating patterns                      | 1-35                                                                   |
| `packages/metro/src/integration_tests/__tests__/optional-dependencies-test.js`     | Integration test proving the feature works                      | 18-80                                                                  |
| `packages/metro/src/ModuleGraph/worker/__tests__/collectDependencies-test.js`      | Unit tests for dependency collection                            | 1563-1607                                                              |
| `packages/metro/src/DeltaBundler/__tests__/Graph-test.js`                          | Graph-level tests for optional deps                             | 3557-3716                                                              |

---

## Summary

Metro's optional dependency support provides a clean, official solution for handling optional peer dependencies:

1. **Enable the feature**: Set `transformer.allowOptionalDependencies: true` in metro.config.js
2. **Wrap optional requires in try-catch**: Metro automatically detects these patterns
3. **Build succeeds**: Missing optional modules are skipped, not errors
4. **Runtime handles it**: Your try-catch code handles the missing module gracefully

This is the **recommended approach** for libraries that need to support multiple optional dependencies like clipboard modules, analytics SDKs, or platform-specific features.

---

_Generated from Metro repository analysis. All file paths and line numbers are accurate as of the current codebase._
