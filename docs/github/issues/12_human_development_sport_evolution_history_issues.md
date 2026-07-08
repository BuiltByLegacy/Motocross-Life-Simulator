# Issue: Design Human Development Engine
## What
Design the Human Development Engine for **Motocross: Chasing the Dream** so rider growth reflects becoming a person, not just gaining stats. The system should model physical, emotional, social, and behavioral development across childhood, adolescence, amateur progression, adulthood, and long-term legacy.

The design must cover:
- Height and weight growth over time, with believable age ranges and family/body-type influence.
- Strength, endurance, coordination, recovery rate, and athletic maturity.
- Puberty timing as a gradual, sensitive, non-exploitative development factor.
- Confidence, anxiety, focus, risk tolerance, coachability, resilience, and burnout.
- Sleep habits, nutrition habits, school/life load, and family schedule pressure.
- Friend groups, social belonging, peer pressure, and identity formation.
- How development affects practice, race readiness, fatigue, injury risk, learning speed, and long-term potential.

## Why
Motocross careers start young, and the emotional core of the game is watching a rider grow up inside a family, community, and sport. A believable human development model makes careers feel personal, avoids reducing kids to stat sheets, and creates story-rich choices around training, rest, school, confidence, friendships, and family support.

## How
- Define age bands and development phases with ranges instead of deterministic milestones.
- Separate visible player-facing explanations from deeper simulation variables.
- Create physical growth curves that influence bike fit, fatigue, strength, and class readiness without punishing players randomly.
- Model mental and emotional development through confidence, anxiety, focus, resilience, coachability, and burnout.
- Connect sleep, nutrition, family stress, school pressure, injuries, training load, and friend groups to development.
- Ensure development creates tradeoffs and story outcomes, not min-max traps.
- Include accessibility and sensitivity guidelines for puberty, body composition, anxiety, and burnout.
- Identify dependencies with calendar, family, school, training, injury, coach, goals, and memory systems.

## Definition of Done
- A design spec exists for physical, emotional, social, and behavioral rider development.
- Growth variables, modifiers, player-facing feedback, and memory hooks are documented.
- Puberty and body growth are handled gradually, respectfully, and without exploitative presentation.
- Burnout, confidence, anxiety, focus, and resilience have clear causes and recovery paths.
- Friend groups and social development connect to relationships, school, track community, and memories.
- The spec explicitly avoids random punitive development events that invalidate player planning.

## Related Epic
Human Development / Rider Development; Career; Family Life Engine; Training Practice Engine; Education School Engine; Injury Recovery Engine; Memory Engine

## Labels
type: design, area: rider-development, area: career, priority: p0-critical

# Issue: Design Injury & Medical System
## What
Design a realistic Injury & Medical System that treats injuries as physical, emotional, financial, and family events. The system should cover acute injuries, chronic issues, recovery timelines, medical decisions, rehab, confidence loss, and the risk of returning too early.

The design must include:
- Concussions, collarbone injuries, wrist/thumb injuries, shoulder injuries, knee injuries, ACL injuries, back pain, chronic pain, and overtraining injuries.
- Rehab, physical therapy, medical bills, missed school/work/races, and family stress.
- Returning too early, re-injury risk, reduced confidence, fear after injury, and comeback memories.

## Why
Injury is central to motocross authenticity, but it must be handled carefully. The goal is not to punish the player randomly; it is to create meaningful risk, preparation, recovery, and emotional storytelling around a dangerous sport.

## How
- Define injury categories by body area, severity, cause, recovery path, and long-term risk.
- Model medical advice, parent/guardian decisions for minors, insurance/medical bills, and rehab requirements.
- Connect fatigue, overtraining, poor equipment, weather, crash severity, and returning too early to injury probability.
- Include concussion-specific rules for rest, medical clearance, school impact, and confidence/fear.
- Represent chronic pain and recurring injuries as long-term management problems rather than simple debuffs.
- Build player-facing recovery plans with physical therapy, rest, gradual return, and mental confidence rebuilding.
- Add memory hooks for scary crashes, family concern, comeback races, missed opportunities, and lessons learned.

## Definition of Done
- Injury types, severities, triggers, recovery phases, and recurrence risks are documented.
- Medical bills, rehab, PT, family impact, and career consequences are specified.
- Concussions receive special handling and cannot be gamified as simple short-term penalties.
- Returning too early has clear risks and narrative consequences.
- Confidence/fear after injury connects to race routine, coach advice, parents, goals, and memories.
- The system rewards responsible recovery and avoids unavoidable career-destroying randomness.

## Related Epic
Injury Recovery Engine; Family Life Engine; Career; Training Practice Engine; Economy; Memory Engine

## Labels
type: design, area: injury, area: career, area: family, priority: p0-critical

# Issue: Design Education & School System
## What
Design school as a full life system for youth riders. The system should support public school, private school, homeschool, and online school paths, with grades, homework, teachers, friends, absences for racing, parent approval, social development, and college/trade school options.

## Why
A young rider’s career is shaped by school obligations, parent expectations, friendships, and future plans. School should create believable life pressure and identity choices without becoming busywork.

## How
- Define school enrollment types with different schedules, flexibility, cost, social effects, and parent approval requirements.
- Model grades, homework load, missed classes, makeup work, teacher relationships, eligibility, and stress.
- Connect race travel, injuries, fatigue, sleep, friendships, and family finances to school outcomes.
- Include social development through classmates, friends, rivals, teachers, and school events.
- Add long-term paths for college, trade school, coaching, mechanic work, and non-racing futures.
- Provide clear UI summaries and warnings before school problems become severe.

## Definition of Done
- All school types and tradeoffs are documented.
- Grades, homework, absences, teachers, friends, and parent approval have clear mechanics.
- Social development and future education/career paths are included.
- School interacts with calendar, travel, family, goals, fatigue, injury, and memories.
- The design avoids repetitive mandatory micromanagement.

## Related Epic
Education School Engine; Family Life Engine; Career Outcomes System; Calendar Time Engine; Memory Engine

## Labels
type: design, area: school, area: family, area: career, priority: p1-high

# Issue: Design Nutrition & Fitness System
## What
Design the Nutrition & Fitness System for fueling, health, athletic development, fatigue, recovery, body composition, illness risk, and injury risk.

The system must include meals, hydration, junk food, healthy eating, meal prep, sports nutrition, age-appropriate supplements, recovery, fatigue, body composition, illness risk, and injury risk.

## Why
Motocross fitness is built through daily habits, not only practice sessions. Nutrition and recovery should support believable growth, family routines, travel decisions, performance, and health.

## How
- Define meal quality, hydration, recovery, sleep, and training load as connected habit systems.
- Represent junk food and poor fueling as occasional tradeoffs rather than moralizing choices.
- Add family budget, travel/camping, school lunch, race weekend food, and meal prep considerations.
- Gate supplements by age, parent approval, medical/common-sense guidance, and sport authenticity.
- Connect nutrition to fatigue, focus, endurance, illness risk, injury risk, growth, and recovery.
- Add coach and parent feedback that helps players learn without hidden punishment.

## Definition of Done
- Nutrition, hydration, fatigue, recovery, and body composition are defined at design level.
- Age-appropriate supplement rules and parent/coach guidance are documented.
- Travel, budget, school, training, injury, and race weekend integrations are specified.
- The design avoids shame-based body messaging and focuses on health/performance.

## Related Epic
Training Practice Engine; Human Development; Injury Recovery Engine; Family Life Engine; Race Weekend Systems

## Labels
type: design, area: rider-development, area: fitness, area: health, priority: p1-high

# Issue: Design Race Weekend Crew Management
## What
Design Race Weekend Crew Management for who attends races and how each person helps or complicates the weekend. Crew members may include Dad, Mom, siblings, grandparents, mechanic, coach, friend, and teammate.

Effects should include bike prep, emotional support, hydration, spotting problems, pit board help, stress reduction, conflict, and family memories.

## Why
Motocross is rarely a solo sport. The people in the pits shape preparation, pressure, memories, costs, and the emotional feel of racing.

## How
- Define crew roles, availability, relationship requirements, costs, and schedule conflicts.
- Give each crew role helpful effects and possible stress/conflict effects.
- Connect parents, siblings, grandparents, mechanics, coaches, friends, and teammates to memories and relationship changes.
- Allow different family situations without assuming every rider has the same support network.
- Create race-day UI that summarizes who is present and what they are helping with.

## Definition of Done
- Crew member roles and effects are documented.
- Attendance, availability, costs, conflicts, and emotional support are specified.
- Pit board, hydration, bike prep, spotting problems, and stress reduction have clear design hooks.
- Family memories and relationship changes are included.

## Related Epic
Competition Engine; Family Life Engine; Dynamic Community Engine; Relationship; Memory Engine

## Labels
type: design, area: race, area: family, area: relationship, priority: p1-high

# Issue: Design Travel & Camping Engine
## What
Design travel as gameplay and storytelling, not just a cost deduction. The system should include hotel, camper, toy hauler, tent, staying with relatives, Airbnb, overnight driving, flying, traffic, breakdowns, forgotten gear, weather delays, travel fatigue, family stress, and travel memories.

## Why
Getting to races is a major part of motocross life. Travel choices affect money, fatigue, family bonding, conflict, comfort, preparation, and the memories that define a season.

## How
- Define travel modes, lodging options, costs, comfort, fatigue, packing capacity, and family stress.
- Model manageable risks such as traffic, breakdowns, forgotten gear, and weather delays with warning and mitigation.
- Connect trailers, campers, vehicles, gear inventory, calendar timing, and race importance.
- Add travel memories for road trips, late nights, family jokes, stressful drives, and special trips.
- Avoid random severe events that feel unfair or invalidate planning.

## Definition of Done
- Travel and lodging options are documented with costs, benefits, risks, and memories.
- Travel fatigue, family stress, delays, breakdowns, and forgotten gear have mitigation paths.
- Calendar, garage inventory, equipment, family, race weekend, and memory integrations are specified.

## Related Epic
Calendar Time Engine; Family Life Engine; Competition Engine; Garage Shop System; Memory Engine

## Labels
type: design, area: travel, area: family, area: calendar, priority: p1-high

# Issue: Design Race Day Routine System
## What
Design a Race Day Routine System for pre-moto preparation. It should include breakfast, hydration, stretching, track walk, watching other motos, tire pressure, gearing, suspension clickers, goggles, warm-up, visualization, bathroom/nerves, and parent/coach pep talks.

## Why
Race performance is shaped by preparation, nerves, habits, family support, and bike setup. A routine system creates meaningful choices before the gate drops without implementing gameplay yet.

## How
- Define routine actions, time costs, fatigue effects, confidence effects, and setup effects.
- Connect mental prep, hydration, warm-up, bike checks, and gear readiness to race-day state.
- Allow parent and coach pep talks based on relationship, personality, and recent events.
- Include nerves and bathroom timing as authentic flavor with light mechanical impact.
- Provide presets to avoid repetitive micromanagement.

## Definition of Done
- Pre-moto routine actions and effects are documented.
- Bike setup, gear, nutrition, hydration, anxiety, confidence, and coach/parent support are integrated.
- Routine presets and UI requirements are specified.
- The system supports story and preparation without requiring gameplay implementation.

## Related Epic
Competition Engine; Training Practice Engine; Bike Setup; Family Life Engine; Coach; Memory Engine

## Labels
type: design, area: race, area: fitness, area: bike-setup, priority: p1-high

# Issue: Design Local Track Community System
## What
Design each local track as a social place with recurring people, reputations, memories, and community roles. Include track owner, flaggers, photographer, announcer, local mechanic, regular families, rival parents, vendors, friend groups, reputation at specific tracks, and place memories.

## Why
Tracks should feel like communities, not interchangeable race menus. Familiar faces and place-based memories make local racing emotionally meaningful.

## How
- Define persistent track communities with recurring NPCs and family groups.
- Track reputation at specific venues based on behavior, results, sportsmanship, family relationships, and history.
- Add vendors, photographers, announcers, flaggers, local mechanics, and track owners as social/economic hooks.
- Connect friend groups, rival parents, gossip, favors, and conflicts to the dynamic community system.
- Store place memories such as first win, bad crash, favorite track, family camping weekend, and rival showdown.

## Definition of Done
- Track community roles and relationship hooks are documented.
- Track-specific reputation and place memories are specified.
- Vendors, local mechanics, photographers, announcers, and regular families have design purposes.
- The system connects to track venues, race weekends, marketplace, relationships, and memories.

## Related Epic
Track Venue System; Dynamic Community Engine; Competition Engine; Relationship; Memory Engine

## Labels
type: design, area: track, area: relationship, area: memory, priority: p1-high

# Issue: Design Equipment Wear Beyond Bikes
## What
Design wear, repair, replacement, resale, and memory systems for gear and support equipment beyond motorcycles.

Items should include helmets, boots, goggles, gloves, jerseys, pants, bike stands, generators, toolboxes, trailers, campers, tie-downs, and gas cans. Each item should have condition, safety/performance impact, replacement timing, repairability, resale value, and memories.

## Why
Motocross families invest in more than bikes. Worn-out boots, scratched helmets, old trailers, and hand-me-down gear tell stories and affect safety, finances, and garage identity.

## How
- Define item categories, condition states, degradation causes, and inspection moments.
- Specify safety-critical items such as helmets and tie-downs with clear replacement guidance.
- Model repairability, resale value, hand-me-down potential, and sentimental value.
- Connect gear condition to race routine, injuries, travel, marketplace, garage displays, and family budget.
- Add memories to meaningful equipment, such as first helmet, lucky jersey, grandpa’s toolbox, or camper trip.

## Definition of Done
- All listed equipment categories are covered.
- Condition, safety/performance impact, replacement timing, repairability, resale value, and memories are documented.
- Safety-critical replacement rules are clear and player-facing.
- Marketplace, garage, race day, injury, travel, and memory integrations are specified.

## Related Epic
Garage Shop System; Marketplace; Injury Recovery Engine; Travel & Camping; Memory Engine

## Labels
type: design, area: assets, area: garage, area: marketplace, priority: p1-high

# Issue: Design Family Tree and Aging System
## What
Design a Family Tree and Aging System that allows family members to change over long careers. Include parents aging, grandparents aging and passing, siblings growing up, the rider becoming an adult, the rider potentially becoming a parent, family relationships changing, long-term family memories, and legacy effects.

## Why
The game’s promise is generational: every rider has a story. Families should not remain frozen while seasons pass. Aging, loss, changing roles, and legacy make long careers meaningful.

## How
- Define family member profiles, ages, life stages, relationship roles, health states, and availability.
- Model transitions such as siblings moving out, grandparents becoming less able to travel, parents changing jobs, and the rider becoming independent.
- Include sensitive handling for aging, illness, and passing, with opt-out or tone controls if appropriate.
- Support adult rider outcomes, family formation, parenthood possibilities, and legacy continuation.
- Store long-term family memories and heirlooms that affect garage, motivation, and story recaps.

## Definition of Done
- Family tree structure and aging rules are documented.
- Parents, grandparents, siblings, adult rider paths, and potential parenthood are addressed.
- Relationship changes, loss, legacy, and memory handling are specified sensitively.
- Integrations with calendar, career outcomes, memories, garage, and documentary recaps are documented.

## Related Epic
Family Life Engine; Calendar Time Engine; Career Outcomes System; Documentary Legacy Recap Engine; Memory Engine

## Labels
type: design, area: family, area: legacy, area: memory, priority: p1-high

# Issue: Design Contracts & Negotiation System
## What
Design realistic contracts and negotiations for local sponsorships, dealer support, amateur team support, factory amateur deals, pro privateer deals, and factory pro contracts.

Terms should include free bikes, parts allowance, travel reimbursement, bonuses, social media requirements, appearance requirements, results expectations, contract length, and parent/guardian approval for minors.

## Why
Support deals are career-defining, but they should feel grounded in relationships, performance, reputation, money, and family decisions rather than simple reward tiers.

## How
- Define deal types by career stage and required reputation/results/networking.
- Specify negotiation variables: benefits, obligations, length, exclusivity, expectations, penalties, and renewal conditions.
- Include parent/guardian approval for minors and family discussion around risk/pressure.
- Connect local sponsors, dealers, teams, factories, social media, appearances, and bonuses.
- Add negotiation UI requirements and plain-language contract summaries.
- Tie contract memories to first sponsor, disappointing renewal, dream factory call, or privateer grind.

## Definition of Done
- Contract types and terms are documented.
- Negotiation inputs, outputs, risks, and obligations are specified.
- Minor approval and family involvement are included.
- Sponsor, economy, career, social media, and memory integrations are clear.

## Related Epic
Opportunity Engine; Career Outcomes System; Economy; Dynamic Community Engine; Memory Engine

## Labels
type: design, area: sponsors, area: career, area: economy, priority: p1-high

# Issue: Design Dynamic Goals System
## What
Design a Dynamic Goals System for personal goals, family goals, career goals, recovery goals, school goals, and financial goals. Goals should be generated from memories, relationships, career stage, money, injuries, family stress, and opportunities.

Examples include beating a rival, finishing top 10, saving for suspension, making Dad proud, qualifying for Regionals, finishing without crashing, paying off a camper loan, getting grades back up, and returning from injury.

## Why
The game should not rely only on achievements. Personal goals help the player understand what matters to this rider and family right now.

## How
- Define goal categories, triggers, priorities, time windows, and emotional stakes.
- Generate goals from recent memories, relationships, injuries, finances, school, family stress, rivals, and opportunities.
- Allow goals to be accepted, ignored, reframed, or completed with partial success where appropriate.
- Connect goals to confidence, relationships, story recaps, rewards, and regrets.
- Ensure goals are personal and contextual rather than generic checklist tasks.

## Definition of Done
- Goal generation sources and categories are documented.
- Example goals have clear triggers, outcomes, and memory hooks.
- Goals interact with family, rivals, money, injuries, school, and career stage.
- The system supports partial success and emotional outcomes.

## Related Epic
Memory Engine; Career; Family Life Engine; Opportunity Engine; Documentary Legacy Recap Engine

## Labels
type: design, area: goals, area: story, area: career, priority: p1-high

# Issue: Design AI Coach System
## What
Design an AI Coach System for coaches who learn the rider over time. Include coach personality, training philosophy, feedback, rider strengths/weaknesses, advice before races, warnings about burnout/injury, relationship with rider and parents, and long-term mentorship memories.

## Why
A good coach should feel like a person who understands the rider, not a generic stat optimizer. Coaching can guide training, confidence, family decisions, and career identity.

## How
- Define coach archetypes, personalities, philosophies, communication styles, and specialties.
- Track what the coach learns about the rider’s strengths, weaknesses, fear, motivation, and habits.
- Generate feedback after practice/races and advice before key events.
- Add warnings for burnout, overtraining, injury risk, poor sleep, confidence slumps, and family pressure.
- Model relationships between coach, rider, and parents, including disagreements and trust.
- Store mentorship memories and long-term influence.

## Definition of Done
- Coach personality, philosophy, learning model, and feedback loops are documented.
- Burnout/injury warnings and pre-race advice are specified.
- Rider/parent/coach relationships and conflicts are included.
- Mentorship memories and long-term development effects are defined.

## Related Epic
Training Practice Engine; Human Development; Relationship; Family Life Engine; Memory Engine

## Labels
type: design, area: coach, area: relationship, area: rider-development, priority: p1-high

# Issue: Design Pit Atmosphere System
## What
Design the Pit Atmosphere System to capture the feeling of being at the races. Include announcer, generators, race fuel smell, vendor row, kids riding pit bikes, families grilling, track PA, dust/mud, factory semi, local gossip, and ambient audio/visual text.

## Why
The racing world should feel alive before and after motos. Atmosphere supports immersion, memory, venue identity, and emotional storytelling without requiring full gameplay implementation.

## How
- Define ambient text, audio cues, visual descriptors, and contextual pit events.
- Vary atmosphere by track size, weather, era, event importance, class level, and community reputation.
- Connect vendor row, factory presence, local gossip, families, and kids to world state.
- Use atmosphere to foreshadow rivalries, opportunities, weather, equipment concerns, and family moments.
- Keep presentation lightweight and non-repetitive.

## Definition of Done
- Pit atmosphere inputs and output formats are documented.
- Ambient audio/visual/text examples are included.
- Weather, track, era, event scale, community, and factory presence variations are specified.
- The system connects to race weekends, UI, track community, and memories.

## Related Epic
Competition Engine; Track Venue System; Dynamic Community Engine; UI; Memory Engine

## Labels
type: design, area: race, area: atmosphere, area: ui, priority: p2-medium

# Issue: Design Sport Evolution System
## What
Design a Sport Evolution System that replaces disruptive random annual rule changes with gradual, authentic evolution of motocross culture, industry, technology, and expectations.

Important: do not create disruptive random rule changes.

Instead, evolve bikes, suspension technology, electric minibikes/future tech, training methods, riding techniques, aftermarket companies, gear brands, dealer networks, social media expectations, factory scouting expectations, track/facility development, and marketplace trends.

## Why
The sport should change over long careers without frustrating the player or invalidating plans. Gradual evolution makes the world feel historical, modern, and alive while preserving fair career flow.

## How
- Define evolution timelines, trend curves, adoption rates, regional differences, and era-specific availability.
- Evolve equipment, training, media, scouting, facilities, marketplace inventory, and industry culture gradually.
- Use announcements, rumors, sponsor behavior, marketplace changes, and community adoption to show change.
- Ensure player planning remains valid; no random rule change should suddenly make a bike, class, or career path unusable.
- Connect sport evolution to Era Selection and Motocross History Engine.

## Definition of Done
- Gradual sport evolution categories and timelines are documented.
- The spec explicitly rejects disruptive random annual rule changes.
- Bikes, suspension, electric/future tech, training, techniques, brands, dealers, social media, scouting, facilities, and marketplace trends are included.
- Player-facing communication and planning safeguards are specified.

## Related Epic
World; Career; Marketplace; Era Selection; Motocross History; Design Decision Log

## Labels
type: design, area: world, area: career, area: marketplace, priority: p1-high

# Issue: Design Era Selection System
## What
Design optional new-game Era Selection for **Motocross: Chasing the Dream**. Possible eras include 1998–2010 two-stroke/four-stroke transition era, 2010–2025 modern motocross, and 2025–future believable future era.

Each era should change bikes, gear, media, marketplace inventory, memorabilia, training culture, manufacturer support, and technology.

## Why
Era Selection lets players experience different motocross contexts without breaking career flow. It supports nostalgia, modern authenticity, future speculation, and replayability.

## How
- Define era presets with date ranges, starting inventory, cultural context, and technology assumptions.
- Adjust bikes, gear, media, training, marketplace, manufacturer support, and memorabilia by era.
- Connect historical riders/bikes/teams as references or memorabilia where licensing/fictionalization allows.
- Preserve stable career progression and avoid disruptive mid-career rule resets.
- Make future-era content believable and grounded in industry trends.

## Definition of Done
- Era presets are documented with gameplay context and content differences.
- Bikes, gear, media, marketplace, memorabilia, training culture, manufacturer support, and technology changes are specified.
- Era Selection is optional and new-game scoped.
- The design explains how eras differ without breaking career progression.

## Related Epic
World; History; Career; Marketplace; Motocross History; Sport Evolution

## Labels
type: design, area: world, area: history, area: career, priority: p2-medium

# Issue: Design Motocross History Engine
## What
Design a Motocross History Engine that lets the game remember and surface the sport’s history. Include legendary riders, historic bikes, famous tracks, iconic gear, major rivalries, legendary mechanics, famous teams, Hall of Fame, Moto History phone app, historical memorabilia, autographs, and garage display value.

This should connect to Marketplace, Memorabilia, Garage Museum, Pro race attendance, Phone apps, and Legacy system.

## Why
Motocross history gives emotional context to bikes, gear, tracks, collectibles, and career dreams. It turns objects into stories and helps the player feel part of a larger sport.

## How
- Define historical entities, eras, rarity, authenticity, legal/licensing strategy, and fictionalized alternatives.
- Create data structures for historic riders, bikes, tracks, teams, mechanics, rivalries, gear, and events.
- Design the Moto History phone app as a discovery, reference, and collection interface.
- Connect historical memorabilia to marketplace value, garage display, autographs, pro race attendance, and legacy.
- Allow the player’s career to become history through Hall of Fame, records, and family legacy.

## Definition of Done
- History entities and relationships are documented.
- Moto History phone app, memorabilia, autographs, Hall of Fame, and Garage Museum hooks are specified.
- Marketplace, pro race attendance, phone apps, and legacy integrations are clear.
- Licensing/fictionalization considerations are documented.

## Related Epic
History; Memory Engine; Garage Shop System; Marketplace; Legacy; Phone / Internet UI

## Labels
type: design, area: history, area: memory, area: garage, priority: p2-medium

# Issue: Update Design Decision Log
## What
Create a documentation issue to add the following design decisions to the project Design Decision Log:

- DD-0025 — Avoid Disruptive Annual Rule Changes: The game should not randomly change rules in ways that frustrate or invalidate player planning.
- DD-0026 — Sport Evolution Should Be Gradual and Authentic: The sport should evolve through bikes, technology, training, media, industry, and culture, not arbitrary disruptive rules.
- DD-0027 — Era Selection Can Change Context Without Breaking Careers: Optional starting eras may change bikes, gear, media, and culture while preserving authentic career flow.
- DD-0028 — Motocross History Enriches Memory, Marketplace, and Garage Systems: The sport’s history should create memorabilia, legends, emotional context, and collectible value.

## Why
These decisions clarify the project’s direction and prevent future implementation from reintroducing frustrating random rule changes. They also establish Sport Evolution, Era Selection, and Motocross History as intentional design pillars.

## How
- Locate the existing Design Decision Log or create the appropriate documentation update issue if the log file is not yet present.
- Add DD-0025 through DD-0028 with status, context, decision, consequences, and related systems.
- Cross-reference the Sport Evolution, Era Selection, and Motocross History issue drafts.
- Make clear that these are design constraints, not gameplay implementation tasks.

## Definition of Done
- A design/documentation issue exists for adding DD-0025 through DD-0028.
- Each decision includes context, decision text, consequences, and related systems.
- The issue explicitly rejects disruptive annual rule changes.
- Related issue drafts are referenced for implementation planning.

## Related Epic
GDD; Documentation; Sport Evolution; Era Selection; Motocross History

## Labels
type: documentation, area: gdd, priority: p1-high
