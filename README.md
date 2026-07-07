# Legacy: Motocross

> **Create a life worth remembering.**

A **sports life-simulation RPG** prototype from Legacy Studios. This is not a
racing game — it's a game about *living* a motocross life: the late-night engine
rebuilds, the family sacrifices, the rivals, the first podium, and the memories
that outlast the results.

This repo contains **playable prototype v0.2**: a saveable, multi-season youth
motocross career that can start as early as age 4 on a 50cc and grow through
class progression, plus the full design bible
that defines the larger game.

**Studio motto:** Build memories, not mechanics.

---

## ▶️ Play it

It's a zero-dependency, mobile-first web app — no build step, no install.

```bash
# from the repo root
python3 -m http.server 8000
# then open http://localhost:8000 on your phone or browser
```

Or open `index.html` through any static web server (GitHub Pages works too).
It's designed **phone-first**: a one-hand column, sticky stat header, and a
bottom tab bar.

---

## What you do in a season

Each week you **plan**, **live a story beat**, and — on race weekends — **race
lap-by-lap**. Then the season ends in a **recap** that remembers what mattered.

- **Weekly Planner** — spend your week: practice, train, wrench on the bike,
  family time, school, rest, odd jobs for your own money, or browse the
  marketplace. Every choice trades off skill, money, bike wear, fatigue, and how
  the people in your life feel about you.
- **Bike condition & reliability** — the bike is an asset with history and wear.
  Neglect it and it fails you on the gate. Prep it (often alongside Dad) and it
  rewards you.
- **Marketplace** — buy tires, parts, a chest protector, a practice bike, even a
  collectible number plate from the local community. Buy outright or **make an
  offer** — sellers accept, counter, or walk.
- **Story beats** — believable life events (Dad's 2 A.M. engine rebuild, a
  rival's trash talk, Mom's worry about school, a shop sponsorship offer, an
  injury scare, money getting tight). The Story Engine asks *"given everything
  so far, what's the most believable thing that could happen next?"* — including
  quiet weeks, on purpose.
- **Lap-by-lap racing** — 4 local rounds + 1 regional qualifier, two motos each.
  Choose your line every lap (push / steady / attack / conserve). Starts,
  crashes, mechanicals, and late-race fatigue create the stories.
- **People, not NPCs** — Dad, Mom, Coach Mike, your rival Ethan, your friend
  Jesse, and the local shop. Their feelings are **hidden** and expressed only
  through how they talk to you.
- **Memories** — meaningful events are scored and saved, then resurface in the
  garage, the journal, and the season recap.

## 🎚️ Simulation Depth (choose your pace)

The same life, at the granularity **you** want (design decision DD-0020):

| Depth | You do… | Best for |
|---|---|---|
| **Detailed** | Plan every week, ride every lap. | Living one career, deeply. |
| **Key Moments** | The sim lives routine weeks; you handle the big decisions and the races. | Story beats without the busywork. |
| **Fast Sim** | The whole season auto-plays into a recap. | Running many lives to explore different choices. |

Every race can also be **ridden lap-by-lap or quick-simmed**, independent of depth.

## 🆕 Prototype v0.2 highlights

- **Save & continue** — the title screen detects local saves, autosaves at week
  boundaries, and preserves engine state so a career can be resumed reliably.
- **Growing-up timeline** — choose a birthday, see the rider age in a real
  calendar year, and move from 50cc through 65cc, 85cc, and Supermini classes.
- **Multi-season careers** — season recaps now lead into the next year, carrying
  forward relationships, garage history, memories, rivals, and bike keepsakes.
- **Facebook-style marketplace** — browse a two-column grid of local listings,
  inspect item detail pages, spot rare finds, buy outright, or make offers.
- **Competitive balance pass** — race fields scale around the rider's age and
  current ability so each class stays believable and playable.

---

## 🏗️ Architecture

Vanilla ES modules, event-bus driven, no framework. Each engine listens to the
bus and reacts, so one race result can ripple into memories, relationships,
gossip, and future opportunities without systems reaching into each other.

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
```

The design bible lives in [`design/`](./design) and is the source of truth. The
prototype implements its **First Prototype Target**. Key locked design decisions
(memories, object/place history, People-not-NPCs, the Career Support Ladder, the
Story Engine philosophy) are honored; new systems added during implementation
(the tech stack, and Simulation Depth) are logged in
[`design/00_Legacy_Studios/Design_Decision_Log.md`](./design/00_Legacy_Studios/Design_Decision_Log.md)
as required by the Design Bible.

## Scope of this prototype

This is still a focused youth-career slice, by design — the point is to prove
the *feel*, not the full commercial game. Rider-vs-Parent campaigns, the full
support ladder, world simulation at scale, property/lifestyle systems, and
adult/pro careers are specified in `design/` and are future work.

---

*Legacy Studios · Prototype v0.2 · We create interactive lives worth remembering.*
