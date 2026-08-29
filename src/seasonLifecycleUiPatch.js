import {
  SEASON_POSTURES,
  buildSeasonBrief,
  buildSeasonReview,
  createFamilyPlan,
  evaluateFamilyPlan,
  evaluatePivot,
  inSeasonSponsorOpportunity,
  recordPivot,
  recordSponsorDecision,
  restoreLifecycleState,
} from './systems/seasonLifecycle.js';

function n(tag, cls, text) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text != null) el.textContent = String(text);
  return el;
}
function add(parent, ...children) { children.flat().filter(Boolean).forEach((c) => parent.appendChild(c)); return parent; }
function money(v) { return `$${Math.round(Number(v) || 0).toLocaleString()}`; }

function ensureStyles() {
  if (document.querySelector('link[data-season-lifecycle-styles]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './seasonLifecycle.css';
  link.dataset.seasonLifecycleStyles = 'true';
  document.head.appendChild(link);
}

function lifecycle(app) {
  const g = app.game;
  const raw = g.state.seasonLifecycle;
  const yearChanged = raw?.seasonYear != null && raw.seasonYear !== g.seasonYear;
  if (!raw || yearChanged) {
    const history = raw?.history ?? [];
    const carryover = raw?.carryover ?? raw?.review?.carryover ?? null;
    g.state.seasonLifecycle = restoreLifecycleState({ seasonYear: g.seasonYear, history, carryover });
  } else g.state.seasonLifecycle = restoreLifecycleState(raw);
  return g.state.seasonLifecycle;
}

function sponsorshipState(g) { return g.state.sponsorship2 ?? null; }
function activeContracts(g) {
  return (sponsorshipState(g)?.contracts ?? []).filter((c) => ['signed', 'active', 'probation'].includes(c.status));
}
function supportValue(g) {
  return activeContracts(g).reduce((sum, c) => sum + Number(c.package?.cashRetainer || 0) + Number(c.package?.entryFeeSupport || 0) + Number(c.package?.travelSupport || 0), 0);
}
function requiredObligations(g) {
  return (sponsorshipState(g)?.obligations ?? []).filter((o) => o.required !== false && !['fulfilled', 'completed'].includes(o.status));
}

function plannerCost(app) {
  const g = app.game;
  try {
    const selection = app._programSel ?? g.state.program ?? {};
    return Number(g.buildPlanner(selection).forecast(g.family.money).season.total || 0);
  } catch (_) { return 0; }
}

function seasonResults(g) {
  const rows = g.state.season?.results ?? [];
  const wins = rows.filter((r) => !r.dnf && Number(r.overall) === 1).length;
  const podiums = rows.filter((r) => !r.dnf && Number(r.overall) <= 3).length;
  const dnfs = rows.filter((r) => r.dnf).length;
  return { rows, wins, podiums, dnfs };
}

function reputation(g, results) {
  const support = Number(g.family?.support_level ?? 0);
  return Math.min(100, 15 + support * 18 + results.wins * 8 + results.podiums * 3);
}
function visibility(g, results) { return Math.min(100, 8 + results.wins * 11 + results.podiums * 5 + (g.state.season?.points ?? 0) / 8); }
function professionalism(g) { return Math.max(20, 72 - Number(g.family?.stress ?? 0) * .18); }
function compliance(g) {
  const obligations = sponsorshipState(g)?.obligations ?? [];
  if (!obligations.length) return 65;
  const done = obligations.filter((o) => ['fulfilled', 'completed'].includes(o.status)).length;
  const missed = obligations.filter((o) => ['missed', 'failed'].includes(o.status)).length;
  return Math.max(0, Math.min(100, 60 + done * 8 - missed * 18));
}

function profile(app) {
  const g = app.game;
  const results = seasonResults(g);
  const plan = lifecycle(app).familyPlan;
  const cost = plannerCost(app) || sponsorshipState(g)?.preseason?.lastBudget?.tentativeSeasonCost || 0;
  return {
    seasonYear: g.seasonYear,
    riderName: g.rider.name,
    age: g.rider.age,
    klass: g.rider.klass,
    number: g.rider.number ?? g.rider.raceNumber ?? null,
    homeRegion: g.state.homeRegion?.name ?? g.state.homeRegion?.id ?? g.state.homeRegion ?? null,
    money: g.family.money,
    projectedSeasonCost: cost,
    supportValue: supportValue(g),
    activeSponsors: activeContracts(g).length,
    bikeName: g.bike?.name,
    bikeCondition: g.bike?.condition,
    bikeReliability: g.bike?.reliability,
    fatigue: g.rider.fatigue,
    injury: g.rider.injury,
    results: Math.min(100, results.wins * 16 + results.podiums * 7 + Number(g.state.season?.points ?? 0) / 8),
    reputation: reputation(g, results),
    support: Math.min(100, activeContracts(g).length * 22 + Number(g.family?.support_level ?? 0) * 15),
    familyPlan: plan,
  };
}

const FAMILY_PRESETS = {
  conservative: createFamilyPlan({ maxSeasonSpend: 3000, maxLongTravelWeekends: 2, schoolPriority: 'high', familyPriority: 'high', debtPolicy: 'never', equipmentPolicy: 'repair-first', parentSacrifice: 'normal-work', lorettaIntent: 'if-earned' }),
  balanced: createFamilyPlan({ maxSeasonSpend: 6000, maxLongTravelWeekends: 5, schoolPriority: 'balanced', familyPriority: 'balanced', debtPolicy: 'avoid', equipmentPolicy: 'upgrade-if-needed', parentSacrifice: 'some-overtime', lorettaIntent: 'pursue-if-realistic' }),
  allin: createFamilyPlan({ maxSeasonSpend: 12000, maxLongTravelWeekends: 9, schoolPriority: 'flexible', familyPriority: 'racing-heavy', debtPolicy: 'consider', equipmentPolicy: 'performance-first', parentSacrifice: 'major-sacrifice', lorettaIntent: 'chase-it' }),
};

function briefScreen(app) {
  const g = app.game;
  const state = lifecycle(app);
  const ctx = profile(app);
  const brief = buildSeasonBrief(ctx);
  state.openingBrief = brief;
  state.openingSnapshot = { money: g.family.money, bikeCondition: g.bike?.condition, sponsorIds: activeContracts(g).map((c) => c.sponsorId) };
  const selectedPosture = app._lifecyclePosture ?? brief.recommendedPosture;
  const selectedFamily = app._lifecycleFamily ?? 'balanced';
  const plan = FAMILY_PRESETS[selectedFamily];
  const guardrails = evaluateFamilyPlan(plan, { projectedSpend: brief.projectedSeasonCost, fundingGap: brief.fundingGap, longTravelWeekends: 0 });

  const root = n('section', 'season-brief');
  root.dataset.testid = 'season-brief';
  const top = n('header', 'season-brief-top');
  add(top,
    add(n('div'), n('small', '', `${g.seasonYear} · ${g.rider.klass}`), n('h1', '', 'SEASON BRIEF'), n('p', '', `${g.rider.name}'s year starts here. Decide what this family is willing to chase.`)),
    add(n('div', 'season-brief-money'), n('small', '', 'CASH ON HAND'), n('strong', '', money(g.family.money)))
  );

  const table = n('div', 'season-kitchen-table');
  const finance = n('section', 'season-note finance');
  add(finance, n('small', '', 'MONEY'), n('h2', '', brief.projectedSeasonCost ? `${money(brief.projectedSeasonCost)} opening plan` : 'Build the plan next'),
    n('p', '', brief.projectedSeasonCost ? `${money(brief.supportValue)} confirmed support · ${money(brief.fundingGap)} funding gap` : `${activeContracts(g).length} sponsor relationship${activeContracts(g).length === 1 ? '' : 's'} entering the year.`));
  const sponsor = n('section', 'season-note sponsors');
  const obligations = requiredObligations(g);
  add(sponsor, n('small', '', 'SPONSORS'), n('h2', '', activeContracts(g).length ? `${activeContracts(g).length} backing the program` : 'Still family funded'),
    n('p', '', obligations.length ? `${obligations.length} sponsor commitment${obligations.length === 1 ? '' : 's'} need attention this season.` : 'Good results can still create support opportunities after the gate drops.'));
  const machine = n('section', 'season-note bike');
  add(machine, n('small', '', 'THE BIKE'), n('h2', '', g.bike?.name ?? 'Race bike'), n('p', '', `Condition ${Math.round(g.bike?.condition ?? 100)} · Reliability ${Math.round(g.bike?.reliability ?? 100)}`));
  add(table, finance, sponsor, machine);

  if (brief.risks.length) {
    const risks = n('div', 'season-risk-strip');
    add(risks, n('b', '', 'Before we commit:'), ...brief.risks.map((r) => n('span', '', r.text)));
    root.appendChild(risks);
  }

  const posture = n('section', 'season-decision');
  add(posture, n('small', '', 'WHAT KIND OF YEAR IS THIS?'), n('h2', '', `Recommendation: ${SEASON_POSTURES[brief.recommendedPosture].label}`), n('p', '', SEASON_POSTURES[brief.recommendedPosture].intent));
  const postureChoices = n('div', 'season-choice-list');
  Object.values(SEASON_POSTURES).forEach((p) => {
    const b = n('button', selectedPosture === p.id ? 'selected' : '');
    b.type = 'button';
    add(b, n('strong', '', p.label), n('span', '', p.intent));
    b.onclick = () => { app._lifecyclePosture = p.id; app.render(); };
    postureChoices.appendChild(b);
  });
  posture.appendChild(postureChoices);

  const family = n('section', 'season-decision family-plan');
  add(family, n('small', '', 'THE FAMILY PLAN'), n('h2', '', 'How far are we willing to stretch?'));
  const familyChoices = n('div', 'season-choice-list family');
  [['conservative','Protect the family', 'Lower spend · fewer long trips · no racing debt'], ['balanced','Balanced commitment', 'Race seriously without making every weekend about motocross'], ['allin','Chase the opportunity', 'Higher travel/spend tolerance · bigger family sacrifice']].forEach(([id,label,desc]) => {
    const b = n('button', selectedFamily === id ? 'selected' : ''); b.type = 'button';
    add(b, n('strong', '', label), n('span', '', desc)); b.onclick = () => { app._lifecycleFamily = id; app.render(); }; familyChoices.appendChild(b);
  });
  family.appendChild(familyChoices);
  if (!guardrails.withinGuardrails) family.appendChild(n('p', 'season-warning', guardrails.warnings.map((w) => w.text).join(' ')));

  const go = n('button', 'season-commit', 'TAKE THIS PLAN TO THE SEASON BOARD →');
  go.type = 'button';
  go.dataset.testid = 'season-brief-continue';
  go.onclick = () => {
    state.posture = selectedPosture;
    state.familyPlan = createFamilyPlan(plan);
    state.openingBrief = buildSeasonBrief({ ...profile(app), familyPlan: state.familyPlan });
    g.state.seasonLifecycle = state;
    app.saveGame?.();
    app._lifecyclePosture = null; app._lifecycleFamily = null;
    app.render();
  };
  add(root, posture, family, go);
  return root;
}

function sponsorName(tier) {
  return ({ 'local-shop': 'Local Shop Support', 'dealer-support': 'Regional Dealer Support', 'regional-team': 'Regional Support Team', 'manufacturer-amateur': 'Manufacturer Amateur Program' })[tier] ?? 'New Support';
}

function applySponsorOffer(app, offer) {
  const g = app.game;
  let state = lifecycle(app);
  state = recordSponsorDecision(state, offer, 'accept');
  g.state.seasonLifecycle = state;
  g.family.money += Number(offer.support?.cash ?? 0);
  const s2 = g.state.sponsorship2;
  if (s2) {
    s2.contracts ??= []; s2.obligations ??= [];
    if (!s2.contracts.some((c) => c.id === offer.id)) {
      const category = offer.tier === 'local-shop' ? 'shop' : offer.tier === 'dealer-support' ? 'dealer' : 'industry';
      const contract = {
        id: offer.id, sponsorId: offer.id, sponsorName: sponsorName(offer.tier), category,
        tier: offer.tier, seasonYear: g.seasonYear, status: 'active', inSeason: true,
        guardianRequired: offer.guardianRequired, guardianApproved: true,
        package: { cashRetainer: Number(offer.support.cash || 0), productCredit: Number(offer.support.product || 0), discountPercent: Number(offer.support.discount || 0), entryFeeSupport: 0, travelSupport: Number(offer.support.travel || 0), contingency: 0 },
        exclusivity: [], obligations: offer.obligations.map((type) => ({ type, label: type.replaceAll('-', ' '), required: true })),
        satisfaction: { performance: 65, professionalism: 60, obligations: 50, visibility: 65, overall: 60 }, warnings: [], signedAt: { seasonYear: g.seasonYear, phase: 'in-season', week: g.week },
      };
      s2.contracts.push(contract);
      contract.obligations.forEach((o, i) => s2.obligations.push({ id: `obl-${offer.id}-${i}`, contractId: offer.id, sponsorId: offer.id, sponsorName: contract.sponsorName, ...o, status: 'pending', guardianParticipationRequired: Number(g.rider.age) < 18 }));
    }
  }
  app.saveGame?.();
}

function sponsorOpportunityScene(app, offer, value) {
  const root = n('aside', 'season-opportunity');
  root.dataset.testid = 'midseason-sponsor-offer';
  add(root, n('small', '', 'SOMEONE NOTICED'), n('h2', '', sponsorName(offer.tier)),
    n('p', '', `${app.game.rider.name}'s market value has climbed to ${value}/100. This support did not exist when the season started.`),
    n('div', 'opportunity-package', `${money(offer.support.cash)} cash · ${money(offer.support.product)} product · ${money(offer.support.travel)} travel · ${offer.support.discount}% discount`),
    n('p', 'opportunity-obligation', `In return: ${offer.obligations.map((x) => x.replaceAll('-', ' ')).join(' · ')}`));
  const actions = n('div', 'season-opportunity-actions');
  const pass = n('button', '', 'Pass for now'); pass.type = 'button';
  pass.onclick = () => { app.game.state.seasonLifecycle = recordSponsorDecision(lifecycle(app), offer, 'reject'); app.saveGame?.(); app.render(); };
  const accept = n('button', 'primary', offer.guardianRequired ? 'PARENT APPROVES · ACCEPT SUPPORT →' : 'ACCEPT SUPPORT →'); accept.type = 'button';
  accept.onclick = () => { applySponsorOffer(app, offer); app.render(); };
  add(actions, pass, accept); root.appendChild(actions); return root;
}

function raceMarketContext(app, result) {
  const g = app.game;
  const state = lifecycle(app);
  const r = seasonResults(g);
  const opportunity = inSeasonSponsorOpportunity({
    seasonYear: g.seasonYear, age: g.rider.age,
    results: Math.min(100, r.wins * 18 + r.podiums * 8 + Number(g.state.season?.points ?? 0) / 7),
    reputation: reputation(g, r), visibility: visibility(g, r), professionalism: professionalism(g), compliance: compliance(g),
    recentWins: result?.overall === 1 ? Math.min(3, r.wins) : Math.max(0, r.wins - 1),
    majorQualification: /qual|regional|national|loretta/i.test(String(result?.race?.name ?? '')) && Number(result?.overall ?? 99) <= 6,
    conductIncidents: 0,
  }, state.sponsorMarket);
  return opportunity;
}

function pivotScene(app, pivot) {
  const root = n('aside', 'season-checkin'); root.dataset.testid = 'season-midyear-checkin';
  add(root, n('small', '', 'SEASON CHECK-IN'), n('h2', '', pivot.recommendation === 'protect-and-revise' ? 'The plan needs to change.' : 'The season just got bigger.'),
    n('p', '', pivot.triggers.map((t) => t.replaceAll('-', ' ')).join(' · ')));
  const button = n('button', '', 'REVIEW THE FUTURE CALENDAR →'); button.type = 'button';
  button.onclick = () => { const withWeek = { ...pivot, week: app.game.week }; app.game.state.seasonLifecycle = recordPivot(lifecycle(app), withWeek); app.saveGame?.(); app.tab = 'week'; app._seasonView = true; app.render(); };
  root.appendChild(button); return root;
}

function reviewScene(app) {
  const g = app.game; const state = lifecycle(app); const r = seasonResults(g);
  if (!state.openingBrief) return null;
  const review = buildSeasonReview(state.openingBrief, {
    seasonYear: g.seasonYear, posture: state.posture, races: r.rows.length, wins: r.wins, podiums: r.podiums, dnfs: r.dnfs,
    points: Number(g.state.season?.points ?? 0), money: g.family.money,
    actualSpend: Math.max(0, Number(state.openingSnapshot?.money ?? state.openingBrief.money) - Number(g.family.money)),
    reputation: reputation(g, r), bikeCondition: g.bike?.condition, injury: g.rider.injury,
    majorQualification: !!g.state.season?.qualified,
    sponsorChanges: state.sponsorMarket?.history ?? [],
    sponsorRenewalInterest: Math.round((professionalism(g) + compliance(g) + reputation(g, r)) / 3),
    unresolvedObligations: requiredObligations(g).map((o) => ({ sponsorName: o.sponsorName, label: o.label, status: o.status })),
  });
  state.review = review; state.carryover = review.carryover; g.state.seasonLifecycle = state;
  const root = n('section', 'season-review'); root.dataset.testid = 'season-review';
  add(root, n('small', '', `${g.seasonYear} · SEASON REVIEW`), n('h1', '', review.summary),
    n('p', '', `We started this as a ${SEASON_POSTURES[state.posture ?? state.openingBrief.recommendedPosture]?.label ?? 'season'}. Here is what the year actually became.`));
  const ledger = n('div', 'season-review-ledger');
  add(ledger,
    add(n('div'), n('strong', '', `${review.actual.races}`), n('span', '', 'Races')),
    add(n('div'), n('strong', '', `${review.actual.wins}`), n('span', '', 'Wins')),
    add(n('div'), n('strong', '', `${review.actual.podiums}`), n('span', '', 'Podiums')),
    add(n('div'), n('strong', '', money(review.actual.actualSpend)), n('span', '', 'Spent')));
  const carry = n('div', 'season-carry');
  add(carry, n('small', '', 'WHAT WE CARRY INTO NEXT YEAR'), n('p', '', `${money(review.carryover.money)} cash · Reputation ${review.carryover.reputation} · Bike ${review.carryover.bikeCondition} · Sponsor renewal interest ${review.carryover.sponsorRenewalInterest}`));
  if ((state.sponsorMarket?.history ?? []).length) carry.appendChild(n('p', '', `${state.sponsorMarket.history.length} in-season sponsor decision${state.sponsorMarket.history.length === 1 ? '' : 's'} changed the program.`));
  add(root, ledger, carry); return root;
}

export function installSeasonLifecycleUiPatch(App) {
  if (!App?.prototype || App.prototype.__seasonLifecycle2Installed) return;
  App.prototype.__seasonLifecycle2Installed = true;
  ensureStyles();

  const originalBuilder = App.prototype.viewProgramBuilder;
  App.prototype.viewProgramBuilder = function lifecycleProgramBuilder(edit) {
    const state = lifecycle(this);
    if (!edit && !state.posture) return briefScreen(this);
    return originalBuilder.call(this, edit);
  };

  const originalResult = App.prototype.viewRaceResult;
  App.prototype.viewRaceResult = function lifecycleRaceResult(result) {
    const base = originalResult.call(this, result);
    const market = raceMarketContext(this, result);
    if (!market.offer) return base;
    const wrap = n('div', 'season-race-result-wrap');
    add(wrap, base, sponsorOpportunityScene(this, market.offer, market.marketValue));
    return wrap;
  };

  const originalSummary = App.prototype.viewWeekSummary;
  App.prototype.viewWeekSummary = function lifecycleWeekSummary() {
    const base = originalSummary.call(this);
    const g = this.game; const r = seasonResults(g); const state = lifecycle(this);
    const pivot = evaluatePivot({
      majorQualification: !!g.state.season?.qualified,
      recentWins: r.wins,
      injury: g.rider.injury,
      money: g.family.money,
      projectedRemainingCost: Math.max(0, plannerCost(this) * Math.max(0, (12 - Number(g.week || 1)) / 12)),
      bikeCondition: g.bike?.condition,
      newMajorSupport: (state.sponsorMarket?.offers ?? []).some((o) => ['regional-team','manufacturer-amateur'].includes(o.tier)),
    }, state);
    const wrap = n('div', 'season-week-wrap');
    if (pivot.shouldReview && Number(g.week || 1) < 12) wrap.appendChild(pivotScene(this, pivot));
    wrap.appendChild(base);
    if (Number(g.week || 1) >= 12) {
      const review = reviewScene(this);
      if (review) wrap.insertBefore(review, base);
    }
    return wrap;
  };
}