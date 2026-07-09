# Crash Reporting & Error Logging (#246)

Local, zero-dependency, privacy-safe diagnostics for the v1.0 web build. No
third-party SDK, no network calls, no personal data. Implemented in
`src/systems/diagnostics.js` and wired at boot in `src/main.js`.

## Approach

- **`DiagnosticsLog`** — a capped ring buffer (50 entries) with `record()`,
  `recent()`, `countByType()`, `clear()`, and `toJSON()`/`fromJSON()`.
- **Global handlers** — `install(window, { persist })` hooks `error` and
  `unhandledrejection`, so uncaught exceptions and rejected promises are
  captured even during boot (the log is created before the app mounts).
- **Persistence** — entries are written to their own localStorage key
  (`legacy_mx_diag`), independent of the game save, so a corrupt save never
  takes the diagnostics with it.
- **QA surface** — exposed on `window.__diag`; a compact, count-only summary and
  a **Clear diagnostics** button live in Journal → Help.

## Captured events

| Type | Source |
|------|--------|
| `uncaught` | `window.onerror` |
| `promise` | `unhandledrejection` |
| `save_failure` | `App.saveGame()` — serialization or storage write failed |
| `load_failure` | `App.continueGame()` — missing/corrupt save (throws from `Game.load`, #242) |
| `race_sim` | exception inside race simulation |
| `stuck_state` | calendar/season could not produce a next action |
| `go_racing` | Go Racing launch blocked unexpectedly |
| `loretta_gate` | Road to Loretta's gate failure |
| `ui_error` | caught UI-boundary error |

## Privacy

Diagnostics are privacy-safe **by construction**:

- Each record holds only a `type`, a **300-char-truncated** message, a timestamp,
  and a whitelisted context (`seed`, `week`, `season`, `screen`, `race`, `klass`,
  `event`, `code`, `line`, `col`). Any other context key — including the rider's
  name, notes, or an email — is dropped by `sanitizeContext()`.
- No network transmission. Nothing leaves the device.
- Opt-out is trivial: **Clear diagnostics** empties the log and its storage.

## Corrupt-save recovery (ties into #241/#242)

Because `Game.load()` now throws on a missing/corrupt save, `continueGame()`
wraps it in try/catch: on failure it records a `load_failure`, keeps the bad
save (rather than silently destroying it), and routes the player back to the
title with a clear **"Save couldn't be loaded"** notice offering a fresh start.
The title screen also validates the save (`Game.isValidSave`) before rendering
the Continue card, so a broken card never appears.

## Validation

- `test/diagnostics.test.mjs` — 8 unit tests (typing, truncation, privacy
  filtering, ring-buffer cap, count/clear, JSON round-trip, handler
  installation + persistence sink, all declared types).
- Browser smoke: a planted corrupt save shows the recovery notice, records a
  `load_failure`, and offers a fresh start; a synthetic uncaught throw is
  captured by the installed handler — with no real console/page errors.

## Native launch note

For an eventual native/iOS build, this local log is the last-mile buffer; a
store-compliant crash reporter (e.g. the platform's own crash service) would be
added at the wrapper layer and fed the same event taxonomy. Consent/opt-out
requirements are tracked in [`privacy-and-compliance.md`](./privacy-and-compliance.md).
