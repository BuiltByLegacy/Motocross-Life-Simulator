// UI 2.0 presentation primitives (#356).
// These helpers are intentionally domain-agnostic: they render data and emit
// callbacks, but never mutate game state themselves.

export const UI2_PRIMARY_NAV = Object.freeze([
  { id: 'home', label: 'Home', icon: '⌂', legacyTab: 'garage' },
  { id: 'calendar', label: 'Calendar', icon: '▦', legacyTab: 'week' },
  { id: 'career', label: 'Career', icon: '★', legacyTab: 'stats' },
  { id: 'world', label: 'World', icon: '◎', legacyTab: 'phone' },
]);

// Career now owns sponsorship context and World owns people. More is reserved
// for genuinely lower-frequency utilities instead of duplicating primary areas.
export const UI2_MORE_NAV = Object.freeze([
  { id: 'journal', label: 'Journal', icon: 'J', legacyTab: 'journal' },
]);

export function ui2El(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (value !== false && value != null) node.setAttribute(key, String(value));
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    node.appendChild(typeof child === 'string' || typeof child === 'number' ? document.createTextNode(String(child)) : child);
  }
  return node;
}

export function ui2NavButton({ id, label, icon, active = false, onSelect }) {
  return ui2El('button', {
    class: `ui2-nav-item${active ? ' active' : ''}`,
    type: 'button',
    'data-testid': `ui2-nav-${id}`,
    'aria-current': active ? 'page' : null,
    onclick: onSelect,
  },
  ui2El('span', { class: 'ui2-nav-icon', 'aria-hidden': 'true' }, icon),
  ui2El('span', { class: 'ui2-nav-label' }, label));
}

export function ui2StatusChip(label, value, tone = 'neutral') {
  return ui2El('div', { class: `ui2-chip ui2-chip-${tone}` },
    ui2El('span', { class: 'ui2-chip-label' }, label),
    ui2El('strong', { class: 'ui2-chip-value' }, value));
}

export function ui2PageHeader({ eyebrow, title, subtitle, action = null }) {
  return ui2El('header', { class: 'ui2-page-header' },
    ui2El('div', { class: 'ui2-page-header-copy' },
      eyebrow ? ui2El('div', { class: 'ui2-eyebrow' }, eyebrow) : null,
      ui2El('h1', {}, title),
      subtitle ? ui2El('p', { class: 'ui2-subtitle' }, subtitle) : null),
    action ? ui2El('div', { class: 'ui2-page-header-action' }, action) : null);
}

export function ui2ListRow({ title, meta, leading = null, trailing = null, onSelect = null, testId = null }) {
  const tag = onSelect ? 'button' : 'div';
  return ui2El(tag, {
    class: `ui2-list-row${onSelect ? ' interactive' : ''}`,
    type: onSelect ? 'button' : null,
    onclick: onSelect,
    'data-testid': testId,
  },
  leading ? ui2El('div', { class: 'ui2-list-leading' }, leading) : null,
  ui2El('div', { class: 'ui2-list-copy' },
    ui2El('strong', {}, title),
    meta ? ui2El('span', {}, meta) : null),
  trailing ? ui2El('div', { class: 'ui2-list-trailing' }, trailing) : null);
}

export function ui2ActionBar(primary, secondary = []) {
  return ui2El('div', { class: 'ui2-action-bar' },
    ...secondary,
    primary);
}

export function ui2Sheet({ title, children = [], onClose, testId = null }) {
  return ui2El('div', { class: 'ui2-sheet-backdrop', 'data-testid': testId, onclick: (event) => { if (event.target === event.currentTarget) onClose?.(); } },
    ui2El('section', { class: 'ui2-sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      ui2El('header', { class: 'ui2-sheet-header' },
        ui2El('h2', {}, title),
        ui2El('button', { class: 'ui2-icon-button', type: 'button', 'aria-label': 'Close', onclick: onClose }, '×')),
      ui2El('div', { class: 'ui2-sheet-body' }, ...children)));
}
