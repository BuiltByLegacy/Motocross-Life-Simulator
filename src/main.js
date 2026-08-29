// Entry point. Boots the app into #app.
import { App } from './ui.js';
import { installCalendar2PlannerPatch } from './calendar2PlannerPatch.js';
import { installSponsorship2UiPatch } from './sponsorship2UiPatch.js';
import { installSponsorship2HardeningPatch } from './sponsorship2HardeningPatch.js';
import { installUi2ShellPatch } from './ui2ShellPatch.js';
import { DiagnosticsLog } from './systems/diagnostics.js';
import { Analytics } from './systems/analytics.js';

const DIAG_KEY = 'legacy_mx_diag';
const CONSENT_KEY = 'legacy_mx_analytics_consent';

// Calendar 2.0 live planner regression fix (#337). Install before the App is
// constructed so every rendered career-calendar screen uses the continuous,
// date-first presentation.
installCalendar2PlannerPatch(App);

// Sponsorship 2.0 (#341-#345): the season program stays tentative until the
// player gets a real sponsor-funding/negotiation step, then locks with the
// family's remaining contribution and sponsor obligations visible.
installSponsorship2UiPatch(App);

// Sponsorship 2.0 hardening (#349): dated commitments render in Calendar 2.0,
// graphics/product obligations become actionable in the Garage, and revising a
// tentative program can no longer bypass the sponsor-lock gate.
installSponsorship2HardeningPatch(App);

// UI 2.0 foundation (#356/#357): install last so the new responsive shell and
// five-concept navigation wrap the existing presentation adapters without
// changing simulation/domain behavior.
installUi2ShellPatch(App);

// Local, privacy-safe crash/error logging (#246). Loaded before the app so an
// error during boot is still captured. Persists to its own localStorage key,
// independent of the game save, and is exposed for QA on window.__diag.
const diag = loadDiag();
diag.install(window, {
  persist: (entries) => { try { localStorage.setItem(DIAG_KEY, JSON.stringify(entries)); } catch (e) { /* storage may be unavailable */ } },
});

// Local, no-network analytics (#247). Consent-gated; nothing is transmitted.
// The web prototype defaults ON (data never leaves the device); a child-directed
// native launch must default OFF and require explicit opt-in.
const analytics = new Analytics({ consent: readConsent() });

const root = document.getElementById('app');
const app = new App(root, { diag, analytics });
app.mount();

// Expose for quick console poking / QA verification during prototyping.
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
