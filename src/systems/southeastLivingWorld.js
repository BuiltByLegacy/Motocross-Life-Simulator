// Southeast Living World & Support Ecosystem (#320)
// -------------------------------------------------
// Persistent dealers, teams, sponsors, rivals, reputation and community history.

export const SOUTHEAST_SUPPORT_NETWORK = {
  dealers: [
    { id: 'se-dealer-pine', name: 'Pine State Powersports', state: 'NC', kind: 'dealer', minRep: 8 },
    { id: 'se-dealer-redclay', name: 'Red Clay Cycle Center', state: 'GA', kind: 'dealer', minRep: 12 },
    { id: 'se-dealer-gulf', name: 'Gulf Line Motorsports', state: 'FL', kind: 'dealer', minRep: 16 },
  ],
  shops: [
    { id: 'se-shop-sandline', name: 'Sandline Race Prep', state: 'FL', kind: 'shop', minRep: 6 },
    { id: 'se-shop-holeshot', name: 'Southern Holeshot Works', state: 'SC', kind: 'shop', minRep: 10 },
  ],
  teams: [
    { id: 'se-team-carolina', name: 'Carolina Amateur Development', state: 'SC', kind: 'regional-team', minRep: 35 },
    { id: 'se-team-sunbelt', name: 'Sunbelt Youth Racing', state: 'GA', kind: 'regional-team', minRep: 48 },
  ],
  media: [
    { id: 'se-media-pitline', name: 'Southeast Pitline', kind: 'regional-media', minRep: 18 },
  ],
};

export const SOUTHEAST_RIVAL_TEMPLATES = [
  { id: 'se-rival-mason', name: 'Mason Cole', homeState: 'GA', strengths: ['starts', 'clay'], temperament: 'confident' },
  { id: 'se-rival-jace', name: 'Jace Turner', homeState: 'FL', strengths: ['sand', 'fitness'], temperament: 'quiet' },
  { id: 'se-rival-avery', name: 'Avery Brooks', homeState: 'NC', strengths: ['consistency', 'rain'], temperament: 'friendly-competitive' },
  { id: 'se-rival-eli', name: 'Eli Mercer', homeState: 'TN', strengths: ['ruts', 'technical'], temperament: 'intense' },
];

function clone(value) { return JSON.parse(JSON.stringify(value)); }

export function createSoutheastLivingWorld({ seasonYear, seed = 'southeast-living' } = {}) {
  return {
    version: 1,
    regionId: 'southeast',
    seasonYear,
    seed,
    reputation: { local: 0, regional: 0, media: 0, professionalism: 50 },
    relationships: {},
    venueFamiliarity: {},
    rivals: Object.fromEntries(SOUTHEAST_RIVAL_TEMPLATES.map((rival) => [rival.id, { ...clone(rival), meetings: 0, riderWins: 0, rivalWins: 0, respect: 35, history: [] }])),
    supportHistory: [],
    mediaHistory: [],
    opportunities: [],
  };
}

export function recordSoutheastResult(state, { event, finish = null, fieldSize = 20, professionalismDelta = 0, rivalResults = {} } = {}) {
  const next = clone(state);
  if (!event) return next;
  const good = Number.isFinite(finish) && finish <= Math.max(3, Math.round(fieldSize * 0.25));
  const podium = Number.isFinite(finish) && finish <= 3;
  next.reputation.local = Math.min(100, next.reputation.local + (good ? 5 : 2));
  if (event.level === 'regional' || event.level === 'championship' || event.type === 'area-qualifier' || event.type === 'regional-championship') {
    next.reputation.regional = Math.min(100, next.reputation.regional + (podium ? 9 : good ? 5 : 2));
  }
  next.reputation.professionalism = Math.max(0, Math.min(100, next.reputation.professionalism + professionalismDelta));
  next.venueFamiliarity[event.venueId] = Math.min(100, (next.venueFamiliarity[event.venueId] ?? 0) + (podium ? 8 : 4));

  for (const [rivalId, rivalFinish] of Object.entries(rivalResults)) {
    const rival = next.rivals[rivalId];
    if (!rival || !Number.isFinite(finish) || !Number.isFinite(rivalFinish)) continue;
    rival.meetings += 1;
    if (finish < rivalFinish) rival.riderWins += 1;
    else if (rivalFinish < finish) rival.rivalWins += 1;
    rival.respect = Math.max(0, Math.min(100, rival.respect + (finish < rivalFinish ? 3 : 1)));
    rival.history.push({ seasonYear: next.seasonYear, eventId: event.id, venueId: event.venueId, riderFinish: finish, rivalFinish });
  }
  return next;
}

export function southeastSupportOpportunities(state, { sponsorContracts = [], resultsScore = 0 } = {}) {
  const rep = Math.max(state.reputation.local, state.reputation.regional);
  const professionalism = state.reputation.professionalism;
  const signedCategories = new Set(sponsorContracts.map((c) => c.category));
  const all = [...SOUTHEAST_SUPPORT_NETWORK.dealers, ...SOUTHEAST_SUPPORT_NETWORK.shops, ...SOUTHEAST_SUPPORT_NETWORK.teams, ...SOUTHEAST_SUPPORT_NETWORK.media];
  return all
    .filter((entry) => rep >= entry.minRep)
    .map((entry) => ({
      ...entry,
      regionId: 'southeast',
      score: Math.round(rep * 0.5 + professionalism * 0.3 + resultsScore * 0.2),
      status: entry.kind === 'regional-team' && professionalism < 45 ? 'watching-professionalism' : 'available',
      sponsorConflict: entry.kind === 'dealer' && signedCategories.has('dealer'),
    }));
}

export function applySupportInteraction(state, { opportunity, outcome = 'met', relationshipDelta = 4 } = {}) {
  const next = clone(state);
  if (!opportunity) return next;
  const previous = next.relationships[opportunity.id] ?? { trust: 30, meetings: 0, history: [] };
  next.relationships[opportunity.id] = {
    trust: Math.max(0, Math.min(100, previous.trust + relationshipDelta)),
    meetings: previous.meetings + 1,
    history: [...previous.history, { seasonYear: next.seasonYear, outcome }],
  };
  next.supportHistory.push({ seasonYear: next.seasonYear, opportunityId: opportunity.id, outcome });
  return next;
}

export function southeastCommunityReaction(state, { event, finish = null, story = null } = {}) {
  const podium = Number.isFinite(finish) && finish <= 3;
  const familiar = (state.venueFamiliarity[event?.venueId] ?? 0) >= 12;
  const regional = state.reputation.regional >= 25;
  const reaction = podium && familiar ? 'local-crowd-recognizes-rider' : podium ? 'regional-result-noticed' : regional ? 'known-regional-rider' : 'quiet-weekend';
  return { reaction, regionId: 'southeast', eventId: event?.id ?? null, story, visibilityGain: podium ? 6 : regional ? 2 : 0 };
}

export function recordSoutheastMedia(state, reaction) {
  const next = clone(state);
  next.mediaHistory.push({ seasonYear: next.seasonYear, ...reaction });
  next.reputation.media = Math.min(100, next.reputation.media + (reaction.visibilityGain ?? 0));
  return next;
}

export function rolloverSoutheastLivingWorld(state, nextSeasonYear) {
  const next = clone(state);
  next.seasonYear = nextSeasonYear;
  next.reputation.local = Math.max(0, Math.round(next.reputation.local * 0.92));
  next.reputation.regional = Math.max(0, Math.round(next.reputation.regional * 0.95));
  next.opportunities = [];
  return next;
}

export function serializeSoutheastLivingWorld(state) { return JSON.stringify(state); }
export function restoreSoutheastLivingWorld(serialized) {
  const raw = typeof serialized === 'string' ? JSON.parse(serialized) : serialized;
  const base = createSoutheastLivingWorld({ seasonYear: raw?.seasonYear, seed: raw?.seed });
  return { ...base, ...(raw ?? {}), reputation: { ...base.reputation, ...(raw?.reputation ?? {}) }, relationships: { ...(raw?.relationships ?? {}) }, venueFamiliarity: { ...(raw?.venueFamiliarity ?? {}) }, rivals: { ...base.rivals, ...(raw?.rivals ?? {}) }, supportHistory: [...(raw?.supportHistory ?? [])], mediaHistory: [...(raw?.mediaHistory ?? [])], opportunities: [...(raw?.opportunities ?? [])] };
}
