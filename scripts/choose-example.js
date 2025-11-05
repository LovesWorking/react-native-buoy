#!/usr/bin/env node

const readline = require('readline');
const { spawn } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const command = process.argv[2] || 'start';

console.log('\n🚀 Choose which example app to run:\n');
console.log('  1) Expo Go (example)');
console.log('  2) Development Build (example-dev-build)\n');

rl.question('Enter your choice (1 or 2): ', (answer) => {
  rl.close();

  let filter;

  if (answer === '1') {
    filter = 'example';
    console.log('\n✅ Running Expo Go app...\n');
  } else if (answer === '2') {
    filter = 'example-dev-build';
    console.log('\n✅ Running Development Build app...\n');
  } else {
    console.error('\n❌ Invalid choice. Please enter 1 or 2.');
    process.exit(1);
  }

  // Run the pnpm command with the chosen filter
  const child = spawn('pnpm', ['--filter', filter, command], {
    stdio: 'inherit',
    shell: true
  });

  child.on('exit', (code) => {
    process.exit(code);
  });
});
