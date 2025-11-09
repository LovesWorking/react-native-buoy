const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

// Unique cache key to prevent cache collision with other Metro instances
config.cacheVersion = require('./package.json').name;

// Disable sticky workers to prevent worker state contamination between instances
config.stickyWorkers = false;

// Project-specific cache directory (instead of shared /tmp)
config.cacheStores = [
  new (require('metro-cache').FileStore)({
    root: path.join(projectRoot, 'node_modules', '.cache', 'metro'),
  }),
];

// Project-specific file map cache
config.fileMapCacheDirectory = path.join(projectRoot, '.metro-file-map');

// Watch all workspace roots for changes
config.watchFolders = [monorepoRoot];

// Ensure Metro can resolve modules from workspace packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// IMPORTANT: Include 'react-native' condition for proper package resolution
// This is critical for packages that use conditional exports
// Metro Source: /rn-metro-clone/packages/metro-config/src/defaults/index.js:50
// Reference: TODO_FIX_METRO_ISSUES.md - Section 1, Task 1.1
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['react-native', 'require'];

module.exports = config;