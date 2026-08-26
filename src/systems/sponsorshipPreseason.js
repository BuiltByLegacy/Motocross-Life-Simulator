// Sponsorship 2.0 — preseason pursuit and eligibility engine (#340)
// -----------------------------------------------------------------------------
// Pure deterministic domain logic. The live UI can consume this without making
// sponsor outcomes depend on render timing or random-number call order.

const DEFAULT_MAX_PITCHES = 4;

export const SPONSOR_CATALOG = Object.freeze([
  { id: 'local-shop', name: 'Local Moto Shop', category: 'shop', tier: 1, regions: ['northeast', 'southeast'], minProfile: 10, cashBase: 250, productBase: 250, values: ['local', 'professionalism'] },
  { id: 'graphics-co', name: 'Regional Graphics Co.', category: 'graphics', tier: 1, regions: ['northeast', 'southeast'], minProfile: 12, cashBase: 100, productBase: 450, values: ['visibility', 'professionalism'] },
  { id: 'dealer-support', name: 'Dealer Support Program', category: 'dealer', tier: 2, regions: ['northeast', 'southeast'], minProfile: 24, cashBase: 500, productBase: 700, values: ['results', 'relationship'] },
  { id: 'gear-brand', name: 'Regional Gear Brand', category: 'gear', tier: 2, regions: ['northeast', 'southeast'], minProfile: 28, cashBase: 350, productBase: 900, values: ['visibility', 'results'] },
  { id: 'parts-brand', name: 'Performance Parts Brand', category: 'parts', tier: 3, regions: ['northeast', 'southeast'], minProfile: 42, cashBase: 700, productBase: 1200, values: ['results', 'professionalism'] },
  { id: 'regional-business', name: 'Regional Family Business', category: 'outside-industry', tier: 2, regions: ['northeast', 'southeast'], minProfile: 22, cashBase: 800, productBase: 0, values: ['local', 'visibility'] },
  { id: 'industry-support', name: 'Industry Amateur Support', category: 'industry', tier: 4, regions: ['northeast', 'southeast'], minProfile: 58, cashBase: 1500, productBase: 1800, values: ['results', 'visibility', 'professionalism'] },
]);

export function createSponsorshipState({ seasonYear, maxPitches = DEFAULT_MAX_PITCHES } = {}) {
  return {
    seasonYear: seasonYear ?? new Date().getUTCFullYear(),
    maxPitches,
    attempts: [],
    responses: [],
    acceptedSupport: [],
    contactHistory: {},
  };
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function stableHash(input) { let h = 2166136261; for (let i = 0; i < input.length; i += 1) { h ^= input.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function deterministicUnit(seed) { return stableHash(String(seed)) / 0xffffffff; }

export function riderSponsorProfile(rider = {}) {
  const results = clamp(Number(rider.results ?? rider.resultScore ?? 0), 0, 100);
  const reputation = clamp(Number(rider.reputation ?? 0), 0, 100);
  const professionalism = clamp(Number(rider.professionalism ?? 50), 0, 100);
  const visibility = clamp(Number(rider.visibility ?? rider.media ?? 0), 0, 100);
  const relationship = clamp(Number(rider.relationship ?? rider.dealerRelationship ?? 0), 0, 100);
  const local = clamp(Number(rider.localReputation ?? reputation), 0, 100);
  return { age: Number(rider.age ?? 16), className: rider.className ?? rider.class ?? 'unknown', region: String(rider.region ?? 'northeast').toLowerCase(), results, reputation, professionalism, visibility, relationship, local, profileScore: Math.round(results * 0.30 + reputation * 0.22 + professionalism * 0.18 + visibility * 0.12 + relationship * 0.10 + local * 0.08) };
}

export function sponsorFitScore(sponsor, rider = {}) {
  const p = riderSponsorProfile(rider);
  if (sponsor.regions?.length && !sponsor.regions.includes(p.region)) return 0;
  const weighted = sponsor.values.map((key) => p[key] ?? p.reputation);
  const valueScore = weighted.length ? weighted.reduce((a, b) => a + b, 0) / weighted.length : p.profileScore;
  const thresholdPenalty = Math.max(0, sponsor.minProfile - p.profileScore) * 1.6;
  return Math.round(clamp(p.profileScore * 0.55 + valueScore * 0.45 - thresholdPenalty, 0, 100));
}

export function discoverSponsorCandidates(rider, state = createSponsorshipState()) {
  const p = riderSponsorProfile(rider);
  return SPONSOR_CATALOG.map((sponsor) => ({ ...sponsor, fitScore: sponsorFitScore(sponsor, p), previouslyContacted: !!state.contactHistory?.[sponsor.id], eligibility: sponsorFitScore(sponsor, p) >= Math.max(8, sponsor.minProfile - 16) ? 'eligible' : 'stretch' })).filter((candidate) => candidate.regions.includes(p.region)).sort((a, b) => b.fitScore - a.fitScore || a.tier - b.tier);
}

function responseType({ fitScore, profileScore, roll, sponsor }) {
  const strength = fitScore * 0.68 + profileScore * 0.32 + (roll - 0.5) * 34;
  if (strength < 24) return 'decline';
  if (strength < 34) return 'soft-decline';
  if (strength < 46) return sponsor.productBase > 0 ? 'product-support' : 'counter';
  if (strength < 61) return 'counter';
  if (strength < 78) return sponsor.productBase > sponsor.cashBase ? 'mixed-support' : 'partial-cash';
  return 'strong-offer';
}

function buildSupport(sponsor, type, fitScore) {
  const scale = clamp(0.55 + fitScore / 140, 0.55, 1.25);
  const round50 = (n) => Math.round(n / 50) * 50;
  switch (type) {
    case 'product-support': return { cash: 0, productValue: round50(sponsor.productBase * scale * 0.7), contingency: round50(100 * sponsor.tier), kind: type };
    case 'counter': return { cash: round50(sponsor.cashBase * scale * 0.45), productValue: round50(sponsor.productBase * scale * 0.55), contingency: round50(125 * sponsor.tier), kind: type };
    case 'partial-cash': return { cash: round50(sponsor.cashBase * scale * 0.7), productValue: round50(sponsor.productBase * scale * 0.35), contingency: round50(150 * sponsor.tier), kind: type };
    case 'mixed-support': return { cash: round50(sponsor.cashBase * scale * 0.65), productValue: round50(sponsor.productBase * scale * 0.8), contingency: round50(175 * sponsor.tier), kind: type };
    case 'strong-offer': return { cash: round50(sponsor.cashBase * scale), productValue: round50(sponsor.productBase * scale), contingency: round50(225 * sponsor.tier), kind: type };
    default: return { cash: 0, productValue: 0, contingency: 0, kind: type };
  }
}

export function canPitchSponsor(state, sponsorId) {
  const attempts = state?.attempts ?? [];
  if (attempts.length >= (state?.maxPitches ?? DEFAULT_MAX_PITCHES)) return { ok: false, reason: 'preseason-pitch-limit' };
  if (attempts.some((a) => a.sponsorId === sponsorId && a.seasonYear === state.seasonYear)) return { ok: false, reason: 'already-pitched-this-season' };
  return { ok: true, reason: null };
}

export function pitchSponsor(state, { sponsorId, rider, careerSeed = 'career', proposalQuality = 50 } = {}) {
  const sponsor = SPONSOR_CATALOG.find((s) => s.id === sponsorId);
  if (!sponsor) throw new Error(`Unknown sponsor: ${sponsorId}`);
  const gate = canPitchSponsor(state, sponsorId);
  if (!gate.ok) return { state, response: null, error: gate.reason };
  const p = riderSponsorProfile(rider);
  const fitScore = sponsorFitScore(sponsor, p);
  const guardianRequired = p.age < 18;
  const quality = clamp(Number(proposalQuality), 0, 100);
  const roll = deterministicUnit(`${careerSeed}:${state.seasonYear}:${sponsorId}:${state.attempts.length}`);
  const adjustedFit = clamp(fitScore + (quality - 50) * 0.16, 0, 100);
  const type = responseType({ fitScore: adjustedFit, profileScore: p.profileScore, roll, sponsor });
  const support = buildSupport(sponsor, type, adjustedFit);
  const response = { sponsorId, sponsorName: sponsor.name, category: sponsor.category, seasonYear: state.seasonYear, fitScore, proposalQuality: quality, type, support, guardianRequired, accepted: false };
  const attempt = { sponsorId, seasonYear: state.seasonYear, fitScore, proposalQuality: quality, type };
  const next = { ...state, attempts: [...state.attempts, attempt], responses: [...state.responses, response], contactHistory: { ...state.contactHistory, [sponsorId]: { lastSeason: state.seasonYear, lastOutcome: type, contacts: (state.contactHistory?.[sponsorId]?.contacts ?? 0) + 1 } } };
  return { state: next, response, error: null };
}

export function acceptSponsorResponse(state, sponsorId) {
  const response = [...(state.responses ?? [])].reverse().find((r) => r.sponsorId === sponsorId);
  if (!response) return { state, error: 'no-response' };
  if (['decline', 'soft-decline'].includes(response.type)) return { state, error: 'not-an-offer' };
  if (state.acceptedSupport.some((s) => s.sponsorId === sponsorId)) return { state, error: 'already-accepted' };
  const accepted = { ...response, accepted: true };
  return { error: null, state: { ...state, responses: state.responses.map((r) => r === response ? accepted : r), acceptedSupport: [...state.acceptedSupport, accepted] } };
}

export function sponsorshipFundingSummary(state, { tentativeSeasonCost = 0, familyCash = 0 } = {}) {
  const accepted = state?.acceptedSupport ?? [];
  const sponsorCash = accepted.reduce((sum, s) => sum + (s.support?.cash ?? 0), 0);
  const productValue = accepted.reduce((sum, s) => sum + (s.support?.productValue ?? 0), 0);
  const contingencyPotential = accepted.reduce((sum, s) => sum + (s.support?.contingency ?? 0), 0);
  const guaranteedFunds = Number(familyCash) + sponsorCash;
  return { tentativeSeasonCost: Number(tentativeSeasonCost), familyCash: Number(familyCash), sponsorCash, productValue, contingencyPotential, guaranteedFunds, fundingGap: Math.max(0, Number(tentativeSeasonCost) - guaranteedFunds), familyOutOfPocketIfLocked: Math.max(0, Number(tentativeSeasonCost) - sponsorCash) };
}

export function serializeSponsorshipState(state) { return JSON.parse(JSON.stringify(state)); }

export function restoreSponsorshipState(raw) {
  const base = createSponsorshipState({ seasonYear: raw?.seasonYear, maxPitches: raw?.maxPitches ?? DEFAULT_MAX_PITCHES });
  return {
    ...base,
    attempts: Array.isArray(raw?.attempts) ? raw.attempts : [],
    responses: Array.isArray(raw?.responses) ? raw.responses : [],
    acceptedSupport: Array.isArray(raw?.acceptedSupport) ? raw.acceptedSupport : [],
    contactHistory: raw?.contactHistory && typeof raw.contactHistory === 'object' ? raw.contactHistory : {},
  };
}
