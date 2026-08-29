import test from 'node:test';
import assert from 'node:assert/strict';
import { UI2_PRIMARY_NAV, UI2_MORE_NAV } from '../src/ui2/primitives.js';

test('UI 2.0 primary navigation exposes five focused concepts with unique legacy destinations', () => {
  assert.deepEqual(UI2_PRIMARY_NAV.map((item) => item.label), ['Home', 'Calendar', 'Career', 'World']);
  assert.deepEqual(UI2_PRIMARY_NAV.map((item) => item.legacyTab), ['garage', 'week', 'stats', 'phone']);
  assert.equal(new Set(UI2_PRIMARY_NAV.map((item) => item.legacyTab)).size, UI2_PRIMARY_NAV.length);
});

test('UI 2.0 More preserves access to lower-frequency legacy destinations', () => {
  assert.deepEqual(UI2_MORE_NAV.map((item) => item.legacyTab), ['sponsors', 'people', 'journal']);
  const everyLegacyDestination = [...UI2_PRIMARY_NAV, ...UI2_MORE_NAV].map((item) => item.legacyTab);
  assert.deepEqual(new Set(everyLegacyDestination), new Set(['garage', 'week', 'stats', 'phone', 'sponsors', 'people', 'journal']));
});
