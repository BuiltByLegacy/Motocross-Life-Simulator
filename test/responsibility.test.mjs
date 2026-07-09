import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ageBand, evaluateApproval, permissionFor, trustScore, visibilityFor } from '../src/systems/responsibility.js';

test('#104 age bands are stable and named', () => {
  assert.equal(ageBand(5).key, 'tiny_wheels');
  assert.equal(ageBand(11).key, 'developing_amateur');
  assert.equal(ageBand(17).key, 'high_level_amateur');
  assert.equal(ageBand(22).key, 'adult_racer');
});

test('#105 permissions use age baseline and trust modifier', () => {
  const kid = permissionFor('browse_marketplace', { age: 6, trust: 80 });
  assert.equal(kid.visible, false);
  const teen = permissionFor('browse_marketplace', { age: 14, trust: 55 });
  assert.equal(teen.requiresParent, true);
  const trustedTeen = permissionFor('sell_item', { age: 16, trust: 85 });
  assert.equal(trustedTeen.allowed, true);
});

test('#106 trust score reacts to grades, money, injury, stress, and work ethic', () => {
  const good = trustScore({ gradesGood: true, helpedBike: true, earnedOwnMoney: true, familyStress: 15, money: 1200 });
  const bad = trustScore({ gradesGood: false, injury: { weeksOut: 2, severity: 'severe' }, familyStress: 80, money: 100, irresponsibleSpending: true });
  assert.ok(good > bad);
  assert.ok(good <= 100 && bad >= 0);
});

test('#110 parent approval returns conditions and denials', () => {
  const denied = evaluateApproval('travel_far', { age: 10, cost: 800, money: 200, gradesGood: false });
  assert.equal(denied.result, 'denied');
  assert.ok(denied.reasons.some((r) => /money/i.test(r)));
  const conditional = evaluateApproval('loretta_attempt', { age: 15, cost: 120, money: 900, gradesGood: false, familyStress: 78 });
  assert.equal(conditional.result, 'approved_with_conditions');
  assert.ok(conditional.conditions.length >= 1);
});

test('information visibility grows with age and parent campaign sees full details', () => {
  assert.equal(visibilityFor('travel_cost', { age: 6 }), 'parent_framed');
  assert.equal(visibilityFor('entry_fee', { age: 11 }), 'simple');
  assert.equal(visibilityFor('contract_terms', { age: 16 }), 'summary');
  assert.equal(visibilityFor('family_debt', { age: 12, campaign: 'parent' }), 'full');
});
