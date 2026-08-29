import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createSeasonLifecycleState,
  openSeasonLifecycle,
  chooseSeasonPosture,
  updateFamilyPlan,
} from '../src/systems/seasonLifecycle.js';
import {
  shouldTriggerMidseasonReview,
  buildMidseasonReview,
  applyMidseasonPivot,
  buildSeasonReview,
  buildSeasonCarryover,
  finalizeSeasonLifecycle,
} from '../src/systems/seasonLifecycleReview.js';

function openedLifecycle() {
  let state = createSeasonLifecycleState({ seasonNumber: 4, seasonYear: 2029 });
  state = updateFamilyPlan(state, { maxRaceTravelBudget: 7000, longDistanceWeekends: 3 });
  state = openSeasonLifecycle(state, {
    seasonNumber: 4,
    seasonYear: 2029,
    age: 12,
    className: 'Supermini',
    priorSeason: { wins: 1, podiums: 5, races: 14 },
    familyMoney: 4800,
    supportValue: 1200,
    projectedSeasonCost: 6500,
    reputation: 52,
  });
  return chooseSeasonPosture(state, 'push', ['Qualify for Loretta', 'Top 3 regional points']);
}

test('midseason review triggers only for material changes and suppresses duplicates', () => {
  const state = openedLifecycle();
  const change = { seasonYear: 2029, type: 'breakout-result', eventId: 'round-5', date: '2029-06-10' };
  const first = shouldTriggerMidseasonReview(state, change);
  assert.equal(first.trigger, true);

  const built = buildMidseasonReview(state, change, { wins: 3, podiums: 6, familyMoney: 4100, supportValue: 2500 });
  const applied = applyMidseasonPivot(state, built.review, { calendar: [], addEventIds: [] });
  const second = shouldTriggerMidseasonReview(applied.state, change);
  assert.equal(second.trigger, false);
  assert.equal(second.reason, 'duplicate');
});

test('midseason pivot changes only future calendar while preserving completed history', () => {
  const state = openedLifecycle();
  const change = { seasonYear: 2029, type: 'major-sponsor-offer', eventId: 'regional-6', date: '2029-06-15' };
  const { review } = buildMidseasonReview(state, change, { wins: 4, supportValue: 4000 });
  const calendar = [
    { id: 'round-1', startDate: '2029-04-10', completed: true, result: 'P2' },
    { id: 'round-7', startDate: '2029-07-01', travelBand: 'local' },
    { id: 'national-1', startDate: '2029-08-01', travelBand: 'long-haul' },
  ];
  const result = applyMidseasonPivot(state, review, {
    calendar,
    dropEventIds: ['round-7'],
    addEventIds: ['regional-extra'],
    reprioritize: [{ eventId: 'national-1', priority: 'high' }],
    projectedSeasonCost: 6800,
  });

  assert.equal(result.calendar[0].id, 'round-1');
  assert.equal(result.calendar[0].result, 'P2');
  assert.equal(result.calendar.some((e) => e.id === 'round-7'), false);
  assert.equal(result.calendar.some((e) => e.id === 'regional-extra'), true);
  assert.equal(result.calendar.find((e) => e.id === 'national-1').priority, 'high');
});

test('injury review recommends protecting the future calendar', () => {
  const state = openedLifecycle();
  const { review } = buildMidseasonReview(state, {
    seasonYear: 2029, type: 'injury', eventId: 'round-4', date: '2029-05-20',
  }, { injury: { name: 'wrist', weeksOut: 5 }, familyStress: 66 });
  assert.ok(review.recommendations.includes('protect-future-calendar'));
  assert.ok(review.recommendations.includes('prioritize-recovery'));
});

test('season review compares opening plan against actual season and records wins, misses, finances, and family consequences', () => {
  const state = openedLifecycle();
  const review = buildSeasonReview(state, {
    races: 15,
    wins: 4,
    podiums: 9,
    bestFinish: 1,
    seasonSpend: 7600,
    endingMoney: 900,
    endingSupportValue: 3500,
    familyStress: 64,
    completedGoals: ['Top 3 regional points'],
    majorQualification: 'Loretta Regional',
    rivalOutcome: { rival: 'Ethan', headToHead: '8-6' },
    memories: [{ title: 'First Regional Win' }],
  });

  assert.equal(review.plan.posture, 'push');
  assert.equal(review.reality.wins, 4);
  assert.equal(review.comparison.costVariance, 1100);
  assert.equal(review.comparison.goalCompletionRate, 50);
  assert.ok(review.highlights.some((h) => h.type === 'major-qualification'));
  assert.ok(review.misses.some((m) => m.type === 'goal' && m.value === 'Qualify for Loretta'));
  assert.ok(review.misses.some((m) => m.type === 'budget-overrun'));
});

test('carryover feeds next season with reputation, sponsor interest, bikes, family, injuries, finances, opportunities, and history summary', () => {
  const state = openedLifecycle();
  const actual = {
    races: 12, wins: 2, podiums: 6, seasonSpend: 6200, endingMoney: 1700,
    endingSupportValue: 2800, familyStress: 48,
    reputation: { local: 72, regional: 41 },
    sponsorRenewalInterest: [{ sponsorId: 'dealer-support', interest: 78 }],
    unresolvedObligations: [{ id: 'appearance-1' }],
    bikes: [{ id: 'bike-85', championshipBike: true }],
    familySupport: 76,
    injury: { name: 'ankle', weeksOut: 2 },
    debt: 350,
    nextGoals: ['Loretta National'],
    careerOpportunities: [{ type: 'team-scouting', id: 'team-1' }],
    completedGoals: ['Top 3 regional points'],
  };
  const review = buildSeasonReview(state, actual);
  const carryover = buildSeasonCarryover(review, actual);

  assert.equal(carryover.reputation.local, 72);
  assert.equal(carryover.sponsorRenewalInterest.length, 1);
  assert.equal(carryover.bikes[0].championshipBike, true);
  assert.equal(carryover.family.stress, 48);
  assert.equal(carryover.injuries.length, 1);
  assert.equal(carryover.finances.endingMoney, 1700);
  assert.equal(carryover.careerOpportunities[0].type, 'team-scouting');
  assert.equal(carryover.historySummary.wins, 2);
});

test('finalizeSeasonLifecycle stores queryable review and carryover on serialized lifecycle state', () => {
  const state = openedLifecycle();
  const finalized = finalizeSeasonLifecycle(state, {
    races: 10, wins: 1, podiums: 4, seasonSpend: 6100, endingMoney: 1200,
    endingSupportValue: 2200, familyStress: 36,
  });
  assert.equal(finalized.state.review.seasonYear, 2029);
  assert.equal(finalized.state.carryover.fromSeason, 4);
  assert.equal(finalized.state.carryover.historySummary.races, 10);
});
