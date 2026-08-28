// Permanent motocross history, career records and Hall of Fame.
// Issues #138 and #158.

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function hashString(value) {
  let h = 2166136261;
  for (const ch of String(value)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function copy(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function isoYear(date) {
  const match = String(date ?? '').match(/^(\d{4})/);
  return match ? Number(match[1]) : null;
}

function eventId(event) {
  if (event.id) return String(event.id);
  return `history-${hashString(`${event.date ?? ''}:${event.type ?? 'event'}:${event.subjectId ?? ''}:${event.title ?? ''}`)}`;
}

export function createHistoryState({ currentYear = 2026 } = {}) {
  return {
    version: 1,
    currentYear,
    events: [],
    recordBook: {},
    recordHistory: [],
    hallOfFame: {},
    careerProfiles: {},
    seasons: {},
    artifacts: {},
    revision: 0,
  };
}

export function restoreHistoryState(data = {}) {
  const base = createHistoryState({ currentYear: Number(data.currentYear) || 2026 });
  return {
    ...base,
    ...copy(data),
    version: 1,
    currentYear: Number(data.currentYear) || 2026,
    events: Array.isArray(data.events) ? data.events.map(copy) : [],
    recordBook: Object.fromEntries(Object.entries(data.recordBook ?? {}).map(([key, value]) => [key, copy(value)])),
    recordHistory: Array.isArray(data.recordHistory) ? data.recordHistory.map(copy) : [],
    hallOfFame: Object.fromEntries(Object.entries(data.hallOfFame ?? {}).map(([key, value]) => [key, copy(value)])),
    careerProfiles: Object.fromEntries(Object.entries(data.careerProfiles ?? {}).map(([key, value]) => [key, copy(value)])),
    seasons: Object.fromEntries(Object.entries(data.seasons ?? {}).map(([key, value]) => [key, copy(value)])),
    artifacts: Object.fromEntries(Object.entries(data.artifacts ?? {}).map(([key, value]) => [key, copy(value)])),
    revision: Number(data.revision) || 0,
  };
}

export function serializeHistoryState(state) {
  return JSON.stringify(restoreHistoryState(state));
}

export function recordHistoryEvent(stateInput, event = {}) {
  const state = restoreHistoryState(stateInput);
  const id = eventId(event);
  if (state.events.some((entry) => entry.id === id)) {
    return { state, recorded: false, event: state.events.find((entry) => entry.id === id), reason: 'History event already exists' };
  }
  const entry = {
    id,
    date: event.date ?? null,
    year: Number(event.year) || isoYear(event.date) || state.currentYear,
    type: event.type ?? 'world-event',
    scope: event.scope ?? 'sport',
    subjectId: event.subjectId ?? null,
    subjectName: event.subjectName ?? null,
    regionId: event.regionId ?? null,
    venueId: event.venueId ?? null,
    teamId: event.teamId ?? null,
    manufacturerId: event.manufacturerId ?? null,
    title: event.title ?? 'Motocross history event',
    summary: event.summary ?? null,
    significance: clamp(Number(event.significance) || 25, 0, 100),
    tags: [...new Set(event.tags ?? [])],
    memoryLinks: [...new Set(event.memoryLinks ?? [])],
    assetLinks: [...new Set(event.assetLinks ?? [])],
    people: [...new Set(event.people ?? [])],
    data: copy(event.data ?? {}),
  };
  state.events.push(entry);
  state.events.sort((a, b) => String(a.date ?? `${a.year}-12-31`).localeCompare(String(b.date ?? `${b.year}-12-31`)) || a.id.localeCompare(b.id));
  state.currentYear = Math.max(state.currentYear, entry.year || state.currentYear);
  state.revision += 1;
  return { state, recorded: true, event: entry };
}

export function registerSeason(stateInput, season = {}) {
  const state = restoreHistoryState(stateInput);
  const year = Number(season.year);
  if (!year) return { state, registered: false, reason: 'Season year is required' };
  const id = String(season.id ?? `${year}:${season.seriesId ?? 'world'}`);
  const snapshot = {
    id,
    year,
    seriesId: season.seriesId ?? 'world',
    championId: season.championId ?? null,
    championName: season.championName ?? null,
    runnerUpId: season.runnerUpId ?? null,
    regionId: season.regionId ?? null,
    notableRivalries: copy(season.notableRivalries ?? []),
    notableEvents: copy(season.notableEvents ?? []),
    teams: copy(season.teams ?? []),
    manufacturers: copy(season.manufacturers ?? []),
    tracks: copy(season.tracks ?? []),
    ruleChanges: copy(season.ruleChanges ?? []),
  };
  state.seasons[id] = snapshot;
  state.currentYear = Math.max(state.currentYear, year);
  state.revision += 1;
  return { state, registered: true, season: snapshot };
}

export function buildCareerProfile(input = {}) {
  const results = Array.isArray(input.results) ? input.results : [];
  const winsFromResults = results.filter((r) => Number(r.finish ?? r.position) === 1).length;
  const podiumsFromResults = results.filter((r) => Number(r.finish ?? r.position) > 0 && Number(r.finish ?? r.position) <= 3).length;
  const starts = Number(input.starts) || results.length;
  const wins = Number(input.wins) || winsFromResults;
  const podiums = Number(input.podiums) || podiumsFromResults;
  const seasons = Number(input.seasons) || new Set(results.map((r) => Number(r.year) || isoYear(r.date)).filter(Boolean)).size;
  return {
    subjectId: input.subjectId ?? input.riderId ?? null,
    name: input.name ?? input.riderName ?? 'Unknown rider',
    kind: input.kind ?? 'rider',
    homeRegionId: input.homeRegionId ?? input.regionId ?? null,
    retired: Boolean(input.retired),
    careerStartYear: Number(input.careerStartYear) || null,
    careerEndYear: Number(input.careerEndYear) || null,
    seasons,
    starts,
    wins,
    podiums,
    championships: Math.max(0, Number(input.championships) || 0),
    amateurNationalTitles: Math.max(0, Number(input.amateurNationalTitles) || 0),
    regionalTitles: Math.max(0, Number(input.regionalTitles) || 0),
    lorettaQualifications: Math.max(0, Number(input.lorettaQualifications) || 0),
    majorComebacks: Math.max(0, Number(input.majorComebacks) || 0),
    historicFirsts: Math.max(0, Number(input.historicFirsts) || 0),
    iconicRivalries: Math.max(0, Number(input.iconicRivalries) || 0),
    communityImpact: clamp(Number(input.communityImpact) || 0, 0, 100),
    sportsmanship: clamp(Number(input.sportsmanship) || 50, 0, 100),
    fanImpact: clamp(Number(input.fanImpact) || 0, 0, 100),
    industryImpact: clamp(Number(input.industryImpact) || 0, 0, 100),
    mentorshipImpact: clamp(Number(input.mentorshipImpact) || 0, 0, 100),
    memorySignificance: clamp(Number(input.memorySignificance) || 0, 0, 100),
    memorabiliaSignificance: clamp(Number(input.memorabiliaSignificance) || 0, 0, 100),
    supportPeak: input.supportPeak ?? null,
    teams: [...new Set(input.teams ?? [])],
    manufacturers: [...new Set(input.manufacturers ?? [])],
    regions: [...new Set(input.regions ?? (input.regionId ? [input.regionId] : []))],
    notableMemoryIds: [...new Set(input.notableMemoryIds ?? [])],
    notableAssetIds: [...new Set(input.notableAssetIds ?? [])],
  };
}

export function upsertCareerProfile(stateInput, profileInput = {}) {
  const state = restoreHistoryState(stateInput);
  const profile = buildCareerProfile(profileInput);
  if (!profile.subjectId) return { state, saved: false, reason: 'subjectId is required' };
  state.careerProfiles[profile.subjectId] = profile;
  state.revision += 1;
  return { state, saved: true, profile };
}

function recordIsBetter(nextValue, currentValue, lowerIsBetter) {
  if (currentValue == null) return true;
  return lowerIsBetter ? nextValue < currentValue : nextValue > currentValue;
}

export function updateRecordBook(stateInput, record = {}) {
  const state = restoreHistoryState(stateInput);
  const key = String(record.key ?? '');
  const value = Number(record.value);
  if (!key || !Number.isFinite(value) || !record.holderId) {
    return { state, changed: false, reason: 'Record key, numeric value and holderId are required' };
  }
  const current = state.recordBook[key] ?? null;
  const lowerIsBetter = Boolean(record.lowerIsBetter);
  if (current && !recordIsBetter(value, Number(current.value), lowerIsBetter)) {
    return { state, changed: false, record: current, reason: 'Record was not broken' };
  }
  const next = {
    key,
    label: record.label ?? key,
    category: record.category ?? 'career',
    value,
    unit: record.unit ?? null,
    holderId: record.holderId,
    holderName: record.holderName ?? record.holderId,
    date: record.date ?? null,
    year: Number(record.year) || isoYear(record.date) || state.currentYear,
    lowerIsBetter,
    regionId: record.regionId ?? null,
    seriesId: record.seriesId ?? null,
    context: copy(record.context ?? {}),
    previousHolderId: current?.holderId ?? null,
    previousValue: current?.value ?? null,
  };
  state.recordBook[key] = next;
  state.recordHistory.push({
    key,
    previous: copy(current),
    next: copy(next),
    date: next.date,
    year: next.year,
  });
  const historyResult = recordHistoryEvent(state, {
    id: `record-${hashString(`${key}:${next.holderId}:${next.value}:${next.date ?? next.year}`)}`,
    date: next.date,
    year: next.year,
    type: current ? 'record-broken' : 'record-set',
    subjectId: next.holderId,
    subjectName: next.holderName,
    regionId: next.regionId,
    title: current ? `${next.holderName} broke the ${next.label} record` : `${next.holderName} set the ${next.label} record`,
    significance: record.significance ?? 70,
    tags: ['record', next.category, current ? 'record-broken' : 'record-set'],
    data: { key, value: next.value, previousHolderId: current?.holderId ?? null, previousValue: current?.value ?? null },
  });
  return { state: historyResult.state, changed: true, record: next, previous: current };
}

export function hallOfFameScore(profileInput = {}) {
  const p = buildCareerProfile(profileInput);
  const competition = clamp(p.championships * 18 + p.amateurNationalTitles * 7 + p.regionalTitles * 3 + p.wins * 0.8 + p.podiums * 0.25, 0, 48);
  const longevity = clamp(p.seasons * 2 + p.majorComebacks * 3, 0, 14);
  const influence = clamp((p.fanImpact + p.industryImpact + p.communityImpact + p.mentorshipImpact) / 18, 0, 22);
  const story = clamp(p.historicFirsts * 4 + p.iconicRivalries * 2 + p.memorySignificance / 12 + p.memorabiliaSignificance / 20, 0, 16);
  return clamp(Math.round(competition + longevity + influence + story), 0, 100);
}

export function evaluateHallOfFameCandidate(profileInput = {}, { threshold = 70 } = {}) {
  const profile = buildCareerProfile(profileInput);
  const score = hallOfFameScore(profile);
  const careerEstablished = profile.retired || profile.seasons >= 6 || profile.championships >= 2;
  const meaningfulPeak = profile.championships > 0 || profile.amateurNationalTitles >= 2 || profile.wins >= 15 || profile.industryImpact >= 80 || profile.historicFirsts > 0;
  const eligible = Boolean(profile.subjectId && careerEstablished && meaningfulPeak && score >= threshold);
  const reasons = [];
  if (!profile.subjectId) reasons.push('Candidate has no subject ID');
  if (!careerEstablished) reasons.push('Career is not established enough for historical evaluation');
  if (!meaningfulPeak) reasons.push('Candidate needs a meaningful competitive or cultural peak');
  if (score < threshold) reasons.push(`Legacy score ${score} is below ${threshold}`);
  return { eligible, score, threshold, profile, reasons };
}

export function inductHallOfFame(stateInput, { candidate, date = null, classOfYear = null, citation = null, force = false } = {}) {
  const state = restoreHistoryState(stateInput);
  const evaluation = evaluateHallOfFameCandidate(candidate);
  const id = evaluation.profile.subjectId;
  if (!id) return { state, inducted: false, evaluation, reason: 'Candidate has no subject ID' };
  if (state.hallOfFame[id]) return { state, inducted: false, evaluation, induction: state.hallOfFame[id], reason: 'Candidate is already inducted' };
  if (!force && !evaluation.eligible) return { state, inducted: false, evaluation, reason: evaluation.reasons.join('; ') };
  const year = Number(classOfYear) || isoYear(date) || state.currentYear;
  const induction = {
    subjectId: id,
    name: evaluation.profile.name,
    kind: evaluation.profile.kind,
    date,
    classOfYear: year,
    score: evaluation.score,
    citation: citation ?? buildHallOfFameCitation(evaluation.profile),
    careerSnapshot: evaluation.profile,
  };
  state.hallOfFame[id] = induction;
  state.careerProfiles[id] = evaluation.profile;
  const historyResult = recordHistoryEvent(state, {
    id: `hall-${id}-${year}`,
    date,
    year,
    type: 'hall-of-fame-induction',
    subjectId: id,
    subjectName: evaluation.profile.name,
    title: `${evaluation.profile.name} entered the Motocross Hall of Fame`,
    summary: induction.citation,
    significance: 100,
    tags: ['hall-of-fame', 'legacy'],
    memoryLinks: evaluation.profile.notableMemoryIds,
    assetLinks: evaluation.profile.notableAssetIds,
  });
  return { state: historyResult.state, inducted: true, evaluation, induction };
}

export function buildHallOfFameCitation(profileInput = {}) {
  const p = buildCareerProfile(profileInput);
  const achievements = [];
  if (p.championships) achievements.push(`${p.championships} championship${p.championships === 1 ? '' : 's'}`);
  if (p.amateurNationalTitles) achievements.push(`${p.amateurNationalTitles} amateur national title${p.amateurNationalTitles === 1 ? '' : 's'}`);
  if (p.wins) achievements.push(`${p.wins} wins`);
  if (p.majorComebacks) achievements.push(`${p.majorComebacks} major comeback${p.majorComebacks === 1 ? '' : 's'}`);
  if (p.historicFirsts) achievements.push(`${p.historicFirsts} historic first${p.historicFirsts === 1 ? '' : 's'}`);
  if (p.communityImpact >= 70 || p.mentorshipImpact >= 70) achievements.push('lasting impact on the motocross community');
  const detail = achievements.length ? achievements.join(', ') : 'a career that left a lasting mark on motocross';
  return `${p.name} is remembered for ${detail}.`;
}

export function importCultureHistory(stateInput, cultureInput = {}, { subjectId = 'rider', subjectName = 'Rider' } = {}) {
  let state = restoreHistoryState(stateInput);
  const memories = Array.isArray(cultureInput.memories) ? cultureInput.memories : [];
  const memorabilia = Object.values(cultureInput.memorabilia ?? {});
  for (const memory of memories) {
    const result = recordHistoryEvent(state, {
      id: `culture-${memory.id}`,
      date: memory.date,
      type: memory.type ?? 'culture-memory',
      scope: 'personal-history',
      subjectId,
      subjectName,
      title: memory.title ?? 'Motocross memory',
      significance: memory.significance ?? 40,
      tags: ['memory', ...(memory.tags ?? [])],
      memoryLinks: memory.id ? [memory.id] : [],
      people: memory.people ?? [],
      data: { sourceEventId: memory.eventId ?? null },
    });
    state = result.state;
  }
  for (const item of memorabilia) {
    if (!item?.assetId) continue;
    state.artifacts[item.assetId] = {
      assetId: item.assetId,
      serial: item.serial ?? null,
      type: item.type ?? null,
      label: item.label ?? 'Historical memorabilia',
      ownerId: item.ownerId ?? null,
      sourceEventId: item.sourceEventId ?? null,
      signedBy: item.signedBy ?? null,
      significance: Number(item.significance) || 0,
      estimatedValue: Number(item.estimatedValue) || 0,
      displayLocation: item.displayLocation ?? null,
      memoryLinks: [...new Set(item.memoryLinks ?? [])],
      ownershipHistory: copy(item.ownershipHistory ?? []),
    };
  }
  state.revision += memorabilia.length ? 1 : 0;
  return state;
}

export function historyTimeline(stateInput, { subjectId = null, regionId = null, type = null, minSignificance = 0, fromYear = null, toYear = null } = {}) {
  const state = restoreHistoryState(stateInput);
  return state.events.filter((event) => {
    if (subjectId && event.subjectId !== subjectId && !(event.people ?? []).includes(subjectId)) return false;
    if (regionId && event.regionId !== regionId) return false;
    if (type && event.type !== type) return false;
    if (Number(event.significance) < Number(minSignificance || 0)) return false;
    if (fromYear && Number(event.year) < Number(fromYear)) return false;
    if (toYear && Number(event.year) > Number(toYear)) return false;
    return true;
  }).map(copy);
}

export function eraSummary(stateInput, { fromYear, toYear, regionId = null } = {}) {
  const state = restoreHistoryState(stateInput);
  const events = historyTimeline(state, { fromYear, toYear, regionId });
  const seasons = Object.values(state.seasons).filter((season) => {
    if (fromYear && season.year < fromYear) return false;
    if (toYear && season.year > toYear) return false;
    if (regionId && season.regionId && season.regionId !== regionId) return false;
    return true;
  });
  const champions = seasons.filter((s) => s.championId).map((s) => ({ year: s.year, id: s.championId, name: s.championName, seriesId: s.seriesId }));
  const records = state.recordHistory.filter((record) => (!fromYear || record.year >= fromYear) && (!toYear || record.year <= toYear));
  const landmarkEvents = events.filter((event) => event.significance >= 70).sort((a, b) => b.significance - a.significance || a.year - b.year);
  return {
    fromYear: fromYear ?? (events[0]?.year ?? null),
    toYear: toYear ?? (events.at(-1)?.year ?? null),
    regionId,
    eventCount: events.length,
    seasonCount: seasons.length,
    champions,
    recordChanges: records.map(copy),
    landmarkEvents: landmarkEvents.slice(0, 12),
    hallOfFameInductions: Object.values(state.hallOfFame).filter((entry) => (!fromYear || entry.classOfYear >= fromYear) && (!toYear || entry.classOfYear <= toYear)).map(copy),
  };
}

export function subjectHistory(stateInput, subjectId) {
  const state = restoreHistoryState(stateInput);
  const profile = state.careerProfiles[subjectId] ?? null;
  const events = historyTimeline(state, { subjectId });
  const recordsHeld = Object.values(state.recordBook).filter((record) => record.holderId === subjectId).map(copy);
  const recordLegacy = state.recordHistory.filter((record) => record.next?.holderId === subjectId || record.previous?.holderId === subjectId).map(copy);
  const induction = state.hallOfFame[subjectId] ?? null;
  const artifacts = Object.values(state.artifacts).filter((item) => item.ownerId === subjectId || (profile?.notableAssetIds ?? []).includes(item.assetId)).map(copy);
  return { subjectId, profile: copy(profile), events, recordsHeld, recordLegacy, induction: copy(induction), artifacts };
}
