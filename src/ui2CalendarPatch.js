import { continuousPlannerPeriods } from './calendar2PlannerPatch.js';

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = String(text);
  return n;
}
function add(parent, ...children) { children.flat().filter(Boolean).forEach((c) => parent.appendChild(c)); return parent; }
function money(n) { return `$${Number(n || 0).toLocaleString()}`; }

function ensureStyles() {
  if (document.querySelector('link[data-ui2-calendar-styles]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './ui2Calendar.css';
  link.dataset.ui2CalendarStyles = 'true';
  document.head.appendChild(link);
}

function monthOf(range) {
  const m = String(range || '').match(/^([A-Z][a-z]{2})/);
  return m?.[1] || 'SEASON';
}

function eventTone(ev) {
  const level = String(ev?.level || '').toLowerCase();
  const name = String(ev?.name || '').toLowerCase();
  if (/qual|regional|national|champ/.test(name + level)) return 'major';
  if (/local|club/.test(level)) return 'local';
  return 'race';
}

function selectedEvent(app, period) {
  const id = app._programSel?.[period.week];
  return period.events.find((e) => e.id === id) || null;
}

function seasonFacts(app, periods) {
  const selected = periods.map((p) => selectedEvent(app, p)).filter(Boolean);
  return {
    selected,
    entries: selected.reduce((sum, e) => sum + Number(e.entry || 0), 0),
    open: periods.length - selected.length,
  };
}

function buildBoard(app, edit) {
  const g = app.game;
  const periods = continuousPlannerPeriods(g);
  const facts = seasonFacts(app, periods);
  const root = el('section', 'calendar2');
  root.dataset.testid = 'ui2-calendar-board';

  const mast = el('header', 'calendar2-mast');
  add(mast,
    add(el('div'), el('small', '', `${g.seasonYear} RIDER SEASON`), el('h1', '', 'THE SEASON BOARD'), el('p', '', 'Race weekends, home life and the miles between them.')),
    add(el('div', 'calendar2-budget'), el('small', '', 'FAMILY MONEY'), el('strong', '', money(g.family?.money)))
  );

  const status = el('div', 'calendar2-status');
  add(status,
    add(el('div'), el('small', '', edit ? 'SEASON STATUS' : 'BUILDING THE YEAR'), el('strong', '', edit ? 'Calendar unlocked for changes' : 'Choose the weekends worth chasing')),
    add(el('div'), el('b', '', `${facts.selected.length} races`), el('span', '', `${facts.open} open periods · ${money(facts.entries)} entries`))
  );

  const strip = el('nav', 'calendar2-month-strip');
  strip.setAttribute('aria-label', 'Season months');
  const seen = new Set();
  periods.forEach((p) => {
    const month = monthOf(p.range);
    if (seen.has(month)) return;
    seen.add(month);
    const b = el('button', '', month);
    b.type = 'button';
    b.onclick = () => root.querySelector(`[data-calendar-period="${p.week}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    strip.appendChild(b);
  });

  const timeline = el('div', 'calendar2-timeline');
  periods.forEach((period) => {
    const chosen = selectedEvent(app, period);
    const locked = edit && period.week < g.week;
    const item = el('article', `calendar2-period ${chosen ? eventTone(chosen) : 'open'}${locked ? ' completed' : ''}`);
    item.dataset.calendarPeriod = String(period.week);
    const date = add(el('div', 'calendar2-date'), el('small', '', monthOf(period.range)), el('strong', '', period.range.replace(/^\w{3}\s*/, '')));
    const life = el('div', 'calendar2-life');
    if (chosen) {
      add(life,
        add(el('div', 'calendar2-event-title'), el('small', '', locked ? 'COMPLETED / COMMITTED' : 'RACE WEEKEND'), el('h2', '', chosen.name)),
        add(el('div', 'calendar2-meta'), el('span', '', chosen.level || 'Race'), el('span', '', chosen.travel || 'Travel'), el('span', '', `Entry ${money(chosen.entry)}`))
      );
    } else {
      add(life,
        add(el('div', 'calendar2-event-title'), el('small', '', 'HOME / OPEN CAREER TIME'), el('h2', '', 'Life between the races')),
        el('p', '', 'Practice, school, family, maintenance, recovery and the choices that make the next gate drop possible.')
      );
    }

    if (!locked && period.events.length) {
      const choices = el('div', 'calendar2-choices');
      period.events.forEach((ev) => {
        const b = el('button', app._programSel?.[period.week] === ev.id ? 'selected' : '');
        b.type = 'button';
        b.onclick = () => { app._programSel[period.week] = ev.id; app.render(); };
        add(b, el('strong', '', ev.name), el('span', '', `${ev.travel} · ${money(ev.entry)}`));
        choices.appendChild(b);
      });
      const home = el('button', !chosen ? 'selected home' : 'home');
      home.type = 'button';
      home.onclick = () => { delete app._programSel[period.week]; app.render(); };
      add(home, el('strong', '', 'Keep this time home'), el('span', '', 'Ride · recover · family · prep'));
      choices.appendChild(home);
      life.appendChild(choices);
    }
    add(item, date, life);
    timeline.appendChild(item);
  });

  const footer = el('div', 'calendar2-lock');
  const review = app.programReview?.();
  if (review) footer.appendChild(review);
  const save = el('button', 'calendar2-lock-btn', edit ? 'SAVE THE SEASON BOARD →' : 'LOCK IN THE SEASON →');
  save.type = 'button';
  save.dataset.testid = 'calendar-season-lock';
  save.onclick = () => app.confirmProgram(edit);
  footer.appendChild(save);

  add(root, mast, status, strip, timeline, footer);
  return root;
}

export function installUi2CalendarPatch(App) {
  if (!App || App.prototype.__ui2CalendarInstalled) return;
  App.prototype.__ui2CalendarInstalled = true;
  ensureStyles();

  App.prototype.viewProgramBuilder = function ui2ProgramBuilder(edit) {
    return buildBoard(this, edit);
  };
}