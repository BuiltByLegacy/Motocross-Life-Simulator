// Regional Identity Framework
// ---------------------------
// Shared engine primitives belong here; real regions supply researched profiles.
// A region is never a reskinned copy of another region.

export const REQUIRED_PROFILE_FIELDS = [
  'id', 'name', 'geography', 'climate', 'ridingSeason', 'surfaces',
  'eventCulture', 'travel', 'economy', 'practiceCulture', 'supportEcosystem',
  'competitionCulture', 'weatherDisruptions', 'lorettaRouting', 'research',
];

export function validateRegionalProfile(profile) {
  const errors = [];
  if (!profile || typeof profile !== 'object') return { ok: false, errors: ['profile-required'] };
  for (const field of REQUIRED_PROFILE_FIELDS) {
    const value = profile[field];
    if (value == null || (Array.isArray(value) && value.length === 0)) errors.push(`missing:${field}`);
  }
  if (!profile.research?.sources?.length) errors.push('missing:research.sources');
  if (!profile.research?.reviewedAt) errors.push('missing:research.reviewedAt');
  if (!profile.ridingSeason?.openMonths?.length) errors.push('missing:ridingSeason.openMonths');
  if (!profile.eventCulture?.cadence) errors.push('missing:eventCulture.cadence');
  if (!profile.travel?.bands) errors.push('missing:travel.bands');
  if (!profile.economy?.entryFeeRange) errors.push('missing:economy.entryFeeRange');
  if (!profile.lorettaRouting?.regionName) errors.push('missing:lorettaRouting.regionName');
  return { ok: errors.length === 0, errors };
}

export function assertRegionalProfile(profile) {
  const result = validateRegionalProfile(profile);
  if (!result.ok) throw new Error(`Invalid regional profile ${profile?.id ?? '<unknown>'}: ${result.errors.join(', ')}`);
  return profile;
}

export const NORTHEAST_PROFILE = assertRegionalProfile({
  id: 'northeast',
  name: 'Northeast',
  geography: {
    states: ['CT', 'MA', 'RI', 'NY', 'NJ', 'PA', 'VT', 'NH', 'ME'],
    density: 'compact-but-interstate',
    notes: ['many day-trip/local opportunities', 'meaningful interstate regional travel'],
  },
  climate: {
    type: 'four-season',
    winter: 'closed-or-indoor-heavy',
    spring: 'mud-and-variable',
    summer: 'warm-humid-dusty',
    fall: 'prime-cool-weather',
  },
  ridingSeason: {
    openMonths: [3, 4, 5, 6, 7, 8, 9, 10],
    winterAlternatives: ['maintenance', 'fitness', 'limited-indoor-riding'],
  },
  surfaces: ['hardpack', 'sand', 'loam', 'rocky-hardpack', 'mixed'],
  eventCulture: {
    cadence: 'weekend-club-and-regional',
    density: 'moderate-to-high-in-season',
    prestige: ['local-club', 'regional-series', 'select-high-visibility-events'],
  },
  travel: {
    typicalPattern: 'day-trip-to-overnight',
    bands: { local: 110, overnight: 220, regional: 450, longHaul: 451 },
    tollSensitivity: 'moderate',
  },
  economy: {
    entryFeeRange: [35, 90],
    gateFeeRange: [15, 40],
    lodgingPressure: 'moderate',
    fuelPressure: 'moderate',
  },
  practiceCulture: {
    style: 'scheduled-open-practice-and-club-days',
    seasonality: 'strong',
  },
  supportEcosystem: {
    style: 'dealer-shop-local-team-network',
    relationshipWeight: 'high',
    factoryAccess: 'limited-and-earned',
  },
  competitionCulture: {
    fieldShape: 'repeat-local-rivals-plus-regional-travelers',
    identity: ['technical', 'weather-adaptive', 'tight-community'],
  },
  weatherDisruptions: ['snow', 'freeze', 'spring-saturation', 'storm-cancellation', 'summer-heat'],
  lorettaRouting: {
    regionName: 'Northeast',
    areaToRegional: 'same-region-advancement',
    regionalToNational: 'official-current-rules-data',
  },
  research: {
    status: 'reference-profile',
    reviewedAt: '2026-08-26',
    sources: ['repo Northeast gameplay research and current MX Sports Loretta rules'],
  },
});

export function createRegionalRuntime(profile) {
  assertRegionalProfile(profile);
  return {
    profile,
    isOpenMonth(month) { return profile.ridingSeason.openMonths.includes(Number(month)); },
    eventCadence() { return profile.eventCulture.cadence; },
    travelBandForMiles(miles) {
      const m = Number(miles);
      const b = profile.travel.bands;
      if (m <= b.local) return 'local';
      if (m <= b.overnight) return 'overnight';
      if (m <= b.regional) return 'regional';
      return 'long-haul';
    },
    estimateEntryFee(seed = 0) {
      const [min, max] = profile.economy.entryFeeRange;
      const span = Math.max(0, max - min);
      return Math.round(min + (Math.abs(Number(seed)) % (span + 1)));
    },
    supportsSurface(surface) { return profile.surfaces.includes(surface); },
  };
}

// Synthetic profiles exist only to prove extension points. They are not game regions.
export const SYNTHETIC_WARM_YEAR_ROUND_PROFILE = assertRegionalProfile({
  id: 'synthetic-warm', name: 'Synthetic Warm Region',
  geography: { states: ['XX'], density: 'spread-out' },
  climate: { type: 'warm-year-round' },
  ridingSeason: { openMonths: [1,2,3,4,5,6,7,8,9,10,11,12] },
  surfaces: ['sand'],
  eventCulture: { cadence: 'frequent-year-round', density: 'high' },
  travel: { typicalPattern: 'long-drive', bands: { local: 60, overnight: 150, regional: 300, longHaul: 301 } },
  economy: { entryFeeRange: [55, 120], gateFeeRange: [20, 50] },
  practiceCulture: { style: 'year-round' },
  supportEcosystem: { style: 'training-facility-heavy' },
  competitionCulture: { fieldShape: 'large-transient-fields' },
  weatherDisruptions: ['heat', 'storm'],
  lorettaRouting: { regionName: 'Synthetic' },
  research: { reviewedAt: '2026-08-26', sources: ['synthetic-test-fixture'] },
});
