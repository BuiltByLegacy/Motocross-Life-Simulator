import test from 'node:test';
import assert from 'node:assert/strict';

import { Game } from '../src/game.js';
import {
  createSponsorship2State,
  restoreSponsorship2State,
  responseToDraftOffer,
  counterOffer,
  approveYouthContract,
  signContract,
  contractFundingSummary,
  scheduleContractObligations,
  obligationConflicts,
  rescheduleObligation,
  resolveObligation,
  setBrandPlacement,
  brandCompliance,
  evaluateSponsorRelationship,
  endSeasonSponsorDecision,
  buildSeasonLockSummary,
  lockPreseasonSponsorship,
} from '../src/systems/sponsorship2.js';

const rider = {
  age: 14,
  className: '85cc',
  region: 'northeast',
  results: 72,
  reputation: 66,
  localReputation: 70,
  professionalism: 82,
  visibility: 56,
  relationship: 68,
};

function response(overrides = {}) {
  return {
    sponsorId: 'parts-brand',
    sponsorName: 'Performance Parts Brand',
    category: 'parts',
    seasonYear: 2027,
    fitScore: 74,
    proposalQuality: 80,
    type: 'mixed-support',
    support: { cash: 900, productValue: 1250, contingency: 525, kind: 'mixed-support' },
    guardianRequired: true,
    accepted: false,
    ...overrides,
  };
}

function signedState() {
  let state = createSponsorship2State({ seasonYear: 2027 });
  let offer = responseToDraftOffer(response(), { rider, relationship: 70 });
  offer = approveYouthContract(offer, true);
  const signed = signContract(state, offer);
  assert.equal(signed.error, null);
  return { state: signed.state, contract: signed.contract, offer };
}

test('#341 draft offer contains mixed support, performance bonuses, obligations and exclusivity', () => {
  const offer = responseToDraftOffer(response(), { rider, relationship: 70 });
  assert.equal(offer.guardianRequired, true);
  assert.ok(offer.package.cashRetainer > 0);
  assert.ok(offer.package.productCredit > 0);
  assert.ok(offer.package.discountPercent > 0);
  assert.ok(offer.package.entryFeeSupport > 0);
  assert.ok(offer.package.travelSupport > 0);
  assert.ok(offer.package.contingency > 0);
  assert.ok(offer.package.performanceBonuses.win > 0);
  assert.ok(offer.obligations.some((o) => o.type === 'product-use'));
  assert.deepEqual(offer.exclusivity, ['parts']);
});

test('#341 youth contract requires guardian approval and signed exclusivity blocks competitor', () => {
  let state = createSponsorship2State({ seasonYear: 2027 });
  const offer = responseToDraftOffer(response(), { rider });
  assert.equal(signContract(state, offer).error, 'guardian-approval-required');
  const signed = signContract(state, approveYouthContract(offer, true));
  state = signed.state;

  const competitorResponse = response({
    sponsorId: 'dealer-support', sponsorName: 'Dealer Support Program', category: 'dealer',
    type: 'strong-offer', support: { cash: 1200, productValue: 900, contingency: 450, kind: 'strong-offer' },
  });
  // Dealer exclusivity is a different category and may coexist.
  const dealer = approveYouthContract(responseToDraftOffer(competitorResponse, { rider }), true);
  assert.equal(signContract(state, dealer).error, null);

  // A second parts contract is explicitly conflicting.
  const conflicting = {
    ...approveYouthContract(responseToDraftOffer(response(), { rider }), true),
    id: 'offer-competitor-parts', sponsorId: 'competitor-parts', sponsorName: 'Competitor Parts', exclusivity: ['parts'],
  };
  const result = signContract(state, conflicting);
  assert.equal(result.error, 'exclusivity-conflict');
  assert.equal(result.conflicts[0].category, 'parts');
});

test('#341 negotiation can accept/restructure/reduce/reject deterministically and history persists', () => {
  const state = createSponsorship2State({ seasonYear: 2027 });
  const offer = responseToDraftOffer(response(), { rider, relationship: 75 });
  const request = { cashRetainer: Math.round(offer.package.cashRetainer * 1.1), discountPercent: offer.package.discountPercent + 3 };
  const a = counterOffer(state, offer, request, { rider, relationship: 75, careerSeed: 'same-career' });
  const b = counterOffer(state, offer, request, { rider, relationship: 75, careerSeed: 'same-career' });
  assert.equal(a.outcome, b.outcome);
  assert.deepEqual(a.offer.package, b.offer.package);
  assert.equal(a.state.offerHistory.length, 1);
  assert.equal(restoreSponsorship2State(JSON.parse(JSON.stringify(a.state))).offerHistory.length, 1);
});

test('#345 confirmed sponsor support changes real tentative-season funding gap', () => {
  const { state } = signedState();
  const summary = contractFundingSummary(state, { tentativeSeasonCost: 7200, familyCash: 3100 });
  assert.ok(summary.sponsorCash > 0);
  assert.ok(summary.productValue > 0);
  assert.ok(summary.contingencyPotential > 0);
  assert.ok(summary.fundingGap < 7200 - 3100);
  assert.equal(summary.familyOutOfPocketIfLocked, Math.max(0, 7200 - summary.sponsorCash));
});

test('#342 obligations get real dates, expose conflicts, can reschedule once, and resolve', () => {
  let { state, contract } = signedState();
  const scheduled = scheduleContractObligations(state, contract.id, { seasonStart: '2027-03-01', riderAge: 14 });
  state = scheduled.state;
  assert.ok(scheduled.obligations.length >= 3);
  const dated = scheduled.obligations.find((o) => o.date);
  assert.ok(dated);
  assert.equal(dated.guardianParticipationRequired, true);

  const calendar = [{ id: 'race-1', name: 'Regional Race', startDate: dated.date, endDate: dated.date, category: 'race' }];
  assert.equal(obligationConflicts(dated, calendar).length, 1);
  assert.equal(rescheduleObligation(state, dated.id, dated.date, { calendarEntries: calendar }).error, 'calendar-conflict');

  const moved = rescheduleObligation(state, dated.id, '2027-11-15', { calendarEntries: [] });
  assert.equal(moved.error, null);
  assert.equal(moved.state.obligations.find((o) => o.id === dated.id).date, '2027-11-15');
  assert.equal(rescheduleObligation(moved.state, dated.id, '2027-11-16', { calendarEntries: [] }).error, 'reschedule-limit');

  const resolved = resolveObligation(moved.state, dated.id, 'fulfilled');
  assert.equal(resolved.obligation.status, 'fulfilled');
});

test('#343 sponsor placement and product-use exclusivity are enforced', () => {
  let { state, contract } = signedState();
  state = scheduleContractObligations(state, contract.id, { seasonStart: '2027-03-01', riderAge: 14 }).state;

  const wrongPart = brandCompliance(state, [{ id: 'pipe-x', category: 'parts', brandId: 'competitor-parts' }]);
  assert.equal(wrongPart.compliant, false);
  assert.equal(wrongPart.violations[0].type, 'product-exclusivity');

  const invalidPlacement = setBrandPlacement(state, { contractId: contract.id, slot: 'garage-wall', brandId: 'competitor-parts', category: 'parts' });
  assert.equal(invalidPlacement.error, 'exclusivity-violation');

  // Parts sponsor has a content/product obligation rather than required graphics,
  // so its own product installed is compliant.
  const good = brandCompliance(state, [{ id: 'pipe-sponsor', category: 'parts', brandId: contract.sponsorId }]);
  assert.equal(good.violations.length, 0);
});

test('#344 performance and professionalism remain separate; missed obligations can warn/probate/terminate', () => {
  let { state, contract } = signedState();
  state = scheduleContractObligations(state, contract.id, { seasonStart: '2027-03-01', riderAge: 14 }).state;
  const required = state.obligations.filter((o) => o.contractId === contract.id && o.required);
  assert.ok(required.length >= 2);

  // Strong racing cannot fully hide poor professional delivery.
  for (const o of required.slice(0, 2)) state = resolveObligation(state, o.id, 'missed').state;
  const evaluated = evaluateSponsorRelationship(state, contract.id, {
    performance: 92, professionalism: 38, visibility: 55,
    installedProducts: [{ id: 'wrong', category: 'parts', brandId: 'competitor' }],
  });
  assert.ok(['probation', 'terminate'].includes(evaluated.disposition));
  assert.equal(evaluated.contract.satisfaction.performance, 92);
  assert.ok(evaluated.contract.satisfaction.professionalism < 38);
  assert.equal(evaluated.state.relationshipHistory[contract.sponsorId].length, 1);
});

test('#344 strong delivery renews/upgrades while serious breach can lose a sponsor', () => {
  let { state, contract } = signedState();
  state = scheduleContractObligations(state, contract.id, { seasonStart: '2027-03-01', riderAge: 14 }).state;
  for (const o of state.obligations.filter((x) => x.required)) state = resolveObligation(state, o.id, 'fulfilled').state;
  const strong = evaluateSponsorRelationship(state, contract.id, { performance: 90, professionalism: 95, visibility: 90, installedProducts: [] });
  const renewal = endSeasonSponsorDecision(strong.state, contract.id, { nextSeasonYear: 2028 });
  assert.ok(['upgrade', 'renew-plus-referral', 'renew'].includes(renewal.decision));
  assert.ok(renewal.renewedContract);
  assert.equal(renewal.renewedContract.seasonYear, 2028);

  const breached = evaluateSponsorRelationship(state, contract.id, { performance: 95, professionalism: 10, severeConductBreach: true, installedProducts: [] });
  const lost = endSeasonSponsorDecision(breached.state, contract.id, { nextSeasonYear: 2028 });
  assert.equal(lost.decision, 'lost');
  assert.equal(lost.renewedContract, null);
});

test('#345 lock summary exposes family contribution and sponsor obligations before season lock', () => {
  let { state, contract } = signedState();
  state = scheduleContractObligations(state, contract.id, { seasonStart: '2027-03-01', riderAge: 14 }).state;
  const summary = buildSeasonLockSummary(state, { tentativeSeasonCost: 7000, familyCash: 3500, calendarEntries: [] });
  assert.equal(summary.canLock, true);
  assert.ok(summary.familyContribution < 7000);
  assert.ok(summary.requiredObligations.length > 0);
  assert.equal(summary.contracts.length, 1);
  const locked = lockPreseasonSponsorship(state, { tentativeSeasonCost: 7000, familyCash: 3500, calendarEntries: [] });
  assert.equal(locked.error, null);
  assert.equal(locked.state.preseason.phase, 'locked');
});

test('#346 sponsorship state survives the real Game save/load envelope', () => {
  const game = new Game({ riderName: 'Save Rider', seed: 2468, birthdate: '2013-05-15' });
  let { state, contract } = signedState();
  state = scheduleContractObligations(state, contract.id, { seasonStart: '2027-03-01', riderAge: 14 }).state;
  state = resolveObligation(state, state.obligations[0].id, 'fulfilled').state;
  game.state.sponsorship2 = state;

  const loaded = Game.load(JSON.parse(JSON.stringify(game.toSave())));
  assert.deepEqual(loaded.state.sponsorship2.contracts, state.contracts);
  assert.deepEqual(loaded.state.sponsorship2.obligations, state.obligations);
  assert.deepEqual(loaded.state.sponsorship2.offerHistory, state.offerHistory);
});
