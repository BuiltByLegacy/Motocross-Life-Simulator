import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHomeGeography } from '../src/systems/geography.js';
import {
  applyOffWeekendOpportunity,
  eventEconomyProfile,
  generateOffWeekendOpportunities,
  northeastWeatherState,
  previewNortheastEventCommit,
  resolveEventDisruption,
  restoreNortheastWeekendLife,
  serializeNortheastWeekendLife,
} from '../src/systems/northeastWeekendLife.js';

const home = createHomeGeography({ state: 'CT', lat: 41.86, lon: -72.45 });

test('#301 seasonal weather is deterministic and reflects Northeast seasonality', () => {
  const a = northeastWeatherState({ venueId: 'ne-ct-riverbend', date: '2028-04-15', careerSeed: 'alpha' });
  const b = northeastWeatherState({ venueId: 'ne-ct-riverbend', date: '2028-04-15', careerSeed: 'alpha' });
  assert.deepEqual(a, b);
  assert.equal(a.month, 4);
  assert.equal(a.condition, 'spring-mud');
  const winter = northeastWeatherState({ venueId: 'ne-ct-riverbend', date: '2028-01-15', careerSeed: 'alpha' });
  assert.equal(winter.condition, 'winter-closed');
  assert.ok(winter.openProbability < a.openProbability);
});

test('#300 promoter and venue economics create different weekend profiles', () => {
  const local = eventEconomyProfile({ event: { id: 'a', venueId: 'ne-ct-riverbend', date: '2028-06-12' }, home, careerSeed: 'econ' });
  const regional = eventEconomyProfile({ event: { id: 'b', venueId: 'ne-ma-sandpit', date: '2028-06-12' }, home, careerSeed: 'econ' });
  assert.equal(local.valid, true);
  assert.equal(regional.valid, true);
  assert.notEqual(local.raceFees, regional.raceFees);
  assert.notEqual(local.expectedQuality, regional.expectedQuality);
  assert.ok(local.weekendCost > 0);
  assert.ok(regional.weekendCost > 0);
});

test('#300 pre-commit preview respects family budget and youth approval', () => {
  const event = { id: 'expensive-weekend', venueId: 'ne-pa-ridge', date: '2028-06-17' };
  const noMoney = previewNortheastEventCommit({ event, home, budget: 10, age: 12, parentApproved: true, careerSeed: 'budget' });
  assert.equal(noMoney.canCommit, false);
  assert.ok(noMoney.warnings.some((w) => w.code === 'over-budget'));
  const noParent = previewNortheastEventCommit({ event, home, budget: 1000, age: 12, parentApproved: false, careerSeed: 'budget' });
  assert.equal(noParent.canCommit, false);
  assert.ok(noParent.warnings.some((w) => w.code === 'parent-approval-required'));
});

test('#299 off weekends offer practice plus non-racing choices', () => {
  const opportunities = generateOffWeekendOpportunities({
    home,
    date: '2028-06-10',
    age: 12,
    parentApproved: true,
    budget: 500,
    careerSeed: 'off-weekend',
  });
  assert.ok(opportunities.some((o) => ['open-practice', 'club-practice'].includes(o.type)));
  assert.ok(opportunities.some((o) => o.type === 'maintenance'));
  assert.ok(opportunities.some((o) => o.type === 'family'));
  assert.ok(opportunities.some((o) => o.type === 'rest'));
});

test('#299 youth, school, and work constraints block training without trapping the calendar', () => {
  const opportunities = generateOffWeekendOpportunities({
    home,
    date: '2028-09-09',
    age: 12,
    parentApproved: false,
    schoolConflict: true,
    budget: 500,
    careerSeed: 'school',
  });
  const training = opportunities.find((o) => o.type === 'training');
  assert.equal(training.available, false);
  assert.ok(training.blockers.includes('parent-approval'));
  assert.ok(training.blockers.includes('school'));
  assert.ok(opportunities.find((o) => o.type === 'rest').available);
});

test('#299 practice trades money and bike wear for skill and familiarity', () => {
  const opportunities = generateOffWeekendOpportunities({ home, date: '2028-06-10', age: 16, budget: 500, careerSeed: 'tradeoff' });
  const practice = opportunities.find((o) => o.available && ['open-practice', 'club-practice'].includes(o.type));
  assert.ok(practice);
  const before = { budget: 500, bikeHours: 10, riderSkill: 40, fatigue: 20, familiarity: {}, calendarLog: [] };
  const applied = applyOffWeekendOpportunity(before, practice);
  assert.equal(applied.ok, true);
  assert.ok(applied.state.budget < before.budget);
  assert.ok(applied.state.bikeHours > before.bikeHours);
  assert.ok(applied.state.riderSkill > before.riderSkill);
  assert.ok(applied.state.familiarity[practice.venueId] > 0);
  assert.equal(applied.state.calendarLog.length, 1);
});

test('#300/#301 disruption always provides safe recovery choices', () => {
  const event = { id: 'winter-event', venueId: 'ne-ct-riverbend', date: '2028-01-13' };
  const disruption = resolveEventDisruption({ event, home, careerSeed: 'winter' });
  assert.equal(disruption.status, 'cancelled');
  assert.ok(disruption.recovery.some((r) => r.type === 'rest'));
  assert.ok(disruption.recovery.some((r) => r.type === 'maintenance'));
});

test('#299-#301 weekend-life state survives save/load', () => {
  const state = { budget: 420, bikeHours: 14.2, riderSkill: 47, fatigue: 18, familiarity: { 'ne-ct-riverbend': 12 }, calendarLog: [{ date: '2028-06-10', type: 'practice' }] };
  const restored = restoreNortheastWeekendLife(serializeNortheastWeekendLife(state));
  assert.equal(restored.version, 1);
  assert.equal(restored.budget, 420);
  assert.equal(restored.familiarity['ne-ct-riverbend'], 12);
  assert.equal(restored.calendarLog.length, 1);
});
