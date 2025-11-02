#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

let viteCliPath;
try {
  viteCliPath = require.resolve('vite/bin/vite.js');
} catch (error) {
  console.error(
    'Unable to find the Vite CLI. Please run "npm install" with access to the npm registry before running this command.'
  );
  console.error(`Original error: ${error.message}`);
  process.exit(1);
}

const args = process.argv.slice(2);

const child = spawn(process.execPath, [viteCliPath, ...args], {
  stdio: 'inherit',
  env: process.env,
});

child.on('close', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});
