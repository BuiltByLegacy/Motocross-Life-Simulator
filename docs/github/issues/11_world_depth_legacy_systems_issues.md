# World Depth & Legacy Systems Issue Drafts

Documentation-only GitHub issue drafts for the next major world depth and legacy systems in **Motocross: Chasing the Dream**. These drafts are intentionally self-contained so they can be copied into GitHub issues later without calling the GitHub API or implementing gameplay.

## Draft Index

1. Design Dynamic Motocross World System
2. Design AI Family Simulation System
3. Design Dynamic Economy System
4. Design Personality Engine
5. Design Group Reputation System
6. Design Dynamic Media System
7. Expand Family Memory System
8. Expand Garage Museum System
9. Design Home Life System
10. Design Dynamic Opportunity Engine
11. Design Mechanical Knowledge Progression
12. Design Legacy After Retirement System
13. Design Dynamic Weather System
14. Design Living Track Surface System
15. Design Hall of Fame and Career Records System
16. Design Multiple Career Endings System
17. Design Documentary Engine
18. Update Design Decision Log

# Issue: Design Dynamic Motocross World System

## What
Design a living motocross world for **Motocross: Chasing the Dream** that evolves independently of the player.

The system should define how the world advances across seasons, regions, classes, tracks, teams, manufacturers, rules, local scenes, news, and opportunity availability even when the player is not directly involved.

Include world changes such as:

- AI riders aging.
- AI riders changing classes.
- Tracks opening and closing.
- Manufacturers changing amateur, privateer, dealer, and factory support.
- Teams forming, expanding, shrinking, or folding.
- Rules changing over time.
- Local scenes growing or shrinking.
- Regional competition strength changing.
- World news affecting available opportunities.

## Why
The world should not revolve around the player. A rider's life feels more authentic when other families grow up, rivals age out, tracks disappear, teams lose funding, manufacturers shift priorities, and local motocross scenes rise or fade regardless of the player's choices.

This system creates history, scarcity, urgency, and emotional texture. A missed opportunity should feel like it existed in a real world that kept moving.

## How
Create a design specification for world simulation that covers:

- World timeline rules for yearly, seasonal, monthly, weekly, and event-based updates.
- AI rider lifecycle rules for age, class eligibility, skill growth, injuries, confidence, budget limits, family commitment, and retirement.
- Track lifecycle rules for opening, closing, ownership changes, maintenance quality, local popularity, safety reputation, and event availability.
- Manufacturer and team support rules for budgets, amateur programs, factory interest, dealer incentives, regional focus, and class priorities.
- Rules-change handling for eligibility, classes, equipment, safety requirements, qualifying formats, and costs.
- Local scene growth/shrink logic based on economy, weather, track access, local heroes, family participation, and promoter quality.
- Regional competition strength calculations that affect race difficulty, scouting attention, media coverage, and travel decisions.
- World news generation that surfaces meaningful changes through phone, media, rumors, family conversations, and pit chatter.
- Dependency mapping to Calendar Time, Dynamic Economy, AI Family Simulation, Opportunity Engine, Dynamic Media, Track Venue, Competition, and Memory systems.

## Definition of Done
- [ ] World update cadence is defined for seasons, months, race weekends, and major news events.
- [ ] AI rider aging and class movement rules are documented.
- [ ] Track opening/closing and local scene strength rules are documented.
- [ ] Manufacturer, team, rule, and regional competition changes are documented.
- [ ] World news is connected to opportunity generation and media presentation.
- [ ] Examples show at least three multi-year world changes that happen without player involvement.
- [ ] Open implementation questions and required data models are listed.
- [ ] No gameplay implementation is included.

## Related Epic
EPIC: Dynamic Community Engine  
EPIC: Calendar Time Engine  
EPIC: Track Venue System  
EPIC: Opportunity Engine

## Labels
`type: design`, `area: world`, `area: simulation`, `priority: p0-critical`

# Issue: Design AI Family Simulation System

## What
Design a system for simulating other racing families, not just the player's family.

The system should model the pressures, resources, personalities, sacrifices, and reputations of AI families in the motocross world.

Include:

- Parent jobs.
- Parent income.
- Family budget.
- Marriage stress.
- Risk tolerance.
- Travel willingness.
- Racing commitment.
- Sibling impact.
- Families quitting racing.
- Families going all-in chasing nationals.
- Family reputation in the pits.

## Why
Motocross is a family sport. Rival riders should not feel like isolated names on a results sheet; they should come from households with different money, stress, ambition, sacrifice, and support. Some families can afford nationals, some cannot. Some parents push too hard, some protect too much, and some simply run out of money or energy.

AI families make the world more human and create believable rivalries, friendships, pity, envy, respect, and consequences.

## How
Create a design specification that includes:

- AI family archetypes, such as budget privateer family, all-in national family, cautious local family, racing dynasty, burned-out family, and late-blooming family.
- Parent job and income ranges with regional cost-of-living modifiers.
- Family budget rules for bikes, travel, repairs, hotels, food, coaching, school, and emergency costs.
- Marriage stress and household stress models affected by money, injuries, travel, siblings, results, and missed life events.
- Risk tolerance rules that influence racing after injury, travel distance, bike upgrades, class movement, and weather decisions.
- Sibling impact rules for attention, resentment, shared costs, multiple riders, and family scheduling conflicts.
- Quit, pause, return, and all-in behavior triggers.
- Pit reputation logic for families, including generosity, drama, fairness, safety, cheating rumors, mechanical help, and sportsmanship.
- Hooks into relationships, media, opportunity generation, race attendance, and memory creation.

## Definition of Done
- [ ] AI family attributes and archetypes are documented.
- [ ] Parent jobs, income, budget, travel willingness, and commitment are defined.
- [ ] Marriage stress, sibling impact, and family quit/all-in triggers are documented.
- [ ] Family reputation in the pits is designed with examples.
- [ ] At least five sample AI family profiles are included.
- [ ] Dependencies on economy, relationship, world, competition, and memory systems are listed.
- [ ] No gameplay implementation is included.

## Related Epic
EPIC: Family Life Engine  
EPIC: Dynamic Community Engine  
EPIC: Relationship Engine

## Labels
`type: design`, `area: family`, `area: world`, `area: relationship`, `priority: p0-critical`

# Issue: Design Dynamic Economy System

## What
Design a motocross economy that changes over time and affects racing life.

Include economy variables such as:

- Fuel prices.
- Hotel prices.
- Bike prices.
- Used bike market conditions.
- Tire shortages.
- Parts shortages.
- Dealer discounts.
- Inflation.
- OEM price changes.
- Sponsor budgets.
- Factory team budget changes.
- Regional economic downturns.

Effects should impact:

- Family budget.
- Travel plans.
- Marketplace prices.
- Dealer inventory.
- Race attendance.
- Team and sponsor support.

## Why
Money should not be static. Motocross families feel every fuel spike, hotel bill, tire shortage, parts delay, dealer deal, and downturn. A dynamic economy makes sacrifice tangible and gives the world reasons to change beyond player performance.

## How
Create a design specification that covers:

- Economy update cadence by week, month, season, and year.
- Regional price modifiers for fuel, lodging, bikes, parts, and entry costs.
- Marketplace supply/demand rules for used bikes, parts, gear, and scams.
- Dealer inventory and discount logic based on OEM support, local demand, relationships, and economic pressure.
- Shortage events for tires, parts, fuel, hotel rooms, and popular bikes.
- Inflation and OEM price change handling across career years.
- Sponsor and factory budget rules that influence offers, contingency, support tiers, and team stability.
- Regional downturn effects on race attendance, track survival, family budgets, and local scene strength.
- Player-facing communication through parents, phone apps, dealer conversations, media, and budget screens.

## Definition of Done
- [ ] Economy variables and update cadence are documented.
- [ ] Effects on family budget, travel, marketplace, dealers, attendance, sponsors, and teams are mapped.
- [ ] Shortage and downturn examples are included.
- [ ] Regional and historical price variation rules are documented.
- [ ] UI and narrative communication hooks are proposed.
- [ ] Dependencies on marketplace, family, world, opportunity, and career systems are listed.
- [ ] No gameplay implementation is included.

## Related Epic
EPIC: Family Life Engine  
EPIC: Bike Ownership System  
EPIC: Garage Shop System  
EPIC: Opportunity Engine

## Labels
`type: design`, `area: economy`, `area: marketplace`, `area: world`, `priority: p1-high`

# Issue: Design Personality Engine

## What
Design a personality engine for riders, parents, coaches, sponsors, mechanics, promoters, media members, and other people in the motocross world.

Include personality coverage for:

- Rider traits.
- Parent traits.
- Coach traits.
- Sponsor traits.
- Mechanic traits.
- Promoter traits.
- Media traits.

Example traits:

- Fearless.
- Lazy.
- Disciplined.
- Perfectionist.
- Hot-headed.
- Mechanically gifted.
- Protective parent.
- Race-obsessed parent.
- Strict coach.
- Motivational coach.
- Business-first sponsor.
- Loyal sponsor.

## Why
People should drive the simulation. Personality gives behavior emotional consistency and makes relationships feel earned. A strict coach should react differently than a motivational coach. A loyal sponsor should behave differently than a business-first sponsor. A protective parent should interpret risk differently than a race-obsessed parent.

## How
Create a design specification that includes:

- Trait categories for ambition, discipline, risk, loyalty, empathy, temper, mechanical ability, communication, money pressure, and competitiveness.
- Role-specific trait lists for riders, parents, coaches, sponsors, mechanics, promoters, and media.
- Rules for how traits affect decisions, dialogue, opportunities, conflict, mentoring, rumors, sponsorship, coaching, and memory interpretation.
- Trait intensity levels and whether traits can change over time.
- Compatibility and conflict rules between people.
- Examples of the same event interpreted by different personalities.
- Dependencies on relationship, reputation, opportunity, AI family, media, and memory systems.

## Definition of Done
- [ ] Role-specific personality traits are documented.
- [ ] Trait effects on decisions, relationships, opportunities, media, and memories are mapped.
- [ ] Trait intensity and possible change-over-time rules are defined.
- [ ] Compatibility/conflict examples are included.
- [ ] At least ten sample characters demonstrate different trait mixes.
- [ ] No gameplay implementation is included.

## Related Epic
EPIC: Personality Identity Engine  
EPIC: Relationship Engine  
EPIC: Dynamic Community Engine

## Labels
`type: design`, `area: personality`, `area: relationship`, `area: world`, `priority: p0-critical`

# Issue: Design Group Reputation System

## What
Design a reputation system where reputation is tracked by group instead of a single global number.

Reputation groups include:

- Local riders.
- Racing parents.
- Coaches.
- Mechanics.
- Track owners.
- Promoters.
- Sponsors.
- Manufacturers.
- Factory teams.
- Fans.
- Media.
- Officials.

Each group should evaluate the rider differently. For example, the rider can be loved by fans but disliked by other racers.

## Why
A single reputation score cannot represent motocross culture. A rider might be respected by mechanics for helping in the garage, criticized by officials for aggressive riding, loved by fans for comebacks, distrusted by sponsors for bad behavior, and envied by local riders for factory attention.

Group-specific reputation creates more authentic consequences and richer career paths.

## How
Create a design specification that includes:

- Reputation dimensions per group, such as respect, trust, marketability, sportsmanship, toughness, reliability, humility, and controversy.
- Events that affect each group differently, including wins, crashes, injuries, cheating accusations, rivalries, sponsor behavior, interviews, family conduct, mechanical knowledge, and helping others.
- Memory-based reputation where groups remember important moments rather than just aggregate scores.
- Decay, forgiveness, escalation, and regional transfer rules.
- UI language that communicates reputation without exposing raw numbers.
- Examples of conflicting reputations across groups.
- Hooks into media, opportunity, sponsorship, factory interest, officials, family, and career endings.

## Definition of Done
- [ ] Reputation groups are defined with unique evaluation criteria.
- [ ] Event-to-group reputation effects are documented.
- [ ] Conflicting reputation examples are included.
- [ ] Memory, decay, forgiveness, and regional behavior rules are specified.
- [ ] Dependencies on opportunity, relationship, media, career, and memory systems are listed.
- [ ] No gameplay implementation is included.

## Related Epic
EPIC: Personality Identity Engine  
EPIC: Relationship Engine  
EPIC: Opportunity Engine  
EPIC: Career Outcomes System

## Labels
`type: design`, `area: reputation`, `area: relationship`, `area: career`, `priority: p0-critical`

# Issue: Design Dynamic Media System

## What
Design in-game media through the phone and internet.

Include media channels such as:

- MotoNews app.
- Podcasts.
- Race reports.
- Rumors.
- Interviews.
- Social media reactions.
- Forum-style discussions.
- YouTube-style creators.
- Local newspaper articles.
- Factory signing announcements.

Media should react to:

- Race results.
- Injuries.
- Rivalries.
- Sponsor changes.
- Loretta attempts.
- Factory interest.
- Bad behavior.
- Comebacks.

## Why
Media gives the motocross world a public memory. It can celebrate, distort, pressure, overlook, or revive a rider's story. It also lets the player see that other riders, families, tracks, sponsors, and teams have lives beyond the player.

## How
Create a design specification that covers:

- Media source types and their tone, reach, bias, accuracy, and update cadence.
- Story trigger rules for results, injuries, rivalries, rumors, signings, scandals, comebacks, and local milestones.
- Difference between local, regional, national, industry, and fan media.
- Interview and quote systems for riders, parents, sponsors, coaches, and rivals.
- Rumor reliability and consequences.
- Social reaction generation based on group reputation, fan interest, controversy, and media traits.
- How media is accessed through phone/internet UI at different ages.
- Memory hooks so major articles, videos, and interviews can appear in the documentary or garage museum.

## Definition of Done
- [ ] Media channels and source types are documented.
- [ ] Trigger rules for major story categories are defined.
- [ ] Rumor, interview, social reaction, and article behavior are specified.
- [ ] Media reach and bias rules are documented.
- [ ] Examples include local newspaper, podcast, MotoNews, forum, and signing announcement entries.
- [ ] No gameplay implementation is included.

## Related Epic
EPIC: Commentary Engine  
EPIC: Dynamic Community Engine  
EPIC: Opportunity Engine  
EPIC: Documentary Legacy Recap Engine

## Labels
`type: design`, `area: media`, `area: phone`, `area: world`, `priority: p1-high`

# Issue: Expand Family Memory System

## What
Expand family memories so parents, siblings, and grandparents remember events differently than the rider.

Include memory perspectives such as:

- Dad memories.
- Mom memories.
- Sibling memories.
- Grandparent memories.
- Regrets.
- Proud moments.
- Sacrifices.
- Missed events.
- Injuries.
- Financial struggles.
- First wins.
- Last races.

Examples:

- Dad remembers staying up until 2 AM rebuilding an engine.
- Mom remembers the first major injury.
- Sibling remembers being ignored at race weekends.

## Why
A motocross life is shared by the whole family. The rider may remember a win, while a parent remembers the credit card bill, the fear after a crash, or the long drive home. Siblings may remember being left out. Grandparents may remember pride, worry, or missed birthdays.

Different memory perspectives make the documentary, retirement, garage, and family relationships emotionally meaningful.

## How
Create a design specification that includes:

- Memory schemas for each family role.
- Event tagging for pride, fear, regret, sacrifice, resentment, nostalgia, relief, and grief.
- Perspective differences for the same event.
- Memory strength, decay, resurfacing, and reinterpretation over time.
- Triggers for family conversations, conflicts, apologies, encouragement, retirement reflections, and documentary narration.
- Rules for missed events and opportunity costs.
- Integration with garage museum objects, photos, clippings, trophies, injuries, finances, and career endings.

## Definition of Done
- [ ] Dad, mom, sibling, and grandparent memory perspectives are documented.
- [ ] Shared event/different interpretation examples are included.
- [ ] Regret, pride, sacrifice, injury, finance, first-win, and last-race memory types are defined.
- [ ] Memory resurfacing and documentary hooks are specified.
- [ ] Dependencies on family, relationship, garage, documentary, and career systems are listed.
- [ ] No gameplay implementation is included.

## Related Epic
EPIC: Family Life Engine  
EPIC: Documentary Legacy Recap Engine  
EPIC: Garage Shop System  
EPIC: Career Outcomes System

## Labels
`type: design`, `area: memory`, `area: family`, `area: relationship`, `priority: p0-critical`

# Issue: Expand Garage Museum System

## What
Design the garage as a museum, not just storage.

Include:

- Trophy wall.
- Display shelves.
- Bike stands.
- Memorabilia display.
- Old helmets.
- Signed jerseys.
- Broken parts.
- Championship bikes.
- First bike.
- Dad's toolbox.
- Family photos.
- Newspaper clippings.
- Museum mode.
- Object memories.

## Why
The garage should become a physical record of the life the rider and family lived. Objects should hold memory, not just inventory value. A broken lever, old helmet, or first bike can matter more than a championship trophy if it carries the right story.

## How
Create a design specification that covers:

- Garage zones for storage, work, display, family history, trophies, bikes, tools, and memorabilia.
- Object memory rules connecting items to events, people, locations, seasons, and emotions.
- Display eligibility for trophies, bikes, broken parts, photos, jerseys, helmets, tools, clippings, and sentimental objects.
- Museum mode presentation for browsing the career history through objects.
- Family commentary when viewing meaningful objects.
- Rules for losing, selling, donating, repairing, or preserving meaningful objects.
- Integration with documentary, memory, marketplace, garage UI, and legacy systems.

## Definition of Done
- [ ] Garage museum object categories and display zones are documented.
- [ ] Object memory rules are defined.
- [ ] Museum mode behavior is specified.
- [ ] Examples include first bike, Dad's toolbox, broken part, championship bike, family photo, and newspaper clipping.
- [ ] Selling or losing meaningful objects is addressed.
- [ ] No gameplay implementation is included.

## Related Epic
EPIC: Garage Shop System  
EPIC: Documentary Legacy Recap Engine  
EPIC: Bike Ownership System  
EPIC: Memory Engine

## Labels
`type: design`, `area: garage`, `area: memory`, `area: assets`, `priority: p0-critical`

# Issue: Design Home Life System

## What
Design life outside motocross.

Include:

- Friends.
- School events.
- Dating.
- Prom.
- College planning.
- Jobs.
- Family vacations.
- Holidays.
- Birthday parties.
- Weddings.
- Missing social events for racing.
- Missing races for family events.

This system should create sacrifice and life balance.

## Why
Motocross choices matter more when they compete with life. Racing every weekend should have costs: missed dances, strained friendships, skipped vacations, family conflict, jobs delayed, and moments that never happen again. Sometimes choosing family should matter as much as choosing a gate drop.

## How
Create a design specification that includes:

- Home-life calendar events by age, school year, family context, and relationship status.
- Conflict rules between racing, school, jobs, dating, family gatherings, holidays, and recovery.
- Friendship and dating availability affected by travel, fatigue, reputation, priorities, and personality.
- College and job planning tradeoffs for amateur, privateer, and post-racing futures.
- Family vacation and holiday rules that create emotional choices.
- Memory hooks for missed events, chosen events, regret, relief, resentment, and gratitude.
- UI language that presents choices as life tradeoffs rather than optimization puzzles.

## Definition of Done
- [ ] Home-life event categories are documented.
- [ ] Race-vs-life conflict rules are defined.
- [ ] Friends, dating, school, jobs, college, holidays, and family events are covered.
- [ ] Memory and relationship consequences are documented.
- [ ] Examples include missing prom for a qualifier and missing a race for a wedding.
- [ ] No gameplay implementation is included.

## Related Epic
EPIC: Family Life Engine  
EPIC: Education School Engine  
EPIC: Calendar Time Engine  
EPIC: Career Outcomes System

## Labels
`type: design`, `area: family`, `area: school`, `area: story`, `priority: p1-high`

# Issue: Design Dynamic Opportunity Engine

## What
Design an opportunity engine that generates opportunities from what has happened in the world.

Opportunities include:

- Coach notices rider.
- Dealer offers discount.
- Sponsor reaches out.
- Factory scout watches.
- Another family invites rider to train.
- Friend invites rider to Florida.
- Track owner offers job.
- Suspension company offers testing.
- YouTuber interview.
- Pro rider offers advice.
- Training facility invite.

Opportunities should depend on:

- Memories.
- Results.
- Reputation.
- Relationships.
- Location.
- Timing.
- Money.
- Age.
- Class.
- Personality.
- Story arcs.

## Why
Opportunities should feel discovered, earned, and contextual. A discount from a dealer, advice from a pro, or invite to train should come from relationships, reputation, timing, location, and history rather than random rewards.

## How
Create a design specification that includes:

- Opportunity source types, including people, brands, teams, tracks, media, friends, family, and world events.
- Eligibility rules using memories, results, reputation groups, relationship strength, age, class, money, location, timing, and personality.
- Opportunity windows, expiration, follow-up, rejection, and delayed-consequence behavior.
- Risk/reward and sacrifice modeling for each opportunity type.
- Parent approval and age-gated handling.
- Presentation through phone, pit conversations, family talks, media, dealer visits, and school/friend interactions.
- Examples showing identical results producing different opportunities because of personality, reputation, or location.

## Definition of Done
- [ ] Opportunity sources and categories are documented.
- [ ] Eligibility inputs are mapped to opportunity types.
- [ ] Opportunity timing, expiration, rejection, and follow-up rules are defined.
- [ ] Age, parent approval, money, and location constraints are included.
- [ ] At least ten sample opportunity scenarios are written.
- [ ] No gameplay implementation is included.

## Related Epic
EPIC: Opportunity Engine  
EPIC: Dynamic Community Engine  
EPIC: Personality Identity Engine  
EPIC: Relationship Engine

## Labels
`type: design`, `area: opportunity`, `area: story`, `area: world`, `priority: p0-critical`

# Issue: Design Mechanical Knowledge Progression

## What
Design rider and parent mechanical knowledge progression.

Include learning:

- Oil changes.
- Air filters.
- Chain adjustment.
- Tire changes.
- Brake pads.
- Clutch.
- Gearing.
- Sag.
- Clickers.
- Fork service.
- Shock service.
- Top ends.
- Bottom ends.
- ECU maps.
- Jetting for older bikes.

Mechanical knowledge should affect:

- Setup quality.
- Repair cost.
- Mistake risk.
- Marketplace scam detection.
- Install ability.
- Bike reliability.
- Confidence.

## Why
Mechanical knowledge is part of motocross identity. Learning to change a tire, read a plug, set sag, or rebuild a top end should feel like growing up in the sport. Knowledge can save money, prevent scams, improve confidence, and create memories with parents, mechanics, and friends.

## How
Create a design specification that covers:

- Knowledge categories from basic care to advanced engine, suspension, and electronics work.
- Separate but interacting knowledge tracks for rider, dad, mom, siblings, family friends, and hired mechanics where relevant.
- Learning sources, including parents, mechanics, YouTube-style media, manuals, mistakes, jobs, sponsors, and mentors.
- Failure and mistake rules based on difficulty, fatigue, tools, confidence, supervision, and personality.
- Effects on setup quality, cost, reliability, resale value, scam detection, installation eligibility, and race confidence.
- Memory hooks for first oil change, first top end, late-night rebuilds, costly mistakes, and shared garage lessons.

## Definition of Done
- [ ] Mechanical skill categories and progression tiers are documented.
- [ ] Learning sources and supervision rules are defined.
- [ ] Effects on setup, cost, reliability, mistakes, scams, installs, and confidence are mapped.
- [ ] Parent/rider knowledge differences are addressed.
- [ ] Examples include basic maintenance, suspension setup, engine rebuild, and marketplace inspection.
- [ ] No gameplay implementation is included.

## Related Epic
EPIC: Mechanics Maintenance Engine  
EPIC: Garage Shop System  
EPIC: Bike Ownership System  
EPIC: Family Life Engine

## Labels
`type: design`, `area: mechanics`, `area: garage`, `area: career`, `priority: p0-critical`

# Issue: Design Legacy After Retirement System

## What
Design what happens after the racing career ends.

Possible paths include:

- Coach.
- Mechanic.
- Suspension tuner.
- Track owner.
- Dealer owner.
- Team owner.
- Factory manager.
- Media personality.
- YouTuber.
- Bike tester.
- Parent of next rider.
- Local legend.
- Industry mentor.

The player's past should influence available paths.

## Why
A motocross life does not end when racing ends. Some riders build the sport after they stop chasing results. Retirement should turn the player's memories, skills, reputation, relationships, money, injuries, and sacrifices into a meaningful next chapter.

## How
Create a design specification that includes:

- Retirement triggers and timing for voluntary, injury-driven, financial, family, age, burnout, or career-success endings.
- Eligibility rules for post-racing paths based on mechanical knowledge, reputation groups, relationships, money, media presence, personality, results, education, and memories.
- Path-specific outcomes, responsibilities, opportunities, and legacy titles.
- Family and community reactions to retirement choices.
- Connections to documentary, Hall of Fame, career endings, garage museum, and next-generation systems.

## Definition of Done
- [ ] Retirement triggers are documented.
- [ ] Post-racing paths and eligibility rules are defined.
- [ ] Past choices, memories, skills, relationships, money, and reputation influence available paths.
- [ ] Family/community reactions are included.
- [ ] Examples cover at least six retirement paths.
- [ ] No gameplay implementation is included.

## Related Epic
EPIC: Career Outcomes System  
EPIC: Documentary Legacy Recap Engine  
EPIC: Opportunity Engine

## Labels
`type: design`, `area: legacy`, `area: career`, `area: documentary`, `priority: p1-high`

# Issue: Design Dynamic Weather System

## What
Design detailed weather and track condition simulation.

Include:

- Rain.
- Mud.
- Dust.
- Heat.
- Humidity.
- Cold.
- Wind.
- Storm delays.
- Changing conditions between motos.
- Track drying.
- Rut formation.
- Standing water.
- Visibility issues.

Weather should impact:

- Race strategy.
- Tire choice.
- Bike setup.
- Fatigue.
- Crash risk.
- Bike wear.
- Travel.
- Cancellations.

## Why
Weather is one of motocross's great equalizers. It changes the track, the rider's body, family travel, costs, equipment, and risk. A storm-delayed mud race should feel different from a dry hardpack scorcher.

## How
Create a design specification that covers:

- Weather generation by region, season, date, venue, and forecast uncertainty.
- Race-day weather changes across practice, qualifying, motos, and travel windows.
- Track drying, mud formation, dust, heat index, wind, cold, and visibility rules.
- Effects on fatigue, crash risk, bike wear, setup decisions, tire choice, travel safety, delays, and cancellations.
- Communication through forecast apps, promoter updates, family decisions, media, and pit chatter.
- Integration with living track surface, competition, bike setup, calendar, travel, and memory systems.

## Definition of Done
- [ ] Weather types and regional/seasonal rules are documented.
- [ ] Weather-to-track and weather-to-rider effects are mapped.
- [ ] Delays, cancellations, travel effects, and changing moto conditions are addressed.
- [ ] Forecast uncertainty and communication methods are specified.
- [ ] Examples include mud race, dust race, heat race, wind race, and storm delay.
- [ ] No gameplay implementation is included.

## Related Epic
EPIC: Track Venue System  
EPIC: Competition Engine  
EPIC: Calendar Time Engine

## Labels
`type: design`, `area: weather`, `area: race`, `area: world`, `priority: p1-high`

# Issue: Design Living Track Surface System

## What
Design track conditions that change throughout the day.

Include:

- Morning prep.
- Practice roughness.
- Rut development.
- Braking bumps.
- Square edges.
- Deep sand.
- Mud holes.
- Blue groove.
- Dust.
- Line changes.
- Track maintenance between motos.

This should affect lap simulation and rider style.

## Why
Motocross tracks are living surfaces. A line that worked in practice may disappear by the second moto. Roughness rewards fitness, sand rewards momentum, blue groove changes traction, and poor prep can alter safety and results.

## How
Create a design specification that includes:

- Surface state variables for soil type, moisture, roughness, rut depth, braking bumps, edges, traction, dust, and standing water.
- Update rules across practice, qualifiers, motos, weather changes, class traffic, and maintenance breaks.
- Rider-style interactions with smooth, aggressive, technical, sand, mud, and rut specialists.
- Lap simulation effects for pace, consistency, line choice, fatigue, crash risk, bike wear, and passing.
- Track-owner and promoter decisions for prep quality and between-moto maintenance.
- Memory and media hooks for brutal tracks, legendary ruts, dust disasters, and heroic rough-track rides.

## Definition of Done
- [ ] Track surface variables are documented.
- [ ] Surface evolution rules through a race day are defined.
- [ ] Rider style and lap simulation impacts are mapped.
- [ ] Maintenance and promoter quality effects are included.
- [ ] Examples include sand, mud, hardpack blue groove, rough braking bumps, and dusty conditions.
- [ ] No gameplay implementation is included.

## Related Epic
EPIC: Track Venue System  
EPIC: Competition Engine  
EPIC: Training Practice Engine

## Labels
`type: design`, `area: track`, `area: race`, `area: simulation`, `priority: p1-high`

# Issue: Design Hall of Fame and Career Records System

## What
Design permanent career records and Hall of Fame systems.

Track records such as:

- Most wins.
- Most championships.
- Youngest Loretta qualifier.
- Longest privateer career.
- Most injuries survived.
- Most valuable garage.
- Most famous rivalry.
- Greatest comeback.
- Best local legend.
- Most loyal sponsor.
- Most dramatic parent mode career.

## Why
Legacy needs permanence. Records and Hall of Fame entries give long careers, unusual careers, emotional careers, and non-champion careers a place in history. The system should celebrate more than raw winning.

## How
Create a design specification that includes:

- Record categories for performance, endurance, family, garage, rivalry, comeback, sponsorship, local reputation, and parent campaign drama.
- Scope rules for local, regional, national, class-specific, era-specific, and all-time records.
- Hall of Fame eligibility based on results, memories, reputation, influence, sacrifice, and career ending.
- Tie-breaking, era comparison, and record-retirement rules.
- Presentation through career menus, documentary, garage museum, media, and post-retirement screens.

## Definition of Done
- [ ] Record categories and scopes are documented.
- [ ] Hall of Fame eligibility rules are defined.
- [ ] Non-champion legacy records are included.
- [ ] Presentation hooks are specified.
- [ ] Examples include performance, comeback, local legend, sponsor loyalty, and parent mode records.
- [ ] No gameplay implementation is included.

## Related Epic
EPIC: Career Outcomes System  
EPIC: Documentary Legacy Recap Engine  
EPIC: Competition Engine

## Labels
`type: design`, `area: legacy`, `area: social`, `area: career`, `priority: p2-medium`

# Issue: Design Multiple Career Endings System

## What
Design meaningful career endings beyond “became pro.”

Endings include:

- Factory Champion.
- Journeyman Pro.
- Privateer Hero.
- Local Legend.
- Amateur Hero.
- Family First.
- Bankrupt Dreamer.
- Comeback Story.
- Industry Builder.
- Coach of Champions.
- Forgotten Talent.
- Suspension Genius.
- YouTube Star.
- Track Owner.
- Hall of Fame Parent.

Each ending should be based on memories, choices, reputation, relationships, money, and career outcomes.

## Why
Every rider has a story, and not every great story ends with a factory championship. A player should feel that a life was valid if it reflected the choices, sacrifices, family bonds, failures, comebacks, and legacy they built.

## How
Create a design specification that includes:

- Ending categories and narrative themes.
- Eligibility logic using results, class progression, injuries, money, relationships, reputation groups, family memories, mechanical knowledge, media presence, and post-retirement path.
- Primary ending, secondary legacy title, and bittersweet modifier rules.
- Family, rival, sponsor, and media reactions to each ending.
- Ending conflicts and precedence rules.
- Examples showing how similar results can produce different endings because of choices and relationships.

## Definition of Done
- [ ] All listed career endings are documented.
- [ ] Eligibility inputs and precedence rules are defined.
- [ ] Endings account for memories, choices, relationships, money, reputation, and outcomes.
- [ ] Family/media/community reaction examples are included.
- [ ] Endings connect to documentary and Hall of Fame systems.
- [ ] No gameplay implementation is included.

## Related Epic
EPIC: Career Outcomes System  
EPIC: Documentary Legacy Recap Engine  
EPIC: Family Life Engine

## Labels
`type: design`, `area: career`, `area: legacy`, `area: story`, `priority: p0-critical`

# Issue: Design Documentary Engine

## What
Design the personalized career documentary system.

The documentary should include:

- First ride.
- First race.
- First bike.
- Biggest sacrifice.
- Biggest rival.
- Best season.
- Worst injury.
- Favorite bike.
- Family moments.
- Biggest heartbreak.
- Career turning point.
- Final race.
- Retirement outcome.
- Garage museum tour.
- Final legacy title.

Possible documentary titles:

- The Boy Who Never Quit.
- Built in a Two-Car Garage.
- The Dream Was Enough.
- Champions Aren't Always Number One.
- From Local Kid to Factory Star.
- The Privateer Who Wouldn't Quit.

## Why
The documentary is the final reward for a lived motocross life. It should turn years of choices, memories, sacrifices, injuries, wins, losses, family moments, and garage objects into a personalized emotional recap.

## How
Create a design specification that includes:

- Documentary chapter structure from childhood through retirement.
- Memory selection rules for milestone, emotional intensity, family perspective, rivalry, injury, sacrifice, career turning point, and legacy.
- Title generation based on career arc, personality, reputation, results, and family story.
- Voice, tone, pacing, narration, interview, archival media, garage tour, and credits concepts.
- Handling for champion, local, privateer, family-first, tragic, comeback, and industry-builder careers.
- Integration with media articles, photos, clippings, garage museum objects, Hall of Fame, endings, and family memories.

## Definition of Done
- [ ] Documentary chapter list is documented.
- [ ] Memory and title selection rules are defined.
- [ ] Family, rival, sponsor, media, and garage museum content hooks are specified.
- [ ] Multiple career arcs are supported.
- [ ] Sample documentary outlines for at least three different careers are included.
- [ ] No gameplay implementation is included.

## Related Epic
EPIC: Documentary Legacy Recap Engine  
EPIC: Career Outcomes System  
EPIC: Family Life Engine  
EPIC: Garage Shop System

## Labels
`type: design`, `area: documentary`, `area: memory`, `area: legacy`, `priority: p0-critical`

# Issue: Update Design Decision Log

## What
Add the following design decisions to the design decision log:

- **DD-0021 — The World Must Evolve Without the Player**: The motocross world changes independently through riders, families, tracks, manufacturers, economy, weather, and opportunities.
- **DD-0022 — Reputation Is Group-Specific**: The rider does not have one universal reputation. Different groups remember and judge the rider differently.
- **DD-0023 — Careers Need Meaningful Endings Beyond Pro Success**: Every career ending should be valid if it reflects the life the rider lived.
- **DD-0024 — Documentary Is the Final Reward**: The career documentary is one of the primary rewards for completing a life, not a bonus feature.

## Why
These decisions formalize the next major simulation philosophy for **Motocross: Chasing the Dream**. They protect the design principles that the world does not revolve around the player, memories matter more than rewards, decisions echo, and every rider leaves a legacy.

## How
Create or update the appropriate design decision log entry with:

- Decision ID.
- Decision title.
- Status.
- Context.
- Decision.
- Consequences.
- Systems affected.
- Links to related issue drafts in this file.

## Definition of Done
- [ ] DD-0021 is drafted with context, decision, consequences, and affected systems.
- [ ] DD-0022 is drafted with context, decision, consequences, and affected systems.
- [ ] DD-0023 is drafted with context, decision, consequences, and affected systems.
- [ ] DD-0024 is drafted with context, decision, consequences, and affected systems.
- [ ] Related issue drafts are referenced.
- [ ] No gameplay implementation is included.

## Related Epic
EPIC: Design Documentation  
EPIC: Dynamic Community Engine  
EPIC: Career Outcomes System  
EPIC: Documentary Legacy Recap Engine

## Labels
`type: documentation`, `area: gdd`, `priority: p1-high`
