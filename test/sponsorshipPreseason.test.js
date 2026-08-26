import test from 'node:test';
import assert from 'node:assert/strict';
import {
  acceptSponsorResponse,
  canPitchSponsor,
  createSponsorshipState,
  discoverSponsorCandidates,
  pitchSponsor,
  restoreSponsorshipState,
  riderSponsorProfile,
  serializeSponsorshipState,
  sponsorshipFundingSummary,
} from '../src/systems/sponsorshipPreseason.js';

const rookie = {
  age: 10,
  className: '65cc',
  region: 'northeast',
  results: 8,
  reputation: 12,
  professionalism: 60,
  visibility: 4,
  relationship: 10,
  localReputation: 16,
};

const contender = {
  age: 14,
  className: '85cc',
  region: 'northeast',
  results: 74,
  reputation: 68,
  professionalism: 82,
  visibility: 55,
  relationship: 64,
  localReputation: 72,
};

test('discovers realistic sponsor candidates and ranks stronger fits higher', () => {
  const state = createSponsorshipState({ seasonYear: 2027 });
  const rookieCandidates = discoverSponsorCandidates(rookie, state);
  const contenderCandidates = discoverSponsorCandidates(contender, state);
  assert.ok(rookieCandidates.length >= 5);
  assert.ok(contenderCandidates[0].fitScore >= rookieCandidates[0].fitScore);
  assert.equal(riderSponsorProfile(rookie).age, 10);
});

test('low-profile riders can be rejected and youth pitches require guardian involvement', () => {
  let state = createSponsorshipState({ seasonYear: 2027 });
  const result = pitchSponsor(state, {
    sponsorId: 'industry-support',
    rider: rookie,
    careerSeed: 'rookie-rejection-seed',
    proposalQuality: 20,
  });
  state = result.state;
  assert.ok(['decline', 'soft-decline', 'product-support', 'counter'].includes(result.response.type));
  assert.equal(result.response.guardianRequired, true);
  assert.equal(state.attempts.length, 1);
});

test('pitch outcomes are deterministic for the same career state', () => {
  const a = pitchSponsor(createSponsorshipState({ seasonYear: 2027 }), {
    sponsorId: 'dealer-support', rider: contender, careerSeed: 'same-seed', proposalQuality: 70,
  });
  const b = pitchSponsor(createSponsorshipState({ seasonYear: 2027 }), {
    sponsorId: 'dealer-support', rider: contender, careerSeed: 'same-seed', proposalQuality: 70,
  });
  assert.deepEqual(a.response, b.response);
});

test('prevents repeat-pitch and unlimited sponsor spam', () => {
  let state = createSponsorshipState({ seasonYear: 2027, maxPitches: 2 });
  let result = pitchSponsor(state, { sponsorId: 'local-shop', rider: contender, careerSeed: 'anti-spam' });
  state = result.state;
  assert.equal(canPitchSponsor(state, 'local-shop').reason, 'already-pitched-this-season');
  result = pitchSponsor(state, { sponsorId: 'graphics-co', rider: contender, careerSeed: 'anti-spam' });
  state = result.state;
  assert.equal(canPitchSponsor(state, 'dealer-support').reason, 'preseason-pitch-limit');
});

test('accepted support changes the tentative season funding gap', () => {
  let state = createSponsorshipState({ seasonYear: 2027 });
  const candidates = ['local-shop', 'dealer-support', 'regional-business', 'industry-support'];
  let offered = null;
  for (const sponsorId of candidates) {
    const pitched = pitchSponsor(state, { sponsorId, rider: contender, careerSeed: 'funding-seed', proposalQuality: 90 });
    state = pitched.state;
    if (!['decline', 'soft-decline'].includes(pitched.response.type)) {
      offered = sponsorId;
      break;
    }
  }
  assert.ok(offered, 'expected at least one offer for strong contender');
  const accepted = acceptSponsorResponse(state, offered);
  assert.equal(accepted.error, null);
  const before = sponsorshipFundingSummary(state, { tentativeSeasonCost: 6000, familyCash: 2500 });
  const after = sponsorshipFundingSummary(accepted.state, { tentativeSeasonCost: 6000, familyCash: 2500 });
  assert.ok(after.sponsorCash >= 0);
  assert.ok(after.fundingGap <= before.fundingGap);
  assert.equal(after.familyOutOfPocketIfLocked, Math.max(0, 6000 - after.sponsorCash));
});

test('state survives save/load with contact history and accepted support intact', () => {
  let state = createSponsorshipState({ seasonYear: 2027 });
  const pitched = pitchSponsor(state, { sponsorId: 'local-shop', rider: contender, careerSeed: 'save-seed', proposalQuality: 90 });
  state = pitched.state;
  if (!['decline', 'soft-decline'].includes(pitched.response.type)) state = acceptSponsorResponse(state, 'local-shop').state;
  const restored = restoreSponsorshipState(serializeSponsorshipState(state));
  assert.deepEqual(restored.attempts, state.attempts);
  assert.deepEqual(restored.contactHistory, state.contactHistory);
  assert.deepEqual(restored.acceptedSupport, state.acceptedSupport);
});
