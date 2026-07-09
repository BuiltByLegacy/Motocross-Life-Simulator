import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  seasonFlowState, guardEdit, recomputeAfterEdit, pruneExpiredEvents, recoveryActions,
} from '../src/systems/seasonFlow.js';
import { LorettasPath } from '../src/systems/lorettasPath.js';

const ev = (week, name, extra = {}) => ({ week, name, id: `e${week}`, ...extra });

// ---- #226 create → lock → race first event ----
test('#226 setup offers program build; active with an event offers Go Racing', () => {
  const setup = seasonFlowState({ week: 1, programSet: false, events: [] });
  assert.equal(setup.state, 'setup');
  assert.ok(setup.actions.some((a) => a.id === 'build_program'));

  const ready = seasonFlowState({ week: 3, programSet: true, events: [ev(3, 'Rocky Ridge')], raceReady: true });
  assert.equal(ready.state, 'event_ready');
  assert.equal(ready.canRace, true);
  assert.ok(ready.actions.some((a) => a.id === 'go_racing'));
});

// ---- #226 edit future schedule → re-lock → race next ----
test('#226 recompute after a valid future edit keeps Go-to-next present', () => {
  const flow = recomputeAfterEdit({ week: 4, programSet: true, events: [ev(7, 'Southwick')] });
  assert.equal(flow.recomputed, true);
  assert.equal(flow.state, 'between_events');
  assert.ok(flow.actions.some((a) => a.id === 'advance_to_next'));
});

// ---- #226 remove all future events → recovery options ----
test('#226 empty schedule never leaves the player stuck', () => {
  const flow = seasonFlowState({ week: 6, programSet: true, events: [] });
  assert.equal(flow.state, 'empty_schedule');
  assert.ok(flow.actions.length >= 3);
  for (const id of ['add_event', 'practice', 'rest']) assert.ok(flow.actions.some((a) => a.id === id));
  // Backstop: recoveryActions is always non-empty
  assert.ok(recoveryActions().length > 0);
});

// ---- #226 miss registration deadline → event becomes unavailable ----
test('#226 expired-deadline events are pruned to unavailable', () => {
  const { kept, expired } = pruneExpiredEvents([ev(9, 'Late Regional', { deadlineWeek: 7 })], 8);
  assert.equal(kept.length, 0);
  assert.equal(expired.length, 1);
  assert.equal(expired[0].unavailable, true);
  // guardEdit refuses to add past a closed deadline
  assert.equal(guardEdit({ type: 'add', event: ev(9, 'Late', { deadlineWeek: 7 }) }, { week: 8 }).result, 'blocked_deadline');
});

// ---- #226 bike not ready → repair or skip options ----
test('#226 un-ready bike blocks racing but offers repair/skip/practice', () => {
  const flow = seasonFlowState({ week: 5, programSet: true, events: [ev(5, 'Pine Hollow')], raceReady: false });
  assert.equal(flow.state, 'event_blocked');
  assert.equal(flow.canRace, false);
  for (const id of ['repair_bike', 'skip_event', 'practice']) assert.ok(flow.actions.some((a) => a.id === id));
});

// ---- #226 young rider → parent approval required ----
test('#226 youth rider needs approval before racing; edits need approval', () => {
  const flow = seasonFlowState({ week: 5, programSet: true, events: [ev(5, 'Local')], raceReady: true, needsApproval: true });
  assert.equal(flow.state, 'event_blocked');
  assert.ok(flow.actions.some((a) => a.id === 'request_approval'));
  assert.equal(guardEdit({ type: 'add', event: ev(7, 'Later') }, { week: 5, needsApproval: true }).result, 'needs_approval');
});

// ---- #226 edit guard: past/current locked ----
test('#226 edit guard locks past and in-progress current events', () => {
  assert.equal(guardEdit({ type: 'remove', event: ev(2, 'Done') }, { week: 5 }).result, 'blocked_past');
  assert.equal(guardEdit({ type: 'change', event: ev(5, 'Now') }, { week: 5, currentInProgress: true }).result, 'blocked_current');
  assert.equal(guardEdit({ type: 'add', event: ev(8, 'Future') }, { week: 5 }).result, 'applied');
});

// ---- #226 in-progress event always continues (never lost) ----
test('#226 an in-progress event keeps a continue action', () => {
  const flow = seasonFlowState({ week: 7, programSet: true, events: [ev(7, 'Big One')], currentEventInProgress: true });
  assert.ok(flow.actions.some((a) => a.id === 'continue_event'));
  assert.equal(flow.canRace, true);
});

// ---- #226 season over → recap ----
test('#226 past the final week the flow points at the recap', () => {
  const flow = seasonFlowState({ week: 13, totalWeeks: 12, programSet: true, events: [] });
  assert.equal(flow.state, 'season_over');
  assert.ok(flow.actions.some((a) => a.id === 'recap'));
});

// ---- #226 Loretta path: National locked unless qualified; Area→Regional→National ----
test('#226 Loretta National cannot be entered without qualifying through a Regional', () => {
  const p = new LorettasPath();
  const national = { id: 'nat', name: "Loretta's", lorettaStage: 'national', region: 'Northeast' };
  // Not eligible before clearing Area + Regional
  assert.equal(p.eligibleToEnter(national, { klass: '85cc' }).ok, false);
  p.recordAttempt({ id: 'aq', category: 'qualifier', region: 'Northeast' }, { klass: '85cc', finish: 1 });
  assert.equal(p.eligibleToEnter(national, { klass: '85cc' }).ok, false); // regional still needed
  p.recordAttempt({ id: 'rc', lorettaStage: 'regional', region: 'Northeast' }, { klass: '85cc', finish: 1 });
  assert.equal(p.eligibleToEnter(national, { klass: '85cc' }).ok, true); // now qualified
});
