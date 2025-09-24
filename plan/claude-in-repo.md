# React Buoy IntelliSense Fix - Refactoring Plan

## Critical Issues Identified

Your @react-buoy packages have **4 major structural problems** preventing IntelliSense:

### 1. **Incomplete `exports` Field**
Your current exports only define the main entry point but lack:
- Proper `types` mapping in exports
- `./package.json` export (required for modern tooling)
- Fallback compatibility structure

### 2. **Missing Top-Level `types` Field**
No fallback `types` field for older module resolution systems

### 3. **Incorrect TypeScript Declaration Paths**
The `types` path in exports points to a location that may not align with bundler expectations

### 4. **Suboptimal Builder Bob Configuration**
Missing optimizations for TypeScript generation and module structure

## Comprehensive Refactoring Plan

### **Phase 1: Fix package.json exports Field**

**Current (Broken):**
```json
{
  "main": "lib/commonjs/index.js",
  "module": "lib/module/index.js",
  "types": "lib/typescript/module/index.d.ts",
  "exports": {
    ".": {
      "source": "./src/index.tsx",
      "import": {
        "default": "./lib/module/index.js",
        "types": "./lib/typescript/module/index.d.ts"
      },
      "require": {
        "default": "./lib/commonjs/index.js",
        "types": "./lib/typescript/commonjs/index.d.ts"
      }
    }
  }
}
```

**Corrected (Following RN Bob Standard):**
```json
{
  "main": "./lib/module/index.js",
  "types": "./lib/typescript/src/index.d.ts",
  "exports": {
    ".": {
      "source": "./src/index.tsx",
      "types": "./lib/typescript/src/index.d.ts",
      "default": "./lib/module/index.js"
    },
    "./package.json": "./package.json"
  }
}
```

**Key Changes:**
- **Simplified exports structure** - Modern bundlers prefer the flat structure
- **Consistent types path** - Points to `src/index.d.ts` not `module/index.d.ts`
- **Added `./package.json` export** - Critical for tooling compatibility
- **Top-level `types` fallback** - For older module resolution

### **Phase 2: TypeScript Configuration Improvements**

**Root Monorepo tsconfig.json Updates:**
```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "customConditions": ["react-native"],
    "paths": {
      "@react-buoy/core": ["./packages/core/src/index"],
      "@react-buoy/env": ["./packages/env/src/index"],
      "@react-buoy/network": ["./packages/network/src/index"],
      "@react-buoy/react-query": ["./packages/react-query/src/index"],
      "@react-buoy/storage": ["./packages/storage/src/index"]
    }
  }
}
```

**Per-Package tsconfig.build.json:**
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "./lib/typescript"
  },
  "exclude": ["example", "lib", "**/__tests__", "**/__fixtures__", "**/__mocks__"]
}
```

**Key Improvements:**
- **Path mapping for local development** - Direct src mapping for monorepo
- **bundler module resolution** - Aligns with modern React Native
- **Proper build exclusions** - Cleaner TypeScript output
- **Root directory configuration** - Correct declaration file paths

### **Phase 3: React Native Builder Bob Configuration**

**Updated react-native-builder-bob Configuration:**
```json
{
  "react-native-builder-bob": {
    "source": "src",
    "output": "lib",
    "targets": [
      [
        "module",
        {
          "esm": true
        }
      ],
      [
        "typescript",
        {
          "project": "tsconfig.build.json"
        }
      ]
    ]
  }
}
```

**Key Changes:**
- **Removed CommonJS target** - Modern RN libraries should prioritize ESM
- **Explicit TypeScript project** - Uses dedicated build config
- **Simplified target structure** - Focuses on what's actually needed

### **Phase 4: Implementation Priority**

1. **@react-buoy/core** (Most critical - used by other packages)
2. **@react-buoy/storage** & **@react-buoy/env** (Foundation packages)
3. **@react-buoy/network** & **@react-buoy/react-query** (Feature packages)

### **Phase 5: Verification Steps**

After implementing changes:

1. **Clean build all packages**:
   ```bash
   pnpm run clean && pnpm run build
   ```

2. **Test IntelliSense in consumer project**:
   - Delete `node_modules` and lockfile
   - Reinstall dependencies
   - Test auto-import suggestions

3. **Verify export resolution**:
   ```bash
   node -e "console.log(require.resolve('@react-buoy/core/package.json'))"
   ```

## Why This Will Fix IntelliSense

The refactored structure addresses all four root causes:

1. **Modern exports field** → Proper type resolution in bundler mode
2. **Top-level types fallback** → Compatibility with older tooling
3. **Correct declaration paths** → TypeScript can find and load types
4. **Optimized builder config** → Cleaner, more predictable output structure

**Critical Success Factor:** The `./package.json` export in the exports field is essential - without it, modern module resolution fails completely, which is exactly what you're experiencing.

This refactoring follows the **exact same patterns** that React Native Builder Bob uses for all generated libraries, ensuring maximum compatibility with the React Native ecosystem.

## Root Cause Analysis

Based on analysis of `/Users/aj/Desktop/intergo-1/package.json` and the consumer project configuration:

### The Core Problem
Your consumer project uses:
```json
{
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext"
  }
}
```

This **strict modern module resolution** requires:
- Properly configured `exports` field
- `./package.json` export
- Consistent type declaration paths

### The Evidence
When testing module resolution:
```bash
node -e "console.log(require.resolve('@react-buoy/core/package.json'))"
# Error: Package subpath './package.json' is not defined by "exports"
```

This error confirms the `exports` field is incomplete, preventing IntelliSense from discovering available exports.

## Implementation Checklist

- [ ] Update @react-buoy/core package.json exports field
- [ ] Update @react-buoy/core tsconfig.build.json
- [ ] Update @react-buoy/core react-native-builder-bob config
- [ ] Repeat for @react-buoy/storage
- [ ] Repeat for @react-buoy/env
- [ ] Repeat for @react-buoy/network
- [ ] Repeat for @react-buoy/react-query
- [ ] Clean build all packages
- [ ] Test IntelliSense in consumer project
- [ ] Verify package.json resolution
- [ ] Update monorepo root tsconfig.json with path mappings