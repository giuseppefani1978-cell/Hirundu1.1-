import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
test('shared Arkanoid feedback stays within arena and avoids controls', async () => {
 const shared=await readFile(new URL('../public/level3-arkanoid/style.css',import.meta.url),'utf8');
 const l5=await readFile(new URL('../public/level5-arkanoid/style.css',import.meta.url),'utf8');
 const l7=await readFile(new URL('../public/level7-arkanoid/style.css',import.meta.url),'utf8');
 assert.match(shared,/RC1: transient battle feedback/);
 assert.match(shared,/body\.battle-active #message\{\s*position:absolute;/);
 assert.match(shared,/pointer-events:none;/);
 assert.match(l5,/@import url\('\.\.\/level3-arkanoid\/style\.css/);
 assert.match(l7,/@import url\('\.\.\/level3-arkanoid\/style\.css/);
});
