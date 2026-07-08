import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  makeProvenance, recordTransfer, linkMemory, currentOwner, ownerHistory,
  isOwnedByMe, provenanceSummary, AssetRegistry, newAssetId,
} from '../src/systems/assetProvenance.js';

test('#69 provenance records stable id, serial, and acquisition link', () => {
  const p = makeProvenance({ assetId: 'a1', kind: 'bike', name: 'KX65', serial: 'JKA...123', acquiredVia: 'purchase', year: 2026, price: 1200 });
  assert.equal(p.assetId, 'a1');
  assert.equal(p.serial, 'JKA...123');
  assert.equal(p.ownership.length, 1);
  assert.equal(p.ownership[0].type, 'purchase');
  assert.equal(currentOwner(p), 'me');
  assert.equal(isOwnedByMe(p), true);
});

test('#69 ownership transfers: purchase, gift, sale, inheritance', () => {
  const p = makeProvenance({ assetId: 'a2', kind: 'bike', name: 'CR85', acquiredVia: 'inheritance', from: 'uncle', year: 2020 });
  assert.equal(p.ownership[0].type, 'inheritance');
  recordTransfer(p, { type: 'sale', from: 'me', to: 'buyer_kid', year: 2027, price: 900 });
  assert.equal(currentOwner(p), 'buyer_kid');
  assert.equal(isOwnedByMe(p), false);
  assert.deepEqual(ownerHistory(p), ['uncle', 'me', 'buyer_kid']);
});

test('#69 invalid transfer type falls back to purchase', () => {
  const p = makeProvenance({ assetId: 'a3' });
  const e = recordTransfer(p, { type: 'bogus', to: 'x' });
  assert.equal(e.type, 'purchase');
});

test('#69 memory links attach and de-duplicate', () => {
  const p = makeProvenance({ assetId: 'a4' });
  linkMemory(p, 'mem1'); linkMemory(p, 'mem1'); linkMemory(p, 'mem2');
  assert.deepEqual(p.memories, ['mem1', 'mem2']);
});

test('#69 provenance summary reads like a story', () => {
  const bought = makeProvenance({ assetId: 'a5', acquiredVia: 'purchase', year: 2026 });
  assert.match(provenanceSummary(bought), /first owner/);
  const used = makeProvenance({ assetId: 'a6', acquiredVia: 'purchase', from: 'seller', year: 2026 });
  recordTransfer(used, { type: 'sale', from: 'me', to: 'next' });
  // still first-owner-from-my-view unless prior owners exist in chain
  assert.equal(typeof provenanceSummary(used), 'string');
});

test('#69 registry ensures provenance for asset-bearing objects and serializes', () => {
  const reg = new AssetRegistry();
  const bike = { assetId: 'bk1', klass: '65cc', year: 2025 };
  const prov = reg.ensure(bike, { kind: 'bike' });
  assert.equal(prov.assetId, 'bk1');
  assert.equal(reg.get('bk1').kind, 'bike');
  // an object without an id gets one assigned
  const helmet = { name: 'Lucky Helmet' };
  reg.ensure(helmet, { kind: 'gear' });
  assert.ok(helmet.assetId);
  const restored = AssetRegistry.fromJSON(JSON.parse(JSON.stringify(reg.toJSON())));
  assert.equal(restored.all().length, 2);
  assert.equal(restored.get('bk1').name, '65cc');
});

test('newAssetId is unique', () => {
  const a = newAssetId(), b = newAssetId();
  assert.notEqual(a, b);
});
