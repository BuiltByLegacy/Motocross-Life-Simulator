// UI
// --
// All rendering and the week-flow driver. The driver walks each week through
// planning → scenario → (race) → summary, auto-living the steps a given
// Simulation Depth doesn't pause for (DD-0020). Plain DOM, no framework.

import { Game, SIM_DEPTHS, ordinal } from './game.js';
import { RACE_STRATEGIES, estimateForm } from './engines/raceEngine.js';
import { SERIES, CAMPS as CAMPS_REF, PART_INFO as PART_INFO_REF, RIDER_AVATARS as RIDER_AVATARS_REF, BACKGROUNDS as BACKGROUNDS_REF } from './data/content.js';
import { provenanceSummary as provSummary } from './systems/assetProvenance.js';

// tiny hyperscript helper
function el(tag, props = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== false && v != null) n.setAttribute(k, v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    const isText = typeof kid === 'string' || typeof kid === 'number';
    n.appendChild(isText ? document.createTextNode(String(kid)) : kid);
  }
  return n;
}

const PERSON_ICON = { dad: '👨', mom: '👩', coach_mike: '🧢', rival_ethan: '😤', friend_jesse: '🧒', shop_rocky: '🏪' };
const SAVE_KEY = 'legacy_mx_save_v2';

export class App {
  constructor(root) {
    this.root = root;
    this.game = null;
    this.tab = 'week';
    this.weekContent = () => el('div');
    this.digest = [];
    this.seasonDigest = [];
    this.plannerSel = [];
    this.race = null;
    this.lastResult = null;
  }

  mount() {
    this.renderTitle();
  }

  // ---- persistence ---------------------------------------------------------
  saveGame() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.game.toSave()));
    } catch (e) {
      /* storage may be unavailable (private mode); play continues in-memory */
    }
  }
  loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
  clearSave() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
  }
  continueGame() {
    const save = this.loadSave();
    if (!save) return;
    this.game = Game.load(save);
    this.tab = 'week';
    this.startWeek();
  }

  // ---- Title / setup -------------------------------------------------------
  renderTitle() {
    const thisYear = new Date().getFullYear();
    if (!this.onboard) {
      this.onboard = { step: 'campaign', campaign: 'rider', name: 'Riley', avatar: '🧒',
        birthdate: `${thisYear - 4}-05-15`, background: 'working_class', series: 'local', depth: 'detailed' };
    }
    const o = this.onboard;
    const set = (k, v) => { o[k] = v; this.renderTitle(); };
    const go = (step) => { o.step = step; this.renderTitle(); };

    const header = el('div', { class: 'title-wrap' },
      el('div', { class: 'logo-mark' }, '🏍️'),
      el('h1', {}, 'Legacy: Motocross'),
      el('div', { class: 'tagline' }, 'Create a life worth remembering.'),
    );

    let card;
    if (o.step === 'campaign') {
      const save = this.loadSave();
      card = el('div', {},
        save ? el('div', { class: 'card' },
          el('div', { class: 'eyebrow' }, 'Saved career'),
          el('h2', {}, `${save.state.rider.name}, age ${save.state.rider.age}`),
          el('button', { class: 'btn primary wide', onclick: () => this.continueGame() }, 'Continue Career →'),
        ) : null,
        save ? el('p', { class: 'faint small center' }, '— or start a new life —') : null,
        el('div', { class: 'card' },
          el('div', { class: 'eyebrow' }, 'Step 1 of 4'),
          el('h2', {}, 'Who are you?'),
          ...[['rider', '🏍️ Rider', 'You are the kid. Plan your weeks, prep the bike, ride every lap.'],
              ['parent', '👨‍👩‍👧 Parent', 'You are the parent. Money, work, family, safety — you provide, they ride.']].map(([k, lab, blurb]) =>
            el('button', { class: 'choice' + (o.campaign === k ? ' sel' : ''), onclick: () => { o.campaign = k; go('identity'); } },
              el('b', {}, lab), el('div', { class: 'tip' }, blurb))),
        ),
      );
    } else if (o.step === 'identity') {
      const nameInput = el('input', { value: o.name, maxlength: '14', oninput: (e) => (o.name = e.target.value.trim() || 'Riley') });
      const hint = el('div', { class: 'faint small', style: 'margin-top:6px' });
      const ageHint = () => {
        const by = parseInt(String(o.birthdate).slice(0, 4), 10);
        const age = Math.max(3, thisYear - by);
        const kl = age <= 6 ? '50cc' : age <= 11 ? '65cc' : age <= 13 ? '85cc' : 'Supermini';
        hint.textContent = `Starts ${thisYear} at age ${age} on a ${kl}.`;
      };
      const bday = el('input', { type: 'date', value: o.birthdate, min: `${thisYear - 8}-01-01`, max: `${thisYear - 3}-12-31`,
        oninput: (e) => { o.birthdate = e.target.value || o.birthdate; ageHint(); } });
      ageHint();
      card = el('div', { class: 'card' },
        el('div', { class: 'eyebrow' }, 'Step 2 of 4'),
        el('h2', {}, o.campaign === 'parent' ? 'Your kid' : 'Your rider'),
        el('div', { class: 'field' }, el('label', {}, 'Pick an avatar'),
          el('div', { class: 'avatar-grid' }, ...RIDER_AVATARS_REF.map((a) =>
            el('button', { class: 'av' + (o.avatar === a ? ' sel' : ''), onclick: () => set('avatar', a) }, a))),
        ),
        el('div', { class: 'field' }, el('label', {}, o.campaign === 'parent' ? "Your kid's name" : "Your rider's name"), nameInput),
        el('div', { class: 'field' }, el('label', {}, 'Birthday'), bday, hint),
        el('div', { class: 'toolbar' },
          el('button', { class: 'btn ghost', onclick: () => go('campaign') }, '‹ Back'),
          el('button', { class: 'btn primary', onclick: () => go('background') }, 'Next ›')),
      );
    } else if (o.step === 'background') {
      card = el('div', { class: 'card' },
        el('div', { class: 'eyebrow' }, 'Step 3 of 4'),
        el('h2', {}, 'How do you start?'),
        el('p', { class: 'small faint' }, 'Your background shapes money, schooling, and family.'),
        ...BACKGROUNDS_REF.map((bgd) =>
          el('button', { class: 'choice' + (o.background === bgd.id ? ' sel' : ''), onclick: () => set('background', bgd.id) },
            el('b', {}, `${bgd.icon} ${bgd.label}`), el('div', { class: 'tip' }, bgd.blurb))),
        el('div', { class: 'toolbar' },
          el('button', { class: 'btn ghost', onclick: () => go('identity') }, '‹ Back'),
          el('button', { class: 'btn primary', onclick: () => go('options') }, 'Next ›')),
      );
    } else {
      card = el('div', { class: 'card' },
        el('div', { class: 'eyebrow' }, 'Step 4 of 4'),
        el('h2', {}, 'How do you want to play?'),
        el('div', { class: 'field' }, el('label', {}, 'Simulation depth'),
          el('div', { class: 'depth-grid' }, ...Object.values(SIM_DEPTHS).map((d) =>
            el('div', { class: 'depth-card' + (o.depth === d.key ? ' selected' : ''), onclick: () => set('depth', d.key) },
              el('b', {}, d.label), el('div', { class: 'small muted' }, d.blurb)))),
        ),
        el('p', { class: 'small faint' }, "You'll build your race program — which events to attend — when the season starts."),
        el('div', { class: 'toolbar' },
          el('button', { class: 'btn ghost', onclick: () => go('background') }, '‹ Back'),
          el('button', { class: 'btn primary', onclick: () => this.startGame({ ...o }) }, `Begin — ${thisYear} Season`)),
      );
    }

    const view = el('div', {}, header, card,
      el('p', { class: 'faint small center' }, 'Prototype · Legacy Studios · Build memories, not mechanics.'));
    this.root.replaceChildren(view);
    window.scrollTo(0, 0);
  }

  startGame(o) {
    this.clearSave(); // a fresh life replaces any prior save
    this.game = new Game({ riderName: o.name, depth: o.depth, birthdate: o.birthdate, campaign: o.campaign,
      avatar: o.avatar, background: o.background, seed: Date.now() });
    this.onboard = null;
    this.tab = 'week';
    this.startWeek();
  }

  // ---- Frame ---------------------------------------------------------------
  render() {
    const g = this.game;
    const content = this.tab === 'week'
      ? (this._seasonView ? this.viewSeasonBoard() : this.weekContent())
      : this.renderTab();
    const view = el('div', { class: 'screen' },
      el('div', { class: 'sticky-head' },
        this.renderTopbar(),
        this.renderStats(),
      ),
      el('div', { class: 'scroll-area' }, content),
      this.renderTabs(),
    );
    this.root.replaceChildren(view);
  }

  renderTopbar() {
    const g = this.game;
    const meta = g.meta() ?? { title: 'Season Over' };
    const supportLabels = ['Family Supported', 'Local Shop Rider', 'Dealer Supported', 'Regional Support'];
    return el('div', { class: 'topbar' },
      el('div', { class: 'brand' },
        el('span', { style: 'margin-right:4px' }, g.rider.avatar ?? '🧒'),
        g.isParent ? el('span', {}, 'Raising ', g.rider.name) : el('span', {}, g.rider.name),
        el('small', {}, ` · age ${g.rider.age} · ${g.rider.klass}`),
      ),
      el('div', {},
        el('span', { class: 'badge amber' }, `${g.series.icon} ${g.seasonYear} · Wk ${Math.min(g.week, 12)}/12`),
        ' ',
        el('span', { class: 'badge' }, g.isParent ? '👨‍👩‍👧 Parent' : '🏍️ Rider'),
        ' ',
        el('span', { class: 'badge' }, supportLabels[g.family.support_level] ?? 'Supported'),
      ),
    );
  }

  meter(value, invert = false) {
    const pct = Math.max(0, Math.min(100, value));
    let cls = 'meter';
    const good = invert ? pct < 40 : pct > 55;
    const bad = invert ? pct > 70 : pct < 30;
    if (bad) cls += ' bad';
    else if (!good) cls += ' warn';
    return el('div', { class: cls }, el('span', { style: `width:${pct}%` }));
  }

  renderStats() {
    const g = this.game;
    const r = g.rider;
    const stat = (k, v, meterVal, invert) =>
      el('div', { class: 'stat' },
        el('div', { class: 'k' }, k),
        el('div', { class: 'v mono' }, v),
        meterVal != null ? this.meter(meterVal, invert) : null,
      );
    if (g.isParent) {
      const marriage = g.rel('spouse');
      const marriageScore = Math.max(0, Math.min(100, 60 + (marriage.get('agreement') - 50) - (marriage.get('strain') - 20)));
      return el('div', { class: 'stats' },
        stat('Kid age', r.age),
        stat('Money', '$' + g.family.money.toLocaleString()),
        stat('Kid morale', r.confidence, r.confidence),
        stat('Kid burnout', r.burnout ?? 0, r.burnout ?? 0, true),
        stat('Your stress', g.family.stress, g.family.stress, true),
        stat('Marriage', marriageScore, marriageScore),
        stat('Bike condition', g.bike.condition, g.bike.condition),
        stat('Season points', g.state.season.points),
      );
    }
    return el('div', { class: 'stats' },
      stat('Age', r.age),
      stat('Money', '$' + g.family.money.toLocaleString()),
      stat('Confidence', r.confidence, r.confidence),
      stat('Fatigue', r.fatigue, r.fatigue, true),
      stat('Bike condition', g.bike.condition, g.bike.condition),
      stat('Reliability', g.bike.reliability, g.bike.reliability),
      stat('Household stress', g.family.stress, g.family.stress, true),
      stat('Season points', g.state.season.points),
      stat('Best finish', g.state.season.bestFinish ? ordinal(g.state.season.bestFinish) : '—'),
    );
  }

  renderTabs() {
    const tabs = [
      ['week', '📅', 'Week'],
      ['stats', '📊', 'Stats'],
      ['garage', '🏠', 'Garage'],
      ['market', '📱', 'Market'],
      ['sponsors', '💰', 'Sponsors'],
      ['people', '👥', 'People'],
      ['journal', '📓', 'Journal'],
    ];
    return el('nav', { class: 'tabbar' },
      ...tabs.map(([k, icon, label]) =>
        el('button', {
          class: 'tabitem' + (this.tab === k ? ' active' : ''),
          onclick: () => { this.tab = k; this.render(); window.scrollTo(0, 0); },
        },
          el('span', { class: 'ti-icon' }, icon),
          el('span', { class: 'ti-label' }, label),
        )
      )
    );
  }

  renderTab() {
    switch (this.tab) {
      case 'stats': return this.renderStatsTab();
      case 'sponsors': return this.renderSponsorsTab();
      case 'garage': return this.renderGarage();
      case 'market': return this.renderMarket();
      case 'people': return this.renderPeople();
      case 'journal': return this.renderJournal();
      default: return this.weekContent();
    }
  }

  showWeek(fn) {
    this.weekContent = fn;
    this.tab = 'week';
    this._seasonView = false;
    this.render();
  }

  // ---- Week flow -----------------------------------------------------------
  startWeek() {
    const g = this.game;
    if (g.isSeasonOver()) return this.renderRecap();
    g.prepareWeek();
    this.saveGame(); // autosave at each week boundary
    this.digest = [];
    // Build your race program at season start (issue #22).
    if (g.week === 1 && !g.state.programSet && g.state.simDepth !== 'fast') {
      this._programSel = { ...g.state.program };
      return this.showWeek(() => this.viewProgramBuilder(false));
    }
    this.handlePlanning();
  }

  handlePlanning() {
    const g = this.game;
    if (g.depth.autoPlan) {
      // Auto: attend a day camp on camp weeks if affordable.
      if (g.meta()?.camp && g.family.money > 500) {
        const r = g.attendCamp('day');
        if (r.ok) this.digest.push({ type: 'camp', ...r });
      }
      const picks = g.autoPlan();
      const results = g.runSchedule(picks);
      this.digest.push({ type: 'plan', results, auto: true });
      this.handleScenario();
    } else if (!g.isParent && g.meta()?.camp && this._campWeek !== g.week) {
      this.showWeek(() => this.viewCampChoice());
    } else if (g.isParent) {
      this.plannerSel = [];
      this.showWeek(() => this.viewPlanner());
    } else {
      this.boardSel = {};
      this._pickingSlot = null;
      this._pickingStat = null;
      this.showWeek(() => this.viewWeekBoard());
    }
  }

  submitBoard() {
    const g = this.game;
    // Preserve slot order from the board so effects resolve day-by-day.
    const order = g.weekSlots().map((s) => s.id);
    const entries = order.filter((id) => this.boardSel[id]).map((id) => this.boardSel[id]);
    const results = g.runSchedule(entries);
    this.digest.push({ type: 'plan', results, auto: false });
    this.handleScenario();
  }

  submitPlan() {
    const g = this.game;
    const results = g.runSchedule(this.plannerSel);
    this.digest.push({ type: 'plan', results, auto: false });
    this.handleScenario();
  }

  handleScenario() {
    const g = this.game;
    const sc = g.drawScenario();
    if (sc && g.shouldPauseForScenario(sc)) {
      this.showWeek(() => this.viewScenario(sc));
    } else {
      if (sc) {
        const r = g.autoResolveScenario(sc);
        this.digest.push({ type: 'scenario', ...r, auto: true });
      } else {
        this.digest.push({ type: 'quiet' });
      }
      this.handleRaceOrSummary();
    }
  }

  onScenarioChoice(sc, idx) {
    const r = this.game.resolveScenario(sc, idx);
    this.digest.push({ type: 'scenario', ...r });
    this.handleRaceOrSummary();
  }

  handleRaceOrSummary() {
    const g = this.game;
    if (g.isRaceWeek()) {
      if (g.mustMissRace()) {
        g.recordMissedRace();
        this.digest.push({ type: 'missed', race: g.meta().race, injury: g.rider.injury });
        if (g.depth.autoRace && g.depth.autoPlan) return this.finishWeek();
        this.showWeek(() => this.viewMissedRace());
        return;
      }
      if (g.depth.autoRace) {
        const race = g.buildRace();
        const result = race.simulateRemaining('steady');
        g.applyRaceResult(result);
        this.digest.push({ type: 'race', result });
        this.finishWeek();
      } else {
        this._enterExtras = new Set();
        this._extraResults = null;
        this.showWeek(() => this.viewRaceIntro());
      }
    } else {
      this.finishWeek();
    }
  }

  finishWeek() {
    const g = this.game;
    if (g.depth.autoRace && g.depth.autoPlan) {
      // Fast Sim: don't stop, fold the week into the season digest and roll on.
      this.seasonDigest.push({ week: g.week, title: g.meta()?.title, digest: this.digest });
      g.advanceWeek();
      return this.startWeek();
    }
    this.showWeek(() => this.viewWeekSummary());
  }

  nextWeek() {
    const g = this.game;
    this.seasonDigest.push({ week: g.week, title: g.meta()?.title, digest: this.digest });
    g.advanceWeek();
    this.startWeek();
  }

  // ---- Week screens --------------------------------------------------------
  viewPlanner() {
    const g = this.game;
    const meta = g.meta();
    const slots = g.planningSlots();
    const sel = this.plannerSel;

    const grid = el('div', { class: 'activity-grid' },
      ...g.availableActivities().map((a) => {
        const id = a.id;
        const isSel = sel.includes(id);
        const cost = id === 'wrench' && g.family.support_level >= 1 ? 0 : a.cost;
        return el('div', {
          class: 'activity' + (isSel ? ' selected' : ''),
          onclick: () => {
            const i = sel.indexOf(id);
            if (i >= 0) sel.splice(i, 1);
            else if (sel.length < slots) sel.push(id);
            this.render();
          },
        },
          cost ? el('div', { class: 'a-cost' }, '$' + cost) : null,
          el('div', { class: 'a-top' }, a.icon, ' ', a.name),
          el('div', { class: 'a-desc' }, a.desc),
        );
      })
    );

    return el('div', {},
      el('div', { class: 'card' },
        el('div', { class: 'eyebrow' }, meta.race ? '🏁 Race Week — one prep slot' : 'Weekly Planner'),
        el('h2', {}, meta.title),
        el('p', { class: 'muted' }, meta.note ?? (meta.race ? `${meta.race.name} is this weekend. Make your prep count.` : '')),
        g.rider.injury ? el('div', { class: 'hint' }, `⚠️ Injured: ${g.rider.injury.name} (${g.rider.injury.weeksOut} wk). Rest helps it heal.`) : null,
        el('p', { class: 'small faint' }, `Choose ${slots} for the week (${sel.length}/${slots} picked).`),
        grid,
        el('div', { class: 'toolbar' },
          el('button', { class: 'btn primary', disabled: sel.length !== slots, onclick: () => this.submitPlan() },
            meta.race ? 'Lock in prep →' : 'Live the week →'),
        ),
      ),
    );
  }

  // ---- Camp choice (issue #5) ---------------------------------------------
  viewCampChoice() {
    const g = this.game;
    const meta = g.meta();
    const decide = (id) => {
      this._campWeek = g.week;
      if (id !== 'skip') {
        const r = g.attendCamp(id);
        this.digest.push({ type: 'camp', ...r });
        if (id === 'week' && r.ok) { this.handleScenario(); return; } // week camp eats the week
      }
      this.boardSel = {};
      this._pickingSlot = null;
      this.showWeek(() => this.viewWeekBoard());
    };
    return el('div', {},
      el('div', { class: 'card' },
        el('div', { class: 'eyebrow' }, '🏕️ Summer Camp'),
        el('h2', {}, meta.title.replace(' · 🏕️ Camp', '')),
        el('p', { class: 'muted' }, 'A training camp is running this week. Camps are the fastest way to get better — for a price.'),
        el('button', { class: 'choice', onclick: () => decide('week') },
          el('b', {}, `🏕️ Week-long camp — $${CAMPS_REF.week.cost}`),
          el('div', { class: 'tip' }, CAMPS_REF.week.desc + ' (uses the whole week)'),
        ),
        el('button', { class: 'choice', onclick: () => decide('day') },
          el('b', {}, `📋 Day camp — $${CAMPS_REF.day.cost}`),
          el('div', { class: 'tip' }, CAMPS_REF.day.desc + ' (you still plan the rest of the week)'),
        ),
        el('button', { class: 'choice', onclick: () => decide('skip') },
          el('b', {}, '🚫 Skip the camp'),
          el('div', { class: 'tip' }, 'Save the money and train on your own this week.'),
        ),
      ),
    );
  }

  // ---- Race program builder (issue #22) -----------------------------------
  viewProgramBuilder(edit) {
    const g = this.game;
    const pool = g.eventPool();
    const weeks = Object.keys(pool).map(Number).sort((a, b) => a - b);
    const sel = this._programSel;
    const levelChip = (lvl) => el('span', { class: 'sp-tier ' + lvl }, lvl);
    const cost = weeks.reduce((s, w) => { const ev = pool[w].find((e) => e.id === sel[w]); return s + (ev ? ev.entry : 0); }, 0);

    const weekBlock = (w) => {
      const opts = pool[w];
      const locked = edit && w < g.week; // can't change a weekend that's already happened
      const rows = opts.map((ev) =>
        el('button', {
          class: 'prog-opt' + (sel[w] === ev.id ? ' on' : '') + (locked ? ' locked' : ''),
          onclick: locked ? undefined : () => { sel[w] = ev.id; this.render(); },
        },
          el('div', {}, el('b', {}, ev.name), ' ', levelChip(ev.level)),
          el('div', { class: 'faint small' }, `${ev.riders} riders · ${ev.travel} · entry $${ev.entry}`),
        )
      );
      rows.push(el('button', {
        class: 'prog-opt' + (!sel[w] ? ' on' : '') + (locked ? ' locked' : ''),
        onclick: locked ? undefined : () => { delete sel[w]; this.render(); },
      }, el('b', {}, '🚫 Skip this weekend'), el('div', { class: 'faint small' }, 'A free weekend to practice or rest.')));
      return el('div', { class: 'prog-week' },
        el('div', { class: 'prog-week-head' }, `Weekend · Week ${w}`, locked ? el('span', { class: 'faint small' }, ' (done)') : null),
        ...rows,
      );
    };

    return el('div', {},
      el('div', { class: 'card' },
        el('div', { class: 'eyebrow' }, '🗓️ ' + g.seasonYear + ' Race Program'),
        el('h2', {}, 'Build your schedule'),
        el('p', { class: 'small muted' }, 'Run the local rounds, or travel to the big regional and national events. Pick which events to attend — you can only be one place each weekend, and entries add up.'),
        this.programGoals(),
        el('div', { class: 'prog-summary' },
          el('span', {}, `Booked entries: `, el('b', {}, '$' + cost)),
          el('span', { class: 'faint' }, ` · You have $${g.family.money.toLocaleString()}`),
        ),
        ...weeks.map(weekBlock),
        this.programReview(),
        el('div', { class: 'toolbar', style: 'margin-top:12px' },
          edit ? el('button', { class: 'btn ghost', onclick: () => { this._seasonView = true; this.render(); } }, 'Cancel') : null,
          el('button', { class: 'btn primary', onclick: () => this.confirmProgram(edit) },
            edit ? 'Save program' : 'Lock in the program →'),
        ),
      ),
    );
  }

  // Season goals (issue #54) — toggle priorities that shape the plan review.
  programGoals() {
    const g = this.game;
    const goals = g.state.seasonGoals ?? (g.state.seasonGoals = []);
    const opts = [
      ['win_title', '🏆 Win a title'],
      ['qualify_lorettas', "🎟️ Qualify for Loretta's"],
      ['preserve_budget', '💰 Keep the budget'],
      ['family_time', '🏡 Family time'],
    ];
    return el('div', { class: 'field', style: 'margin:0 0 10px' },
      el('label', {}, "This year's goals"),
      el('div', { class: 'goal-chips' },
        ...opts.map(([k, label]) =>
          el('button', { class: 'goal-chip' + (goals.includes(k) ? ' on' : ''), onclick: () => {
            const i = goals.indexOf(k); if (i >= 0) goals.splice(i, 1); else goals.push(k); this.render();
          } }, label)),
      ),
    );
  }

  // Live budget/travel forecast + plan review (issues #55, #57).
  programReview() {
    const g = this.game;
    const planner = g.buildPlanner(this._programSel);
    const r = planner.reviewSummary(g.family.money);
    const b = planner.forecast(g.family.money).season;
    const line = (k, v) => el('div', { class: 'fc-row' }, el('span', { class: 'faint' }, k), el('span', { class: 'mono' }, '$' + v));
    return el('div', { class: 'prog-review' },
      el('div', { class: 'eyebrow' }, '📋 Plan Review'),
      el('div', { class: 'small' }, `${r.totalRaces} races · ${b.travelDays} days on the road · est. $${b.total}`),
      el('div', { class: 'fc-grid' },
        line('Entries', b.entry), line('Fuel', b.fuel), line('Lodging', b.lodging),
        line('Food', b.food), line('Maintenance', b.maintenance), line('Contingency', b.contingency),
      ),
      r.overBudget ? el('div', { class: 'hint', style: 'margin-top:8px' }, `⚠️ About $${r.shortfall} past your money — you'll be earning and selling to cover it.`) : null,
      ...r.riskNotes.slice(0, 4).map((n) => el('div', { class: 'small', style: 'color:var(--gold);margin-top:4px' }, '• ' + n)),
      ...this.lorettaPathNotes(),
    );
  }

  // Road to Loretta's path warnings for the current selection (issue #62).
  lorettaPathNotes() {
    const g = this.game;
    const warns = g.lorettaWarnings(this._programSel);
    return warns.map((w) => {
      const color = w.severity === 'high' ? 'var(--red)' : 'var(--gold)';
      return el('div', { class: 'small', style: `color:${color};margin-top:4px` },
        el('span', {}, '🏁 ' + w.message),
        w.action ? el('span', { class: 'faint' }, ' — ' + w.action) : null);
    });
  }

  confirmProgram(edit) {
    this.game.setProgram(this._programSel);
    this.saveGame();
    if (edit) { this._seasonView = true; this.render(); }
    else this.handlePlanning();
  }

  // Road to Loretta's dream tracker (issue #61). Null until the path is active.
  lorettaDreamPanel() {
    const g = this.game;
    const d = g.lorettas.dreamSummary();
    if (!d.active) return null;
    const stageLabel = { none: 'Chasing', area: 'Area cleared', regional: 'Loretta’s bound!', national: 'At the Ranch' }[d.furthestStage] ?? 'Chasing';
    const cls = d.qualifiedForNational ? 'lorettas-panel qualified' : 'lorettas-panel';
    return el('div', { class: cls },
      el('div', { class: 'eyebrow' }, '🏆 Road to Loretta’s'),
      el('div', { class: 'lp-head' }, d.headline),
      el('div', { class: 'lp-track' },
        ...['area', 'regional', 'national'].map((s, i) => {
          const order = { none: -1, area: 0, regional: 1, national: 2 }[d.furthestStage];
          const on = order >= i;
          const label = ['Area', 'Regional', "Loretta's"][i];
          return el('div', { class: 'lp-step' + (on ? ' on' : '') },
            el('span', { class: 'lp-dot' }, on ? '●' : '○'), el('span', {}, label));
        }),
      ),
      d.region ? el('div', { class: 'small faint' }, `${d.region} region · ${d.totalAttempts} attempt${d.totalAttempts === 1 ? '' : 's'} · ${stageLabel}`) : null,
    );
  }

  // ---- Season / monthly calendar (issue #5) -------------------------------
  viewSeasonBoard() {
    const g = this.game;
    const cal = g.state.calendar;
    return el('div', {},
      this.lorettaDreamPanel(),
      el('div', { class: 'card' },
        el('div', { class: 'eyebrow' }, `${g.series.icon} ${g.series.label} · ${g.seasonYear}`),
        el('div', { style: 'display:flex;justify-content:space-between;align-items:center' },
          el('h2', { style: 'margin:0' }, 'Season Calendar'),
          el('div', { class: 'toolbar' },
            el('button', { class: 'btn ghost small', onclick: () => { this._programSel = { ...g.state.program }; this._seasonView = false; this.showWeek(() => this.viewProgramBuilder(true)); } }, '✏️ Program'),
            el('button', { class: 'btn ghost small', onclick: () => { this._seasonView = false; this.render(); } }, '📅 This week'),
          ),
        ),
        el('p', { class: 'small faint' }, 'Your year at a glance. Races are fixed; camps are yours to attend or skip.'),
        el('div', { class: 'season-grid' },
          ...cal.map((c) => {
            const isNow = c.week === g.week;
            const kind = c.race ? 'race' : c.camp ? 'camp' : 'open';
            return el('div', { class: 'season-cell ' + kind + (isNow ? ' now' : '') },
              el('div', { class: 'sc-week' }, 'Wk ' + c.week + (isNow ? ' • now' : '')),
              el('div', { class: 'sc-title' }, c.race ? '🏁 ' + c.race.name : c.camp ? '🏕️ Camp week' : c.title),
              c.race ? el('div', { class: 'sc-sub' }, `${c.race.riders} riders`) : null,
            );
          }),
        ),
      ),
    );
  }

  // ---- 7-day week board (issue #5) ----------------------------------------
  viewWeekBoard() {
    const g = this.game;
    const meta = g.meta();
    const board = g.weekBoard();
    const homeschool = g.state.schoolMode === 'homeschool';
    const assignedCount = Object.keys(this.boardSel).filter((k) => this.boardSel[k]).length;

    const dayCard = (d) => {
      const kindBadge = {
        school: '🏫 School', home: '🏠 Homeschool', preschool: '🧸 Preschool', race: '🏁 RACE', weekend: '☀️ Weekend',
      }[d.kind];
      const slotEls = d.slots.length
        ? d.slots.map((s) => this.slotEl(s, d))
        : [el('div', { class: 'slot empty-day' }, d.kind === 'race' ? 'Race day' : d.kind === 'preschool' ? 'Too little to train' : 'No time today')];
      return el('div', { class: 'day-card ' + d.kind },
        el('div', { class: 'day-head' }, el('b', {}, d.label), el('span', { class: 'day-kind' }, kindBadge)),
        ...slotEls,
      );
    };

    return el('div', {},
      el('div', { class: 'card' },
        el('div', { style: 'display:flex;justify-content:space-between;align-items:center' },
          el('div', { class: 'eyebrow' }, meta.race ? '🏁 Race Week' : `${g.seasonYear} · Week ${g.week}`),
          el('button', { class: 'btn ghost small', onclick: () => { this._seasonView = true; this.render(); } }, '🗓️ Season'),
        ),
        el('h2', {}, meta.title),
        el('p', { class: 'muted small' }, meta.race
          ? `${meta.race.name} is this weekend. Fill the week to get ready.`
          : (meta.note ?? 'Plan the week. Track days take a full weekend day; evenings are for lighter work.')),
        el('p', { class: 'small faint' }, homeschool
          ? 'Homeschooled: you can ride some weekdays — but still fit schoolwork in, or grades slip.'
          : (g.rider.age <= 5 ? 'Too little for a real program yet — mostly weekend yard laps.'
            : 'In school on weekdays: ride on weekends, train lighter after school.')),
        el('div', { class: 'week-grid' }, ...board.map(dayCard)),
        this._pickingSlot ? this.slotPicker() : null,
        el('div', { class: 'toolbar', style: 'margin-top:12px' },
          el('button', { class: 'btn primary', onclick: () => this.submitBoard() },
            assignedCount ? `Live the week (${assignedCount} planned) →` : 'Skip the week →'),
        ),
      ),
    );
  }

  slotEl(slot, day) {
    const g = this.game;
    const entry = this.boardSel[slot.id];
    if (entry) {
      const act = g.activityById(entry.id);
      const label = act.dynamicLabel ? act.dynamicLabel(g) : act.name;
      const icon = act.dynamicIcon ? act.dynamicIcon(g) : act.icon;
      return el('div', { class: 'slot filled', onclick: () => { delete this.boardSel[slot.id]; this.render(); } },
        el('span', {}, icon + ' '),
        el('span', { class: 'slot-name' }, entry.stat ? `${label}: ${entry.stat}` : label),
        el('span', { class: 'slot-x' }, '×'),
      );
    }
    const isFull = slot.type === 'full';
    return el('div', { class: 'slot open' + (this._pickingSlot === slot.id ? ' picking' : ''), onclick: () => { this._pickingSlot = slot.id; this._pickingStat = null; this.render(); } },
      el('span', { class: 'slot-plus' }, '＋'),
      el('span', { class: 'faint small' }, isFull ? 'Full day' : 'Evening'),
    );
  }

  slotPicker() {
    const g = this.game;
    const slot = g.weekSlots().find((s) => s.id === this._pickingSlot);
    if (!slot) return null;

    // Stage 2: pick a stat for focused training.
    if (this._pickingStat) {
      const stats = ['starts', 'cornering', 'jumping', 'whoops', 'raceIQ', 'consistency', 'fitness'];
      return el('div', { class: 'picker' },
        el('div', { class: 'picker-head' }, 'Focused training — pick a skill'),
        el('div', { class: 'picker-list' },
          ...stats.map((st) =>
            el('button', { class: 'btn small', onclick: () => { this.boardSel[slot.id] = { id: 'focused_training', stat: st }; this._pickingSlot = null; this._pickingStat = null; this.render(); } },
              `${st} (${g.rider.skills[st]})`)
          ),
        ),
        el('button', { class: 'btn ghost small', onclick: () => { this._pickingStat = null; this.render(); } }, '‹ Back'),
      );
    }

    const options = g.availableActivities().filter((a) => g.slotAccepts(slot, a));
    return el('div', { class: 'picker' },
      el('div', { class: 'picker-head' }, slot.type === 'full' ? 'Full day — pick an activity' : 'Evening — pick a light activity'),
      el('div', { class: 'picker-list' },
        ...options.map((a) => {
          const cost = g._activityCost(a);
          const label = a.dynamicLabel ? a.dynamicLabel(g) : a.name;
          const icon = a.dynamicIcon ? a.dynamicIcon(g) : a.icon;
          return el('button', { class: 'btn small picker-opt', onclick: () => {
            if (a.needsStat) { this._pickingStat = true; this.render(); return; }
            this.boardSel[slot.id] = { id: a.id }; this._pickingSlot = null; this.render();
          } },
            el('span', {}, `${icon} ${label}`),
            cost ? el('span', { class: 'pick-cost' }, '$' + cost) : null,
          );
        }),
      ),
      el('button', { class: 'btn ghost small', onclick: () => { this._pickingSlot = null; this.render(); } }, 'Cancel'),
    );
  }

  viewScenario(sc) {
    const g = this.game;
    return el('div', {},
      el('div', { class: 'card' },
        el('div', { class: 'eyebrow' }, '📖 ' + sc.category),
        el('h2', {}, sc.title),
        el('p', {}, sc.text(g)),
        el('hr', { class: 'divider' }),
        ...sc.choices.map((c, i) =>
          el('button', { class: 'choice', onclick: () => this.onScenarioChoice(sc, i) },
            el('b', {}, c.label),
            c.tip ? el('div', { class: 'tip' }, c.tip) : null,
          )
        ),
      ),
    );
  }

  viewRaceIntro() {
    const g = this.game;
    const race = g.meta().race;
    const form = estimateForm(g);
    const formWord = form > 62 ? 'Sharp' : form > 50 ? 'Solid' : form > 40 ? 'Fair' : 'Off the pace';
    const warn = [];
    if (g.bike.condition < 45) warn.push('The bike is worn — reliability is a gamble.');
    if (g.bike.reliability < 50) warn.push('Reliability is low; a DNF is possible.');
    if (g.rider.fatigue > 60) warn.push(`${g.isParent ? 'They look' : "You're"} run down — a late-race fade is likely.`);
    if (g.rider.injury) warn.push(`${g.isParent ? 'The kid is' : "You're"} racing hurt (${g.rider.injury.name}).`);

    if (g.isParent) return this.viewParentRaceIntro(race, form, formWord, warn);

    return el('div', {},
      el('div', { class: 'card' },
        el('div', { class: 'eyebrow' }, race.kind === 'regional' ? '🏆 Regional Qualifier' : '🏁 Race Day'),
        el('h2', {}, race.name),
        el('p', { class: 'muted' }, `${race.motos} motos · ${race.laps} laps each · ${race.riders ?? (g.world.field().length + 1)} riders on the gate.`),
        el('p', {}, `Your form: `, el('b', { style: 'color:var(--amber-2)' }, `${formWord} (${form})`)),
        warn.length ? el('div', { class: 'hint' }, '⚠️ ' + warn.join(' ')) : el('p', { class: 'small faint' }, 'The bike and body feel ready.'),
        this.classEntrySection(),
        el('hr', { class: 'divider' }),
        el('div', { class: 'strat-grid' },
          el('button', { class: 'btn primary', onclick: () => this.startInteractiveRace() }, '🏁 Ride it lap-by-lap'),
          el('button', { class: 'btn', onclick: () => this.quickSimRace() }, '⏩ Quick-sim the result'),
        ),
      ),
    );
  }

  // Class-entry toggles when the rider owns bikes for more than one eligible
  // class (issue #4). The race-bike class is always entered; extras are ridden
  // lap-by-lap for the primary and auto-simmed for the rest.
  classEntrySection() {
    const g = this.game;
    const entries = g.enterableClasses();
    if (entries.length <= 1) return null;
    const primary = entries[0].klass;
    return el('div', { style: 'margin-top:10px' },
      el('div', { class: 'small faint' }, `You're eligible for multiple classes and have the bikes. Enter more than one?`),
      el('div', { class: 'class-entry' },
        ...entries.map((e) => {
          const isPrimary = e.klass === primary;
          const on = isPrimary || this._enterExtras.has(e.klass);
          return el('label', { class: 'class-chip' + (on ? ' on' : '') },
            el('input', { type: 'checkbox', ...(on ? { checked: 'checked' } : {}), disabled: isPrimary ? 'disabled' : false,
              onchange: (ev) => { if (ev.target.checked) this._enterExtras.add(e.klass); else this._enterExtras.delete(e.klass); this.render(); } }),
            el('span', {}, `${e.klass}${isPrimary ? ' (race bike)' : ''}`),
          );
        }),
      ),
    );
  }

  raceEntries() {
    const g = this.game;
    const entries = g.enterableClasses();
    if (entries.length <= 1) return entries;
    const primary = entries[0];
    const extras = entries.slice(1).filter((e) => this._enterExtras.has(e.klass));
    return [primary, ...extras];
  }

  runExtraClasses(entries) {
    const g = this.game;
    this._extraResults = entries.slice(1).map((e) => g.simulateClassEntry(e, 'steady'));
  }

  viewParentRaceIntro(race, form, formWord, warn) {
    const g = this.game;
    if (this._payPit === undefined) this._payPit = false;
    const canPay = g.family.money >= 60;
    return el('div', {},
      el('div', { class: 'card' },
        el('div', { class: 'eyebrow' }, race.kind === 'regional' ? '🏆 Regional Qualifier' : '🏁 Race Day'),
        el('h2', {}, race.name),
        el('p', { class: 'muted' }, `${g.rider.name} is on the gate. ${race.motos} motos · ${race.laps} laps · ${race.riders ?? (g.world.field().length + 1)} riders.`),
        el('p', {}, `Their form: `, el('b', { style: 'color:var(--amber-2)' }, `${formWord} (${form})`)),
        warn.length ? el('div', { class: 'hint' }, '⚠️ ' + warn.join(' ')) : el('p', { class: 'small faint' }, 'The bike and the kid look ready.'),
        el('hr', { class: 'divider' }),
        el('label', { class: 'pit-toggle' },
          el('input', { type: 'checkbox', ...(this._payPit ? { checked: 'checked' } : {}), disabled: !canPay,
            onchange: (e) => { this._payPit = e.target.checked; } }),
          el('span', {}, ` Hire pit support for $60 ${canPay ? '(steadier bike, better start)' : '— not enough money'}`),
        ),
        el('p', { class: 'small faint', style: 'margin-top:10px' }, 'What do you tell them at the gate?'),
        el('div', {},
          ...Object.entries(g.RACE_STANCES).map(([k, s]) =>
            el('button', { class: 'choice', onclick: () => this.startParentRace(k) },
              el('b', {}, s.label),
              el('div', { class: 'tip' }, k === 'push' ? 'Best result — but more pressure and burnout.'
                : k === 'safe' ? 'Protects them; a more conservative ride.'
                : 'Lightest on the kid; keeps the love of it alive.'),
            )
          ),
        ),
      ),
    );
  }

  startParentRace(stanceKey) {
    const g = this.game;
    const strategy = g.prepParentRace(stanceKey, this._payPit);
    this._payPit = false;
    const race = g.buildRace();
    const result = race.simulateRemaining(strategy);
    g.applyRaceResult(result);
    this.lastResult = result;
    this.digest.push({ type: 'race', result });
    this.showWeek(() => this.viewRaceResult(result));
  }

  viewMissedRace() {
    const g = this.game;
    const race = g.meta().race;
    return el('div', {},
      el('div', { class: 'card center' },
        el('div', { class: 'eyebrow' }, race.name),
        el('div', { class: 'result-place', style: 'color:var(--red)' }, 'DNS'),
        el('p', { class: 'muted' }, `${g.isParent ? g.rider.name + ' is' : "You're"} too hurt to race — ${g.rider.injury.name}. You had to sit this round out.`),
        el('p', { class: 'small faint' }, 'Injuries have consequences: a missed round is points you can\'t get back.'),
        el('button', { class: 'btn primary wide', onclick: () => this.finishWeek() }, 'Watch from the fence →'),
      ),
    );
  }

  quickSimRace() {
    const g = this.game;
    const entries = this.raceEntries();
    const primaryBike = entries.length ? entries[0].bike : g.bike;
    const race = g.buildRace(primaryBike);
    const result = race.simulateRemaining('steady');
    g.applyRaceResult(result);
    this.runExtraClasses(entries);
    this.lastResult = result;
    this.digest.push({ type: 'race', result });
    this.showWeek(() => this.viewRaceResult(result));
  }

  startInteractiveRace() {
    const entries = this.raceEntries();
    this._pendingEntries = entries;
    const primaryBike = entries.length ? entries[0].bike : this.game.bike;
    this.race = this.game.buildRace(primaryBike);
    this.showWeek(() => this.viewMoto());
  }

  viewMoto() {
    const g = this.game;
    const race = this.race;
    const standings = race.standings().slice(0, 8);
    const playerOut = standings.find((s) => s.isPlayer)?.out;

    const feed = el('div', { class: 'feed' },
      ...race.motoEvents.slice(-14).map((e) => el('div', { class: 'ev ' + (e.kind || '') }, e.text))
    );
    // auto-scroll feed to bottom after mount
    setTimeout(() => { feed.scrollTop = feed.scrollHeight; }, 0);

    const standingsList = el('ul', { class: 'standings' },
      ...standings.map((s) =>
        el('li', { class: (s.isPlayer ? 'me ' : '') + (s.out ? 'out' : '') },
          el('span', { class: 'p' }, s.pos),
          el('span', {}, s.isPlayer ? `${s.name} (you)` : s.name),
          s.isRival ? el('span', { class: 'rival-tag' }, 'RIVAL') : null,
          s.dnf ? el('span', { class: 'faint small' }, ' DNF') : null,
        )
      )
    );

    let controls;
    if (race.motoOver) {
      const motoNum = race.motoIndex + 1;
      controls = el('button', { class: 'btn primary wide', onclick: () => this.onMotoContinue() },
        race.hasNextMoto() ? `Moto ${motoNum} done → line up for Moto ${motoNum + 1}` : 'See the overall result →');
    } else if (playerOut) {
      controls = el('button', { class: 'btn wide', onclick: () => { while (!race.motoOver) race.stepLap('steady'); this.render(); } },
        'Watch the moto play out →');
    } else {
      controls = el('div', { class: 'strat-grid' },
        ...Object.entries(RACE_STRATEGIES).map(([k, s]) =>
          el('button', { class: 'btn' + (k === 'attack' ? ' primary' : ''), onclick: () => this.doLap(k) }, s.label)
        )
      );
    }

    return el('div', {},
      el('div', { class: 'card' },
        el('div', { class: 'race-head' },
          el('h2', {}, race.race.name),
          el('span', { class: 'moto-pill' }, `Moto ${race.motoIndex + 1}/${race.motoCount} · Lap ${Math.min(race.lapDone, race.lapsPerMoto)}/${race.lapsPerMoto}`),
        ),
        feed,
        standingsList,
        el('hr', { class: 'divider' }),
        !race.motoOver && !playerOut ? el('p', { class: 'small faint' }, 'Pick your line for the next lap:') : null,
        controls,
      ),
    );
  }

  doLap(strategy) {
    this.race.stepLap(strategy);
    this.render();
  }

  onMotoContinue() {
    const race = this.race;
    race.finishMoto();
    if (race.hasNextMoto()) {
      race.startNextMoto();
      this.render();
    } else {
      const result = race.finalize();
      this.game.applyRaceResult(result);
      if (this._pendingEntries) { this.runExtraClasses(this._pendingEntries); this._pendingEntries = null; }
      this.lastResult = result;
      this.digest.push({ type: 'race', result });
      this.showWeek(() => this.viewRaceResult(result));
    }
  }

  viewRaceResult(result) {
    const g = this.game;
    const place = result.dnf ? 'DNF' : ordinal(result.overall);
    const podium = el('div', { class: 'podium' },
      ...result.podium.map((p) =>
        el('div', { class: 'p-slot' + (p.isPlayer ? ' me' : '') },
          el('div', { class: 'faint small' }, ['🥇', '🥈', '🥉'][p.pos - 1]),
          el('div', {}, p.isPlayer ? `${p.name} (you)` : p.name),
        )
      )
    );
    const motoLine = result.motos.map((m, i) => `Moto ${i + 1}: ${m > result.fieldSize ? 'DNF' : ordinal(m)}`).join('  ·  ');

    return el('div', {},
      el('div', { class: 'card center' },
        el('div', { class: 'eyebrow' }, result.race.name),
        el('div', { class: 'result-place', style: 'color:' + (result.overall <= 3 && !result.dnf ? 'var(--gold)' : 'var(--ink)') }, place),
        el('div', { class: 'muted' }, `${result.klass ? result.klass + ' · ' : ''}${result.dnf ? 'A tough day. It happens.' : `${place} overall  ·  +${result.points} points`}`),
        (this._extraResults && this._extraResults.length) ? el('div', { class: 'extra-results' },
          ...this._extraResults.map((r) => el('div', { class: 'small' }, `${r.klass}: `, el('b', {}, r.dnf ? 'DNF' : ordinal(r.overall)), ` (+${r.points})`)),
        ) : null,
        el('div', { class: 'small faint', style: 'margin:6px 0' }, motoLine),
        podium,
        result.rivalOverall ? el('p', { class: 'small' }, `${this.game.world.rival()?.name ?? 'Your rival'} finished ${ordinal(result.rivalOverall)}. ${result.overall < result.rivalOverall ? (this.game.isParent ? 'Your kid beat the rival today.' : 'You beat your rival today.') : 'They got you this time.'}`) : null,
        el('button', { class: 'btn primary wide', onclick: () => this.finishWeek() }, 'Load up and head home →'),
      ),
    );
  }

  viewWeekSummary() {
    const g = this.game;
    const items = this.digest.map((d) => this.renderDigestItem(d)).filter(Boolean);
    const nextWeek = g.week + 1;
    return el('div', {},
      el('div', { class: 'card' },
        el('div', { class: 'eyebrow' }, `Week ${g.week} · ${g.meta()?.title ?? ''}`),
        el('h2', {}, 'How the week went'),
        ...items,
        g.state.news.length ? el('p', { class: 'small faint', style: 'margin-top:10px' }, '🗞️ ' + g.state.news[0].text) : null,
        el('hr', { class: 'divider' }),
        el('button', { class: 'btn primary wide', onclick: () => this.nextWeek() },
          g.week >= 12 ? 'Close out the season →' : `Continue to Week ${nextWeek} →`),
      ),
    );
  }

  renderDigestItem(d) {
    if (d.type === 'quiet') {
      return el('div', { class: 'digest-item' }, el('span', { class: 'faint' }, '😌 A quiet week. Nothing dramatic — and that\'s fine.'));
    }
    if (d.type === 'plan') {
      return el('div', { class: 'digest-item' },
        el('div', { class: 'small faint' }, d.auto ? 'The sim lived your week:' : 'Your week:'),
        ...d.results.map((r) => el('div', {}, `${r.icon} `, el('b', {}, r.name), ' — ', el('span', { class: 'muted' }, r.outcome))),
      );
    }
    if (d.type === 'scenario') {
      return el('div', { class: 'digest-item' },
        el('div', {}, '📖 ', el('b', {}, d.title), d.choice ? el('span', { class: 'faint' }, ` — ${d.choice}`) : null),
        el('div', { class: 'muted small' }, d.outcome),
      );
    }
    if (d.type === 'race') {
      const r = d.result;
      return el('div', { class: 'digest-item' },
        el('div', {}, '🏁 ', el('b', {}, r.race.name), ' — ', r.dnf ? 'DNF' : `${ordinal(r.overall)} overall (+${r.points} pts)`),
      );
    }
    if (d.type === 'missed') {
      return el('div', { class: 'digest-item' }, el('span', { style: 'color:var(--red)' }, `🚑 Missed ${d.race.name} — injured (${d.injury.name}).`));
    }
    if (d.type === 'camp') {
      return el('div', { class: 'digest-item' },
        el('div', {}, `${d.icon} `, el('b', {}, d.name), ' — ', el('span', { class: 'muted' }, d.outcome)),
      );
    }
    return null;
  }

  // ---- Standing tabs -------------------------------------------------------
  renderStatsTab() {
    const g = this.game;
    const s = g.rider.skills;
    const rows = [
      ['starts', 'Starts', 'Off the gate — the holeshot'],
      ['cornering', 'Cornering', 'Ruts, berms, flat turns'],
      ['jumping', 'Jumping', 'Doubles, tables, rhythm'],
      ['whoops', 'Whoops', 'The dreaded whoop section'],
      ['raceIQ', 'Race IQ', 'Lines, passing, race craft'],
      ['consistency', 'Consistency', 'Lap-to-lap, no mistakes'],
      ['fitness', 'Fitness', 'Holding on late in the moto'],
    ];
    const overall = Math.round(rows.reduce((a, [k]) => a + s[k], 0) / rows.length);
    const who = g.isParent ? `${g.rider.name}'s` : 'Your';
    return el('div', {},
      el('div', { class: 'card' },
        el('div', { class: 'eyebrow' }, 'Rider Skills' ),
        el('h2', {}, `${who} Riding — overall ${overall}`),
        el('p', { class: 'small faint' }, `${g.rider.name}, age ${g.rider.age} · ${g.rider.klass}. Skills grow through practice and training.`),
        ...rows.map(([k, label, desc]) =>
          el('div', { class: 'skill-row' },
            el('div', { class: 'skill-top' }, el('b', {}, label), el('span', { class: 'mono' }, s[k])),
            this.meter(s[k], s[k]),
            el('div', { class: 'faint small' }, desc),
          )
        ),
      ),
      this.competitionCard(),
      el('div', { class: 'card' },
        el('h3', {}, '🎯 Training'),
        el('p', { class: 'small muted' }, g.isParent
          ? 'Book track days and coaching in the weekly plan to build these up.'
          : 'Build these in the weekly plan:'),
        el('div', { class: 'small' },
          el('p', {}, '🏍️ ', el('b', {}, 'Track day'), ' — a full weekend day; builds cornering, jumping, whoops.'),
          el('p', {}, '🎯 ', el('b', {}, 'General training'), ' — a little across all skills.'),
          el('p', {}, '🔬 ', el('b', {}, 'Focused training'), ' — drill one skill you choose, harder.'),
          el('p', {}, '💪 ', el('b', {}, 'Fitness'), ' — the difference on lap five.'),
        ),
      ),
    );
  }

  // Competition Engine surface (issues #63/#66/#67): form, class progression,
  // and season standings. Null before the first race so the tab stays clean.
  competitionCard() {
    const g = this.game;
    if (!g.state.season.results.length) return null;
    const m = g.momentum.state();
    const champ = g.championshipStanding();
    const prog = g.progression.summary(g.rider.klass);
    const st = g.standings.table_({ klass: g.rider.klass }).find((r) => r.riderId === 'me');
    const formLabel = m.streak >= 3 ? '🔥 On a heater'
      : m.streak <= -3 ? '🥶 In a slump'
      : m.momentum > 20 ? '📈 Building'
      : m.momentum < -20 ? '📉 Fading' : '➖ Steady';
    return el('div', { class: 'card' },
      el('div', { class: 'eyebrow' }, '🏆 Competition'),
      el('h3', {}, `${g.rider.klass} · ${champ.pos ? ordinal(champ.pos) + ' in points' : '—'}`),
      el('div', { class: 'comp-form' },
        el('div', { class: 'skill-top' }, el('b', {}, 'Momentum'), el('span', { class: 'mono' }, formLabel)),
        this.meter(Math.round((m.momentum + 100) / 2)),
      ),
      prog.races ? el('div', { class: 'faint small', style: 'margin-top:8px' },
        `${g.rider.klass}: ${prog.races} races · best ${prog.best ? ordinal(prog.best) : '—'} · avg ${prog.avg ?? '—'} · adaptation ${prog.adaptation}%`) : null,
      st ? el('div', { class: 'faint small' }, `Season record: ${st.rounds} rounds · ${st.points} pts · ${st.wins}W ${st.podiums}P${st.dnfs ? ` · ${st.dnfs} DNF` : ''}`) : null,
    );
  }

  renderSponsorsTab() {
    const g = this.game;
    const board = g.sponsors.board();
    const active = g.sponsors.active();

    const sponsorRow = (s) => {
      const isActive = s.status === 'active';
      const conflict = s.status === 'conflict';
      const locked = s.status === 'locked';
      return el('div', { class: 'sponsor-row' + (locked || conflict ? ' locked' : '') + (isActive ? ' active' : '') },
        el('div', { class: 'sp-logo' }, s.logo),
        el('div', { class: 'sp-info' },
          el('div', {}, el('b', {}, s.name), ' ', el('span', { class: 'sp-tier ' + s.tier }, s.category)),
          el('div', { class: 'faint small' }, s.pitch),
          el('div', { class: 'small', style: 'color:var(--green)' }, `$${s.bonus} to sign · $${s.stipend}/season · $${s.contingency} per top-${s.payThru}`),
        ),
        el('div', { class: 'sp-action' },
          isActive ? el('span', { class: 'sp-check' }, '✓ On your bike')
            : conflict ? el('span', { class: 'faint small', title: `You already run a ${s.category} sponsor` }, `⛔ ${s.category} taken`)
            : locked ? el('span', { class: 'faint small' }, '🔒 Locked')
            : el('button', { class: 'btn small primary', onclick: () => this.pitchSponsor(s.id) }, 'Ask'),
        ),
      );
    };

    const tierSection = (label, tier) => el('div', { class: 'card' },
      el('h3', {}, label),
      ...board[tier].map(sponsorRow),
    );

    return el('div', {},
      el('div', { class: 'card' },
        el('div', { class: 'eyebrow' }, 'Sponsorship' ),
        el('h2', {}, 'Sponsors'),
        el('p', { class: 'small faint' }, 'Pitch local businesses for a logo on your bike. Do well, earn bigger deals. Sponsors pay to sign, a season stipend, and contingency for good finishes.'),
        active.length
          ? el('div', { class: 'sp-active-strip' }, ...active.map((s) => el('span', { class: 'sp-chip', title: s.name }, s.logo + ' ' + s.name)))
          : el('div', { class: 'empty' }, 'No sponsors yet. Go earn your first logo.'),
      ),
      tierSection('🏪 Local', 'local'),
      tierSection('🌎 Regional', 'regional'),
      tierSection('🏆 National', 'national'),
    );
  }

  pitchSponsor(id) {
    const res = this.game.sponsors.pitch(id);
    this._flash(res.msg);
    this.render();
  }

  renderPartBars(bike, compact = false) {
    const g = this.game;
    const parts = g.ensureParts(bike);
    return el('div', { class: 'parts' + (compact ? ' compact' : '') },
      ...PART_INFO_REF.map((p) => {
        const life = parts[p.key] ?? 100;
        const cls = life > 55 ? '' : life > 25 ? ' warn' : ' bad';
        return el('div', { class: 'part-row' },
          el('span', { class: 'part-name' }, `${p.icon} ${p.label}`),
          el('div', { class: 'part-bar' + cls }, el('span', { style: `width:${life}%` })),
          el('span', { class: 'part-life mono' }, `${life}%`),
        );
      }),
    );
  }

  renderGarage() {
    const g = this.game;
    const b = g.bike;
    return el('div', {},
      el('div', { class: 'card' },
        el('div', { class: 'eyebrow' }, 'The Garage — home, workshop, museum'),
        el('h2', {}, b.name),
        el('p', { class: 'small faint' }, `#${b.serial} · Condition ${b.condition} · Reliability ${b.reliability} · Handling ${b.handling} · Performance ${b.performance}`),
        this.renderPartBars(b),
        b.installed.length ? el('p', { class: 'small' }, '🔩 Installed: ' + b.installed.join(', ')) : el('p', { class: 'small faint' }, 'Bone stock, for now.'),
        (b.sponsors && b.sponsors.length) ? el('p', { class: 'small' }, '🏷️ Sponsor logos: ' + b.sponsors.join(', ')) : null,
        b.memories.length ? el('div', {},
          el('div', { class: 'small faint', style: 'margin-top:8px' }, 'This bike remembers:'),
          ...b.memories.slice(-4).map((m) => el('div', { class: 'small muted' }, `• ${m.text}`)),
        ) : null,
      ),
      g.state.garage.bikes.length ? el('div', { class: 'card' },
        el('h3', {}, '🏍️ Your Bikes'),
        ...g.ownedBikes().map((bk) => {
          const roleLabel = bk.role === 'race' ? '🏁 Race bike' : bk.role === 'practice' ? '🔧 Practice bike' : '📦 Spare';
          return el('div', { class: 'bike-row' + (bk.role === 'race' ? ' race' : '') },
            el('div', { class: 'bike-info' },
              el('div', {}, el('b', {}, bk.name), ' ', el('span', { class: 'faint small' }, roleLabel)),
              el('div', { class: 'small faint' }, `${bk.klass} · cond ${bk.condition} · rel ${bk.reliability}`),
              this.bikeProvenanceLine(bk),
              this.renderPartBars(bk, true),
            ),
            bk.role !== 'race' ? el('button', { class: 'btn small', onclick: () => { g.setRaceBike(bk.assetId); this._flash(`${bk.name} is now your race bike.`); this.render(); } }, 'Make race bike') : el('span', { class: 'faint small' }, 'Active'),
          );
        }),
      ) : null,
      el('div', { class: 'card' },
        el('h3', {}, '🏆 Trophy Shelf'),
        g.garage.trophies.length
          ? el('div', {}, ...g.garage.trophies.map((t) => el('div', {}, `🏆 ${t.name}`)))
          : el('div', { class: 'empty' }, 'No hardware yet. Earn it.'),
        el('hr', { class: 'divider' }),
        el('h3', {}, '📦 Objects With History'),
        g.garage.objects.length
          ? el('div', {}, ...g.garage.objects.map((o) => el('div', { class: 'small' }, el('b', {}, o.name), o.memory ? el('span', { class: 'muted' }, ` — ${o.memory}`) : null)))
          : el('div', { class: 'empty' }, 'Nothing here carries a story yet.'),
      ),
    );
  }

  // A bike's provenance + linked-memory count (issue #69).
  bikeProvenanceLine(bk) {
    const g = this.game;
    const prov = g.assets?.get(bk.assetId);
    if (!prov) return null;
    const mem = prov.memories?.length ? ` · ${prov.memories.length} 💭` : '';
    return el('div', { class: 'small faint', style: 'margin-top:2px' }, `📜 ${provSummary(prov)}${mem}`);
  }

  // Emoji + gradient "photo" per item — offline-safe listing images.
  itemThumb(listing, big = false) {
    const art = {
      mx33: ['🛞', '#3a3d44,#20232a'],
      holeshot: ['🚦', '#2c3a2f,#1c2620'],
      pipe: ['💨', '#3a2f24,#241d16'],
      topend: ['⚙️', '#2f3540,#1e232b'],
      chainkit: ['⛓️', '#2a2f36,#191d22'],
      brakepads: ['🛑', '#331f1f,#211313'],
      chest: ['🦺', '#3a3320,#242015'],
      susp: ['🔧', '#26333d,#182027'],
      practicebike: ['🏍️', '#33241f,#211713'],
      plate: ['🏁', '#3a3624,#242113'],
    };
    const [emoji, grad] = art[listing.key] ?? ['📦', '#2e333b,#1d2129'];
    return el('div', {
      class: 'mk-thumb' + (big ? ' big' : ''),
      style: `background:linear-gradient(150deg, ${grad});`,
    },
      el('span', { class: 'mk-emoji' }, emoji),
      listing.rare ? el('span', { class: 'mk-badge' }, 'RARE') : null,
    );
  }

  renderMarket() {
    const g = this.game;
    const listings = g.market.listings;
    const detail = listings.find((l) => l.id === this._marketDetail);

    const header = el('div', { class: 'mk-header' },
      el('div', { class: 'mk-bar' },
        el('div', { class: 'mk-search' }, '🔎 ', el('span', { class: 'faint' }, 'Search Marketplace')),
        el('div', { class: 'mk-wallet' }, '$' + g.family.money.toLocaleString()),
      ),
    );

    if (detail) {
      // Facebook-style item detail page.
      return el('div', {},
        header,
        el('button', { class: 'btn ghost small', onclick: () => { this._marketDetail = null; this._offerFor = null; this.render(); } }, '‹ Marketplace'),
        el('div', { class: 'card mk-detail' },
          this.itemThumb(detail, true),
          el('div', { class: 'mk-d-price' }, '$' + detail.price),
          el('h2', { style: 'margin:2px 0 2px' }, detail.name),
          el('div', { class: 'seller' }, `Listed by ${detail.seller} · Local pickup`),
          el('hr', { class: 'divider' }),
          el('p', {}, detail.blurb),
          el('div', { class: 'effect' }, '✔ ' + detail.effect),
          el('div', { class: 'listing-actions' },
            el('button', { class: 'btn primary', disabled: g.family.money < detail.price, onclick: () => this.doBuy(detail.id) }, 'Buy now · $' + detail.price),
            el('button', { class: 'btn', onclick: () => this.doOffer(detail) }, this._offerFor === detail.id ? 'Cancel' : 'Make an offer'),
          ),
          this._offerFor === detail.id ? this.renderOfferSheet(detail) : null,
        ),
      );
    }

    const grid = listings.length
      ? el('div', { class: 'mk-grid' },
          ...listings.map((l) =>
            el('div', { class: 'mk-card', onclick: () => { this._marketDetail = l.id; this._offerFor = null; this.render(); } },
              this.itemThumb(l),
              el('div', { class: 'mk-info' },
                el('div', { class: 'mk-price' }, '$' + l.price),
                el('div', { class: 'mk-title' }, l.name),
                el('div', { class: 'mk-seller' }, l.seller),
              ),
            )
          ),
        )
      : el('div', { class: 'card' }, el('div', { class: 'empty' }, 'Nothing listed right now. Use the "Browse the marketplace" activity during your week to refresh the board.'));

    return el('div', {},
      header,
      el('div', { class: 'mk-titlebar' },
        el('h2', { style: 'margin:0' }, "Today's Picks"),
        el('button', { class: 'btn ghost small', onclick: () => { g.market.refresh(true); this.render(); } }, '🔄 Refresh'),
      ),
      grid,
    );
  }

  renderOfferSheet(l) {
    const g = this.game;
    const low = Math.round(l.floor * 0.9);
    const mid = Math.round((l.floor + l.price) / 2);
    const fair = l.floor;
    const opts = [
      ['Lowball', low],
      ['Fair', mid],
      ['Strong', fair],
    ];
    return el('div', { class: 'offer-sheet' },
      el('div', { class: 'small faint' }, 'Offer an amount — the seller may accept, counter, or walk:'),
      el('div', { class: 'offer-btns' },
        ...opts.map(([label, amt]) =>
          el('button', {
            class: 'btn small',
            disabled: amt > g.family.money,
            onclick: () => this.submitOffer(l, amt),
          }, `${label} $${amt}`)
        ),
      ),
    );
  }

  doBuy(id) {
    const res = this.game.market.buy(id);
    if (res.ok) { this._marketDetail = null; this._offerFor = null; }
    this._flash(res.msg);
    this.render();
  }

  doOffer(listing) {
    // Toggle an inline offer sheet — no browser prompt (bad on mobile).
    this._offerFor = this._offerFor === listing.id ? null : listing.id;
    this.render();
  }

  submitOffer(listing, amount) {
    const res = this.game.market.offer(listing.id, amount);
    this._offerFor = null;
    if (res.sold || res.gone) this._marketDetail = null; // left the board
    this._flash(res.msg);
    this.render();
  }

  // Lightweight bottom toast instead of a blocking alert().
  _flash(msg) {
    if (!msg) return;
    const existing = this.root.querySelector('.toast');
    if (existing) existing.remove();
    const toast = el('div', { class: 'toast' }, msg);
    this.root.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  renderPeople() {
    const g = this.game;
    return el('div', {},
      el('div', { class: 'card' },
        el('div', { class: 'eyebrow' }, 'People, not NPCs'),
        el('h2', {}, 'The People in Your Life'),
        el('p', { class: 'small faint' }, 'Their feelings are hidden. You read them through how they act.'),
        ...g.relationships.all().map((rel) => {
          rel.updateArc();
          const arcName = (rel.rec.arcStages && rel.rec.arcStage != null) ? rel.rec.arcStages?.[rel.rec.arcStage] : null;
          return el('div', { class: 'person' },
            el('div', { class: 'avatar' }, PERSON_ICON[rel.rec.id] ?? '🙂'),
            el('div', {},
              el('div', {}, el('b', {}, rel.name), '  ', el('span', { class: 'role' }, rel.rec.role)),
              el('div', { class: 'line' }, rel.describe()),
              arcName ? el('div', { class: 'arc' }, `Arc: ${arcName}`) : null,
            ),
          );
        }),
      ),
    );
  }

  renderJournal() {
    const g = this.game;
    const memories = [...g.state.memories].sort((a, b) => b.importance - a.importance);
    const results = g.state.season.results;

    return el('div', {},
      el('div', { class: 'card' },
        el('div', { class: 'eyebrow' }, `${g.series.icon} ${g.series.label}` ),
        el('h2', {}, 'Championship'),
        (() => { const ch = g.championshipStanding(); return el('p', {}, ch.isChampion && results.length >= 5 ? el('b', { style: 'color:var(--gold)' }, '🏆 Leading the title!') : `Currently ${ordinal(ch.pos)} · ${ch.points} points`); })(),
        el('hr', { class: 'divider' }),
        el('h3', {}, 'Results'),
        results.length
          ? el('div', {}, ...results.map((r) => el('div', { class: 'small' }, `Wk ${r.week} · ${r.race} — `, el('b', {}, r.missed ? 'DNS' : r.dnf ? 'DNF' : ordinal(r.overall)), ` (+${r.points})`)))
          : el('div', { class: 'empty' }, 'No races yet.'),
        el('p', { class: 'small faint', style: 'margin-top:8px' }, `Total: ${g.state.season.points} points · Best finish ${g.state.season.bestFinish ? ordinal(g.state.season.bestFinish) : '—'}`),
      ),
      this.memoriesCard(),
      el('div', { class: 'card' },
        el('h3', {}, '🗞️ The World'),
        g.state.news.length
          ? el('div', {}, ...g.state.news.slice(0, 8).map((n) => el('div', { class: 'news-item' }, el('span', { class: 'wk' }, `Wk ${n.week} · `), n.text)))
          : el('div', { class: 'empty' }, 'Quiet in the paddock.'),
      ),
    );
  }

  // Memories card with timeline scope filters (issues #71/#72).
  memoriesCard() {
    const g = this.game;
    const scope = this._memScope ?? 'all';
    const scopes = [
      ['all', '💭 All'],
      ['family', '👨‍👩‍👧 Family'],
      ['object', '🏍️ Bikes'],
      ['racing', '🏁 Races'],
    ];
    // Map the friendly chips onto timeline queries (#72).
    const q = scope === 'all' ? { sort: 'recent' }
      : scope === 'family' ? { scope: 'family', sort: 'recent' }
      : scope === 'object' ? { scope: 'object', sort: 'recent' }
      : { tag: 'racing', sort: 'recent' };
    let memories = g.memory.query(q);
    if (scope === 'racing' && !memories.length) memories = g.memory.query({ source: 'race:finished', sort: 'recent' });
    return el('div', { class: 'card' },
      el('h3', {}, '💭 Memories'),
      el('div', { class: 'goal-chips', style: 'margin-bottom:10px' },
        ...scopes.map(([k, label]) =>
          el('button', { class: 'goal-chip' + (scope === k ? ' on' : ''), onclick: () => { this._memScope = k; this.render(); } }, label)),
      ),
      memories.length
        ? el('div', {}, ...memories.map((m) => this.renderMemory(m)))
        : el('div', { class: 'empty' }, scope === 'all' ? 'No memories yet. They\'re coming.' : 'Nothing here yet.'),
    );
  }

  renderMemory(m) {
    const g = this.game;
    // People who were part of the moment, with how they helped (issue #71).
    const parts = (m.participants ?? []).filter((p) => p.id && p.role !== 'other');
    const nameFor = (id) => g.state.relationships?.[id]?.name ?? id;
    const partLine = parts.length
      ? parts.map((p) => nameFor(p.id) + (p.support ? ` (${p.support})` : '')).join(' · ')
      : null;
    const entLine = (m.entities ?? []).filter((e) => e.name).map((e) => `${e.kind === 'bike' ? '🏍️' : '📍'} ${e.name}`).join(' · ');
    const seasonYear = g.state.startYear + (m.seasonNumber ?? 1) - 1;
    return el('div', { class: 'memory' },
      el('div', { class: 'm-title' }, m.title),
      el('div', { class: 'muted small' }, m.summary),
      partLine ? el('div', { class: 'small', style: 'color:var(--amber-2);margin-top:2px' }, '👥 ' + partLine) : null,
      entLine ? el('div', { class: 'small faint', style: 'margin-top:2px' }, entLine) : null,
      el('div', { class: 'm-meta' }, `${seasonYear} · Age ${m.riderAge} · Wk ${m.week} · importance ${m.importance}`),
      m.tags?.length ? el('div', { class: 'tags', style: 'margin-top:3px' }, ...m.tags.slice(0, 5).map((t) => el('span', {}, t))) : null,
    );
  }

  // ---- Season recap / career hub ------------------------------------------
  renderRecap() {
    const g = this.game;
    this.saveGame(); // a completed season is a resumable career
    const memories = g.memory.top(8);
    const results = g.state.season.results;
    const wins = results.filter((r) => r.overall === 1).length;
    const podiums = results.filter((r) => r.overall <= 3 && !r.dnf).length;
    const supportLabels = ['Family Supported', 'Local Shop Rider', 'Dealer Supported', 'Regional Support'];

    const closing = this.recapClosingLine(g, { wins, podiums });
    const history = g.state.careerHistory;

    const view = el('div', {},
      el('div', { class: 'title-wrap' },
        el('div', { class: 'logo-mark' }, '🏁'),
        el('h1', {}, `${g.seasonYear} Season`),
        el('div', { class: 'tagline' }, `${g.rider.name}, age ${g.rider.age} · ${g.rider.klass}`),
      ),
      el('div', { class: 'card center' },
        el('div', { class: 'stats', style: 'margin-bottom:0' },
          el('div', { class: 'stat' }, el('div', { class: 'k' }, 'Points'), el('div', { class: 'v mono' }, g.state.season.points)),
          el('div', { class: 'stat' }, el('div', { class: 'k' }, 'Best finish'), el('div', { class: 'v mono' }, g.state.season.bestFinish ? ordinal(g.state.season.bestFinish) : '—')),
          el('div', { class: 'stat' }, el('div', { class: 'k' }, 'Wins'), el('div', { class: 'v mono' }, wins)),
          el('div', { class: 'stat' }, el('div', { class: 'k' }, 'Podiums'), el('div', { class: 'v mono' }, podiums)),
        ),
        el('p', { style: 'margin-top:14px;font-size:1.05rem' }, closing),
        (() => { const ch = g.championshipStanding(); return el('p', { style: 'margin:4px 0', class: ch.isChampion ? '' : 'small' },
          ch.isChampion ? el('b', { style: 'color:var(--gold)' }, `🏆 ${g.series.label} Champion!`) : el('span', { class: 'faint' }, `Championship: ${ordinal(ch.pos)} in the ${g.series.label} (${ch.points} pts)`)); })(),
        el('p', { class: 'small faint' }, 'Support reached: ' + (supportLabels[g.family.support_level] ?? 'Supported')),
      ),
      el('div', { class: 'card' },
        el('h3', {}, '💭 The Memories That Stuck'),
        memories.length
          ? el('div', {}, ...memories.map((m) => this.renderMemory(m)))
          : el('div', { class: 'empty' }, 'A quiet season.'),
      ),
      el('div', { class: 'card' },
        el('h3', {}, '👥 Where You Stand With People'),
        ...g.relationships.all().map((rel) => {
          rel.updateArc();
          return el('div', { class: 'person' },
            el('div', { class: 'avatar' }, PERSON_ICON[rel.rec.id] ?? '🙂'),
            el('div', {},
              el('div', {}, el('b', {}, rel.name), '  ', el('span', { class: 'role' }, rel.rec.role)),
              el('div', { class: 'line' }, rel.describe()),
            ),
          );
        }),
      ),
      el('div', { class: 'card' },
        el('h3', {}, '🏁 The Season, Round by Round'),
        ...results.map((r) => el('div', { class: 'small' }, `Wk ${r.week} · ${r.race} — `, el('b', {}, r.missed ? 'DNS' : r.dnf ? 'DNF' : ordinal(r.overall)), ` (+${r.points})`)),
        !results.length ? el('div', { class: 'empty' }, 'No races recorded.') : null,
      ),
      history.length ? el('div', { class: 'card' },
        el('h3', {}, '📈 Career So Far'),
        el('div', { class: 'history' },
          ...history.map((h) =>
            el('div', { class: 'history-row' },
              el('span', { class: 'hr-yr' }, `${h.year ?? '—'} · age ${h.age}`),
              el('span', { class: 'hr-cl' }, h.klass),
              el('span', {}, `${h.points} pts`),
              el('span', { class: 'faint' }, `best ${h.bestFinish ? ordinal(h.bestFinish) : '—'} · ${h.wins}W`),
            )
          ),
        ),
      ) : null,
      el('div', { class: 'card center' },
        el('p', { class: 'muted' }, 'The garage remembers all of it. Where does the story go from here?'),
        el('div', { class: 'toolbar', style: 'justify-content:center; flex-direction:column' },
          el('button', { class: 'btn primary wide', onclick: () => this.nextSeason() },
            `▶️ ${g.isParent ? 'Raise' : 'Ride'} ${g.seasonYear + 1} — ${g.rider.name} at ${(g.seasonYear + 1) - g.rider.birthYear} (${g.classForAge((g.seasonYear + 1) - g.rider.birthYear)})`),
          el('button', { class: 'btn ghost wide', onclick: () => this.renderRetirement() }, '🏆 Retire & look back on the career'),
          el('button', { class: 'btn ghost wide', onclick: () => { this.clearSave(); this.onboard = null; this.renderTitle(); } }, '🔁 Start a whole new life'),
        ),
      ),
      el('p', { class: 'faint small center' }, 'Legacy: Motocross · Prototype v0.2 · Build memories, not mechanics.'),
    );
    this.root.replaceChildren(view);
    window.scrollTo(0, 0);
  }

  nextSeason() {
    this.game.startNextSeason();
    this.tab = 'week';
    this.startWeek();
  }

  renderRetirement() {
    const g = this.game;
    g.archiveSeason(); // include the season just finished
    const h = g.state.careerHistory;
    const totalPoints = h.reduce((a, s) => a + s.points, 0);
    const totalWins = h.reduce((a, s) => a + s.wins, 0);
    const totalPodiums = h.reduce((a, s) => a + s.podiums, 0);
    const bestEver = h.reduce((a, s) => (s.bestFinish && (a === null || s.bestFinish < a) ? s.bestFinish : a), null);
    const memories = g.memory.top(10);
    const supportLabels = ['Family Supported', 'Local Shop Rider', 'Dealer Supported', 'Regional Support'];

    const line = totalWins >= 3
      ? `From a folding chair in the garage to the top of the box. ${g.rider.name} built a life the sport won't forget.`
      : totalWins >= 1
      ? `Not every kid gets a win. ${g.rider.name} did — and a family, a rival, and a garage full of stories to go with it.`
      : `No championships. But late nights, hard laps, and a family that always showed up. ${g.rider.name} lived a motocross life worth remembering.`;

    const view = el('div', {},
      el('div', { class: 'title-wrap' },
        el('div', { class: 'logo-mark' }, '🏆'),
        el('h1', {}, 'The Career'),
        el('div', { class: 'tagline' }, `${g.rider.name} · ${h.length} season${h.length === 1 ? '' : 's'} · retired at ${g.rider.age}`),
      ),
      el('div', { class: 'card center' },
        el('div', { class: 'stats', style: 'margin-bottom:0' },
          el('div', { class: 'stat' }, el('div', { class: 'k' }, 'Seasons'), el('div', { class: 'v mono' }, h.length)),
          el('div', { class: 'stat' }, el('div', { class: 'k' }, 'Career pts'), el('div', { class: 'v mono' }, totalPoints)),
          el('div', { class: 'stat' }, el('div', { class: 'k' }, 'Wins'), el('div', { class: 'v mono' }, totalWins)),
          el('div', { class: 'stat' }, el('div', { class: 'k' }, 'Podiums'), el('div', { class: 'v mono' }, totalPodiums)),
        ),
        el('p', { style: 'margin-top:14px;font-size:1.05rem' }, line),
        el('p', { class: 'small faint' }, `Best finish ever: ${bestEver ? ordinal(bestEver) : '—'} · Reached ${supportLabels[g.family.support_level] ?? 'Supported'}`),
      ),
      el('div', { class: 'card' },
        el('h3', {}, '📈 Every Season'),
        el('div', { class: 'history' },
          ...h.map((s) =>
            el('div', { class: 'history-row' },
              el('span', { class: 'hr-yr' }, `${s.year ?? '—'} · age ${s.age}`),
              el('span', { class: 'hr-cl' }, s.klass),
              el('span', {}, `${s.points} pts`),
              el('span', { class: 'faint' }, `best ${s.bestFinish ? ordinal(s.bestFinish) : '—'} · ${s.wins}W ${s.podiums}P`),
            )
          ),
        ),
      ),
      el('div', { class: 'card' },
        el('h3', {}, '💭 The Documentary Reel'),
        ...memories.map((m) => this.renderMemory(m)),
        !memories.length ? el('div', { class: 'empty' }, 'A quiet career.') : null,
      ),
      el('div', { class: 'card center' },
        el('button', { class: 'btn primary wide', onclick: () => { this.clearSave(); this.onboard = null; this.renderTitle(); } }, '🔁 Begin a new life'),
      ),
      el('p', { class: 'faint small center' }, 'Legacy: Motocross · Prototype v0.2 · We create interactive lives worth remembering.'),
    );
    this.root.replaceChildren(view);
    window.scrollTo(0, 0);
  }

  recapClosingLine(g, { wins, podiums }) {
    const name = g.rider.name;
    if (g.isParent) {
      if (wins >= 2) return `You gave ${name} a season they'll tell their own kids about. Every shift was worth it.`;
      if (wins === 1) return `Their first win came this year — and you were the one who drove them there. That's yours too.`;
      if (podiums >= 1) return `A podium, a rival, and a kid who still loves it. You held the family together and got them there.`;
      if ((g.rider.burnout ?? 0) > 60) return `A hard year. The kid's worn thin — maybe next season is about the love of it again, not the results.`;
      return `No trophies. But ${name} kept showing up, and so did you. Some seasons you just keep the dream alive. That counts.`;
    }
    if (wins >= 2) return `A season people will talk about. ${name} didn't just race — ${name} arrived.`;
    if (wins === 1) return `The first win came this year. However far it goes, ${name} will always have that day.`;
    if (podiums >= 1) return `Not a championship — but a box, a rival earned, and a family that showed up. That's a season worth keeping.`;
    if (g.state.season.results.some((r) => r.dnf)) return `Hard luck and hard lessons. The fast years are built on seasons exactly like this one.`;
    return `No trophies this year. But there were late nights in the garage, and a kid who kept lining up. That counts for more than it looks.`;
  }
}
