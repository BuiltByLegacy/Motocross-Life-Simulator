// Geography & Home Region — Northeast reference vertical slice
// ------------------------------------------------------------
// One deeply modeled region first. The model is data-driven so future regions
// can be added without changing the travel/calendar APIs.

export const REGION_IDS = ['northeast'];

export const REGIONS = {
  northeast: {
    id: 'northeast',
    name: 'Northeast',
    states: ['CT', 'MA', 'RI', 'NY', 'NJ', 'PA', 'VT', 'NH', 'ME'],
    seasonMonths: [3, 4, 5, 6, 7, 8, 9, 10],
    identity: ['woods', 'sand', 'hardpack', 'cold-spring', 'fall-racing'],
  },
};

// Simulation reference venues. Coordinates are intentionally gameplay inputs,
// not navigation data; the system only needs consistent relative geography.
export const NORTHEAST_VENUES = [
  { id: 'ne-ct-riverbend', name: 'Riverbend MX', state: 'CT', lat: 41.86, lon: -72.45, tier: 'local', surface: 'hardpack', anchor: true },
  { id: 'ne-ma-sandpit', name: 'South County Sand Track', state: 'MA', lat: 42.08, lon: -72.08, tier: 'regional', surface: 'sand', anchor: true },
  { id: 'ne-ny-valley', name: 'Mohawk Valley MX', state: 'NY', lat: 42.95, lon: -75.32, tier: 'regional', surface: 'loam', anchor: true },
  { id: 'ne-nh-granite', name: 'Granite State MX', state: 'NH', lat: 43.22, lon: -71.48, tier: 'local', surface: 'rocky-hardpack' },
  { id: 'ne-vt-green', name: 'Green Mountain MX', state: 'VT', lat: 43.63, lon: -72.52, tier: 'local', surface: 'loam' },
  { id: 'ne-nj-pines', name: 'Pine Barrens Raceway', state: 'NJ', lat: 40.09, lon: -74.62, tier: 'regional', surface: 'sand' },
  { id: 'ne-pa-ridge', name: 'Keystone Ridge MX', state: 'PA', lat: 41.05, lon: -75.42, tier: 'regional', surface: 'mixed' },
  { id: 'ne-me-pine', name: 'Maine Pine MX', state: 'ME', lat: 44.08, lon: -69.80, tier: 'local', surface: 'loam' },
];

export const NORTHEAST_SERIES = [
  { id: 'ne-local-cup', name: 'Northeast Local Cup', level: 'local', venueIds: ['ne-ct-riverbend', 'ne-nh-granite', 'ne-vt-green'] },
  { id: 'ne-regional-challenge', name: 'Northeast Regional Challenge', level: 'regional', venueIds: ['ne-ma-sandpit', 'ne-ny-valley', 'ne-nj-pines', 'ne-pa-ridge'] },
];

export function venueById(id) { return NORTHEAST_VENUES.find((v) => v.id === id) ?? null; }
export function regionById(id) { return REGIONS[id] ?? null; }

export function createHomeGeography({ regionId = 'northeast', state = 'CT', lat = 41.86, lon = -72.45 } = {}) {
  if (!regionById(regionId)) throw new Error(`Unknown home region: ${regionId}`);
  return { version: 1, regionId, state, lat, lon, familiarity: {}, visits: {} };
}

export function migrateHomeGeography(data = {}) {
  if (data?.version === 1 && data.regionId) return { ...createHomeGeography(data), ...data, familiarity: { ...(data.familiarity ?? {}) }, visits: { ...(data.visits ?? {}) } };
  return createHomeGeography({ regionId: data.regionId ?? 'northeast', state: data.state ?? 'CT', lat: data.lat ?? 41.86, lon: data.lon ?? -72.45 });
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

export function travelQuote(home, venue, { mpg = 18, fuelPrice = 3.5, people = 2 } = {}) {
  if (!venue) return { valid: false, reason: 'Unknown venue' };
  const miles = distanceMiles(home, venue);
  if (miles == null) return { valid: false, reason: 'Missing geography' };
  const roundTripMiles = miles * 2;
  const travelHours = Math.round((miles / 55) * 10) / 10;
  let band = 'day-trip';
  if (miles > 450) band = 'long-haul';
  else if (miles > 220) band = 'regional-haul';
  else if (miles > 110) band = 'overnight';
  const lodgingNights = band === 'day-trip' ? 0 : band === 'overnight' ? 1 : band === 'regional-haul' ? 2 : 3;
  const fuel = Math.round((roundTripMiles / mpg) * fuelPrice);
  const lodging = lodgingNights * 140;
  const food = Math.round((lodgingNights + 1) * people * 28);
  const tolls = Math.round(roundTripMiles * 0.03);
  const cost = fuel + lodging + food + tolls;
  const fatigue = Math.min(100, Math.round(travelHours * 7 + lodgingNights * 6));
  return { valid: true, miles, roundTripMiles, travelHours, band, lodgingNights, cost, fatigue };
}

export function calendarLocation(home, venueId) {
  const venue = venueById(venueId);
  if (!venue) return null;
  const quote = travelQuote(home, venue);
  return { name: venue.name, venueId: venue.id, regionId: 'northeast', state: venue.state, distance: quote.travelHours, travel: quote };
}

export function rankEventsForHome(home, events = []) {
  return events.map((event) => {
    const venue = venueById(event.venueId);
    const travel = travelQuote(home, venue);
    const score = !travel.valid ? -999 : 100 - Math.min(90, travel.miles / 5) - (event.level === 'local' ? 0 : event.level === 'regional' ? 8 : 18);
    return { ...event, venue, travel, homeScore: Math.round(score) };
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
  const nearby = NORTHEAST_VENUES.map((venue) => ({ venue, travel: travelQuote(h, venue) }))
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
