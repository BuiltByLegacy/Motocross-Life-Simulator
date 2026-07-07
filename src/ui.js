// UI
// --
// All rendering and the week-flow driver. The driver walks each week through
// planning → scenario → (race) → summary, auto-living the steps a given
// Simulation Depth doesn't pause for (DD-0020). Plain DOM, no framework.

import { Game, SIM_DEPTHS, ordinal } from './game.js';
import { RACE_STRATEGIES, estimateForm } from './engines/raceEngine.js';
import { CALENDAR } from './data/content.js';

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
    let name = 'Riley';
    let depth = 'detailed';
    let campaign = 'rider';
    let schoolMode = 'school';
    const thisYear = new Date().getFullYear();
    let birthdate = `${thisYear - 4}-05-15`; // default: rider turns 4 this year

    const depthCards = Object.values(SIM_DEPTHS).map((d) =>
      el('div', {
        class: 'depth-card' + (d.key === depth ? ' selected' : ''),
        'data-depth': d.key,
        onclick: (e) => {
          depth = d.key;
          this.root.querySelectorAll('.depth-card').forEach((c) => c.classList.toggle('selected', c.dataset.depth === depth));
        },
      },
        el('b', {}, d.label),
        el('div', { class: 'small muted' }, d.blurb),
      )
    );

    const nameInput = el('input', { value: name, maxlength: '14', oninput: (e) => (name = e.target.value.trim() || 'Riley') });

    const campaignDefs = [
      { key: 'rider', label: '🏍️ Rider', blurb: 'You are the kid. Plan your weeks, prep the bike, and ride every lap.' },
      { key: 'parent', label: '👨‍👩‍👧 Parent', blurb: 'You are the parent. Work, money, family, safety, and support — you provide, they ride.' },
    ];
    const campaignCards = campaignDefs.map((c) =>
      el('div', {
        class: 'depth-card' + (c.key === campaign ? ' selected' : ''),
        'data-campaign': c.key,
        onclick: () => {
          campaign = c.key;
          this.root.querySelectorAll('[data-campaign]').forEach((el2) => el2.classList.toggle('selected', el2.dataset.campaign === campaign));
          nameLabel.textContent = campaign === 'parent' ? "Your kid's name" : "Your rider's name";
        },
      },
        el('b', {}, c.label),
        el('div', { class: 'small muted' }, c.blurb),
      )
    );
    const nameLabel = el('label', {}, "Your rider's name");

    const ageHint = el('span', { class: 'faint small' });
    const updateAgeHint = () => {
      const by = parseInt(String(birthdate).slice(0, 4), 10);
      const age = Math.max(3, thisYear - by);
      const klass = age <= 6 ? '50cc' : age <= 11 ? '65cc' : age <= 13 ? '85cc' : 'Supermini';
      ageHint.textContent = `Starts ${thisYear} at age ${age} on a ${klass}. The career grows year by year.`;
    };
    const birthdayInput = el('input', {
      type: 'date',
      value: birthdate,
      min: `${thisYear - 8}-01-01`,
      max: `${thisYear - 3}-12-31`,
      oninput: (e) => { birthdate = e.target.value || birthdate; updateAgeHint(); },
    });
    updateAgeHint();

    const save = this.loadSave();
    const continueCard = save ? el('div', { class: 'card' },
      el('div', { class: 'eyebrow' }, 'Saved career'),
      el('h2', {}, save.state.rider.name + ', age ' + save.state.rider.age),
      el('p', { class: 'small muted' },
        `${(save.state.startYear ?? new Date().getFullYear()) + (save.state.seasonNumber ?? 1) - 1} season · ` +
        `Week ${Math.min(save.state.week, 12)}/12 · ${save.state.season.points} pts · ` +
        `${(save.state.campaign === 'parent') ? 'Parent' : 'Rider'} campaign`),
      el('button', { class: 'btn primary wide', onclick: () => this.continueGame() }, 'Continue Career →'),
    ) : null;

    const view = el('div', {},
      el('div', { class: 'title-wrap' },
        el('div', { class: 'logo-mark' }, '🏍️'),
        el('h1', {}, 'Legacy: Motocross'),
        el('div', { class: 'tagline' }, 'Create a life worth remembering.'),
        el('p', { class: 'muted small', style: 'max-width:520px;margin:12px auto 0' },
          'A sports life-simulation prototype. Live one 12-week youth season — plan your weeks, prep the bike, race lap-by-lap, and build memories that outlast the results.'),
      ),
      continueCard,
      save ? el('p', { class: 'faint small center' }, '— or start a new life —') : null,
      el('div', { class: 'card' },
        el('div', { class: 'field' },
          el('label', {}, 'Play as…'),
          el('div', { class: 'depth-grid' }, ...campaignCards),
        ),
        el('div', { class: 'field' },
          nameLabel,
          nameInput,
        ),
        el('div', { class: 'field' },
          el('label', {}, "Rider's birthday"),
          birthdayInput,
          el('div', { style: 'margin-top:6px' }, ageHint),
        ),
        el('div', { class: 'field' },
          el('label', {}, 'Schooling'),
          el('div', { class: 'depth-grid' },
            ...[['school', '🏫 Public school', 'Ride on weekends; lighter training after school.'],
                ['homeschool', '🏠 Homeschool', 'More weekday ride time — but keep the schoolwork up.']].map(([k, lab, blurb]) =>
              el('div', {
                class: 'depth-card' + (k === schoolMode ? ' selected' : ''),
                'data-school': k,
                onclick: () => { schoolMode = k; this.root.querySelectorAll('[data-school]').forEach((e2) => e2.classList.toggle('selected', e2.dataset.school === schoolMode)); },
              }, el('b', {}, lab), el('div', { class: 'small muted' }, blurb))
            ),
          ),
        ),
        el('div', { class: 'field' },
          el('label', {}, 'Simulation depth — how much do you want to live yourself?'),
          el('div', { class: 'depth-grid' }, ...depthCards),
        ),
        el('button', { class: 'btn primary wide', onclick: () => this.startGame({ name, depth, birthdate, campaign, schoolMode }) }, `Begin — ${thisYear} Season`),
      ),
      el('p', { class: 'faint small center' }, 'Prototype v0.1 · Legacy Studios · Build memories, not mechanics.'),
    );
    this.root.replaceChildren(view);
  }

  startGame({ name, depth, birthdate, campaign, schoolMode }) {
    this.clearSave(); // a fresh life replaces any prior save
    this.game = new Game({ riderName: name, depth, birthdate, campaign, schoolMode, seed: Date.now() });
    this.tab = 'week';
    this.startWeek();
  }

  // ---- Frame ---------------------------------------------------------------
  render() {
    const g = this.game;
    const content = this.tab === 'week' ? this.weekContent() : this.renderTab();
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
        g.isParent ? el('span', {}, 'Raising ', g.rider.name) : el('span', {}, g.rider.name),
        el('small', {}, ` · age ${g.rider.age} · ${g.rider.klass}`),
      ),
      el('div', {},
        el('span', { class: 'badge amber' }, `${g.seasonYear} · Wk ${Math.min(g.week, 12)}/12`),
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
    this.render();
  }

  // ---- Week flow -----------------------------------------------------------
  startWeek() {
    const g = this.game;
    if (g.isSeasonOver()) return this.renderRecap();
    g.prepareWeek();
    this.saveGame(); // autosave at each week boundary
    this.digest = [];
    this.handlePlanning();
  }

  handlePlanning() {
    const g = this.game;
    if (g.depth.autoPlan) {
      const picks = g.autoPlan();
      const results = g.runSchedule(picks);
      this.digest.push({ type: 'plan', results, auto: true });
      this.handleScenario();
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
      if (g.depth.autoRace) {
        const race = g.buildRace();
        const result = race.simulateRemaining('steady');
        g.applyRaceResult(result);
        this.digest.push({ type: 'race', result });
        this.finishWeek();
      } else {
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
        el('div', { class: 'eyebrow' }, meta.race ? '🏁 Race Week' : `${g.seasonYear} · Week ${g.week}`),
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
        el('p', { class: 'muted' }, `${race.motos} motos · ${race.laps} laps each · ${g.world.field().length + 1} riders on the gate.`),
        el('p', {}, `Your form: `, el('b', { style: 'color:var(--amber-2)' }, `${formWord} (${form})`)),
        warn.length ? el('div', { class: 'hint' }, '⚠️ ' + warn.join(' ')) : el('p', { class: 'small faint' }, 'The bike and body feel ready.'),
        el('hr', { class: 'divider' }),
        el('div', { class: 'strat-grid' },
          el('button', { class: 'btn primary', onclick: () => this.startInteractiveRace() }, '🏁 Ride it lap-by-lap'),
          el('button', { class: 'btn', onclick: () => this.quickSimRace() }, '⏩ Quick-sim the result'),
        ),
      ),
    );
  }

  viewParentRaceIntro(race, form, formWord, warn) {
    const g = this.game;
    if (this._payPit === undefined) this._payPit = false;
    const canPay = g.family.money >= 60;
    return el('div', {},
      el('div', { class: 'card' },
        el('div', { class: 'eyebrow' }, race.kind === 'regional' ? '🏆 Regional Qualifier' : '🏁 Race Day'),
        el('h2', {}, race.name),
        el('p', { class: 'muted' }, `${g.rider.name} is on the gate. ${race.motos} motos · ${race.laps} laps · ${g.world.field().length + 1} riders.`),
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

  quickSimRace() {
    const g = this.game;
    const race = g.buildRace();
    const result = race.simulateRemaining('steady');
    g.applyRaceResult(result);
    this.lastResult = result;
    this.digest.push({ type: 'race', result });
    this.showWeek(() => this.viewRaceResult(result));
  }

  startInteractiveRace() {
    this.race = this.game.buildRace();
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
        el('div', { class: 'muted' }, result.dnf ? 'A tough day. It happens.' : `${place} overall  ·  +${result.points} points`),
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

  renderGarage() {
    const g = this.game;
    const b = g.bike;
    return el('div', {},
      el('div', { class: 'card' },
        el('div', { class: 'eyebrow' }, 'The Garage — home, workshop, museum'),
        el('h2', {}, b.name),
        el('p', { class: 'small faint' }, `#${b.serial} · Condition ${b.condition} · Reliability ${b.reliability} · Handling ${b.handling} · Performance ${b.performance}`),
        el('p', { class: 'small' }, `🛞 Tire wear: `, el('b', { style: (b.tireWear ?? 0) > 60 ? 'color:var(--red)' : 'color:var(--ink)' }, `${b.tireWear ?? 0}%`), (b.tireWear ?? 0) > 60 ? el('span', { class: 'faint' }, ' — worn; grip is going. Buy fresh tires.') : null),
        b.installed.length ? el('p', { class: 'small' }, '🔩 Installed: ' + b.installed.join(', ')) : el('p', { class: 'small faint' }, 'Bone stock, for now.'),
        b.memories.length ? el('div', {},
          el('div', { class: 'small faint', style: 'margin-top:8px' }, 'This bike remembers:'),
          ...b.memories.slice(-4).map((m) => el('div', { class: 'small muted' }, `• ${m.text}`)),
        ) : null,
      ),
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

  // Emoji + gradient "photo" per item — offline-safe listing images.
  itemThumb(listing, big = false) {
    const art = {
      mx33: ['🛞', '#3a3d44,#20232a'],
      holeshot: ['🚦', '#2c3a2f,#1c2620'],
      pipe: ['💨', '#3a2f24,#241d16'],
      topend: ['⚙️', '#2f3540,#1e232b'],
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
        el('div', { class: 'eyebrow' }, 'Season so far' ),
        el('h2', {}, 'Results'),
        results.length
          ? el('div', {}, ...results.map((r) => el('div', { class: 'small' }, `Wk ${r.week} · ${r.race} — `, el('b', {}, r.dnf ? 'DNF' : ordinal(r.overall)), ` (+${r.points})`)))
          : el('div', { class: 'empty' }, 'No races yet.'),
        el('p', { class: 'small faint', style: 'margin-top:8px' }, `Total: ${g.state.season.points} points · Best finish ${g.state.season.bestFinish ? ordinal(g.state.season.bestFinish) : '—'}`),
      ),
      el('div', { class: 'card' },
        el('h3', {}, '💭 Memories'),
        memories.length
          ? el('div', {}, ...memories.map((m) => this.renderMemory(m)))
          : el('div', { class: 'empty' }, 'No memories yet. They\'re coming.'),
      ),
      el('div', { class: 'card' },
        el('h3', {}, '🗞️ The World'),
        g.state.news.length
          ? el('div', {}, ...g.state.news.slice(0, 8).map((n) => el('div', { class: 'news-item' }, el('span', { class: 'wk' }, `Wk ${n.week} · `), n.text)))
          : el('div', { class: 'empty' }, 'Quiet in the paddock.'),
      ),
    );
  }

  renderMemory(m) {
    return el('div', { class: 'memory' },
      el('div', { class: 'm-title' }, m.title),
      el('div', { class: 'muted small' }, m.summary),
      el('div', { class: 'm-meta' }, `Age ${m.riderAge} · Week ${m.week} · importance ${m.importance}`),
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
        ...results.map((r) => el('div', { class: 'small' }, `Wk ${r.week} · ${r.race} — `, el('b', {}, r.dnf ? 'DNF' : ordinal(r.overall)), ` (+${r.points})`)),
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
          el('button', { class: 'btn ghost wide', onclick: () => { this.clearSave(); this.renderTitle(); } }, '🔁 Start a whole new life'),
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
        el('button', { class: 'btn primary wide', onclick: () => { this.clearSave(); this.renderTitle(); } }, '🔁 Begin a new life'),
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
