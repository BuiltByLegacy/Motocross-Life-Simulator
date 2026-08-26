// Northeast Weekend Life — issues #299, #300, #301
// -------------------------------------------------
// Adds meaningful off-weekend choices, promoter/economy variation, and a
// deterministic Northeast seasonal-weather layer without turning the game
// into a full weather simulator.

import { NORTHEAST_VENUES, venueById, travelQuote } from './geography.js';

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

function stableHash(input = '') {
  let h = 2166136261;
  for (const ch of String(input)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededUnit(seed) {
  return (stableHash(seed) % 100000) / 100000;
}

export const NORTHEAST_MONTHLY_WEATHER = {
  1: { openProbability: 0.05, condition: 'winter-closed', cancellationRisk: 0.95, travelMultiplier: 1.25, setup: 'closed' },
  2: { openProbability: 0.08, condition: 'winter-closed', cancellationRisk: 0.90, travelMultiplier: 1.20, setup: 'closed' },
  3: { openProbability: 0.45, condition: 'cold-mud', cancellationRisk: 0.28, travelMultiplier: 1.12, setup: 'soft-mud' },
  4: { openProbability: 0.78, condition: 'spring-mud', cancellationRisk: 0.18, travelMultiplier: 1.08, setup: 'ruts-traction' },
  5: { openProbability: 0.92, condition: 'spring-loam', cancellationRisk: 0.10, travelMultiplier: 1.02, setup: 'balanced' },
  6: { openProbability: 0.96, condition: 'summer-fast', cancellationRisk: 0.07, travelMultiplier: 1.00, setup: 'dry-fast' },
  7: { openProbability: 0.95, condition: 'hot-dry', cancellationRisk: 0.08, travelMultiplier: 1.03, setup: 'heat-dust' },
  8: { openProbability: 0.94, condition: 'hot-dust', cancellationRisk: 0.09, travelMultiplier: 1.04, setup: 'heat-dust' },
  9: { openProbability: 0.95, condition: 'fall-prime', cancellationRisk: 0.07, travelMultiplier: 1.00, setup: 'balanced' },
  10: { openProbability: 0.83, condition: 'cool-fall', cancellationRisk: 0.13, travelMultiplier: 1.03, setup: 'cool-traction' },
  11: { openProbability: 0.25, condition: 'late-season-cold', cancellationRisk: 0.38, travelMultiplier: 1.10, setup: 'cold-soft' },
  12: { openProbability: 0.07, condition: 'winter-closed', cancellationRisk: 0.92, travelMultiplier: 1.22, setup: 'closed' },
};

export function northeastWeatherState({ venueId, date = null, month = null, careerSeed = 'career' } = {}) {
  const venue = venueById(venueId);
  if (!venue) return { valid: false, reason: 'Unknown Northeast venue' };
  const resolvedMonth = month ?? (date ? new Date(date).getUTCMonth() + 1 : 6);
  const profile = NORTHEAST_MONTHLY_WEATHER[resolvedMonth] ?? NORTHEAST_MONTHLY_WEATHER[6];
  const key = `${careerSeed}:${venueId}:${date ?? resolvedMonth}`;
  const openRoll = seededUnit(`${key}:open`);
  const cancelRoll = seededUnit(`${key}:cancel`);
  const isOpen = openRoll <= profile.openProbability;
  const cancelled = !isOpen || cancelRoll < profile.cancellationRisk;
  return {
    valid: true,
    venueId,
    month: resolvedMonth,
    condition: profile.condition,
    setupContext: profile.setup,
    openProbability: profile.openProbability,
    cancellationRisk: profile.cancellationRisk,
    travelMultiplier: profile.travelMultiplier,
    isOpen,
    cancelled,
  };
}

export const NORTHEAST_PROMOTERS = {
  'ne-ct-riverbend': { id: 'riverbend-mx-club', name: 'Riverbend MX Club', entryFee: 45, gateFee: 20, organization: 78, attendanceDraw: 62, payoutSupport: 20, reliability: 84 },
  'ne-ma-sandpit': { id: 'south-county-promotions', name: 'South County Promotions', entryFee: 60, gateFee: 25, organization: 88, attendanceDraw: 83, payoutSupport: 45, reliability: 90 },
  'ne-ny-valley': { id: 'mohawk-racing-association', name: 'Mohawk Racing Association', entryFee: 65, gateFee: 25, organization: 82, attendanceDraw: 80, payoutSupport: 40, reliability: 86 },
  'ne-nh-granite': { id: 'granite-state-mx', name: 'Granite State MX', entryFee: 40, gateFee: 18, organization: 72, attendanceDraw: 55, payoutSupport: 15, reliability: 79 },
  'ne-vt-green': { id: 'green-mountain-moto', name: 'Green Mountain Moto', entryFee: 38, gateFee: 18, organization: 74, attendanceDraw: 50, payoutSupport: 15, reliability: 80 },
  'ne-nj-pines': { id: 'pines-race-group', name: 'Pines Race Group', entryFee: 62, gateFee: 25, organization: 84, attendanceDraw: 78, payoutSupport: 35, reliability: 88 },
  'ne-pa-ridge': { id: 'keystone-mx-events', name: 'Keystone MX Events', entryFee: 58, gateFee: 22, organization: 81, attendanceDraw: 73, payoutSupport: 30, reliability: 85 },
  'ne-me-pine': { id: 'maine-pine-moto', name: 'Maine Pine Moto', entryFee: 35, gateFee: 15, organization: 68, attendanceDraw: 44, payoutSupport: 10, reliability: 76 },
};

export function eventEconomyProfile({ event, home, careerSeed = 'career', people = 2 } = {}) {
  const venue = venueById(event?.venueId);
  if (!venue) return { valid: false, reason: 'Unknown venue' };
  const promoter = NORTHEAST_PROMOTERS[venue.id] ?? { id: 'independent', name: 'Independent Promoter', entryFee: 45, gateFee: 20, organization: 65, attendanceDraw: 50, payoutSupport: 10, reliability: 70 };
  const weather = northeastWeatherState({ venueId: venue.id, date: event?.date, month: event?.month, careerSeed });
  const travel = travelQuote(home, venue, { people });
  const raceFees = promoter.entryFee + promoter.gateFee * people;
  const travelCost = travel.valid ? Math.round(travel.cost * weather.travelMultiplier) : 0;
  const weekendCost = raceFees + travelCost;
  const weatherPenalty = Math.round(weather.cancellationRisk * 25);
  const quality = clamp(Math.round(promoter.organization * 0.6 + promoter.attendanceDraw * 0.25 + promoter.reliability * 0.15 - weatherPenalty));
  const cancellationRisk = clamp(Math.round((1 - promoter.reliability / 100) * 35 + weather.cancellationRisk * 65), 0, 100);
  return {
    valid: true,
    promoter,
    venue,
    weather,
    travel,
    raceFees,
    travelCost,
    weekendCost,
    expectedQuality: quality,
    expectedFieldStrength: clamp(Math.round(promoter.attendanceDraw * 0.75 + quality * 0.25)),
    cancellationRisk,
    payoutSupport: promoter.payoutSupport,
  };
}

export function previewNortheastEventCommit({ event, home, budget = Infinity, age = 16, parentApproved = true, careerSeed = 'career' } = {}) {
  const profile = eventEconomyProfile({ event, home, careerSeed });
  const warnings = [];
  if (!profile.valid) warnings.push({ severity: 'hard', code: 'invalid-event', message: profile.reason });
  if (profile.valid && !profile.weather.isOpen) warnings.push({ severity: 'hard', code: 'venue-closed', message: 'Venue is closed for this date.' });
  if (profile.valid && profile.weekendCost > budget) warnings.push({ severity: 'hard', code: 'over-budget', message: `Weekend costs $${profile.weekendCost}, above available budget.` });
  if (age < 16 && !parentApproved) warnings.push({ severity: 'hard', code: 'parent-approval-required', message: 'Parent approval is required for this trip.' });
  if (profile.valid && profile.cancellationRisk >= 35) warnings.push({ severity: 'soft', code: 'weather-risk', message: 'This weekend has elevated cancellation risk.' });
  return {
    canCommit: !warnings.some((w) => w.severity === 'hard'),
    warnings,
    profile,
    projectedBudget: Number.isFinite(budget) && profile.valid ? Math.max(0, budget - profile.weekendCost) : budget,
  };
}

export function resolveEventDisruption({ event, home, careerSeed = 'career' } = {}) {
  const profile = eventEconomyProfile({ event, home, careerSeed });
  if (!profile.valid) return { status: 'invalid', event, recovery: [{ type: 'rest', reason: 'invalid-event' }] };
  const cancellationRoll = seededUnit(`${careerSeed}:${event.id ?? event.venueId}:${event.date ?? event.month}:event-disruption`);
  if (profile.weather.cancelled || cancellationRoll < profile.cancellationRisk / 100) {
    const nextDate = event.date ? new Date(new Date(event.date).getTime() + 7 * 86400000).toISOString().slice(0, 10) : null;
    return {
      status: 'cancelled',
      event: { ...event, status: 'cancelled' },
      reschedule: nextDate ? { ...event, id: `${event.id ?? event.venueId}-rescheduled`, date: nextDate, status: 'scheduled', rescheduledFrom: event.id ?? null } : null,
      recovery: [
        { type: 'find-alternate', message: 'Search nearby open practice or race options.' },
        { type: 'maintenance', message: 'Use the free weekend for bike work.' },
        { type: 'rest', message: 'Recover and advance safely to the next event.' },
      ],
    };
  }
  return { status: 'on', event: { ...event, status: 'scheduled' }, recovery: [] };
}

const OPPORTUNITY_TYPES = {
  'open-practice': { cost: 35, bikeHours: 1.2, skillGain: 2, familiarityGain: 5, fatigue: 8, recovery: 0 },
  'club-practice': { cost: 25, bikeHours: 0.9, skillGain: 1, familiarityGain: 4, fatigue: 6, recovery: 0 },
  training: { cost: 80, bikeHours: 1.0, skillGain: 4, familiarityGain: 2, fatigue: 12, recovery: 0 },
  maintenance: { cost: 25, bikeHours: 0, skillGain: 0, familiarityGain: 0, fatigue: -4, recovery: 4 },
  family: { cost: 20, bikeHours: 0, skillGain: 0, familiarityGain: 0, fatigue: -10, recovery: 10 },
  rest: { cost: 0, bikeHours: 0, skillGain: 0, familiarityGain: 0, fatigue: -18, recovery: 18 },
};

export function generateOffWeekendOpportunities({
  home,
  date,
  age = 10,
  parentApproved = true,
  schoolConflict = false,
  workConflict = false,
  budget = Infinity,
  careerSeed = 'career',
} = {}) {
  const month = new Date(`${date}T12:00:00Z`).getUTCMonth() + 1;
  const nearby = NORTHEAST_VENUES
    .map((venue) => ({ venue, travel: travelQuote(home, venue) }))
    .filter((x) => x.travel.valid)
    .sort((a, b) => a.travel.miles - b.travel.miles)
    .slice(0, 3);

  const opportunities = [];
  for (const { venue, travel } of nearby) {
    const weather = northeastWeatherState({ venueId: venue.id, date, month, careerSeed });
    if (!weather.isOpen || weather.cancelled) continue;
    for (const type of ['open-practice', 'club-practice']) {
      const base = OPPORTUNITY_TYPES[type];
      const totalCost = base.cost + Math.round(travel.cost * 0.35 * weather.travelMultiplier);
      opportunities.push({
        id: `${date}:${venue.id}:${type}`,
        type,
        venueId: venue.id,
        venueName: venue.name,
        date,
        weather,
        travel,
        totalCost,
        bikeHours: base.bikeHours,
        skillGain: base.skillGain,
        familiarityGain: base.familiarityGain,
        fatigueDelta: base.fatigue,
        available: totalCost <= budget && (age >= 16 || parentApproved) && !schoolConflict && !workConflict,
        blockers: [
          ...(totalCost > budget ? ['budget'] : []),
          ...(age < 16 && !parentApproved ? ['parent-approval'] : []),
          ...(schoolConflict ? ['school'] : []),
          ...(workConflict ? ['work'] : []),
        ],
      });
    }
  }

  for (const type of ['training', 'maintenance', 'family', 'rest']) {
    const base = OPPORTUNITY_TYPES[type];
    const totalCost = base.cost;
    const blockedByYouth = type === 'training' && age < 16 && !parentApproved;
    const blockedBySchedule = type === 'training' && (schoolConflict || workConflict);
    opportunities.push({
      id: `${date}:home:${type}`,
      type,
      venueId: null,
      date,
      totalCost,
      bikeHours: base.bikeHours,
      skillGain: base.skillGain,
      familiarityGain: 0,
      fatigueDelta: base.fatigue,
      recovery: base.recovery,
      available: totalCost <= budget && !blockedByYouth && !blockedBySchedule,
      blockers: [
        ...(totalCost > budget ? ['budget'] : []),
        ...(blockedByYouth ? ['parent-approval'] : []),
        ...(schoolConflict && type === 'training' ? ['school'] : []),
        ...(workConflict && type === 'training' ? ['work'] : []),
      ],
    });
  }

  return opportunities;
}

export function applyOffWeekendOpportunity(state = {}, opportunity) {
  if (!opportunity?.available) return { ok: false, state, reason: 'opportunity-unavailable' };
  const next = {
    ...state,
    budget: Math.max(0, (state.budget ?? 0) - (opportunity.totalCost ?? 0)),
    bikeHours: Math.max(0, (state.bikeHours ?? 0) + (opportunity.bikeHours ?? 0)),
    riderSkill: clamp((state.riderSkill ?? 0) + (opportunity.skillGain ?? 0)),
    fatigue: clamp((state.fatigue ?? 0) + (opportunity.fatigueDelta ?? 0)),
    familiarity: { ...(state.familiarity ?? {}) },
    calendarLog: [...(state.calendarLog ?? []), { date: opportunity.date, type: opportunity.type, venueId: opportunity.venueId ?? null }],
  };
  if (opportunity.venueId && opportunity.familiarityGain) {
    next.familiarity[opportunity.venueId] = clamp((next.familiarity[opportunity.venueId] ?? 0) + opportunity.familiarityGain);
  }
  return { ok: true, state: next };
}

export function serializeNortheastWeekendLife(state = {}) {
  return JSON.stringify({ version: 1, ...state });
}

export function restoreNortheastWeekendLife(serialized) {
  const raw = typeof serialized === 'string' ? JSON.parse(serialized) : (serialized ?? {});
  return { version: 1, ...raw };
}
