import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRaceWeekend, readinessChecklist, registerWeekend, advanceWeekend } from '../src/systems/raceWeekend.js';

const event = { id: 'race1', name: 'County Line MX', entryMult: 1 };
const rider = { fatigue: 20, injury: null };
const bike = { klass: '85cc', condition: 72, parts: { tires: 90 } };
const family = { money: 500, stress: 25 };

test('#161 go-racing readiness blocks invalid race launches', () => {
  const r = readinessChecklist({ event, rider, bike: { ...bike, condition: 18 }, family, classes: ['85cc'] });
  assert.equal(r.ok, false);
  assert.ok(r.blockers.some((b) => b.code === 'bike_broken'));
});

test('#162/#163 race weekend registers then advances through explicit states', () => {
  const w = createRaceWeekend(event, { classes: ['85cc'] });
  const ready = readinessChecklist({ event, rider, bike, family, classes: ['85cc'] });
  const reg = registerWeekend(w, ready);
  assert.equal(reg.state, 'registered');
  assert.equal(reg.registered, true);
  const travel = advanceWeekend(reg);
  assert.equal(travel.state, 'travel_planned');
  const racing = advanceWeekend(advanceWeekend(advanceWeekend(travel)));
  assert.equal(racing.state, 'practice');
});

test('#164 warnings are non-blocking but visible before launch', () => {
  const r = readinessChecklist({ event, rider: { fatigue: 80 }, bike: { ...bike, condition: 45, parts: { tires: 30 } }, family: { money: 500, stress: 80 }, classes: ['85cc'] });
  assert.equal(r.ok, true);
  assert.ok(r.warnings.length >= 3);
});
