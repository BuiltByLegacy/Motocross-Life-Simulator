import test from 'node:test';
import assert from 'node:assert/strict';

import { createSeasonLifecycleState, openSeasonLifecycle, chooseSeasonPosture } from '../src/systems/seasonLifecycle.js';
import { buildMidseasonReview, buildSeasonReview } from '../src/systems/seasonLifecycleReview.js';
import {
  seasonBriefView,
  familyPlanView,
  sponsorOpportunityView,
  midseasonReviewView,
  seasonReviewView,
  lifecycleRoute,
} from '../src/systems/seasonLifecyclePresentation.js';

function lifecycle() {
  let state = createSeasonLifecycleState({ seasonNumber: 2, seasonYear: 2028 });
  state = openSeasonLifecycle(state, {
    seasonNumber: 2, seasonYear: 2028, age: 10, className: '85cc', region: 'northeast',
    priorSeason: { wins: 2, podiums: 5, races: 12 }, familyMoney: 4200,
    supportValue: 1500, projectedSeasonCost: 6800, reputation: 54,
  });
  return chooseSeasonPosture(state, 'push', ['Regional podium']);
}

test('Season Brief view is focused and exposes one primary action', () => {
  const view = seasonBriefView(lifecycle());
  assert.equal(view.scene, 'season-brief');
  assert.equal(view.hero.posture.id, 'push');
  assert.equal(view.primaryAction, 'review-family-plan');
  assert.equal(Object.hasOwn(view, 'dashboardStats'), false);
});

test('Family Plan view surfaces guardrail warnings without becoming simulation logic', () => {
  const view = familyPlanView(lifecycle(), {
    withinGuardrails: false,
    warnings: [{ type: 'budget', overBy: 500 }],
  });
  assert.equal(view.scene, 'family-plan');
  assert.equal(view.withinGuardrails, false);
  assert.equal(view.warnings[0].type, 'budget');
  assert.equal(view.primaryAction, 'review-tentative-season');
});

test('In-season sponsor opportunity presents accept, counter, reject choices', () => {
  const view = sponsorOpportunityView({ sponsorName: 'Dealer Support Program', trigger: 'major-qualification', supportPreview: { cash: 1200 } });
  assert.deepEqual(view.choices, ['accept', 'counter', 'reject']);
  assert.equal(view.primaryAction, 'review-offer');
});

test('Midseason review compares opening posture with current consequence', () => {
  const state = lifecycle();
  const { review } = buildMidseasonReview(state, {
    seasonYear: 2028, type: 'breakout-result', eventId: 'round-6', date: '2028-06-15',
  }, { wins: 4, podiums: 7, familyMoney: 3000, supportValue: 3200 });
  const view = midseasonReviewView(review);
  assert.equal(view.openingPosture, 'push');
  assert.equal(view.primaryAction, 'revise-future-calendar');
});

test('Season Review view mirrors plan versus reality and routes to carryover', () => {
  const state = lifecycle();
  const review = buildSeasonReview(state, {
    races: 14, wins: 3, podiums: 8, bestFinish: 1, seasonSpend: 7100,
    endingMoney: 900, endingSupportValue: 3000, familyStress: 51,
    completedGoals: ['Regional podium'], memories: [{ title: 'First regional win' }],
  });
  const view = seasonReviewView(review);
  assert.equal(view.scene, 'season-review');
  assert.equal(view.openingPosture, 'push');
  assert.equal(view.reality.wins, 3);
  assert.equal(view.primaryAction, 'carry-forward');
});

test('lifecycle router returns mobile presentation view for each lifecycle stage', () => {
  const state = lifecycle();
  assert.equal(lifecycleRoute('brief', { lifecycle: state }).scene, 'season-brief');
  assert.equal(lifecycleRoute('family-plan', { lifecycle: state }).scene, 'family-plan');
  assert.equal(lifecycleRoute('sponsor-opportunity', { lead: { sponsorName: 'Local Moto Shop' } }).scene, 'sponsor-opportunity');
  assert.equal(lifecycleRoute('unknown').scene, 'season-lifecycle');
});
