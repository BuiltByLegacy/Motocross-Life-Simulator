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
import { DiagnosticsLog } from './systems/diagnostics.js';
import { Analytics } from './systems/analytics.js';

const DIAG_KEY = 'legacy_mx_diag';
const CONSENT_KEY = 'legacy_mx_analytics_consent';

installCalendar2PlannerPatch(App);
installSponsorship2UiPatch(App);
installSponsorship2HardeningPatch(App);
installUi2ShellPatch(App);
// UI 2.0 visual identity (#358/#362): Garage is the first world-first reference
// destination. Installed after the shell so it can replace legacy Garage content
// without changing simulation/domain behavior.
installUi2GaragePatch(App);
// UI 2.0 Calendar (#359): installed after Calendar 2.0 and sponsorship patches so
// the season board preserves their domain behavior while replacing the builder UI.
installUi2CalendarPatch(App);
// UI 2.0 Race Weekend (#360): presentation-only override for arrival, live motos
// and results; deterministic race engine behavior stays in the existing domain.
installUi2RaceWeekendPatch(App);
// Season Lifecycle 2.0 (#372): presentation-only orchestration around the existing
// season/calendar/race systems. Brief, family plan, sponsor opportunity, midseason
// review and season review are scenes; domain math remains in lifecycle systems.
installUi2SeasonLifecyclePatch(App);

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