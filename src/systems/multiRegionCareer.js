// Cross-Region Career Travel & Reputation Layer (#321)
// ----------------------------------------------------
// Keeps regional reputation, venue familiarity, relationships, travel history,
// and Loretta routing distinct when a career crosses regional boundaries.

import { venueById, travelQuote } from './geography.js';

function clone(value) { return JSON.parse(JSON.stringify(value)); }

export function createMultiRegionCareer({ homeRegionId = 'northeast', seasonYear } = {}) {
  return {
    version: 1,
    homeRegionId,
    seasonYear,
    reputation: {
      northeast: { local: 0, regional: 0 },
      southeast: { local: 0, regional: 0 },
      national: 0,
    },
    venueFamiliarity: {},
    relationships: { northeast: {}, southeast: {} },
    trips: [],
    loretta: { classes: {} },
    seasonHistory: [],
  };
}

export function unfamiliarityPenalty(state, venueId) {
  const familiarity = state.venueFamiliarity[venueId] ?? 0;
  if (familiarity >= 40) return 0;
  if (familiarity >= 20) return 2;
  if (familiarity >= 8) return 4;
  return 7;
}

export function previewCrossRegionTrip({ state, home, event, budget = Infinity, fatigue = 0 } = {}) {
  const venue = venueById(event?.venueId);
  if (!venue) return { ok: false, reason: 'unknown_venue' };
  const travel = travelQuote(home, venue);
  if (!travel.valid) return { ok: false, reason: travel.reason };
  const crossRegion = state.homeRegionId !== venue.regionId;
  const opportunityCost = crossRegion ? Math.round(travel.travelHours * 18 + travel.lodgingNights * 25) : 0;
  const totalCost = travel.cost + opportunityCost + Number(event.entryFee ?? 0);
  const projectedFatigue = Math.min(100, fatigue + travel.fatigue + (crossRegion ? 5 : 0));
  return {
    ok: totalCost <= budget,
    reason: totalCost <= budget ? null : 'insufficient_budget',
    event, venue, travel, crossRegion, opportunityCost, totalCost, projectedFatigue,
    unfamiliarityPenalty: unfamiliarityPenalty(state, venue.id),
    destinationRegionId: venue.regionId,
  };
}

export function commitCrossRegionEvent(state, preview) {
  if (!preview?.ok) return { ok: false, state, reason: preview?.reason ?? 'invalid_preview' };
  const next = clone(state);
  next.trips.push({
    seasonYear: next.seasonYear,
    eventId: preview.event.id,
    date: preview.event.date,
    venueId: preview.venue.id,
    destinationRegionId: preview.destinationRegionId,
    miles: preview.travel.miles,
    cost: preview.totalCost,
    fatigue: preview.travel.fatigue,
    crossRegion: preview.crossRegion,
  });
  return { ok: true, state: next };
}

export function recordCrossRegionResult(state, { event, finish = null, fieldSize = 20, relationshipIds = [] } = {}) {
  const next = clone(state);
  const venue = venueById(event?.venueId);
  if (!venue) return next;
  const regionId = venue.regionId;
  const podium = Number.isFinite(finish) && finish <= 3;
  const strong = Number.isFinite(finish) && finish <= Math.max(5, Math.round(fieldSize * 0.3));
  const bucket = next.reputation[regionId] ?? { local: 0, regional: 0 };
  bucket.local = Math.min(100, bucket.local + (podium ? 7 : strong ? 4 : 1));
  if (event.level === 'regional' || event.level === 'championship' || event.type === 'area-qualifier' || event.type === 'regional-championship') {
    bucket.regional = Math.min(100, bucket.regional + (podium ? 8 : strong ? 5 : 2));
  }
  next.reputation[regionId] = bucket;
  if (event.level === 'championship' && podium) next.reputation.national = Math.min(100, next.reputation.national + 3);
  next.venueFamiliarity[venue.id] = Math.min(100, (next.venueFamiliarity[venue.id] ?? 0) + (podium ? 10 : 5));

  next.relationships[regionId] ??= {};
  for (const id of relationshipIds) {
    const rel = next.relationships[regionId][id] ?? { trust: 20, meetings: 0 };
    rel.trust = Math.min(100, rel.trust + (strong ? 4 : 2));
    rel.meetings += 1;
    next.relationships[regionId][id] = rel;
  }
  return next;
}

function lorettaClass(state, classId) {
  state.loretta.classes[classId] ??= {
    qualifiedRegional: false,
    qualifiedRegionId: null,
    areaAttempts: [],
    regionalAttempts: [],
    nationalQualified: false,
  };
  return state.loretta.classes[classId];
}

export function canAttemptAreaQualifier(state, { classId, regionId } = {}) {
  const entry = state.loretta.classes[classId];
  if (!entry) return { ok: true };
  if (entry.qualifiedRegional) return { ok: false, reason: 'already-qualified-for-regional', qualifiedRegionId: entry.qualifiedRegionId };
  return { ok: true, regionId };
}

export function recordLorettaAreaResult(state, { classId, regionId, eventId, finish, advanceThrough } = {}) {
  const next = clone(state);
  const entry = lorettaClass(next, classId);
  if (entry.qualifiedRegional) return { state: next, qualified: true, reason: 'already-qualified-for-regional' };
  const qualified = Number.isFinite(finish) && Number.isFinite(advanceThrough) && finish <= advanceThrough;
  entry.areaAttempts.push({ seasonYear: next.seasonYear, regionId, eventId, finish, advanceThrough, qualified });
  if (qualified) {
    entry.qualifiedRegional = true;
    entry.qualifiedRegionId = regionId;
  }
  return { state: next, qualified };
}

export function recordLorettaRegionalResult(state, { classId, regionId, eventId, finish, advanceThrough } = {}) {
  const next = clone(state);
  const entry = lorettaClass(next, classId);
  if (!entry.qualifiedRegional || entry.qualifiedRegionId !== regionId) return { state: next, qualified: false, reason: 'wrong-or-unqualified-region' };
  const qualified = Number.isFinite(finish) && Number.isFinite(advanceThrough) && finish <= advanceThrough;
  entry.regionalAttempts.push({ seasonYear: next.seasonYear, regionId, eventId, finish, advanceThrough, qualified });
  if (qualified) entry.nationalQualified = true;
  return { state: next, qualified };
}

export function rolloverMultiRegionCareer(state, nextSeasonYear) {
  const next = clone(state);
  next.seasonHistory.push({ seasonYear: next.seasonYear, reputation: clone(next.reputation), tripCount: next.trips.filter((trip) => trip.seasonYear === next.seasonYear).length });
  next.seasonYear = nextSeasonYear;
  // Recognition carries, but local buzz softens between seasons.
  for (const regionId of ['northeast', 'southeast']) {
    next.reputation[regionId].local = Math.round(next.reputation[regionId].local * 0.9);
    next.reputation[regionId].regional = Math.round(next.reputation[regionId].regional * 0.96);
  }
  return next;
}

export function serializeMultiRegionCareer(state) { return JSON.stringify(state); }
export function restoreMultiRegionCareer(serialized) {
  const raw = typeof serialized === 'string' ? JSON.parse(serialized) : (serialized ?? {});
  const base = createMultiRegionCareer({ homeRegionId: raw.homeRegionId ?? 'northeast', seasonYear: raw.seasonYear });
  return {
    ...base, ...raw,
    reputation: {
      northeast: { ...base.reputation.northeast, ...(raw.reputation?.northeast ?? {}) },
      southeast: { ...base.reputation.southeast, ...(raw.reputation?.southeast ?? {}) },
      national: raw.reputation?.national ?? 0,
    },
    venueFamiliarity: { ...(raw.venueFamiliarity ?? {}) },
    relationships: { northeast: { ...(raw.relationships?.northeast ?? {}) }, southeast: { ...(raw.relationships?.southeast ?? {}) } },
    trips: [...(raw.trips ?? [])],
    loretta: { classes: { ...(raw.loretta?.classes ?? {}) } },
    seasonHistory: [...(raw.seasonHistory ?? [])],
  };
}
