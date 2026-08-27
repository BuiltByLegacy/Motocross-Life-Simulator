// Live Sponsorship 2.0 integration (#345)
// -------------------------------------------
// Kept as a patch module so the large UI class stays stable. This wraps the
// existing Sponsors tab and season-confirm action without replacing old sponsor
// progression/content.

import {
  createSponsorship2State,
  restoreSponsorship2State,
  discoverSponsorCandidates,
  pursueAndDraft,
  counterOffer,
  approveYouthContract,
  signContract,
  scheduleContractObligations,
  contractFundingSummary,
  buildSeasonLockSummary,
  lockPreseasonSponsorship,
} from './systems/sponsorship2.js';

function node(tag, attrs = {}, ...children) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k === 'onclick') n.onclick = v;
    else if (k === 'disabled') n.disabled = !!v;
    else if (k === 'style') n.setAttribute('style', v);
    else n.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    n.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return n;
}

function money(n) { return '$' + Math.round(Number(n) || 0).toLocaleString(); }

function ensureState(app) {
  const g = app.game;
  if (!g) return null;
  if (!g.state.sponsorship2 || g.state.sponsorship2.seasonYear !== g.seasonYear) {
    g.state.sponsorship2 = createSponsorship2State({ seasonYear: g.seasonYear });
  } else {
    g.state.sponsorship2 = restoreSponsorship2State(g.state.sponsorship2);
  }
  g.state.sponsorship2.uiOffers ??= [];
  return g.state.sponsorship2;
}

function riderProfile(g) {
  const wins = typeof g.careerWins === 'function' ? g.careerWins() : (g.state.season?.wins ?? 0);
  const podiums = typeof g.careerPodiums === 'function' ? g.careerPodiums() : 0;
  return {
    age: g.rider.age,
    className: g.rider.klass,
    region: (g.state.homeRegion?.id ?? g.state.homeRegion ?? 'northeast').toString().toLowerCase(),
    results: Math.min(100, wins * 14 + podiums * 5 + (g.state.season?.points ?? 0) / 8),
    reputation: Math.min(100, 15 + (g.family.support_level ?? 0) * 18 + wins * 6),
    localReputation: Math.min(100, 20 + (g.family.support_level ?? 0) * 20 + wins * 7),
    professionalism: Math.max(25, 68 - (g.family.stress ?? 0) * 0.15),
    visibility: Math.min(100, 8 + wins * 9 + podiums * 4),
    relationship: Math.min(100, 12 + (g.family.support_level ?? 0) * 22),
  };
}

function tentativeCost(app) {
  const g = app.game;
  try {
    const selection = app._programSel ?? g.state.program;
    return g.buildPlanner(selection).forecast(g.family.money).season.total;
  } catch (_) {
    return 0;
  }
}

function fundingRows(summary) {
  const row = (k, v, strong = false) => node('div', { class: 'fc-row' },
    node('span', { class: 'faint' }, k), node('span', { class: strong ? 'mono' : 'mono' }, money(v)));
  return node('div', { class: 'fc-grid' },
    row('Season estimate', summary.tentativeSeasonCost),
    row('Family cash', summary.familyCash),
    row('Confirmed sponsor cash', summary.sponsorCash),
    row('Product/discount value', summary.productValue),
    row('Contingency potential', summary.contingencyPotential),
    row('Remaining cash gap', summary.fundingGap, true),
  );
}

function offerCard(app, state, offer) {
  const g = app.game;
  const accepted = (state.contracts ?? []).some((c) => c.sponsorId === offer.sponsorId && c.seasonYear === state.seasonYear);
  const pkg = offer.package;
  const card = node('div', { class: 'card', style: 'margin:8px 0;padding:10px' },
    node('div', { style: 'display:flex;justify-content:space-between;gap:8px;align-items:center' },
      node('b', {}, offer.sponsorName), node('span', { class: 'badge' }, offer.lastNegotiationOutcome ?? offer.sourceResponseType ?? 'offer')),
    node('div', { class: 'small faint', style: 'margin-top:4px' },
      `${money(pkg.cashRetainer)} cash · ${money(pkg.productCredit)} product · ${pkg.discountPercent}% discount · ${money(pkg.contingency)} contingency`),
    offer.exclusivity?.length ? node('div', { class: 'small', style: 'margin-top:4px;color:var(--gold)' }, `Exclusivity: ${offer.exclusivity.join(', ')}`) : null,
    node('div', { class: 'small faint', style: 'margin-top:4px' }, `${offer.obligations.filter((o) => o.required).length} required sponsor commitments`),
  );
  if (accepted) {
    card.append(node('div', { class: 'small', style: 'color:var(--green);margin-top:6px' }, '✓ Contract signed'));
    return card;
  }
  const actions = node('div', { class: 'toolbar', style: 'margin-top:8px;flex-wrap:wrap;gap:6px' });
  if (!['rejected-counter'].includes(offer.status)) {
    actions.append(node('button', { class: 'btn small', onclick: () => {
      const request = { cashRetainer: Math.round((offer.package.cashRetainer || 100) * 1.15), discountPercent: Math.min(35, (offer.package.discountPercent || 0) + 5) };
      const result = counterOffer(state, offer, request, { rider: riderProfile(g), relationship: riderProfile(g).relationship, careerSeed: String(g.rng?.seed ?? 'career') });
      g.state.sponsorship2 = result.state;
      const list = g.state.sponsorship2.uiOffers ?? [];
      const i = list.findIndex((o) => o.id === offer.id);
      if (i >= 0) list[i] = result.offer;
      app.saveGame(); app.render();
    } }, 'Counter: ask for more'));
  }
  if (!['rejected-counter'].includes(offer.status)) {
    actions.append(node('button', { class: 'btn primary small', onclick: () => {
      let ready = offer;
      if (offer.guardianRequired && !offer.guardianApproved) ready = approveYouthContract(offer, true);
      const signed = signContract(state, ready);
      if (signed.error) { app._flash?.(signed.error.replaceAll('-', ' ')); return; }
      g.state.sponsorship2 = signed.state;
      const scheduled = scheduleContractObligations(g.state.sponsorship2, signed.contract.id, { seasonStart: `${g.seasonYear}-01-01`, riderAge: g.rider.age });
      g.state.sponsorship2 = scheduled.state;
      g.state.sponsorship2.uiOffers = (state.uiOffers ?? []).map((o) => o.id === offer.id ? ready : o);
      app.saveGame(); app.render();
    } }, offer.guardianRequired ? 'Parent approves & sign' : 'Sign contract'));
  }
  card.append(actions);
  return card;
}

function sponsorship2Panel(app) {
  const g = app.game;
  const state = ensureState(app);
  if (!state) return null;
  const cost = tentativeCost(app) || state.preseason?.lastBudget?.tentativeSeasonCost || 0;
  const summary = contractFundingSummary(state, { tentativeSeasonCost: cost, familyCash: g.family.money });
  const profile = riderProfile(g);
  const candidates = discoverSponsorCandidates(profile, state.pursuit).slice(0, 6);
  const remainingPitches = Math.max(0, (state.pursuit.maxPitches ?? 4) - (state.pursuit.attempts?.length ?? 0));
  const root = node('div', { class: 'card', style: 'border-color:var(--amber);margin-bottom:12px' },
    node('div', { class: 'eyebrow' }, '🤝 Sponsorship 2.0 · Preseason funding'),
    node('h2', { style: 'margin-bottom:4px' }, state.preseason.phase === 'locked' ? 'Sponsor program locked' : 'Fund the season before you commit'),
    node('p', { class: 'small muted' }, 'Pitch realistic sponsors, negotiate terms, and understand what they expect from you before locking the race calendar.'),
    fundingRows(summary),
  );

  const responses = state.pursuit.responses ?? [];
  if (responses.length) {
    root.append(node('div', { class: 'eyebrow', style: 'margin-top:12px' }, 'Responses'));
    for (const response of responses.slice().reverse().slice(0, 5)) {
      const declined = ['decline', 'soft-decline'].includes(response.type);
      root.append(node('div', { class: 'small', style: `padding:5px 0;color:${declined ? 'var(--red)' : 'var(--green)'}` },
        `${declined ? '✗' : '✓'} ${response.sponsorName}: ${response.type.replaceAll('-', ' ')}`));
    }
  }

  const offers = state.uiOffers ?? [];
  if (offers.length) {
    root.append(node('div', { class: 'eyebrow', style: 'margin-top:12px' }, 'Offers & contracts'));
    for (const offer of offers) root.append(offerCard(app, state, offer));
  }

  if (state.preseason.phase !== 'locked') {
    root.append(node('div', { class: 'eyebrow', style: 'margin-top:12px' }, `Sponsor targets · ${remainingPitches} pitch${remainingPitches === 1 ? '' : 'es'} left`));
    const buttons = node('div', { class: 'activity-grid' });
    for (const c of candidates) {
      const already = state.pursuit.attempts?.some((a) => a.sponsorId === c.id && a.seasonYear === state.seasonYear);
      buttons.append(node('button', { class: 'activity', disabled: already || remainingPitches <= 0, onclick: () => {
        const live = ensureState(app);
        const result = pursueAndDraft(live, {
          sponsorId: c.id, rider: profile, careerSeed: String(g.rng?.seed ?? 'career'),
          proposalQuality: Math.round(45 + profile.professionalism * 0.35), relationship: profile.relationship,
        });
        g.state.sponsorship2 = result.state;
        g.state.sponsorship2.uiOffers ??= [];
        if (result.offer) g.state.sponsorship2.uiOffers.push(result.offer);
        app.saveGame(); app.render();
      } },
        node('div', { class: 'a-top' }, c.name),
        node('div', { class: 'a-desc' }, `${c.category} · fit ${c.fitScore}/100${already ? ' · already contacted' : ''}`),
      ));
    }
    root.append(buttons);
  }

  if (state.preseason.phase === 'funding') {
    const lock = buildSeasonLockSummary(state, { tentativeSeasonCost: cost, familyCash: g.family.money, calendarEntries: [] });
    root.append(node('div', { class: 'toolbar', style: 'margin-top:12px;flex-wrap:wrap' },
      node('button', { class: 'btn ghost', onclick: () => {
        app.tab = 'week';
        app._programSel = { ...(g.state.program ?? {}) };
        app._seasonView = false;
        app.showWeek(() => app.viewProgramBuilder(false));
      } }, '← Revise race schedule'),
      node('button', { class: 'btn primary', disabled: !lock.canLock, onclick: () => app._s2FinishSeasonLock?.() },
        `Lock season · family ${money(lock.familyContribution)} →`),
    ));
    root.append(node('div', { class: 'small faint', style: 'margin-top:6px' },
      `${lock.requiredObligations.length} required sponsor commitments will carry into the season calendar.`));
  }
  return root;
}

export function installSponsorship2UiPatch(App) {
  if (!App?.prototype || App.prototype.__sponsorship2Installed) return;
  App.prototype.__sponsorship2Installed = true;

  const originalSponsors = App.prototype.renderSponsorsTab;
  App.prototype.renderSponsorsTab = function patchedSponsors() {
    const panel = sponsorship2Panel(this);
    const legacy = originalSponsors ? originalSponsors.call(this) : null;
    const wrap = node('div');
    if (panel) wrap.append(panel);
    if (legacy) wrap.append(legacy);
    return wrap;
  };

  const originalReview = App.prototype.programReview;
  App.prototype.programReview = function patchedProgramReview() {
    const legacy = originalReview.call(this);
    const state = ensureState(this);
    const cost = tentativeCost(this);
    const summary = contractFundingSummary(state, { tentativeSeasonCost: cost, familyCash: this.game.family.money });
    const sponsor = node('div', { class: 'prog-review', style: 'margin-top:8px;border-color:var(--amber)' },
      node('div', { class: 'eyebrow' }, '🤝 Sponsor funding preview'),
      node('div', { class: 'small' }, `${money(summary.sponsorCash)} confirmed support · ${money(summary.fundingGap)} remaining cash gap`),
      node('div', { class: 'small faint', style: 'margin-top:4px' }, state.preseason.phase === 'funding'
        ? 'Schedule is still tentative — revise it or return to Sponsors before final lock.'
        : 'You will get a sponsor-funding step before the season is locked.'),
    );
    const wrap = node('div'); wrap.append(legacy, sponsor); return wrap;
  };

  const originalConfirm = App.prototype.confirmProgram;
  App.prototype.confirmProgram = function patchedConfirmProgram(edit) {
    const g = this.game;
    const state = ensureState(this);
    if (!edit && state.preseason.phase === 'tentative') {
      // Save the selected program as tentative, but deliberately do NOT advance
      // the season commitment to locked/active yet.
      g.setProgram(this._programSel);
      const cost = tentativeCost(this);
      state.preseason.phase = 'funding';
      state.preseason.lastBudget = contractFundingSummary(state, { tentativeSeasonCost: cost, familyCash: g.family.money });
      g.state.sponsorship2 = state;
      this.saveGame();
      this.tab = 'sponsors';
      this._seasonView = false;
      this._flash?.('Race program saved as tentative. Pursue sponsors before final lock.');
      this.render();
      return;
    }
    return originalConfirm.call(this, edit);
  };

  App.prototype._s2FinishSeasonLock = function finishSponsorLock() {
    const g = this.game;
    const state = ensureState(this);
    const cost = tentativeCost(this) || state.preseason.lastBudget?.tentativeSeasonCost || 0;
    const locked = lockPreseasonSponsorship(state, { tentativeSeasonCost: cost, familyCash: g.family.money, calendarEntries: [] });
    if (locked.error) { this._flash?.('Resolve sponsor calendar conflicts before locking.'); this.render(); return; }
    g.state.sponsorship2 = locked.state;
    // Return to the original commit path now that funding/obligations have been
    // reviewed. `confirmProgram` sees phase=locked, so it delegates to legacy.
    this.tab = 'week';
    originalConfirm.call(this, false);
  };
}
