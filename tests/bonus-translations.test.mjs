import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const messages=read('src/features/qr/i18n/messages.json');
test('bonus pages include all four languages, including partner descriptions and QR scenarios',()=>{
 for(const [key,entry] of Object.entries(messages)) for(const lang of ['fr','it','en','es']) assert.ok(entry[lang]?.trim(),`${key} missing ${lang}`);
 for(const partner of read('src/data/partners.json')) assert.ok(messages[partner.description],partner.id);
 for(const scenario of read('src/data/qr_scenarios.json')) {
  assert.ok(messages[scenario.label],scenario.id);
  if(scenario.notes) assert.ok(messages[scenario.notes],scenario.id+' notes');
 }
});
