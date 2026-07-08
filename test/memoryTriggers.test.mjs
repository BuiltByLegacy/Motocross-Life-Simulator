import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryTriggerRegistry, defaultTriggers } from '../src/systems/memoryTriggers.js';

function registry() {
  const r = new MemoryTriggerRegistry();
  for (const t of defaultTriggers()) r.register(t);
  return r;
}

test('#70 first win trigger fires once and carries source + participants', () => {
  const r = registry();
  const out = r.handle('race:finished', { eventId: 'r1', eventName: 'Rocky Ridge', overall: 1, family: ['dad', 'mom'] });
  assert.equal(out.length, 1);
  assert.equal(out[0]._trigger, 'first_win');
  assert.equal(out[0].source.system, 'race:finished');
  assert.equal(out[0].source.eventId, 'r1');
  assert.ok(out[0].participants.some((p) => p.id === 'dad' && p.support === 'celebrated'));
  assert.ok(out[0].entities.some((e) => e.kind === 'event'));
});

test('#70 duplicate prevention: a second win does not re-fire first_win', () => {
  const r = registry();
  r.handle('race:finished', { eventId: 'r1', overall: 1 });
  const second = r.handle('race:finished', { eventId: 'r2', overall: 1 });
  assert.equal(second.length, 0);
});

test('#70 bike purchase trigger keyed per asset', () => {
  const r = registry();
  const a = r.handle('asset:acquired', { kind: 'bike', assetId: 'b1', name: 'KX65', via: 'used marketplace' });
  assert.equal(a.length, 1);
  assert.equal(a[0]._trigger, 'bike_purchase');
  assert.ok(a[0].entities.some((e) => e.id === 'b1'));
  // Same asset again -> deduped; a different asset -> new memory
  assert.equal(r.handle('asset:acquired', { kind: 'bike', assetId: 'b1' }).length, 0);
  assert.equal(r.handle('asset:acquired', { kind: 'bike', assetId: 'b2', name: 'KX85' }).length, 1);
});

test('#70 gift bikes read as a bigger moment than a plain purchase', () => {
  const r = registry();
  const gift = r.handle('asset:acquired', { kind: 'bike', assetId: 'g1', name: 'PW50', gift: true })[0];
  assert.ok(gift.importance > 60);
  assert.ok(gift.tone.includes('love'));
});

test('#70 missed-qualifier trigger fires on elimination', () => {
  const r = registry();
  const out = r.handle('lorettas:result', { eliminated: true, eventId: 'aq1', eventName: 'Area Qualifier', week: 11 });
  assert.equal(out.length, 1);
  assert.equal(out[0]._trigger, 'missed_qualifier');
  assert.ok(out[0].tags.includes('heartbreak'));
  // A successful qualifier result does not fire it
  assert.equal(r.handle('lorettas:result', { eliminated: false, eventId: 'aq2' }).length, 0);
});

test('#70 non-memorable events produce nothing', () => {
  const r = registry();
  assert.equal(r.handle('race:finished', { overall: 14 }).length, 0); // not first race, not a win
  assert.equal(r.handle('rider:injured', { severity: 'minor' }).length, 0);
});

test('#70 registry dedupe state serializes', () => {
  const r = registry();
  r.handle('race:finished', { overall: 1, eventId: 'r1' });
  const restored = MemoryTriggerRegistry.fromJSON(JSON.parse(JSON.stringify(r.toJSON())), defaultTriggers());
  assert.equal(restored.handle('race:finished', { overall: 1, eventId: 'r2' }).length, 0); // still deduped
});
