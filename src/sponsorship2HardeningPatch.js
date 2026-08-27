// Sponsorship 2.0 hardening (#349)
// ---------------------------------
// Makes sponsor commitments visible in the live Calendar 2.0 + Garage UI,
// adds actionable branding/product compliance, and fixes the "revise tentative
// schedule" path so returning from Sponsors cannot accidentally bypass the
// preseason sponsorship lock gate.

import {
  brandCompliance,
  contractFundingSummary,
  resolveObligation,
  rescheduleObligation,
  setBrandPlacement,
} from './systems/sponsorship2.js';

function h(tag, attrs = {}, ...children) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k === 'onclick') n.onclick = v;
    else if (k === 'disabled') n.disabled = !!v;
    else if (k === 'style') n.setAttribute('style', v);
    else if (v != null && v !== false) n.setAttribute(k, String(v));
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    n.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return n;
}

function fmtDate(iso) {
  if (!iso) return 'Season-long';
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function monthIndex(iso) {
  if (!iso) return null;
  return new Date(`${iso}T12:00:00Z`).getUTCMonth();
}

function activeContracts(state) {
  return (state?.contracts ?? []).filter((c) => ['signed', 'active', 'probation'].includes(c.status));
}

export function sponsorshipCalendarAgenda(state, { month = null } = {}) {
  const all = (state?.obligations ?? [])
    .filter((o) => !!o.date)
    .slice()
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const filtered = month == null ? all : all.filter((o) => monthIndex(o.date) === month);
  return filtered.map((o) => ({
    id: o.id,
    contractId: o.contractId,
    sponsorId: o.sponsorId,
    sponsorName: o.sponsorName,
    label: o.label,
    type: o.type,
    date: o.date,
    status: o.status,
    required: !!o.required,
    guardianParticipationRequired: !!o.guardianParticipationRequired,
    canReschedule: ['appearance', 'content'].includes(o.type) && (o.rescheduleCount ?? 0) < 1 && o.status === 'pending',
  }));
}

export function sponsorshipBrandView(state, installedProducts = []) {
  const contracts = activeContracts(state);
  const obligations = state?.obligations ?? [];
  const placements = state?.brandPlacements ?? [];
  const graphics = [];
  const products = [];
  for (const contract of contracts) {
    for (const o of obligations.filter((x) => x.contractId === contract.id && x.required)) {
      if (o.type === 'graphics-placement') {
        const placement = placements.find((p) => p.contractId === contract.id && p.slot === o.slot && p.brandId === contract.sponsorId);
        graphics.push({ contractId: contract.id, sponsorId: contract.sponsorId, sponsorName: contract.sponsorName, slot: o.slot, label: o.label, placed: !!placement });
      }
      if (o.type === 'product-use') {
        const using = installedProducts.some((p) => p.category === o.productCategory && p.brandId === contract.sponsorId);
        products.push({ contractId: contract.id, sponsorId: contract.sponsorId, sponsorName: contract.sponsorName, category: o.productCategory, label: o.label, using });
      }
    }
  }
  const compliance = brandCompliance(state ?? {}, installedProducts);
  return { contracts, graphics, products, compliance };
}

function installedSponsorProducts(g) {
  const s2 = g?.state?.sponsorship2;
  if (!s2) return [];
  s2.installedSponsorProducts ??= [];
  return s2.installedSponsorProducts;
}

function commitmentRow(app, item) {
  const g = app.game;
  const state = g.state.sponsorship2;
  const statusIcon = { pending: '⏳', fulfilled: '✓', missed: '✗', excused: '↪', violated: '⚠️' }[item.status] ?? '•';
  const statusColor = ['missed', 'violated'].includes(item.status) ? 'var(--red)' : item.status === 'fulfilled' ? 'var(--green)' : 'var(--ink-faint)';
  const actions = h('div', { class: 'toolbar', style: 'gap:5px;flex-wrap:wrap;margin-top:5px' });
  const resolve = (outcome) => {
    const result = resolveObligation(g.state.sponsorship2, item.id, outcome, `Resolved from Calendar 2.0: ${outcome}`);
    if (!result.error) g.state.sponsorship2 = result.state;
    app.saveGame(); app.render();
  };
  if (item.status === 'pending') {
    actions.append(
      h('button', { class: 'btn small', 'data-s2-action': 'fulfill', onclick: () => resolve('fulfilled') }, '✓ Fulfilled'),
      h('button', { class: 'btn ghost small', 'data-s2-action': 'miss', onclick: () => resolve('missed') }, 'Missed'),
    );
    if (item.canReschedule) {
      actions.append(h('button', { class: 'btn ghost small', 'data-s2-action': 'reschedule', onclick: () => {
        const d = new Date(`${item.date}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 7);
        const moved = rescheduleObligation(g.state.sponsorship2, item.id, d.toISOString().slice(0, 10), { calendarEntries: [] });
        if (moved.error) app._flash?.(moved.error.replaceAll('-', ' ')); else g.state.sponsorship2 = moved.state;
        app.saveGame(); app.render();
      } }, '+7 days'));
    }
  }
  return h('div', { class: 's2-commitment', 'data-s2-obligation-id': item.id, style: 'padding:8px 0;border-top:1px solid var(--line)' },
    h('div', { style: 'display:flex;justify-content:space-between;gap:8px;align-items:flex-start' },
      h('div', {},
        h('div', {}, h('b', {}, item.sponsorName), ' · ', item.label),
        h('div', { class: 'small faint' }, `${fmtDate(item.date)} · ${item.type.replaceAll('-', ' ')}${item.required ? ' · required' : ''}${item.guardianParticipationRequired ? ' · guardian required' : ''}`),
      ),
      h('span', { class: 'small', style: `color:${statusColor}` }, `${statusIcon} ${item.status}`),
    ),
    actions.childNodes.length ? actions : null,
  );
}

function calendarPanel(app, { month = null, compact = false } = {}) {
  const state = app.game?.state?.sponsorship2;
  if (!state || !activeContracts(state).length) return null;
  const items = sponsorshipCalendarAgenda(state, { month });
  const root = h('div', { class: 'card s2-calendar-card', 'data-s2-calendar': month == null ? 'agenda' : `month-${month}`, style: 'border-color:var(--amber)' },
    h('div', { class: 'eyebrow' }, compact ? '🤝 Sponsor commitments this month' : '🤝 Sponsor commitment agenda'),
    h('div', { class: 'small muted' }, compact ? 'These obligations sit on real dates in Calendar 2.0.' : 'Appearances, media days and sponsor content are part of the season — not invisible contract text.'),
  );
  if (!items.length) {
    const next = sponsorshipCalendarAgenda(state)[0];
    root.append(h('div', { class: 'small faint', style: 'margin-top:7px' }, next ? `No sponsor commitment in this month. Next: ${fmtDate(next.date)} · ${next.sponsorName} · ${next.label}` : 'No dated sponsor commitments yet.'));
    return root;
  }
  for (const item of items) root.append(commitmentRow(app, item));
  return root;
}

function garagePanel(app) {
  const g = app.game;
  const state = g?.state?.sponsorship2;
  if (!state || !activeContracts(state).length) return null;
  const installed = installedSponsorProducts(g);
  const view = sponsorshipBrandView(state, installed);
  const ok = view.compliance.compliant && view.products.every((p) => p.using);
  const root = h('div', { class: 'card s2-garage-card', 'data-s2-garage': 'brand-compliance', style: `border-color:${ok ? 'var(--green)' : 'var(--amber)'}` },
    h('div', { class: 'eyebrow' }, '🏷️ Sponsor brand compliance'),
    h('h3', { style: 'margin:2px 0 4px' }, ok ? 'Bike & gear are sponsor-ready' : 'Sponsor setup needs attention'),
    h('div', { class: 'small muted' }, 'Signed graphics, product-use and category-exclusivity promises are enforced here.'),
  );

  const grid = h('div', { style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:8px;margin-top:10px' });
  for (const item of view.graphics) {
    grid.append(h('div', { class: 'prog-opt', 'data-s2-brand-slot': item.slot },
      h('div', {}, h('b', {}, item.sponsorName), ' · ', item.slot),
      h('div', { class: 'small faint' }, item.label),
      h('div', { class: 'small', style: `margin-top:4px;color:${item.placed ? 'var(--green)' : 'var(--gold)'}` }, item.placed ? '✓ Logo installed' : '⚠ Logo missing'),
      item.placed ? null : h('button', { class: 'btn small', style: 'margin-top:6px', 'data-s2-action': 'apply-brand', onclick: () => {
        const r = setBrandPlacement(g.state.sponsorship2, { contractId: item.contractId, slot: item.slot, brandId: item.sponsorId, category: activeContracts(g.state.sponsorship2).find((c) => c.id === item.contractId)?.category, required: true });
        if (r.error) app._flash?.(r.error.replaceAll('-', ' ')); else g.state.sponsorship2 = r.state;
        app.saveGame(); app.render();
      } }, 'Apply sponsor logo'),
    ));
  }
  for (const item of view.products) {
    grid.append(h('div', { class: 'prog-opt', 'data-s2-product-category': item.category },
      h('div', {}, h('b', {}, item.sponsorName), ' · ', item.category),
      h('div', { class: 'small faint' }, item.label),
      h('div', { class: 'small', style: `margin-top:4px;color:${item.using ? 'var(--green)' : 'var(--gold)'}` }, item.using ? '✓ Sponsor product in use' : '⚠ Sponsor product not selected'),
      item.using ? null : h('button', { class: 'btn small', style: 'margin-top:6px', 'data-s2-action': 'use-product', onclick: () => {
        const list = installedSponsorProducts(g);
        const id = `s2-${item.category}-${item.sponsorId}`;
        const next = list.filter((p) => p.category !== item.category);
        next.push({ id, category: item.category, brandId: item.sponsorId, sponsorRequired: true });
        g.state.sponsorship2.installedSponsorProducts = next;
        app.saveGame(); app.render();
      } }, 'Use sponsor product'),
    ));
  }
  if (grid.childNodes.length) root.append(grid);

  if (view.compliance.violations.length) {
    root.append(h('div', { class: 'hint', style: 'margin-top:9px;color:var(--red)' },
      `⚠ ${view.compliance.violations.length} exclusivity conflict${view.compliance.violations.length === 1 ? '' : 's'} detected.`));
    for (const v of view.compliance.violations) {
      root.append(h('div', { class: 'small', 'data-s2-brand-violation': v.productId ?? v.category },
        `${v.category}: ${v.brandId} conflicts with sponsor ${v.sponsorId}. `,
        h('button', { class: 'btn ghost small', onclick: () => {
          g.state.sponsorship2.installedSponsorProducts = installedSponsorProducts(g).filter((p) => p.id !== v.productId);
          app.saveGame(); app.render();
        } }, 'Fix conflict')));
    }
  }
  if (view.compliance.missingPlacements.length) {
    root.append(h('div', { class: 'small', style: 'margin-top:8px;color:var(--gold)' }, `${view.compliance.missingPlacements.length} required logo placement${view.compliance.missingPlacements.length === 1 ? '' : 's'} still missing.`));
  }
  return root;
}

export function installSponsorship2HardeningPatch(App) {
  if (!App?.prototype || App.prototype.__sponsorship2HardeningInstalled) return;
  App.prototype.__sponsorship2HardeningInstalled = true;

  const originalMonth = App.prototype.monthCalendarView;
  App.prototype.monthCalendarView = function patchedMonthCalendarView(...args) {
    const legacy = originalMonth.apply(this, args);
    const month = this._calMonth ?? null;
    const panel = calendarPanel(this, { month, compact: true });
    if (!panel) return legacy;
    const wrap = h('div'); wrap.append(panel, legacy); return wrap;
  };

  const originalSeason = App.prototype.viewSeasonBoard;
  App.prototype.viewSeasonBoard = function patchedSeasonBoard(...args) {
    const legacy = originalSeason.apply(this, args);
    const panel = calendarPanel(this, { month: null, compact: false });
    if (!panel) return legacy;
    const wrap = h('div'); wrap.append(panel, legacy); return wrap;
  };

  const originalGarage = App.prototype.renderGarage;
  App.prototype.renderGarage = function patchedGarage(...args) {
    const legacy = originalGarage.apply(this, args);
    const panel = garagePanel(this);
    if (!panel) return legacy;
    const wrap = h('div'); wrap.append(panel, legacy); return wrap;
  };

  // #349 regression guard: after the player revises an already-tentative
  // calendar, Save must return to Sponsorship 2.0. It must never fall through to
  // the legacy season commit path until _s2FinishSeasonLock explicitly runs.
  const originalConfirm = App.prototype.confirmProgram;
  App.prototype.confirmProgram = function hardenTentativeRevision(edit) {
    const g = this.game;
    const state = g?.state?.sponsorship2;
    if (!edit && state?.preseason?.phase === 'funding') {
      g.setProgram(this._programSel);
      let cost = state.preseason.lastBudget?.tentativeSeasonCost ?? 0;
      try { cost = g.buildPlanner(this._programSel).forecast(g.family.money).season.total; } catch (_) { /* keep prior estimate */ }
      state.preseason.lastBudget = contractFundingSummary(state, { tentativeSeasonCost: cost, familyCash: g.family.money });
      g.state.sponsorship2 = state;
      this.saveGame();
      this.tab = 'sponsors';
      this._seasonView = false;
      this._flash?.('Tentative race calendar updated. Sponsor offers and contracts were preserved.');
      this.render();
      return;
    }
    return originalConfirm.call(this, edit);
  };
}
