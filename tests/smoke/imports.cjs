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

function verifyRelativeFile(pkgDir, filePath, label) {
  if (!filePath) {
    failures.push(`${label} missing in package.json exports`);
    return;
  }
  const fullPath = path.join(pkgDir, filePath);
  if (!fs.existsSync(fullPath)) {
    failures.push(`Missing ${label} file: ${fullPath}`);
  }
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
    verifyRelativeFile(dir, exportsField.import?.replace('./', ''), `${scope} import entry`);
    verifyRelativeFile(dir, exportsField.require?.replace('./', ''), `${scope} require entry`);
    verifyRelativeFile(dir, exportsField.types?.replace('./', ''), `${scope} types entry`);
  }

  if (pkgJson.types) {
    verifyRelativeFile(dir, pkgJson.types.replace('./', ''), `${scope} types`);
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
