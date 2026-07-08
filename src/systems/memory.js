// Memory Engine — record model + timeline queries (issues #68, #71, #72)
// --------------------------------------------------------------------------
// "Build memories, not mechanics." A first-class, queryable model for the
// emotional history of a career: meaningful moments involving riders, family,
// bikes, parts, races, places, decisions, and important objects.
//
//   #68 core memory record model (rich, linked, serializable, queryable)
//   #71 family & relationship memory links (roles, attendance, support, impact)
//   #72 timeline query API (scopes, filters, deterministic ordering, paging)

// Emotional tones a memory can carry (free-form tags are also allowed).
export const MEMORY_TONES = [
  'joy', 'pride', 'heartbreak', 'fear', 'relief', 'love', 'anger',
  'nostalgia', 'awe', 'grief', 'hope', 'bittersweet', 'determination',
];

// How a person participated in a moment (#71).
export const SUPPORT_TYPES = ['attended', 'paid', 'drove', 'coached', 'absent', 'conflict', 'sacrifice', 'encouraged', 'celebrated'];

// Relationship ids that count as "family" for the family scope/query (#71).
export const FAMILY_ROLES = new Set(['dad', 'mom', 'spouse', 'child', 'sibling', 'grandparent', 'guardian']);

const DAYS_PER_SEASON = 84;

// Normalize any memory input into a rich, serializable record. Backward
// compatible with the legacy { title, summary, emotion, people, tags,
// importance } shape used across the existing content.
export function makeMemory(input = {}, ctx = {}) {
  const seasonNumber = input.seasonNumber ?? ctx.seasonNumber ?? 1;
  const week = input.week ?? ctx.week ?? 1;
  const tone = dedupe([...(input.tone ?? []), ...(input.emotion ?? [])]);
  return {
    id: input.id ?? ctx.id ?? null,
    type: input.type ?? 'personal',
    title: input.title ?? 'A moment',
    summary: input.summary ?? '',
    tone, // emotional tone (union of tone + legacy emotion)
    emotion: tone, // legacy alias kept in sync
    tags: input.tags ?? [],
    importance: input.importance ?? 0,
    // Participants carry role + support + emotional impact (#71).
    participants: normalizeParticipants(input),
    people: normalizeParticipants(input).map((p) => p.id), // legacy flat id list
    // Entity links: bikes, parts, events, locations, assets, trophies (#68).
    entities: (input.entities ?? []).map((e) => ({ kind: e.kind, id: e.id, name: e.name ?? null })),
    // Where the memory came from (#68/#70).
    source: input.source ?? null, // { system, eventId }
    // Date fields (#68/#72).
    seasonNumber, week,
    riderAge: input.riderAge ?? ctx.riderAge ?? null,
    dayIndex: (seasonNumber - 1) * DAYS_PER_SEASON + (week - 1) * 7,
  };
}

// Accept participants as either a flat `people:[id]` list or a rich
// `participants:[{id, role, support, impact}]` array (or both).
function normalizeParticipants(input) {
  const out = new Map();
  for (const id of input.people ?? []) {
    if (id != null) out.set(id, { id, role: roleFor(id), support: null, impact: null });
  }
  for (const p of input.participants ?? []) {
    if (p && p.id != null) out.set(p.id, { id: p.id, role: p.role ?? roleFor(p.id), support: p.support ?? null, impact: p.impact ?? null });
  }
  return [...out.values()];
}

function roleFor(id) {
  if (FAMILY_ROLES.has(id)) return id;
  if (id === 'coach_mike' || id === 'coach') return 'coach';
  if (String(id).startsWith('rival')) return 'rival';
  return 'other';
}

function dedupe(arr) { return [...new Set(arr)]; }

// ---- #72 timeline query API ----------------------------------------------
// Wraps a flat list of memory records and answers scoped, filtered timeline
// queries. Deterministic ordering; UI-ready but screen-agnostic.
export class MemoryTimeline {
  constructor(memories = []) {
    this.memories = memories;
  }

  // Scopes narrow to an entity family; filters narrow further.
  //  scope: 'career' | 'season' | 'rider' | 'bike' | 'object' | 'family'
  //  filters: { entityId, entityKind, person, role, tag, tone, source,
  //             seasonNumber, fromDay, toDay, sort, limit, offset }
  query({
    scope = 'career', entityId = null, entityKind = null, person = null, role = null,
    tag = null, tone = null, source = null, seasonNumber = null,
    fromDay = null, toDay = null, sort = 'chrono', limit = null, offset = 0,
  } = {}) {
    let out = this.memories.filter((m) => this._inScope(m, scope, { entityId, entityKind }));

    if (entityId) out = out.filter((m) => m.entities?.some((e) => e.id === entityId));
    if (entityKind) out = out.filter((m) => m.entities?.some((e) => e.kind === entityKind));
    if (person) out = out.filter((m) => m.participants?.some((p) => p.id === person));
    if (role) out = out.filter((m) => m.participants?.some((p) => p.role === role));
    if (tag) out = out.filter((m) => m.tags?.includes(tag));
    if (tone) out = out.filter((m) => (m.tone ?? []).includes(tone));
    if (source) out = out.filter((m) => m.source?.system === source);
    if (seasonNumber != null) out = out.filter((m) => m.seasonNumber === seasonNumber);
    if (fromDay != null) out = out.filter((m) => (m.dayIndex ?? 0) >= fromDay);
    if (toDay != null) out = out.filter((m) => (m.dayIndex ?? 0) <= toDay);

    out = this._sort(out, sort);
    if (offset) out = out.slice(offset);
    if (limit != null) out = out.slice(0, limit);
    return out;
  }

  _inScope(m, scope, { entityId }) {
    switch (scope) {
      case 'family': return (m.participants ?? []).some((p) => FAMILY_ROLES.has(p.role));
      case 'bike': return (m.entities ?? []).some((e) => e.kind === 'bike' && (!entityId || e.id === entityId));
      case 'object': return (m.entities ?? []).some((e) => ['bike', 'part', 'trophy', 'gear', 'object', 'asset'].includes(e.kind));
      case 'rider': return m.type !== 'relationship';
      case 'season':
      case 'career':
      default: return true;
    }
  }

  // Deterministic ordering: 'chrono' (oldest→newest), 'recent', or 'importance'.
  // Ties always break by importance then id, so results never reorder randomly.
  _sort(list, sort) {
    const byId = (a, b) => String(a.id ?? '').localeCompare(String(b.id ?? ''));
    if (sort === 'importance') {
      return [...list].sort((a, b) => b.importance - a.importance || (a.dayIndex ?? 0) - (b.dayIndex ?? 0) || byId(a, b));
    }
    if (sort === 'recent') {
      return [...list].sort((a, b) => (b.dayIndex ?? 0) - (a.dayIndex ?? 0) || b.importance - a.importance || byId(a, b));
    }
    // chrono
    return [...list].sort((a, b) => (a.dayIndex ?? 0) - (b.dayIndex ?? 0) || b.importance - a.importance || byId(a, b));
  }

  // Convenience scoped timelines (#72).
  career(opts = {}) { return this.query({ scope: 'career', ...opts }); }
  season(seasonNumber, opts = {}) { return this.query({ scope: 'season', seasonNumber, ...opts }); }
  family(opts = {}) { return this.query({ scope: 'family', ...opts }); }
  forBike(bikeId, opts = {}) { return this.query({ scope: 'bike', entityId: bikeId, ...opts }); }
  forObject(entityId, opts = {}) { return this.query({ scope: 'career', entityId, ...opts }); }
  forPerson(person, opts = {}) { return this.query({ person, ...opts }); }

  // A grouped summary: memory counts per season (for a timeline overview UI).
  seasonsIndex() {
    const map = new Map();
    for (const m of this.memories) {
      const s = m.seasonNumber ?? 1;
      map.set(s, (map.get(s) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([season, count]) => ({ season, count }));
  }
}
