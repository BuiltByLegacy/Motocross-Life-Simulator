// Geography & Home Region — multi-region career world
// ----------------------------------------------------
// Regions share travel/calendar primitives but own their venues, seasons and
// travel assumptions. Coordinates are simulation references, not navigation.

export const REGION_IDS = ['northeast', 'southeast'];

export const REGIONS = {
  northeast: {
    id: 'northeast', name: 'Northeast',
    states: ['CT', 'MA', 'RI', 'NY', 'NJ', 'PA', 'VT', 'NH', 'ME'],
    seasonMonths: [3, 4, 5, 6, 7, 8, 9, 10],
    identity: ['woods', 'sand', 'hardpack', 'cold-spring', 'fall-racing'],
    travelBands: { local: 110, overnight: 220, regional: 450 },
    lodgingRate: 140, tollRate: 0.03,
  },
  southeast: {
    id: 'southeast', name: 'Southeast',
    states: ['NC', 'SC', 'GA', 'FL', 'AL', 'TN'],
    seasonMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    identity: ['sand', 'loam', 'clay', 'heat', 'storm-racing', 'long-season'],
    travelBands: { local: 140, overnight: 300, regional: 650 },
    lodgingRate: 135, tollRate: 0.018,
  },
};

export const NORTHEAST_VENUES = [
  { id: 'ne-ct-riverbend', name: 'Riverbend MX', state: 'CT', regionId: 'northeast', lat: 41.86, lon: -72.45, tier: 'local', surface: 'hardpack', anchor: true },
  { id: 'ne-ma-sandpit', name: 'South County Sand Track', state: 'MA', regionId: 'northeast', lat: 42.08, lon: -72.08, tier: 'regional', surface: 'sand', anchor: true },
  { id: 'ne-ny-valley', name: 'Mohawk Valley MX', state: 'NY', regionId: 'northeast', lat: 42.95, lon: -75.32, tier: 'regional', surface: 'loam', anchor: true },
  { id: 'ne-nh-granite', name: 'Granite State MX', state: 'NH', regionId: 'northeast', lat: 43.22, lon: -71.48, tier: 'local', surface: 'rocky-hardpack' },
  { id: 'ne-vt-green', name: 'Green Mountain MX', state: 'VT', regionId: 'northeast', lat: 43.63, lon: -72.52, tier: 'local', surface: 'loam' },
  { id: 'ne-nj-pines', name: 'Pine Barrens Raceway', state: 'NJ', regionId: 'northeast', lat: 40.09, lon: -74.62, tier: 'regional', surface: 'sand' },
  { id: 'ne-pa-ridge', name: 'Keystone Ridge MX', state: 'PA', regionId: 'northeast', lat: 41.05, lon: -75.42, tier: 'regional', surface: 'mixed' },
  { id: 'ne-me-pine', name: 'Maine Pine MX', state: 'ME', regionId: 'northeast', lat: 44.08, lon: -69.80, tier: 'local', surface: 'loam' },
];

export const SOUTHEAST_VENUES = [
  { id: 'se-ga-echeconnee', name: 'Echeconnee MX', state: 'GA', regionId: 'southeast', lat: 32.81, lon: -83.82, tier: 'regional', surface: 'red-clay', anchor: true },
  { id: 'se-sc-sobmx', name: 'South of the Border MX', state: 'SC', regionId: 'southeast', lat: 34.50, lon: -79.31, tier: 'regional', surface: 'loam', anchor: true },
  { id: 'se-sc-shoals', name: 'The Shoals MX', state: 'SC', regionId: 'southeast', lat: 34.38, lon: -82.35, tier: 'regional', surface: 'clay' },
  { id: 'se-nc-elizabeth-city', name: 'Elizabeth City MX', state: 'NC', regionId: 'southeast', lat: 36.30, lon: -76.22, tier: 'regional', surface: 'loam' },
  { id: 'se-fl-orlando', name: 'Orlando MX Park', state: 'FL', regionId: 'southeast', lat: 28.62, lon: -81.14, tier: 'regional', surface: 'sand', anchor: true },
  { id: 'se-nc-ncmp', name: 'North Carolina Motorsports Park', state: 'NC', regionId: 'southeast', lat: 36.35, lon: -78.40, tier: 'regional', surface: 'mixed-hardpack' },
  { id: 'se-al-monster', name: 'Monster Mountain MX Park', state: 'AL', regionId: 'southeast', lat: 32.54, lon: -85.89, tier: 'regional', surface: 'red-clay' },
  { id: 'se-ga-lazy-river', name: 'Lazy River MX', state: 'GA', regionId: 'southeast', lat: 34.77, lon: -84.97, tier: 'regional', surface: 'loam' },
  { id: 'se-tn-muddy-creek', name: 'Muddy Creek Raceway', state: 'TN', regionId: 'southeast', lat: 36.53, lon: -82.33, tier: 'championship', surface: 'loam', anchor: true },
  { id: 'se-fl-gatorback', name: 'Gatorback Cycle Park', state: 'FL', regionId: 'southeast', lat: 29.74, lon: -82.45, tier: 'championship', surface: 'sand', anchor: true },
];

export const ALL_VENUES = [...NORTHEAST_VENUES, ...SOUTHEAST_VENUES];

export const NORTHEAST_SERIES = [
  { id: 'ne-local-cup', name: 'Northeast Local Cup', regionId: 'northeast', level: 'local', venueIds: ['ne-ct-riverbend', 'ne-nh-granite', 'ne-vt-green'] },
  { id: 'ne-regional-challenge', name: 'Northeast Regional Challenge', regionId: 'northeast', level: 'regional', venueIds: ['ne-ma-sandpit', 'ne-ny-valley', 'ne-nj-pines', 'ne-pa-ridge'] },
];

export const SOUTHEAST_SERIES = [
  { id: 'se-winter-spring-cup', name: 'Southeast Winter-Spring Cup', regionId: 'southeast', level: 'regional', venueIds: ['se-fl-orlando', 'se-ga-echeconnee', 'se-sc-sobmx', 'se-al-monster'] },
  { id: 'se-amateur-challenge', name: 'Southeast Amateur Challenge', regionId: 'southeast', level: 'regional', venueIds: ['se-nc-ncmp', 'se-ga-lazy-river', 'se-tn-muddy-creek', 'se-fl-gatorback'] },
];

export function venueById(id) { return ALL_VENUES.find((v) => v.id === id) ?? null; }
export function regionById(id) { return REGIONS[id] ?? null; }
export function venuesForRegion(regionId) { return ALL_VENUES.filter((v) => v.regionId === regionId); }
export function seriesForRegion(regionId) { return [...NORTHEAST_SERIES, ...SOUTHEAST_SERIES].filter((s) => s.regionId === regionId); }

const DEFAULT_HOMES = {
  northeast: { state: 'CT', lat: 41.86, lon: -72.45 },
  southeast: { state: 'GA', lat: 33.75, lon: -84.39 },
};

export function createHomeGeography({ regionId = 'northeast', state = null, lat = null, lon = null } = {}) {
  if (!regionById(regionId)) throw new Error(`Unknown home region: ${regionId}`);
  const fallback = DEFAULT_HOMES[regionId];
  const hasLat = lat !== null && lat !== undefined && Number.isFinite(Number(lat));
  const hasLon = lon !== null && lon !== undefined && Number.isFinite(Number(lon));
  return {
    version: 2, regionId,
    state: state ?? fallback.state,
    lat: hasLat ? Number(lat) : fallback.lat,
    lon: hasLon ? Number(lon) : fallback.lon,
    familiarity: {}, visits: {},
  };
}

export function migrateHomeGeography(data = {}) {
  const regionId = regionById(data.regionId) ? data.regionId : 'northeast';
  const base = createHomeGeography({ ...data, regionId });
  return { ...base, ...data, version: 2, regionId, lat: base.lat, lon: base.lon, familiarity: { ...(data.familiarity ?? {}) }, visits: { ...(data.visits ?? {}) } };
}

function rad(x) { return x * Math.PI / 180; }
export function distanceMiles(a, b) {
  if (!a || !b || [a.lat, a.lon, b.lat, b.lon].some((x) => !Number.isFinite(Number(x)))) return null;
  const R = 3958.8;
  const dLat = rad(Number(b.lat) - Number(a.lat));
  const dLon = rad(Number(b.lon) - Number(a.lon));
  const q = Math.sin(dLat / 2) ** 2 + Math.cos(rad(Number(a.lat))) * Math.cos(rad(Number(b.lat))) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(q)));
}

export function travelQuote(homeInput, venue, { mpg = 18, fuelPrice = 3.5, people = 2 } = {}) {
  if (!venue) return { valid: false, reason: 'Unknown venue' };
  const home = migrateHomeGeography(homeInput);
  const miles = distanceMiles(home, venue);
  if (miles == null) return { valid: false, reason: 'Missing geography' };
  const homeRegion = regionById(home.regionId);
  const bands = homeRegion?.travelBands ?? REGIONS.northeast.travelBands;
  const crossRegion = home.regionId !== venue.regionId;
  const roundTripMiles = miles * 2;
  const travelHours = Math.round((miles / 55) * 10) / 10;
  let band = 'day-trip';
  if (miles > bands.regional) band = 'long-haul';
  else if (miles > bands.overnight) band = 'regional-haul';
  else if (miles > bands.local) band = 'overnight';
  if (crossRegion && band === 'day-trip') band = 'overnight';
  const lodgingNights = band === 'day-trip' ? 0 : band === 'overnight' ? 1 : band === 'regional-haul' ? 2 : 3;
  const destination = regionById(venue.regionId) ?? homeRegion;
  const fuel = Math.round((roundTripMiles / mpg) * fuelPrice);
  const lodging = lodgingNights * (destination?.lodgingRate ?? 140);
  const food = Math.round((lodgingNights + 1) * people * 28);
  const tolls = Math.round(roundTripMiles * (homeRegion?.tollRate ?? 0.03));
  const crossRegionBurden = crossRegion ? Math.round(25 + miles * 0.03) : 0;
  const cost = fuel + lodging + food + tolls + crossRegionBurden;
  const fatigue = Math.min(100, Math.round(travelHours * 7 + lodgingNights * 6 + (crossRegion ? 8 : 0)));
  return { valid: true, miles, roundTripMiles, travelHours, band, lodgingNights, cost, fatigue, crossRegion, originRegionId: home.regionId, destinationRegionId: venue.regionId };
}

export function calendarLocation(home, venueId) {
  const venue = venueById(venueId);
  if (!venue) return null;
  const quote = travelQuote(home, venue);
  return { name: venue.name, venueId: venue.id, regionId: venue.regionId, state: venue.state, distance: quote.travelHours, travel: quote };
}

export function rankEventsForHome(home, events = []) {
  return events.map((event) => {
    const venue = venueById(event.venueId);
    const travel = travelQuote(home, venue);
    const levelPenalty = event.level === 'local' ? 0 : event.level === 'regional' ? 8 : 18;
    const crossPenalty = travel.crossRegion ? 12 : 0;
    const score = !travel.valid ? -999 : 100 - Math.min(90, travel.miles / 5) - levelPenalty - crossPenalty;
    return { ...event, regionId: event.regionId ?? venue?.regionId, venue, travel, homeScore: Math.round(score) };
  }).sort((a, b) => b.homeScore - a.homeScore);
}

export function recordVenueVisit(home, venueId, { result = null } = {}) {
  const next = migrateHomeGeography(home);
  next.visits[venueId] = (next.visits[venueId] ?? 0) + 1;
  const bump = result?.podium ? 8 : result?.finish ? 4 : 2;
  next.familiarity[venueId] = Math.min(100, (next.familiarity[venueId] ?? 0) + bump);
  return next;
}

export function homeRegionSummary(home) {
  const h = migrateHomeGeography(home);
  const region = regionById(h.regionId);
  const nearby = venuesForRegion(h.regionId).map((venue) => ({ venue, travel: travelQuote(h, venue) }))
    .sort((a, b) => a.travel.miles - b.travel.miles)
    .slice(0, 3);
  return {
    regionId: h.regionId,
    regionName: region.name,
    state: h.state,
    nearby,
    visitedVenues: Object.keys(h.visits).length,
    mostFamiliar: Object.entries(h.familiarity).sort((a, b) => b[1] - a[1])[0] ?? null,
  };
}
