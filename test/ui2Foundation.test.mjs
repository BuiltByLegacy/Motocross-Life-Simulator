import test from 'node:test';
import assert from 'node:assert/strict';
import { UI2_PRIMARY_NAV, UI2_MORE_NAV } from '../src/ui2/primitives.js';

test('UI 2.0 primary navigation exposes five focused concepts with unique legacy destinations', () => {
  assert.deepEqual(UI2_PRIMARY_NAV.map((item) => item.label), ['Home', 'Calendar', 'Career', 'World']);
  assert.deepEqual(UI2_PRIMARY_NAV.map((item) => item.legacyTab), ['garage', 'week', 'stats', 'phone']);
  assert.equal(new Set(UI2_PRIMARY_NAV.map((item) => item.legacyTab)).size, UI2_PRIMARY_NAV.length);
});

test('UI 2.0 More is reserved for lower-frequency utilities after Career/World absorb context', () => {
  assert.deepEqual(UI2_MORE_NAV.map((item) => item.legacyTab), ['journal']);
  assert.equal(UI2_MORE_NAV.some((item) => item.legacyTab === 'sponsors'), false);
  assert.equal(UI2_MORE_NAV.some((item) => item.legacyTab === 'people'), false);
  assert.equal(UI2_MORE_NAV.some((item) => item.legacyTab === 'journal'), true);
});
