# Living Garage System Issue Drafts

Documentation-only GitHub issue drafts for the **Living Garage System** in **Motocross: Chasing the Dream** by Legacy Studios. These drafts are intentionally self-contained so they can be copied into GitHub issues later without calling the GitHub API or implementing gameplay. They reframe the garage from an abstract inventory menu into the player's living home hub, workshop, storage space, museum, and physical interface for the game.

## Draft Index

1. Design Living Garage System
2. Design Physical Garage Inventory Layout
3. Design Bike Display and Interaction System
4. Design Parts Shelf and Component Storage System
5. Design Garage Clutter and Capacity System
6. Design Garage Upgrade and Expansion System
7. Design Garage Museum and Memory Display
8. Design Family and Social Interactions in Garage
9. Design Garage Arrival Flow for Purchased Items
10. Design Garage UI Navigation
11. Design Garage Visual States Over Time
12. Design Garage Persistence and Save Data
13. Define Minimum Living Garage for v1.0
14. Update Design Decision Log

---

# Issue: Design Living Garage System

## What
Design the garage as the main living hub of **Motocross: Chasing the Dream** — the home screen and physical interface players return to between every scenario, race, and season.

The garage should bring together:

- Garage as the home screen and default return point.
- Bikes visually displayed on the floor and on stands.
- Parts physically stored on shelves and racks.
- Gear hanging on the walls.
- Tools laid out on a workbench.
- Trophies and memories displayed on shelves and walls.
- Family members appearing and acting in the garage.
- Phone access from within the garage.
- Bike work (build/repair/setup) starting from the garage.
- Marketplace and dealer purchases arriving into the garage.

## Why
The garage is where a motocross life actually happens between the gate drops. Making it a living space — not a menu — reinforces the studio principles "build memories, not mechanics" and "everything has history." A player should feel they have a *place*, one that fills with bikes, parts, trophies, and family moments as the career grows. Menus should feel like tools and rooms in the world, not abstract lists.

## How
Create a parent design specification that ties together the child systems in this epic:

- Define the garage as the app home screen and the hub all other flows launch from (phone, calendar, bike builder, marketplace deliveries, travel to race/practice).
- Map the major zones of the garage: bike floor, parts shelving, gear wall, workbench/tools, trophy/memory display, delivery area, and garage door.
- Specify how each zone links to an existing system (bike builder, marketplace/dealer, memory engine, relationships, calendar).
- Define how the garage reflects state: bike condition, clutter, upgrades, career stage, family presence.
- Establish the visual/interaction language (tap zones, inspect items) shared by the child issues.
- Identify data dependencies on bikes, parts, assets/provenance, memories, relationships, calendar, and marketplace/dealer systems.
- Clarify non-goals: this is a design spec, not an implementation, and it does not require a full 3D walkaround for v1.0.

## Definition of Done
- [ ] The garage is defined as the app home hub and default return point.
- [ ] All major garage zones and their linked systems are documented.
- [ ] The relationship between the garage and phone, calendar, bike builder, marketplace, and travel is specified.
- [ ] Dependencies on bikes, parts, assets, memory, relationships, and calendar systems are listed.
- [ ] Child issues in this epic are referenced as the breakdown of this parent design.
- [ ] Non-goals exclude full 3D and implementation work.

## Related Epic
Living Garage System

## Labels
type: design, area: garage, area: ui, area: memory, priority: p0-critical

---

# Issue: Design Physical Garage Inventory Layout

## What
Design a physical storage layout for the garage so inventory is represented as real objects on shelves, racks, and hooks rather than as an abstract list.

Storage surfaces and containers to define:

- Shelves
- Bins
- Wall hooks
- Toolboxes
- Parts racks
- Tire racks
- Gear rack
- Bike stands
- Display cases
- Trophy shelves
- Storage capacity per surface
- Overflow / clutter states

Items should be visible or physically represented when stored.

## Why
"Everything has history." A cracked number plate on a shelf, a stack of worn tires, a gear bag on a hook — these carry more meaning than a menu row. Physical storage makes ownership tangible, supports object memories, and grounds the clutter/capacity and museum systems.

## How
Create a design specification that covers:

- Define each storage surface/container, what item categories it holds, and its visual representation.
- Define per-surface capacity and how capacity aggregates into overall garage space.
- Specify how stored items map to physical slots (e.g., tires on a tire rack, gear on the gear rack, small parts in bins).
- Define overflow behavior when a surface is full: spillover to the floor, clutter state, or blocked storage.
- Specify how items appear/disappear as they are installed, removed, delivered, or sold.
- Map dependencies to the assets/provenance system, marketplace/dealer arrivals, bike builder installs, and the clutter/capacity system.
- Provide wireframe-level content blocks for compact (list-backed) and expanded (physical) storage views for phone-sized UI.

## Definition of Done
- [ ] Every storage surface/container and the item categories it holds are documented.
- [ ] Per-surface and overall capacity rules are defined.
- [ ] Item-to-slot mapping and physical representation are specified.
- [ ] Overflow and clutter states are defined.
- [ ] Data dependencies (assets, marketplace/dealer, bike builder, clutter system) are listed.
- [ ] Compact and expanded view content blocks are described for phone-sized UI.

## Related Epic
Living Garage System

## Labels
type: design, area: garage, area: inventory, area: assets, priority: p0-critical

---

# Issue: Design Bike Display and Interaction System

## What
Design how bikes are viewed and interacted with inside the garage.

Bike states and roles to represent:

- Current race bike
- Practice bike
- Spare bike
- Old bikes
- Sibling / parent bikes
- Bikes on stands
- Bikes in storage
- Retired bikes on display
- Bike condition visual states

Interactions to define:

- Click/tap a bike to inspect it.
- Open the bike builder from a selected bike.
- Show the memories tied to each bike.

## Why
Bikes are the emotional center of the garage and carry the deepest object memories (first bike, first win plate, an outgrown machine kept forever). Letting players see and touch each bike — and jump straight into working on it — makes the garage the natural home of the bike-ownership and bike-builder systems.

## How
Create a design specification that covers:

- Define floor/stand/storage positions for bikes by role (race, practice, spare, retired, family-owned).
- Specify condition visual states (clean, worn, damaged, freshly built) driven by bike condition/reliability and part wear.
- Define the inspect flow: tapping a bike opens a bike detail view with stats, installed parts, provenance, and linked memories.
- Define the entry point from a selected bike into the bike builder for install/remove/setup.
- Specify how retired/display bikes surface their history and season context.
- Map dependencies to bike ownership, bike builder, assets/provenance, part wear, and the memory engine.
- Provide content blocks for compact bike rows and an expanded bike detail card.

## Definition of Done
- [ ] Bike roles, positions, and storage/display states are documented.
- [ ] Condition visual states and their data drivers are defined.
- [ ] The tap-to-inspect flow and bike detail contents are specified.
- [ ] The bike-builder entry point from a selected bike is defined.
- [ ] Per-bike memory display is specified.
- [ ] Dependencies (bike ownership, bike builder, assets, wear, memory) are listed.

## Related Epic
Living Garage System

## Labels
type: design, area: garage, area: bike-builder, area: assets, priority: p0-critical

---

# Issue: Design Parts Shelf and Component Storage System

## What
Design how parts are physically displayed and stored in the garage.

Part categories to represent:

- Exhausts
- Suspension
- Wheels
- Tires
- Handlebars
- Controls
- Brakes
- Clutch parts
- Chains / sprockets
- Air filters
- Oils / fluids
- Plastics
- Graphics
- Engines / top ends
- Tools

Rules to define:

- Removed parts go to shelf/bin storage.
- New parts arrive in boxes.
- Installed parts leave inventory (they live on the bike).
- Sold parts disappear from the garage.
- Rare / factory parts can be displayed.
- Worn parts can become keepsakes.

## Why
Parts are the connective tissue between the marketplace, dealer, bike builder, and memory systems. Showing them physically — a shelf of spares, a boxed OEM order, a rare factory shock on display — makes upgrades tangible and gives worn or special parts a path into object memories.

## How
Create a design specification that covers:

- Define which shelf/rack/bin holds each part category and its physical representation.
- Specify part lifecycle in the garage: box (delivered) → shelf/bin (stored) → installed (on bike) → removed (back to storage) → sold (gone) or keepsake (museum).
- Define rare/factory part display eligibility and where such parts appear.
- Define how worn parts can be converted into keepsakes and linked to memories.
- Specify condition/quality indicators for stored parts.
- Map dependencies to the parts catalog, compatibility, marketplace/dealer arrivals, bike builder, assets/provenance, and museum systems.
- Provide content blocks for a parts shelf view (grouped by category) and a part detail view.

## Definition of Done
- [ ] Every part category and its storage surface/representation is documented.
- [ ] The full part lifecycle (box → stored → installed → removed → sold/keepsake) is defined.
- [ ] Rare/factory display and worn-part keepsake rules are specified.
- [ ] Condition/quality indicators for stored parts are defined.
- [ ] Dependencies (parts catalog, compatibility, marketplace/dealer, bike builder, assets, museum) are listed.
- [ ] Parts shelf and part detail view content blocks are described.

## Related Epic
Living Garage System

## Labels
type: design, area: garage, area: assets, area: marketplace, priority: p0-critical

---

# Issue: Design Garage Clutter and Capacity System

## What
Design garage space management so the garage has finite room and fills up over a career.

Include:

- Limited overall space.
- Bikes take floor space.
- Tires / parts take shelf space.
- Tools take cabinet / workbench space.
- Memorabilia takes display space.
- Overflow creates clutter.
- Clutter affects usability and family stress.
- Upgrades increase capacity.
- Selling / organizing reduces clutter.

## Why
Scarcity creates decisions. A garage that can hold everything forever has no tension; a garage that fills with bikes, tires, and boxes forces real choices about what to keep, sell, or display. Clutter ties the garage to the family stress and economy systems and makes upgrades meaningful.

## How
Create a design specification that covers:

- Define capacity pools by space type: floor (bikes), shelf (parts/tires), cabinet/workbench (tools), and display (memorabilia).
- Specify how each item type consumes its pool and how totals are computed.
- Define clutter thresholds and their effects on usability (harder to find/work) and family stress.
- Specify how garage upgrades raise capacity per pool.
- Define how selling, installing, or organizing items reduces clutter.
- Map dependencies to physical inventory layout, upgrades, marketplace, family stress, and persistence systems.
- Provide clear player-facing feedback for near-full and overflow states.

## Definition of Done
- [ ] Capacity pools by space type and their consumption rules are documented.
- [ ] Clutter thresholds and their usability/stress effects are defined.
- [ ] Upgrade-driven capacity increases are specified.
- [ ] Clutter-reduction actions (sell/install/organize) are defined.
- [ ] Dependencies (inventory layout, upgrades, marketplace, family stress, persistence) are listed.
- [ ] Near-full and overflow player feedback is described.

## Related Epic
Living Garage System

## Labels
type: design, area: garage, area: property, area: inventory, priority: p1-high

---

# Issue: Design Garage Upgrade and Expansion System

## What
Design upgrades and expansions for the garage/shop.

Upgrades to define:

- Shelving
- Workbench
- Better lighting
- Tool chest
- Air compressor
- Tire machine
- Bike lift
- Wash bay
- Parts washer
- Suspension bench
- Engine stand
- Extra bay
- Detached shop
- Race shop

Each upgrade should affect some of:

- Storage capacity
- Repair capability
- Install ability
- Work time
- Family stress
- Visual appearance
- Family budget

## Why
Upgrades turn the garage into a progression space that mirrors the rider's rising commitment and support level — from a corner of the family garage to a real race shop. They connect the economy, mechanics/maintenance, clutter/capacity, and visual-state systems, and give money a meaningful home-improvement sink.

## How
Create a design specification that covers:

- Define each upgrade, its cost, prerequisites, and the effects it grants (capacity, repair/install capability, work-time reduction, stress change, appearance).
- Specify upgrade tiers/progression (basic shelving → tool chest → benches/lifts → extra bay → detached/race shop).
- Define how upgrades interact with clutter/capacity and mechanics/maintenance capability.
- Specify how upgrades change the garage's visual state and career-stage appearance.
- Define budget/affordability gating and family reactions to big investments.
- Map dependencies to the economy, mechanics/maintenance, clutter/capacity, visual states, and persistence systems.

## Definition of Done
- [ ] Every upgrade, its cost, prerequisites, and effects are documented.
- [ ] Upgrade tiers/progression are defined.
- [ ] Interactions with clutter/capacity and repair/install capability are specified.
- [ ] Visual-appearance effects of upgrades are defined.
- [ ] Budget gating and family reactions are described.
- [ ] Dependencies (economy, mechanics, clutter, visual states, persistence) are listed.

## Related Epic
Living Garage System

## Labels
type: design, area: garage, area: property, area: economy, priority: p1-high

---

# Issue: Design Garage Museum and Memory Display

## What
Design the garage as a memory museum that displays meaningful objects from the rider's life.

Items to display:

- First helmet
- First trophy
- Loretta number plate
- Broken parts
- Old jerseys
- Signed memorabilia
- Photos
- Newspaper clippings
- Favorite bikes
- Dad's toolbox
- Championship items

Each displayed item should connect to:

- Object memory
- Person memory
- Place memory
- Season recap
- Documentary

## Why
"Build memories, not mechanics" and "leave a legacy." The museum is where a career becomes visible as a story you can walk through. Displayed objects give memories a physical anchor and feed directly into season recaps and the documentary/legacy systems.

## How
Create a design specification that covers:

- Define displayable object types and where each appears (trophy shelf, wall, display case, workbench).
- Specify how a displayed object links to its memory records (object/person/place) and to season recaps and documentaries.
- Define how objects become displayable (earned, kept as keepsakes, inherited, gifted).
- Specify display curation: what shows automatically vs. what the player arranges, and display-space limits (ties to clutter/capacity).
- Define how the museum grows and reorganizes across career stages and after retirement.
- Map dependencies to the memory engine, assets/provenance, documentary/legacy recap, and clutter/capacity systems.
- Provide content blocks for a museum/display view and an object detail view with its linked story.

## Definition of Done
- [ ] Displayable object types and their display locations are documented.
- [ ] Links from displayed objects to object/person/place memories, recaps, and documentaries are specified.
- [ ] Rules for how objects become displayable are defined.
- [ ] Curation and display-space limits are specified.
- [ ] Museum growth across career stages and retirement is described.
- [ ] Dependencies (memory, assets, documentary, clutter) are listed.

## Related Epic
Living Garage System

## Labels
type: design, area: garage, area: memory, area: documentary, priority: p0-critical

---

# Issue: Design Family and Social Interactions in Garage

## What
Design how people appear and interact in the garage.

People to represent:

- Dad working on a bike
- Mom checking the schedule
- Sibling hanging around
- Friend visiting
- Rival visiting
- Coach stopping by
- Mechanic helping
- Sponsor / dealer contact delivering parts

Interaction likelihood and tone should depend on:

- Relationship values
- Rider age
- Story state
- Upcoming event
- Bike condition
- Family stress
- Memories

## Why
"People before players" and "respect the family." The garage is where relationships play out day to day — Dad wrenching late, Mom worrying over the calendar, a rival dropping by. Populating the garage with people turns a workshop into a home and creates natural hooks for relationship and memory moments.

## How
Create a design specification that covers:

- Define who can appear, what they do, and where they stand/work in the garage.
- Specify the conditions that drive each appearance (relationship, age, story state, upcoming event, bike condition, stress, recent memories).
- Define interaction outcomes: help with the bike, schedule pressure, encouragement, conflict, delivery, memory creation.
- Specify frequency/cadence and how the garage stays alive without becoming noisy.
- Define privacy/age-appropriate behavior (parent-mode vs rider-mode presence).
- Map dependencies to the relationship engine, family/stress systems, calendar, bike condition, and memory engine.
- Provide in-world copy examples for common garage encounters.

## Definition of Done
- [ ] Each person, their garage activity, and location are documented.
- [ ] Conditions that trigger appearances and interactions are specified.
- [ ] Interaction outcomes (help, pressure, conflict, delivery, memory) are defined.
- [ ] Frequency/cadence guidance is included.
- [ ] Dependencies (relationships, family/stress, calendar, bike condition, memory) are listed.
- [ ] Example encounter copy is provided.

## Related Epic
Living Garage System

## Labels
type: design, area: garage, area: relationship, area: family, priority: p1-high

---

# Issue: Design Garage Arrival Flow for Purchased Items

## What
Design how purchased marketplace and dealer items appear in the garage.

Include:

- Delivered boxes
- Pickup items
- Parts landing on the shelf
- Bikes unloaded from a trailer / truck
- Shipping delays
- Wrong part arrival
- Damaged shipment
- Parent reaction to expensive purchases
- Memory hooks for important purchases

## Why
Buying a part should feel like it *arrives* somewhere, not just increment a counter. Delivery flow connects the marketplace/dealer economy to the physical garage, adds texture (delays, wrong or damaged shipments), and creates memory and family-reaction moments around meaningful purchases.

## How
Create a design specification that covers:

- Define arrival types: shipped box, local pickup, bike unloaded from trailer/truck.
- Specify the delivery timeline and how in-transit orders resolve into the garage (ties to dealer order ETAs).
- Define exception cases: shipping delay, wrong part, damaged shipment, and their resolutions.
- Specify where arrivals land physically (delivery area → shelf/bin/floor) and how the player acknowledges them.
- Define parent reactions to expensive purchases and family-stress/budget effects.
- Define memory hooks for important purchases (first race bike, a dream part).
- Map dependencies to the marketplace, dealer/orders, physical inventory, assets/provenance, family/stress, and memory systems.

## Definition of Done
- [ ] Arrival types and their physical landing spots are documented.
- [ ] Delivery timeline and order resolution into the garage are specified.
- [ ] Exception cases (delay, wrong part, damage) and resolutions are defined.
- [ ] Parent reactions and budget/stress effects are described.
- [ ] Memory hooks for important purchases are defined.
- [ ] Dependencies (marketplace, dealer/orders, inventory, assets, family, memory) are listed.

## Related Epic
Living Garage System

## Labels
type: design, area: garage, area: marketplace, area: dealer, priority: p1-high

---

# Issue: Design Garage UI Navigation

## What
Design navigation for the garage so it functions as a physical menu.

Tap targets to define:

- Tap a bike
- Tap a shelf
- Tap a toolbox
- Tap the phone
- Tap the calendar
- Tap the trophy wall
- Tap the workbench
- Tap the marketplace delivery box
- Tap a family member
- Tap the garage door to travel / race / practice

The garage should behave as the app's physical menu.

## Why
"Menus should feel like places or tools in the world." Routing core actions through tappable objects in the garage keeps the player grounded in a real space and removes abstract menu chrome. The garage door becomes the way you leave for the track; the phone and calendar are objects you pick up.

## How
Create a design specification that covers:

- Map every tappable zone/object to the flow it opens (bike detail/builder, storage view, tools, phone hub, calendar/season, museum, workbench actions, delivery review, person interaction, travel).
- Define the interaction model for phone-sized touch: tap targets, hit areas, hover/press states, and back navigation.
- Specify how the garage handles locked/unavailable actions (e.g., bike work blocked, phone gated by age).
- Define accessibility and clarity: labels, affordances, and a fallback list view for discoverability.
- Specify how navigation state persists (which zone was last open).
- Map dependencies to the phone hub, calendar/season, bike builder, marketplace/delivery, and travel/race flows.
- Provide a zone map / wireframe of the garage home screen.

## Definition of Done
- [ ] Every tappable garage zone/object and the flow it opens are documented.
- [ ] The touch interaction model and back navigation are specified.
- [ ] Locked/unavailable action handling is defined.
- [ ] Accessibility and a fallback list view are described.
- [ ] Navigation-state persistence is specified.
- [ ] Dependencies (phone, calendar, bike builder, marketplace, travel) are listed.
- [ ] A garage home-screen zone map / wireframe is provided.

## Related Epic
Living Garage System

## Labels
type: design, area: garage, area: ui, area: phone, priority: p0-critical

---

# Issue: Design Garage Visual States Over Time

## What
Design how the garage changes visually and mechanically as the career evolves.

Example stages:

- Age 4: small bike, basic tools, family garage.
- Age 10: more trophies, more parts, better shelves.
- Age 16: multiple bikes, a serious shop setup.
- Adult / privateer: own shop, race van / trailer.
- Factory rider: personal garage becomes a museum/personal space; the team owns the race shop.
- Retirement: the garage becomes a legacy museum.

## Why
"Leave a legacy" and "the garage evolves with the rider's life." Watching the garage grow from a corner of the family garage to a full race shop — and finally into a museum — makes progression visible and emotional. The space itself tells the story of the career.

## How
Create a design specification that covers:

- Define garage visual/mechanical stages keyed to age, class, support level, and career outcome.
- Specify what changes at each stage: bikes present, tooling, shelving/capacity, décor, trophies/museum density, vehicles (van/trailer), and ownership (personal vs team shop).
- Define transitions between stages and what triggers them (aging, class moves, support-ladder changes, going pro/factory, retirement).
- Specify how visual state interacts with upgrades and clutter/capacity (upgrades layer on top of the stage baseline).
- Define the retirement/legacy-museum end state.
- Map dependencies to career progression, support ladder, bike ownership, upgrades, museum, and persistence systems.

## Definition of Done
- [ ] Garage stages keyed to age/class/support/outcome are documented.
- [ ] Per-stage changes (bikes, tools, shelving, décor, vehicles, ownership) are specified.
- [ ] Stage transitions and their triggers are defined.
- [ ] Interaction with upgrades and clutter/capacity is specified.
- [ ] The retirement/legacy-museum end state is described.
- [ ] Dependencies (career, support ladder, bike ownership, upgrades, museum, persistence) are listed.

## Related Epic
Living Garage System

## Labels
type: design, area: garage, area: career, area: legacy, priority: p1-high

---

# Issue: Design Garage Persistence and Save Data

## What
Design how garage state is saved and restored so the garage remains consistent across sessions and seasons.

Persist:

- Item locations
- Installed / removed parts
- Bike positions
- Displayed memorabilia
- Storage capacity
- Clutter state
- Upgrade state
- Object memories
- Sold / removed items
- Delivery state (in-transit orders)

## Why
A living garage only feels real if it stays exactly as the player left it. Robust persistence protects the emotional investment in a filled garage and museum, and keeps the physical inventory, upgrades, and delivery pipeline coherent across save/load and multi-season play.

## How
Create an implementation-oriented specification that covers:

- Define the garage save schema: item-to-location mapping, bike positions/roles, installed vs stored parts, displayed memorabilia, capacity pools, clutter level, upgrades, and in-transit deliveries.
- Specify serialization/deserialization and versioning/migration for future schema changes.
- Ensure asset identity/provenance and object-memory links survive save/load.
- Define how sold/removed items are recorded so they do not reappear.
- Specify how delivery/order state resumes correctly after load (ETAs relative to game day).
- Define validation and safe-fallback behavior for corrupt or partial garage data.
- Map dependencies to the assets/provenance, memory, marketplace/dealer orders, upgrades, and clutter/capacity systems.

## Definition of Done
- [ ] The garage save schema for all persisted fields is documented.
- [ ] Serialization/deserialization and versioning/migration approach is specified.
- [ ] Asset identity, provenance, and memory links are shown to survive save/load.
- [ ] Sold/removed item handling prevents reappearance.
- [ ] Delivery/order state resumption after load is defined.
- [ ] Validation and safe-fallback behavior for bad data is described.
- [ ] Dependencies (assets, memory, orders, upgrades, clutter) are listed.

## Related Epic
Living Garage System

## Labels
type: implementation, area: garage, area: persistence, area: assets, priority: p0-critical

---

# Issue: Define Minimum Living Garage for v1.0

## What
Define the minimum Living Garage feature set required for the App Store Version 1.0 release, and the features explicitly deferred.

Include (v1.0):

- View the current bike.
- View owned parts.
- Install / remove components.
- A basic shelf / storage view.
- Basic marketplace delivery into the garage.
- Basic trophy / memory display.
- The garage as the home screen.
- Basic upgrade / cosmetic support.

Defer (post-v1.0):

- Full 3D garage.
- Advanced museum.
- Complex clutter simulation.
- Deep social visits.
- Full walkaround mode.

## Why
The Living Garage is a large system; shipping v1.0 requires a clear, achievable cutline that delivers the emotional core (a home hub with your bike, parts, deliveries, and a few trophies) without blocking launch on 3D or deep simulation. This keeps scope honest and aligned with the v1.0 roadmap and MVP cutline.

## How
Create a scope specification that covers:

- Define the v1.0 must-have garage features and the acceptance bar for each.
- Define the deferred features and the rationale/sequencing for post-launch.
- Map each v1.0 feature to its child issue(s) in this epic and to existing garage/phone/marketplace systems already implemented.
- Identify the minimum persistence needed for v1.0 (ties to the persistence issue).
- Specify how the v1.0 garage functions as the home screen with a simple, phone-first layout.
- Align the cutline with the Release Readiness and Version 1.0 Scope planning drafts.

## Definition of Done
- [ ] The v1.0 must-have garage feature list and acceptance bar are documented.
- [ ] Deferred features and their sequencing are defined.
- [ ] Each v1.0 feature is mapped to child issues and existing systems.
- [ ] Minimum v1.0 persistence is identified.
- [ ] The v1.0 garage home-screen layout expectation is specified.
- [ ] Alignment with Release Readiness and v1.0 Scope drafts is noted.

## Related Epic
Living Garage System

## Labels
type: design, area: garage, area: mvp, area: release, priority: p0-critical

---

# Issue: Update Design Decision Log

## What
Record the Living Garage System design decisions in the Design Decision Log.

Add these decisions:

### DD-0036 — The Garage Is a Living Space, Not an Inventory Menu
The garage is the player's home hub, workshop, storage area, museum, and physical interface for the game. Core flows (bike work, phone, calendar, marketplace deliveries, travel to race/practice) launch from the garage as tappable objects rather than from abstract menus.

### DD-0037 — Inventory Should Be Physically Represented When Possible
Bikes, parts, tools, memorabilia, and gear should appear in the garage through shelves, racks, stands, boxes, walls, and displays rather than existing only in abstract menus. Physical representation is preferred wherever practical for the platform and scope.

### DD-0038 — The Garage Evolves With the Rider's Life
The garage should visually and mechanically change as the rider ages, gains responsibility, moves up classes, changes support level, and eventually retires — from a corner of the family garage to a full race shop and finally a legacy museum.

## Why
The Design Decision Log keeps a clear record of locked decisions so future work does not contradict the core design. These three decisions anchor the Living Garage epic and must be discoverable alongside the existing DD entries.

## How
- Add DD-0036, DD-0037, and DD-0038 to the project's Design Decision Log.
- Cross-reference the related GDD sections and the Living Garage System issue drafts.
- Ensure the new entries follow the existing DD formatting and numbering (continuing after DD-0035).

## Definition of Done
- [ ] DD-0036 is added.
- [ ] DD-0037 is added.
- [ ] DD-0038 is added.
- [ ] Each entry cross-references the Living Garage System drafts and related GDD sections.

## Related Epic
Living Garage System

## Labels
type: documentation, area: gdd, area: garage, priority: p1-high
