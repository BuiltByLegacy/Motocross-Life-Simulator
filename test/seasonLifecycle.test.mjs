import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createSeasonLifecycleState,
  buildSeasonBrief,
  recommendSeasonPosture,
  openSeasonLifecycle,
  chooseSeasonPosture,
  updateFamilyPlan,
  evaluateFamilyGuardrails,
  evaluateInSeasonSponsorMarket,
  recordInSeasonSponsorDecision,
  serializeSeasonLifecycleState,
} from '../src/systems/seasonLifecycle.js';

test('season brief derives money, bike, body, family, and support risk from game state', () => {
  const brief = buildSeasonBrief({
    seasonNumber: 3,
    seasonYear: 2028,
    age: 11,
    className: '85cc',
    priorSeason: { wins: 2, podiums: 6, races: 14 },
    familyMoney: 1200,
    supportValue: 0,
    projectedSeasonCost: 7800,
    bikeCondition: 42,
    fatigue: 68,
    familyStress: 79,
    reputation: 61,
    region: 'northeast',
  });

  assert.equal(brief.fundingGap, 6600);
  assert.deepEqual(new Set(brief.risks.map((r) => r.type)), new Set(['money', 'bike', 'body', 'family', 'support']));
  assert.equal(brief.rider.priorWins, 2);
  assert.equal(brief.region, 'northeast');
});

test('posture recommendation is deterministic and reflects the season situation', () => {
  const breakout = buildSeasonBrief({
    priorSeason: { wins: 5, podiums: 8, races: 14 }, familyMoney: 7000,
    supportValue: 2500, projectedSeasonCost: 8000, reputation: 72, bikeCondition: 90,
  });
  assert.equal(recommendSeasonPosture(breakout), 'breakout');

  const recovery = buildSeasonBrief({
    priorSeason: { wins: 3 }, familyMoney: 9000, projectedSeasonCost: 6000,
    reputation: 75, injury: { name: 'wrist' },
  });
  assert.equal(recommendSeasonPosture(recovery, { injury: { name: 'wrist' } }), 'recovery');

  const privateer = buildSeasonBrief({
    priorSeason: { wins: 2, podiums: 5 }, familyMoney: 1200, supportValue: 400,
    projectedSeasonCost: 7000, reputation: 60,
  });
  assert.equal(recommendSeasonPosture(privateer), 'privateer');
});

test('opening lifecycle persists chosen posture, goals, brief, and family plan', () => {
  let state = createSeasonLifecycleState({ seasonNumber: 2, seasonYear: 2027 });
  state = updateFamilyPlan(state, {
    maxRaceTravelBudget: 8200,
    longDistanceWeekends: 5,
    lorettaIntent: 'priority',
    parentSacrificeStance: 'aggressive',
  });
  state = openSeasonLifecycle(state, {
    seasonNumber: 2,
    seasonYear: 2027,
    age: 10,
    className: '85cc',
    priorSeason: { wins: 1, podiums: 4, races: 12 },
    familyMoney: 5000,
    supportValue: 1800,
    projectedSeasonCost: 7600,
    reputation: 48,
    bikeCondition: 78,
  });
  state = chooseSeasonPosture(state, 'push', ['Loretta Regional', 'Top 3 local championship']);

  const restored = serializeSeasonLifecycleState(state);
  assert.equal(restored.chosenPosture, 'push');
  assert.equal(restored.familyPlan.maxRaceTravelBudget, 8200);
  assert.equal(restored.familyPlan.lorettaIntent, 'priority');
  assert.equal(restored.goals.length, 2);
  assert.equal(restored.openingSnapshot.posture, 'push');
  assert.equal(restored.brief.seasonYear, 2027);
});

test('family plan warns before a tentative calendar violates budget, travel, school, or debt guardrails', () => {
  let state = createSeasonLifecycleState();
  state = updateFamilyPlan(state, {
    maxRaceTravelBudget: 3000,
    longDistanceWeekends: 1,
    schoolFamilyPriority: 80,
    debtWillingness: 15,
  });

  const result = evaluateFamilyGuardrails(state, {
    projectedSeasonCost: 5200,
    projectedDebt: 900,
    events: [
      { id: 'a', travelBand: 'long-haul', schoolConflict: true },
      { id: 'b', travelBand: 'cross-region' },
    ],
  });

  assert.equal(result.withinGuardrails, false);
  assert.deepEqual(new Set(result.warnings.map((w) => w.type)), new Set(['budget', 'travel', 'school-family', 'debt']));
});

test('breakout milestone can deterministically generate new in-season sponsor interest', () => {
  const initial = createSeasonLifecycleState({ seasonYear: 2028 });
  const input = {
    careerSeed: 'rider-42',
    seasonYear: 2028,
    milestoneKey: 'regional-qualifier-win',
    eventId: 'regional-qualifier',
    performance: 91,
    reputation: 74,
    visibility: 82,
    professionalism: 88,
    compliance: 94,
    majorQualification: true,
    rivalryMomentum: 75,
    trigger: 'major-qualification',
    activeSponsorIds: ['local-shop'],
    activeCategories: ['shop'],
  };

  const first = evaluateInSeasonSponsorMarket(initial, input);
  const second = evaluateInSeasonSponsorMarket(first.state, input);

  assert.ok(first.value >= 70);
  assert.ok(first.generated.length > 0);
  assert.ok(first.generated.every((lead) => lead.sponsorId !== 'local-shop'));
  assert.equal(second.duplicate, true);
  assert.equal(second.generated.length, 0);
});

test('weak season can still draw modest local support but does not manufacture high-tier breakout offers', () => {
  const initial = createSeasonLifecycleState({ seasonYear: 2028 });
  const result = evaluateInSeasonSponsorMarket(initial, {
    careerSeed: 'struggle-7',
    milestoneKey: 'midseason-slump',
    performance: 8,
    reputation: 12,
    visibility: 4,
    professionalism: 60,
    compliance: 65,
    conductConcern: 20,
  });
  assert.ok(result.generated.every((lead) => lead.tier === 1));
  assert.ok(result.generated.every((lead) => lead.type !== 'strong-interest'));
});

test('in-season sponsor accept/reject/counter decision persists without mutating preseason contracts', () => {
  const generated = evaluateInSeasonSponsorMarket(createSeasonLifecycleState({ seasonYear: 2028 }), {
    careerSeed: 'decision-9', milestoneKey: 'breakout-1', performance: 95,
    reputation: 85, visibility: 90, professionalism: 90, compliance: 95,
    majorQualification: true,
  });
  assert.ok(generated.generated.length > 0);
  const lead = generated.generated[0];
  const decision = recordInSeasonSponsorDecision(generated.state, lead.id, 'counter', { cash: lead.supportPreview.cash + 250 });
  assert.equal(decision.error, null);
  assert.equal(decision.lead.status, 'countered');
  assert.equal(decision.state.sponsorMarket.offers.length, 1);
  assert.equal(decision.state.sponsorMarket.offers[0].source, 'in-season');
});
