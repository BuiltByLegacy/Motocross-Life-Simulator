// 2026 AMA Amateur National Motocross Championship qualifying rules.
// Source of truth for the game's Road to Loretta's domain model.
//
// Official MX Sports sources (retrieved 2026-08):
// - https://mxsports.com/supplemental-rules
// - https://mxsports.com/how-to-qualify
// - https://mxsports.com/2026/04/01/2026-regional-championship-registration-now-open
// - https://mxsports.com/2025/12/11/2026-ama-amateur-national-motocross-area-qualifier-and-regional-championship-dates
//
// Important modeling rule: riders may attempt as many Area Qualifiers in as
// many regions as they choose. Advancement to a Regional is region-specific.

export const LORETTA_RULE_YEAR = 2026;

export const LORETTA_REGIONS = [
  'Northeast',
  'Southeast',
  'Mid-East',
  'North Central',
  'South Central',
  'Northwest',
  'Mid-West',
  'Southwest',
];

export const REGION_ADVANCEMENT_2026 = {
  Northeast: { areaToRegional: 9, regionalToNational: 6, combinedRegional: false },
  Southeast: { areaToRegional: 9, regionalToNational: 6, combinedRegional: false },
  'Mid-East': { areaToRegional: 9, regionalToNational: 6, combinedRegional: false },
  'North Central': { areaToRegional: 9, regionalToNational: 6, combinedRegional: false },
  'South Central': { areaToRegional: 9, regionalToNational: 6, combinedRegional: false },
  Northwest: { areaToRegional: 10, regionalToNational: 4, combinedRegional: true },
  'Mid-West': { areaToRegional: 12, regionalToNational: 4, combinedRegional: true },
  Southwest: { areaToRegional: 12, regionalToNational: 4, combinedRegional: true },
};

export const NATIONAL_2026 = {
  location: "Loretta Lynn's Ranch, Hurricane Mills, Tennessee",
  startDate: '2026-08-03',
  endDate: '2026-08-08',
  rosterSizePerClass: 42,
  maxClasses: 2,
};

export const QUALIFIER_LIMITS_2026 = {
  maxAreaClassesPerDay: 4,
  maxRegionalClasses: 4,
  regionalRegistrationDeadlineRule: 'Monday before event at 12:00 PM ET',
};

export const STAGE_FORMAT_2026 = {
  area: { motos: 2 },
  regional: { motos: 3, combinedRegionalMotos: 2 },
  national: { motos: 3 },
};

export function areaAdvanceSlots(region) {
  return REGION_ADVANCEMENT_2026[region]?.areaToRegional ?? null;
}

export function regionalAdvanceSlots(region) {
  return REGION_ADVANCEMENT_2026[region]?.regionalToNational ?? null;
}

export function regionalMotoCount(region) {
  const cfg = REGION_ADVANCEMENT_2026[region];
  if (!cfg) return STAGE_FORMAT_2026.regional.motos;
  return cfg.combinedRegional
    ? STAGE_FORMAT_2026.regional.combinedRegionalMotos
    : STAGE_FORMAT_2026.regional.motos;
}

export function isKnownLorettaRegion(region) {
  return LORETTA_REGIONS.includes(region);
}

export function advancementSlots(stage, region) {
  if (stage === 'area') return areaAdvanceSlots(region);
  if (stage === 'regional') return regionalAdvanceSlots(region);
  return 0;
}

// 2026 supplemental rules include a minimum age of 14 to ride a 250cc machine
// at the Area Qualifier and 12 to ride a Supermini. This helper intentionally
// covers only rules the current game classes can express without pretending to
// encode the complete AMA class matrix.
export function basicAgeEligibility({ klass, age }) {
  if (age == null) return { ok: true, reasons: [] };
  const reasons = [];
  if (klass === '250B' && age < 14) reasons.push('Rider must be at least 14 to ride a 250cc machine at the Area Qualifier.');
  if (klass === 'Supermini' && age < 12) reasons.push('Rider must be at least 12 to ride Supermini at the Area Qualifier.');
  return { ok: reasons.length === 0, reasons };
}

// When a rider qualifies at more than one Regional, MX Sports advances the
// rider from the home region if they qualified there. Otherwise the best finish
// wins; ties go to the region in which the rider first qualified.
export function selectNationalSourceRegion(regionalQualifications = [], homeRegion = null) {
  const qualified = regionalQualifications
    .filter((q) => q?.qualified && q.region)
    .map((q, index) => ({ ...q, _index: index }));
  if (!qualified.length) return null;

  if (homeRegion) {
    const home = qualified.find((q) => q.region === homeRegion);
    if (home) return home.region;
  }

  qualified.sort((a, b) => {
    const af = Number.isFinite(a.finish) ? a.finish : Infinity;
    const bf = Number.isFinite(b.finish) ? b.finish : Infinity;
    return af - bf || a._index - b._index;
  });
  return qualified[0].region;
}
