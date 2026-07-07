// Sponsor Engine
// --------------
// Pitch fictional local/regional/national brands for a logo deal. Eligibility
// is earned through results and reputation (Opportunity Engine philosophy: you
// earn deals through life, not XP). Sponsors pay a signing bonus on the deal, a
// per-season stipend, and per-race contingency when the rider finishes well.

import { SPONSORS } from '../data/content.js';

export class SponsorEngine {
  constructor(game) {
    this.game = game;
  }

  wire() {
    this.game.bus.on('race:finished', (p) => this.onRace(p));
  }

  byId(id) {
    return SPONSORS.find((s) => s.id === id);
  }
  activeIds() {
    return this.game.state.sponsors ?? [];
  }
  active() {
    return this.activeIds().map((id) => this.byId(id)).filter(Boolean);
  }
  isActive(id) {
    return this.activeIds().includes(id);
  }
  eligible(sponsor) {
    try {
      return !!sponsor.req(this.game);
    } catch (e) {
      return false;
    }
  }

  // All sponsors grouped for the Sponsors tab: active / available / locked.
  board() {
    const out = { local: [], regional: [], national: [] };
    for (const s of SPONSORS) {
      const status = this.isActive(s.id) ? 'active' : this.eligible(s) ? 'available' : 'locked';
      out[s.tier].push({ ...s, status });
    }
    return out;
  }

  // Pitch a sponsor. Eligible → they sign (bonus paid, logo on the bike).
  pitch(id) {
    const g = this.game;
    const s = this.byId(id);
    if (!s) return { ok: false, msg: 'That sponsor is gone.' };
    if (this.isActive(id)) return { ok: false, msg: `${s.name} already backs you.` };
    if (!this.eligible(s)) {
      return { ok: false, msg: `${s.name} passed for now. "${this._reqHint(s)}"` };
    }
    g.state.sponsors.push(id);
    if (!g.bike.sponsors) g.bike.sponsors = [];
    g.bike.sponsors.push(s.name);
    g.addMoney(s.bonus);
    g.addNews(`${s.logo} ${s.name} signed ${g.rider.name}! $${s.bonus} signing bonus.`, 'sponsor');
    g.memory.record({
      type: 'world',
      title: `${s.name} Deal`,
      summary: `${s.name} (${s.tier}) put their logo on your bike — a $${s.bonus} bonus and contingency money for good results.`,
      emotion: ['pride'],
      tags: ['sponsor', 'milestone', s.tier === 'national' ? 'support_ladder' : 'money'],
      importance: s.tier === 'national' ? 82 : s.tier === 'regional' ? 68 : 55,
      force: true,
    });
    return { ok: true, msg: `${s.name} signed you! +$${s.bonus} bonus. Their logo is on the bike.` };
  }

  _reqHint(s) {
    if (s.tier === 'local') return 'Get a few races under your belt first.';
    if (s.tier === 'regional') return 'Come back with some podiums and points.';
    return 'Win at the front and get on a support team — then we\'ll talk.';
  }

  // Per-race contingency payouts.
  onRace({ overall }) {
    const g = this.game;
    for (const s of this.active()) {
      if (overall <= s.payThru) {
        g.addMoney(s.contingency);
        g.addNews(`${s.logo} ${s.name} paid $${s.contingency} contingency for your ${overall <= 3 ? 'podium' : 'top-5'}.`, 'sponsor');
      }
    }
  }

  // Season stipend for continuing sponsors (called at each new season).
  paySeasonStipends() {
    const g = this.game;
    let total = 0;
    for (const s of this.active()) total += s.stipend;
    if (total > 0) {
      g.addMoney(total);
      g.addNews(`Sponsor stipends for the season: $${total}.`, 'sponsor');
    }
  }
}
