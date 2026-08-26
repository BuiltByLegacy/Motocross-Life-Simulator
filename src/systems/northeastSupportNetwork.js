// Northeast dealer, shop, team, and sponsor relationship network.
// Region-specific content consumes shared relationship primitives; it is not a global default.

const clamp = (v, min = 0, max = 100) => Math.max(min, Math.min(max, Number(v) || 0));

export const NORTHEAST_SUPPORT_ENTITIES = [
  { id: 'ne-dealer-riverbend', type: 'dealer', name: 'Riverbend Powersports', traits: ['loyalty', 'parts-access'], baseDiscount: 0.03 },
  { id: 'ne-shop-precision', type: 'shop', name: 'Precision Moto Works', traits: ['service-quality', 'rush-repair'], baseDiscount: 0 },
  { id: 'ne-team-granite', type: 'team', name: 'Granite State Amateur Racing', traits: ['attendance', 'sportsmanship'], baseDiscount: 0 },
];

export const NORTHEAST_SPONSORS = [
  { id: 'ne-sponsor-dealer', name: 'Riverbend Rider Support', kind: 'dealer-support', minReputation: 35, minResults: 0, offer: { discountPct: 8, entryHelp: 0, cash: 0 } },
  { id: 'ne-sponsor-parts', name: 'Northeast Performance Parts', kind: 'product-support', minReputation: 50, minResults: 2, offer: { discountPct: 15, entryHelp: 50, cash: 0 } },
  { id: 'ne-sponsor-regional', name: 'Regional Race Support', kind: 'regional-support', minReputation: 68, minResults: 5, offer: { discountPct: 20, entryHelp: 125, cash: 250 } },
];

export function createSupportState({ guardianAuthority = true } = {}) {
  return {
    version: 1,
    guardianAuthority,
    relationships: Object.fromEntries(NORTHEAST_SUPPORT_ENTITIES.map((e) => [e.id, { score: 20, history: [] }])),
    sponsorships: {},
    notifications: [],
  };
}

export function restoreSupportState(raw = {}) {
  const state = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const base = createSupportState({ guardianAuthority: state?.guardianAuthority ?? true });
  return {
    ...base,
    ...state,
    relationships: { ...base.relationships, ...(state?.relationships ?? {}) },
    sponsorships: { ...(state?.sponsorships ?? {}) },
    notifications: [...(state?.notifications ?? [])],
  };
}

export function serializeSupportState(state) { return JSON.stringify(restoreSupportState(state)); }

export function applyRelationshipEvent(state, { entityId, type, amount = null, season = null, note = null } = {}) {
  const next = restoreSupportState(state);
  const entity = NORTHEAST_SUPPORT_ENTITIES.find((e) => e.id === entityId);
  if (!entity) return { ok: false, reason: 'unknown-entity', state: next };
  const record = next.relationships[entityId] ?? { score: 20, history: [] };
  const deltas = {
    purchase: 3,
    service: 4,
    referral: 6,
    podium: 5,
    win: 8,
    sportsmanship: 6,
    loyalty: 4,
    'missed-obligation': -10,
    'unpaid-obligation': -18,
    'poor-conduct': -14,
    'no-show': -8,
  };
  const delta = amount ?? deltas[type] ?? 0;
  const updated = {
    score: clamp(record.score + delta),
    history: [...record.history, { type, delta, season, note }],
  };
  next.relationships[entityId] = updated;
  return { ok: true, state: next, entity, relationship: updated };
}

export function supportBenefits(state, entityId) {
  const entity = NORTHEAST_SUPPORT_ENTITIES.find((e) => e.id === entityId);
  const score = restoreSupportState(state).relationships[entityId]?.score ?? 0;
  if (!entity) return null;
  return {
    discountPct: Math.round((entity.baseDiscount + (score >= 70 ? 0.12 : score >= 50 ? 0.07 : score >= 35 ? 0.03 : 0)) * 100),
    rushService: entity.type === 'shop' && score >= 55,
    partsPriority: entity.type === 'dealer' && score >= 50,
    teamInviteEligible: entity.type === 'team' && score >= 60,
    referralEligible: score >= 45,
  };
}

export function evaluateSponsorOffers(state, { localReputation = 0, notableResults = 0, sportsmanship = 50, age = 12 } = {}) {
  const next = restoreSupportState(state);
  return NORTHEAST_SPONSORS.filter((s) => localReputation >= s.minReputation && notableResults >= s.minResults && sportsmanship >= 35)
    .filter((s) => !next.sponsorships[s.id]?.active)
    .map((s) => ({ ...s, requiresGuardian: age < 16 }));
}

export function acceptSponsorOffer(state, sponsorId, { age = 12, guardianApproved = false, season = null } = {}) {
  const next = restoreSupportState(state);
  const sponsor = NORTHEAST_SPONSORS.find((s) => s.id === sponsorId);
  if (!sponsor) return { ok: false, reason: 'unknown-sponsor', state: next };
  if (age < 16 && next.guardianAuthority && !guardianApproved) return { ok: false, reason: 'guardian-approval-required', state: next };
  next.sponsorships[sponsorId] = {
    active: true,
    tier: sponsor.kind,
    offer: { ...sponsor.offer },
    startedSeason: season,
    renewals: 0,
    missedObligations: 0,
    history: [{ type: 'accepted', season }],
  };
  next.notifications.push({ type: 'sponsor-accepted', sponsorId, season });
  return { ok: true, state: next, sponsorship: next.sponsorships[sponsorId] };
}

export function resolveSponsorSeason(state, sponsorId, { attendanceRate = 1, sportsmanship = 50, reputation = 0, conflictingCommitment = false, season = null } = {}) {
  const next = restoreSupportState(state);
  const deal = next.sponsorships[sponsorId];
  if (!deal?.active) return { ok: false, reason: 'inactive-sponsorship', state: next };
  const bad = attendanceRate < 0.6 || sportsmanship < 30 || conflictingCommitment;
  if (bad) {
    deal.active = false;
    deal.history.push({ type: 'lost', season, reason: conflictingCommitment ? 'conflict' : attendanceRate < 0.6 ? 'attendance' : 'conduct' });
    next.notifications.push({ type: 'sponsor-lost', sponsorId, season });
    return { ok: true, outcome: 'lost', state: next };
  }
  if (reputation >= 70 && attendanceRate >= 0.85 && sportsmanship >= 45) {
    deal.renewals += 1;
    deal.history.push({ type: 'renewed', season });
    next.notifications.push({ type: 'sponsor-renewed', sponsorId, season });
    return { ok: true, outcome: 'renewed', state: next };
  }
  deal.history.push({ type: 'held', season });
  return { ok: true, outcome: 'held', state: next };
}
