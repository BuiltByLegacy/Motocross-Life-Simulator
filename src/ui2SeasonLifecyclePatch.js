import {
  createSeasonLifecycleState,
  openSeasonLifecycle,
  chooseSeasonPosture,
  evaluateFamilyGuardrails,
  evaluateInSeasonSponsorMarket,
  recordInSeasonSponsorDecision,
  SEASON_POSTURES,
} from './systems/seasonLifecycle.js';
import {
  buildMidseasonReview,
  applyMidseasonPivot,
  finalizeSeasonLifecycle,
} from './systems/seasonLifecycleReview.js';

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = String(text);
  return n;
}
function add(parent, ...children) { children.flat().filter(Boolean).forEach((c) => parent.appendChild(c)); return parent; }
function money(n) { return `$${Number(n || 0).toLocaleString()}`; }

function ensureStyles() {
  if (document.querySelector('link[data-ui2-season-lifecycle-styles]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './ui2SeasonLifecycle.css';
  link.dataset.ui2SeasonLifecycleStyles = 'true';
  document.head.appendChild(link);
}

function selectedProgramEvents(g) {
  const pool = g.eventPool?.() ?? {};
  const out = [];
  for (const [week, id] of Object.entries(g.state.program ?? {})) {
    if (!id) continue;
    const ev = (pool[week] ?? []).find((e) => e.id === id);
    if (ev) out.push({
      id: ev.id,
      name: ev.name,
      entryFee: ev.entry ?? ev.cost ?? 0,
      travelBand: String(ev.travel ?? '').toLowerCase().includes('long') ? 'long-haul' : 'local',
      travelCost: String(ev.travel ?? '').toLowerCase().includes('long') ? 450 : 75,
    });
  }
  return out;
}

function priorSeason(g) {
  return g.state.careerHistory?.at(-1) ?? { wins: 0, podiums: 0, races: 0 };
}

function supportValue(g) {
  const active = g.sponsors?.active?.() ?? [];
  return active.reduce((sum, s) => sum + Number(s.stipend ?? 0) + Number(s.bonus ?? 0), 0);
}

function ensureLifecycle(g) {
  if (!g.state.seasonLifecycle || g.state.seasonLifecycle.seasonNumber !== g.state.seasonNumber) {
    let state = createSeasonLifecycleState({ seasonNumber: g.state.seasonNumber, seasonYear: g.seasonYear, carryover: g.state.seasonLifecycle?.carryover ?? null });
    const events = selectedProgramEvents(g);
    state = openSeasonLifecycle(state, {
      seasonNumber: g.state.seasonNumber,
      seasonYear: g.seasonYear,
      age: g.rider.age,
      className: g.rider.klass,
      priorSeason: priorSeason(g),
      familyMoney: g.family.money,
      supportValue: supportValue(g),
      events,
      bikeCondition: g.bike.condition,
      fatigue: g.rider.fatigue,
      injury: g.rider.injury,
      familyStress: g.family.stress,
      reputation: Math.min(100, g.careerPodiums?.() * 7 + g.careerWins?.() * 10),
      region: g.state.geography?.homeRegionId ?? 'northeast',
    });
    g.state.seasonLifecycle = state;
  }
  return g.state.seasonLifecycle;
}

function shell(scene, eyebrow, title, subtitle) {
  const root = el('section', `season-life ${scene}`);
  root.dataset.testid = `season-lifecycle-${scene}`;
  add(root,
    add(el('header', 'season-life-mast'),
      add(el('div'), el('small', '', eyebrow), el('h1', '', title), el('p', '', subtitle))
    )
  );
  return root;
}

function renderBrief(app) {
  const g = app.game;
  const state = ensureLifecycle(g);
  const brief = state.brief;
  const root = shell('brief', `${g.seasonYear} · BEFORE THE GATE DROPS`, 'THE SEASON BRIEF', `${g.rider.name} · ${g.rider.klass} · decide what kind of year this is going to be.`);

  const hero = add(el('div', 'season-life-hero'),
    add(el('div'), el('small', '', 'RECOMMENDED POSTURE'), el('strong', '', SEASON_POSTURES[state.recommendedPosture]?.label ?? 'Build Year'), el('p', '', SEASON_POSTURES[state.recommendedPosture]?.description ?? '')),
    add(el('div', 'season-life-money'), el('small', '', 'PROJECTED SEASON'), el('strong', '', money(brief.projectedSeasonCost)), el('span', '', brief.fundingGap ? `${money(brief.fundingGap)} gap` : 'funded'))
  );
  root.appendChild(hero);

  if (brief.risks?.length) {
    const risks = el('div', 'season-life-risks');
    add(risks, el('h2', '', 'What could change this year'));
    brief.risks.forEach((r) => add(risks, add(el('div', `season-risk ${r.severity}`), el('b', '', r.type.toUpperCase()), el('span', '', r.value ? money(r.value) : r.severity))));
    root.appendChild(risks);
  }

  const actions = el('div', 'season-life-actions');
  Object.values(SEASON_POSTURES).forEach((posture) => {
    const b = el('button', posture.id === state.recommendedPosture ? 'season-primary' : 'season-secondary');
    b.type = 'button';
    b.dataset.posture = posture.id;
    b.onclick = () => {
      g.state.seasonLifecycle = chooseSeasonPosture(state, posture.id, []);
      g.state.seasonLifecycle.uiStage = 'family-plan';
      app.saveGame();
      app.showWeek(() => renderFamilyPlan(app));
    };
    add(b, el('strong', '', posture.label), el('span', '', posture.description));
    actions.appendChild(b);
  });
  root.appendChild(actions);
  return root;
}

function renderFamilyPlan(app) {
  const g = app.game;
  const state = ensureLifecycle(g);
  const events = selectedProgramEvents(g);
  const guardrails = evaluateFamilyGuardrails(state, { events });
  const plan = state.familyPlan;
  const root = shell('family-plan', 'FAMILY MEETING · GARAGE WORKBENCH', 'THE FAMILY PLAN', 'Decide what the household can actually support before the calendar becomes a promise.');

  add(root,
    add(el('div', 'family-plan-board'),
      add(el('div'), el('small', '', 'MAX RACE + TRAVEL'), el('strong', '', money(plan.maxRaceTravelBudget))),
      add(el('div'), el('small', '', 'LONG-HAUL WEEKENDS'), el('strong', '', plan.longDistanceWeekends)),
      add(el('div'), el('small', '', 'SCHOOL / FAMILY PRIORITY'), el('strong', '', `${plan.schoolFamilyPriority}/100`)),
      add(el('div'), el('small', '', 'LORETTA INTENT'), el('strong', '', String(plan.lorettaIntent).replaceAll('-', ' ')))
    )
  );

  if (guardrails.warnings.length) {
    const warning = el('div', 'season-life-warning');
    add(warning, el('b', '', 'The current plan needs attention'));
    guardrails.warnings.forEach((w) => warning.appendChild(el('p', '', w.type === 'budget' ? `Projected plan is ${money(w.overBy)} over the family guardrail.` : `${w.type.replaceAll('-', ' ')} pressure is above the family plan.`)));
    root.appendChild(warning);
  }

  const cta = el('button', 'season-primary', 'TAKE THIS PLAN TO THE SEASON BOARD →');
  cta.type = 'button';
  cta.dataset.testid = 'family-plan-continue';
  cta.onclick = () => {
    g.state.seasonLifecycle = { ...state, openingComplete: true, uiStage: 'season' };
    app.saveGame();
    app._programSel = { ...g.state.program };
    app.showWeek(() => app.viewProgramBuilder(false));
  };
  root.appendChild(cta);
  return root;
}

function resultsProfile(g) {
  const results = g.state.season.results ?? [];
  const wins = results.filter((r) => r.overall === 1).length;
  const podiums = results.filter((r) => r.overall <= 3 && !r.dnf).length;
  const best = g.state.season.bestFinish ?? 30;
  const performance = Math.max(0, Math.min(100, wins * 24 + podiums * 10 + Math.max(0, 35 - best)));
  return { results, wins, podiums, performance };
}

function maybeGenerateSponsorOpportunity(g) {
  const state = ensureLifecycle(g);
  const p = resultsProfile(g);
  if (!p.results.length) return null;
  const event = p.results.at(-1);
  const generated = evaluateInSeasonSponsorMarket(state, {
    careerSeed: String(g.state.seed ?? g.rng?.seed ?? 'career'),
    seasonYear: g.seasonYear,
    milestoneKey: `${g.seasonYear}:race:${event.week}:${event.race}`,
    eventId: event.race,
    performance: p.performance,
    reputation: Math.min(100, g.careerPodiums?.() * 7 + g.careerWins?.() * 10),
    visibility: Math.min(100, p.podiums * 12 + p.wins * 18),
    professionalism: 72,
    compliance: 82,
    majorQualification: /qualifier|regional|loretta/i.test(event.race ?? '') && (event.overall ?? 99) <= 8,
    rivalryMomentum: Math.max(0, Number(g.momentum?.streak ?? 0) * 15),
    activeSponsorIds: g.state.sponsors ?? [],
    activeCategories: g.sponsors?.active?.().map((s) => s.category) ?? [],
    trigger: event.overall === 1 ? 'breakout-result' : 'performance',
  });
  g.state.seasonLifecycle = generated.state;
  return generated.generated[0] ?? null;
}

function renderSponsorOpportunity(app, lead) {
  const g = app.game;
  const root = shell('sponsor-opportunity', 'PADDOCK CALL · IN-SEASON', lead.sponsorName, `Your season changed how ${lead.sponsorName} sees you.`);
  add(root,
    add(el('div', 'season-life-hero'),
      add(el('div'), el('small', '', 'WHY NOW'), el('strong', '', String(lead.trigger).replaceAll('-', ' ')), el('p', '', 'This support exists because of what happened on track and in the paddock — not because a progress bar filled.')),
      add(el('div', 'season-life-money'), el('small', '', 'SUPPORT PREVIEW'), el('strong', '', money(lead.supportPreview?.cash)), el('span', '', `${money(lead.supportPreview?.productValue)} product value`))
    )
  );

  const decide = (decision) => {
    const outcome = recordInSeasonSponsorDecision(g.state.seasonLifecycle, lead.id, decision, { counter: decision === 'counter' ? { cash: Number(lead.supportPreview?.cash ?? 0) + 250 } : null });
    g.state.seasonLifecycle = outcome.state;
    const change = { seasonYear: g.seasonYear, type: 'major-sponsor-offer', eventId: lead.id, date: `${g.seasonYear}-06-15` };
    const p = resultsProfile(g);
    const mid = buildMidseasonReview(g.state.seasonLifecycle, change, { wins: p.wins, podiums: p.podiums, races: p.results.length, familyMoney: g.family.money, familyStress: g.family.stress, bikeCondition: g.bike.condition, supportValue: supportValue(g), injury: g.rider.injury });
    app._pendingLifecycleMidseason = mid.review;
    app.saveGame();
    app.showWeek(() => renderMidseasonReview(app, mid.review));
  };

  const actions = el('div', 'season-life-decision-row');
  [['accept', 'ACCEPT SUPPORT'], ['counter', 'COUNTER'], ['reject', 'PASS']].forEach(([key, label], i) => {
    const b = el('button', i === 0 ? 'season-primary' : 'season-secondary', label);
    b.type = 'button';
    b.dataset.sponsorDecision = key;
    b.onclick = () => decide(key);
    actions.appendChild(b);
  });
  root.appendChild(actions);
  return root;
}

function renderMidseasonReview(app, review) {
  if (!review) return el('div', '', '');
  const g = app.game;
  const root = shell('midseason-review', 'MIDSEASON · FAMILY CHECK-IN', 'THE SEASON CHANGED', `${String(review.change?.type ?? 'change').replaceAll('-', ' ')} created a reason to revisit the opening plan.`);
  add(root,
    add(el('div', 'season-life-hero'),
      add(el('div'), el('small', '', 'OPENING POSTURE'), el('strong', '', SEASON_POSTURES[review.opening?.posture]?.label ?? 'Open season'), el('p', '', `${review.current?.wins ?? 0} wins · ${review.current?.podiums ?? 0} podiums · ${review.current?.races ?? 0} races so far`)),
      add(el('div', 'season-life-money'), el('small', '', 'FAMILY MONEY NOW'), el('strong', '', money(review.current?.familyMoney)), el('span', '', `Bike ${review.current?.bikeCondition ?? 0}%`))
    )
  );
  const notes = el('div', 'season-life-risks');
  review.recommendations.forEach((r) => notes.appendChild(add(el('div', 'season-risk medium'), el('b', '', r.replaceAll('-', ' ')))));
  root.appendChild(notes);
  const cta = el('button', 'season-primary', 'UPDATE THE FUTURE, KEEP THE HISTORY →');
  cta.dataset.testid = 'midseason-continue';
  cta.onclick = () => {
    const pivot = applyMidseasonPivot(g.state.seasonLifecycle, review, { calendar: g.state.calendar ?? [] });
    g.state.seasonLifecycle = { ...pivot.state, uiStage: 'season' };
    app._pendingLifecycleMidseason = null;
    app.saveGame();
    app.showWeek(() => app.viewWeekSummary());
  };
  root.appendChild(cta);
  return root;
}

function buildActualSeason(g) {
  const p = resultsProfile(g);
  return {
    races: p.results.length,
    wins: p.wins,
    podiums: p.podiums,
    bestFinish: g.state.season.bestFinish,
    seasonSpend: Math.max(0, Number(g.state.seasonLifecycle?.brief?.familyMoney ?? g.family.money) - Number(g.family.money)),
    endingMoney: g.family.money,
    endingSupportValue: supportValue(g),
    familyStress: g.family.stress,
    injury: g.rider.injury,
    memories: g.memory?.top?.(5) ?? [],
    bikes: [g.bike, ...(g.state.garage?.bikes ?? [])],
    familySupport: g.family.support_level,
    reputation: { local: Math.min(100, (g.careerPodiums?.() ?? 0) * 8 + (g.careerWins?.() ?? 0) * 10) },
    sponsorRenewalInterest: (g.state.sponsors ?? []).map((id) => ({ sponsorId: id, status: 'evaluate-next-season' })),
    unresolvedObligations: [],
    careerOpportunities: g.state.opportunities ?? [],
  };
}

function renderSeasonReview(app) {
  const g = app.game;
  let state = ensureLifecycle(g);
  if (!state.review) {
    const final = finalizeSeasonLifecycle(state, buildActualSeason(g));
    state = { ...final.state, reviewAcknowledged: false };
    g.state.seasonLifecycle = state;
    app.saveGame();
  }
  const review = state.review;
  const root = shell('season-review', 'RECORD BOOK · END OF YEAR', `${g.seasonYear} SEASON REVIEW`, 'Close the year by comparing the plan you made with the life you actually lived.');

  add(root,
    add(el('div', 'season-review-spread'),
      add(el('div'), el('small', '', 'WE SAID'), el('strong', '', SEASON_POSTURES[review.plan?.posture]?.label ?? 'Season'), el('span', '', `${money(review.plan?.projectedSeasonCost)} projected`)),
      add(el('div'), el('small', '', 'WE LIVED'), el('strong', '', `${review.reality?.wins ?? 0} wins · ${review.reality?.podiums ?? 0} podiums`), el('span', '', `${review.reality?.races ?? 0} race weekends`))
    )
  );

  const story = el('div', 'season-life-risks');
  (review.highlights ?? []).forEach((h) => story.appendChild(add(el('div', 'season-risk low'), el('b', '', h.type.replaceAll('-', ' ')), el('span', '', typeof h.value === 'object' ? 'season moment' : h.value))));
  (review.misses ?? []).forEach((m) => story.appendChild(add(el('div', 'season-risk high'), el('b', '', m.type.replaceAll('-', ' ')), el('span', '', typeof m.value === 'object' ? 'carried forward' : m.value))));
  root.appendChild(story);

  const cta = el('button', 'season-primary', 'CARRY THIS YEAR FORWARD →');
  cta.dataset.testid = 'season-review-continue';
  cta.onclick = () => {
    g.state.seasonLifecycle.reviewAcknowledged = true;
    app.saveGame();
    app.__seasonLifecycleOriginalRenderRecap();
  };
  root.appendChild(cta);
  return root;
}

export function installUi2SeasonLifecyclePatch(App) {
  if (!App || App.prototype.__ui2SeasonLifecycleInstalled) return;
  App.prototype.__ui2SeasonLifecycleInstalled = true;
  ensureStyles();

  const originalStartWeek = App.prototype.startWeek;
  const originalFinishWeek = App.prototype.finishWeek;
  const originalRenderRecap = App.prototype.renderRecap;
  const originalNextSeason = App.prototype.nextSeason;

  App.prototype.__seasonLifecycleOriginalRenderRecap = function () { return originalRenderRecap.call(this); };

  App.prototype.startWeek = function seasonLifecycleStartWeek() {
    const g = this.game;
    if (g && g.week === 1 && !g.state.programSet && g.state.simDepth !== 'fast') {
      const state = ensureLifecycle(g);
      if (!state.openingComplete) {
        return this.showWeek(() => state.uiStage === 'family-plan' ? renderFamilyPlan(this) : renderBrief(this));
      }
    }
    return originalStartWeek.call(this);
  };

  App.prototype.finishWeek = function seasonLifecycleFinishWeek() {
    const g = this.game;
    if (g && !g.depth.autoRace) {
      const lead = maybeGenerateSponsorOpportunity(g);
      if (lead) {
        this.saveGame();
        return this.showWeek(() => renderSponsorOpportunity(this, lead));
      }
    }
    return originalFinishWeek.call(this);
  };

  App.prototype.renderRecap = function seasonLifecycleRenderRecap() {
    const g = this.game;
    if (g) {
      const state = ensureLifecycle(g);
      if (!state.reviewAcknowledged) {
        const view = renderSeasonReview(this);
        this.root.replaceChildren(view);
        window.scrollTo(0, 0);
        return;
      }
    }
    return originalRenderRecap.call(this);
  };

  App.prototype.nextSeason = function seasonLifecycleNextSeason() {
    const carryover = this.game?.state?.seasonLifecycle?.carryover ?? null;
    originalNextSeason.call(this);
    if (this.game) this.game.state.seasonLifecycle = createSeasonLifecycleState({ seasonNumber: this.game.state.seasonNumber, seasonYear: this.game.seasonYear, carryover });
  };

  App.prototype.renderSeasonLifecycleBrief = function () { return renderBrief(this); };
  App.prototype.renderSeasonLifecycleFamilyPlan = function () { return renderFamilyPlan(this); };
  App.prototype.renderSeasonLifecycleSponsorOpportunity = function (lead) { return renderSponsorOpportunity(this, lead); };
  App.prototype.renderSeasonLifecycleMidseasonReview = function (review) { return renderMidseasonReview(this, review); };
  App.prototype.renderSeasonLifecycleReview = function () { return renderSeasonReview(this); };
}
