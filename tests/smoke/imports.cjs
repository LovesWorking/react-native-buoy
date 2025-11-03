const fs = require('fs');
const path = require('path');

const packages = [
  { scope: '@react-buoy/core', dir: 'packages/devtools-floating-menu' },
  { scope: '@react-buoy/shared-ui', dir: 'packages/shared' },
  { scope: '@react-buoy/env', dir: 'packages/env-tools' },
  { scope: '@react-buoy/network', dir: 'packages/network' },
  { scope: '@react-buoy/storage', dir: 'packages/storage' },
  { scope: '@react-buoy/react-query', dir: 'packages/react-query' },
  { scope: '@react-buoy/route-events', dir: 'packages/route-events' },
  { scope: '@react-buoy/debug-borders', dir: 'packages/debug-borders' },
];

const failures = [];

function normalizeRelativePath(target) {
  if (typeof target !== 'string') {
    return null;
  }
  return target.startsWith('./') ? target.slice(2) : target;
}

function verifyRelativeFile(pkgDir, filePath, label) {
  const normalised = normalizeRelativePath(filePath);
  if (!normalised) {
    failures.push(`${label} missing in package.json exports`);
    return;
  }
  const fullPath = path.join(pkgDir, normalised);
  if (!fs.existsSync(fullPath)) {
    failures.push(`Missing ${label} file: ${fullPath}`);
  }
}

function verifyTraditionalStructure(pkgDir, pkgJson, scope) {
  // Check main field
  if (pkgJson.main) {
    const mainPath = path.join(pkgDir, pkgJson.main.endsWith('.js') ? pkgJson.main : pkgJson.main + '.js');
    if (!fs.existsSync(mainPath)) {
      failures.push(`${scope}: main field points to missing file: ${mainPath}`);
    }
  } else {
    failures.push(`${scope}: main field missing`);
  }

  // Check module field
  if (pkgJson.module) {
    const modulePath = path.join(pkgDir, pkgJson.module.endsWith('.js') ? pkgJson.module : pkgJson.module + '.js');
    if (!fs.existsSync(modulePath)) {
      failures.push(`${scope}: module field points to missing file: ${modulePath}`);
    }
  }

  // Check types field
  if (pkgJson.types) {
    const typesPath = path.join(pkgDir, pkgJson.types);
    if (!fs.existsSync(typesPath)) {
      failures.push(`${scope}: types field points to missing file: ${typesPath}`);
    }
  } else {
    failures.push(`${scope}: types field missing`);
  }

  // Check source field
  if (pkgJson.source) {
    const sourcePath = path.join(pkgDir, pkgJson.source);
    if (!fs.existsSync(sourcePath)) {
      failures.push(`${scope}: source field points to missing file: ${sourcePath}`);
    }
  }
}

for (const { scope, dir } of packages) {
  const pkgJsonPath = path.join(dir, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) {
    failures.push(`Missing package.json for ${scope}`);
    continue;
  }

  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));

  console.log(`\nChecking ${scope}`);

  // Check for traditional package structure (main, module, types)
  // shared-ui still uses exports, so handle both cases
  if (pkgJson.exports && scope === '@react-buoy/shared-ui') {
    const exportsField = pkgJson.exports?.['.'];
    if (!exportsField) {
      failures.push(`${scope}: exports["."] is missing`);
    } else {
      // Check exports structure for shared-ui
      if (exportsField.import && exportsField.require) {
        verifyRelativeFile(dir, exportsField.import.default, `${scope} import entry`);
        verifyRelativeFile(dir, exportsField.require.default, `${scope} require entry`);
        verifyRelativeFile(dir, exportsField.import.types, `${scope} import types`);
        verifyRelativeFile(dir, exportsField.require.types, `${scope} require types`);
      }
    }
  } else {
    // Use traditional structure verification for other packages
    verifyTraditionalStructure(dir, pkgJson, scope);
  }

  const readmePath = path.join(dir, 'README.md');
  if (!fs.existsSync(readmePath)) {
    failures.push(`${scope}: README.md missing`);
  }

  const changelogPath = path.join(dir, 'CHANGELOG.md');
  if (!fs.existsSync(changelogPath)) {
    failures.push(`${scope}: CHANGELOG.md missing`);
  }
}

if (failures.length) {
  console.error('\nSmoke test failed:\n- ' + failures.join('\n- '));
  process.exit(1);
}

console.log('\nAll package exports and docs look good.');
