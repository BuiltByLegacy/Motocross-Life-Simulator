// Memory Engine — automatic trigger system (issue #70)
// --------------------------------------------------------------------------
// Memories should emerge from play, not manual note-taking. A trigger listens
// for a resolved event type, decides whether the moment is memorable (with
// first-time / milestone conditions), and returns a structured memory
// descriptor. Duplicate memories are prevented by a per-trigger dedupe key.
//
// This is pure: triggers return descriptors; the caller records them. That
// keeps the rules unit-testable without a running game.

export class MemoryTriggerRegistry {
  constructor() {
    this.triggers = []; // { id, on, when, build, key }
    this.fired = new Set(); // dedupe keys already emitted
  }

  // Register a trigger.
  //   on:   event type string (e.g. 'race:finished', 'asset:acquired')
  //   when: (payload, ctx) => boolean   — is this moment memorable?
  //   build:(payload, ctx) => descriptor — the memory to create
  //   key:  (payload, ctx) => string | null — dedupe key (null = always allow)
  register({ id, on, when = () => true, build, key = () => null }) {
    this.triggers.push({ id, on, when, build, key });
    return this;
  }

  // Feed a resolved event. Returns the list of memory descriptors created
  // (deduped). Each descriptor carries a `source` link back to the event.
  handle(eventType, payload = {}, ctx = {}) {
    const out = [];
    for (const t of this.triggers) {
      if (t.on !== eventType) continue;
      let memorable;
      try { memorable = t.when(payload, ctx); } catch { memorable = false; }
      if (!memorable) continue;
      const dedupeKey = t.key(payload, ctx);
      if (dedupeKey != null) {
        if (this.fired.has(dedupeKey)) continue;
        this.fired.add(dedupeKey);
      }
      const d = t.build(payload, ctx);
      if (d) out.push({ ...d, source: d.source ?? { system: eventType, eventId: payload.eventId ?? null }, _trigger: t.id });
    }
    return out;
  }

  toJSON() { return { fired: [...this.fired] }; }
  static fromJSON(data, triggers) {
    const r = new MemoryTriggerRegistry();
    if (triggers) for (const t of triggers) r.register(t);
    r.fired = new Set(data?.fired ?? []);
    return r;
  }
}

// The default trigger set wiring the game's core systems into memories (#70).
// Each is pure; `ctx` supplies rider name / campaign for phrasing.
export function defaultTriggers() {
  return [
    // First race ever.
    {
      id: 'first_race', on: 'race:finished',
      when: (p) => p.isFirstRace === true,
      key: () => 'first_race',
      build: (p) => ({
        type: 'race_result', title: 'Your First Race', importance: 74,
        tone: ['nerves', 'excitement'], tags: ['first_time', 'racing'],
        summary: `You lined up for your first real race and came home ${p.overallLabel ?? 'out there'}.`,
        entities: p.eventName ? [{ kind: 'event', id: p.eventId, name: p.eventName }] : [],
      }),
    },
    // First win.
    {
      id: 'first_win', on: 'race:finished',
      when: (p) => p.overall === 1,
      key: () => 'first_win',
      build: (p) => ({
        type: 'race_result', title: 'First Win', importance: 90,
        tone: ['joy', 'pride', 'relief'], tags: ['first_time', 'milestone', 'racing'],
        summary: `You won ${p.eventName ?? 'the race'}! First place, overall.`,
        participants: (p.family ?? []).map((id) => ({ id, support: 'celebrated' })),
        entities: p.eventName ? [{ kind: 'event', id: p.eventId, name: p.eventName }] : [],
      }),
    },
    // A big crash / injury.
    {
      id: 'big_crash', on: 'rider:injured',
      when: (p) => p.severity === 'moderate' || p.severity === 'severe',
      key: (p) => `injury_${p.injuryId ?? p.week}`,
      build: (p) => ({
        type: 'personal', title: 'The Crash', importance: 78,
        tone: ['fear', 'grief'], tags: ['injury', 'setback'],
        summary: `${p.name ?? 'A hard'} crash — ${p.injuryName ?? 'hurt'}. Weeks on the sideline ahead.`,
      }),
    },
    // Buying a bike (a new machine with its own future story).
    {
      id: 'bike_purchase', on: 'asset:acquired',
      when: (p) => p.kind === 'bike',
      key: (p) => `acquire_${p.assetId}`,
      build: (p) => ({
        type: 'object', title: p.gift ? 'A Bike of Their Own' : 'A New Bike', importance: p.gift ? 66 : 52,
        tone: p.gift ? ['love', 'hope'] : ['hope'], tags: ['bike', 'milestone', p.source?.via ?? 'purchase'],
        summary: `${p.name ?? 'A bike'} joined the garage${p.via ? ` (${p.via})` : ''}. Every scratch from here is a story.`,
        entities: [{ kind: 'bike', id: p.assetId, name: p.name }],
      }),
    },
    // Selling a beloved machine.
    {
      id: 'bike_sold', on: 'asset:sold',
      when: (p) => p.kind === 'bike',
      key: (p) => `sold_${p.assetId}`,
      build: (p) => ({
        type: 'object', title: 'Letting It Go', importance: 60,
        tone: ['bittersweet', 'nostalgia'], tags: ['bike', 'sale', 'goodbye'],
        summary: `Sold ${p.name ?? 'the bike'}. Outgrown, never forgotten.`,
        entities: [{ kind: 'bike', id: p.assetId, name: p.name }],
      }),
    },
    // Missing a qualifier / coming up short on the Loretta's path.
    {
      id: 'missed_qualifier', on: 'lorettas:result',
      when: (p) => p.eliminated === true,
      key: (p) => `missed_${p.eventId ?? p.week}`,
      build: (p) => ({
        type: 'race_result', title: 'So Close', importance: 72,
        tone: ['heartbreak', 'determination'], tags: ['lorettas', 'heartbreak', 'setback'],
        summary: `Came up short at ${p.eventName ?? 'the qualifier'}. The Road to Loretta’s waits another year.`,
        entities: p.eventName ? [{ kind: 'event', id: p.eventId, name: p.eventName }] : [],
      }),
    },
    // A family sacrifice (someone gave something up so the rider could race).
    {
      id: 'family_sacrifice', on: 'family:sacrifice',
      when: () => true,
      key: (p) => `sacrifice_${p.who}_${p.week}`,
      build: (p) => ({
        type: 'relationship', title: p.title ?? 'What It Cost', importance: 80,
        tone: ['love', 'grief', 'pride'], tags: ['family_sacrifice', 'milestone'],
        summary: p.summary ?? `${p.whoName ?? 'Family'} gave something up so the racing could go on.`,
        participants: [{ id: p.who, support: 'sacrifice', impact: p.impact ?? 'high' }],
      }),
    },
  ];
}
