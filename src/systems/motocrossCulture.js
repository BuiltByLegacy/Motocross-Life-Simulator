// Motocross culture, pro-race attendance, pit atmosphere and memorabilia.
// Issues #101, #102, #155.

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function hashString(value) {
  let h = 2166136261;
  for (const ch of String(value)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function unit(seed) {
  return (hashString(seed) % 10000) / 10000;
}

export const PRO_EVENT_TEMPLATES = [
  { id: 'ne-pro-summer-classic', regionId: 'northeast', month: 7, day: 18, name: 'Northeast Pro Summer Classic', venue: 'Northeast National Raceway', tier: 'national', baseTicket: 45, crowd: 84, pitAccess: 58 },
  { id: 'ne-pro-fall-showdown', regionId: 'northeast', month: 9, day: 12, name: 'New England Pro Showdown', venue: 'Granite State Raceway', tier: 'regional-pro', baseTicket: 32, crowd: 66, pitAccess: 72 },
  { id: 'se-pro-spring-national', regionId: 'southeast', month: 3, day: 21, name: 'Southeast Spring National', venue: 'Red Clay National Raceway', tier: 'national', baseTicket: 48, crowd: 88, pitAccess: 54 },
  { id: 'se-pro-sand-classic', regionId: 'southeast', month: 11, day: 7, name: 'Florida Sand Pro Classic', venue: 'Sunstate MX Park', tier: 'regional-pro', baseTicket: 34, crowd: 72, pitAccess: 78 },
];

export const MEMORABILIA_TYPES = {
  event_program: { label: 'Event program', baseValue: 12, significance: 20 },
  pit_pass: { label: 'Pit pass', baseValue: 8, significance: 30 },
  signed_poster: { label: 'Signed poster', baseValue: 25, significance: 42 },
  signed_number_plate: { label: 'Signed number plate', baseValue: 85, significance: 70 },
  signed_goggles: { label: 'Signed goggles', baseValue: 110, significance: 76 },
  signed_jersey: { label: 'Signed jersey', baseValue: 160, significance: 84 },
  paddock_photo: { label: 'Paddock photo', baseValue: 5, significance: 38 },
};

export function createCultureState({ seasonYear = 2026 } = {}) {
  return {
    version: 1,
    seasonYear,
    attendance: [],
    atmosphereHistory: [],
    memories: [],
    memorabilia: {},
    inspiration: 0,
    collectionRevision: 0,
  };
}

export function restoreCultureState(data = {}) {
  const base = createCultureState({ seasonYear: Number(data.seasonYear) || 2026 });
  return {
    ...base,
    ...data,
    version: 1,
    attendance: Array.isArray(data.attendance) ? data.attendance.map((x) => ({ ...x })) : [],
    atmosphereHistory: Array.isArray(data.atmosphereHistory) ? data.atmosphereHistory.map((x) => ({ ...x })) : [],
    memories: Array.isArray(data.memories) ? data.memories.map((x) => ({ ...x })) : [],
    memorabilia: Object.fromEntries(Object.entries(data.memorabilia ?? {}).map(([id, item]) => [id, { ...item, ownershipHistory: [...(item.ownershipHistory ?? [])], memoryLinks: [...(item.memoryLinks ?? [])] }])),
    inspiration: clamp(Number(data.inspiration) || 0, 0, 100),
    collectionRevision: Number(data.collectionRevision) || 0,
  };
}

export function serializeCultureState(state) {
  return JSON.stringify(restoreCultureState(state));
}

export function discoverProAttendanceEvents({ year = 2026, regionId = 'northeast' } = {}) {
  return PRO_EVENT_TEMPLATES
    .filter((event) => event.regionId === regionId)
    .map((event) => ({
      ...event,
      year,
      date: `${year}-${String(event.month).padStart(2, '0')}-${String(event.day).padStart(2, '0')}`,
      eventId: `${event.id}-${year}`,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function previewProAttendance({ event, familyBudget = 0, riderAge = 16, travelMiles = 45, familySize = 2 } = {}) {
  if (!event?.eventId) return { eligible: false, reason: 'Unknown pro event' };
  const guardianRequired = Number(riderAge) < 18;
  const ticketCost = event.baseTicket * Math.max(1, Number(familySize) || 1);
  const fuelCost = Math.round(Math.max(0, Number(travelMiles) || 0) * 2 * 0.18);
  const foodCost = Math.round(Math.max(1, Number(familySize) || 1) * 24);
  const totalCost = ticketCost + fuelCost + foodCost;
  return {
    eligible: Number(familyBudget) >= totalCost,
    eventId: event.eventId,
    guardianRequired,
    ticketCost,
    fuelCost,
    foodCost,
    totalCost,
    budgetAfter: Number(familyBudget) - totalCost,
    reason: Number(familyBudget) >= totalCost ? null : 'Family budget cannot cover attendance',
  };
}

export function buildPitAtmosphere({ event, weather = 'clear', access = 'general', riderAge = 16 } = {}) {
  if (!event?.eventId) throw new Error('event is required');
  const seed = `${event.eventId}:${weather}:${access}:${riderAge}`;
  const crowd = clamp(Math.round(event.crowd + (unit(`${seed}:crowd`) - 0.5) * 12), 10, 100);
  const accessBonus = access === 'paddock' ? 26 : access === 'pit-pass' ? 18 : 0;
  const pitAccess = clamp(Math.round(event.pitAccess + accessBonus + (unit(`${seed}:pit`) - 0.5) * 10), 0, 100);
  const noise = clamp(Math.round(72 + crowd * 0.2 + unit(`${seed}:noise`) * 10), 0, 100);
  const sensoryIntensity = clamp(Math.round((crowd + noise + pitAccess) / 3), 0, 100);
  const familyComfort = clamp(Math.round(88 - crowd * 0.35 - (weather === 'hot' ? 10 : 0) - (weather === 'storm' ? 22 : 0) + (Number(riderAge) < 10 ? -7 : 0)), 0, 100);
  const encounterChance = clamp(Math.round(pitAccess * 0.65 + crowd * 0.12), 0, 95);
  const details = [
    noise > 88 ? 'Factory bikes crack through the paddock all afternoon.' : 'Race bikes echo across the pits between motos.',
    pitAccess > 75 ? 'The rider can get close enough to watch mechanics work and see factory details.' : 'The family watches the teams work from the public pit lanes.',
    crowd > 80 ? 'The fences are packed and autograph lines snake between transporters.' : 'The pits feel busy without being impossible to navigate.',
    weather === 'hot' ? 'Heat and dust hang over the pits.' : weather === 'storm' ? 'Teams scramble around changing weather and muddy gear.' : 'The air carries fuel, dirt, food and fresh-cut track soil.',
  ];
  return { eventId: event.eventId, crowd, pitAccess, noise, sensoryIntensity, familyComfort, encounterChance, weather, access, details };
}

export function attendProRace(stateInput, { event, preview, weather = 'clear', access = 'general', riderAge = 16, heroName = 'a pro rider' } = {}) {
  const state = restoreCultureState(stateInput);
  if (!preview?.eligible) return { state, attended: false, reason: preview?.reason ?? 'Attendance is not eligible' };
  if (state.attendance.some((x) => x.eventId === event.eventId)) return { state, attended: false, reason: 'This event was already attended' };
  const atmosphere = buildPitAtmosphere({ event, weather, access, riderAge });
  const metHero = unit(`${event.eventId}:${heroName}:encounter`) * 100 < atmosphere.encounterChance;
  const inspirationGain = clamp(Math.round(5 + atmosphere.sensoryIntensity / 12 + (metHero ? 8 : 0)), 4, 22);
  const memoryId = `culture-memory-${hashString(`${event.eventId}:${heroName}`)}`;
  const memory = {
    id: memoryId,
    type: 'pro-race-attendance',
    date: event.date,
    eventId: event.eventId,
    title: metHero ? `Met ${heroName} at ${event.name}` : `First-hand pro racing at ${event.name}`,
    people: metHero ? [heroName] : [],
    significance: clamp(Math.round(45 + atmosphere.sensoryIntensity * 0.4 + (metHero ? 18 : 0)), 0, 100),
    tags: ['motocross-culture', 'pro-race', event.regionId, metHero ? 'hero-encounter' : 'spectator-memory'],
  };
  const attendance = { eventId: event.eventId, date: event.date, name: event.name, totalCost: preview.totalCost, metHero, heroName: metHero ? heroName : null, memoryId, atmosphere };
  state.attendance.push(attendance);
  state.atmosphereHistory.push({ eventId: event.eventId, ...atmosphere });
  state.memories.push(memory);
  state.inspiration = clamp(state.inspiration + inspirationGain, 0, 100);
  return { state, attended: true, attendance, memory, atmosphere, inspirationGain };
}

function nextAssetId(state, eventId, type) {
  const base = `mxm-${hashString(`${eventId}:${type}`)}`;
  let index = 1;
  while (state.memorabilia[`${base}-${index}`]) index += 1;
  return `${base}-${index}`;
}

export function acquireMemorabilia(stateInput, { eventId, type, acquiredDate, ownerId = 'rider', signedBy = null, source = 'event', cost = null, memoryId = null } = {}) {
  const state = restoreCultureState(stateInput);
  const catalog = MEMORABILIA_TYPES[type];
  if (!catalog) return { state, acquired: false, reason: 'Unknown memorabilia type' };
  if (!eventId) return { state, acquired: false, reason: 'eventId is required' };
  const assetId = nextAssetId(state, eventId, type);
  const serial = `MEM-${hashString(`${assetId}:${acquiredDate ?? ''}`).toString(16).toUpperCase()}`;
  const item = {
    assetId,
    serial,
    type,
    label: catalog.label,
    acquiredDate: acquiredDate ?? null,
    sourceEventId: eventId,
    source,
    ownerId,
    signedBy,
    acquisitionCost: cost == null ? catalog.baseValue : Math.max(0, Number(cost) || 0),
    estimatedValue: Math.round(catalog.baseValue * (signedBy ? 2.2 : 1)),
    significance: clamp(catalog.significance + (signedBy ? 12 : 0), 0, 100),
    condition: 'excellent',
    displayLocation: null,
    memoryLinks: memoryId ? [memoryId] : [],
    ownershipHistory: [{ ownerId, date: acquiredDate ?? null, reason: source }],
  };
  state.memorabilia[assetId] = item;
  state.collectionRevision += 1;
  return { state, acquired: true, item };
}

export function displayMemorabilia(stateInput, assetId, location = 'garage-wall') {
  const state = restoreCultureState(stateInput);
  if (!state.memorabilia[assetId]) return { state, displayed: false, reason: 'Unknown asset' };
  state.memorabilia[assetId].displayLocation = location;
  state.collectionRevision += 1;
  return { state, displayed: true, item: state.memorabilia[assetId] };
}

export function transferMemorabilia(stateInput, assetId, { toOwnerId, date = null, reason = 'gift' } = {}) {
  const state = restoreCultureState(stateInput);
  const item = state.memorabilia[assetId];
  if (!item || !toOwnerId) return { state, transferred: false, reason: 'Asset and new owner are required' };
  item.ownerId = toOwnerId;
  item.displayLocation = null;
  item.ownershipHistory.push({ ownerId: toOwnerId, date, reason });
  state.collectionRevision += 1;
  return { state, transferred: true, item };
}

export function collectionSummary(stateInput) {
  const state = restoreCultureState(stateInput);
  const items = Object.values(state.memorabilia);
  const displayed = items.filter((item) => item.displayLocation).length;
  const signed = items.filter((item) => item.signedBy).length;
  const totalValue = items.reduce((sum, item) => sum + (Number(item.estimatedValue) || 0), 0);
  const mostMeaningful = [...items].sort((a, b) => b.significance - a.significance)[0] ?? null;
  return { count: items.length, displayed, signed, totalValue, mostMeaningful };
}
