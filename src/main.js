// Entry point. Boots the app into #app.
import { App } from './ui.js';
import { DiagnosticsLog } from './systems/diagnostics.js';

const DIAG_KEY = 'legacy_mx_diag';

// Local, privacy-safe crash/error logging (#246). Loaded before the app so an
// error during boot is still captured. Persists to its own localStorage key,
// independent of the game save, and is exposed for QA on window.__diag.
const diag = loadDiag();
diag.install(window, {
  persist: (entries) => { try { localStorage.setItem(DIAG_KEY, JSON.stringify(entries)); } catch (e) { /* storage may be unavailable */ } },
});

const root = document.getElementById('app');
const app = new App(root, { diag });
app.mount();

// Expose for quick console poking / QA verification during prototyping.
window.__legacy = app;
window.__diag = diag;

function loadDiag() {
  try {
    const raw = localStorage.getItem(DIAG_KEY);
    return DiagnosticsLog.fromJSON(raw ? JSON.parse(raw) : []);
  } catch (e) {
    return new DiagnosticsLog();
  }
}
