import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSeasonBrief,
  buildSeasonReview,
  createFamilyPlan,
  evaluateFamilyPlan,
  evaluatePivot,
  inSeasonSponsorOpportunity,
  marketValue,
  recordSponsorDecision,
  recommendPosture,
  restoreLifecycleState,
  startNextSeason,
} from '../src/systems/seasonLifecycle.js';

test('season posture recommendation responds to real program conditions', () => {
  assert.equal(recommendPosture({ injury: true, projectedSeasonCost: 5000, money: 5000 }), 'recovery');
  assert.equal(recommendPosture({ results: 82, reputation: 70, support: 68, projectedSeasonCost: 6000, money: 5000 }), 'breakout');
  assert.equal(recommendPosture({ results: 60, projectedSeasonCost: 6000, money: 4000 }), 'push');
  assert.equal(recommendPosture({ results: 62, reputation: 55, projectedSeasonCost: 9000, money: 1500 }), 'privateer');
  assert.equal(recommendPosture({ projectedSeasonCost: 4000, money: 2500 }), 'build');
});

test('season brief exposes money, support gap and risks', () => {
  const brief = buildSeasonBrief({ seasonYear: 2026, riderName: 'Riley', age: 8, klass: '65cc', money: 1200, projectedSeasonCost: 5000, supportValue: 800, activeSponsors: 1, bikeCondition: 45, bikeReliability: 72 });
  assert.equal(brief.fundingGap, 3000);
  assert.ok(brief.risks.some((r) => r.id === 'money'));
  assert.ok(brief.risks.some((r) => r.id === 'bike'));
});

test('family plan guardrails flag budget, travel and no-debt conflicts', () => {
  const plan = createFamilyPlan({ maxSeasonSpend: 4000, maxLongTravelWeekends: 3, debtPolicy: 'never' });
  const result = evaluateFamilyPlan(plan, { projectedSpend: 6200, longTravelWeekends: 6, fundingGap: 1200 });
  assert.equal(result.withinGuardrails, false);
  assert.deepEqual(result.warnings.map((w) => w.id), ['budget', 'travel', 'debt']);
});

test('strong in-season performance creates new support and does not spam the same offer', () => {
  const ctx = { seasonYear: 2026, age: 13, results: 88, reputation: 78, visibility: 76, professionalism: 75, compliance: 82, recentWins: 3, majorQualification: true };
  assert.ok(marketValue(ctx) >= 82);
  const first = inSeasonSponsorOpportunity(ctx, { seen: [] });
  assert.equal(first.offer.tier, 'manufacturer-amateur');
  assert.equal(first.offer.guardianRequired, true);
  const state = recordSponsorDecision(restoreLifecycleState({ seasonYear: 2026 }), first.offer, 'accept');
  const again = inSeasonSponsorOpportunity(ctx, state.sponsorMarket);
  assert.equal(again.offer, null);
  assert.equal(again.reason, 'already-seen');
});

test('midseason review triggers for breakout and retreats for injury/financial pressure', () => {
  const breakout = evaluatePivot({ recentWins: 2 }, restoreLifecycleState());
  assert.equal(breakout.shouldReview, true);
  assert.equal(breakout.recommendation, 'consider-expansion');
  const trouble = evaluatePivot({ injury: { name: 'wrist' }, money: 200, projectedRemainingCost: 2000 }, restoreLifecycleState());
  assert.equal(trouble.recommendation, 'protect-and-revise');
});

test('season review carries meaningful state into the next year', () => {
  const opening = buildSeasonBrief({ seasonYear: 2026, money: 4000, projectedSeasonCost: 3500, bikeCondition: 90 });
  const review = buildSeasonReview(opening, { races: 8, wins: 2, podiums: 5, points: 140, money: 1800, actualSpend: 4200, reputation: 72, bikeCondition: 61, sponsorRenewalInterest: 78 });
  assert.equal(review.actual.wins, 2);
  assert.equal(review.delta.spendVsPlan, 700);
  assert.equal(review.carryover.money, 1800);
  const next = startNextSeason({ seasonYear: 2026, carryover: review.carryover, history: [review] }, 2027);
  assert.equal(next.seasonYear, 2027);
  assert.equal(next.carryover.reputation, 72);
  assert.equal(next.history.length, 1);
});