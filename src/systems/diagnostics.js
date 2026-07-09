// Crash Reporting & Error Logging (issue #246)
// --------------------------------------------------------------------------
// Zero-dependency, local-only diagnostics. Captures uncaught errors, unhandled
// promise rejections, and explicitly-logged failures (save/load parse, race-sim
// exceptions, stuck-state guards, Go Racing / Loretta gate failures) into a
// capped ring buffer that persists to localStorage. Privacy-safe by
// construction: no network, no personal data — only an error type, a truncated
// message, and coarse game context (seed, week, screen, class). The rider's
// name and any free text are never recorded. Opt-out simply clears the log.

export const DIAG_CAP = 50;

// The taxonomy of events worth capturing before/at a v1.0 launch.
export const DIAG_TYPES = [
  'uncaught',      // window error
  'promise',       // unhandled rejection
  'save_failure',  // toSave / serialize / storage write failed
  'load_failure',  // corrupt or unreadable save on continue
  'race_sim',      // exception inside race simulation
  'stuck_state',   // calendar/season could not produce a next action
  'go_racing',     // Go Racing launch blocked unexpectedly
  'loretta_gate',  // Road to Loretta's gate failure
  'ui_error',      // caught UI-boundary error
];

// Only these coarse, non-personal fields survive into a diagnostic record.
const CONTEXT_ALLOW = ['seed', 'week', 'season', 'screen', 'race', 'klass', 'event', 'code', 'line', 'col'];

function sanitizeContext(ctx) {
  if (ctx == null || typeof ctx !== 'object') return null;
  const out = {};
  for (const k of CONTEXT_ALLOW) if (ctx[k] != null) out[k] = ctx[k];
  return Object.keys(out).length ? out : null;
}

export class DiagnosticsLog {
  constructor(entries = []) {
    this.entries = (Array.isArray(entries) ? entries : []).slice(-DIAG_CAP);
    this._sink = null; // optional persistence callback
  }

  // Record one diagnostic event. Message is truncated; context is whitelisted.
  record({ type = 'ui_error', message = '', context = null, at = Date.now() } = {}) {
    const entry = {
      type: DIAG_TYPES.includes(type) ? type : 'ui_error',
      message: String(message ?? '').slice(0, 300),
      context: sanitizeContext(context),
      at,
    };
    this.entries.push(entry);
    if (this.entries.length > DIAG_CAP) this.entries = this.entries.slice(-DIAG_CAP);
    if (this._sink) { try { this._sink(this.entries); } catch (e) { /* persistence is best-effort */ } }
    return entry;
  }

  recent(n = DIAG_CAP) { return this.entries.slice(-Math.max(0, n)); }

  // Count of each recorded type, for a quick health summary.
  countByType() {
    const out = {};
    for (const e of this.entries) out[e.type] = (out[e.type] ?? 0) + 1;
    return out;
  }

  hasErrors() { return this.entries.length > 0; }

  clear() {
    this.entries = [];
    if (this._sink) { try { this._sink(this.entries); } catch (e) { /* best-effort */ } }
  }

  toJSON() { return this.entries; }
  static fromJSON(a) { return new DiagnosticsLog(Array.isArray(a) ? a : []); }

  // Install browser global handlers and an optional persistence sink. Safe to
  // call with a stub window in tests. Returns `this` for chaining.
  install(win, { persist } = {}) {
    if (typeof persist === 'function') this._sink = persist;
    if (!win || typeof win.addEventListener !== 'function') return this;
    win.addEventListener('error', (e) => {
      this.record({ type: 'uncaught', message: e?.message ?? 'Uncaught error', context: { line: e?.lineno, col: e?.colno } });
    });
    win.addEventListener('unhandledrejection', (e) => {
      const r = e?.reason;
      const msg = (r && (r.message ?? String(r))) || 'Unhandled rejection';
      this.record({ type: 'promise', message: msg });
    });
    return this;
  }
}
