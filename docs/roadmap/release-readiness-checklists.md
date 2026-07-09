# Release Readiness Checklists

## Core Career Loop Validation

- New career can be created in Rider and Parent campaigns.
- Week 1 season program can be reviewed and committed.
- At least one race weekend can be launched from the calendar.
- Race result applies money, fatigue, bike wear, points, memories, notifications, and recap data.
- Season recap can advance to a new season or retire.
- Save/load preserves rider, bike, garage, market, memories, calendar, Loretta path, responsibility, and race-weekend state.

## First-Time User Onboarding

- Campaign choice explains Rider vs Parent.
- Identity step explains age and starting class.
- Background step explains money/school/family impact.
- Simulation depth step explains Detailed, Key Moments, and Fast Sim.
- First season planner appears before routine weekly play.
- Empty states point to the next meaningful action without tutorial popups.

## UI Polish

- Main tabs remain reachable on mobile.
- Buttons have clear disabled states and reasons.
- Race launch blockers and warnings are visible before starting.
- Garage, marketplace, phone, journal, and recap have empty states.
- Long rider names and money values do not overflow compact cards.

## App Store Asset Checklist

- App icon.
- Launch/splash image if platform requires it.
- Store screenshots for supported device sizes.
- Short description and long description.
- Privacy policy URL.
- Support URL.
- Age rating answers.
- In-app purchase metadata if monetization is enabled.

## TestFlight Beta Plan

- Internal alpha: verify save/load, onboarding, race loop, garage, marketplace.
- Closed external beta: validate first-season clarity, balance, crashes, performance, and comprehension.
- Beta feedback categories: onboarding confusion, unfair outcomes, money pressure, race clarity, UI friction, crashes.
- Beta exit criteria: no known save corruption, no blocking race-loop bugs, no unhandled launch blockers.

## Crash Reporting and Error Logging

- Capture uncaught JavaScript errors.
- Capture failed save/load parse events.
- Capture race simulation exceptions with seed/week/race metadata.
- Capture marketplace/dealer transaction failures.
- Avoid collecting personal data beyond anonymous diagnostics.

## Analytics Event Plan

- `career_started`
- `season_committed`
- `race_weekend_started`
- `race_completed`
- `season_completed`
- `save_loaded`
- `marketplace_purchase`
- `dealer_order`
- `bike_sold`
- `crash_error`

Analytics must be optional/compliant and should never store child personal data.

## Performance and Battery

- No unbounded loops in fast sim.
- Race simulation remains deterministic and bounded by motos/laps.
- Marketplace refresh uses small lists in v1.0.
- Autosave writes at week boundaries and major transactions only.
- UI rerenders are event-driven, not interval-driven.

## Accessibility and Settings

- Text-only information accompanies icon-heavy controls.
- Color is not the only state indicator.
- Buttons and tabs are keyboard reachable in browser prototype.
- Settings should include audio/haptics toggles before native launch.
- Save reset is explicit and confirmable.

## Audio and Haptics

- Optional race start cue.
- Optional race result cue.
- Optional purchase/sale cue.
- Optional haptics for native race start, crash, and finish moments.
- All audio/haptics must be disabled through settings.

## Balance Pass

- Money pressure should be meaningful but not soft-lock the first season.
- Bike condition should matter without causing constant DNF frustration.
- Race outcomes should be explainable from prep, rider skill, bike state, fatigue, and field strength.
- Age/trust permissions should block unrealistic actions without hiding the next path forward.
- Loretta path should feel aspirational, not guaranteed.

## Bug Bash and Regression

- Run `npm test`.
- Manually start a new career.
- Complete a race weekend.
- Buy a marketplace item.
- Order a dealer part.
- Sell a garage bike.
- Save, reload, and continue.
- Complete a season recap.

## Privacy and Compliance

- No personal child data collection in analytics.
- No pay-to-win monetization.
- Restore purchases if in-app purchases exist.
- Privacy policy describes local save data and optional diagnostics.
- Ads, if enabled, must be age-appropriate and non-competitive.

## Final App Store Submission

- All release blockers closed or explicitly waived.
- TestFlight exit criteria met.
- App metadata complete.
- Privacy policy/support URLs live.
- Build number/version set.
- Monetization products reviewed for no-pay-to-win compliance.
- Final smoke test completed on target devices.

## Post-Launch Monitoring

- Watch crash/error volume daily for launch week.
- Track onboarding drop-off and season-commit completion.
- Review player feedback for race clarity, money pressure, and save reliability.
- Patch save corruption or launch-loop blockers before content expansion.
