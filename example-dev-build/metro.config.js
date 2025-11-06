const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

// Watch all workspace roots for changes
config.watchFolders = [monorepoRoot];

// Ensure Metro can resolve modules from workspace packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// IMPORTANT: Tell Metro to watch the SOURCE files, not the built files
// This enables hot reload when you edit package source
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['source', 'import', 'require'];

module.exports = config;