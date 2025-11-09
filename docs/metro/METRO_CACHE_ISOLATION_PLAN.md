# Metro Cache Isolation Plan for rn-buoy Monorepo

**Author**: Analysis based on Metro bundler cross-contamination research
**Date**: November 9, 2025
**Status**: 📋 PLANNING PHASE - NO CODE CHANGES YET
**Related Documents**:
- [TODO_FIX_METRO_ISSUES.md](./TODO_FIX_METRO_ISSUES.md) - Package configuration fixes
- [METRO_ANALYSIS_AND_RECOMMENDATIONS.md](./METRO_ANALYSIS_AND_RECOMMENDATIONS.md) - Package resolution analysis

---

## Executive Summary

This document outlines a comprehensive strategy to prevent Metro bundler cache cross-contamination when running multiple React Native/Expo applications simultaneously, specifically targeting the `example` (Expo Go) and `example-dev-build` (Development Build) apps in this monorepo.

**Current Problem**: When running both example apps simultaneously on different ports or simulators, Metro's shared cache system causes:
- Apps appearing on wrong simulators
- Mixed environment variables between projects
- Cached modules from one app serving to another
- Reload commands affecting all running instances

**Root Causes Identified**:
1. **Identical Metro cache keys** - Both apps use similar default Expo Metro configs
2. **Shared system cache directory** - `/tmp/metro-*` used by all Metro instances
3. **Singleton Watchman daemon** - Single system-level file watcher for all projects
4. **Global device connections** - ADB reverse and iOS networking don't isolate per-project
5. **SDK 54 architectural changes** - ESM support, autolinking rewrites, live bindings intensify contamination

---

## Current State Analysis

### What We Have Now

**example/metro.config.js (Expo Go)**:
```javascript
const config = getDefaultConfig(__dirname);
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [...];
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['react-native', 'require'];
```

**example-dev-build/metro.config.js (Development Build)**:
```javascript
const config = getDefaultConfig(__dirname);
config.projectNameCacheKey = "example-dev-build"; // ✅ Already has unique cache key!
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [...];
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['react-native', 'require'];
```

**Key Observation**: The `example-dev-build` app already has `config.projectNameCacheKey = "example-dev-build"` (line 5), which is **exactly the right approach**! However, the `example` app is missing this, so it's generating default cache keys that could collide.

### Gap Analysis

| Issue | example | example-dev-build | Impact |
|-------|---------|-------------------|--------|
| Unique cache key | ❌ Missing | ✅ Has `projectNameCacheKey` | High - cache collision |
| Custom cache directory | ❌ Missing | ❌ Missing | Medium - shared `/tmp/metro-*` |
| File map cache isolation | ❌ Missing | ❌ Missing | Medium - shared haste maps |
| Dedicated port assignment | ⚠️ Dynamic | ⚠️ Dynamic | High - device forwarding issues |
| stickyWorkers configuration | ❌ Default (true) | ❌ Default (true) | Medium - worker state bleed |
| Watchman isolation | 🚫 Impossible | 🚫 Impossible | Low - architectural limitation |

---

## Strategic Recommendations

### Phase 1: Immediate Fixes (Critical Priority)

These changes provide maximum isolation with minimal complexity and are safe to implement immediately.

#### 1.1: Add Unique Cache Keys to Both Apps

**Why**: Forces Metro to compute different cache keys even with identical configurations.

**Changes Required**:

**File**: `example/metro.config.js`
```javascript
const config = getDefaultConfig(__dirname);

// Add unique cache key using package name
config.cacheVersion = require('./package.json').name; // "example"

// Existing config continues...
config.watchFolders = [monorepoRoot];
// ...
```

**File**: `example-dev-build/metro.config.js`
```javascript
const config = getDefaultConfig(__dirname);

// Replace existing projectNameCacheKey with standard cacheVersion
config.cacheVersion = require('./package.json').name; // "example-dev-build"
// Note: Remove line 5 `config.projectNameCacheKey = "example-dev-build";`

// Existing config continues...
config.watchFolders = [monorepoRoot];
// ...
```

**Research Note**: While `projectNameCacheKey` works, `cacheVersion` is the documented Metro config property. Standardizing on `cacheVersion` ensures consistency with Metro's official API.

**Expected Impact**:
- ✅ Eliminates cache key collision
- ✅ Each app gets separate cache entries in shared temp directory
- ✅ No breaking changes to existing functionality
- ⏱️ Implementation time: 5 minutes

---

#### 1.2: Disable Sticky Workers for Multi-Instance Scenarios

**Why**: Prevents worker state from bleeding between concurrent Metro instances.

**Changes Required**:

**Both** `example/metro.config.js` and `example-dev-build/metro.config.js`:
```javascript
const config = getDefaultConfig(__dirname);

config.cacheVersion = require('./package.json').name;

// Disable sticky workers for concurrent development
config.stickyWorkers = false;

// Existing config continues...
```

**Trade-off Analysis**:
- ❌ Slightly slower cold starts (workers don't maintain file affinity)
- ✅ Prevents worker contamination between instances
- ✅ Better concurrent build performance (Metro documentation confirms this)

**When to Keep Enabled**: If you're ONLY running one app at a time, sticky workers can remain enabled for better performance. Consider making this configurable via environment variable.

**Alternative Approach** (environment-based):
```javascript
// Enable sticky workers only when running single instance
config.stickyWorkers = process.env.METRO_SINGLE_INSTANCE === 'true';
```

**Expected Impact**:
- ✅ Eliminates worker state contamination
- ⚠️ Minimal performance impact (milliseconds on transform operations)
- ⏱️ Implementation time: 2 minutes

---

#### 1.3: Establish Fixed Port Assignments

**Why**: Prevents device connection cross-contamination and makes ADB reverse configuration predictable.

**Changes Required**:

**File**: `example/package.json`
```json
{
  "scripts": {
    "start": "expo start --port 8081",
    "start:clean": "expo start --clear --port 8081",
    "ios": "EXPO_IOS_SIMULATOR_DEVICE_NAME=\"iPhone 16 Pro Max\" expo start --ios --port 8081",
    "android": "expo start --android --port 8081"
  }
}
```

**File**: `example-dev-build/package.json`
```json
{
  "scripts": {
    "start": "expo start --port 8082",
    "start:clean": "expo start --clear --port 8082",
    "ios": "EXPO_IOS_SIMULATOR_DEVICE_NAME=\"iPhone 16 Pro Max\" expo start --ios --port 8082",
    "android": "expo run:android --port 8082"
  }
}
```

**Additional Setup Required** (documented in developer workflow):

For Android:
```bash
# Terminal 1 - Running example app
adb reverse tcp:8081 tcp:8081

# Terminal 2 - Running example-dev-build
adb reverse tcp:8082 tcp:8082
```

For iOS:
- Simulator A: Dev Menu → Configure Bundler → `localhost:8081`
- Simulator B: Dev Menu → Configure Bundler → `localhost:8082`

**Expected Impact**:
- ✅ Predictable port assignments
- ✅ Documented device forwarding setup
- ✅ Eliminates "last app wins" on all simulators problem
- ⏱️ Implementation time: 10 minutes (including documentation)

---

### Phase 2: Enhanced Isolation (High Priority)

These changes provide filesystem-level isolation and are recommended for production-quality multi-project workflows.

#### 2.1: Project-Specific Cache Directories

**Why**: Complete physical separation of cache artifacts eliminates any possibility of cache sharing at the filesystem level.

**Changes Required**:

**Both** `example/metro.config.js` and `example-dev-build/metro.config.js`:
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

// Unique cache version
config.cacheVersion = require('./package.json').name;

// Project-specific cache directory (instead of shared /tmp)
config.cacheStores = [
  new (require('metro-cache').FileStore)({
    root: path.join(projectRoot, 'node_modules', '.cache', 'metro'),
  }),
];

// Project-specific file map cache
config.fileMapCacheDirectory = path.join(projectRoot, '.metro-file-map');

// Disable sticky workers for concurrent development
config.stickyWorkers = false;

// Existing monorepo config
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['react-native', 'require'];

module.exports = config;
```

**Git Ignore Updates**:

**File**: `.gitignore` (root)
```
# Metro cache directories
example/node_modules/.cache/
example/.metro-file-map/
example-dev-build/node_modules/.cache/
example-dev-build/.metro-file-map/
```

**Expected Impact**:
- ✅ Complete cache isolation at filesystem level
- ✅ No reliance on `/tmp` directory
- ✅ Cache persists across system reboots
- ✅ Easier to clean individual project caches
- ⚠️ Slightly larger disk usage (each project has own cache)
- ⏱️ Implementation time: 15 minutes

---

#### 2.2: Explicit Project Root Boundaries

**Why**: Prevents Metro from scanning outside intended directories, reducing Watchman load and improving isolation.

**Changes Required**:

**Both** `example/metro.config.js` and `example-dev-build/metro.config.js`:
```javascript
const config = getDefaultConfig(__dirname);
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

// Explicit project root
config.projectRoot = projectRoot;

// Limit watch folders to only necessary directories
// Current: watches entire monorepoRoot
// Optimized: explicitly list what's needed
config.watchFolders = [
  monorepoRoot, // Still need this for workspace packages
];

// Alternative: More restricted (if needed for extreme isolation)
// config.watchFolders = [
//   path.join(monorepoRoot, 'packages'),
// ];
```

**Trade-off Analysis**:
- Current approach: Watches entire monorepo root (safe, works with pnpm workspaces)
- Restricted approach: Only watches `packages/` directory (reduces file count but may break hot reload if other workspace dependencies exist)

**Recommendation**: Keep current approach unless experiencing "too many open files" errors.

**Expected Impact**:
- ✅ Explicit boundaries documented in code
- ⚠️ Minimal change from current setup (already watching monorepoRoot)
- ⏱️ Implementation time: 5 minutes

---

### Phase 3: Developer Experience Improvements (Medium Priority)

These changes make it easier for developers to maintain cache isolation in their daily workflows.

#### 3.1: Cache Management Scripts

**Why**: Automates cache clearing, reducing human error in multi-project workflows.

**New Files to Create**:

**File**: `scripts/clean-cache.sh`
```bash
#!/bin/bash
set -e

PROJECT=$1

function clean_all() {
  echo "🧹 Cleaning all Metro caches..."
  watchman watch-del-all
  rm -rf /tmp/metro-* /tmp/haste-map-*
  rm -rf example/node_modules/.cache example/.metro-file-map
  rm -rf example-dev-build/node_modules/.cache example-dev-build/.metro-file-map
  echo "✅ All caches cleaned"
}

function clean_example() {
  echo "🧹 Cleaning example app cache..."
  rm -rf example/node_modules/.cache example/.metro-file-map
  echo "✅ example cache cleaned"
}

function clean_dev_build() {
  echo "🧹 Cleaning example-dev-build cache..."
  rm -rf example-dev-build/node_modules/.cache example-dev-build/.metro-file-map
  echo "✅ example-dev-build cache cleaned"
}

case "$PROJECT" in
  all|"")
    clean_all
    ;;
  example|go)
    clean_example
    ;;
  dev|dev-build)
    clean_dev_build
    ;;
  *)
    echo "Usage: ./scripts/clean-cache.sh [all|example|dev-build]"
    exit 1
    ;;
esac
```

**File**: `scripts/start-example.sh`
```bash
#!/bin/bash
set -e

APP=$1
CLEAN=${2:-false}

if [[ "$CLEAN" == "--clean" ]]; then
  ./scripts/clean-cache.sh "$APP"
fi

case "$APP" in
  example|go)
    cd example
    pnpm start
    ;;
  dev|dev-build)
    cd example-dev-build
    pnpm start
    ;;
  *)
    echo "Usage: ./scripts/start-example.sh [example|dev-build] [--clean]"
    exit 1
    ;;
esac
```

**Package.json Updates**:

**File**: `package.json` (root)
```json
{
  "scripts": {
    "clean:cache": "bash scripts/clean-cache.sh all",
    "clean:cache:example": "bash scripts/clean-cache.sh example",
    "clean:cache:dev": "bash scripts/clean-cache.sh dev-build",

    "start:example": "bash scripts/start-example.sh example",
    "start:dev": "bash scripts/start-example.sh dev-build",
    "start:example:clean": "bash scripts/start-example.sh example --clean",
    "start:dev:clean": "bash scripts/start-example.sh dev-build --clean"
  }
}
```

**Expected Impact**:
- ✅ One-command cache clearing
- ✅ Project-specific or global cache management
- ✅ Integration with start scripts
- ⏱️ Implementation time: 30 minutes (including testing)

---

#### 3.2: Developer Workflow Documentation

**Why**: Ensures all developers understand the multi-instance isolation setup.

**New File**: `DEVELOPMENT_WORKFLOW.md`

**Sections to Include**:
1. **Running Multiple Apps Simultaneously**
   - Port assignments (8081 for example, 8082 for dev-build)
   - Device forwarding setup (ADB reverse, iOS config)
   - Cache isolation explanation

2. **Cache Management**
   - When to clear cache (switching projects, weird behavior)
   - Project-specific vs global cleaning
   - Cache location reference

3. **Troubleshooting Multi-Instance Issues**
   - Symptom: Wrong app appears on simulator
   - Symptom: Environment variables mixed up
   - Symptom: Hot reload affects wrong app

4. **Best Practices**
   - Always use `--clear` flag when switching contexts
   - Verify port assignment before starting
   - Check ADB reverse configuration

5. **Quick Reference Commands**
   ```bash
   # Start example app (Expo Go)
   pnpm run start:example:clean

   # Start dev build app
   pnpm run start:dev:clean

   # Clean all caches
   pnpm run clean:cache
   ```

**Expected Impact**:
- ✅ Reduced developer confusion
- ✅ Faster onboarding for new contributors
- ✅ Documented troubleshooting steps
- ⏱️ Implementation time: 1 hour

---

#### 3.3: VS Code Workspace Configuration

**Why**: Provides IDE-level separation for better developer experience.

**New File**: `.vscode/multi-root.code-workspace`
```json
{
  "folders": [
    {
      "name": "🎯 Root",
      "path": "."
    },
    {
      "name": "📱 Example (Expo Go) - Port 8081",
      "path": "example"
    },
    {
      "name": "🔧 Example Dev Build - Port 8082",
      "path": "example-dev-build"
    },
    {
      "name": "📦 Packages",
      "path": "packages"
    }
  ],
  "settings": {
    "terminal.integrated.cwd": "${workspaceFolder}",
    "files.exclude": {
      "**/node_modules": true,
      "**/.metro-file-map": true,
      "**/node_modules/.cache": true
    }
  }
}
```

**Update**: `.vscode/settings.json`
```json
{
  "terminal.integrated.env.osx": {
    "METRO_PORT_EXAMPLE": "8081",
    "METRO_PORT_DEV_BUILD": "8082"
  },
  "terminal.integrated.env.linux": {
    "METRO_PORT_EXAMPLE": "8081",
    "METRO_PORT_DEV_BUILD": "8082"
  }
}
```

**Expected Impact**:
- ✅ Visual separation of example apps in VS Code
- ✅ Environment variables available in integrated terminal
- ✅ Cleaner file tree (hides cache directories)
- ⏱️ Implementation time: 15 minutes

---

### Phase 4: Advanced Strategies (Optional)

These are more complex approaches for extreme isolation scenarios or as future improvements.

#### 4.1: Environment Variable-Based Configuration

**Why**: Allows dynamic switching between single-instance (performance) and multi-instance (isolation) modes.

**Conceptual Approach**:

**File**: `metro.config.base.js` (new shared config)
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

function createMetroConfig(projectName, projectRoot) {
  const config = getDefaultConfig(projectRoot);
  const monorepoRoot = path.resolve(projectRoot, '..');

  // Multi-instance mode (default for monorepo development)
  const isMultiInstance = process.env.METRO_SINGLE_INSTANCE !== 'true';

  config.cacheVersion = projectName;
  config.stickyWorkers = !isMultiInstance;

  if (isMultiInstance) {
    // Enhanced isolation for concurrent development
    config.cacheStores = [
      new (require('metro-cache').FileStore)({
        root: path.join(projectRoot, 'node_modules', '.cache', 'metro'),
      }),
    ];
    config.fileMapCacheDirectory = path.join(projectRoot, '.metro-file-map');
  }
  // else: use default temp directory for single instance

  // Standard monorepo config
  config.watchFolders = [monorepoRoot];
  config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(monorepoRoot, 'node_modules'),
  ];
  config.resolver.unstable_enablePackageExports = true;
  config.resolver.unstable_conditionNames = ['react-native', 'require'];

  return config;
}

module.exports = { createMetroConfig };
```

**File**: `example/metro.config.js`
```javascript
const { createMetroConfig } = require('../metro.config.base');
module.exports = createMetroConfig('example', __dirname);
```

**File**: `example-dev-build/metro.config.js`
```javascript
const { createMetroConfig } = require('../metro.config.base');
module.exports = createMetroConfig('example-dev-build', __dirname);
```

**Usage**:
```bash
# Multi-instance mode (default, maximum isolation)
pnpm run start:example

# Single-instance mode (performance optimization when only one app running)
METRO_SINGLE_INSTANCE=true pnpm run start:example
```

**Expected Impact**:
- ✅ DRY configuration (shared logic)
- ✅ Flexible mode switching
- ✅ Easier to maintain consistency
- ⚠️ Adds abstraction layer
- ⏱️ Implementation time: 45 minutes

---

#### 4.2: Docker-Based Complete Isolation (Advanced)

**Why**: Guarantees 100% isolation when Watchman contamination is unacceptable.

**Conceptual Approach**:

**File**: `docker/metro.Dockerfile`
```dockerfile
FROM node:18-alpine

RUN apk add --no-cache git watchman

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .

RUN pnpm run build

EXPOSE 8081

CMD ["pnpm", "start"]
```

**File**: `docker-compose.yml`
```yaml
version: '3.8'

services:
  example-app:
    build:
      context: .
      dockerfile: docker/metro.Dockerfile
    working_dir: /app/example
    ports:
      - "8081:8081"
    volumes:
      - ./example:/app/example
      - ./packages:/app/packages
      - example-cache:/app/example/node_modules/.cache
    command: pnpm start

  dev-build-app:
    build:
      context: .
      dockerfile: docker/metro.Dockerfile
    working_dir: /app/example-dev-build
    ports:
      - "8082:8082"
    volumes:
      - ./example-dev-build:/app/example-dev-build
      - ./packages:/app/packages
      - dev-build-cache:/app/example-dev-build/node_modules/.cache
    command: pnpm start

volumes:
  example-cache:
  dev-build-cache:
```

**Usage**:
```bash
# Start both apps in isolated containers
docker-compose up

# Start individual app
docker-compose up example-app
```

**Trade-offs**:
- ✅ Complete isolation (separate Watchman instances)
- ✅ Reproducible environments
- ❌ Complex setup for developers
- ❌ Slower hot reload (file watching through Docker volumes)
- ❌ Increased resource usage

**Recommendation**: Only implement if standard isolation approaches fail or for CI/CD testing environments.

**Expected Impact**:
- ✅ Nuclear option for isolation
- ⚠️ Significant complexity increase
- ⏱️ Implementation time: 4+ hours (including testing)

---

### Phase 5: Monitoring & Validation

#### 5.1: Cache Health Monitoring Script

**File**: `scripts/check-cache-health.sh`
```bash
#!/bin/bash

echo "📊 Metro Cache Health Report"
echo "=============================="
echo

# Check system temp caches
SYSTEM_CACHE_SIZE=$(du -sh /tmp/metro-* 2>/dev/null | awk '{sum+=$1} END {print sum}')
echo "System /tmp cache: ${SYSTEM_CACHE_SIZE}MB"

# Check project-specific caches
EXAMPLE_CACHE_SIZE=$(du -sh example/node_modules/.cache 2>/dev/null | awk '{print $1}')
DEV_CACHE_SIZE=$(du -sh example-dev-build/node_modules/.cache 2>/dev/null | awk '{print $1}')

echo "example cache: ${EXAMPLE_CACHE_SIZE}"
echo "example-dev-build cache: ${DEV_CACHE_SIZE}"

# Check Watchman status
echo
echo "Watchman status:"
watchman watch-list

# Check for potential issues
if [[ -d "/tmp/metro-cache" ]]; then
  echo
  echo "⚠️  WARNING: Shared /tmp/metro-cache detected"
  echo "   Consider implementing project-specific cache directories"
fi

# Check if both apps running
EXAMPLE_RUNNING=$(lsof -ti:8081 2>/dev/null)
DEV_RUNNING=$(lsof -ti:8082 2>/dev/null)

echo
if [[ -n "$EXAMPLE_RUNNING" && -n "$DEV_RUNNING" ]]; then
  echo "✅ Both apps running on correct ports"
  echo "   example: :8081 (PID: $EXAMPLE_RUNNING)"
  echo "   dev-build: :8082 (PID: $DEV_RUNNING)"
elif [[ -n "$EXAMPLE_RUNNING" || -n "$DEV_RUNNING" ]]; then
  echo "ℹ️  Single app running (multi-instance not detected)"
else
  echo "ℹ️  No apps currently running"
fi
```

**Usage**:
```bash
# Check cache health
./scripts/check-cache-health.sh

# Add to package.json
pnpm run cache:health
```

---

#### 5.2: Validation Tests

**File**: `scripts/validate-isolation.sh`
```bash
#!/bin/bash
set -e

echo "🧪 Testing Metro cache isolation..."

# Clean slate
./scripts/clean-cache.sh all

# Start example app in background
cd example
EXPO_ENV_VAR_EXAMPLE="from-example" pnpm start &
EXAMPLE_PID=$!
cd ..

# Wait for Metro to boot
sleep 10

# Start dev build in background
cd example-dev-build
EXPO_ENV_VAR_DEVBUILD="from-dev-build" pnpm start &
DEVBUILD_PID=$!
cd ..

# Wait for Metro to boot
sleep 10

# Check isolation
echo "Checking environment variable isolation..."
# Test commands would go here

# Cleanup
kill $EXAMPLE_PID $DEVBUILD_PID

echo "✅ Isolation test complete"
```

---

## Implementation Roadmap

### Week 1: Critical Fixes
- [ ] **Day 1-2**: Implement Phase 1 (Unique cache keys, sticky workers, port assignments)
- [ ] **Day 3**: Test both apps running simultaneously
- [ ] **Day 4**: Update CLAUDE.md with new cache rules
- [ ] **Day 5**: Create cache management scripts (Phase 3.1)

### Week 2: Enhanced Isolation
- [ ] **Day 1-2**: Implement Phase 2 (Project-specific cache directories)
- [ ] **Day 3**: Update .gitignore and test clean builds
- [ ] **Day 4**: Write DEVELOPMENT_WORKFLOW.md (Phase 3.2)
- [ ] **Day 5**: Create VS Code workspace config (Phase 3.3)

### Week 3: Validation & Monitoring
- [ ] **Day 1-2**: Implement cache health monitoring (Phase 5.1)
- [ ] **Day 3**: Create validation tests (Phase 5.2)
- [ ] **Day 4-5**: Full system testing with both apps

### Future Considerations
- **Month 2**: Evaluate environment-based configuration (Phase 4.1) if needed
- **Month 3+**: Consider Docker isolation (Phase 4.2) only if problems persist

---

## Success Criteria

After implementation, the following should be true:

✅ **Cache Isolation**:
- Running `example` and `example-dev-build` simultaneously shows no cache mixing
- Each app serves correct environment variables
- Metro logs show distinct cache directories

✅ **Device Isolation**:
- Simulator A connected to port 8081 shows `example` app only
- Simulator B connected to port 8082 shows `example-dev-build` app only
- Reload in Terminal 1 only affects app on port 8081

✅ **Developer Experience**:
- Clear documentation for running multiple apps
- One-command cache clearing
- Predictable port assignments

✅ **Build System Integrity**:
- No impact on existing pnpm workspace structure
- Hot reload still works for package changes
- Type checking and builds unaffected

---

## Risk Assessment

### Low Risk ✅
- Adding `cacheVersion` property (standard Metro config)
- Disabling `stickyWorkers` (documented Metro option)
- Fixed port assignments (already common practice)
- Cache management scripts (automation only)

### Medium Risk ⚠️
- Project-specific cache directories (changes Metro defaults, test thoroughly)
- Shared config abstraction (adds complexity, needs good documentation)

### High Risk ❌
- Docker-based isolation (major workflow change, only if necessary)
- Modifying Watchman configuration (system-level daemon, limited control)

---

## Open Questions

1. **Shared config vs duplicated config**: Should we create `metro.config.base.js` (Phase 4.1) immediately, or wait to see if the simpler approach works?

   **Recommendation**: Start with duplicated configs in Phase 1-2. If we find ourselves updating both configs frequently, move to shared config in Phase 4.1.

2. **Watchman mitigation**: Can we improve Watchman isolation without Docker?

   **Research Finding**: Metro doesn't support multiple Watchman instances natively. Best mitigation is reducing watched file count and accepting shared state. Full isolation requires Docker.

3. **Environment variable isolation**: Should we add `.env.example` and `.env.dev-build` files?

   **Recommendation**: Yes, create separate env files and document in DEVELOPMENT_WORKFLOW.md. Use `EXPO_PUBLIC_*` prefix for proper Expo SDK 54 support.

4. **CI/CD impact**: How do these changes affect GitHub Actions workflows?

   **Analysis**: No impact expected. CI runs one job at a time, so cache isolation not needed. May actually improve CI reliability by using predictable cache locations.

---

## Related Work

### Complements Existing Initiatives
- **TODO_FIX_METRO_ISSUES.md**: Package resolution and exports configuration
- **METRO_ANALYSIS_AND_RECOMMENDATIONS.md**: Package.json structure and build system

### Differences in Scope
- **This plan**: Runtime isolation for concurrent development
- **TODO_FIX_METRO_ISSUES**: Published package correctness and TypeScript resolution

### No Conflicts
- All proposed changes are orthogonal to package configuration work
- Can implement independently or in parallel

---

## Conclusion

The Metro cache cross-contamination issue is a **confirmed architectural limitation** of Metro bundler, not a bug. However, with proper configuration, we can achieve reliable isolation for the `rn-buoy` monorepo's two example apps.

**Recommended Approach**:
1. **Immediate**: Implement Phase 1 (unique cache keys, sticky workers, ports)
2. **This week**: Implement Phase 2 (project-specific cache directories)
3. **This month**: Implement Phase 3 (developer experience improvements)
4. **Only if needed**: Phase 4 (advanced strategies)

**Expected Outcome**: Developers can confidently run both example apps simultaneously without cache mixing, environment variable cross-contamination, or device connection issues.

**Total Implementation Time**:
- Phase 1: 20 minutes (critical fixes)
- Phase 2: 30 minutes (enhanced isolation)
- Phase 3: 2 hours (developer experience)
- Total: ~3 hours for complete solution

**Maintenance Burden**: Low - once configured, Metro handles isolation automatically. Cache management scripts reduce manual intervention.

---

**Next Steps**: Review this plan, approve phases to implement, then proceed with code changes following the roadmap.
