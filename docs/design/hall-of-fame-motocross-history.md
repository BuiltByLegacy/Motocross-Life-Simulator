# Hall of Fame & Motocross History Architecture

Issues #138 and #158 establish one permanent legacy layer instead of separate trophy and lore screens.

## Design intent

The sport remembers more than championships. The history layer preserves who won, who changed the sport, which rivalries mattered, which tracks and teams defined an era, which records were set and later broken, and which personal objects became artifacts with provenance. The player is only one possible historical subject; AI riders, families, teams, manufacturers, tracks, mechanics, promoters, and regional scenes must be recordable by the same engine.

## Permanent history model

`src/systems/motocrossHistory.js` owns an append-oriented historical state with six connected views:

- **Events** — dated, significant facts with subject, region, team, manufacturer, venue, people, memory links, asset links and typed data.
- **Seasons** — immutable season snapshots containing champions, rivalries, teams, manufacturers, tracks and rule changes.
- **Record book** — current record holders plus a separate record-history chain so a broken record never erases the prior holder.
- **Career profiles** — career summaries for player or AI subjects, including results, titles, longevity, comebacks, influence, community impact and culturally significant memories/assets.
- **Hall of Fame** — permanent inductions with class year, legacy score, citation and frozen career snapshot.
- **Artifacts** — historical memorabilia imported with serial, provenance, ownership history, source event, display location and memory links intact.

History entries are deterministic/deduplicated when an ID is supplied and chronological when queried.

## Hall of Fame philosophy

Hall of Fame evaluation is multi-path. Championships matter, but a rider can also build historical weight through longevity, comebacks, historic firsts, iconic rivalries, fan/industry influence, sportsmanship, community contribution, mentorship, meaningful memories and significant artifacts. A thin unfinished career does not become Hall-worthy solely because of popularity.

The initial evaluation model uses four bounded dimensions:

1. **Competition** — championships, amateur national titles, regional titles, wins and podiums.
2. **Longevity** — seasons and major comebacks.
3. **Influence** — fan, industry, community and mentorship impact.
4. **Story/legacy** — historic firsts, rivalries, memory significance and memorabilia significance.

The score is a game-design signal, not a player-facing universal truth. Eligibility also requires an established career and a meaningful competitive or cultural peak. Future era/rulesets can change thresholds without rewriting old inductions because each induction stores the career snapshot and class year.

## Records

Records are keyed by a stable identifier such as `career-wins-450`, `youngest-regional-champion`, or `lap-red-clay`. Each record declares whether higher or lower is better. When broken, the previous current record is retained in `recordHistory`, and a `record-broken` history event is appended. This supports “who held it before?” and era-aware documentary recaps.

Records can be global, series, regional, class, track or career scoped through category/context fields. Ties do not silently replace an existing holder in v1; tie policy can be added per record later.

## Motocross History Engine coverage

The event model is intentionally generic enough to surface:

- legendary riders and families;
- historic bikes and memorabilia;
- famous tracks opening, changing or closing;
- iconic gear and factory parts;
- rivalries and comeback seasons;
- legendary mechanics, coaches and promoters;
- team formation/folding and manufacturer eras;
- championships, Loretta milestones, career firsts/lasts and records;
- Hall of Fame inductions;
- pro-race attendance memories and autograph provenance;
- rules and sport-evolution changes.

`historyTimeline`, `eraSummary`, and `subjectHistory` are presentation-ready query seams for a future Moto History phone app, garage museum, documentary recap, career profile and Hall of Fame UI.

## Memory, memorabilia and garage integration

`importCultureHistory` bridges the existing motocross culture system into permanent history. A pro-race memory becomes a historical event while signed jerseys, number plates, programs, photos or other memorabilia retain Asset IDs, serials, event provenance, ownership chain, display location and memory links. Hall citations can link directly back to the moments and objects that explain why the career mattered.

This intentionally avoids turning memorabilia into “just collection value.” An inexpensive program from a formative pro race may carry more historical significance than a high-value object with little personal meaning.

## World independence

No API hard-codes the player. `subjectId` and `kind` let the same system preserve AI rider careers and world events. `registerSeason` can advance historical champions, teams and regions even when the player did not attend or compete. The world can therefore develop a history that the player later discovers.

## Persistence and presentation

History is serialized/restored as ordinary game state. Historical events are append-oriented; current records and Hall entries are derived presentation anchors, while prior record holders and induction snapshots remain permanent. No raw score must be exposed in UI. Player-facing language should emphasize stories, eras, plaques, records, photos, artifacts and remembered moments.

## Follow-on UI seams

A future UI wave can add a **Moto History** phone app with timeline/era/rider/record/Hall tabs, Hall plaques and career biographies, “record just broken” news, garage museum artifact drill-down, and documentary links. That UI should consume these query APIs rather than create a second historical data model.

## Proof requirements covered

The automated tests prove player/AI career aggregation, chronological history, deduplication, record replacement with prior-holder preservation, lower-is-better records, multi-dimensional Hall eligibility, duplicate-induction protection, AI season history, culture/memorabilia provenance import, era summaries, subject biographies, and save/load persistence.
