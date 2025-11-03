# Adding New Packages to the Monorepo

This guide covers the complete process of adding new packages to the monorepo, what gets updated automatically, and critical gotchas to avoid.

## Table of Contents

1. [Quick Start](#quick-start)
2. [What Gets Updated Automatically](#what-gets-updated-automatically)
3. [What You MUST Update Manually](#what-you-must-update-manually)
4. [Publishing New Packages](#publishing-new-packages)
5. [Critical Gotchas](#critical-gotchas)
6. [Verification Checklist](#verification-checklist)

---

## Quick Start

### Step 1: Create the Package

Use the automated script to scaffold a new package:

```bash
pnpm create:package <package-name> [type]
```

**Example:**
```bash
pnpm create:package route-events
```

This automatically:
- Creates the package structure
- Generates boilerplate code
- Adds to example app dependencies
- Runs `pnpm install` and builds

**See:** `docs/other/CREATE_PACKAGE_GUIDE.md` for detailed package creation options.

### Step 2: Update Required Files

After creating the package, you **MUST** manually update these files:

1. `.github/workflows/release.yml` - Add to publish loop
2. `scripts/release-all.sh` - Add to ordered package list
3. `tests/smoke/imports.cjs` - Add to smoke tests

### Step 3: Publish Correctly

**ALWAYS** use the changeset workflow:

```bash
# Create a changeset
pnpm changeset

# Version bump (updates all package.json files)
pnpm changeset version

# Build and publish
pnpm run release:publish
```

**NEVER** manually publish with `pnpm publish` or `pnpm --filter <package> publish` directly!

---

## What Gets Updated Automatically

These configs use glob patterns or dynamic discovery and require **NO manual updates**:

### ✅ Automatically Included

| File/Config | Pattern | Notes |
|-------------|---------|-------|
| `lerna.json` | `"packages": ["packages/*"]` | Discovers all packages automatically |
| `pnpm-workspace.yaml` | `packages/*` | Workspace auto-discovery |
| Root `package.json` | `workspaces: ["packages/*"]` | Workspace definition |
| `.github/workflows/ci.yml` | Uses `lerna run` commands | No explicit package list |
| `scripts/release.sh` | Uses `pnpm changeset` | Auto-discovers via changesets |
| `scripts/create-package.js` | Iterates `packages/*/package.json` | Dynamic discovery |
| `.changeset/config.json` | No explicit package list | Auto-discovery |

### Why These Work Automatically

- **Lerna** uses the `packages/*` glob pattern to find all packages
- **Changesets** scans the workspace for changed packages
- **pnpm workspaces** automatically links packages based on the workspace config
- **CI workflows** use `lerna run` which discovers packages dynamically

---

## What You MUST Update Manually

These files have **hardcoded package lists** for specific ordering or logic:

### 1. `.github/workflows/release.yml`

**Location:** Line ~97

**What to add:**
```yaml
for pkg in "@react-buoy/shared-ui" "@react-buoy/core" "@react-buoy/env" "@react-buoy/network" "@react-buoy/storage" "@react-buoy/react-query" "@react-buoy/route-events" "@react-buoy/debug-borders"; do
```

**Why:** The automated release workflow explicitly lists packages to control publish order and handle failures gracefully.

**Order matters:** Dependencies should be published before dependents (e.g., `shared-ui` before packages that use it).

### 2. `scripts/release-all.sh`

**Location:** Line ~72-80

**What to add:**
```bash
ordered_dirs=(
  "packages/shared"
  "packages/devtools-floating-menu"
  "packages/env-tools"
  "packages/network"
  "packages/storage"
  "packages/react-query"
  "packages/route-events"        # Add here
  "packages/debug-borders"        # Add here
)
```

**Why:** This script publishes packages sequentially in a specific order to ensure dependencies are available before dependents try to use them.

**Order matters:** Same principle as above - dependencies first.

### 3. `tests/smoke/imports.cjs`

**Location:** Line ~4-12

**What to add:**
```javascript
const packages = [
  { scope: '@react-buoy/core', dir: 'packages/devtools-floating-menu' },
  { scope: '@react-buoy/shared-ui', dir: 'packages/shared' },
  { scope: '@react-buoy/env', dir: 'packages/env-tools' },
  { scope: '@react-buoy/network', dir: 'packages/network' },
  { scope: '@react-buoy/storage', dir: 'packages/storage' },
  { scope: '@react-buoy/react-query', dir: 'packages/react-query' },
  { scope: '@react-buoy/route-events', dir: 'packages/route-events' },        // Add here
  { scope: '@react-buoy/debug-borders', dir: 'packages/debug-borders' },      // Add here
];
```

**Why:** Smoke tests validate that each package has proper exports, types, README, and CHANGELOG.

**Order doesn't matter** for smoke tests.

---

## Publishing New Packages

### The CORRECT Way (Using Changesets)

This is the **ONLY** correct way to publish packages in this monorepo:

```bash
# 1. Create a changeset describing your changes
pnpm changeset
# Follow prompts to select packages and bump type (patch/minor/major)

# 2. Version bump all affected packages
pnpm changeset version
# This updates package.json files and generates CHANGELOGs

# 3. Install to update lockfile
pnpm install

# 4. Build and publish
pnpm run release:publish
# This runs: pnpm run build:packages && pnpm changeset publish

# 5. Push changes and tags
git push --follow-tags
```

### Why Use Changesets?

**Changesets automatically:**
- ✅ Transforms `workspace:*` → actual version numbers (e.g., `^0.1.19`)
- ✅ Updates CHANGELOGs for all packages
- ✅ Creates git tags for each published version
- ✅ Handles dependency version updates
- ✅ Validates package integrity before publishing

### Alternative: Automated Release (GitHub Actions)

The `.github/workflows/release.yml` workflow automatically publishes on push to `main`:

```bash
# Just push to main and the workflow handles everything
git push origin main
```

The workflow:
1. Runs all quality checks (lint, typecheck, build, smoke tests)
2. Bumps versions for ALL packages (patch)
3. Publishes to npm
4. Commits version changes back to the repo

---

## Critical Gotchas

### ❌ NEVER Do This

```bash
# DON'T: Manually publish individual packages
pnpm --filter @react-buoy/my-package publish

# DON'T: Use npm publish directly
npm publish

# DON'T: Skip the changeset workflow
```

### Why This Breaks Things

When you manually publish with `pnpm publish` or `npm publish`:

1. **`workspace:*` doesn't get transformed**
   - Your package will be published with `"@react-buoy/shared-ui": "workspace:*"` in dependencies
   - Users trying to install your package will get: `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND`
   - The package is **completely broken** and unusable

2. **No CHANGELOG updates**
   - Version history is not documented
   - Breaking changes are not communicated

3. **No git tags**
   - Can't track which commits correspond to which versions
   - Harder to debug issues in specific versions

4. **Version drift**
   - Packages get out of sync
   - Dependency hell ensues

### Real Example: What Went Wrong

When `@react-buoy/route-events` and `@react-buoy/debug-borders` were first published:

```bash
# ❌ WRONG: Manual publish
pnpm --filter @react-buoy/route-events publish
pnpm --filter @react-buoy/debug-borders publish
```

**Result:**
```bash
# Users trying to install got this error:
ERR_PNPM_WORKSPACE_PKG_NOT_FOUND
"@react-buoy/shared-ui@workspace:*" is in the dependencies 
but no package named "@react-buoy/shared-ui" is present in the workspace
```

**Why it happened:**
- `workspace:*` was **not transformed** to `^0.1.19`
- The published packages had invalid dependency references
- Had to deprecate 0.1.20 versions and republish as 0.1.22

**The fix:**
```bash
# ✅ CORRECT: Use changesets
pnpm changeset version
pnpm run release:publish
```

This properly transformed `workspace:*` → `^0.1.19`.

---

## Verification Checklist

After adding a new package, verify everything is correct:

### Before First Publish

- [ ] Package created with `pnpm create:package`
- [ ] `.github/workflows/release.yml` updated with new package
- [ ] `scripts/release-all.sh` updated with new package
- [ ] `tests/smoke/imports.cjs` updated with new package
- [ ] Package has a README.md
- [ ] Package has a CHANGELOG.md
- [ ] Package has proper exports in `src/index.tsx`
- [ ] `pnpm run typecheck` passes
- [ ] `pnpm run lint` passes
- [ ] `pnpm run smoke` passes

### Publishing

- [ ] Created changeset with `pnpm changeset`
- [ ] Ran `pnpm changeset version` to bump versions
- [ ] Ran `pnpm install` to update lockfile
- [ ] Ran `pnpm run build:packages` successfully
- [ ] Used `pnpm run release:publish` (NOT manual publish)

### After Publishing

- [ ] Check npm registry: `npm view @react-buoy/<package-name>`
- [ ] Verify `workspace:*` was transformed to actual versions:
  ```bash
  npm view @react-buoy/<package-name> dependencies
  ```
- [ ] Test installation in a fresh project:
  ```bash
  mkdir test-install && cd test-install
  pnpm init
  pnpm add @react-buoy/<package-name>
  ```
- [ ] Verify git tags were created: `git tag -l`
- [ ] Pushed tags to GitHub: `git push --follow-tags`
- [ ] GitHub Actions CI passed

---

## Quick Reference

### Package Dependency Order

When publishing, follow this order (dependencies first):

1. `@react-buoy/shared-ui` - Base UI components (no internal deps)
2. `@react-buoy/core` - Core devtools (depends on shared-ui)
3. `@react-buoy/env` - Environment tools (depends on shared-ui)
4. `@react-buoy/storage` - Storage browser (depends on shared-ui)
5. `@react-buoy/react-query` - React Query tools (depends on shared-ui)
6. `@react-buoy/network` - Network monitor (depends on shared-ui, react-query)
7. `@react-buoy/route-events` - Route tracking (depends on shared-ui)
8. `@react-buoy/debug-borders` - Debug borders (depends on shared-ui)

### Common Commands

```bash
# Create new package
pnpm create:package <name> [type]

# Run all quality checks
pnpm run lint
pnpm run typecheck
pnpm run build:packages
pnpm run smoke

# Create changeset
pnpm changeset

# Version bump
pnpm changeset version

# Publish (proper way)
pnpm run release:publish

# Check package on npm
npm view @react-buoy/<package-name>

# Test installation
pnpm add @react-buoy/<package-name>
```

### Files to Update Checklist

```
□ .github/workflows/release.yml      (line ~97)
□ scripts/release-all.sh             (line ~72-80)
□ tests/smoke/imports.cjs            (line ~4-12)
```

---

## Troubleshooting

### Package Not Found on npm After Publishing

**Symptoms:**
```bash
ERR_PNPM_FETCH_404 Not Found - 404
```

**Cause:** Package wasn't actually published or npm registry hasn't propagated yet.

**Solution:**
1. Wait 1-2 minutes for npm registry propagation
2. Check if package exists: `npm view @react-buoy/<package-name>`
3. If not found, publish again with correct method

### `workspace:*` Error for Users

**Symptoms:**
```bash
ERR_PNPM_WORKSPACE_PKG_NOT_FOUND
"@react-buoy/shared-ui@workspace:*" is in the dependencies
```

**Cause:** Package was published with `pnpm publish` instead of changesets.

**Solution:**
1. Deprecate the broken version:
   ```bash
   npm deprecate @react-buoy/<package-name>@<version> "Broken publish - use <new-version> or later"
   ```
2. Republish correctly using changesets (version will auto-increment)
3. Verify the fix: `npm view @react-buoy/<package-name> dependencies`

### CI Failing After Adding Package

**Symptoms:** GitHub Actions workflows fail with package not found errors.

**Cause:** Forgot to update hardcoded package lists.

**Solution:**
1. Check `.github/workflows/release.yml`
2. Check `scripts/release-all.sh`
3. Check `tests/smoke/imports.cjs`
4. Add package to all three files

---

## Summary

### The Golden Rules

1. **Always use changesets** for publishing
2. **Update the 3 hardcoded lists** when adding packages
3. **Verify dependencies** on npm after publishing
4. **Test installation** in a fresh project
5. **Never use manual publish** commands

### Remember

> The monorepo has both **automatic** and **manual** tracking. Automatic configs use globs (`packages/*`) and require no updates. Manual configs use explicit lists and MUST be updated for new packages.

When in doubt, follow this guide and use the [Verification Checklist](#verification-checklist).

