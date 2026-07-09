# Critical Issue Implementation Notes

This document records the implemented P0 critical slice so GitHub issues can be closed against a stable repo artifact.

## Nonlinear Career and Season Planning

- Careers use event-based season programs, not a single linear series-size assumption.
- `src/systems/seasonPlanner.js` supports draft/tentative/committed/withdrawn/missed event states, cost forecasting, travel days, conflicts, goals, and calendar generation.
- `Game.buildPlanner()` converts the active race program into a planner for review and Loretta warnings.
- `Game.startRaceWeekend()` turns the current committed race into a readiness-checked race weekend.

## Road to Loretta's

- Loretta's is modeled as a qualification path, not a directly selectable race.
- The implemented simulation path is Area Qualifier -> Regional Championship -> National invitation.
- `src/systems/lorettasPath.js` keeps yearly slot counts configurable inside `STAGE_INFO`; exact counts should remain tunable because real supplemental rules can vary by class, region, and year.
- Planner warnings detect missing area qualifiers, impossible regional/national entries, bad date sequence, ineligible classes, and region splits.

## Bike Builder and Class Transitions

- Loose upgrades are replaced by a slotted bike-builder model in `src/systems/bikeBuilder.js`.
- Build slots: engine, suspension, wheels, controls, protection, cosmetic.
- Part installation uses compatibility rules before applying performance, handling, or reliability changes.
- Moving classes no longer grants a free bike. `Game.startNextSeason()` stores the outgrown bike and requires the next-class bike to exist or be purchased. If the family cannot afford it, `flags.needs_class_bike` blocks clean race entry.

## Age, Trust, Parent Approval, and Visibility

- `src/systems/responsibility.js` implements age bands, permission levels, trust scoring, parent approval outcomes, and information visibility.
- Age sets the baseline. Trust can loosen or tighten access, but it cannot reveal hidden or legally locked actions to young riders.
- Parent Mode sees full adult context. Rider Mode uses child-appropriate framing for money, contracts, travel, and family obligations.

## Season Commitment and Go Racing

- `src/systems/raceWeekend.js` defines explicit race-weekend states from `scheduled` through `complete`, plus failure states such as `dns`, `withdrawn`, `medical_hold`, and `bike_not_cleared`.
- Readiness checks include event, class, bike eligibility, bike condition, injury, money, parent approval, fatigue, family stress, deadline proximity, and consumable wear.
- `Game.startRaceWeekend()` creates and registers the race weekend only when blockers are clear; warnings remain visible but non-blocking.

## v1.0 Scope and Guardrails

- v1.0 must prove the core loop: create rider, plan season, manage family/money, prepare bike, go racing, generate results and memories, save/load, and recap.
- Monetization may not buy competitive advantage. Paid systems are limited to cosmetics, presentation, compliant purchase restoration, or later-scope non-competitive features.
- Deep social, full pro career, era selection, advanced documentary tools, full world simulation, and advanced monetization remain valid roadmap items but are not launch blockers.

## Test Coverage

The critical implementation slice is covered by:

- `test/responsibility.test.mjs`
- `test/bikeBuilder.test.mjs`
- `test/raceWeekend.test.mjs`
- `test/criticalGameIntegration.test.mjs`
- Existing planner, Loretta, garage, marketplace, race, memory, notification, and competition tests
