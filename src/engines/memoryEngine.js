// Memory Engine
// -------------
// "A memory is only worth saving if it can influence future gameplay, dialogue,
// relationships, recaps, reputation, the garage, or story generation."
//
// Records meaningful life events, scores their importance, and stores the ones
// worth keeping. The importance score is reused by the simulation-depth system
// (DD-0020) to decide which events are big enough to pause a fast playthrough.

import { uid } from '../core/state.js';
import { makeMemory, MemoryTimeline } from '../systems/memory.js';

const KEEP_THRESHOLD = 45;

export class MemoryEngine {
  constructor(game) {
    this.game = game;
  }

  // Estimate importance (0-100) from the factors the Design Bible lists.
  score(mem) {
    if (typeof mem.importance === 'number') return mem.importance;
    let s = 20;
    const tags = mem.tags ?? [];
    if (tags.includes('first_time') || (mem.title || '').startsWith('First')) s += 28;
    if (tags.includes('championship') || tags.includes('regional')) s += 22;
    if (tags.includes('injury')) s += 20;
    if (tags.includes('family_sacrifice')) s += 22;
    if (tags.includes('money')) s += 8;
    if (tags.includes('rivalry')) s += 10;
    if (tags.includes('sponsor') || tags.includes('support_ladder')) s += 16;
    if (tags.includes('comeback')) s += 18;
    if (tags.includes('milestone')) s += 14;
    if ((mem.emotion ?? []).length >= 2) s += 6;
    return Math.min(100, s);
  }

  // Record an event. Returns the stored memory, or null if not important enough.
  record(mem) {
    const importance = this.score(mem);
    const shouldKeep = mem.force === true || importance >= KEEP_THRESHOLD;
    if (!shouldKeep) return null;

    // Normalize into the rich, queryable record model (issue #68/#71): entity
    // links, participant roles/support, source refs, and a season-aware date.
    const record = makeMemory({ ...mem, importance }, {
      id: uid('mem'),
      seasonNumber: this.game.state.seasonNumber,
      week: this.game.state.week,
      riderAge: this.game.state.rider.age,
    });
    this.game.state.memories.push(record);

    // Shared memories echo into the relationships of everyone involved.
    for (const pid of record.people) {
      const rel = this.game.state.relationships[pid];
      if (rel) rel.sharedMemories.push(record.id);
    }

    this.game.bus.emit('memory:created', { memory: record, week: record.week });
    return record;
  }

  top(n = 6) {
    return [...this.game.state.memories].sort((a, b) => b.importance - a.importance).slice(0, n);
  }

  // Timeline query API over the career's memories (issue #72).
  timeline() {
    return new MemoryTimeline(this.game.state.memories);
  }
  query(opts = {}) {
    return this.timeline().query(opts);
  }
}
