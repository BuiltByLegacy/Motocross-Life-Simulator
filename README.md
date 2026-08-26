# Motocross: Chasing the Dream

> **Every rider has a story. Chase yours.**

A **sports life-simulation RPG** prototype from Legacy Studios. This is not a
racing game — it's a game about chasing a dream and *living* a motocross life:
the late-night engine rebuilds, the family sacrifices, the rivals, the first
podium, and the memories that outlast the results.

**Play the current web build:**  
https://builtbylegacy.github.io/Motocross-Life-Simulator/

This repo contains **playable prototype v0.2**: a saveable, multi-season youth
motocross career that can start as early as age 4 on a 50cc and grow through
class progression, plus the full design bible that defines the larger game.

**Studio motto:** Build memories, not mechanics.

**Studio mission:** Creating interactive lives worth remembering.

---

## ▶️ Play it

### Live build

**https://builtbylegacy.github.io/Motocross-Life-Simulator/**

### Run locally

It's a zero-dependency, mobile-first web app — no build step, no install.

```bash
# from the repo root
python3 -m http.server 8000
# then open http://localhost:8000 on your phone or browser
```

Or open `index.html` through any static web server. It's designed **phone-first**:
a one-hand column, sticky stat header, and bottom tab bar.

---

## Current development status

The project is being developed as a sequence of tested career-world vertical slices rather than a shallow nationwide content dump.

- **Northeast reference world:** complete multi-season proof, including regional calendar, travel, weather, local championships, recurring rivals, track familiarity, local reputation, off-weekend life, event economics, dealer/team relationships, sponsorship, media/community recognition, and persistent world reactions.
- **Loretta's path:** modeled as Area Qualifier → same-region Regional Championship → National, with qualification failure remaining a valid career outcome.
- **Bike/Garage lifecycle:** exclusive component slots, install/remove/replace behavior, garage inventory, class-transition bike acquisition, and parent-managed procurement for young riders.
- **Region #2 — Southeast:** research-gated before implementation. Future regions are intentionally **not** copies of the Northeast with different track names.

See [`MASTER_ROADMAP.md`](./MASTER_ROADMAP.md) for release sequencing and [`docs/REGIONAL_IDENTITY_FRAMEWORK.md`](./docs/REGIONAL_IDENTITY_FRAMEWORK.md) for the regional architecture rules.

---

## What you do in a season

You build a real program rather than following a fixed ladder. Choose which events to attend, balance local and regional goals, manage travel and money, maintain the bike, practice when it makes sense, and live with the consequences of those decisions.

- **Month-based career calendar & season planner** — choose events based on eligibility, geography, travel burden, family constraints, regional seasonality, and goals. Commit the plan, advance time, race, edit when allowed, and finish the season without dead-end states.
- **Bike condition & reliability** — the bike is an asset with history and wear. Components occupy real slots, upgrades replace old parts instead of stacking indefinitely, and removed parts return to the garage.
- **Garage & marketplace** — own bikes and parts, buy from dealers or the used marketplace, sell garage inventory, negotiate, manage fitment, and gradually take over decisions from parents as the rider grows older.
- **Regional motocross world** — tracks, travel, weather, race density, promoters, costs, rivals, reputation, dealers, teams, sponsorships, and media evolve around where the rider actually lives and races.
- **Road to Loretta's** — Area Qualifiers feed same-region Regionals; only qualifying Regional finishes can reach the National. Riders can be dominant in one bike class and fail to qualify after moving up in another.
- **Story beats** — believable life events react to the rider's real history, family situation, money, results, relationships, and regional world state.
- **Lap-by-lap or quick-sim racing** — race directly when you want the moment-to-moment decisions, or quick-sim when you want career pace.
- **People, not NPCs** — parents, coaches, rivals, friends, dealers, teams, sponsors, promoters, announcers, and community figures build persistent history with the rider.
- **Memories** — meaningful events are scored and saved, then resurface in the garage, journal, season recap, relationships, and future world reactions.

## 🎚️ Simulation Depth (choose your pace)

The same life, at the granularity **you** want (design decision DD-0020):

| Depth | You do… | Best for |
|---|---|---|
| **Detailed** | Plan every week, ride every lap. | Living one career, deeply. |
| **Key Moments** | The sim lives routine weeks; you handle the big decisions and the races. | Story beats without the busywork. |
| **Fast Sim** | The whole season auto-plays into a recap. | Running many lives to explore different choices. |

Every race can also be **ridden lap-by-lap or quick-simmed**, independent of depth.

## 🆕 Prototype v0.2 highlights

- **Save & continue** — the title screen detects local saves, autosaves at week boundaries, and preserves engine state so a career can be resumed reliably.
- **Growing-up timeline** — choose a birthday, see the rider age in a real calendar year, and move from 50cc through 65cc, 85cc, and Supermini classes.
- **Multi-season careers** — season recaps lead into the next year, carrying forward relationships, garage history, memories, rivals, reputation, and bike keepsakes.
- **Living regional world foundation** — the Northeast now acts as the deeply modeled reference region, while additional regions require their own research-backed identity before development.
- **Facebook-style marketplace** — browse local listings, inspect item detail pages, spot rare finds, buy outright, or make offers.
- **Competitive balance pass** — race fields scale around the rider's age and current ability so each class stays believable and playable.

---

## 🏗️ Architecture

Vanilla ES modules, event-bus driven, no framework. Each engine listens to the
bus and reacts, so one race result can ripple into memories, relationships,
gossip, reputation, support opportunities, and future decisions without systems
reaching directly into each other.

```
index.html · styles.css
src/
  main.js                 app bootstrap
  ui.js                   all rendering + the weekly-flow driver (mobile-first)
  game.js                 orchestrator, helper API, weekly loop, Simulation Depth
  core/
    eventBus.js           pub/sub hub
    rng.js                seeded RNG (reproducible seasons)
    state.js              serializable game state
  data/
    content.js            People, calendar, activities, marketplace, story cards
  engines/
    memoryEngine.js       importance scoring + memory storage
    relationshipEngine.js hidden values -> behavior lines + arcs
    worldEngine.js        simulated field of rivals + news/gossip
    storyEngine.js        "most believable next thing" scenario selection
    opportunityEngine.js  doors that open/close from results & reputation
    marketplaceEngine.js  listings, buy/negotiate, asset install
    raceEngine.js         steppable lap-by-lap simulation
  systems/
    regionalProfiles.js   research-backed regional identity contract + profiles
```

The master roadmap lives in [`MASTER_ROADMAP.md`](./MASTER_ROADMAP.md) and defines the App Store v1.0 cutline, version roadmap, launch readiness checklist, and release-horizon categories for future work.

The design bible lives in [`design/`](./design) and is the source of truth. The
prototype implements its **First Prototype Target**. Key locked design decisions
(memories, object/place history, People-not-NPCs, the Career Support Ladder, the
Story Engine philosophy) are honored; new systems added during implementation
are logged in
[`design/00_Legacy_Studios/Design_Decision_Log.md`](./design/00_Legacy_Studios/Design_Decision_Log.md)
as required by the Design Bible.

## Scope of this prototype

This is still a focused youth-career slice, by design — the point is to prove
the *feel*, not the full commercial game. Rider-vs-Parent campaigns, the full
support ladder, world simulation at scale, property/lifestyle systems, adult/pro
careers, and additional researched regions remain future work.

---

*Legacy Studios · Prototype v0.2 · Creating interactive lives worth remembering.*
