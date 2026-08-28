import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createSponsorship2State,
  signContract,
  approveYouthContract,
  scheduleContractObligations,
  setBrandPlacement,
} from '../src/systems/sponsorship2.js';
import {
  sponsorshipCalendarAgenda,
  sponsorshipBrandView,
} from '../src/sponsorship2HardeningPatch.js';

function offer() {
  return {
    id: 'offer-2026-test', sponsorId: 'test-graphics', sponsorName: 'Test Graphics',
    category: 'graphics', tier: 2, seasonYear: 2026, status: 'draft', leverage: 80,
    guardianRequired: true, guardianApproved: false,
    package: { cashRetainer: 500, productCredit: 350, discountPercent: 15, entryFeeSupport: 100, travelSupport: 50, contingency: 100, performanceBonuses: {} },
    obligations: [
      { type: 'minimum-races', label: 'Race participation', required: true, target: 4 },
      { type: 'graphics-placement', label: 'Run sponsor graphics', required: true, slot: 'bike-shrouds' },
      { type: 'content', label: 'Post graphics reveal', required: true },
      { type: 'product-use', label: 'Use sponsor graphics kit', required: true, productCategory: 'graphics' },
    ],
    exclusivity: ['graphics'], negotiationRound: 0, sourceResponseType: 'mixed-support',
  };
}

function signedState() {
  let state = createSponsorship2State({ seasonYear: 2026 });
  state.preseason.phase = 'funding';
  const approved = approveYouthContract(offer(), true);
  const signed = signContract(state, approved);
  assert.equal(signed.error, null);
  state = signed.state;
  const scheduled = scheduleContractObligations(state, signed.contract.id, { seasonStart: '2026-01-01', riderAge: 12 });
  assert.equal(scheduled.error, null);
  return { state: scheduled.state, contract: signed.contract };
}

test('calendar hardening exposes dated sponsor commitments with guardian/reschedule metadata', () => {
  const { state } = signedState();
  const agenda = sponsorshipCalendarAgenda(state);
  assert.ok(agenda.length >= 1);
  const content = agenda.find((o) => o.type === 'content');
  assert.ok(content);
  assert.match(content.date, /^2026-\d{2}-\d{2}$/);
  assert.equal(content.guardianParticipationRequired, true);
  assert.equal(content.canReschedule, true);
  assert.equal(content.status, 'pending');
});

test('garage hardening reports missing graphics, sponsor product state, then compliance after fixes', () => {
  let { state, contract } = signedState();
  let view = sponsorshipBrandView(state, []);
  assert.equal(view.compliance.compliant, false);
  assert.ok(view.graphics.some((g) => g.slot === 'bike-shrouds' && !g.placed));
  assert.ok(view.products.some((p) => p.category === 'graphics' && !p.using));

  const placed = setBrandPlacement(state, {
    contractId: contract.id,
    slot: 'bike-shrouds',
    brandId: contract.sponsorId,
    category: 'graphics',
    required: true,
  });
  assert.equal(placed.error, null);
  state = placed.state;
  const installed = [{ id: 'graphics-kit', category: 'graphics', brandId: contract.sponsorId }];
  view = sponsorshipBrandView(state, installed);
  assert.equal(view.compliance.compliant, true);
  assert.ok(view.graphics.every((g) => g.placed));
  assert.ok(view.products.every((p) => p.using));
});

test('garage hardening surfaces exclusivity conflicts as actionable violations', () => {
  const { state, contract } = signedState();
  const installed = [{ id: 'rival-kit', category: 'graphics', brandId: 'rival-brand' }];
  const view = sponsorshipBrandView(state, installed);
  assert.equal(view.compliance.compliant, false);
  assert.ok(view.compliance.violations.some((v) => v.type === 'product-exclusivity' && v.sponsorId === contract.sponsorId));
});
