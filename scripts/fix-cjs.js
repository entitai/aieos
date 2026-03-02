#!/usr/bin/env node
/**
 * Post-build script: rename .js → .cjs and .d.ts → .d.cts in dist/cjs/
 * Also rewrites require() calls inside the renamed files so they point to .cjs.
 */
import { readdirSync, renameSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const CJS_DIR = new URL('../dist/cjs', import.meta.url).pathname;

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.name.endsWith('.js')) {
      // Rewrite internal require() references before renaming
      let src = readFileSync(full, 'utf8');
      src = src.replace(/require\("(\.\.?\/[^"]+)\.js"\)/g, 'require("$1.cjs")');
      writeFileSync(full, src);
      renameSync(full, full.replace(/\.js$/, '.cjs'));
    } else if (entry.name.endsWith('.d.ts')) {
      renameSync(full, full.replace(/\.d\.ts$/, '.d.cts'));
    } else if (entry.name.endsWith('.js.map')) {
      renameSync(full, full.replace(/\.js\.map$/, '.cjs.map'));
    }
  }
}

walk(CJS_DIR);
console.log('CJS output fixed: .js → .cjs');
