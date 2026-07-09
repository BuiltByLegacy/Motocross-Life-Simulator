// Game Orchestrator
// -----------------
// Ties the engines together, owns the weekly loop, and exposes the small helper
// API that content (activities and scenarios) calls to mutate the world. Also
// home to the Simulation Depth logic (DD-0020): what a given depth auto-lives
// versus pauses for.

import { RNG } from './core/rng.js';
import { EventBus } from './core/eventBus.js';
import { createInitialState } from './core/state.js';
import { ACTIVITIES, ACTIVITIES_PARENT, CLASS_FOR_AGE, BIKE_FOR_CLASS, ELIGIBLE_CLASSES, SERIES, CAMPS, BACKGROUNDS, EVENT_POOL, defaultProgram, buildScheduleFromProgram } from './data/content.js';
import { MemoryEngine } from './engines/memoryEngine.js';
import { RelationshipEngine } from './engines/relationshipEngine.js';
import { WorldEngine } from './engines/worldEngine.js';
import { StoryEngine } from './engines/storyEngine.js';
import { OpportunityEngine } from './engines/opportunityEngine.js';
import { MarketplaceEngine } from './engines/marketplaceEngine.js';
import { SponsorEngine } from './engines/sponsorEngine.js';
import { SeasonPlanner } from './systems/seasonPlanner.js';
import { LorettasPath, classifyEvent } from './systems/lorettasPath.js';
import { resolveResult, Standings } from './systems/raceResults.js';
import { ClassProgression, MomentumTracker, RivalTracker } from './systems/competition.js';
import { AssetRegistry, recordTransfer } from './systems/assetProvenance.js';
import { MemoryTriggerRegistry, defaultTriggers } from './systems/memoryTriggers.js';
import { NotificationQueue } from './systems/notifications.js';
import { FriendsList, buildCareerCard, exportCard, importCard, leaderboard as buildLeaderboard, compareCareers, buildRecapCard, toWorldCameo, friendMilestones } from './systems/connectedCareers.js';
import { buildGarageView, makeListingDraft, publishListing, completeSale } from './systems/garageView.js';
import { phoneApps as buildPhoneApps, canAccess } from './systems/phoneHub.js';
import { PhoneStateStore } from './systems/phoneState.js';
import { dealerCatalog as buildDealerCatalog, dealerPrice, placeOrder, receiveOrders } from './systems/dealer.js';
import { search as usedSearch, filterListings as usedFilter, sortListings as usedSort } from './systems/usedMarketplace.js';
import { RaceSession } from './engines/raceEngine.js';
import { evaluateApproval, permissionFor, trustScore } from './systems/responsibility.js';
import { createBikeForClass, needsClassBike, classTransitionMemory } from './systems/bikeBuilder.js';
import { createRaceWeekend, readinessChecklist, registerWeekend, advanceWeekend } from './systems/raceWeekend.js';
import { seasonFlowState, guardEdit, pruneExpiredEvents } from './systems/seasonFlow.js';
import { assessReadiness, parentRepairDecision, applyRepair } from './systems/parentPrep.js';
import { buildMonthCalendar } from './systems/monthCalendar.js';
import { v1GarageOverview, availableUpgrades, upgradeById } from './systems/garageV1.js';
import { makeSeasonCommitment, advanceCommitment, lockPreconditions, isLocked, goRacingChecklist } from './systems/seasonCommitment.js';
import { makeTutorial, activeTutorialStep, advanceTutorial, skipTutorial, replayTutorial } from './systems/tutorial.js';

const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

// Save envelope version — bump when the persisted schema changes (#242).
export const SAVE_VERSION = 3;

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
  constructor({ riderName = 'Riley', seed = Date.now(), depth = 'detailed', birthdate = '2022-05-15', campaign = 'rider', schoolMode = 'school', avatar = '🧒', background = null } = {}) {
    this.state = createInitialState(riderName, seed, birthdate, campaign);
    this.state.simDepth = depth;
    this.state.campaign = campaign;
    this.state.rider.avatar = avatar;
    // A starting background sets schooling + money + family footing (issue #16).
    const bg = BACKGROUNDS.find((b) => b.id === background);
    this.state.schoolMode = bg ? bg.schoolMode : schoolMode;
    this.state.background = background;
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
    // Road to Loretta's progression (issues #25/#58–#62). Live instance,
    // snapshotted into state.lorettaPath at save time.
    this.lorettas = LorettasPath.fromJSON(this.state.lorettaPath);
    // Competition Engine (issues #63–#67): per-class progression, standings,
    // momentum, and recurring rivals — hydrated from state, snapshotted at save.
    this.progression = ClassProgression.fromJSON(this.state.progression);
    this.standings = Standings.fromJSON(this.state.standings);
    this.momentum = MomentumTracker.fromJSON(this.state.momentum ?? { confidence: this.state.rider.confidence });
    this.rivals = RivalTracker.fromJSON(this.state.rivals);
    // Memory Engine (issues #68–#72): asset provenance registry + automatic
    // memory triggers. Hydrated from state, snapshotted at save.
    this.assets = AssetRegistry.fromJSON(this.state.assets);
    this.memTriggers = MemoryTriggerRegistry.fromJSON(this.state.memTriggers, defaultTriggers());
    // Give the starting race bike a provenance record (issue #69).
    if (this.state.bike) this.assets.ensure(this.state.bike, { kind: 'bike' });
    // Phone / Internet hub notification queue (issue #74).
    this.notifications = NotificationQueue.fromJSON(this.state.notifications);
    this.phoneStateStore = PhoneStateStore.fromJSON(this.state.phoneState);
    // Connected Careers — offline social layer (issues #114–#122).
    this.friends = FriendsList.fromJSON(this.state.friends);
    if (!this.state.cardPrivacy) this.state.cardPrivacy = [];
    if (!this.state.market.drafts) this.state.market.drafts = []; // listing drafts (#76)
    if (!this.state.market.orders) this.state.market.orders = []; // dealer orders (#39)
    // Feed the phone: big memories and race results become notifications (#74).
    this.bus.on('memory:created', ({ memory }) => {
      if (memory && memory.importance >= 72) {
        this.notify({ key: `mem_${memory.id}`, source: 'memory', priority: 'normal', title: memory.title, body: (memory.summary ?? '').slice(0, 90), actionTarget: { screen: 'journal' }, icon: '💭' });
      }
    });
    this.bus.on('race:finished', ({ overall, race }) => {
      this.notify({ source: 'competition', priority: overall <= 3 ? 'high' : 'normal', title: `Result: ${race.name}`, body: `Finished ${ordinal(overall)}.`, actionTarget: { screen: 'journal' }, icon: '🏁' });
    });

    this.currentRace = null;
    this._weekLog = null;

    // Apply the starting background now that helpers/engines exist (issue #16).
    if (bg) bg.apply(this);

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
    this.state.lorettaPath = this.lorettas.toJSON(); // snapshot the live path
    this.state.progression = this.progression.toJSON();
    this.state.standings = this.standings.toJSON();
    this.state.momentum = this.momentum.toJSON();
    this.state.rivals = this.rivals.toJSON();
    this.state.assets = this.assets.toJSON();
    this.state.memTriggers = this.memTriggers.toJSON();
    this.state.notifications = this.notifications.toJSON();
    this.state.phoneState = this.phoneStateStore.toJSON();
    this.state.friends = this.friends.toJSON();
    return {
      v: SAVE_VERSION,
      seed: this.rng.seed,
      rngS: this.rng._s,
      state: this.state,
      storyUsed: [...this.story.used],
      storyCareer: [...this.story.usedCareer],
      world: { riders: this.world.riders, newsIdx: this.world._newsIdx },
    };
  }

  // A save is valid if it carries the minimum career state (#242 corruption guard).
  static isValidSave(save) {
    return !!(save && typeof save === 'object' && save.state && save.state.rider && save.state.rider.name);
  }

  // Bring an older save forward to the current schema (#242 versioning/migration).
  // Field defaults are handled by each system's fromJSON, so migration mainly
  // normalizes the envelope and fills any structural gaps.
  static migrate(save) {
    const v = save.v ?? 1;
    if (v < 3) {
      save.state ??= {};
      save.state.market ??= { listings: [], seenIds: [] };
      save.state.market.drafts ??= [];
      save.state.market.orders ??= [];
      save.state.garageUpgrades ??= [];
      save.world ??= { riders: [], newsIdx: 0 };
    }
    save.v = SAVE_VERSION;
    return save;
  }

  static load(save) {
    if (!Game.isValidSave(save)) throw new Error('Save file is missing or corrupt.');
    save = Game.migrate(save);
    const g = new Game({ riderName: save.state.rider.name, depth: save.state.simDepth, seed: save.seed });
    g.state = save.state;
    g.rng.seed = save.seed;
    g.rng._s = save.rngS;
    g.story.used = new Set(save.storyUsed ?? []);
    g.story.usedCareer = new Set(save.storyCareer ?? []);
    g.world.riders = save.world.riders;
    g.world._newsIdx = save.world.newsIdx;
    g.relationships._cache = new Map(); // re-wrap the loaded relationship records
    g.lorettas = LorettasPath.fromJSON(g.state.lorettaPath); // re-wrap the path
    g.progression = ClassProgression.fromJSON(g.state.progression);
    g.standings = Standings.fromJSON(g.state.standings);
    g.momentum = MomentumTracker.fromJSON(g.state.momentum);
    g.rivals = RivalTracker.fromJSON(g.state.rivals);
    g.assets = AssetRegistry.fromJSON(g.state.assets);
    g.memTriggers = MemoryTriggerRegistry.fromJSON(g.state.memTriggers, defaultTriggers());
    g.notifications = NotificationQueue.fromJSON(g.state.notifications);
    g.phoneStateStore = PhoneStateStore.fromJSON(g.state.phoneState);
    g.friends = FriendsList.fromJSON(g.state.friends);
    return g;
  }

  // ---- Connected Careers: offline social layer (issues #114–#122) ----------
  careerCard() { return buildCareerCard(this, { privacy: this.state.cardPrivacy ?? [] }); }
  exportCareer() { return exportCard(this.careerCard()); }
  // Toggle a privacy redaction on the shared card (#121).
  toggleCardPrivacy(field) {
    const p = this.state.cardPrivacy ?? (this.state.cardPrivacy = []);
    const i = p.indexOf(field);
    if (i >= 0) p.splice(i, 1); else p.push(field);
    return p;
  }
  // Import a friend's career from a shared code; fire milestone notifications (#120).
  importFriend(code) {
    const card = importCard(code);
    if (!card) return { error: 'invalid' };
    const prev = this.friends.get(card.id)?.card ?? null;
    for (const n of friendMilestones(prev, card)) {
      this.notify({ source: 'social', priority: 'normal', title: n.title, body: n.body, actionTarget: { screen: 'phone' }, icon: n.icon });
    }
    this.friends.add(card, { day: this.dayIndex });
    return { card };
  }
  // Leaderboard across the player + all friends (#116).
  leaderboard(category = 'legacy', opts = {}) {
    const cards = this.friends.list({ includeSelf: this.careerCard() });
    return buildLeaderboard(cards, category, opts);
  }
  compareToFriend(id) {
    const f = this.friends.get(id);
    return f ? compareCareers(this.careerCard(), f.card) : null;
  }
  seasonRecapCard() { return buildRecapCard(this, { privacy: this.state.cardPrivacy ?? [] }); }
  // Add a friend's career into the world as a named cameo rider (#122).
  addFriendCameo(id) {
    const f = this.friends.get(id);
    if (!f) return null;
    const cameo = toWorldCameo(f.card);
    if (!this.state.cameos) this.state.cameos = [];
    if (!this.state.cameos.some((c) => c.id === cameo.id)) this.state.cameos.push(cameo);
    return cameo;
  }

  // ---- weekly loop ---------------------------------------------------------
  meta(week = this.week) {
    return (this.state.calendar ?? []).find((c) => c.week === week);
  }

  // ---- race program (issue #22) -------------------------------------------
  eventPool() {
    if (!this._eventPool) this._eventPool = EVENT_POOL();
    return this._eventPool;
  }
  rebuildCalendar() {
    this.state.calendar = buildScheduleFromProgram(this.eventPool(), this.state.program);
  }
  setProgram(program) {
    this.state.program = { ...program };
    this.state.programSet = true;
    this.rebuildCalendar();
  }
  // Build a SeasonPlanner reflecting a program map + this season's goals, for
  // budget/travel forecasting and plan review (issues #53–#57).
  buildPlanner(program = this.state.program) {
    const pool = this.eventPool();
    const available = [];
    for (const w of Object.keys(pool)) {
      for (const ev of pool[w]) {
        available.push({ id: ev.id, day: ev.week * 7, title: ev.name, level: ev.level, category: ev.category, location: ev.location, entryFee: ev.entry, region: ev.region, lorettaStage: ev.lorettaStage });
      }
    }
    const planner = new SeasonPlanner(available, { seasonDays: 84 });
    for (const [w, id] of Object.entries(program)) if (id) planner.addEvent(id, 'committed');
    for (const gtype of this.state.seasonGoals ?? []) planner.addGoal({ type: gtype });
    return planner;
  }

  // Road to Loretta's planner warnings for a program (issue #62). Uses the live
  // path so warnings account for stages the rider has already cleared.
  lorettaWarnings(program = this.state.program) {
    const planner = this.buildPlanner(program);
    const selected = planner.selectedEvents();
    const hasLorettaGoal = (this.state.seasonGoals ?? []).includes('qualify_lorettas');
    return this.lorettas.pathWarnings(selected, { klass: this.rider.klass, hasLorettaGoal });
  }

  // Total booked entry cost for the current program (issue #22).
  programCost() {
    const pool = this.eventPool();
    return Object.entries(this.state.program).reduce((sum, [w, id]) => {
      const ev = (pool[w] ?? []).find((e) => e.id === id);
      return sum + (ev ? ev.entry : 0);
    }, 0);
  }
  // Derived "level" for the topbar/journal: the biggest event on your schedule.
  get series() {
    const pool = this.eventPool();
    let level = 'local';
    for (const [w, id] of Object.entries(this.state.program)) {
      const ev = (pool[w] ?? []).find((e) => e.id === id);
      if (ev && ev.level === 'national') level = 'national';
      else if (ev && ev.level === 'regional' && level !== 'national') level = 'regional';
    }
    return SERIES[level] ?? SERIES.local;
  }
  isRaceWeek(week = this.week) {
    return !!this.meta(week)?.race;
  }
  isSeasonOver() {
    return this.week > 12;
  }

  // Bike is race-ready if it isn't badly worn and the rider isn't sidelined (#225).
  bikeRaceReady() {
    if (this.mustMissRace && this.mustMissRace()) return false;
    return (this.bike?.condition ?? 100) > 20;
  }
  // Youth riders in rider mode need a parent's yes to commit (#225). Parent mode
  // is the parent, so no separate approval gate.
  needsRaceApproval() {
    return this.campaign !== 'parent' && (this.rider?.age ?? 18) < 13;
  }

  // The always-valid season flow state + action set — the anti-stuck guarantee
  // that "Go Racing" never silently disappears after schedule edits (#225/#226).
  seasonFlow() {
    const events = (this.state.calendar ?? [])
      .filter((c) => c.race)
      .map((c) => ({ week: c.week, name: c.race.name, id: c.race.name, deadlineWeek: Math.max(1, c.week - 2) }));
    return seasonFlowState({
      week: this.week,
      totalWeeks: 12,
      programSet: this.state.programSet,
      events,
      currentEventInProgress: !!this.currentRace,
      raceReady: this.bikeRaceReady(),
      needsApproval: this.needsRaceApproval(),
    });
  }
  // ---- Living Garage v1.0 home hub (issues #219/#220) ----------------------
  garageOverview() {
    if (!this.state.garageUpgrades) this.state.garageUpgrades = [];
    return v1GarageOverview({
      view: this.garageView(),
      orders: this.state.market.orders ?? [],
      ownedUpgrades: this.state.garageUpgrades,
      budget: this.family.money,
    });
  }
  // Buy a garage upgrade — money out, added to owned (persists via state). #213/#220
  buyGarageUpgrade(id) {
    if (!this.state.garageUpgrades) this.state.garageUpgrades = [];
    if (this.state.garageUpgrades.includes(id)) return { error: 'owned' };
    const u = upgradeById(id);
    if (!u) return { error: 'unknown' };
    if (this.family.money < u.cost) return { error: 'afford' };
    this.spend(u.cost);
    this.state.garageUpgrades.push(id);
    this.memory.record({ type: 'object', title: `Garage Upgrade: ${u.name}`, summary: `Added ${u.name.toLowerCase()} to the garage — it’s starting to feel like a real shop.`, tags: ['garage', 'milestone'], importance: 48 });
    this.log(`🔧 Garage upgrade: ${u.name} ($${u.cost}).`);
    return { ok: true, upgrade: u };
  }

  // Month-grouped view of the season calendar for a real month-based UI (#224).
  monthCalendar() {
    return buildMonthCalendar(this.state.calendar ?? [], {
      startMonthIndex: 3, // amateur seasons ramp through spring — start in April
      currentWeek: this.week,
      year: this.seasonYear,
    });
  }

  // ---- Season commitment lifecycle (issue #229; DD-0029) -------------------
  seasonCommit() {
    if (!this.state.seasonCommit) this.state.seasonCommit = makeSeasonCommitment(this.state.programSet ? 'active' : 'draft');
    return this.state.seasonCommit;
  }
  // Context for lock preconditions: events, hard conflicts, budget, approval.
  _commitContext() {
    const planner = this.buildPlanner(this.state.program);
    const summary = planner.reviewSummary(this.family.money);
    const eventCount = planner.selectedEvents().length;
    const hardConflicts = (summary.conflicts ?? []).filter((c) => c.severity === 'hard').length;
    return { eventCount, hardConflicts, needsApproval: this.needsRaceApproval(), approvalGranted: this.seasonCommit().approvalGranted, overBudget: !!summary.overBudget, day: this.dayIndex };
  }
  // Advance the season commitment (review / request_approval / grant_approval /
  // lock / start / complete / back_to_draft). Persists the new state.
  advanceSeasonCommit(action) {
    const next = advanceCommitment(this.seasonCommit(), action, this._commitContext());
    if (!next.error) this.state.seasonCommit = next;
    return next;
  }
  seasonLockPreconditions() { return lockPreconditions(this._commitContext()); }
  isSeasonLocked() { return isLocked(this.seasonCommit()); }

  // ---- First-time onboarding tutorial (issue #243) -------------------------
  tutorial() {
    if (!this.state.tutorial) this.state.tutorial = makeTutorial();
    return this.state.tutorial;
  }
  _tutorialCtx() { return { programSet: !!this.state.programSet, hasRaced: !!this.flag('had_race') }; }
  // The onboarding step the player should see now, or null once done/skipped.
  activeTutorialStep() { return activeTutorialStep(this.tutorial(), this._tutorialCtx()); }
  advanceTutorial() { this.state.tutorial = advanceTutorial(this.tutorial(), this._tutorialCtx()); return this.state.tutorial; }
  skipTutorial() { this.state.tutorial = skipTutorial(this.tutorial()); return this.state.tutorial; }
  replayTutorial() { this.state.tutorial = replayTutorial(); return this.state.tutorial; }

  // ---- Go Racing launch checklist (issue #230) -----------------------------
  // The next committed race and its pre-race readiness, gating the Go Racing action.
  goRacingChecklist() {
    const next = (this.state.calendar ?? []).find((c) => c.week >= this.week && c.race);
    if (!next) return goRacingChecklist({ event: null });
    const race = next.race;
    const entry = Math.round(35 * (race.entryMult ?? 1));
    return goRacingChecklist({
      event: { name: race.name, klass: race.kind, week: next.week },
      seasonActive: this.isSeasonLocked() || this.state.programSet,
      bikeReady: this.bikeRaceReady(),
      feesAffordable: this.family.money >= entry,
      klassEligible: true,
      approvalOk: !this.needsRaceApproval() || this.seasonCommit().approvalGranted,
      notInjured: !(this.mustMissRace && this.mustMissRace()),
      alreadyRacedThisWeek: false,
    });
  }

  // Validate a mid-season schedule edit (#225).
  guardScheduleEdit(edit) {
    return guardEdit(edit, {
      week: this.week,
      currentInProgress: !!this.currentRace,
      needsApproval: this.needsRaceApproval(),
    });
  }

  // Parent-managed bike prep for young riders (#222). A kid can't manage
  // purchases, so before a nearby race the parent checks the bike, decides how
  // to fix it (dealer / used / shop) within budget/stress, and either gets it
  // done or leaves a readiness warning. No-op for older riders / parent mode.
  parentManageBikePrep() {
    if (!this.needsRaceApproval()) return null;
    const next = (this.state.calendar ?? []).find((c) => c.week >= this.week && c.race);
    if (!next || next.week - this.week > 1) return null; // only when a race is imminent
    const importance = next.race.kind === 'national' ? 0.9 : next.race.kind === 'regional' ? 0.7 : 0.4;
    const readiness = assessReadiness(this.bike, { eventImportance: importance });
    if (readiness.ready) return null;
    const support = this.family.support_level ?? 0;
    const decision = parentRepairDecision({
      budget: this.family.money, stress: this.family.stress, trust: 50 + support * 10,
      eventImportance: importance, readiness, mechanicSkill: 40 + support * 15,
    });
    const applied = applyRepair(readiness, decision);
    if (decision.approve) {
      this.spend(applied.spent);
      for (const p of applied.repaired) {
        if (p === 'condition') this.bike.condition = Math.max(this.bike.condition, 85);
        else if (this.bike.parts && this.bike.parts[p] != null) this.bike.parts[p] = 100;
      }
      const how = decision.channel === 'shop' ? 'took the bike to the shop' : decision.channel === 'dealer' ? 'ordered new parts' : 'tracked down used parts';
      this.notify({ source: 'garage', priority: 'normal', title: `Bike prepped for ${next.race.name}`, body: `${decision.reason} ($${applied.spent})`, actionTarget: { screen: 'garage' }, icon: '🔧' });
      this.addNews(`Your parents ${how} to get you ready for ${next.race.name}.`, 'family');
      this.stress(decision.channel === 'dealer' ? 3 : 1);
      this.log(`🔧 Parents prepped the bike (${decision.channel}, $${applied.spent}).`);
    } else if (applied.warning) {
      this.notify({ source: 'garage', priority: 'high', title: 'Bike not fully race-ready', body: `${decision.reason} ${next.race.name} is coming up.`, actionTarget: { screen: 'garage' }, icon: '⚠️' });
      this.addNews(`Money’s tight — the bike isn’t fully sorted for ${next.race.name}.`, 'family');
      this.log(`⚠️ Bike not fully ready for ${next.race.name} (${decision.reason}).`);
    }
    return { decision, applied };
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
    // Phone: surface upcoming race weekends + registration reminders (#74).
    this.queueCalendarNotifications();
    // Dealer orders in transit may arrive this week (#39).
    this.receiveDealerOrders();
    // Young riders: the parent gets the bike ready before a nearby race (#222).
    this.parentManageBikePrep();
  }

  // Add calendar notifications for the next race weekend and its registration
  // deadline (deduped per week). Expires once the week has passed (#74).
  queueCalendarNotifications() {
    const next = (this.state.calendar ?? []).find((c) => c.week >= this.week && c.race);
    if (!next) return;
    const dayOfWeek = (next.week - 1) * 7 + (this.state.seasonNumber - 1) * 84;
    const weeksOut = next.week - this.week;
    if (weeksOut === 0) {
      this.notify({ key: `race_wk_${this.state.seasonNumber}_${next.week}`, source: 'calendar', priority: 'high', title: `Race weekend: ${next.race.name}`, body: 'This weekend. Get the bike and the body ready.', actionTarget: { screen: 'week' }, expiresDay: dayOfWeek + 7, icon: '🏁' });
    } else if (weeksOut <= 2) {
      this.notify({ key: `reg_${this.state.seasonNumber}_${next.week}`, source: 'calendar', priority: 'normal', title: `Registration: ${next.race.name}`, body: `${weeksOut} week${weeksOut === 1 ? '' : 's'} out. Lock in your plan.`, actionTarget: { screen: 'week' }, expiresDay: dayOfWeek, icon: '📅' });
    }
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

  // Attend a training camp on a camp week (issue #5).
  attendCamp(id) {
    const camp = CAMPS[id];
    if (!camp) return { ok: false, outcome: 'No such camp.' };
    if (!this.spend(camp.cost)) {
      this.stress(3);
      return { ok: false, outcome: `Couldn't afford the $${camp.cost} camp fee.` };
    }
    const outcome = camp.apply(this);
    this.log(`${camp.icon} ${camp.label}: ${outcome}`);
    return { ok: true, name: camp.label, icon: camp.icon, outcome };
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
      const energy = afterSchool.has(key); // does the kid have after-school energy today?
      if (age <= 5) {
        // Preschool is a half-day: afternoons free for a little play/activity
        // (issue #17) — it no longer eats the whole day.
        const slots = energy ? [{ id: key + '-1', type: 'light', afterSchool: true }] : [];
        days.push({ key, label, kind: 'preschool', daytime: 'Preschool ½ day', slots });
      } else if (homeschool) {
        // Homeschool is flexible: on energy days you can ride AND still fit an
        // after-lesson light activity in; otherwise a single light slot.
        const slots = energy
          ? [{ id: key + '-1', type: 'full' }, { id: key + '-2', type: 'light', afterSchool: true }]
          : [{ id: key + '-1', type: 'light' }];
        days.push({ key, label, kind: 'home', daytime: 'Homeschool', slots });
      } else {
        // Public school: the day is school, but the evening is yours on the days
        // you've got the energy for it.
        const slots = energy ? [{ id: key + '-1', type: 'light', afterSchool: true }] : [];
        days.push({ key, label, kind: 'school', daytime: 'School + evening', slots });
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
  addBike(bike, { via = 'purchase', gift = false, from = null, price = null, silent = false } = {}) {
    if (!this.state.garage.bikes) this.state.garage.bikes = [];
    this.state.garage.bikes.push(bike);
    // Provenance always; an automatic "new bike" memory only for a genuinely
    // new acquisition, not a bike moved into storage (issues #69/#70).
    const prov = this.assets.ensure(bike, { kind: 'bike' });
    if (!silent) {
      this.fireMemoryTriggers('asset:acquired', {
        kind: 'bike', assetId: bike.assetId, name: bike.name ?? bike.klass, via, gift, from, eventId: bike.assetId,
      });
    }
    return prov;
  }

  // Run resolved-event memory triggers and record any memories they produce,
  // linking asset-scoped memories back to their provenance record (issues #69/#70).
  fireMemoryTriggers(eventType, payload = {}) {
    const created = [];
    for (const d of this.memTriggers.handle(eventType, payload, { rider: this.rider.name, campaign: this.campaign })) {
      const mem = this.memory.record({ ...d, force: true });
      if (!mem) continue;
      created.push(mem);
      for (const e of mem.entities ?? []) {
        const prov = this.assets.get(e.id);
        if (prov && !prov.memories.includes(mem.id)) prov.memories.push(mem.id);
      }
    }
    return created;
  }

  // ---- Phone / Internet hub + notifications (issues #34/#40/#73/#74) -------
  // The game's current day-index (season-aware), used to timestamp notifications.
  get dayIndex() { return (this.state.seasonNumber - 1) * 84 + (this.week - 1) * 7; }

  // Raise a phone notification (issue #74). `key` de-dupes if provided.
  notify({ key = null, ...input } = {}) {
    const n = { day: this.dayIndex, ...input };
    return key != null ? this.notifications.addOnce(key, n) : this.notifications.add(n);
  }

  phoneCtx() { return { age: this.rider.age, campaign: this.campaign }; }

  responsibilityCtx(extra = {}) {
    return {
      age: this.rider.age,
      gradesGood: this.flag('grades_good'),
      helpedBike: this.flag('helped_bike') || this.flag('background_mechanic'),
      earnedOwnMoney: this.flag('earned_own_money'),
      irresponsibleSpending: this.flag('irresponsible_spending'),
      injury: this.rider.injury,
      familyStress: this.family.stress,
      money: this.family.money,
      ...extra,
    };
  }
  trustScore(extra = {}) {
    const score = trustScore(this.responsibilityCtx(extra));
    this.state.responsibility = { ...(this.state.responsibility ?? {}), trust: score, updatedWeek: this.week };
    return score;
  }
  permissionFor(action, extra = {}) {
    return permissionFor(action, { age: this.rider.age, trust: this.trustScore(extra) });
  }
  approvalFor(action, extra = {}) {
    return evaluateApproval(action, this.responsibilityCtx(extra));
  }

  // Apps for the phone home screen, with access gating + unread badges (#73).
  phoneApps() {
    const unread = this.notifications.unreadBySource(this.dayIndex);
    const badges = {
      calendar: unread.calendar ?? 0,
      marketplace: unread.marketplace ?? 0,
      dealer: unread.dealer ?? 0,
      memories: unread.memory ?? 0,
      results: unread.competition ?? 0,
      news: unread.news ?? 0,
      messages: (unread.family ?? 0) + (unread.sponsor ?? 0),
      garage: unread.garage ?? 0,
    };
    return buildPhoneApps(this.phoneCtx(), badges);
  }
  phoneAccess(appId) { return canAccess(appId, this.phoneCtx()); }
  phoneState(appId) { return this.phoneStateStore.state(appId); }
  updatePhoneState(appId, patch = {}) {
    this.phoneStateStore.update(appId, patch);
    this.state.phoneState = this.phoneStateStore.toJSON();
    return this.phoneStateStore.state(appId);
  }

  // ---- Dealer channel: OEM catalog + orders (issues #33/#39) ---------------
  // A sponsor unlocks a dealer discount on eligible parts.
  dealerDiscount() { return (this.sponsors.active?.().length ?? 0) > 0 ? 0.15 : 0; }
  dealerCatalog() {
    return buildDealerCatalog(this.bike).map((i) => ({ ...i, price: dealerPrice(i, { sponsorDiscount: this.dealerDiscount() }) }));
  }
  // Order a new part; money out now, it arrives after the shipping ETA (#39).
  orderDealerPart(itemId, { method = 'ship' } = {}) {
    const item = this.dealerCatalog().find((i) => i.id === itemId);
    if (!item) return null;
    const price = dealerPrice(item, { sponsorDiscount: this.dealerDiscount() });
    if (this.family.money < price) return { error: 'insufficient' };
    const order = placeOrder(item, { day: this.dayIndex, method, sponsorDiscount: this.dealerDiscount() });
    this.spend(order.price);
    this.state.market.orders.push(order);
    this.notify({ source: 'dealer', priority: 'normal', title: `Ordered: ${item.label}`, body: order.method === 'pickup' ? 'Ready for pickup.' : `Arrives in ~${item.shippingDays} days.`, actionTarget: { screen: 'garage' }, icon: '📦' });
    return order;
  }
  // Deliver any arrived orders: install the part (fresh life) + notify (#39).
  receiveDealerOrders() {
    const arrived = receiveOrders(this.state.market.orders ?? [], this.dayIndex);
    const partKey = { tires: 'tires', topEnd: 'topEnd', brakes: 'brakes' };
    for (const o of arrived) {
      const key = partKey[o.category];
      if (key && this.bike.parts && this.bike.parts[key] != null) this.bike.parts[key] = 100;
      else if (o.category === 'suspension') this.bikeCondition(8);
      this.notify({ source: 'dealer', priority: 'normal', title: `Delivered: ${o.label}`, body: 'Installed and ready.', actionTarget: { screen: 'garage' }, icon: '✅' });
      this.log(`📦 ${o.label} arrived and went on the bike.`);
    }
    return arrived;
  }

  // ---- Used marketplace search/filter (issues #32) -------------------------
  // Adapt the existing listing board to the searchable model's fields.
  searchUsedListings({ query = '', criteria = {}, sort = 'relevance' } = {}) {
    const adapted = (this.state.market.listings ?? []).map((l) => ({
      ...l, title: l.name, category: l.category ?? 'part', sellerRep: l.sellerRep ?? 70,
      klass: l.klass ?? null, distance: l.distance ?? 10, oem: l.oem ?? 'aftermarket',
    }));
    let out = usedSearch(adapted, query);
    out = usedFilter(out, criteria);
    return usedSort(out, sort);
  }

  // ---- Garage view models + listing flow (issues #75/#76) -----------------
  garageView() {
    return buildGarageView({
      activeBike: this.bike,
      bikes: this.state.garage.bikes ?? [],
      objects: this.state.garage.objects ?? [],
      parts: this.state.garage.parts ?? [],
      registry: this.assets,
      memories: this.state.memories,
    });
  }

  // List a garaged (non-active) bike on the used marketplace (#76).
  createListingDraft(assetId, { price = 0, notes = '' } = {}) {
    const bike = (this.state.garage.bikes ?? []).find((b) => b.assetId === assetId);
    if (!bike) return null;
    const prov = this.assets.ensure(bike, { kind: 'bike' });
    const draft = makeListingDraft(bike, { prov, askingPrice: price, conditionNotes: notes });
    publishListing(draft);
    bike.forSale = true;
    this.state.market.drafts.push(draft);
    this.notify({ source: 'marketplace', priority: 'normal', title: `Listed: ${bike.name}`, body: `Asking $${draft.askingPrice}.`, actionTarget: { screen: 'market' }, icon: '🛒' });
    return draft;
  }

  // Complete a listed sale: money in, bike out of the garage, memory + provenance (#76).
  completeListingSale(draftId, { buyerId = 'a local family', price = null } = {}) {
    const draft = (this.state.market.drafts ?? []).find((d) => d.id === draftId);
    if (!draft || draft.state === 'sold') return null;
    const prov = this.assets.get(draft.assetId);
    const sale = completeSale(draft, { buyerId, price, prov, year: this.seasonYear });
    if (!sale) return null;
    this.state.garage.bikes = (this.state.garage.bikes ?? []).filter((b) => b.assetId !== draft.assetId);
    this.addMoney(sale.price);
    this.fireMemoryTriggers('asset:sold', { kind: 'bike', assetId: draft.assetId, name: draft.name, eventId: draft.assetId });
    this.notify({ source: 'marketplace', priority: 'high', title: `Sold: ${draft.name}`, body: `+$${sale.price} from ${buyerId}.`, actionTarget: { screen: 'market' }, icon: '💰' });
    return sale;
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

  // Ensure a bike has the consumable-parts map (migrates older saves) — #15.
  ensureParts(bike) {
    const b = bike ?? this.bike;
    if (!b.parts) {
      const t = 100 - (b.tireWear ?? 0);
      b.parts = { tires: t, topEnd: 100, chain: 100, brakes: 100 };
    }
    return b.parts;
  }

  // Apply wear to a specific bike (defaults to the race bike). `parts` is a map
  // of part-key -> life delta (negative = wear) — issue #15.
  wearBike(bike, { condition = 0, reliability = 0, parts = null } = {}) {
    const b = bike ?? this.bike;
    if (condition) b.condition = clamp(b.condition + condition);
    if (reliability) b.reliability = clamp(b.reliability + reliability);
    if (parts) {
      const p = this.ensureParts(b);
      for (const [k, d] of Object.entries(parts)) p[k] = clamp((p[k] ?? 100) + d, 0, 100);
    }
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

  classTransitionStatus(age = this.rider.age) {
    return needsClassBike({ age, currentClass: this.rider.klass, ownedBikes: this.ownedBikes() });
  }
  buyRequiredClassBike({ year = this.seasonYear, price = null } = {}) {
    const status = this.classTransitionStatus();
    if (!status.requiresPurchase) return { ok: true, status, bike: this.ownedBikes().find((b) => b.klass === status.targetClass) };
    const bike = createBikeForClass(status.targetClass, year);
    const cost = price ?? Math.round(650 + (status.eligibleClasses.indexOf(status.targetClass) + 1) * 225);
    const approval = this.approvalFor('buy_bike', { cost });
    if (this.family.money < cost) return { ok: false, reason: 'insufficient_funds', cost, approval, status };
    if (approval.result === 'denied') return { ok: false, reason: 'approval_denied', cost, approval, status };
    this.spend(cost);
    this.addBike(bike, { via: 'purchase', price: cost });
    return { ok: true, bike, cost, approval, status };
  }

  startRaceWeekend(entry = null) {
    const race = entry?.race ?? this.meta()?.race;
    if (!race) return null;
    const classes = this.enterableClasses().map((c) => c.klass);
    const weekend = createRaceWeekend(race, { classes });
    const approval = this.approvalFor(race.lorettaStage ? 'loretta_attempt' : 'ask_race', {
      cost: Math.round(35 * (race.entryMult ?? 1)),
    });
    const readiness = readinessChecklist({
      event: race,
      rider: this.rider,
      bike: this.bike,
      family: this.family,
      classes,
      approval,
      currentDay: this.dayIndex,
    });
    const registered = registerWeekend(weekend, readiness);
    this.state.raceWeekend = registered;
    return registered;
  }
  advanceRaceWeekend(event = {}) {
    if (!this.state.raceWeekend) return null;
    this.state.raceWeekend = advanceWeekend(this.state.raceWeekend, event);
    return this.state.raceWeekend;
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
    this.wearBike(raced, { condition: -15, parts: { tires: -9, topEnd: -5, chain: -6, brakes: -5 } });
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

    // Competition Engine (issues #63–#67): progression, standings, momentum,
    // and rival history all consume the race result.
    this.recordCompetition(result);

    // Road to Loretta's: if this was a qualifying event, advance the path and
    // turn any milestones into memories (issues #25/#31/#58–#62).
    this.recordLorettaResult(result);

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

  // Feed a race result into the Competition Engine: per-class progression,
  // season standings, momentum/streak, and rival history (issues #63–#67).
  recordCompetition(result) {
    const overall = result.dnf ? null : result.overall;
    // #63 class progression
    this.progression.record(result.klass, overall, { dnf: result.dnf });
    // #64/#67 a serializable result record rolled into standings
    this.standings.add(resolveResult({
      eventId: result.race.name, riderId: 'me', klass: result.klass, bikeId: result.bikeId,
      calendarWeek: this.week, motos: result.motos ?? [], fieldSize: result.fieldSize ?? 30,
      overall: result.overall ?? null, status: result.dnf ? 'dnf' : 'finished',
      table: result.race.kind === 'national' ? 'pro' : 'amateur',
    }));
    // #66 momentum & streak, with a reason code. Mirror the game's confidence
    // (which the balanced race logic already moved) so the two read together.
    this.momentum.confidence = this.rider.confidence;
    const reason = result.dnf ? 'dnf'
      : result.overall === 1 ? 'win'
      : result.overall <= 3 ? 'podium'
      : result.overall <= (result.fieldSize ?? 30) / 2 ? 'top_half' : 'back_half';
    this.momentum.apply(reason, { source: result.race.name });
    const notable = this.momentum.notableEvent();
    if (notable?.kind === 'hot_streak') this.addNews(`${this.rider.name} is on a heater — ${this.momentum.streak} strong weekends in a row.`, 'world');
    else if (notable?.kind === 'slump') this.addNews(`${this.rider.name} is fighting a slump — ${-this.momentum.streak} rough weekends running.`, 'world');
    // #65 rival history: the head-to-head against the recurring rival.
    if (result.rivalOverall != null) {
      const beat = result.overall < result.rivalOverall;
      this.rivals.encounter({ id: 'rival_ethan', name: this.rel('rival_ethan').name }, { beat });
      const hook = this.rivals.memoryHook({ id: 'rival_ethan', name: this.rel('rival_ethan').name }, { beat });
      if (hook) this.memory.record({ type: 'relationship', title: hook.title, summary: hook.summary, people: ['rival_ethan'], tags: hook.tags, importance: hook.importance, force: true });
    }
    return { momentum: this.momentum.state() };
  }

  // Advance the Road to Loretta's from a race result and record milestones as
  // memories (issues #25/#31/#58–#62). No-op for non-qualifying races.
  recordLorettaResult(result) {
    const race = result.race;
    if (!race || !classifyEvent(race)) return null;
    const outcome = this.lorettas.recordAttempt(race, {
      klass: result.klass,
      region: race.region,
      finish: result.dnf ? (result.fieldSize ?? 30) : result.overall,
      fieldSize: result.fieldSize ?? 30,
      day: (this.week - 1) * 7,
      eventName: race.name,
    });
    if (!outcome) return null;
    for (const m of outcome.milestones) {
      this.memory.record({
        type: 'race_result', title: m.title, summary: m.summary,
        emotion: m.emotion ?? [], people: this.isParent ? ['child'] : ['dad', 'mom'],
        tags: m.tags ?? ['lorettas'], importance: m.importance ?? 70, force: true,
      });
    }
    if (outcome.advanced) {
      const label = outcome.nextStage === 'national' ? 'Loretta Lynn’s' : 'the Regional Championship';
      this.addNews(`${this.rider.name} advanced out of ${race.name} — through to ${label}!`, 'world');
      this.log(`🎟️ Advanced to ${label}.`);
    } else if (outcome.eliminated) {
      this.addNews(`${this.rider.name} came up short at ${race.name} — the Road to Loretta’s ends here for now.`, 'world');
      this.log(`🚧 Didn’t transfer at ${race.name}.`);
    }
    return outcome;
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

    // Moving up a class: the outgrown bike becomes a keepsake, but the correct
    // next-class bike must be owned or bought. No silent free bike.
    if (newClass !== this.rider.klass) {
      const old = this.bike;
      old.role = 'spare';
      this.addBike(old, { silent: true }); // keep the outgrown bike in the garage (issue #3)
      this.garage.objects.push({
        name: `${old.name} (first ${old.klass})`,
        memory: `Your ${old.klass} from ${old.year}. Outgrown, never forgotten.`,
      });
      const ownedNext = (this.state.garage.bikes ?? []).find((b) => b.klass === newClass && b.role !== 'sold');
      this.rider.klass = newClass;
      if (ownedNext) {
        this.setRaceBike(ownedNext.assetId);
        this.memory.record(classTransitionMemory({ fromClass: old.klass, toClass: newClass, boughtBike: false }));
      } else {
        const cost = 900 + (ELIGIBLE_CLASSES(this.rider.age).indexOf(newClass) * 250);
        if (this.family.money >= cost) {
          this.spend(cost);
          const nextBike = createBikeForClass(newClass, this.seasonYear - 1);
          this.state.bike = nextBike;
          this.assets.ensure(nextBike, { kind: 'bike' }); // provenance for the new machine (#69)
          this.memory.record(classTransitionMemory({ fromClass: old.klass, toClass: newClass, boughtBike: true }));
          this.addNews(`Moved up to ${newClass}. The family bought the bike required to race the new class.`, 'garage');
        } else {
          this.state.bike = old;
          this.state.flags.needs_class_bike = newClass;
          this.memory.record(classTransitionMemory({ fromClass: old.klass, toClass: newClass, boughtBike: false }));
          this.addNews(`Moved up to ${newClass}, but the right bike is still needed before racing that class.`, 'garage');
        }
      }
    }

    // Natural maturation — kids get stronger as they grow.
    this.skill('fitness', this.rng.int(2, 5));
    this.skill('cornering', this.rng.int(1, 3));
    this.skill('consistency', this.rng.int(1, 3));

    // A new season resets the calendar clock but keeps the life.
    this.state.week = 1;
    this.state._preparedWeek = 0;
    this.state.season = { results: [], points: 0, bestFinish: null, classPoints: {}, riderPoints: {} };
    // New season: reset to the default (all-local) program; the player rebuilds
    // their schedule at season start (issue #22).
    this.state.program = defaultProgram(this.eventPool());
    this.state.programSet = false;
    this.state.seasonGoals = [];
    this.rebuildCalendar();
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
