import { buildMonthCalendar } from './systems/monthCalendar.js';
import { dateRangeForWeek } from './systems/calendarPresentation.js';

function h(tag, props = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== false && v != null) n.setAttribute(k, v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    n.appendChild(typeof kid === 'string' || typeof kid === 'number' ? document.createTextNode(String(kid)) : kid);
  }
  return n;
}

function continuousCalendar(game) {
  const base = Array.from({ length: 12 }, (_, i) => ({ week: i + 1, title: 'Open week' }));
  return buildMonthCalendar(base, { year: game.seasonYear, currentWeek: game.week });
}

function rangeLabel(game, week) {
  return dateRangeForWeek(continuousCalendar(game), week)?.label ?? `Calendar period ${week}`;
}

export function continuousPlannerPeriods(game) {
  const pool = game.eventPool();
  return Array.from({ length: 12 }, (_, i) => {
    const week = i + 1;
    return {
      week,
      range: rangeLabel(game, week),
      events: pool[week] ?? [],
      isOpen: !(pool[week]?.length),
    };
  });
}

function replaceText(root, matcher, replacement) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    if (matcher.test(node.nodeValue ?? '')) node.nodeValue = (node.nodeValue ?? '').replace(matcher, replacement);
  }
}

export function installCalendar2PlannerPatch(App) {
  if (App.prototype.__calendar2ContinuousPlanner) return;
  App.prototype.__calendar2ContinuousPlanner = true;

  const originalRender = App.prototype.render;
  App.prototype.render = function patchedRender(...args) {
    const result = originalRender.apply(this, args);
    if (this.game && this.root) {
      const currentRange = rangeLabel(this.game, Math.min(Math.max(this.game.week, 1), 12));
      replaceText(this.root, /\b\d{4}\s*·\s*Wk\s*\d+\/12\b/g, currentRange);
      replaceText(this.root, /^Week$/g, 'Calendar');
    }
    return result;
  };

  App.prototype.viewProgramBuilder = function patchedProgramBuilder(edit) {
    const g = this.game;
    const periods = continuousPlannerPeriods(g);
    const sel = this._programSel;
    const levelChip = (lvl) => h('span', { class: 'sp-tier ' + lvl }, lvl);
    const cost = periods.reduce((sum, period) => {
      const ev = period.events.find((e) => e.id === sel[period.week]);
      return sum + (ev ? ev.entry : 0);
    }, 0);

    const periodBlock = (period) => {
      const w = period.week;
      const opts = period.events;
      const locked = edit && w < g.week;
      const rows = opts.map((ev) => h('button', {
        class: 'prog-opt' + (sel[w] === ev.id ? ' on' : '') + (locked ? ' locked' : ''),
        onclick: locked ? undefined : () => { sel[w] = ev.id; this.render(); },
      },
        h('div', {}, h('b', {}, ev.name), ' ', levelChip(ev.level)),
        h('div', { class: 'faint small' }, `${ev.riders} riders · ${ev.travel} · entry $${ev.entry}`),
      ));

      if (opts.length) {
        rows.push(h('button', {
          class: 'prog-opt' + (!sel[w] ? ' on' : '') + (locked ? ' locked' : ''),
          onclick: locked ? undefined : () => { delete sel[w]; this.render(); },
        },
          h('b', {}, '🏡 Don’t race this period'),
          h('div', { class: 'faint small' }, 'Keep this time open for practice, training, maintenance, school, family, recovery, or travel.'),
        ));
      } else {
        rows.push(h('div', { class: 'prog-opt on' },
          h('div', {}, h('b', {}, '🏡 Open career time')),
          h('div', { class: 'faint small' }, 'No race is scheduled. You will still live this period through practice, training, maintenance, school/family time, recovery, shopping, or travel.'),
        ));
      }

      return h('div', { class: 'prog-week', 'data-calendar-week': String(w) },
        h('div', { class: 'prog-week-head' }, period.range, locked ? h('span', { class: 'faint small' }, ' (completed)') : null),
        ...rows,
      );
    };

    return h('div', {},
      h('div', { class: 'card' },
        h('div', { class: 'eyebrow' }, `🗓️ ${g.seasonYear} Career Calendar`),
        h('h2', {}, 'Build your schedule'),
        h('p', { class: 'small muted' }, 'Every calendar period exists. Choose races when they are available; open periods stay visible for the rest of your motocross life.'),
        this.programGoals(),
        h('div', { class: 'prog-summary' },
          h('span', {}, 'Booked entries: ', h('b', {}, '$' + cost)),
          h('span', { class: 'faint' }, ` · You have $${g.family.money.toLocaleString()}`),
        ),
        ...periods.map(periodBlock),
        this.programReview(),
        h('div', { class: 'toolbar', style: 'margin-top:12px' },
          edit ? h('button', { class: 'btn ghost', onclick: () => { this._seasonView = true; this.render(); } }, 'Cancel') : null,
          h('button', { class: 'btn primary', onclick: () => this.confirmProgram(edit) }, edit ? 'Save calendar' : 'Lock in the calendar →'),
        ),
      ),
    );
  };
}
