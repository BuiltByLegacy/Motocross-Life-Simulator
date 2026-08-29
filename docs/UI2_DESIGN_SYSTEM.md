# UI 2.0 Design System

Parent initiative: #355. Foundation issues: #356 and #357.

## Product intent
UI 2.0 turns Legacy: Motocross from a prototype dashboard into a mobile-first life-simulation experience. The simulation stays authoritative; presentation explains the rider's life, current context, and next meaningful choice.

Core rule: **world first, data second**.

## Information architecture
Primary navigation is intentionally limited to five concepts:

1. **Home** — maps to the Garage during the staged migration and becomes the full Garage/Home hub in #358.
2. **Calendar** — current life/week/calendar loop.
3. **Career** — stats/results/career progression during migration.
4. **World** — phone/world-facing systems during migration.
5. **More** — lower-frequency destinations such as Sponsors, People, and Journal.

All seven former permanent destinations remain reachable in no more than two taps while the new shell is adopted.

## Tokens
`ui2.css` defines the UI 2.0 token namespace. New work should use `--ui2-*` values instead of adding raw one-off values for repeated concepts.

Token groups:
- surfaces/backgrounds
- text hierarchy
- accent and semantic states
- border strength
- spacing
- radii
- elevation
- navigation height

The visual identity remains garage-at-night: charcoal surfaces, warm work-light orange, restrained semantic color, and reduced card chrome.

## Responsive model
- **Phone (<720px):** single-column, thumb-first, fixed five-item bottom navigation, safe-area padding, horizontally scrollable compact HUD.
- **Tablet (>=720px):** wider content column, floating bottom navigation, more breathing room.
- **Desktop (>=1024px):** content expands beyond the old 480px phone frame and uses up to ~1040px for migrated content.

Do not reintroduce a hard 480px global app width.

## Presentation primitives
`src/ui2/primitives.js` provides domain-agnostic DOM primitives:
- primary navigation button
- status chip
- page header
- list row
- action bar
- bottom sheet

Primitives accept data/callbacks. They must not mutate game/domain state themselves.

## Interaction standards
- Minimum interactive target: 44px.
- Use visible focus states for keyboard/accessibility support.
- Respect iOS safe areas.
- Use bottom sheets for lower-frequency contextual choices instead of adding permanent tabs.
- Keep one visually dominant primary action in focused flows.
- Prefer progressive disclosure over showing every metric/control at once.
- Respect `prefers-reduced-motion`.

## Semantic states
Use semantic treatment only when it helps a decision:
- success — healthy/ready/complete
- warning — needs attention soon
- danger — blocked/high risk/failed
- info — neutral contextual information

Do not turn the entire interface into color-coded status cards.

## Emoji/icon strategy
Emoji may remain as temporary content placeholders where the underlying prototype already uses them, but new UI structure should not depend on emoji for meaning. Text labels and accessible names are required. A future visual-asset pass can replace placeholders without changing information architecture.

## Compatibility strategy
`src/ui2ShellPatch.js` is a migration adapter. It wraps the existing `App` presentation after Calendar 2.0 and Sponsorship 2.0 presentation patches install. This allows UI 2.0 to replace the shell/navigation without rewriting simulation logic or forcing a big-bang migration of `src/ui.js`.

As screens are rebuilt, they should move into focused modules and eventually reduce/remove patch-based presentation code.

## Anti-patterns
Avoid:
- adding another permanent bottom tab for each new system
- exposing internal simulation variables just because they exist
- large persistent stat grids above every screen
- generic card-inside-card layouts
- copying domain calculations into UI modules
- hard-coded phone-only widths on desktop
- one-off CSS values when a token already represents the concept
- navigation that requires horizontal scrolling

## Test contract
New UI 2.0 surfaces should expose stable `data-testid` hooks for critical navigation and flows. Browser coverage must include a 390x844 phone viewport and desktop behavior. Existing save/load and simulation tests remain the regression gate.