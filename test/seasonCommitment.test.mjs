import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  makeSeasonCommitment, advanceCommitment, lockPreconditions, isLocked, isActive,
  goRacingChecklist, SEASON_COMMIT_STATES,
} from '../src/systems/seasonCommitment.js';

test('#229 the season lifecycle runs draft → review → locked → active → complete', () => {
  let c = makeSeasonCommitment();
  assert.equal(c.state, 'draft');
  c = advanceCommitment(c, 'review');
  assert.equal(c.state, 'review');
  c = advanceCommitment(c, 'lock', { eventCount: 3, hardConflicts: 0 });
  assert.equal(c.state, 'locked');
  assert.equal(isLocked(c), true);
  c = advanceCommitment(c, 'start');
  assert.equal(c.state, 'active');
  assert.equal(isActive(c), true);
  c = advanceCommitment(c, 'complete');
  assert.equal(c.state, 'complete');
});

test('#229 dependent riders route through family approval before locking', () => {
  let c = advanceCommitment(makeSeasonCommitment(), 'review');
  c = advanceCommitment(c, 'request_approval');
  assert.equal(c.state, 'approval');
  // Cannot lock without approval granted
  const blocked = advanceCommitment(c, 'lock', { eventCount: 2, needsApproval: true, approvalGranted: false });
  assert.ok(blocked.error);
  assert.equal(blocked.state, 'approval');
  c = advanceCommitment(c, 'grant_approval');
  assert.equal(c.approvalGranted, true);
  c = advanceCommitment(c, 'lock', { eventCount: 2, needsApproval: true, approvalGranted: true, day: 14 });
  assert.equal(c.state, 'locked');
  assert.equal(c.lockedDay, 14);
});

test('#229 lock preconditions: needs events and no hard conflicts', () => {
  assert.equal(lockPreconditions({ eventCount: 0 }).canLock, false);
  assert.equal(lockPreconditions({ eventCount: 2, hardConflicts: 1 }).canLock, false);
  const ok = lockPreconditions({ eventCount: 2, hardConflicts: 0 });
  assert.equal(ok.canLock, true);
  // Over-budget is a warning, not a blocker
  const over = lockPreconditions({ eventCount: 2, overBudget: true });
  assert.equal(over.canLock, true);
  assert.equal(over.warnings.length, 1);
});

test('#229 draft edits stay safe: back_to_draft clears approval', () => {
  let c = advanceCommitment(makeSeasonCommitment(), 'review');
  c = advanceCommitment(c, 'request_approval');
  c = advanceCommitment(c, 'grant_approval');
  c = advanceCommitment(c, 'back_to_draft');
  assert.equal(c.state, 'draft');
  assert.equal(c.approvalGranted, false);
});

test('#229 active seasons can be edited, re-locked, and resumed without dead-ending', () => {
  let c = makeSeasonCommitment('active');
  c.approvalGranted = true;
  const firstRevision = c.revision;
  c = advanceCommitment(c, 'review');
  assert.equal(c.state, 'review');
  assert.equal(c.editingActiveSeason, true);
  assert.equal(c.revision, firstRevision + 1);
  c = advanceCommitment(c, 'lock', { eventCount: 3, hardConflicts: 0, needsApproval: true, approvalGranted: true, day: 35 });
  assert.equal(c.state, 'locked');
  c = advanceCommitment(c, 'start');
  assert.equal(c.state, 'active');
  assert.equal(c.editingActiveSeason, false);
  assert.equal(c.approvalGranted, true);
});

test('#229 invalid transitions are rejected without changing state', () => {
  const c = makeSeasonCommitment();
  const bad = advanceCommitment(c, 'start'); // can't start from draft
  assert.ok(bad.error);
  assert.equal(bad.state, 'draft');
  assert.ok(SEASON_COMMIT_STATES.includes(c.state));
});

test('#230 Go Racing checklist passes only when every requirement is met', () => {
  const event = { name: 'Rocky Ridge', klass: '85cc', week: 3 };
  const ready = goRacingChecklist({ event, seasonActive: true, bikeReady: true, feesAffordable: true, klassEligible: true, approvalOk: true, notInjured: true });
  assert.equal(ready.canRace, true);
  assert.equal(ready.items.length, 6);
  assert.equal(ready.blockers.length, 0);
});

test('#230 Go Racing is blocked with actionable reasons', () => {
  const event = { name: 'High Point', klass: '85cc', week: 9 };
  const blocked = goRacingChecklist({ event, bikeReady: false, feesAffordable: false, notInjured: false });
  assert.equal(blocked.canRace, false);
  const codes = blocked.blockers.map((b) => b.code);
  assert.ok(codes.includes('bike'));
  assert.ok(codes.includes('fees'));
  assert.ok(codes.includes('health'));
  // No event → clear message
  assert.equal(goRacingChecklist({ event: null }).canRace, false);
});

test('#230 an un-locked season blocks racing', () => {
  const r = goRacingChecklist({ event: { name: 'X', klass: '65cc', week: 5 }, seasonActive: false });
  assert.equal(r.canRace, false);
  assert.ok(r.blockers.some((b) => b.code === 'season_active'));
});
