// Test the exports field with the new structure
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

console.log('Testing @react-buoy/core exports...');

try {
  // Test package.json export
  const packagePath = require.resolve('@react-buoy/core/package.json');
  console.log('✅ package.json export works:', packagePath);
} catch (error) {
  console.log('❌ package.json export failed:', error.message);
}

try {
  // Test main export
  const mainPath = require.resolve('@react-buoy/core');
  console.log('✅ main export works:', mainPath);
} catch (error) {
  console.log('❌ main export failed:', error.message);
}

try {
  // Check TypeScript declarations
  const fs = require('fs');
  const typesPath = './packages/devtools-floating-menu/lib/typescript/src/index.d.ts';
  if (fs.existsSync(typesPath)) {
    console.log('✅ TypeScript declarations exist at expected path');
  } else {
    console.log('❌ TypeScript declarations missing');
  }
} catch (error) {
  console.log('❌ TypeScript check failed:', error.message);
}