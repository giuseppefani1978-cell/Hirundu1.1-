#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

let viteCliPath;
try {
  const vitePkg = require('vite/package.json');
  const pkgDir = new URL('./', require.resolve('vite/package.json')).pathname;
  const binEntry =
    (typeof vitePkg?.bin === 'string' && vitePkg.bin) ||
    (vitePkg?.bin && typeof vitePkg.bin === 'object' ? vitePkg.bin.vite : null);

  if (!binEntry) {
    throw new Error('Unable to determine vite binary from package.json');
  }

  viteCliPath = require.resolve(binEntry, { paths: [pkgDir] });
} catch (error) {
  try {
    viteCliPath = require.resolve('vite/bin/vite.js');
  } catch (fallbackError) {
    console.error(
      'Unable to find the Vite CLI. Please run "npm install" with access to the npm registry before running this command.'
    );
    console.error(`Original error: ${error.message}`);
    console.error(`Fallback error: ${fallbackError.message}`);
    process.exit(1);
  }
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
