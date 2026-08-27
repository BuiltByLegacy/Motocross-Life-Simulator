// Sponsorship 2.0 integrated domain engine (#341-#344, #346)
// -----------------------------------------------------------------------------
// Extends the preseason pursuit engine with negotiable contracts, dated
// obligations, brand/exclusivity compliance, sponsor satisfaction, and renewal.
// All outcomes are deterministic from persisted career state so save/reload does
// not change the player's result.

import {
  createSponsorshipState,
  discoverSponsorCandidates,
  pitchSponsor,
  sponsorshipFundingSummary,
  SPONSOR_CATALOG,
} from './sponsorshipPreseason.js';

const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, Number(n) || 0));
const round25 = (n) => Math.round((Number(n) || 0) / 25) * 25;

function hash(input) {
  let h = 2166136261;
  for (const ch of String(input)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function unit(seed) { return hash(seed) / 0xffffffff; }
function deepCopy(value) { return JSON.parse(JSON.stringify(value)); }
function byId(state, id) { return (state.contracts ?? []).find((c) => c.id === id); }

export function createSponsorship2State({ seasonYear, pursuitState } = {}) {
  return {
    version: 2,
    seasonYear: seasonYear ?? pursuitState?.seasonYear ?? new Date().getUTCFullYear(),
    pursuit: pursuitState ? deepCopy(pursuitState) : createSponsorshipState({ seasonYear }),
    offerHistory: [],
    contracts: [],
    obligations: [],
    brandPlacements: [],
    relationshipHistory: {},
    preseason: { phase: 'tentative', lastBudget: null, lockSummary: null },
  };
}

export function restoreSponsorship2State(raw = {}) {
  const state = createSponsorship2State({ seasonYear: raw.seasonYear, pursuitState: raw.pursuit });
  return {
    ...state,
    ...deepCopy(raw),
    pursuit: { ...state.pursuit, ...(deepCopy(raw.pursuit ?? {})) },
    offerHistory: deepCopy(raw.offerHistory ?? []),
    contracts: deepCopy(raw.contracts ?? []),
    obligations: deepCopy(raw.obligations ?? []),
    brandPlacements: deepCopy(raw.brandPlacements ?? []),
    relationshipHistory: deepCopy(raw.relationshipHistory ?? {}),
    preseason: { ...state.preseason, ...(deepCopy(raw.preseason ?? {})) },
  };
}

export function sponsorLeverage({ response, rider = {}, relationship = 0 } = {}) {
  const fit = clamp(response?.fitScore ?? 0);
  const results = clamp(rider.results ?? rider.resultScore ?? 0);
  const reputation = clamp(rider.reputation ?? rider.localReputation ?? 0);
  const professionalism = clamp(rider.professionalism ?? 50);
  const visibility = clamp(rider.visibility ?? rider.media ?? 0);
  return Math.round(clamp(
    fit * 0.34 + results * 0.22 + reputation * 0.14 + professionalism * 0.12 +
    visibility * 0.08 + clamp(relationship) * 0.10
  ));
}

function packageFromResponse(response, sponsor) {
  const s = response?.support ?? {};
  const tier = sponsor?.tier ?? 1;
  const kind = response?.type ?? s.kind ?? 'offer';
  const discountPercent = ['product-support', 'mixed-support', 'strong-offer'].includes(kind)
    ? Math.min(30, 5 + tier * 5)
    : 0;
  const entryFeeSupport = ['partial-cash', 'mixed-support', 'strong-offer'].includes(kind)
    ? round25((s.cash ?? 0) * 0.20)
    : 0;
  const travelSupport = ['mixed-support', 'strong-offer'].includes(kind)
    ? round25((s.cash ?? 0) * 0.18)
    : 0;
  return {
    cashRetainer: Math.max(0, s.cash ?? 0),
    productCredit: Math.max(0, s.productValue ?? 0),
    discountPercent,
    entryFeeSupport,
    travelSupport,
    contingency: Math.max(0, s.contingency ?? 0),
    performanceBonuses: {
      win: round25(75 * tier),
      podium: round25(35 * tier),
      title: round25(300 * tier),
      lorettaQualification: round25(200 * tier),
    },
  };
}

function obligationTemplate(category, tier) {
  const common = [
    { type: 'minimum-races', label: 'Race participation', required: true, target: Math.max(3, 2 + tier) },
    { type: 'conduct', label: 'Professional conduct', required: true },
  ];
  const categorySpecific = {
    graphics: [
      { type: 'graphics-placement', label: 'Run sponsor graphics', required: true, slot: 'bike-shrouds' },
      { type: 'content', label: 'Post graphics reveal', required: true },
    ],
    gear: [
      { type: 'product-use', label: 'Use sponsor gear', required: true, productCategory: 'gear' },
      { type: 'appearance', label: 'Dealer autograph session', required: false },
    ],
    parts: [
      { type: 'product-use', label: 'Run sponsor performance parts', required: true, productCategory: 'parts' },
      { type: 'content', label: 'Product spotlight', required: true },
    ],
    dealer: [
      { type: 'appearance', label: 'Dealer open house appearance', required: true },
      { type: 'graphics-placement', label: 'Dealer logo on bike', required: true, slot: 'fork-guards' },
    ],
    shop: [
      { type: 'appearance', label: 'Shop meet-and-greet', required: tier >= 2 },
      { type: 'graphics-placement', label: 'Shop logo on pit board', required: true, slot: 'pit-board' },
    ],
    industry: [
      { type: 'content', label: 'Sponsor media day', required: true },
      { type: 'appearance', label: 'Sponsor hospitality appearance', required: true },
      { type: 'graphics-placement', label: 'Primary logo placement', required: true, slot: 'bike-shrouds' },
    ],
    'outside-industry': [
      { type: 'appearance', label: 'Local sponsor appearance', required: true },
      { type: 'graphics-placement', label: 'Local business logo', required: true, slot: 'rear-fender' },
    ],
  };
  return [...common, ...(categorySpecific[category] ?? [])];
}

function exclusivityFor(sponsor) {
  if (!sponsor) return [];
  if (['graphics', 'gear', 'parts', 'dealer'].includes(sponsor.category)) return [sponsor.category];
  return [];
}

export function responseToDraftOffer(response, { rider = {}, relationship = 0 } = {}) {
  if (!response || ['decline', 'soft-decline'].includes(response.type)) return null;
  const sponsor = SPONSOR_CATALOG.find((s) => s.id === response.sponsorId);
  if (!sponsor) return null;
  const leverage = sponsorLeverage({ response, rider, relationship });
  return {
    id: `offer-${response.seasonYear}-${response.sponsorId}-${hash(JSON.stringify(response))}`,
    sponsorId: response.sponsorId,
    sponsorName: response.sponsorName ?? sponsor.name,
    category: sponsor.category,
    tier: sponsor.tier,
    seasonYear: response.seasonYear,
    status: 'draft',
    leverage,
    guardianRequired: Number(rider.age ?? 18) < 18,
    guardianApproved: Number(rider.age ?? 18) >= 18,
    package: packageFromResponse(response, sponsor),
    obligations: obligationTemplate(sponsor.category, sponsor.tier),
    exclusivity: exclusivityFor(sponsor),
    negotiationRound: 0,
    sourceResponseType: response.type,
  };
}

export function conflictWithSignedContracts(state, offer) {
  const active = (state.contracts ?? []).filter((c) => ['signed', 'active', 'probation'].includes(c.status));
  const conflicts = [];
  for (const contract of active) {
    for (const category of offer.exclusivity ?? []) {
      if ((contract.exclusivity ?? []).includes(category) && contract.sponsorId !== offer.sponsorId) {
        conflicts.push({ type: 'exclusivity', category, contractId: contract.id, sponsorId: contract.sponsorId });
      }
    }
  }
  return conflicts;
}

export function counterOffer(state, offer, request = {}, { rider = {}, relationship = 0, careerSeed = 'career' } = {}) {
  if (!offer) return { state, offer: null, outcome: 'invalid-offer' };
  const leverage = sponsorLeverage({ response: { fitScore: offer.leverage }, rider, relationship });
  const requestedCash = Math.max(0, request.cashRetainer ?? offer.package.cashRetainer);
  const baseCash = Math.max(1, offer.package.cashRetainer);
  const cashIncrease = (requestedCash - baseCash) / baseCash;
  const askedDiscount = Math.max(0, request.discountPercent ?? offer.package.discountPercent);
  const aggressiveness = cashIncrease * 55 + Math.max(0, askedDiscount - offer.package.discountPercent) * 1.2;
  const roll = unit(`${careerSeed}:${offer.id}:${offer.negotiationRound}:${requestedCash}:${askedDiscount}`);
  const score = leverage - aggressiveness + (roll - 0.5) * 28;

  let outcome = 'rejected';
  let nextPackage = deepCopy(offer.package);
  if (score >= 58) {
    outcome = 'accepted';
    nextPackage = { ...nextPackage, ...request, cashRetainer: requestedCash, discountPercent: askedDiscount };
  } else if (score >= 35) {
    outcome = 'restructured';
    nextPackage.cashRetainer = round25((baseCash + requestedCash) / 2);
    nextPackage.discountPercent = Math.round((offer.package.discountPercent + askedDiscount) / 2);
    nextPackage.productCredit = round25(nextPackage.productCredit * 1.08);
  } else if (score >= 20) {
    outcome = 'reduced';
    nextPackage.cashRetainer = round25(baseCash * 0.85);
    nextPackage.productCredit = round25(nextPackage.productCredit * 1.05);
  }

  const negotiated = {
    ...deepCopy(offer),
    package: nextPackage,
    leverage,
    negotiationRound: (offer.negotiationRound ?? 0) + 1,
    status: outcome === 'rejected' ? 'rejected-counter' : 'countered',
    lastNegotiationOutcome: outcome,
  };
  const next = restoreSponsorship2State(state);
  next.offerHistory.push({
    offerId: offer.id, sponsorId: offer.sponsorId, round: negotiated.negotiationRound,
    request: deepCopy(request), outcome, package: deepCopy(nextPackage),
  });
  return { state: next, offer: negotiated, outcome };
}

export function approveYouthContract(offer, approved = true) {
  if (!offer) return null;
  return { ...deepCopy(offer), guardianApproved: !offer.guardianRequired || !!approved };
}

export function signContract(state, offer) {
  if (!offer) return { state, error: 'invalid-offer', contract: null };
  if (offer.guardianRequired && !offer.guardianApproved) return { state, error: 'guardian-approval-required', contract: null };
  if (['rejected-counter', 'rejected'].includes(offer.status)) return { state, error: 'offer-rejected', contract: null };
  const conflicts = conflictWithSignedContracts(state, offer);
  if (conflicts.length) return { state, error: 'exclusivity-conflict', conflicts, contract: null };

  const next = restoreSponsorship2State(state);
  const contract = {
    ...deepCopy(offer),
    id: `contract-${offer.seasonYear}-${offer.sponsorId}-${hash(offer.id)}`,
    status: 'signed',
    signedAt: { seasonYear: offer.seasonYear, phase: next.preseason.phase },
    satisfaction: { performance: 50, professionalism: 60, obligations: 50, visibility: 45, overall: 52 },
    warnings: [],
  };
  next.contracts.push(contract);
  next.offerHistory.push({ offerId: offer.id, sponsorId: offer.sponsorId, outcome: 'signed', package: deepCopy(offer.package) });
  return { state: next, error: null, contract };
}

export function contractFundingSummary(state, { tentativeSeasonCost = 0, familyCash = 0 } = {}) {
  const contracts = (state.contracts ?? []).filter((c) => ['signed', 'active', 'probation'].includes(c.status));
  const sponsorCash = contracts.reduce((sum, c) => sum + (c.package?.cashRetainer ?? 0) + (c.package?.entryFeeSupport ?? 0) + (c.package?.travelSupport ?? 0), 0);
  const productValue = contracts.reduce((sum, c) => sum + (c.package?.productCredit ?? 0), 0);
  const contingencyPotential = contracts.reduce((sum, c) => sum + (c.package?.contingency ?? 0), 0);
  const guaranteedFunds = Number(familyCash) + sponsorCash;
  return {
    tentativeSeasonCost: Number(tentativeSeasonCost), familyCash: Number(familyCash), sponsorCash,
    productValue, contingencyPotential, guaranteedFunds,
    fundingGap: Math.max(0, Number(tentativeSeasonCost) - guaranteedFunds),
    familyOutOfPocketIfLocked: Math.max(0, Number(tentativeSeasonCost) - sponsorCash),
  };
}

function addDays(iso, days) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + Number(days || 0));
  return d.toISOString().slice(0, 10);
}

export function scheduleContractObligations(state, contractId, { seasonStart = `${state.seasonYear}-01-01`, riderAge = 18 } = {}) {
  const contract = byId(state, contractId);
  if (!contract) return { state, obligations: [], error: 'contract-not-found' };
  const next = restoreSponsorship2State(state);
  const existing = new Set(next.obligations.filter((o) => o.contractId === contractId).map((o) => o.templateIndex));
  const created = [];
  (contract.obligations ?? []).forEach((template, index) => {
    if (existing.has(index)) return;
    const dated = ['appearance', 'content'].includes(template.type);
    const dayOffset = 21 + index * 35 + ((hash(`${contract.id}:${index}`) % 12));
    const obligation = {
      id: `obl-${contract.id}-${index}`,
      contractId: contract.id,
      sponsorId: contract.sponsorId,
      sponsorName: contract.sponsorName,
      templateIndex: index,
      ...deepCopy(template),
      date: dated ? addDays(seasonStart, dayOffset) : null,
      status: 'pending',
      guardianParticipationRequired: Number(riderAge) < 18 && dated,
      rescheduleCount: 0,
    };
    next.obligations.push(obligation);
    created.push(obligation);
  });
  return { state: next, obligations: created, error: null };
}

export function obligationConflicts(obligation, calendarEntries = []) {
  if (!obligation?.date) return [];
  return calendarEntries
    .filter((e) => {
      const start = e.startDate ?? e.date;
      const end = e.endDate ?? start;
      return start && start <= obligation.date && end >= obligation.date;
    })
    .map((e) => ({ obligationId: obligation.id, eventId: e.id ?? e.name, eventName: e.name ?? e.title, date: obligation.date, category: e.category ?? 'calendar' }));
}

export function rescheduleObligation(state, obligationId, newDate, { calendarEntries = [] } = {}) {
  const next = restoreSponsorship2State(state);
  const i = next.obligations.findIndex((o) => o.id === obligationId);
  if (i < 0) return { state, error: 'obligation-not-found', conflicts: [] };
  const obligation = next.obligations[i];
  if (!['appearance', 'content'].includes(obligation.type)) return { state, error: 'not-reschedulable', conflicts: [] };
  if ((obligation.rescheduleCount ?? 0) >= 1) return { state, error: 'reschedule-limit', conflicts: [] };
  const candidate = { ...obligation, date: newDate };
  const conflicts = obligationConflicts(candidate, calendarEntries);
  if (conflicts.length) return { state, error: 'calendar-conflict', conflicts };
  next.obligations[i] = { ...candidate, rescheduleCount: (obligation.rescheduleCount ?? 0) + 1 };
  return { state: next, error: null, conflicts: [] };
}

export function resolveObligation(state, obligationId, outcome = 'fulfilled', note = null) {
  const valid = ['fulfilled', 'missed', 'excused', 'violated'];
  if (!valid.includes(outcome)) return { state, error: 'invalid-outcome' };
  const next = restoreSponsorship2State(state);
  const i = next.obligations.findIndex((o) => o.id === obligationId);
  if (i < 0) return { state, error: 'obligation-not-found' };
  next.obligations[i] = { ...next.obligations[i], status: outcome, resolutionNote: note };
  return { state: next, error: null, obligation: next.obligations[i] };
}

export const BRAND_SLOTS = Object.freeze(['bike-shrouds', 'fork-guards', 'rear-fender', 'jersey', 'helmet', 'pit-board', 'garage-wall', 'transporter']);

export function setBrandPlacement(state, { contractId, slot, brandId, category, required = false } = {}) {
  if (!BRAND_SLOTS.includes(slot)) return { state, error: 'invalid-slot' };
  const next = restoreSponsorship2State(state);
  const contract = byId(next, contractId);
  if (!contract) return { state, error: 'contract-not-found' };
  if ((contract.exclusivity ?? []).includes(category) && brandId !== contract.sponsorId) {
    return { state, error: 'exclusivity-violation', violation: { contractId, slot, category, expectedBrand: contract.sponsorId, actualBrand: brandId } };
  }
  const placement = { id: `brand-${slot}`, contractId, sponsorId: contract.sponsorId, slot, brandId, category, required: !!required };
  const existing = next.brandPlacements.findIndex((p) => p.slot === slot);
  if (existing >= 0) next.brandPlacements[existing] = placement; else next.brandPlacements.push(placement);
  return { state: next, error: null, placement };
}

export function brandCompliance(state, installedProducts = []) {
  const violations = [];
  const missingPlacements = [];
  for (const contract of (state.contracts ?? []).filter((c) => ['signed', 'active', 'probation'].includes(c.status))) {
    for (const category of contract.exclusivity ?? []) {
      const conflicts = installedProducts.filter((p) => p.category === category && p.brandId && p.brandId !== contract.sponsorId);
      for (const p of conflicts) violations.push({ contractId: contract.id, sponsorId: contract.sponsorId, type: 'product-exclusivity', category, productId: p.id, brandId: p.brandId });
    }
    const required = (state.obligations ?? []).filter((o) => o.contractId === contract.id && o.type === 'graphics-placement' && o.required);
    for (const req of required) {
      const placed = (state.brandPlacements ?? []).some((p) => p.contractId === contract.id && p.slot === req.slot && p.brandId === contract.sponsorId);
      if (!placed) missingPlacements.push({ contractId: contract.id, sponsorId: contract.sponsorId, slot: req.slot });
    }
  }
  return { compliant: violations.length === 0 && missingPlacements.length === 0, violations, missingPlacements };
}

export function evaluateSponsorRelationship(state, contractId, metrics = {}) {
  const next = restoreSponsorship2State(state);
  const i = next.contracts.findIndex((c) => c.id === contractId);
  if (i < 0) return { state, error: 'contract-not-found' };
  const contract = next.contracts[i];
  const obligations = next.obligations.filter((o) => o.contractId === contractId);
  const required = obligations.filter((o) => o.required);
  const fulfilled = required.filter((o) => o.status === 'fulfilled').length;
  const missed = required.filter((o) => ['missed', 'violated'].includes(o.status)).length;
  const obligationScore = required.length ? clamp((fulfilled / required.length) * 100 - missed * 18) : 60;
  const performance = clamp(metrics.performance ?? metrics.results ?? 50);
  const professionalism = clamp(metrics.professionalism ?? 60);
  const visibility = clamp(metrics.visibility ?? 45);
  const conductPenalty = clamp(metrics.conductViolations ?? 0, 0, 5) * 16;
  const compliance = brandCompliance(next, metrics.installedProducts ?? []);
  const compliancePenalty = compliance.violations.length * 18 + compliance.missingPlacements.length * 10;
  const professionalAdjusted = clamp(professionalism - conductPenalty - compliancePenalty);
  const overall = Math.round(clamp(performance * 0.25 + professionalAdjusted * 0.30 + obligationScore * 0.30 + visibility * 0.15));

  let disposition = 'continue';
  let status = 'active';
  if (overall < 24 || missed >= 3 || metrics.severeConductBreach) { disposition = 'terminate'; status = 'terminated'; }
  else if (overall < 42 || missed >= 2) { disposition = 'probation'; status = 'probation'; }
  else if (overall < 58 || missed === 1) { disposition = 'warning'; status = 'active'; }
  else if (overall >= 82) disposition = 'upgrade';

  const warning = ['warning', 'probation'].includes(disposition)
    ? { seasonYear: next.seasonYear, reason: missed ? 'missed-obligations' : 'sponsor-satisfaction', disposition }
    : null;
  next.contracts[i] = {
    ...contract,
    status,
    satisfaction: { performance, professionalism: professionalAdjusted, obligations: Math.round(obligationScore), visibility, overall },
    warnings: warning ? [...(contract.warnings ?? []), warning] : (contract.warnings ?? []),
    lastDisposition: disposition,
  };
  next.relationshipHistory[contract.sponsorId] = [
    ...(next.relationshipHistory[contract.sponsorId] ?? []),
    { seasonYear: next.seasonYear, overall, disposition, missedObligations: missed },
  ];
  return { state: next, error: null, disposition, contract: next.contracts[i], compliance };
}

export function endSeasonSponsorDecision(state, contractId, { nextSeasonYear = state.seasonYear + 1 } = {}) {
  const next = restoreSponsorship2State(state);
  const contract = byId(next, contractId);
  if (!contract) return { state, error: 'contract-not-found' };
  const score = contract.satisfaction?.overall ?? 50;
  let decision = 'renew';
  let multiplier = 1;
  if (contract.status === 'terminated' || score < 35) { decision = 'lost'; multiplier = 0; }
  else if (score < 52) { decision = 'downgrade'; multiplier = 0.78; }
  else if (score >= 82) { decision = 'upgrade'; multiplier = 1.28; }
  else if (score >= 72) { decision = 'renew-plus-referral'; multiplier = 1.12; }

  const renewed = decision === 'lost' ? null : {
    ...deepCopy(contract),
    id: `contract-${nextSeasonYear}-${contract.sponsorId}-${hash(`${contract.id}:${nextSeasonYear}`)}`,
    seasonYear: nextSeasonYear,
    status: 'signed',
    package: {
      ...deepCopy(contract.package),
      cashRetainer: round25(contract.package.cashRetainer * multiplier),
      productCredit: round25(contract.package.productCredit * multiplier),
      entryFeeSupport: round25(contract.package.entryFeeSupport * multiplier),
      travelSupport: round25(contract.package.travelSupport * multiplier),
    },
    satisfaction: { performance: 50, professionalism: 60, obligations: 50, visibility: 45, overall: 52 },
    warnings: [],
    renewedFrom: contract.id,
    referral: decision === 'renew-plus-referral' || decision === 'upgrade',
  };
  return { state: next, error: null, decision, renewedContract: renewed };
}

export function preseasonBudget(state, args = {}) {
  const budget = contractFundingSummary(state, args);
  const next = restoreSponsorship2State(state);
  next.preseason.lastBudget = budget;
  return { state: next, budget };
}

export function buildSeasonLockSummary(state, { tentativeSeasonCost = 0, familyCash = 0, calendarEntries = [] } = {}) {
  const budget = contractFundingSummary(state, { tentativeSeasonCost, familyCash });
  const knownConflicts = [];
  for (const obligation of state.obligations ?? []) knownConflicts.push(...obligationConflicts(obligation, calendarEntries));
  const obligations = (state.obligations ?? []).filter((o) => o.required && o.status === 'pending');
  return {
    canLock: knownConflicts.length === 0,
    budget,
    requiredObligations: obligations,
    knownConflicts,
    contracts: (state.contracts ?? []).filter((c) => ['signed', 'active', 'probation'].includes(c.status)).map((c) => ({
      id: c.id, sponsorName: c.sponsorName, package: deepCopy(c.package), exclusivity: [...(c.exclusivity ?? [])], guardianApproved: c.guardianApproved,
    })),
    familyContribution: budget.familyOutOfPocketIfLocked,
  };
}

export function lockPreseasonSponsorship(state, args = {}) {
  const summary = buildSeasonLockSummary(state, args);
  if (!summary.canLock) return { state, error: 'sponsor-obligation-conflict', summary };
  const next = restoreSponsorship2State(state);
  next.preseason.phase = 'locked';
  next.preseason.lockSummary = summary;
  return { state: next, error: null, summary };
}

// Convenience façade used by UI/E2E to run pursuit through contract signing.
export function pursueAndDraft(state, { sponsorId, rider, careerSeed = 'career', proposalQuality = 60, relationship = 0 } = {}) {
  const next = restoreSponsorship2State(state);
  const pitched = pitchSponsor(next.pursuit, { sponsorId, rider, careerSeed, proposalQuality });
  next.pursuit = pitched.state;
  if (!pitched.response) return { state: next, response: null, offer: null, error: pitched.error };
  const offer = responseToDraftOffer(pitched.response, { rider, relationship });
  if (offer) next.offerHistory.push({ offerId: offer.id, sponsorId, outcome: 'generated', sourceResponseType: pitched.response.type });
  return { state: next, response: pitched.response, offer, error: null };
}

export { discoverSponsorCandidates, sponsorshipFundingSummary };
