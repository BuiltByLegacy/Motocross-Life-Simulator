import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DiagnosticsLog, DIAG_CAP, DIAG_TYPES } from '../src/systems/diagnostics.js';

test('#246 records typed events with a coarse context', () => {
  const d = new DiagnosticsLog();
  const e = d.record({ type: 'load_failure', message: 'Save file is missing or corrupt.', context: { seed: 7, week: 3, screen: 'title' } });
  assert.equal(e.type, 'load_failure');
  assert.equal(d.entries.length, 1);
  assert.deepEqual(e.context, { seed: 7, week: 3, screen: 'title' });
});

test('#246 an unknown type falls back to ui_error and messages are truncated', () => {
  const d = new DiagnosticsLog();
  const e = d.record({ type: 'not_a_type', message: 'x'.repeat(500) });
  assert.equal(e.type, 'ui_error');
  assert.equal(e.message.length, 300);
});

test('#246 context is privacy-filtered — no personal or free-text fields survive', () => {
  const d = new DiagnosticsLog();
  const e = d.record({ type: 'race_sim', context: { seed: 1, riderName: 'Alex', note: 'anything', email: 'a@b.c', week: 5 } });
  assert.deepEqual(e.context, { seed: 1, week: 5 });
  assert.equal('riderName' in e.context, false);
  assert.equal('email' in e.context, false);
});

test('#246 the ring buffer is capped', () => {
  const d = new DiagnosticsLog();
  for (let i = 0; i < DIAG_CAP + 25; i++) d.record({ type: 'uncaught', message: `e${i}` });
  assert.equal(d.entries.length, DIAG_CAP);
  // Oldest dropped, newest kept.
  assert.equal(d.entries[d.entries.length - 1].message, `e${DIAG_CAP + 24}`);
});

test('#246 countByType and clear', () => {
  const d = new DiagnosticsLog();
  d.record({ type: 'save_failure' });
  d.record({ type: 'save_failure' });
  d.record({ type: 'stuck_state' });
  assert.deepEqual(d.countByType(), { save_failure: 2, stuck_state: 1 });
  assert.equal(d.hasErrors(), true);
  d.clear();
  assert.equal(d.hasErrors(), false);
});

test('#246 round-trips through JSON', () => {
  const d = new DiagnosticsLog();
  d.record({ type: 'go_racing', message: 'blocked', context: { code: 'fees' } });
  const back = DiagnosticsLog.fromJSON(JSON.parse(JSON.stringify(d.toJSON())));
  assert.equal(back.entries.length, 1);
  assert.equal(back.entries[0].context.code, 'fees');
});

test('#246 install wires global handlers and a persistence sink', () => {
  const handlers = {};
  const fakeWin = { addEventListener: (name, fn) => { handlers[name] = fn; } };
  let persisted = null;
  const d = new DiagnosticsLog().install(fakeWin, { persist: (entries) => { persisted = entries; } });
  assert.equal(typeof handlers.error, 'function');
  assert.equal(typeof handlers.unhandledrejection, 'function');
  handlers.error({ message: 'boom', lineno: 42, colno: 9 });
  assert.equal(d.entries[0].type, 'uncaught');
  assert.deepEqual(d.entries[0].context, { line: 42, col: 9 });
  handlers.unhandledrejection({ reason: new Error('nope') });
  assert.equal(d.entries[1].type, 'promise');
  assert.equal(d.entries[1].message, 'nope');
  // The sink saw the latest entries (persistence).
  assert.equal(persisted.length, 2);
});

test('#246 all declared types are accepted', () => {
  const d = new DiagnosticsLog();
  for (const t of DIAG_TYPES) assert.equal(d.record({ type: t }).type, t);
});
