import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createLifeBetweenRacesState,
  openBetweenRacesPeriod,
  buildOffWeekDecisionSet,
  diminishingReturnFactor,
  evaluateTrainingOption,
  resolveTrainingDecision,
  resolveRecoveryDecision,
  trainingRisk,
} from '../src/systems/lifeBetweenRaces.js';

const ctx = (patch = {}) => ({
  week: 2,
  seasonNumber: 1,
  isRaceWeek: false,
  nextRaceWeek: 3,
  availableSlots: 4,
  rider: { age: 12, fatigue: 20, injury: null },
  family: { money: 500, stress: 25 },
  bike: { condition: 70 },
  schoolMode: 'school',
  ...patch,
});

test('opens one canonical period per off-week and reuses it', () => {
  const first = openBetweenRacesPeriod(createLifeBetweenRacesState(), ctx());
  assert.equal(first.period.key, 's1:w2');
  assert.equal(first.period.timeBudget, 4);
  const second = openBetweenRacesPeriod(first.state, ctx());
  assert.equal(second.state.periods.length, 1);
  assert.equal(second.period.key, first.period.key);
});

test('race weeks do not create between-races periods', () => {
  const opened = openBetweenRacesPeriod(createLifeBetweenRacesState(), ctx({ isRaceWeek: true }));
  assert.equal(opened.period, null);
  assert.equal(opened.state.periods.length, 0);
});

test('healthy off-week favors training while high fatigue favors recovery', () => {
  const healthy = openBetweenRacesPeriod(createLifeBetweenRacesState(), ctx());
  const healthyChoices = buildOffWeekDecisionSet(healthy.state, ctx());
  assert.equal(healthyChoices.find((c) => c.recommended)?.family, 'training');

  const tiredCtx = ctx({ rider: { age: 12, fatigue: 72, injury: null } });
  const tired = openBetweenRacesPeriod(createLifeBetweenRacesState(), tiredCtx);
  const tiredChoices = buildOffWeekDecisionSet(tired.state, tiredCtx);
  assert.equal(tiredChoices.find((c) => c.recommended)?.family, 'recovery');
});

test('repeat training has diminishing returns', () => {
  let opened = openBetweenRacesPeriod(createLifeBetweenRacesState(), ctx({ availableSlots: 8 }));
  let state = opened.state;
  for (let i = 0; i < 3; i += 1) {
    const resolved = resolveTrainingDecision(state, 'starts', ctx({ availableSlots: 8 }), { seed: 42 });
    assert.equal(resolved.error, null);
    state = resolved.state;
  }
  assert.ok(diminishingReturnFactor(state, 'starts') < 0.7);
});

test('training load raises risk and injury restricts hard riding', () => {
  const low = trainingRisk({ fatigue: 10, weeklyLoad: 0, addedLoad: 8, bodyReadiness: 90 });
  const high = trainingRisk({ fatigue: 70, weeklyLoad: 20, addedLoad: 18, bodyReadiness: 30 });
  assert.ok(high.score > low.score);
  assert.ok(['elevated', 'high'].includes(high.band));
  assert.notEqual(high.band, low.band);

  const injuredCtx = ctx({ rider: { age: 12, fatigue: 25, injury: { name: 'Shoulder', weeksOut: 2, severity: 2 } } });
  const opened = openBetweenRacesPeriod(createLifeBetweenRacesState(), injuredCtx);
  assert.equal(evaluateTrainingOption(opened.state, 'motos', injuredCtx).reason, 'injury-restriction');
  assert.equal(evaluateTrainingOption(opened.state, 'light_ride', injuredCtx).allowed, true);
});

test('training resolution is deterministic and writes load/history', () => {
  const openedA = openBetweenRacesPeriod(createLifeBetweenRacesState(), ctx());
  const openedB = openBetweenRacesPeriod(createLifeBetweenRacesState(), ctx());
  const a = resolveTrainingDecision(openedA.state, 'starts', ctx(), { seed: 12345 });
  const b = resolveTrainingDecision(openedB.state, 'starts', ctx(), { seed: 12345 });
  assert.deepEqual(a.decision.gains, b.decision.gains);
  assert.equal(a.state.trainingHistory.length, 1);
  assert.equal(a.state.periods[0].trainingLoad, 8);
  assert.equal(a.state.periods[0].timeUsed, 1);
});

test('recovery value scales with fatigue and therapy can advance injury recovery', () => {
  const injuredCtx = ctx({ rider: { age: 12, fatigue: 70, injury: { name: 'Ankle', weeksOut: 3, severity: 2 } } });
  const opened = openBetweenRacesPeriod(createLifeBetweenRacesState(), injuredCtx);
  const rest = resolveRecoveryDecision(opened.state, 'full_rest', injuredCtx);
  assert.ok(rest.decision.fatigueDelta <= -15);

  const therapy = resolveRecoveryDecision(rest.state, 'therapy', injuredCtx);
  assert.equal(therapy.decision.injuryRecovery, 1);
  assert.equal(therapy.state.recoveryHistory.length, 2);
});
