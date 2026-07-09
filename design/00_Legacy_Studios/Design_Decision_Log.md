# Design Decision Log

This log captures decisions made during planning so the reasoning is not lost.

## DD-0001 - Information Visibility
**Decision:** Child players only know what children would realistically know.  
**Reason:** Reinforces immersion and the growing-up philosophy.  
**Status:** Locked

## DD-0002 - Meaningful Events Become Memories
**Decision:** Every meaningful event becomes a memory.  
**Reason:** Memories drive dialogue, relationships, recaps, documentary, garage objects, and future opportunities.  
**Status:** Locked

## DD-0003 - Object Memories
**Decision:** Objects remember their history.  
**Reason:** Bikes, helmets, trophies, tools, and trailers become emotionally meaningful instead of disposable inventory.  
**Status:** Locked

## DD-0004 - Place Memories
**Decision:** Places remember their history.  
**Reason:** Garages, tracks, training facilities, and family spots become part of the player's life story.  
**Status:** Locked

## DD-0005 - Garage Ownership
**Decision:** Parents own the garage/shop until adulthood. Ownership and responsibility transfer naturally over time.  
**Reason:** Supports the progression from childhood dependence to adult independence.  
**Status:** Locked

## DD-0006 - Factory Parts
**Decision:** Factory parts are best-in-class and good across performance categories, but require expert setup to reach their full potential.  
**Reason:** Keeps factory equipment aspirational while rewarding knowledge, mechanics, and team support.  
**Status:** Locked

## DD-0007 - Garage as Home
**Decision:** The garage is the player's home, workshop, museum, storage space, and social hub, not a static menu.  
**Reason:** The garage is the soul of the game and should visually tell the player's story.  
**Status:** Locked

## DD-0008 - Unique Careers
**Decision:** Every career should tell a unique story.  
**Reason:** Replayability comes from different lives, not simply different builds.  
**Status:** Locked

## DD-0009 - Living World
**Decision:** The world evolves independently of the player.  
**Reason:** The player should feel like they live in a motocross community, not a world built only around them.  
**Status:** Locked

## DD-0010 - Stories Over Statistics
**Decision:** The game should create stories, not just statistics.  
**Reason:** Long-term player attachment comes from memories, relationships, and meaningful events.  
**Status:** Locked

## DD-0011 - Asset Identity
**Decision:** Every important physical object has an Asset ID, serial number, ownership history, provenance, and memory history.  
**Reason:** Supports marketplace, collecting, resale, heirlooms, and object memories.  
**Status:** Locked

## DD-0012 - Separate Campaigns
**Decision:** Rider Mode and Parent Mode are separate campaigns.  
**Reason:** Each role has a different information set, emotional lens, UI, and responsibilities.  
**Status:** Locked

## DD-0013 - Consistent Career Pace
**Decision:** Childhood seasons do not progress faster than teenage or pro seasons.  
**Reason:** Childhood is emotionally important and should not be treated as a short tutorial.  
**Status:** Locked

## DD-0014 - Career Support Ladder
**Decision:** Career progression includes realistic support tiers: Family Supported -> Local Shop Rider -> Dealer Supported -> Manufacturer Amateur Team -> Factory Amateur -> Professional Privateer -> Factory Professional.  
**Reason:** Real motocross support is not simply local vs factory.  
**Status:** Locked

## DD-0015 - Lifestyle as Strategy
**Decision:** Lifestyle choices such as house, camper, training facility, backyard track, and private facility are strategic life decisions, not cosmetic choices.  
**Reason:** Where and how a family lives changes training, money, stress, relationships, and opportunities.  
**Status:** Locked

## DD-0016 - No NPC Language
**Decision:** Internally, avoid calling characters NPCs. Use People.  
**Reason:** Reinforces the philosophy that every character has goals, memories, relationships, and life outside the player.  
**Status:** Proposed

## DD-0019 - Responsibility Is Earned Through Age and Trust
**Decision:** Rider actions, information, money access, phone access, marketplace access, travel, race registration, sponsor communication, and independence are based on age first, then modified by trust, responsibility, grades, injuries, family stress, family finances, and past behavior.  
**Reason:** Youth motocross depends on parents and earned trust. A young rider should not see or control adult logistics, while older riders should feel the pressure and freedom of growing up.  
**Consequences:** Phone, marketplace, jobs, travel, race planning, purchases, contracts, and UI visibility must ask the responsibility system before exposing direct control. Parent Mode can see full adult context; Rider Mode uses age-appropriate framing.  
**Status:** Locked

## DD-0029 - Seasons Must Transition From Planning to Commitment
**Decision:** Players can draft and adjust a season calendar, but must review, approve, and lock the season before active gameplay. Once locked, the player progresses through time, deadlines, travel, race weekends, registration consequences, and cancellation rules.  
**Reason:** The calendar is not a passive list. Planning is reversible; commitment creates costs, deadlines, family expectations, and race-weekend obligations.  
**Consequences:** Draft changes stay low-friction. Locked changes require refund, cancellation, approval, or rescheduling rules. Race weekends are entered through readiness checks and an explicit lifecycle state, not an ambiguous calendar click.  
**Status:** Locked

## DD-0031 - Paid Purchases Cannot Improve Competitive Outcomes
**Decision:** Legacy Coins, memberships, rewarded ads, cosmetics, collections, or any paid purchase cannot buy race wins, rider stats, better bikes, better parts, Loretta qualification, injury immunity, sponsor advantages, or hidden simulation advantages.  
**Reason:** Monetization must support the game without undermining authenticity, fairness, or the emotional value of earned progress.  
**Consequences:** Launch monetization is limited to cosmetic/non-competitive presentation and compliant purchase restoration. Competitive economy remains cash, effort, relationships, and time.  
**Status:** Locked

## DD-0035 - Version 1.0 Must Prove the Core Loop Before the Full Vision
**Decision:** Version 1.0 focuses on a polished, playable, replayable core career loop. Large systems already planned in GitHub issues remain valid roadmap work, but they do not block launch unless required for the core loop.  
**Reason:** The project needs a launchable target before the full life-sim vision expands. Core-loop quality comes before scope breadth.  
**Consequences:** v1.0 prioritizes onboarding, season planning, race entry, race simulation, garage, marketplace/dealer basics, money, memories, save/load, settings, compliance, and release readiness. Friends, era selection, deep documentary tools, full pro career, deep world simulation, and advanced monetization are later roadmap work.  
**Status:** Locked

## DD-0017 - Story Engine Philosophy
**Decision:** The Story Engine should not ask, "What happens next?" It should ask, "Given everything that has happened so far, what is the most believable thing that could happen next?"  
**Reason:** Separates life simulation from scripted career mode.  
**Status:** Locked

## DD-0018 - Multiplayer Direction
**Decision:** Multiplayer should be asynchronous and story-sharing focused, not synchronous MMO-style career progression.  
**Reason:** Players progress at different speeds, and the core experience depends on personal pacing.  
**Status:** Proposed

## DD-0019 - Prototype Technology Stack
**Decision:** The v0.1 playable prototype is built as a zero-dependency, browser-based simulation in vanilla HTML/CSS/ES modules. No build step, no framework, no install — it runs from a static host or a local `python3 -m http.server`.  
**Reason:** The first prototype's job is to prove the *feel* (memories, family pressure, marketplace, race consequences, recap), not the rendering tech. Vanilla ES modules keep the engine architecture (event bus, Memory/Relationship/World/Story/Opportunity engines) clean and readable, run anywhere, and are trivial to share for playtesting. Engine choice for a full game (e.g. Godot/Unity) remains an open technical decision.  
**Status:** Proposed

## DD-0020 - Simulation Depth Levels
**Decision:** The game supports selectable **Simulation Depth**, so the same life can be experienced at different granularities:
- **Detailed** — plan every week and ride every lap. For players who want to live one career for years.
- **Key Moments** — routine weeks are auto-lived by the sim (sensible activity choices, low-importance events auto-resolved); the game only pauses for high-importance decisions and races. For players who want the story beats without the busywork.
- **Fast Sim** — the whole span auto-plays and returns a digest + recap. For players who want to run many careers to explore different lives and decisions.

In addition, a **Skip Ahead** control (skip to next race / auto-sim N weeks) is available during play regardless of depth, and each race can be **ridden lap-by-lap or auto-simmed**. Importance thresholds (from the Memory Engine's importance score) decide what a given depth pauses for.  
**Reason:** Player intent varies widely — "just work through the important decisions," "skip five years," "decide everything myself," "one career for a decade," "thirty careers to explore choices." Pacing should be a player-owned dial, not a fixed cadence, without changing the underlying simulation. Reuses the existing importance score rather than inventing a parallel system.  
**Status:** Proposed
