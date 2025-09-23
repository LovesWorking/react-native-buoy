const fs = require('fs');
const path = require('path');

const packages = [
  { scope: '@react-buoy/core', dir: 'packages/devtools-floating-menu' },
  { scope: '@react-buoy/shared-ui', dir: 'packages/shared' },
  { scope: '@react-buoy/env', dir: 'packages/env-tools' },
  { scope: '@react-buoy/network', dir: 'packages/network' },
  { scope: '@react-buoy/storage', dir: 'packages/storage' },
  { scope: '@react-buoy/react-query', dir: 'packages/react-query' },
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

function verifyExportEntry(pkgDir, entry, label) {
  if (!entry) {
    failures.push(`${label} missing in package.json exports`);
    return;
  }

  if (typeof entry === 'string') {
    verifyRelativeFile(pkgDir, entry, label);
    return;
  }

  if (typeof entry === 'object') {
    if (entry.default) {
      verifyRelativeFile(pkgDir, entry.default, `${label} default`);
    } else {
      failures.push(`${label} default missing in package.json exports`);
    }

    if (entry.types) {
      verifyRelativeFile(pkgDir, entry.types, `${label} types`);
    }

    return;
  }

  failures.push(`${label} entry has unsupported type (${typeof entry})`);
}

for (const { scope, dir } of packages) {
  const pkgJsonPath = path.join(dir, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) {
    failures.push(`Missing package.json for ${scope}`);
    continue;
  }

  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  const exportsField = pkgJson.exports?.['.'];

  console.log(`\nChecking ${scope}`);

  if (!exportsField) {
    failures.push(`${scope}: exports["."] is missing`);
  } else {
    verifyExportEntry(dir, exportsField.import, `${scope} import entry`);
    verifyExportEntry(dir, exportsField.require, `${scope} require entry`);
    if (exportsField.types) {
      verifyRelativeFile(dir, exportsField.types, `${scope} types entry`);
    }
  }

  if (pkgJson.types) {
    verifyRelativeFile(dir, pkgJson.types, `${scope} types`);
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
