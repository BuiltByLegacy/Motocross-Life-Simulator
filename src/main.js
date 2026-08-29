// Entry point. Boots the app into #app.
import { App } from './ui.js';
import { installCalendar2PlannerPatch } from './calendar2PlannerPatch.js';
import { installSponsorship2UiPatch } from './sponsorship2UiPatch.js';
import { installSponsorship2HardeningPatch } from './sponsorship2HardeningPatch.js';
import { installUi2ShellPatch } from './ui2ShellPatch.js';
import { installUi2GaragePatch } from './ui2GaragePatch.js';
import { installUi2CalendarPatch } from './ui2CalendarPatch.js';
import { installUi2RaceWeekendPatch } from './ui2RaceWeekendPatch.js';
import { installUi2SeasonLifecyclePatch } from './ui2SeasonLifecyclePatch.js';
import { installUi2CompletionPatch } from './ui2CompletionPatch.js';
import { DiagnosticsLog } from './systems/diagnostics.js';
import { Analytics } from './systems/analytics.js';

const DIAG_KEY = 'legacy_mx_diag';
const CONSENT_KEY = 'legacy_mx_analytics_consent';

installCalendar2PlannerPatch(App);
installSponsorship2UiPatch(App);
installSponsorship2HardeningPatch(App);
installUi2ShellPatch(App);
installUi2GaragePatch(App);
installUi2CalendarPatch(App);
installUi2RaceWeekendPatch(App);
installUi2SeasonLifecyclePatch(App);
// UI 2.0 completion wave (#355/#375-#380): Career becomes a record book,
// World becomes the motocross ecosystem, and new-career setup becomes a
// focused life-entry flow. Presentation only; simulation/domain state remains intact.
installUi2CompletionPatch(App);

// Preserve the established accessible-name contract used by save/reload flows
// even though the visible UI 2.0 continuation card contains richer copy.
const ui2RenderTitle = App.prototype.renderTitle;
App.prototype.renderTitle = function renderTitleWithContinueContract(...args) {
  const result = ui2RenderTitle.apply(this, args);
  this.root?.querySelector('[data-testid="ui2-continue-career"]')?.setAttribute('aria-label', 'Continue Career');
  return result;
};

const diag = loadDiag();
diag.install(window, {
  persist: (entries) => { try { localStorage.setItem(DIAG_KEY, JSON.stringify(entries)); } catch (e) { /* storage may be unavailable */ } },
});

const analytics = new Analytics({ consent: readConsent() });

const root = document.getElementById('app');
const app = new App(root, { diag, analytics });
app.mount();

window.__legacy = app;
window.__diag = diag;
window.__analytics = analytics;

function loadDiag() {
  try {
    const raw = localStorage.getItem(DIAG_KEY);
    return DiagnosticsLog.fromJSON(raw ? JSON.parse(raw) : []);
  } catch (e) {
    return new DiagnosticsLog();
  }
}

function readConsent() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw == null ? true : raw === 'true';
  } catch (e) {
    return true;
  }
}