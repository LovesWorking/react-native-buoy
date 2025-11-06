# TODO: Fix Metro Bundle & Package Resolution Issues

**Status**: 🔴 In Progress
**Reference Document**: [METRO_ANALYSIS_AND_RECOMMENDATIONS.md](./METRO_ANALYSIS_AND_RECOMMENDATIONS.md)
**Last Updated**: November 6, 2025

---

## Progress Overview

- [x] **Section 1**: Fix Metro Configuration (2/3) ⏳ *Verification pending*
- [x] **Section 2**: Fix @react-buoy/core Package Configuration (5/5) ✅
- [ ] **Section 3**: Standardize All Package Configurations (2/6) ⏳
- [ ] **Section 4**: Add Validation & Testing Infrastructure (0/8)
- [ ] **Section 5**: Update Documentation (0/4)
- [ ] **Section 6**: Test Published Packages (0/5)
- [ ] **Section 7**: Add Pre-Publish Checks (0/3)
- [ ] **Section 8**: Verify All Packages Build Correctly (0/4)
- [ ] **Section 9**: Test Cross-Package Manager Compatibility (0/4)
- [ ] **Section 10**: Final Validation & Publish (0/6)

**Total Progress**: 9/48 tasks completed (19%)

---

## Section 1: Fix Metro Configuration

**Priority**: 🔴 CRITICAL
**Reference**: [METRO_ANALYSIS_AND_RECOMMENDATIONS.md - Issue 1](./METRO_ANALYSIS_AND_RECOMMENDATIONS.md#issue-1-metro-default-config-does-not-include-react-native-condition)
**Root Cause**: Metro config missing `react-native` condition causes imports to fail for end users

### Tasks

- [x] **1.1**: Fix `/example/metro.config.js` Metro configuration ✅
  - **File**: `/Users/austinjohnson/Desktop/rn-buoy/example/metro.config.js`
  - **Current Line 21**: `config.resolver.unstable_conditionNames = ['source', 'import', 'require'];`
  - **Changed to**: `config.resolver.unstable_conditionNames = ['react-native', 'require'];`
  - **Why**: Remove `source` (dev-only), remove `import` (Metro adds automatically), add `react-native` (critical for RN package resolution)
  - **Metro Source**: `/Users/austinjohnson/Desktop/rn-metro-clone/packages/metro-config/src/defaults/index.js:50` - Default is `[]`
  - **Status**: COMPLETE

- [x] **1.2**: Fix `/example-dev-build/metro.config.js` Metro configuration ✅
  - **File**: `/Users/austinjohnson/Desktop/rn-buoy/example-dev-build/metro.config.js`
  - **Current**: Same issue as example/metro.config.js
  - **Applied fix**: `config.resolver.unstable_conditionNames = ['react-native', 'require'];`
  - **Status**: COMPLETE

- [ ] **1.3**: Verify Metro configuration changes work in development
  - **Test 1**: Start example app - `cd example && pnpm start`
  - **Test 2**: Verify hot reload still works when editing package source files
  - **Test 3**: Check Metro logs for any warnings about package resolution
  - **Test 4**: Import from all packages including subpaths: `@react-buoy/shared-ui/dataViewer`
  - **Expected**: No resolution warnings, all imports work

---

## Section 2: Fix @react-buoy/core Package Configuration

**Priority**: 🔴 CRITICAL
**Reference**: [METRO_ANALYSIS_AND_RECOMMENDATIONS.md - Issues 2, 3, 4](./METRO_ANALYSIS_AND_RECOMMENDATIONS.md#issue-2-react-buoycore-has-incorrect-types-field)
**Root Cause**: Incorrect package.json configuration causes TypeScript and resolution failures

### Tasks

- [ ] **2.1**: Fix `types` field to point to built declarations
  - **File**: `/Users/austinjohnson/Desktop/rn-buoy/packages/devtools-floating-menu/package.json`
  - **Current Line 7**: `"types": "src/index.tsx"`
  - **Change to**: `"types": "lib/typescript/module/index.d.ts"`
  - **Why**: TypeScript needs built declaration files, not source files
  - **Reference**: METRO_ANALYSIS_AND_RECOMMENDATIONS.md - Issue 2

- [ ] **2.2**: Add `.js` extension to `main` field
  - **File**: `/Users/austinjohnson/Desktop/rn-buoy/packages/devtools-floating-menu/package.json`
  - **Current Line 5**: `"main": "lib/commonjs/index"`
  - **Change to**: `"main": "lib/commonjs/index.js"`
  - **Why**: Explicit extensions improve compatibility with older bundlers
  - **Reference**: METRO_ANALYSIS_AND_RECOMMENDATIONS.md - Recommendation 7

- [ ] **2.3**: Add `.js` extension to `module` field
  - **File**: `/Users/austinjohnson/Desktop/rn-buoy/packages/devtools-floating-menu/package.json`
  - **Current Line 6**: `"module": "lib/module/index"`
  - **Change to**: `"module": "lib/module/index.js"`
  - **Why**: Explicit extensions improve compatibility with older bundlers

- [ ] **2.4**: Add TypeScript target to builder-bob configuration
  - **File**: `/Users/austinjohnson/Desktop/rn-buoy/packages/devtools-floating-menu/package.json`
  - **Current Lines 29-36**: Missing `"typescript"` target
  - **Change to**:
    ```json
    "react-native-builder-bob": {
      "source": "src",
      "output": "lib",
      "targets": [
        ["commonjs", { "esm": true }],
        ["module", { "esm": true }],
        "typescript"
      ]
    }
    ```
  - **Why**: Need to generate `.d.ts` type declaration files
  - **Reference**: METRO_ANALYSIS_AND_RECOMMENDATIONS.md - Issue 4

- [ ] **2.5**: Add modern `exports` field to package.json
  - **File**: `/Users/austinjohnson/Desktop/rn-buoy/packages/devtools-floating-menu/package.json`
  - **Insert after line 9** (after `"source"` field):
    ```json
    "exports": {
      ".": {
        "types": "./lib/typescript/module/index.d.ts",
        "react-native": "./src/index.tsx",
        "import": "./lib/module/index.js",
        "require": "./lib/commonjs/index.js",
        "default": "./lib/commonjs/index.js"
      },
      "./package.json": "./package.json"
    },
    ```
  - **Why**: Modern package resolution with predictable behavior
  - **Metro Source**: `/Users/austinjohnson/Desktop/rn-metro-clone/docs/PackageExports.md:46-81` - Exports take precedence
  - **Reference**: METRO_ANALYSIS_AND_RECOMMENDATIONS.md - Issue 3 & Recommendation 4

---

## Section 3: Standardize All Package Configurations

**Priority**: 🟡 HIGH
**Reference**: [METRO_ANALYSIS_AND_RECOMMENDATIONS.md - Recommendation 7](./METRO_ANALYSIS_AND_RECOMMENDATIONS.md#recommendation-7-add-file-extension-to-mainmodule-fields)
**Goal**: Ensure all packages follow the same correct pattern

### Tasks

- [ ] **3.1**: Audit all packages for missing `.js` extensions
  - **Command**:
    ```bash
    for pkg in packages/*/package.json; do
      echo "$pkg:"
      jq -r '"\(.main) | \(.module)"' "$pkg"
    done
    ```
  - **Expected**: Identify which packages need fixes
  - **Create list**: Document which packages need updates

- [ ] **3.2**: Add `.js` extensions to all `main` and `module` fields
  - **Packages to check**:
    - `/Users/austinjohnson/Desktop/rn-buoy/packages/bottom-sheet/package.json`
    - `/Users/austinjohnson/Desktop/rn-buoy/packages/debug-borders/package.json`
    - `/Users/austinjohnson/Desktop/rn-buoy/packages/env-tools/package.json`
    - `/Users/austinjohnson/Desktop/rn-buoy/packages/network/package.json`
    - `/Users/austinjohnson/Desktop/rn-buoy/packages/react-query/package.json`
    - `/Users/austinjohnson/Desktop/rn-buoy/packages/route-events/package.json`
    - `/Users/austinjohnson/Desktop/rn-buoy/packages/storage/package.json`
  - **Change**: `"main": "lib/commonjs/index"` → `"main": "lib/commonjs/index.js"`
  - **Change**: `"module": "lib/module/index"` → `"module": "lib/module/index.js"`
  - **Reference**: METRO_ANALYSIS_AND_RECOMMENDATIONS.md - Best Practice 2

- [ ] **3.3**: Verify all packages have `typescript` target in builder-bob
  - **Command**:
    ```bash
    for pkg in packages/*/package.json; do
      echo "$pkg:"
      jq -r '."react-native-builder-bob".targets' "$pkg"
    done
    ```
  - **Expected**: All packages should include `"typescript"` target
  - **Fix any missing**: Add `"typescript"` to targets array

- [ ] **3.4**: Verify all packages have correct `types` field
  - **Pattern**: Should be `"types": "lib/typescript/module/index.d.ts"` or similar
  - **Check**: No `types` field should point to `src/` directory
  - **Command**:
    ```bash
    for pkg in packages/*/package.json; do
      types=$(jq -r '.types // "none"' "$pkg")
      if [[ "$types" == src/* ]]; then
        echo "❌ WRONG: $pkg -> $types"
      else
        echo "✓ OK: $pkg -> $types"
      fi
    done
    ```

- [ ] **3.5**: Verify all packages include both `src` and `lib` in `files` field
  - **Command**:
    ```bash
    for pkg in packages/*/package.json; do
      echo "$pkg:"
      jq -r '.files' "$pkg"
    done
    ```
  - **Expected**: All should have `["src", "lib"]` or similar
  - **Why**: Published packages need both source (for monorepo dev) and built files (for consumers)

- [ ] **3.6**: Verify all packages have `prepare` script
  - **Command**:
    ```bash
    for pkg in packages/*/package.json; do
      prepare=$(jq -r '.scripts.prepare // "MISSING"' "$pkg")
      echo "$pkg: $prepare"
    done
    ```
  - **Expected**: All should have `"prepare": "bob build"`
  - **Why**: Ensures packages are built before publishing

---

## Section 4: Add Validation & Testing Infrastructure

**Priority**: 🟡 HIGH
**Reference**: [METRO_ANALYSIS_AND_RECOMMENDATIONS.md - Recommendations 9, 10](./METRO_ANALYSIS_AND_RECOMMENDATIONS.md#recommendation-9-add-integration-tests-for-published-packages)
**Goal**: Prevent future issues with automated checks

### Tasks

- [ ] **4.1**: Create package validation script
  - **File**: Create `/Users/austinjohnson/Desktop/rn-buoy/scripts/validate-packages.js`
  - **Content**: Copy from METRO_ANALYSIS_AND_RECOMMENDATIONS.md - Recommendation 10
  - **Checks**:
    1. `types` field points to built files (not `src/`)
    2. `main`/`module` have `.js` extensions
    3. `files` includes `"lib"`
    4. builder-bob has `typescript` target
    5. Built files exist after build
    6. `exports` field has correct condition order
  - **Make executable**: `chmod +x scripts/validate-packages.js`

- [ ] **4.2**: Add validation script to root package.json
  - **File**: `/Users/austinjohnson/Desktop/rn-buoy/package.json`
  - **Add to scripts**:
    ```json
    "scripts": {
      "validate": "node scripts/validate-packages.js",
      "validate:fix": "node scripts/validate-packages.js --fix"
    }
    ```
  - **Test**: Run `pnpm run validate` - should report any issues

- [ ] **4.3**: Create published package integration test script
  - **File**: Create `/Users/austinjohnson/Desktop/rn-buoy/scripts/test-published-packages.sh`
  - **Content**: Copy from METRO_ANALYSIS_AND_RECOMMENDATIONS.md - Recommendation 9
  - **What it does**:
    1. Creates temp React Native app
    2. Installs packages from npm
    3. Configures Metro correctly
    4. Tests imports resolve
    5. Verifies TypeScript types work
  - **Make executable**: `chmod +x scripts/test-published-packages.sh`

- [ ] **4.4**: Test the validation script on current codebase
  - **Command**: `pnpm run validate`
  - **Expected**: Script should identify all issues we've documented
  - **Action**: Fix any issues found or verify they're already in our TODO

- [ ] **4.5**: Add pre-publish validation hook
  - **File**: `/Users/austinjohnson/Desktop/rn-buoy/package.json`
  - **Add to scripts**:
    ```json
    "scripts": {
      "prepublishOnly": "pnpm run validate && pnpm run build && pnpm run typecheck"
    }
    ```
  - **Why**: Prevents publishing broken packages
  - **Metro analogy**: Like Metro's lenient warnings, but we want hard stops before publish

- [ ] **4.6**: Create Metro config template for users
  - **File**: Create `/Users/austinjohnson/Desktop/rn-buoy/templates/metro.config.js`
  - **Content**: Copy from METRO_ANALYSIS_AND_RECOMMENDATIONS.md - Best Practice 1
  - **Use case**: Users can copy this when setting up Buoy in their apps

- [ ] **4.7**: Create package.json template for new packages
  - **File**: Create `/Users/austinjohnson/Desktop/rn-buoy/templates/package.json.template`
  - **Content**: Copy from METRO_ANALYSIS_AND_RECOMMENDATIONS.md - Best Practice 2
  - **Use case**: Ensures new packages follow correct pattern from the start

- [ ] **4.8**: Add automated testing workflow
  - **File**: Create `/Users/austinjohnson/Desktop/rn-buoy/.github/workflows/validate-packages.yml` (if using GitHub Actions)
  - **Steps**:
    1. Checkout code
    2. Install dependencies
    3. Run build
    4. Run validation script
    5. Run typecheck
  - **Trigger**: On PR and push to main

---

## Section 5: Update Documentation

**Priority**: 🟡 HIGH
**Reference**: [METRO_ANALYSIS_AND_RECOMMENDATIONS.md - Recommendation 8, 11](./METRO_ANALYSIS_AND_RECOMMENDATIONS.md#recommendation-8-document-required-metro-configuration)
**Goal**: Help users configure Metro correctly

### Tasks

- [ ] **5.1**: Create Metro configuration requirements document
  - **File**: Create `/Users/austinjohnson/Desktop/rn-buoy/METRO_CONFIG_REQUIREMENTS.md`
  - **Content**: Copy from METRO_ANALYSIS_AND_RECOMMENDATIONS.md - Recommendation 8
  - **Sections**:
    1. Required Configuration
    2. For Expo Projects
    3. For React Native CLI Projects
    4. Why This Is Needed
    5. Verification
    6. Troubleshooting
  - **Metro Source Reference**: `/Users/austinjohnson/Desktop/rn-metro-clone/docs/Configuration.md:361`

- [ ] **5.2**: Update main README.md with installation instructions
  - **File**: `/Users/austinjohnson/Desktop/rn-buoy/README.md`
  - **Add section**: "Installation" with Metro config requirements
  - **Content**: Copy from METRO_ANALYSIS_AND_RECOMMENDATIONS.md - Recommendation 11
  - **Include**:
    1. npm install command
    2. Metro config snippet for Expo
    3. Note that RN CLI doesn't need extra config
    4. Link to METRO_CONFIG_REQUIREMENTS.md
    5. Troubleshooting section

- [ ] **5.3**: Add troubleshooting guide for common errors
  - **File**: Create `/Users/austinjohnson/Desktop/rn-buoy/TROUBLESHOOTING.md`
  - **Common errors**:
    1. "Cannot find module '@react-buoy/shared-ui/dataViewer'"
    2. "Unable to resolve module @react-buoy/core"
    3. TypeScript errors with workspace dependencies
  - **Solutions**: Point to Metro config requirements
  - **Metro Source**: `/Users/austinjohnson/Desktop/rn-metro-clone/docs/PackageExports.md:138-151` - Lenient encapsulation

- [ ] **5.4**: Update CONTRIBUTING.md with package development guidelines
  - **File**: Create or update `/Users/austinjohnson/Desktop/rn-buoy/CONTRIBUTING.md`
  - **Add section**: "Creating New Packages"
  - **Include**:
    1. Use package.json template
    2. Required fields (main, module, types, exports)
    3. Builder-bob configuration
    4. Run validation script before PR
  - **Reference**: Link to templates/package.json.template

---

## Section 6: Test Published Packages

**Priority**: 🔴 CRITICAL
**Reference**: [METRO_ANALYSIS_AND_RECOMMENDATIONS.md - Testing Checklist](./METRO_ANALYSIS_AND_RECOMMENDATIONS.md#published-package-tests-critical)
**Goal**: Verify packages work when installed from npm

### Tasks

- [ ] **6.1**: Build all packages and verify outputs
  - **Command**: `pnpm run build` in root
  - **Verify**:
    1. All packages have `lib/commonjs/` directory
    2. All packages have `lib/module/` directory
    3. All packages have `lib/typescript/` directory with `.d.ts` files
  - **Check specific file**: `ls -la packages/devtools-floating-menu/lib/typescript/module/index.d.ts`
  - **Expected**: File should exist after build (currently doesn't due to missing typescript target)

- [ ] **6.2**: Pack packages locally to simulate npm publish
  - **Command for each package**:
    ```bash
    cd packages/devtools-floating-menu
    pnpm pack
    tar -tzf react-buoy-core-*.tgz | head -20
    ```
  - **Verify contents**:
    1. `package/lib/` directory included
    2. `package/src/` directory included
    3. `package/package.json` has `workspace:*` replaced with actual versions
  - **Check all packages**: repeat for shared, network, storage, etc.

- [ ] **6.3**: Test installation in fresh React Native CLI app
  - **Steps**:
    1. Create temp directory: `mkdir /tmp/test-buoy-rn`
    2. Initialize RN app: `npx react-native init TestBuoy`
    3. Install from local pack: `npm install /path/to/react-buoy-core-0.1.32.tgz`
    4. Try importing: Add `import { FloatingDevTools } from '@react-buoy/core'` to App.tsx
    5. Run: `npm start` and `npm run ios`
  - **Expected**: App builds and runs successfully
  - **Metro Source**: RN CLI adds `react-native` condition automatically

- [ ] **6.4**: Test installation in fresh Expo app
  - **Steps**:
    1. Create temp directory: `mkdir /tmp/test-buoy-expo`
    2. Initialize Expo app: `npx create-expo-app TestBuoy`
    3. Add Metro config with `react-native` condition
    4. Install from local pack: `npm install /path/to/react-buoy-core-0.1.32.tgz`
    5. Try importing: Add `import { FloatingDevTools } from '@react-buoy/core'` to app/index.tsx
    6. Run: `npx expo start`
  - **Expected**: App builds and runs successfully
  - **Critical**: This tests the Metro config requirement

- [ ] **6.5**: Test TypeScript resolution in installed packages
  - **In test apps from 6.3 and 6.4**:
    1. Open VS Code in project
    2. Hover over imported components: `FloatingDevTools`
    3. Cmd+Click to jump to definition
  - **Expected**:
    1. TypeScript shows correct types
    2. Jump to definition works
    3. No `any` types
    4. IntelliSense shows JSDoc comments
  - **Verify types path**: Should load from `lib/typescript/module/`, not `src/`

---

## Section 7: Add Pre-Publish Checks

**Priority**: 🟡 HIGH
**Reference**: [METRO_ANALYSIS_AND_RECOMMENDATIONS.md - Best Practice 4](./METRO_ANALYSIS_AND_RECOMMENDATIONS.md#best-practice-4-always-run-build-before-publishing)
**Goal**: Never publish broken packages

### Tasks

- [ ] **7.1**: Verify all packages have `prepare` script
  - **Already covered in 3.6**, but double-check after all changes
  - **Command**:
    ```bash
    for pkg in packages/*/package.json; do
      prepare=$(jq -r '.scripts.prepare // "MISSING"' "$pkg")
      if [[ "$prepare" == "MISSING" ]]; then
        echo "❌ $pkg missing prepare script"
      fi
    done
    ```
  - **Fix any missing**: Add `"prepare": "bob build"`

- [ ] **7.2**: Add version bump script with validation
  - **File**: `/Users/austinjohnson/Desktop/rn-buoy/scripts/bump-version.sh`
  - **Content**:
    ```bash
    #!/bin/bash
    set -e

    echo "Running pre-publish validation..."
    pnpm run validate

    echo "Building all packages..."
    pnpm run build

    echo "Running type checks..."
    pnpm run typecheck

    echo "All checks passed! Ready to bump version."
    lerna version --no-push
    ```
  - **Make executable**: `chmod +x scripts/bump-version.sh`

- [ ] **7.3**: Add publish script with final checks
  - **File**: `/Users/austinjohnson/Desktop/rn-buoy/scripts/publish.sh`
  - **Content**:
    ```bash
    #!/bin/bash
    set -e

    echo "Final validation before publish..."
    pnpm run validate

    echo "Checking git status..."
    if [[ -n $(git status -s) ]]; then
      echo "❌ Working directory not clean. Commit changes first."
      exit 1
    fi

    echo "Publishing to npm..."
    lerna publish from-package --yes

    echo "✅ Published successfully!"
    echo "Next: Test installation from npm"
    ```
  - **Make executable**: `chmod +x scripts/publish.sh`

---

## Section 8: Verify All Packages Build Correctly

**Priority**: 🔴 CRITICAL
**Reference**: [METRO_ANALYSIS_AND_RECOMMENDATIONS.md - Testing Checklist](./METRO_ANALYSIS_AND_RECOMMENDATIONS.md#pre-publish-tests)
**Goal**: Ensure build process works for all packages

### Tasks

- [ ] **8.1**: Clean all build artifacts
  - **Command**: `pnpm run clean`
  - **Verify**: All `lib/` directories are removed
  - **Check**: `find packages -name "lib" -type d` should return nothing

- [ ] **8.2**: Build all packages from scratch
  - **Command**: `pnpm run build`
  - **Watch for errors**: Builder-bob should succeed for all packages
  - **Time it**: Note build time for future reference
  - **Expected**: After adding `typescript` target to @react-buoy/core, build time may increase slightly

- [ ] **8.3**: Verify TypeScript declarations were generated
  - **Command**:
    ```bash
    for pkg in packages/*/lib/typescript/module/index.d.ts; do
      if [[ -f "$pkg" ]]; then
        echo "✓ $pkg"
      else
        echo "❌ MISSING: $pkg"
      fi
    done
    ```
  - **Expected**: All packages should have `index.d.ts` files
  - **Special check**: `packages/devtools-floating-menu/lib/typescript/module/index.d.ts` should NOW exist

- [ ] **8.4**: Run typecheck across entire monorepo
  - **Command**: `pnpm run typecheck`
  - **Expected**: No TypeScript errors
  - **Fix any errors**: Update code or type definitions as needed
  - **Common issues**: Check imports of `@react-buoy/shared-ui/dataViewer` work correctly

---

## Section 9: Test Cross-Package Manager Compatibility

**Priority**: 🟢 MEDIUM
**Reference**: [METRO_ANALYSIS_AND_RECOMMENDATIONS.md - Testing Checklist](./METRO_ANALYSIS_AND_RECOMMENDATIONS.md#cross-package-manager-tests)
**Goal**: Ensure packages work with npm, yarn, pnpm, bun

### Tasks

- [ ] **9.1**: Test with npm
  - **Create test app**: `npx react-native init TestBuoyNpm`
  - **Install**: `npm install /path/to/react-buoy-core-*.tgz`
  - **Verify**: Imports work, app runs
  - **Metro behavior**: Should be identical to pnpm
  - **Metro Source**: `/Users/austinjohnson/Desktop/rn-metro-clone/packages/metro-resolver/src/resolve.js:167-185` - Hierarchical lookup works the same

- [ ] **9.2**: Test with yarn
  - **Create test app**: `npx react-native init TestBuoyYarn`
  - **Install**: `yarn add file:/path/to/react-buoy-core-*.tgz`
  - **Verify**: Imports work, app runs
  - **Check**: `node_modules/@react-buoy/core` structure

- [ ] **9.3**: Test with pnpm (already primary)
  - **In existing example apps**: Already using pnpm
  - **Verify**: After all fixes, example apps still work
  - **Test**: `cd example && pnpm start`

- [ ] **9.4**: Test with bun (optional, but growing in usage)
  - **Create test app**: `bunx react-native init TestBuoyBun`
  - **Install**: `bun add /path/to/react-buoy-core-*.tgz`
  - **Verify**: Imports work, app runs
  - **Note**: Document any bun-specific issues

---

## Section 10: Final Validation & Publish

**Priority**: 🔴 CRITICAL
**Reference**: [METRO_ANALYSIS_AND_RECOMMENDATIONS.md - Testing Checklist](./METRO_ANALYSIS_AND_RECOMMENDATIONS.md#pre-publish-tests)
**Goal**: Final checks before publishing to npm

### Tasks

- [ ] **10.1**: Run full validation suite
  - **Command**: `pnpm run validate`
  - **Expected**: All checks pass
  - **Fix any issues**: Should be none if previous sections completed

- [ ] **10.2**: Run full test suite
  - **Commands**:
    ```bash
    pnpm run build
    pnpm run typecheck
    pnpm run validate
    ```
  - **All must pass**: Any failure blocks publish

- [ ] **10.3**: Test example apps one final time
  - **Example app**: `cd example && pnpm start`
  - **Example dev build**: `cd example-dev-build && pnpm start`
  - **Test all features**:
    1. FloatingDevTools renders
    2. All tools work (network, storage, etc.)
    3. DataViewer imports and renders
    4. Hot reload works

- [ ] **10.4**: Update version numbers
  - **Command**: `./scripts/bump-version.sh`
  - **Lerna will prompt**: Choose version bump type
  - **Commit changes**: `git commit -m "chore: bump version to X.X.X"`
  - **Tag**: Lerna creates tags automatically

- [ ] **10.5**: Publish to npm
  - **Command**: `./scripts/publish.sh`
  - **Verify on npm**: Check https://www.npmjs.com/package/@react-buoy/core
  - **Test installation**: `npm install @react-buoy/core@latest` in fresh app

- [ ] **10.6**: Post-publish verification
  - **Create fresh test app**: Use latest from npm
  - **Follow installation docs**: Exactly as written in README
  - **Test imports**: All packages and subpaths
  - **Test TypeScript**: Types resolve correctly
  - **Document any issues**: Open GitHub issue if anything fails

---

## Notes & Reminders

### Metro Resolution Order (Quick Reference)
**Source**: `/Users/austinjohnson/Desktop/rn-metro-clone/packages/metro-resolver/src/resolve.js:391-437`

1. Check if `exports` field exists
2. If yes and `unstable_enablePackageExports: true`:
   - Resolve via exports field
   - On failure: log warning, fall back to legacy
3. If no or disabled:
   - Use legacy resolution (main, module, react-native fields)

### Condition Assembly (Quick Reference)
**Source**: `/Users/austinjohnson/Desktop/rn-metro-clone/packages/metro-resolver/src/utils/matchSubpathFromExportsLike.js:37-44`

```javascript
['default', 'import' OR 'require', ...unstable_conditionNames, ...platform conditions]
```

- `'default'`: Always included
- `'import'` OR `'require'`: Based on import statement type (NEVER both)
- `...unstable_conditionNames`: From Metro config (e.g., `['react-native']`)
- Platform conditions: From `unstable_conditionsByPlatform` (e.g., `['browser']` for web)

### Key Metro Sources to Remember

| Topic | File | Lines |
|-------|------|-------|
| Default conditions | `metro-config/src/defaults/index.js` | 50 |
| RN CLI override | `docs/Configuration.md` | 361 |
| Exports resolution | `metro-resolver/src/PackageExportsResolve.js` | 46-130 |
| Condition matching | `metro-resolver/src/utils/matchSubpathFromExportsLike.js` | 37-44 |
| Lenient errors | `docs/PackageExports.md` | 138-151 |

### Common Commands

```bash
# Validate all packages
pnpm run validate

# Build all packages
pnpm run build

# Clean all packages
pnpm run clean

# Type check all packages
pnpm run typecheck

# Test example app
cd example && pnpm start

# Pack single package for testing
cd packages/devtools-floating-menu && pnpm pack

# Test published packages
./scripts/test-published-packages.sh
```

---

## Completion Checklist

Before marking this TODO as complete:

- [ ] All sections (1-10) show 100% completion
- [ ] All packages published successfully to npm
- [ ] Post-publish verification completed
- [ ] Documentation updated
- [ ] No known issues reported
- [ ] GitHub issues created for any deferred items

---

**Last Updated**: November 6, 2025
**Next Review**: After completing each section, update progress at top
