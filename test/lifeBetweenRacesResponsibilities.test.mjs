import test from 'node:test';
import assert from 'node:assert/strict';
import {
  maintenanceNeed, evaluateMaintenanceAction, resolveMaintenanceAction,
  responsibilityPressure, evaluateResponsibilityAction, resolveResponsibilityAction,
  estimateUpcomingRaceCost, travelPrepStatus, resolvePrepAction, missedPrepConsequences,
} from '../src/systems/lifeBetweenRacesResponsibilities.js';

test('maintenance need reacts to condition, race proximity, travel and weather', () => {
  const calm = maintenanceNeed({ bike: { condition: 90, wear: 10 }, weeksToRace: 4 });
  const urgent = maintenanceNeed({ bike: { condition: 45, wear: 65 }, weeksToRace: 1, travel: true, weather: 'mud', raceImportance: 90 });
  assert.ok(urgent.score > calm.score);
  assert.ok(['due', 'critical'].includes(urgent.band));
});

test('maintenance actions respect time/money and deferral creates risk instead of instant failure', () => {
  assert.equal(evaluateMaintenanceAction('repair', { bike: { condition: 50 }, money: 50, timeLeft: 3 }).reason, 'not-enough-money');
  const deferred = resolveMaintenanceAction('defer', { bike: { condition: 45, reliability: 55 }, money: 0, timeLeft: 0, weeksToRace: 1 });
  assert.equal(deferred.error, null);
  assert.ok(deferred.decision.reliabilityAfter > 0);
  assert.ok(deferred.decision.deferredRisk > 0);
  const serviced = resolveMaintenanceAction('service', { bike: { condition: 60, reliability: 60 }, money: 100, timeLeft: 2 });
  assert.ok(serviced.decision.conditionAfter > 60);
});

test('youth school pressure and adult work pressure are distinct', () => {
  const youth = responsibilityPressure({ age: 13, schoolMode: 'school', schoolStanding: 45, familyTrust: 55 });
  const flexibleYouth = responsibilityPressure({ age: 13, schoolMode: 'homeschool', schoolStanding: 45, familyTrust: 55 });
  const adult = responsibilityPressure({ age: 25, schoolMode: 'none', workHours: 50, familyTrust: 55 });
  assert.ok(youth.score > flexibleYouth.score);
  assert.ok(adult.score > 0);
  assert.equal(youth.youth, true);
  assert.equal(adult.youth, false);
});

test('responsibility choices change trust/stress and avoid youth work nonsense', () => {
  assert.equal(evaluateResponsibilityAction('work_shift', { age: 12, timeLeft: 3 }).reason, 'age-restriction');
  const family = resolveResponsibilityAction('family_time', { age: 14, timeLeft: 2, familyTrust: 55, familyStress: 50 });
  assert.ok(family.decision.trustDelta > 0);
  assert.ok(family.decision.stressDelta < 0);
  const skip = resolveResponsibilityAction('skip_obligations', { age: 14, timeLeft: 0, familyTrust: 55, familyStress: 50 });
  assert.ok(skip.decision.opportunityApprovalDelta < 0);
});

test('race cost exposes gross, support and family out-of-pocket before commitment', () => {
  const unsupported = estimateUpcomingRaceCost({ distanceMiles: 600, nights: 3, entryFee: 80 });
  const supported = estimateUpcomingRaceCost({ distanceMiles: 600, nights: 3, entryFee: 80, travelSupport: 150, lodgingSupport: 200 });
  assert.equal(unsupported.gross, supported.gross);
  assert.ok(supported.outOfPocket < unsupported.outOfPocket);
});

test('travel preparation and sponsor duty create readiness tradeoffs', () => {
  assert.equal(travelPrepStatus({ booked: false, packed: false, bikeReady: false }).band, 'unprepared');
  assert.equal(travelPrepStatus({ booked: true, packed: true, bikeReady: true }).band, 'ready');
  const sponsor = resolvePrepAction('sponsor_duty', { money: 100, timeLeft: 2, booked: true, packed: false, bikeReady: true, sponsorDutiesDue: 1 });
  assert.ok(sponsor.decision.sponsorSatisfactionDelta > 0);
  const rushed = resolvePrepAction('rush_later', { money: 0, timeLeft: 0 });
  assert.ok(rushed.decision.rushCostRisk > 0);
});

test('missed prep produces plausible cost stress and readiness consequences', () => {
  const ready = missedPrepConsequences({ readiness: 90, estimatedCost: 1000 });
  const late = missedPrepConsequences({ readiness: 25, estimatedCost: 1000 });
  assert.equal(ready.extraCost, 0);
  assert.ok(late.extraCost > 0);
  assert.ok(late.stress > 0);
  assert.ok(late.readinessPenalty > 0);
});
