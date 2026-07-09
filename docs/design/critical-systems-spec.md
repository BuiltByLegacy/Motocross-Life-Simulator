# Critical Systems Specification

This spec anchors the critical design issues that are broader than a single code module. Current implementation hooks are noted where they exist.

## Dynamic Motocross World

The world must move independently of the player. Rival ratings, news, opportunities, sponsor attention, marketplace listings, and career context can change even when the player does not act.

Implemented hooks:

- `src/engines/worldEngine.js`
- `Game.prepareWeek()`
- `src/systems/competition.js`
- `src/systems/notifications.js`

Minimum v1 behavior:

- Weekly world tick.
- Rival field progression.
- News items.
- Marketplace refresh.
- Race results and standings that do not depend only on the player.

## AI Family Simulation

Family systems must evaluate money, stress, trust, grades, injury, race stakes, and age before approvals. Parents are not simple unlock switches.

Implemented hooks:

- `src/systems/responsibility.js`
- `src/engines/relationshipEngine.js`
- Parent Mode activities in `src/data/content.js`

Minimum v1 behavior:

- Parent approval outcomes: approved, approved with conditions, denied, parent decides.
- Family stress and budget can restrict travel, purchases, race entries, and Loretta attempts.
- Parent campaign sees full adult context while rider campaign receives age-appropriate framing.

## Personality and Group Reputation

The prototype currently expresses personality through relationship values, rider confidence, momentum, sponsor eligibility, and recurring rival history.

Minimum v1 behavior:

- Hidden relationship values drive descriptions and scenarios.
- Momentum and confidence shape race/career story.
- Sponsor/shop reputation uses results and relationship state.
- Rival history records recurring encounters and memory hooks.

Later scope:

- Full personality trait engine.
- Group reputation categories beyond shop/sponsor/rival/community basics.

## Family Memory System

Family events must become durable memories when they alter trust, support, sacrifice, pressure, or identity.

Implemented hooks:

- `src/engines/memoryEngine.js`
- `src/systems/memoryTriggers.js`
- Relationship/family scenario cards in `src/data/content.js`

Minimum v1 memory hooks:

- First race.
- First win/podium.
- Family sacrifice or approval.
- Bike purchase/sale.
- Injury/crash.
- Loretta attempt/qualification.
- Season recap.

## Garage Museum

The garage is storage, workshop, and memory surface. v1 does not need deep museum decoration, but it must preserve emotionally important objects.

Implemented hooks:

- `src/systems/garageView.js`
- `src/systems/assetProvenance.js`
- Garage objects/trophies in `Game.applyRaceResult()` and class transitions.

Minimum v1 behavior:

- Active bike, stored bikes, parts, objects, trophies.
- Provenance and memory count in garage view models.
- Old class bikes can become keepsakes.
- Sold bikes preserve provenance transfer and memory hooks.

## Dynamic Opportunity Engine

Opportunities should emerge from results, relationships, money pressure, support level, and world state.

Implemented hooks:

- `src/engines/opportunityEngine.js`
- `src/engines/sponsorEngine.js`
- `Game.grantOpportunity()`

Minimum v1 behavior:

- Support/sponsor opportunities can appear from results and reputation.
- Opportunities enter news/phone surfaces.
- The world can keep moving even when the player ignores an opportunity.

## Mechanical Knowledge Progression

Mechanical knowledge is represented by race IQ, wrenching outcomes, fitment checks, and mechanic-skill options.

Implemented hooks:

- Wrenching activities in `src/data/content.js`.
- Compatibility resolution in `src/systems/compatibility.js`.
- Bike-builder installation in `src/systems/bikeBuilder.js`.

Minimum v1 behavior:

- Wrenching improves bike state and can improve race IQ.
- Fitment can be direct, modify, incompatible, or unknown.
- Higher mechanic skill can resolve unknown fitment.

Later scope:

- Dedicated mechanical knowledge stat and progression tree.

## Human Development and Injury

The rider grows through age, fitness, skill, trust, fatigue, burnout, injuries, class changes, and school/work context.

Implemented hooks:

- Age/class helpers in `src/data/content.js`.
- Age skill scaling in `src/core/state.js`.
- Injury state and missed race logic in `Game.mustMissRace()` and `Game.recordMissedRace()`.
- Crash/injury generation in `src/engines/raceEngine.js`.
- Responsibility and approval checks in `src/systems/responsibility.js`.

Minimum v1 behavior:

- Age affects class, permissions, work options, school schedule, and race-bike requirements.
- Injuries can force missed races and create memories.
- Fatigue and burnout affect morale and race readiness.

## Multiple Career Endings

Career endings should summarize what the life became, not only championships.

Implemented hooks:

- `App.renderRetirement()`
- Career history in `Game.archiveSeason()`
- Memory top lists and season recap.

Minimum v1 endings:

- Retire after a completed season.
- Show seasons, points, wins, podiums, best finish, support level, and memories.
- Closing copy differs by wins/podiums and family mode.

Later scope:

- Multiple named ending archetypes, Hall of Fame, documentary export.

## Documentary Engine

The documentary engine begins as a curated recap over memories and career history.

Implemented hooks:

- `App.renderRecap()`
- `App.renderRetirement()`
- `MemoryEngine.top()`
- `CareerCalendar.timelineSummary()`

Minimum v1 behavior:

- Season recap shows the memories that stuck.
- Retirement view becomes the first documentary reel.
- Memories carry source, entities, participants, tags, tone, season, and age.

Later scope:

- Full documentary editing, sharing, generated chapters, and narration.

## Monetization Strategy

Monetization must be non-competitive.

Allowed:

- Cosmetics.
- Garage/museum presentation.
- Restore purchases.
- Rewarded ads only if age-appropriate, compliant, optional, and non-competitive.

Forbidden:

- Buying race wins.
- Buying rider stats.
- Buying better bikes or better parts.
- Buying injury immunity.
- Buying sponsor advantages.
- Buying Loretta qualification.
- Converting premium currency into competitive cash.

Implemented anchor:

- DD-0031 in `design/00_Legacy_Studios/Design_Decision_Log.md`.
- v1.0 monetization scope in `docs/roadmap/v1-scope-and-launch-plan.md`.
