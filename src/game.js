// Game Orchestrator
// -----------------
// Ties the engines together, owns the weekly loop, and exposes the small helper
// API that content (activities and scenarios) calls to mutate the world. Also
// home to the Simulation Depth logic (DD-0020): what a given depth auto-lives
// versus pauses for.

import { RNG } from './core/rng.js';
import { EventBus } from './core/eventBus.js';
import { createInitialState } from './core/state.js';
import { ACTIVITIES, ACTIVITIES_PARENT, CLASS_FOR_AGE, BIKE_FOR_CLASS, ELIGIBLE_CLASSES, buildSchedule, SERIES } from './data/content.js';
import { MemoryEngine } from './engines/memoryEngine.js';
import { RelationshipEngine } from './engines/relationshipEngine.js';
import { WorldEngine } from './engines/worldEngine.js';
import { StoryEngine } from './engines/storyEngine.js';
import { OpportunityEngine } from './engines/opportunityEngine.js';
import { MarketplaceEngine } from './engines/marketplaceEngine.js';
import { SponsorEngine } from './engines/sponsorEngine.js';
import { RaceSession } from './engines/raceEngine.js';

const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

export const SIM_DEPTHS = {
  detailed: {
    key: 'detailed',
    label: 'Detailed',
    blurb: 'Plan every week and ride every lap. Live one career, deeply.',
    scenarioThreshold: 0, // pause for everything
    autoPlan: false,
    autoRace: false,
  },
  key: {
    key: 'key',
    label: 'Key Moments',
    blurb: 'The sim lives the routine weeks. You handle the big decisions and the races.',
    scenarioThreshold: 45, // only pause for important scenarios
    autoPlan: true,
    autoRace: false, // still choose ride-or-sim at the gate
  },
  fast: {
    key: 'fast',
    label: 'Fast Sim',
    blurb: 'The whole season auto-plays into a recap. Run many lives, explore many choices.',
    scenarioThreshold: 999, // pause for nothing
    autoPlan: true,
    autoRace: true,
  },
};

export class Game {
  constructor({ riderName = 'Riley', seed = Date.now(), depth = 'detailed', birthdate = '2022-05-15', campaign = 'rider', schoolMode = 'school', series = 'local' } = {}) {
    this.state = createInitialState(riderName, seed, birthdate, campaign);
    this.state.simDepth = depth;
    this.state.campaign = campaign;
    this.state.schoolMode = schoolMode;
    this.state.series = series;
    this.state.calendar = buildSchedule(series);
    this.rng = new RNG(seed);
    this.bus = new EventBus();

    this.memory = new MemoryEngine(this);
    this.relationships = new RelationshipEngine(this);
    this.world = new WorldEngine(this);
    this.story = new StoryEngine(this);
    this.market = new MarketplaceEngine(this);
    this.opportunity = new OpportunityEngine(this);
    this.opportunity.wire();
    this.sponsors = new SponsorEngine(this);
    this.sponsors.wire();
    if (!this.state.sponsors) this.state.sponsors = [];

    this.currentRace = null;
    this._weekLog = null;

    // Seed an initial marketplace.
    this.market.refresh(true);
  }

  // ---- convenience getters -------------------------------------------------
  get week() { return this.state.week; }
  get rider() { return this.state.rider; }
  get family() { return this.state.family; }
  get bike() { return this.state.bike; }
  get garage() { return this.state.garage; }
  get season() { return this.state.season; }
  get depth() { return SIM_DEPTHS[this.state.simDepth]; }
  get campaign() { return this.state.campaign; }
  get isParent() { return this.state.campaign === 'parent'; }
  // Calendar year of the current season (2026, 2027, ...).
  get seasonYear() { return this.state.startYear + this.state.seasonNumber - 1; }

  // ---- helper API used by content -----------------------------------------
  rel(id) { return this.relationships.of(id); }

  addMoney(n) { this.family.money = Math.max(0, this.family.money + Math.round(n)); }
  spend(n) {
    if (this.family.money < n) return false;
    this.family.money -= Math.round(n);
    return true;
  }
  addNews(text, tag = 'news') {
    this.state.news.unshift({ week: this.week, text, tag });
    this.state.news = this.state.news.slice(0, 24);
  }
  log(text) {
    if (this._weekLog) this._weekLog.lines.push(text);
  }
  skill(name, delta) {
    if (this.rider.skills[name] === undefined) return;
    this.rider.skills[name] = clamp(this.rider.skills[name] + delta);
  }
  confidence(delta) { this.rider.confidence = clamp(this.rider.confidence + delta); }
  fatigue(delta) { this.rider.fatigue = clamp(this.rider.fatigue + delta); }
  burnout(delta) { this.rider.burnout = clamp((this.rider.burnout ?? 0) + delta); }
  stress(delta) { this.family.stress = clamp(this.family.stress + delta); }
  bikeCondition(delta) { this.bike.condition = clamp(this.bike.condition + delta); }
  bikeReliability(delta) { this.bike.reliability = clamp(this.bike.reliability + delta); }
  bikeMemoryMaybe(text, force = false) {
    if (force || this.rng.chance(0.5)) this.bike.memories.push({ week: this.week, text });
  }
  setFlag(k, v = true) { this.state.flags[k] = v; }
  flag(k) { return !!this.state.flags[k]; }
  grantOpportunity(opp) {
    if (this.state.opportunities.some((o) => o.id === opp.id)) return;
    this.state.opportunities.push({ ...opp, week: this.week });
    this.addNews('Opportunity: ' + opp.title, 'opportunity');
  }
  setSupportLevel(n) {
    if (n > this.family.support_level) {
      this.family.support_level = n;
      this.bus.emit('support:changed', { level: n, week: this.week });
    }
  }

  // Schedule a follow-up scenario to surface `inWeeks` from now (story chains).
  scheduleChain(scenarioId, inWeeks = 2) {
    this.state.chainQueue.push({ dueWeek: this.week + inWeeks, scenarioId });
  }

  // ---- save / load ---------------------------------------------------------
  // State is plain data; a few engines hold state outside it (RNG position,
  // the story "used" sets, the simulated rival field), so capture those too.
  toSave() {
    return {
      v: 2,
      seed: this.rng.seed,
      rngS: this.rng._s,
      state: this.state,
      storyUsed: [...this.story.used],
      storyCareer: [...this.story.usedCareer],
      world: { riders: this.world.riders, newsIdx: this.world._newsIdx },
    };
  }

  static load(save) {
    const g = new Game({ riderName: save.state.rider.name, depth: save.state.simDepth, seed: save.seed });
    g.state = save.state;
    g.rng.seed = save.seed;
    g.rng._s = save.rngS;
    g.story.used = new Set(save.storyUsed ?? []);
    g.story.usedCareer = new Set(save.storyCareer ?? []);
    g.world.riders = save.world.riders;
    g.world._newsIdx = save.world.newsIdx;
    g.relationships._cache = new Map(); // re-wrap the loaded relationship records
    return g;
  }

  // ---- weekly loop ---------------------------------------------------------
  meta(week = this.week) {
    return (this.state.calendar ?? []).find((c) => c.week === week);
  }
  get series() { return SERIES[this.state.series] ?? SERIES.local; }
  isRaceWeek(week = this.week) {
    return !!this.meta(week)?.race;
  }
  isSeasonOver() {
    return this.week > 12;
  }

  // Start-of-week world ticks. Idempotent per week.
  prepareWeek() {
    if (this.state._preparedWeek === this.week) return;
    this.state._preparedWeek = this.week;
    this._weekLog = { week: this.week, title: this.meta()?.title ?? `Week ${this.week}`, lines: [] };

    // Injuries heal over time.
    if (this.rider.injury && this.rider.injury.weeksOut > 0) {
      this.rider.injury.weeksOut -= 1;
      if (this.rider.injury.weeksOut <= 0) {
        this.log(`Your ${this.rider.injury.name.toLowerCase()} has healed up.`);
        this.rider.injury = null;
      }
    }
    // Support-ladder perk: the shop quietly covers consumables.
    if (this.family.support_level >= 1) {
      this.addMoney(30);
    }
    // Parent mode: the kid lives their own week too — a little self-driven
    // practice, and burnout that quietly shapes their morale.
    if (this.isParent) {
      if (this.rng.chance(0.6)) this.skill(this.rng.pick(['cornering', 'jumping', 'whoops']), 1);
      if ((this.rider.burnout ?? 0) > 65) this.confidence(-3);
      else if ((this.rider.burnout ?? 0) < 25) this.confidence(1);
      this.burnout(-2); // natural recovery between weeks
    }

    // The world moves on its own.
    this.world.tick();
    // Occasionally the board turns over without the player looking.
    if (this.rng.chance(0.5)) this.market.refresh(false);
  }

  // Parent-mode race prep: a support stance (mapped to a race strategy) and an
  // optional paid pit crew. Returns the strategy the kid will ride.
  RACE_STANCES = {
    push: { label: 'Tell them to go for it', strategy: 'push', burnout: 6, morale: 2 },
    safe: { label: 'Tell them to ride safe', strategy: 'conserve', burnout: 1, morale: -1 },
    fun: { label: 'Just tell them to have fun', strategy: 'steady', burnout: -4, morale: 4 },
  };
  prepParentRace(stanceKey, payPit) {
    const stance = this.RACE_STANCES[stanceKey] ?? this.RACE_STANCES.fun;
    this.burnout(stance.burnout);
    this.confidence(stance.morale);
    if (payPit && this.spend(60)) this.setFlag('pit_help', true);
    return stance.strategy;
  }

  planningSlots() {
    return this.isRaceWeek() ? 1 : 2;
  }

  activitySet() {
    return this.isParent ? ACTIVITIES_PARENT : ACTIVITIES;
  }
  availableActivities() {
    return this.activitySet();
  }
  activityById(id) {
    return this.activitySet().find((a) => a.id === id);
  }

  // ---- 7-day week board (issue #5) ----------------------------------------
  // Which weekdays the kid has after-school energy for — grows with age.
  _afterSchoolDays() {
    const age = this.rider.age;
    if (age <= 9) return ['mon', 'wed'];
    if (age <= 13) return ['mon', 'wed', 'fri'];
    return ['mon', 'tue', 'wed', 'thu'];
  }

  // Build the 7 day-cards with their assignable slots, based on age, schooling,
  // and whether it's a race weekend. A 'full' slot accepts a full-day activity
  // (a track day) or a light one; a 'light' slot accepts only light activities.
  weekBoard() {
    const age = this.rider.age;
    const homeschool = this.state.schoolMode === 'homeschool';
    const raceWeek = this.isRaceWeek();
    const afterSchool = new Set(this._afterSchoolDays());
    const weekdays = [
      ['mon', 'Mon'], ['tue', 'Tue'], ['wed', 'Wed'], ['thu', 'Thu'], ['fri', 'Fri'],
    ];
    const days = [];

    for (const [key, label] of weekdays) {
      if (age <= 5) {
        days.push({ key, label, kind: 'preschool', daytime: 'Preschool', slots: [] });
      } else if (homeschool) {
        // Homeschool frees the day; you can ride, but must fit schoolwork in.
        const slots = afterSchool.has(key) ? [{ id: key + '-1', type: 'full' }] : [{ id: key + '-1', type: 'light' }];
        days.push({ key, label, kind: 'home', daytime: 'Homeschool', slots });
      } else {
        const slots = afterSchool.has(key) ? [{ id: key + '-1', type: 'light', afterSchool: true }] : [];
        days.push({ key, label, kind: 'school', daytime: 'School', slots });
      }
    }

    for (const [key, label] of [['sat', 'Sat'], ['sun', 'Sun']]) {
      if (raceWeek) {
        days.push({ key, label, kind: 'race', daytime: 'RACE', slots: [] });
      } else {
        days.push({ key, label, kind: 'weekend', daytime: null, slots: [{ id: key + '-1', type: 'full' }] });
      }
    }
    return days;
  }

  weekSlots() {
    return this.weekBoard().flatMap((d) => d.slots.map((s) => ({ ...s, day: d.key })));
  }
  slotAccepts(slot, activity) {
    if (!activity) return true;
    if (slot.type === 'full') return true; // a full day can hold anything
    return (activity.block ?? 'light') === 'light'; // a light slot: light only
  }

  // Heuristic auto-planner for simulated weeks (DD-0020).
  autoPlan() {
    const slots = this.planningSlots();
    const picks = [];
    const need = [];
    if (this.isParent) {
      if (this.bike.condition < 55 || this.bike.reliability < 55) need.push('wrench');
      if (this.family.money < 300) need.push('work');
      if ((this.rider.burnout ?? 0) > 55 || this.family.stress > 60) need.push('family_time');
      const defaults = this.isRaceWeek()
        ? ['wrench', 'work', 'rest']
        : ['practice', 'work', 'coaching', 'family_time'];
      for (const id of [...need, ...defaults]) {
        if (picks.length >= slots) break;
        if (!picks.includes(id)) picks.push(id);
      }
      return picks.slice(0, slots);
    }
    // Rider mode: fill the 7-day board — full slots get track days, light slots
    // get the most-needed light activity.
    return this._autoPlanBoard();
  }

  _autoPlanBoard() {
    const slotsList = this.weekSlots();
    const entries = [];
    let didSchool = false;
    const lightNeed = () => {
      if (this.bike.condition < 55 || this.bike.reliability < 55) return 'wrench';
      if (!this.flag('grades_good') && !didSchool) { didSchool = true; return 'schoolwork'; }
      if (this.family.money < 200) return 'earn';
      if (this.rider.fatigue > 55) return 'rest';
      return this.rng.pick(['fitness', 'general_training', 'wrench', 'earn']);
    };
    for (const slot of slotsList) {
      if (slot.type === 'full') {
        entries.push(this.isRaceWeek() ? 'wrench' : 'practice');
      } else {
        const id = lightNeed();
        entries.push(id === 'schoolwork' ? 'schoolwork' : id);
      }
    }
    // Guarantee some schoolwork for school-age kids.
    if (this.rider.age >= 6 && !entries.includes('schoolwork') && entries.length) entries[entries.length - 1] = 'schoolwork';
    return entries;
  }

  // ---- multiple bikes (issue #3) ------------------------------------------
  ownedBikes() {
    return [this.bike, ...(this.state.garage.bikes ?? [])];
  }
  practiceBike() {
    return (this.state.garage.bikes ?? []).find((b) => b.role === 'practice');
  }
  // The bike that takes the wear from a track day: your beater practice bike if
  // you own one, otherwise the race bike.
  trainBike() {
    return this.practiceBike() ?? this.bike;
  }
  addBike(bike) {
    if (!this.state.garage.bikes) this.state.garage.bikes = [];
    this.state.garage.bikes.push(bike);
  }
  // Swap a garaged bike in as the active race bike; the old one goes to storage.
  setRaceBike(assetId) {
    const list = this.state.garage.bikes ?? [];
    const idx = list.findIndex((b) => b.assetId === assetId);
    if (idx < 0) return false;
    const incoming = list[idx];
    const outgoing = this.bike;
    outgoing.role = 'spare';
    list.splice(idx, 1);
    list.push(outgoing);
    incoming.role = 'race';
    this.state.bike = incoming;
    return true;
  }

  // Apply wear to a specific bike (defaults to the race bike).
  wearBike(bike, { condition = 0, reliability = 0, tire = 0 } = {}) {
    const b = bike ?? this.bike;
    if (condition) b.condition = clamp(b.condition + condition);
    if (reliability) b.reliability = clamp(b.reliability + reliability);
    if (tire) b.tireWear = clamp((b.tireWear ?? 0) + tire, 0, 100);
  }

  // Consumable parts wear (issue #3). High tire wear hurts handling on race day.
  wearParts(n) {
    this.bike.tireWear = clamp((this.bike.tireWear ?? 0) + n, 0, 100);
  }

  _activityCost(act) {
    let cost = act.cost ?? 0;
    if (act.id === 'wrench' && this.family.support_level >= 1) cost = 0;
    else if (act.id === 'wrench' && this.flag('parts_discount')) cost = Math.round(cost * 0.5);
    return cost;
  }

  // Accepts entries that are either an activity id string or { id, stat } for
  // focused training. Returns per-activity outcome cards.
  runSchedule(entries) {
    const results = [];
    const norm = (entries ?? []).map((e) => (typeof e === 'string' ? { id: e } : e));
    for (const entry of norm) {
      const act = this.activityById(entry.id);
      if (!act) continue;
      const cost = this._activityCost(act);
      if (cost > 0 && !this.spend(cost)) {
        this.stress(4);
        results.push({ name: act.name, icon: act.icon, outcome: `Money was too tight — the family covered the $${cost}, and felt it.` });
      }
      const outcome = act.run(this, entry);
      const label = act.dynamicLabel ? act.dynamicLabel(this) : act.name;
      const icon = act.dynamicIcon ? act.dynamicIcon(this) : act.icon;
      results.push({ name: label, icon, outcome });
      this.log(`${icon} ${label}: ${outcome}`);
    }
    this.state.schedule = norm;
    return results;
  }

  // ---- scenarios -----------------------------------------------------------
  drawScenario() {
    const scenario = this.story.pick();
    this.state.pendingScenario = scenario ? scenario.id : null;
    this._pending = scenario;
    return scenario;
  }
  scenarioImportance(scenario) {
    return this.story.importanceOf(scenario);
  }
  shouldPauseForScenario(scenario) {
    if (!scenario) return false;
    return this.scenarioImportance(scenario) >= this.depth.scenarioThreshold;
  }
  resolveScenario(scenario, choiceIndex) {
    const choice = scenario.choices[choiceIndex] ?? scenario.choices[0];
    const outcome = choice.effect(this);
    this.story.markUsed(scenario);
    this.log(`📖 ${scenario.title} — ${choice.label}: ${outcome}`);
    this.state.pendingScenario = null;
    return { title: scenario.title, choice: choice.label, outcome };
  }
  autoResolveScenario(scenario) {
    return this.resolveScenario(scenario, this.story.autoPick(scenario));
  }

  // ---- race weekend --------------------------------------------------------
  // Classes the rider can enter at a race: age-eligible AND they own a bike for
  // it (issue #4). Returns [{ klass, bike }], race-bike class first.
  enterableClasses() {
    const eligible = new Set(ELIGIBLE_CLASSES(this.rider.age));
    const byClass = new Map();
    for (const b of this.ownedBikes()) {
      if (!eligible.has(b.klass)) continue;
      // Prefer the race-role bike for a class.
      if (!byClass.has(b.klass) || b.role === 'race') byClass.set(b.klass, b);
    }
    const out = [];
    const activeClass = this.bike.klass;
    if (byClass.has(activeClass)) out.push({ klass: activeClass, bike: byClass.get(activeClass) });
    for (const [klass, bike] of byClass) if (klass !== activeClass) out.push({ klass, bike });
    return out;
  }

  buildRace(bike) {
    this.currentRace = new RaceSession(this, this.meta().race, bike ?? this.bike);
    return this.currentRace;
  }

  // Championship standing among the season's regulars (issue #9).
  championshipStanding() {
    const rp = this.state.season.riderPoints ?? {};
    const mine = this.state.season.points;
    const ahead = Object.values(rp).filter((p) => p > mine).length;
    return { pos: ahead + 1, points: mine, isChampion: ahead === 0 && this.state.season.results.length > 0 };
  }

  // A serious injury forces you to sit out a race weekend (issue #9).
  mustMissRace() {
    const inj = this.rider.injury;
    return !!(inj && inj.weeksOut > 0 && (inj.severity === 'moderate' || inj.severity === 'severe' || inj.weeksOut >= 2));
  }
  recordMissedRace() {
    const race = this.meta().race;
    this.state.season.results.push({
      week: this.week, race: race.name, kind: race.kind, klass: this.bike.klass,
      motos: [], overall: null, points: 0, dnf: false, missed: true,
    });
    this.addNews(`${this.rider.name} sat out ${race.name} — still recovering from ${this.rider.injury.name.toLowerCase()}.`, 'world');
    this.memory.record({
      type: 'personal', title: 'Watched From the Sidelines',
      summary: `Injured, you had to skip ${race.name}. Watching your rivals race without you is its own kind of pain.`,
      emotion: ['frustration', 'longing'], tags: ['injury', 'missed_opportunity'], importance: 58, force: true,
    });
    this.log(`🚑 Missed ${race.name} (injured).`);
  }

  // Quick-sim an additional class entry (issue #4): its own bike, its own result.
  simulateClassEntry(entry, strategy = 'steady') {
    const session = new RaceSession(this, this.meta().race, entry.bike);
    const result = session.simulateRemaining(strategy);
    this.applyRaceResult(result);
    return result;
  }

  applyRaceResult(result) {
    const st = this.state;
    const first = !this.flag('had_race');
    this.setFlag('had_race', true);

    // Entry fee / travel — scales with the series (issue #9).
    const entry = Math.round(35 * (result.race.entryMult ?? 1));
    this.spend(entry);

    // Physical toll & confidence swing. Wear the bike that actually raced.
    this.fatigue(26);
    const raced = this.ownedBikes().find((b) => b.assetId === result.bikeId) ?? this.bike;
    this.wearBike(raced, { condition: -15, tire: 5 });
    const overall = result.overall;
    if (result.dnf) this.confidence(-8);
    else if (overall <= 3) this.confidence(11);
    else if (overall <= 5) this.confidence(4);
    else if (overall > result.fieldSize / 2) this.confidence(-5);

    // Rival relationship reacts to the head-to-head.
    if (result.rivalOverall) {
      if (overall < result.rivalOverall) {
        this.rel('rival_ethan').change('rivalry', 3);
        this.rel('rival_ethan').change('respect', 3);
      } else {
        this.rel('rival_ethan').change('rivalry', 2);
      }
    }

    // Season bookkeeping.
    st.season.results.push({
      week: this.week,
      race: result.race.name,
      kind: result.race.kind,
      klass: result.klass,
      motos: result.motos,
      overall,
      points: result.points,
      dnf: result.dnf,
    });
    st.season.points += result.points;
    // Per-class points for class championships (issues #4/#9).
    if (!st.season.classPoints) st.season.classPoints = {};
    st.season.classPoints[result.klass] = (st.season.classPoints[result.klass] ?? 0) + result.points;
    if (st.season.bestFinish === null || overall < st.season.bestFinish) st.season.bestFinish = overall;

    // Milestone memories (DD-0002).
    if (first) {
      this.memory.record({
        type: 'personal',
        title: 'Your First Race',
        summary: `You lined up for your first real race of the season and came home ${ordinal(overall)}.`,
        emotion: ['nerves', 'excitement'],
        tags: ['first_time', 'racing'],
        importance: 74,
        force: true,
      });
    }
    if (overall === 1 && !this.flag('had_win')) {
      this.setFlag('had_win');
      this.memory.record({
        type: 'race_result',
        title: 'First Win',
        summary: `You won ${result.race.name}! First place, overall. The whole pit heard about it.`,
        emotion: ['joy', 'pride', 'relief'],
        people: ['dad', 'mom'],
        tags: ['first_time', 'milestone', result.race.kind, 'comeback'],
        importance: 90,
        force: true,
      });
      this.garage.trophies.push({ name: `1st Overall — ${result.race.name}`, week: this.week });
      this.garage.objects.push({ name: 'Winning number plate', memory: `From your first win at ${result.race.name}.` });
    } else if (overall <= 3 && !this.flag('had_podium')) {
      this.setFlag('had_podium');
      this.memory.record({
        type: 'race_result',
        title: 'First Podium',
        summary: `You stood on the box — ${ordinal(overall)} overall at ${result.race.name}.`,
        emotion: ['pride', 'joy'],
        tags: ['first_time', 'milestone', result.race.kind],
        importance: 80,
        force: true,
      });
      this.garage.trophies.push({ name: `${ordinal(overall)} Overall — ${result.race.name}`, week: this.week });
    }

    // Parent lens: the result lands on the family, not just the stopwatch.
    if (this.isParent) {
      if (result.dnf) {
        this.rel('child').change('love', 1); // you hug them anyway
      } else if (overall <= 3) {
        this.rel('child').change('pride', 5);
        this.rel('child').change('love', 3);
        this.rel('spouse').change('strain', -4);
        this.rel('spouse').change('agreement', 2);
        this.stress(-6);
      } else if (overall > result.fieldSize / 2) {
        this.rel('child').change('pressure', 2);
        this.stress(3);
      }
      if (overall <= 3 && !result.dnf) {
        this.memory.record({
          type: 'relationship',
          title: `You Got Them to the Box`,
          summary: `Every shift, every drive, every dollar — and there they stood, ${ordinal(overall)} at ${result.race.name}. You did that together.`,
          emotion: ['pride', 'joy'],
          people: ['child'],
          tags: ['milestone', result.race.kind],
          importance: 78,
          force: true,
        });
      }
    }

    this.setFlag('mud_ready', false); // conditions prep is spent
    this.setFlag('pit_help', false); // paid pit crew is spent

    this.log(`🏁 ${result.race.name}: ${result.dnf ? 'DNF' : ordinal(overall) + ' overall'} (+${result.points} pts).`);
    this.currentRace = null;
    return result;
  }

  // ---- multi-season career -------------------------------------------------
  classForAge(age) {
    return CLASS_FOR_AGE(age);
  }

  // Career tallies (used by sponsor eligibility, recaps).
  careerWins() {
    const past = this.state.careerHistory.reduce((a, s) => a + (s.wins ?? 0), 0);
    return past + this.state.season.results.filter((r) => r.overall === 1).length;
  }
  careerPodiums() {
    const past = this.state.careerHistory.reduce((a, s) => a + (s.podiums ?? 0), 0);
    return past + this.state.season.results.filter((r) => r.overall <= 3 && !r.dnf).length;
  }

  // Summarize the season just finished into the career record.
  archiveSeason() {
    const s = this.state.season;
    const results = s.results;
    this.state.careerHistory.push({
      season: this.state.seasonNumber,
      year: this.seasonYear,
      age: this.rider.age,
      klass: this.rider.klass,
      points: s.points,
      bestFinish: s.bestFinish,
      wins: results.filter((r) => r.overall === 1).length,
      podiums: results.filter((r) => r.overall <= 3 && !r.dnf).length,
      races: results.length,
      supportLevel: this.family.support_level,
      topMemory: this.memory.top(1)[0]?.title ?? null,
    });
  }

  // Season-scoped flags that should reset each year; everything else persists
  // (has_practice_bike, has_chest_protector, earned_own_money, etc.).
  static SEASON_FLAGS = [
    'grades_good', 'had_race', 'had_win', 'had_podium', 'scout_watching',
    'ethan_got_fast', 'promised_school', 'chipped_in', 'will_prove_ethan', 'mud_ready',
  ];

  startNextSeason() {
    this.archiveSeason();

    // Advance the calendar a year; recompute age from birth year.
    this.state.seasonNumber += 1;
    this.rider.age = this.seasonYear - this.rider.birthYear;
    const newClass = this.classForAge(this.rider.age);

    // Moving up a class: the outgrown bike becomes a keepsake, a new one arrives.
    if (newClass !== this.rider.klass) {
      const old = this.bike;
      old.role = 'spare';
      this.addBike(old); // keep the outgrown bike in the garage (issue #3)
      this.garage.objects.push({
        name: `${old.name} (first ${old.klass})`,
        memory: `Your ${old.klass} from ${old.year}. Outgrown, never forgotten.`,
      });
      this.memory.record({
        type: 'object',
        title: `Moved Up to ${newClass}`,
        summary: `You outgrew the ${old.klass} and stepped up to a ${newClass}. Bigger bike, bigger jumps, same kid.`,
        emotion: ['nerves', 'pride'],
        tags: ['milestone', 'growing_up'],
        importance: 68,
        force: true,
      });
      this.rider.klass = newClass;
      this.state.bike = BIKE_FOR_CLASS(newClass, this.seasonYear - 1);
    }

    // Natural maturation — kids get stronger as they grow.
    this.skill('fitness', this.rng.int(2, 5));
    this.skill('cornering', this.rng.int(1, 3));
    this.skill('consistency', this.rng.int(1, 3));

    // A new season resets the calendar clock but keeps the life.
    this.state.week = 1;
    this.state._preparedWeek = 0;
    this.state.season = { results: [], points: 0, bestFinish: null, classPoints: {}, riderPoints: {} };
    this.state.calendar = buildSchedule(this.state.series);
    this.state.schedule = [];
    this.state.pendingScenario = null;
    this.state.chainQueue = [];
    this.state.news = [];

    // Reset season flags; keep persistent ones.
    for (const f of Game.SEASON_FLAGS) delete this.state.flags[f];

    // Recover the body over the off-season; confidence settles toward baseline.
    this.rider.fatigue = Math.max(0, this.rider.fatigue - 40);
    this.rider.injury = null;
    this.rider.confidence = Math.round(45 + (this.rider.confidence - 45) * 0.5);
    this.family.stress = Math.max(0, this.family.stress - 15);

    // The bike ages a year; a growing rider may need to move up next year.
    this.bikeCondition(-6);

    // Rivals kept improving in the off-season (World never sleeps).
    for (const r of this.world.riders) {
      r.rating = Math.min(94, r.rating + this.rng.range(2, 5));
    }
    this.story.newSeason();
    this.sponsors.paySeasonStipends();

    this.addNews(`A new season begins. ${this.rider.name} is ${this.rider.age} now, riding ${this.rider.klass}.`, 'world');
    this.bus.emit('season:started', { season: this.state.seasonNumber, week: 1 });
  }

  // ---- advance -------------------------------------------------------------
  advanceWeek() {
    // Natural weekly recovery so fatigue doesn't spiral.
    this.fatigue(-6);
    this.stress(-2);
    // Schoolwork quota (issue #5): school-age kids who never hit the books this
    // week let their grades slip — and Mom notices.
    if (!this.isParent && this.rider.age >= 6 && !this.flag('did_schoolwork')) {
      this.setFlag('grades_good', false);
      this.rel('mom').change('fear', 3);
      this.rel('mom').change('trust', -2);
      this.log('📉 No schoolwork this week — grades slipped and Mom noticed.');
    }
    this.setFlag('did_schoolwork', false);
    if (this._weekLog) this.state.logbook.push(this._weekLog);
    this.state.week += 1;
    this.state.schedule = [];
    this.state.pendingScenario = null;
    this._pending = null;
  }
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export { ordinal };
