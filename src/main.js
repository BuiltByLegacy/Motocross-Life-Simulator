// Entry point. Boots the app into #app.
import { App } from './ui.js';
import { installCalendar2PlannerPatch } from './calendar2PlannerPatch.js';
import { installSponsorship2UiPatch } from './sponsorship2UiPatch.js';
import { installSponsorship2HardeningPatch } from './sponsorship2HardeningPatch.js';
import { installUi2ShellPatch } from './ui2ShellPatch.js';
import { installUi2GaragePatch } from './ui2GaragePatch.js';
import { installUi2CalendarPatch } from './ui2CalendarPatch.js';
import { installUi2RaceWeekendPatch } from './ui2RaceWeekendPatch.js';
import { installUi2RaceIntelligencePatch } from './ui2RaceIntelligencePatch.js';
import { installUi2SeasonLifecyclePatch } from './ui2SeasonLifecyclePatch.js';
import { installUi2CompletionPatch } from './ui2CompletionPatch.js';
import { installUi2LifeBetweenRacesPatch } from './ui2LifeBetweenRacesPatch.js';
import { installUi2RiderDevelopmentPatch } from './ui2RiderDevelopmentPatch.js';
import { installUi2EquipmentPatch } from './ui2EquipmentPatch.js';
import { installUi2CareerOpportunitiesPatch } from './ui2CareerOpportunitiesPatch.js';
import { installUi2PeopleEconomyPatch } from './ui2PeopleEconomyPatch.js';
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
installUi2RaceIntelligencePatch(App);
installUi2SeasonLifecyclePatch(App);
installUi2CompletionPatch(App);
installUi2LifeBetweenRacesPatch(App);
installUi2RiderDevelopmentPatch(App);
installUi2EquipmentPatch(App);
installUi2CareerOpportunitiesPatch(App);
// People + Economy 2.0 (#495/#502) translates canonical relationship and
// ledger/risk state into readable life-sim stories; simulation stays in systems.
installUi2PeopleEconomyPatch(App);

const ui2RenderTitle = App.prototype.renderTitle;
App.prototype.renderTitle = function renderTitleWithContinueContract(...args) {
  const result = ui2RenderTitle.apply(this, args);
  this.root?.querySelector('[data-testid="ui2-continue-career"]')?.setAttribute('aria-label', 'Continue Career');
  return result;
};

const diag = loadDiag();
diag.install(window, {persist: (entries) => { try { localStorage.setItem(DIAG_KEY, JSON.stringify(entries)); } catch (e) {} }});
const analytics = new Analytics({ consent: readConsent() });
const root = document.getElementById('app');
const app = new App(root, { diag, analytics });
app.mount();
window.__legacy = app;
window.__diag = diag;
window.__analytics = analytics;

function loadDiag() { try { const raw=localStorage.getItem(DIAG_KEY); return DiagnosticsLog.fromJSON(raw?JSON.parse(raw):[]); } catch(e){ return new DiagnosticsLog(); } }
function readConsent() { try { const raw=localStorage.getItem(CONSENT_KEY); return raw==null?true:raw==='true'; } catch(e){ return true; } }
