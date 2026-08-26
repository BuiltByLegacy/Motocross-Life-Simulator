// Northeast Career World Depth — issues #296, #297, #298
// ------------------------------------------------------
// Reference-world systems for recurring championships, persistent rivals,
// venue reputation, and multi-season local identity. This deliberately builds
// one deep region before broad regional expansion.

import { NORTHEAST_SERIES, NORTHEAST_VENUES, venueById } from './geography.js';

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export const NORTHEAST_POINTS = [25, 22, 20, 18, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

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

export function buildNortheastChampionshipSchedule({
  seriesId = 'ne-local-cup',
  seasonYear = 2027,
  startMonth = 4,
  rounds = null,
} = {}) {
  const series = NORTHEAST_SERIES.find((s) => s.id === seriesId);
  if (!series) throw new Error(`Unknown Northeast series: ${seriesId}`);
  const roundCount = rounds ?? (series.level === 'local' ? 8 : 7);
  const venueIds = series.venueIds;
  const schedule = [];
  for (let i = 0; i < roundCount; i += 1) {
    const monthOffset = Math.floor(i / 2);
    const month = Math.min(10, startMonth + monthOffset);
    const weekSlot = i % 2 === 0 ? 1 : 3; // built-in off weekends
    const venueId = venueIds[i % venueIds.length];
    const venue = venueById(venueId);
    schedule.push({
      id: `${seriesId}-${seasonYear}-r${i + 1}`,
      seriesId,
      seasonYear,
      round: i + 1,
      level: series.level,
      venueId,
      venueName: venue?.name ?? venueId,
      month,
      weekOfMonth: weekSlot,
      championshipEvent: true,
      lorettasPath: false,
      status: 'scheduled',
    });
  }
  return schedule;
}

export class ChampionshipState {
  constructor({ seriesId = 'ne-local-cup', seasonYear = 2027, schedule = null } = {}) {
    this.seriesId = seriesId;
    this.seasonYear = seasonYear;
    this.schedule = schedule ?? buildNortheastChampionshipSchedule({ seriesId, seasonYear });
    this.resultsByEvent = {};
    this.standings = {};
  }

  _rider(id, name = id) {
    if (!this.standings[id]) this.standings[id] = { riderId: id, name, points: 0, starts: 0, wins: 0, podiums: 0, bestFinish: null, finishes: [] };
    return this.standings[id];
  }

  recordEventResult(eventId, results = []) {
    const event = this.schedule.find((e) => e.id === eventId);
    if (!event) throw new Error(`Unknown championship event: ${eventId}`);
    if (this.resultsByEvent[eventId]) throw new Error(`Results already recorded for: ${eventId}`);
    const normalized = results.map((r, idx) => ({
      riderId: r.riderId,
      name: r.name ?? r.riderId,
      finish: r.finish ?? idx + 1,
      dnf: Boolean(r.dnf),
    }));
    this.resultsByEvent[eventId] = normalized;
    event.status = 'completed';
    for (const result of normalized) {
      const rider = this._rider(result.riderId, result.name);
      rider.starts += 1;
      const points = result.dnf ? 0 : (NORTHEAST_POINTS[result.finish - 1] ?? 0);
      rider.points += points;
      rider.finishes.push(result.dnf ? null : result.finish);
      if (!result.dnf) {
        if (rider.bestFinish == null || result.finish < rider.bestFinish) rider.bestFinish = result.finish;
        if (result.finish === 1) rider.wins += 1;
        if (result.finish <= 3) rider.podiums += 1;
      }
    }
    return this.table();
  }

  skipEvent(eventId) {
    const event = this.schedule.find((e) => e.id === eventId);
    if (!event) throw new Error(`Unknown championship event: ${eventId}`);
    if (event.status === 'completed') throw new Error('Cannot skip a completed event');
    event.status = 'skipped';
    this.resultsByEvent[eventId] = [];
    return event;
  }

  table() {
    return Object.values(this.standings).sort((a, b) => b.points - a.points || b.wins - a.wins || (a.bestFinish ?? 999) - (b.bestFinish ?? 999) || a.name.localeCompare(b.name));
  }

  recap(riderId) {
    const rider = this.standings[riderId] ?? { riderId, name: riderId, points: 0, starts: 0, wins: 0, podiums: 0, bestFinish: null, finishes: [] };
    const table = this.table();
    const position = Math.max(0, table.findIndex((r) => r.riderId === riderId)) + (table.some((r) => r.riderId === riderId) ? 1 : 0);
    return {
      seriesId: this.seriesId,
      seasonYear: this.seasonYear,
      position: position || null,
      ...rider,
      roundsCompleted: this.schedule.filter((e) => e.status === 'completed').length,
      roundsSkipped: this.schedule.filter((e) => e.status === 'skipped').length,
    };
  }

  toJSON() {
    return { seriesId: this.seriesId, seasonYear: this.seasonYear, schedule: this.schedule, resultsByEvent: this.resultsByEvent, standings: this.standings };
  }

  static fromJSON(data = {}) {
    const state = new ChampionshipState({ seriesId: data.seriesId, seasonYear: data.seasonYear, schedule: data.schedule });
    state.resultsByEvent = data.resultsByEvent ?? {};
    state.standings = data.standings ?? {};
    return state;
  }
}

export const DEFAULT_NORTHEAST_RIVALS = [
  { id: 'ne-rival-avery', name: 'Avery Cole', homeState: 'MA', birthYear: 2016, talent: 78, workRate: 71, classPath: ['50cc', '65cc', '85cc'] },
  { id: 'ne-rival-mason', name: 'Mason Reed', homeState: 'CT', birthYear: 2016, talent: 72, workRate: 84, classPath: ['50cc', '65cc', '85cc'] },
  { id: 'ne-rival-jordan', name: 'Jordan Pike', homeState: 'NY', birthYear: 2015, talent: 84, workRate: 65, classPath: ['65cc', '85cc', 'supermini'] },
  { id: 'ne-rival-riley', name: 'Riley Hart', homeState: 'NH', birthYear: 2017, talent: 69, workRate: 88, classPath: ['50cc', '65cc', '85cc'] },
  { id: 'ne-rival-cam', name: 'Cam Torres', homeState: 'NJ', birthYear: 2016, talent: 80, workRate: 76, classPath: ['50cc', '65cc', '85cc'] },
];

export class NortheastRivalWorld {
  constructor({ rivals = DEFAULT_NORTHEAST_RIVALS, seasonYear = 2027 } = {}) {
    this.seasonYear = seasonYear;
    this.rivals = Object.fromEntries(rivals.map((r) => [r.id, { ...r, active: r.active ?? true, development: r.development ?? 50, missedEvents: 0, currentClass: r.currentClass ?? r.classPath[0] }]));
    this.history = {}; // rivalId -> head-to-head history
  }

  fieldForEvent({ eventId, klass, level = 'local', venueId } = {}) {
    return Object.values(this.rivals).filter((r) => {
      if (!r.active || r.currentClass !== klass) return false;
      const attendance = seededUnit(`${this.seasonYear}:${eventId}:${r.id}:${venueId}`);
      const threshold = level === 'regional' ? 0.88 : 0.78;
      return attendance <= threshold;
    });
  }

  encounter(rivalId, { playerFinish, rivalFinish, venueId, incident = null } = {}) {
    const rival = this.rivals[rivalId];
    if (!rival) throw new Error(`Unknown rival: ${rivalId}`);
    const h = this.history[rivalId] ?? (this.history[rivalId] = { rivalId, name: rival.name, meetings: 0, playerWins: 0, rivalWins: 0, venues: {}, incidents: [], intensity: 0 });
    h.meetings += 1;
    if (playerFinish < rivalFinish) h.playerWins += 1;
    else if (rivalFinish < playerFinish) h.rivalWins += 1;
    h.venues[venueId] = (h.venues[venueId] ?? 0) + 1;
    if (incident) h.incidents.push({ venueId, incident, seasonYear: this.seasonYear });
    h.intensity = clamp(15 + h.meetings * 7 + Math.min(20, h.incidents.length * 8) + Math.min(15, Object.keys(h.venues).length * 3));
    return h;
  }

  advanceSeason({ nextYear = this.seasonYear + 1 } = {}) {
    for (const rival of Object.values(this.rivals)) {
      const growthNoise = Math.round((seededUnit(`${nextYear}:${rival.id}:growth`) - 0.5) * 14);
      rival.development = clamp(rival.development + Math.round((rival.workRate - 50) * 0.08) + growthNoise);
      const quitRoll = seededUnit(`${nextYear}:${rival.id}:quit`);
      if (quitRoll > 0.985) rival.active = false;
      const age = nextYear - rival.birthYear;
      const pathIndex = rival.classPath.indexOf(rival.currentClass);
      const shouldMove = age >= 9 + Math.max(0, pathIndex) * 2 && pathIndex >= 0 && pathIndex < rival.classPath.length - 1;
      if (shouldMove && seededUnit(`${nextYear}:${rival.id}:class`) > 0.22) rival.currentClass = rival.classPath[pathIndex + 1];
    }
    this.seasonYear = nextYear;
    return this;
  }

  memoryHook(rivalId) {
    const h = this.history[rivalId];
    if (!h) return null;
    if (h.meetings === 1) return { type: 'rival-first-meeting', importance: 50, title: `First battle with ${h.name}`, rivalId };
    if (h.meetings >= 5 && h.intensity >= 60) return { type: 'rivalry-saga', importance: 68, title: `${h.name} rivalry takes shape`, rivalId, meetings: h.meetings };
    return null;
  }

  toJSON() { return { seasonYear: this.seasonYear, rivals: this.rivals, history: this.history }; }
  static fromJSON(data = {}) {
    const world = new NortheastRivalWorld({ rivals: Object.values(data.rivals ?? {}), seasonYear: data.seasonYear });
    world.history = data.history ?? {};
    return world;
  }
}

export const LOCAL_REPUTATION_TIERS = [
  { min: 0, id: 'unknown', label: 'Unknown' },
  { min: 15, id: 'regular', label: 'Track Regular' },
  { min: 35, id: 'contender', label: 'Local Contender' },
  { min: 60, id: 'hero', label: 'Hometown Hero' },
  { min: 82, id: 'legend', label: 'Regional Legend' },
];

export class LocalReputationState {
  constructor({ regionScore = 0, venueScores = {}, milestones = {}, memories = [] } = {}) {
    this.regionScore = regionScore;
    this.venueScores = { ...venueScores };
    this.milestones = { ...milestones };
    this.memories = [...memories];
  }

  tier(score = this.regionScore) {
    return [...LOCAL_REPUTATION_TIERS].reverse().find((t) => score >= t.min) ?? LOCAL_REPUTATION_TIERS[0];
  }

  recordVenueResult({ venueId, finish = null, dnf = false, incident = null, championshipClinched = false } = {}) {
    if (!venueById(venueId)) throw new Error(`Unknown Northeast venue: ${venueId}`);
    const key = venueId;
    const before = this.venueScores[key] ?? 0;
    let delta = 2; // showing up matters
    if (dnf) delta = 0;
    else if (finish === 1) delta += 10;
    else if (finish != null && finish <= 3) delta += 6;
    else if (finish != null && finish <= 10) delta += 2;
    if (incident === 'sportsmanship') delta += 4;
    if (incident === 'unsportsmanlike') delta -= 8;
    if (championshipClinched) delta += 14;
    const after = clamp(before + delta);
    this.venueScores[key] = after;
    this.regionScore = clamp(this.regionScore + Math.max(-5, Math.round(delta * 0.45)));

    const venueMilestones = this.milestones[key] ?? (this.milestones[key] = {});
    const generated = [];
    const maybe = (flag, condition, type, title, importance) => {
      if (condition && !venueMilestones[flag]) {
        venueMilestones[flag] = true;
        const memory = { type, title, importance, venueId, reputationAfter: after };
        this.memories.push(memory);
        generated.push(memory);
      }
    };
    maybe('firstVisit', true, 'venue-first-visit', `First visit to ${venueById(venueId).name}`, 35);
    maybe('firstPodium', !dnf && finish != null && finish <= 3, 'venue-first-podium', `First podium at ${venueById(venueId).name}`, 56);
    maybe('firstWin', !dnf && finish === 1, 'venue-first-win', `First win at ${venueById(venueId).name}`, 66);
    maybe('championship', championshipClinched, 'venue-championship-clinch', `Championship clinched at ${venueById(venueId).name}`, 82);

    return { venueId, before, after, delta, regionScore: this.regionScore, venueTier: this.tier(after), regionTier: this.tier(), memories: generated };
  }

  hooks() {
    const tier = this.tier();
    return {
      dealer: { localRecognition: tier.id, discountConversationEligible: this.regionScore >= 35 },
      sponsor: { localRecognition: tier.id, localSponsorInterest: this.regionScore >= 45 },
      announcer: { localRecognition: tier.id, calloutEligible: this.regionScore >= 25 },
      media: { localRecognition: tier.id, storyEligible: this.regionScore >= 60 },
      family: { localRecognition: tier.id, prideEventEligible: this.regionScore >= 35 },
    };
  }

  toJSON() { return { regionScore: this.regionScore, venueScores: this.venueScores, milestones: this.milestones, memories: this.memories }; }
  static fromJSON(data = {}) { return new LocalReputationState(data); }
}

export function careerWorldSnapshot({ championships = [], rivalWorld, reputation } = {}) {
  return {
    version: 1,
    championships: championships.map((c) => c instanceof ChampionshipState ? c.toJSON() : c),
    rivalWorld: rivalWorld instanceof NortheastRivalWorld ? rivalWorld.toJSON() : (rivalWorld ?? null),
    reputation: reputation instanceof LocalReputationState ? reputation.toJSON() : (reputation ?? null),
  };
}

export function restoreCareerWorldSnapshot(data = {}) {
  const raw = typeof data === 'string' ? JSON.parse(data) : data;
  return {
    version: 1,
    championships: (raw.championships ?? []).map((c) => ChampionshipState.fromJSON(c)),
    rivalWorld: NortheastRivalWorld.fromJSON(raw.rivalWorld ?? {}),
    reputation: LocalReputationState.fromJSON(raw.reputation ?? {}),
  };
}

export function validateNortheastWorldData() {
  const venueIds = new Set(NORTHEAST_VENUES.map((v) => v.id));
  const issues = [];
  for (const series of NORTHEAST_SERIES) {
    for (const venueId of series.venueIds) if (!venueIds.has(venueId)) issues.push(`Missing venue ${venueId} for ${series.id}`);
  }
  return { valid: issues.length === 0, issues };
}
