import { Game, SIM_DEPTHS } from './game.js';
import { RIDER_AVATARS, BACKGROUNDS } from './data/content.js';
import { ui2El } from './ui2/primitives.js';

const PATCH = Symbol.for('legacy-motocross.ui2.completion');

function ensureStylesheet() {
  if (document.querySelector('link[data-ui2-completion]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './ui2Completion.css';
  link.dataset.ui2Completion = 'true';
  document.head.appendChild(link);
}

function money(n) { return '$' + Math.max(0, Number(n) || 0).toLocaleString(); }
function go(app, tab, extra = {}) {
  Object.assign(app, extra);
  app.tab = tab;
  app.render();
  try { window.scrollTo({ top: 0, behavior: 'instant' }); } catch (e) { window.scrollTo(0, 0); }
}

function section(title, body, testId) {
  return ui2El('section', { class: 'ui2-book-section', ...(testId ? { 'data-testid': testId } : {}) },
    ui2El('h2', {}, title), body);
}

function renderCareer(app) {
  const g = app.game;
  const results = g.state.season?.results ?? [];
  const wins = results.filter((r) => r.overall === 1 && !r.dnf && !r.missed).length;
  const podiums = results.filter((r) => Number(r.overall) <= 3 && !r.dnf && !r.missed).length;
  const standing = g.championshipStanding?.() ?? { pos: null, points: g.state.season?.points ?? 0 };
  const history = [...(g.state.careerHistory ?? [])].slice(-5).reverse();
  const lifecycle = g.state.seasonLifecycle ?? {};
  const sponsorLeads = lifecycle.sponsorMarket?.leads ?? [];
  const pending = sponsorLeads.filter((lead) => ['pending', 'countered'].includes(lead.status));
  const memories = g.memory?.top?.(4) ?? [];

  return ui2El('div', { class: 'ui2-recordbook', 'data-testid': 'ui2-career' },
    ui2El('header', { class: 'ui2-recordbook-hero' },
      ui2El('div', { class: 'ui2-kicker' }, `${g.seasonYear} · ${g.rider.klass}`),
      ui2El('h1', {}, `${g.rider.name}'s Record Book`),
      ui2El('p', {}, lifecycle.chosenPosture ? `This season: ${lifecycle.chosenPosture.replace('-', ' ')}` : 'A career is built one season at a time.'),
      ui2El('div', { class: 'ui2-record-line' },
        ui2El('strong', {}, `${wins} win${wins === 1 ? '' : 's'}`),
        ui2El('span', {}, `${podiums} podium${podiums === 1 ? '' : 's'}`),
        ui2El('span', {}, standing.pos ? `P${standing.pos} · ${standing.points} pts` : `${standing.points} pts`))),
    section('This season', ui2El('div', { class: 'ui2-paper-list' },
      results.length ? ...results.slice(-5).reverse().map((r) => ui2El('div', { class: 'ui2-paper-row' },
        ui2El('span', {}, r.race ?? `Week ${r.week}`),
        ui2El('strong', {}, r.missed ? 'DNS' : r.dnf ? 'DNF' : `P${r.overall}`))) : ui2El('p', { class: 'ui2-muted' }, 'The first results have not been written yet.'),
      ui2El('button', { class: 'ui2-text-action', type: 'button', onclick: () => go(app, 'journal') }, 'Open results & memories →')), 'ui2-career-season'),
    section('Support & opportunity', ui2El('div', { class: 'ui2-support-note' },
      ui2El('div', {},
        ui2El('strong', {}, pending.length ? `${pending.length} opportunity${pending.length === 1 ? '' : 'ies'} waiting` : 'Your support story'),
        ui2El('p', {}, pending.length ? 'Your riding is creating conversations in the paddock.' : 'Sponsor relationships, obligations and preseason support live at the Sponsor Desk.')),
      ui2El('button', { class: 'ui2-secondary-action', type: 'button', 'data-testid': 'ui2-career-sponsors', onclick: () => go(app, 'sponsors') }, 'Sponsor Desk')), 'ui2-career-support'),
    section('Career timeline', ui2El('div', { class: 'ui2-timeline' },
      history.length ? ...history.map((h) => ui2El('div', { class: 'ui2-timeline-entry' },
        ui2El('div', { class: 'ui2-timeline-year' }, String(h.year ?? 'Season')),
        ui2El('div', {}, ui2El('strong', {}, `${h.klass ?? 'Class'} · ${h.points ?? 0} pts`), ui2El('small', {}, `Best ${h.bestFinish ? `P${h.bestFinish}` : '—'} · ${h.wins ?? 0}W`)))) : ui2El('p', { class: 'ui2-muted' }, 'Your first season is still being written.')), 'ui2-career-history'),
    section('What will be remembered', ui2El('div', { class: 'ui2-memory-strip' },
      memories.length ? ...memories.map((m) => ui2El('article', { class: 'ui2-memory-slip' }, ui2El('strong', {}, m.title), ui2El('small', {}, m.summary ?? ''))) : ui2El('p', { class: 'ui2-muted' }, 'No defining memories yet.')),
    );
}

function renderPeoplePanel(app, back) {
  const g = app.game;
  const people = g.relationships?.all?.() ?? [];
  return ui2El('div', { class: 'ui2-world-panel', 'data-testid': 'ui2-world-people' },
    ui2El('button', { class: 'ui2-backlink', type: 'button', onclick: back }, '‹ World'),
    ui2El('div', { class: 'ui2-kicker' }, 'People shape the career'),
    ui2El('h1', {}, 'Your Paddock'),
    ui2El('div', { class: 'ui2-people-list' }, ...people.map((rel) => {
      try { rel.updateArc?.(); } catch (e) {}
      return ui2El('article', { class: 'ui2-person-story' },
        ui2El('div', { class: 'ui2-person-avatar', 'aria-hidden': 'true' }, rel.rec?.role === 'Rival' ? 'R' : rel.name?.slice(0, 1) ?? '•'),
        ui2El('div', {}, ui2El('strong', {}, rel.name), ui2El('small', {}, rel.rec?.role ?? 'Your world'), ui2El('p', {}, rel.describe?.() ?? 'Part of the story.')));
    })));
}

function renderWorld(app, originalRenderPhone) {
  if (app._phoneApp) return originalRenderPhone.call(app);
  const panel = app._ui2WorldPanel ?? 'hub';
  if (panel === 'people') return renderPeoplePanel(app, () => { app._ui2WorldPanel = 'hub'; app.render(); });
  if (panel === 'history') {
    const memories = app.game.memory?.top?.(10) ?? [];
    return ui2El('div', { class: 'ui2-world-panel', 'data-testid': 'ui2-world-history' },
      ui2El('button', { class: 'ui2-backlink', type: 'button', onclick: () => { app._ui2WorldPanel = 'hub'; app.render(); } }, '‹ World'),
      ui2El('div', { class: 'ui2-kicker' }, 'Culture & memory'), ui2El('h1', {}, 'The World You Are Leaving Marks On'),
      ui2El('div', { class: 'ui2-memory-strip' }, memories.length ? ...memories.map((m) => ui2El('article', { class: 'ui2-memory-slip' }, ui2El('strong', {}, m.title), ui2El('small', {}, m.summary ?? ''))) : ui2El('p', { class: 'ui2-muted' }, 'The history starts when the stories do.')));
  }

  const g = app.game;
  const apps = g.phoneApps?.() ?? [];
  const market = apps.find((a) => a.id === 'marketplace');
  const social = apps.find((a) => a.id === 'social');
  const region = g.state.region ?? g.state.homeRegion ?? 'Home region';
  return ui2El('div', { class: 'ui2-world-hub', 'data-testid': 'ui2-world' },
    ui2El('header', { class: 'ui2-world-hero' }, ui2El('div', { class: 'ui2-kicker' }, region), ui2El('h1', {}, 'The Motocross World'), ui2El('p', {}, 'People, tracks, shops, media and opportunities all connect here.')),
    ui2El('div', { class: 'ui2-world-grid' },
      ui2El('button', { class: 'ui2-world-destination people', type: 'button', 'data-testid': 'ui2-world-open-people', onclick: () => { app._ui2WorldPanel = 'people'; app.render(); } }, ui2El('strong', {}, 'People'), ui2El('span', {}, 'Family, rivals, coaches and the relationships behind the racing.')),
      ui2El('button', { class: 'ui2-world-destination market', type: 'button', 'data-testid': 'ui2-world-open-market', disabled: market && !market.accessible, onclick: () => { app._phoneApp = 'marketplace'; app.render(); } }, ui2El('strong', {}, 'Marketplace'), ui2El('span', {}, market?.accessible === false ? (market.lockReason ?? 'Not available yet') : 'Bikes, parts, deals and the stuff that moves through the paddock.')),
      ui2El('button', { class: 'ui2-world-destination phone', type: 'button', 'data-testid': 'ui2-world-open-phone', onclick: () => { app._phoneApp = social?.accessible === false ? 'notifications' : 'social'; app.render(); } }, ui2El('strong', {}, 'Phone & Media'), ui2El('span', {}, 'Messages, notifications, social attention and connected riders.')),
      ui2El('button', { class: 'ui2-world-destination history', type: 'button', 'data-testid': 'ui2-world-open-history', onclick: () => { app._ui2WorldPanel = 'history'; app.render(); } }, ui2El('strong', {}, 'Culture & History'), ui2El('span', {}, 'Memories, race culture and the moments that become part of motocross lore.'))));
}

function renderOnboarding(app, originalRenderTitle) {
  ensureStylesheet();
  const year = new Date().getFullYear();
  if (!app.onboard) app.onboard = { step: 'campaign', campaign: 'rider', name: 'Riley', avatar: '🧒', birthdate: `${year - 4}-05-15`, background: 'working_class', series: 'local', depth: 'detailed' };
  const o = app.onboard;
  const save = app.loadSave?.();
  const validSave = save && Game.isValidSave(save);
  const rerender = () => app.renderTitle();
  const setStep = (step) => { o.step = step; rerender(); };
  const start = () => app.startGame({ ...o });

  let content;
  if (o.step === 'campaign') content = ui2El('div', { class: 'ui2-start-stage' },
    validSave ? ui2El('button', { class: 'ui2-continue-career', type: 'button', 'data-testid': 'ui2-continue-career', onclick: () => app.continueGame() }, ui2El('small', {}, 'Continue career'), ui2El('strong', {}, `${save.state.rider.name} · ${save.state.rider.klass ?? 'Motocross life'}`), ui2El('span', {}, 'Back to the garage →')) : null,
    ui2El('div', { class: 'ui2-kicker' }, 'Choose the point of view'), ui2El('h1', {}, 'Whose motocross life is this?'),
    ui2El('div', { class: 'ui2-start-choices' },
      ui2El('button', { type: 'button', 'data-testid': 'ui2-start-rider', onclick: () => { o.campaign = 'rider'; setStep('identity'); } }, ui2El('strong', {}, 'Be the rider'), ui2El('span', {}, 'Train, race, grow up and build a career.')),
      ui2El('button', { type: 'button', 'data-testid': 'ui2-start-parent', onclick: () => { o.campaign = 'parent'; setStep('identity'); } }, ui2El('strong', {}, 'Be the parent'), ui2El('span', {}, 'Fund the dream, protect the family and help a kid grow.'))));
  else if (o.step === 'identity') content = ui2El('div', { class: 'ui2-start-stage' },
    ui2El('button', { class: 'ui2-backlink', type: 'button', onclick: () => setStep('campaign') }, '‹ Back'), ui2El('div', { class: 'ui2-kicker' }, 'The rider'), ui2El('h1', {}, 'Put a name on the number plate'),
    ui2El('label', { class: 'ui2-field' }, ui2El('span', {}, 'Name'), ui2El('input', { value: o.name, maxlength: '14', 'data-testid': 'ui2-rider-name', oninput: (e) => { o.name = e.target.value.trim() || 'Riley'; } })),
    ui2El('label', { class: 'ui2-field' }, ui2El('span', {}, 'Birthday'), ui2El('input', { type: 'date', value: o.birthdate, min: `${year - 18}-01-01`, max: `${year - 3}-12-31`, oninput: (e) => { o.birthdate = e.target.value || o.birthdate; } })),
    ui2El('div', { class: 'ui2-avatar-row' }, ...RIDER_AVATARS.slice(0, 8).map((a) => ui2El('button', { type: 'button', class: o.avatar === a ? 'selected' : '', onclick: () => { o.avatar = a; rerender(); } }, a))),
    ui2El('button', { class: 'ui2-primary-action', type: 'button', 'data-testid': 'ui2-onboard-next-background', onclick: () => setStep('background') }, 'Choose family background →'));
  else if (o.step === 'background') content = ui2El('div', { class: 'ui2-start-stage' },
    ui2El('button', { class: 'ui2-backlink', type: 'button', onclick: () => setStep('identity') }, '‹ Back'), ui2El('div', { class: 'ui2-kicker' }, 'Where the story starts'), ui2El('h1', {}, 'Every family begins somewhere'),
    ui2El('div', { class: 'ui2-background-list' }, ...BACKGROUNDS.map((bg) => ui2El('button', { type: 'button', class: o.background === bg.id ? 'selected' : '', onclick: () => { o.background = bg.id; rerender(); } }, ui2El('strong', {}, bg.label), ui2El('span', {}, bg.blurb)))),
    ui2El('button', { class: 'ui2-primary-action', type: 'button', 'data-testid': 'ui2-onboard-next-depth', onclick: () => setStep('options') }, 'Choose how to play →'));
  else content = ui2El('div', { class: 'ui2-start-stage' },
    ui2El('button', { class: 'ui2-backlink', type: 'button', onclick: () => setStep('background') }, '‹ Back'), ui2El('div', { class: 'ui2-kicker' }, 'How much do you want to manage?'), ui2El('h1', {}, 'Set the pace of the life'),
    ui2El('div', { class: 'ui2-depth-list' }, ...Object.values(SIM_DEPTHS).map((d) => ui2El('button', { type: 'button', class: o.depth === d.key ? 'selected' : '', onclick: () => { o.depth = d.key; rerender(); } }, ui2El('strong', {}, d.label), ui2El('span', {}, d.blurb)))),
    ui2El('p', { class: 'ui2-muted' }, 'The first thing you will do is sit down for the Season Brief and decide what kind of year this should be.'),
    ui2El('button', { class: 'ui2-primary-action', type: 'button', 'data-testid': 'ui2-begin-career', onclick: start }, `Begin ${year} season →`));

  const view = ui2El('main', { class: 'ui2-onboarding', 'data-testid': 'ui2-onboarding' },
    ui2El('header', { class: 'ui2-start-brand' }, ui2El('div', { class: 'ui2-numberplate' }, 'LM'), ui2El('div', {}, ui2El('strong', {}, 'Legacy: Motocross'), ui2El('small', {}, 'Live a motocross life worth remembering.'))),
    app._corruptSave ? ui2El('div', { class: 'ui2-save-warning' }, 'Your saved career could not be loaded. Starting a new life will replace it.') : null,
    content);
  app.root.replaceChildren(view);
  window.scrollTo(0, 0);
}

export function installUi2CompletionPatch(App) {
  if (!App?.prototype || App.prototype[PATCH]) return;
  ensureStylesheet();
  const originalRenderStatsTab = App.prototype.renderStatsTab;
  const originalRenderPhone = App.prototype.renderPhone;
  const originalRenderTitle = App.prototype.renderTitle;

  App.prototype.renderStatsTab = function renderUi2Career() { return renderCareer(this); };
  App.prototype.renderPhone = function renderUi2World() { return renderWorld(this, originalRenderPhone); };
  App.prototype.renderTitle = function renderUi2Onboarding() { return renderOnboarding(this, originalRenderTitle); };

  Object.defineProperty(App.prototype, PATCH, { value: true });
}
