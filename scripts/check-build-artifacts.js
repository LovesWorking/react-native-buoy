#!/usr/bin/env node

/**
 * Checks for build artifacts in src directories
 * Build artifacts should only be in lib/ directories, not src/
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔍 Checking for build artifacts in src directories...\n');

try {
  // Find all .d.ts and .d.ts.map files in src directories
  // Exclude legitimate type declaration files
  const result = execSync(
    `find packages/*/src -type f \\( -name "*.d.ts" -o -name "*.d.ts.map" \\) ! -name "optionalModules.d.ts" 2>/dev/null || true`,
    { encoding: 'utf8', cwd: path.join(__dirname, '..') }
  );

  const files = result.trim().split('\n').filter(Boolean);

  // Note: We only check for .d.ts and .d.ts.map files, not .js files
  // Some packages may have legitimate .js source files (e.g., debug-borders)

  if (files.length === 0) {
    console.log('✅ No build artifacts found in src directories.\n');
    console.log('All build outputs are correctly isolated in lib/ directories.');
    process.exit(0);
  } else {
    console.error('❌ Found build artifacts in src directories:\n');
    files.forEach(file => console.error(`   ${file}`));
    console.error('\n⚠️  These files should not be in src directories!');
    console.error('\n💡 This usually happens when `tsc` is run directly instead of using `pnpm run build`.');
    console.error('\n🔧 To fix:');
    console.error('   1. Delete these files');
    console.error('   2. Run: pnpm run clean');
    console.error('   3. Run: pnpm run build');
    console.error('\n⚠️  Remember: Always use `pnpm run build`, never run `tsc` directly!\n');
    process.exit(1);
  }
} catch (error) {
  console.error('Error checking for build artifacts:', error.message);
  process.exit(1);
}
