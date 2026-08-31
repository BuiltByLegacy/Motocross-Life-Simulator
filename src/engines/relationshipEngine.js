// Relationship Engine
// -------------------
// "Relationships are built from experiences, not dialogue choices." Values are
// hidden and expressed through behavior. This engine wraps a single person's
// relationship record with clamped mutation and a `describe()` that turns
// hidden numbers into a spoken line — the only thing the player ever sees.

import { ensureRelationshipLifecycle } from '../systems/peopleRelationships2.js';

function clamp(v) {
  return Math.max(0, Math.min(100, v));
}

export class Relationship {
  constructor(record) {
    this.rec = ensureRelationshipLifecycle(record);
  }
  get name() { return this.rec.name; }
  get lifecycle() { return this.rec.lifecycle; }
  get(dim) { return this.rec.values[dim] ?? 0; }
  change(dim, delta) {
    if (this.rec.values[dim] === undefined) this.rec.values[dim] = 50;
    this.rec.values[dim] = clamp(this.rec.values[dim] + delta);
    return this;
  }

  // A rough single-number read of the bond, for arc progression / recap only.
  warmth() {
    const v = this.rec.values;
    const pos = (v.trust ?? 0) + (v.pride ?? 0) + (v.support ?? 0) + (v.belief ?? 0) + (v.respect ?? 0) + (v.friendship ?? 0) + (v.loyalty ?? 0) + (v.reputation ?? 0);
    const neg = (v.fear ?? 0) + (v.frustration ?? 0) + (v.rivalry ?? 0) + (v.jealousy ?? 0);
    const posCount = ['trust', 'pride', 'support', 'belief', 'respect', 'friendship', 'loyalty', 'reputation'].filter((k) => v[k] !== undefined).length;
    return posCount ? Math.round(pos / posCount - neg / 6) : 50;
  }

  // Hidden values expressed through behavior (a spoken line).
  describe() {
    const v = this.rec.values;
    switch (this.rec.role) {
      case 'Parent':
        if (this.rec.id === 'dad') {
          if ((v.trust ?? 0) > 68) return '"I trust you to handle the bike this weekend."';
          if ((v.pride ?? 0) > 68) return '"That\'s my kid out there."';
          if ((v.trust ?? 0) < 35) return '"Are you sure you\'re ready for this?"';
          return '"Let\'s get to work."';
        }
        if ((v.fear ?? 0) > 60) return '"Please just be careful out there. Please."';
        if ((v.trust ?? 0) > 68) return '"I\'m proud of the kid you\'re becoming."';
        return '"Did you finish your homework?"';
      case 'Coach':
        if ((v.belief ?? 0) > 62) return '"You\'re ready. I mean it."';
        if ((v.frustration ?? 0) > 45) return '"You\'re not listening to me out there."';
        return '"Two more laps. Hit that inside line."';
      case 'Rival':
        if ((v.friendship ?? 0) > 55) return 'Ethan gives you a nod at the gate. Respect, finally.';
        if ((v.respect ?? 0) > 55) return 'Ethan won\'t admit it, but he watches your lines now.';
        if ((v.rivalry ?? 0) > 60) return 'Ethan wants to beat you more than anyone.';
        return 'Ethan barely knows your name yet.';
      case 'Friend':
        if ((v.jealousy ?? 0) > 45) return 'Jesse\'s happy for you — mostly.';
        if ((v.loyalty ?? 0) > 62) return 'Jesse\'s in your corner, every weekend.';
        return 'Jesse\'s a good kid to have around.';
      case 'Local Shop':
        if ((v.loyalty ?? 0) > 55) return 'Rocky slides you the good tires and waves off the markup.';
        if ((v.reputation ?? 0) > 45) return 'Rocky\'s starting to brag about "his" fast kid.';
        return 'Rocky knows your face, not your name.';
      case 'Child':
        if ((v.pressure ?? 0) > 60) return '"Do I have to ride this weekend?"';
        if ((v.love ?? 0) > 68) return '"You\'re the best. I love that we do this together."';
        if ((v.trust ?? 0) > 62) return '"Did you see me out there?! Did you see it?"';
        if ((v.love ?? 0) < 35) return 'They mostly ride in silence these days.';
        return '"Can we get to the track early on Saturday?"';
      case 'Spouse':
        if ((v.strain ?? 0) > 60) return '"We need to talk about the money. Again."';
        if ((v.agreement ?? 0) > 62 && (v.strain ?? 0) < 30) return '"We\'re a good team, you and me."';
        if ((v.communication ?? 0) > 60) return '"Whatever you decide, we\'ll figure it out together."';
        return '"Just... keep them safe out there, okay?"';
      default: return '';
    }
  }

  updateArc() {
    if (this.rec.arcStage === null || this.rec.arcStage === undefined) return null;
    const w = this.warmth();
    const target = w > 72 ? 2 : w > 55 ? 1 : 0;
    if (target > this.rec.arcStage) { this.rec.arcStage = target; return this.rec.arcStage; }
    return null;
  }
}

const NULL_RELATIONSHIP = {
  rec: { values: {}, role: null, arcStage: null },
  get name() { return ''; }, get lifecycle() { return null; }, get() { return 0; }, change() { return this; }, warmth() { return 50; }, describe() { return ''; }, updateArc() { return null; },
};

export class RelationshipEngine {
  constructor(game) { this.game = game; this._cache = new Map(); }
  of(id) {
    if (!this._cache.has(id)) {
      const rec = this.game.state.relationships[id];
      if (!rec) return NULL_RELATIONSHIP;
      const normalized = ensureRelationshipLifecycle(rec);
      this.game.state.relationships[id] = normalized;
      this._cache.set(id, new Relationship(normalized));
    }
    return this._cache.get(id);
  }
  all() { return Object.keys(this.game.state.relationships).map((id) => this.of(id)); }
}
