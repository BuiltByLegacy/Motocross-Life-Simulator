import { UI2_PRIMARY_NAV, UI2_MORE_NAV, ui2El, ui2NavButton, ui2Sheet } from './ui2/primitives.js';

const DESTINATION_BY_TAB = new Map([
  ['garage', 'home'],
  ['week', 'calendar'],
  ['stats', 'career'],
  ['phone', 'world'],
  ['sponsors', 'more'],
  ['people', 'more'],
  ['journal', 'more'],
]);

function ensureStylesheet() {
  if (document.querySelector('link[data-ui2-styles]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './ui2.css';
  link.dataset.ui2Styles = 'true';
  document.head.appendChild(link);
}

function navigate(app, legacyTab) {
  app._ui2MoreOpen = false;
  app.tab = legacyTab;
  app.render();
  try { window.scrollTo({ top: 0, behavior: 'instant' }); } catch (e) { window.scrollTo(0, 0); }
}

export function installUi2ShellPatch(App) {
  if (!App || App.prototype.__ui2ShellInstalled) return;
  App.prototype.__ui2ShellInstalled = true;
  ensureStylesheet();

  const originalRender = App.prototype.render;
  App.prototype.render = function renderUi2Shell() {
    originalRender.call(this);
    document.body.classList.add('ui2-ready');
    this.root?.setAttribute('data-ui-version', '2');
    this.root?.querySelector('.screen')?.classList.add('ui2-shell');
    this.root?.querySelector('.sticky-head')?.classList.add('ui2-sticky-head');
    this.root?.querySelector('.scroll-area')?.classList.add('ui2-scroll-area');
  };

  App.prototype.renderTabs = function renderUi2Navigation() {
    const activeDestination = DESTINATION_BY_TAB.get(this.tab) ?? 'more';
    const nav = ui2El('nav', {
      class: 'ui2-nav',
      'aria-label': 'Primary',
      'data-testid': 'ui2-primary-nav',
    },
    ...UI2_PRIMARY_NAV.map((item) => ui2NavButton({
      ...item,
      active: activeDestination === item.id,
      onSelect: () => navigate(this, item.legacyTab),
    })),
    ui2NavButton({
      id: 'more', label: 'More', icon: '•••',
      active: activeDestination === 'more',
      onSelect: () => { this._ui2MoreOpen = !this._ui2MoreOpen; this.render(); },
    }));

    const wrap = ui2El('div', { class: 'ui2-nav-wrap' }, nav);
    if (this._ui2MoreOpen) {
      wrap.appendChild(ui2Sheet({
        title: 'More',
        testId: 'ui2-more-sheet',
        onClose: () => { this._ui2MoreOpen = false; this.render(); },
        children: UI2_MORE_NAV.map((item) => ui2El('button', {
          class: `ui2-more-row${this.tab === item.legacyTab ? ' active' : ''}`,
          type: 'button',
          'data-testid': `ui2-more-${item.id}`,
          onclick: () => navigate(this, item.legacyTab),
        },
        ui2El('span', { class: 'ui2-more-icon', 'aria-hidden': 'true' }, item.icon),
        ui2El('span', { class: 'ui2-more-copy' },
          ui2El('strong', {}, item.label),
          ui2El('small', {}, moreDescription(item.id))),
        ui2El('span', { class: 'ui2-more-chevron', 'aria-hidden': 'true' }, '›'))),
      }));
    }
    return wrap;
  };
}

function moreDescription(id) {
  if (id === 'sponsors') return 'Deals, obligations and support';
  if (id === 'people') return 'Family, rivals, coaches and relationships';
  return 'Memories, milestones and the life you are building';
}
