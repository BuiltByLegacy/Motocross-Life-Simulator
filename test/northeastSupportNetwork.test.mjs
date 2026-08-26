import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createSupportState, restoreSupportState, serializeSupportState,
  applyRelationshipEvent, supportBenefits, evaluateSponsorOffers,
  acceptSponsorOffer, resolveSponsorSeason,
} from '../src/systems/northeastSupportNetwork.js';

test('#307 dealer/shop/team relationships improve and degrade through real events', () => {
  let state = createSupportState();
  state = applyRelationshipEvent(state, { entityId: 'ne-dealer-riverbend', type: 'purchase', season: 1 }).state;
  state = applyRelationshipEvent(state, { entityId: 'ne-dealer-riverbend', type: 'win', season: 1 }).state;
  const afterPositive = state.relationships['ne-dealer-riverbend'].score;
  assert.ok(afterPositive > 20);
  state = applyRelationshipEvent(state, { entityId: 'ne-dealer-riverbend', type: 'unpaid-obligation', season: 1 }).state;
  assert.ok(state.relationships['ne-dealer-riverbend'].score < afterPositive);
});

test('#307 earned support benefits differ by entity type', () => {
  let state = createSupportState();
  for (let i = 0; i < 5; i++) state = applyRelationshipEvent(state, { entityId: 'ne-shop-precision', type: 'win' }).state;
  const shop = supportBenefits(state, 'ne-shop-precision');
  assert.equal(shop.rushService, true);
  assert.equal(shop.partsPriority, false);
});

test('#307 support state persists across save/reload', () => {
  let state = createSupportState();
  state = applyRelationshipEvent(state, { entityId: 'ne-team-granite', type: 'sportsmanship', season: 2 }).state;
  const restored = restoreSupportState(serializeSupportState(state));
  assert.deepEqual(restored.relationships['ne-team-granite'], state.relationships['ne-team-granite']);
});

test('#308 sponsor offers are earned from reputation/results and youth approval is required', () => {
  let state = createSupportState();
  const offers = evaluateSponsorOffers(state, { localReputation: 72, notableResults: 6, sportsmanship: 60, age: 12 });
  assert.ok(offers.length >= 2);
  assert.ok(offers.every((o) => o.requiresGuardian));
  const blocked = acceptSponsorOffer(state, offers[0].id, { age: 12, guardianApproved: false, season: 1 });
  assert.equal(blocked.ok, false);
  const accepted = acceptSponsorOffer(state, offers[0].id, { age: 12, guardianApproved: true, season: 1 });
  assert.equal(accepted.ok, true);
});

test('#308 sponsorship can renew or be lost based on actual obligations', () => {
  let state = createSupportState();
  state = acceptSponsorOffer(state, 'ne-sponsor-dealer', { age: 12, guardianApproved: true, season: 1 }).state;
  let outcome = resolveSponsorSeason(state, 'ne-sponsor-dealer', { attendanceRate: 0.95, sportsmanship: 65, reputation: 80, season: 1 });
  assert.equal(outcome.outcome, 'renewed');
  state = outcome.state;
  outcome = resolveSponsorSeason(state, 'ne-sponsor-dealer', { attendanceRate: 0.3, sportsmanship: 65, reputation: 80, season: 2 });
  assert.equal(outcome.outcome, 'lost');
  assert.equal(outcome.state.sponsorships['ne-sponsor-dealer'].active, false);
});
