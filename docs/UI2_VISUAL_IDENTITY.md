# UI 2.0 Visual Identity — Kill the Dashboard

Issue: #362  
Applies to: #358, #359, #360 and every later UI 2.0 screen migration.

## North Star

**World first. UI second.**

Legacy: Motocross should feel like a motocross life the player inhabits, not a dark SaaS dashboard with motocross nouns.

The world should communicate progression through places, bikes, gear, people, race flyers, calendars, photographs, trophies, notes, sponsor objects and memorabilia. Interface chrome exists to make the world understandable and actionable; it is not the composition itself.

## Place-based destinations

- **Home — Garage:** bike, gear, workbench, family context, current life state, upcoming event and memories.
- **Calendar — Season board:** dates, home weeks, training, school/family commitments, race weekends, qualifiers and travel.
- **Career — Record book / scrapbook:** results, championships, milestones, sponsors, rivalries and historical significance.
- **World — Motocross ecosystem:** map, tracks, regions, shops, people, media, events and history.
- **More — Utilities:** secondary systems that do not deserve permanent visual competition with the rider's life.

## Composition rules

On a common phone viewport, prioritize in this order:

1. Rider identity and current life context.
2. A strong place/world hero.
3. One meaningful next action or upcoming event.
4. Urgent attention only when something genuinely needs attention.
5. Primary navigation.

Secondary statistics and management detail belong below the fold, behind contextual objects, or inside focused flows.

## Contextual HUD

Do not permanently reserve large stat cards for age, confidence, fatigue, bike condition and similar values.

The persistent glance layer should be compact: rider identity/number/class, date and current life state/location, money when decision-relevant, and urgent attention. Confidence, fatigue, maintenance, school/family and sponsor compliance surface when they change the player's decision.

## Environmental progression

The garage should become a visual career record driven by persisted state:

- **Early childhood:** one small bike, family-supported gear, simple tools and family photos.
- **Developing amateur:** additional bikes/parts, trophies, race posters, training notes and memorabilia.
- **Supported rider:** sponsor products/banners, stronger equipment and visible team relationships.
- **Elite/pro:** professional shop/trailer/facility, major trophies, historic bikes and significant artifacts.

Do not fake progression with decorative objects that contradict the save. Use bike, asset, memory, sponsor and history systems where data exists; use restrained neutral scenery where it does not.

## Visual language

- Strong motorsport/editorial hierarchy rather than generic dashboard typography.
- Garage steel, dirt, paper schedules, race flyers, number plates, workbench surfaces and paddock signage may influence presentation while preserving readability.
- Race weekends, qualifiers, wins and major memories earn substantially more visual weight than routine weeks.
- Motocross/environmental imagery is preferred where suitable assets exist.
- Use a coherent icon system. Emoji may remain as temporary legacy fallback but must not become the visual brand.
- Orange is an accent/action/race signal, not a border applied to every container.

## Explicit anti-patterns

Do not use these as the default composition:

- dashboard stat-bar grids;
- walls of repeated rounded cards;
- excessive pills/chips;
- emoji as primary iconography;
- large instructional paragraphs explaining obvious game behavior;
- equal visual weight for every metric;
- persistent values with no current decision relevance;
- generic premium-dark styling with no motocross context.

Cards, panels and chips remain valid tools when a real interaction requires them. They are not the identity.

## Interaction rule

Objects should increasingly become navigation. A bike opens bike/maintenance/history context. A race flyer opens the event. A trophy or photo opens the memory/career record. A calendar object opens planning. A sponsor object opens obligations. The player should feel like they are interacting with their motocross life rather than choosing database tables.

## Migration contract

The responsive shell and navigation engineering from #356/#357 remains valid. UI 2.0 primitives are tools, not mandatory screen composition. New screens may coexist with legacy renderers while migrating, but each migrated destination must move toward this document rather than simply reskinning legacy cards.

The Garage/Home implementation in #358 is the first production reference screen for this identity.