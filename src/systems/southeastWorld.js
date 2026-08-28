// Southeast Core Regional World (#319)
// -------------------------------------
// Calendar 2.0-native regional events, deterministic weather/track conditions,
// and region-specific travel/economy previews.

import { SOUTHEAST_PROFILE } from './regionalProfiles.js';
import { SOUTHEAST_VENUES, venueById, travelQuote } from './geography.js';
import { regionalRidingAvailability } from './calendarLife.js';

function hash(input) {
  const text = String(input);
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function noise01(key) { return (hash(key) % 10000) / 10000; }

export function southeastWeather(date, seed = 'legacy-southeast') {
  const d = new Date(`${date}T00:00:00Z`);
  const month = d.getUTCMonth() + 1;
  const roll = noise01(`${seed}:${date}`);
  const summer = month >= 6 && month <= 9;
  const spring = month >= 3 && month <= 5;
  const tropical = month >= 8 && month <= 10;

  const heat = summer ? 0.62 + roll * 0.35 : (month <= 2 || month >= 11 ? 0.12 + roll * 0.22 : 0.32 + roll * 0.3);
  const humidity = summer ? 0.68 + roll * 0.28 : 0.38 + roll * 0.35;
  const rain = spring ? 0.34 + roll * 0.48 : summer ? 0.28 + roll * 0.58 : 0.15 + roll * 0.42;
  const storm = summer ? Math.max(0, (roll - 0.52) * 1.8) : tropical ? Math.max(0, (roll - 0.58) * 1.9) : Math.max(0, (roll - 0.82) * 1.3);
  const tropicalRisk = tropical ? Math.max(0, (roll - 0.88) * 5.5) : 0;
  const severity = Math.min(1, Math.max(heat * 0.34, rain * 0.55 + storm * 0.45, tropicalRisk));

  return {
    date, month,
    heat: Math.min(1, heat), humidity: Math.min(1, humidity), rain: Math.min(1, rain),
    storm: Math.min(1, storm), tropicalRisk: Math.min(1, tropicalRisk), severity,
    labels: [
      ...(heat >= 0.78 ? ['high-heat'] : []),
      ...(humidity >= 0.78 ? ['high-humidity'] : []),
      ...(rain >= 0.65 ? ['heavy-rain-risk'] : []),
      ...(storm >= 0.45 ? ['thunderstorm-risk'] : []),
      ...(tropicalRisk >= 0.45 ? ['tropical-weather-risk'] : []),
    ],
  };
}

export function southeastTrackCondition(venueOrId, weather) {
  const venue = typeof venueOrId === 'string' ? venueById(venueOrId) : venueOrId;
  if (!venue) return { condition: 'unknown', setupPressure: 0 };
  const wet = weather?.rain ?? 0;
  const heat = weather?.heat ?? 0;
  const surface = venue.surface;

  if (surface === 'sand') {
    if (wet >= 0.7) return { condition: 'deep-wet-sand', setupPressure: 0.72, traction: 0.66, fatigueMultiplier: 1.18 };
    if (heat >= 0.75) return { condition: 'deep-dry-sand', setupPressure: 0.68, traction: 0.58, fatigueMultiplier: 1.25 };
    return { condition: 'worked-sand', setupPressure: 0.5, traction: 0.67, fatigueMultiplier: 1.15 };
  }
  if (surface === 'clay' || surface === 'red-clay') {
    if (wet >= 0.62) return { condition: 'slick-rutted-clay', setupPressure: 0.82, traction: 0.44, fatigueMultiplier: 1.12 };
    if (heat >= 0.72 && wet < 0.35) return { condition: 'baked-hard-clay', setupPressure: 0.7, traction: 0.56, fatigueMultiplier: 1.08 };
    return { condition: 'tacky-clay', setupPressure: 0.48, traction: 0.8, fatigueMultiplier: 1.04 };
  }
  if (wet >= 0.72) return { condition: 'muddy-rutted', setupPressure: 0.74, traction: 0.52, fatigueMultiplier: 1.13 };
  return { condition: heat >= 0.78 ? 'hot-dry' : 'prime', setupPressure: 0.38, traction: 0.75, fatigueMultiplier: heat >= 0.78 ? 1.12 : 1 };
}

function iso(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function buildSoutheastCalendar(year = new Date().getUTCFullYear()) {
  // These are game events inspired by the researched regional cadence. Dates are
  // generated as real Calendar 2.0 dates and are not an official race schedule.
  return [
    { id: `se-${year}-winter-1`, title: 'Florida Winter Training Opener', date: iso(year, 1, 17), venueId: 'se-fl-orlando', regionId: 'southeast', level: 'local', type: 'race', seriesId: 'se-winter-spring-cup' },
    { id: `se-${year}-winter-2`, title: 'Georgia Early Season Regional', date: iso(year, 2, 14), venueId: 'se-ga-echeconnee', regionId: 'southeast', level: 'regional', type: 'race', seriesId: 'se-winter-spring-cup' },
    { id: `se-${year}-aq-1`, title: 'Southeast Area Qualifier Window I', date: iso(year, 3, 7), venueId: 'se-sc-sobmx', regionId: 'southeast', level: 'regional', type: 'area-qualifier', seriesId: 'road-to-lorettas' },
    { id: `se-${year}-aq-2`, title: 'Southeast Area Qualifier Window II', date: iso(year, 4, 11), venueId: 'se-al-monster', regionId: 'southeast', level: 'regional', type: 'area-qualifier', seriesId: 'road-to-lorettas' },
    { id: `se-${year}-am-regional`, title: 'Southeast Amateur Regional Window', date: iso(year, 5, 30), venueId: 'se-tn-muddy-creek', regionId: 'southeast', level: 'championship', type: 'regional-championship', seriesId: 'road-to-lorettas' },
    { id: `se-${year}-youth-regional`, title: 'Southeast Youth Regional Window', date: iso(year, 6, 13), venueId: 'se-fl-gatorback', regionId: 'southeast', level: 'championship', type: 'regional-championship', seriesId: 'road-to-lorettas' },
    { id: `se-${year}-summer`, title: 'Carolina Summer Challenge', date: iso(year, 7, 18), venueId: 'se-nc-ncmp', regionId: 'southeast', level: 'regional', type: 'race', seriesId: 'se-amateur-challenge' },
    { id: `se-${year}-fall`, title: 'Lazy River Fall Classic', date: iso(year, 10, 10), venueId: 'se-ga-lazy-river', regionId: 'southeast', level: 'regional', type: 'race', seriesId: 'se-amateur-challenge' },
    { id: `se-${year}-winter-close`, title: 'Gatorback Winter Finale', date: iso(year, 12, 5), venueId: 'se-fl-gatorback', regionId: 'southeast', level: 'regional', type: 'race', seriesId: 'se-amateur-challenge' },
  ];
}

export function southeastEventPreview({ home, event, budget = Infinity, seed = 'legacy-southeast' } = {}) {
  const venue = venueById(event?.venueId);
  if (!venue || venue.regionId !== 'southeast') return { valid: false, reason: 'not-southeast-event' };
  const weather = southeastWeather(event.date, seed);
  const availability = regionalRidingAvailability(SOUTHEAST_PROFILE, event.date, { weatherSeverity: weather.severity });
  const travel = travelQuote(home, venue);
  const track = southeastTrackCondition(venue, weather);
  const entryFee = event.level === 'championship' ? 100 : event.level === 'regional' ? 75 : 45;
  const totalCost = travel.valid ? travel.cost + entryFee : Infinity;
  return {
    valid: true, event, venue, weather, availability, travel, track, entryFee, totalCost,
    canAfford: totalCost <= budget,
    rideable: availability.outdoorAvailable,
    warnings: [
      ...(weather.heat >= 0.78 ? ['heat-load'] : []),
      ...(weather.storm >= 0.45 ? ['storm-risk'] : []),
      ...(weather.tropicalRisk >= 0.45 ? ['tropical-weather-risk'] : []),
      ...(travel.crossRegion ? ['cross-region-travel'] : []),
      ...(totalCost > budget ? ['over-budget'] : []),
    ],
  };
}

export function discoverSoutheastEvents({ home, year, budget = Infinity, fromDate = null, seed = 'legacy-southeast' } = {}) {
  const events = buildSoutheastCalendar(year);
  return events
    .filter((event) => !fromDate || event.date >= fromDate)
    .map((event) => southeastEventPreview({ home, event, budget, seed }))
    .filter((preview) => preview.valid)
    .sort((a, b) => a.event.date.localeCompare(b.event.date));
}

export function createSoutheastWorldState(year) {
  return { version: 1, regionId: 'southeast', year, weatherSeed: `southeast:${year}`, eventHistory: [], venueHistory: {}, disruptions: [] };
}

export function recordSoutheastWeekend(state, { event, result, preview } = {}) {
  const next = structuredClone(state);
  next.eventHistory.push({ eventId: event.id, date: event.date, venueId: event.venueId, result: result ?? null, weather: preview?.weather ?? null, track: preview?.track ?? null });
  next.venueHistory[event.venueId] = (next.venueHistory[event.venueId] ?? 0) + 1;
  if (preview?.availability?.status === 'closed') next.disruptions.push({ eventId: event.id, date: event.date, reason: 'weather-closure' });
  return next;
}

export function serializeSoutheastWorld(state) { return JSON.stringify(state); }
export function restoreSoutheastWorld(serialized) {
  const raw = typeof serialized === 'string' ? JSON.parse(serialized) : (serialized ?? {});
  return { version: 1, regionId: 'southeast', year: raw.year, weatherSeed: raw.weatherSeed ?? `southeast:${raw.year}`, eventHistory: [...(raw.eventHistory ?? [])], venueHistory: { ...(raw.venueHistory ?? {}) }, disruptions: [...(raw.disruptions ?? [])] };
}

export { SOUTHEAST_VENUES };
