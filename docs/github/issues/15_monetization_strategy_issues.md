# Monetization Strategy Issue Drafts

These GitHub issue drafts are for **Motocross: Chasing the Dream** by **Legacy Studios**.

**Tagline:** Every rider has a story. Chase yours.

**Core monetization principle:** Monetization must never determine competitive success. Players earn racing achievements through skill, planning, and decision-making. Purchases provide personalization, collectibles, convenience, and additional content—not better performance.

These drafts are documentation only. They do not implement payments, ads, gameplay, App Store purchases, subscriptions, backend services, or real GitHub issues.

# Issue: Design Monetization Strategy
## What
Define the overall monetization model for Motocross: Chasing the Dream.

The strategy should support a sustainable long-term game while protecting the core fantasy that racing success is earned through skill, planning, sacrifice, and decisions. The model should account for:

- A free or low-cost core app option.
- In-game earned currency for the racing life simulation.
- Premium currency for optional personalization and celebration.
- Optional rewarded ads.
- Cosmetic shop.
- Legacy Membership.
- Paid expansions.
- A strict no pay-to-win rule.
- No paid race advantage.
- No purchased Loretta qualification.
- No purchased injury immunity.
- No purchased stat boosts.

## Why
Motocross: Chasing the Dream is built around the emotional authenticity of growing up in motocross. Players should believe that every trophy, qualification, injury comeback, sponsor opportunity, and career milestone came from their rider's choices and story—not from spending money.

A documented monetization strategy prevents future systems from drifting into competitive advantage, protects player trust, and gives future Claude/Codex implementation work clear boundaries before any store, currency, or live-service feature is considered.

## How
Create a monetization design document that defines:

- The core app pricing approach and what the base player experience includes.
- The relationship between simulation cash, Legacy Coins, optional ads, memberships, and expansions.
- Which systems may reference monetization surfaces.
- Which systems must never reference monetization surfaces.
- A plain-language player promise stating that purchases do not buy performance or racing outcomes.
- Examples of allowed purchases, such as cosmetics, collectibles, profile customization, documentary themes, garage decorations, museum displays, and content expansions.
- Examples of prohibited purchases, including bikes, parts, rider stats, race wins, sponsor advantages, injury immunity, and Loretta qualification.
- Review checklist for future economy, store, UI, and content work.

## Definition of Done
- A monetization strategy document exists in the design documentation.
- The no pay-to-win principle is explicitly stated.
- Paid race advantages are explicitly forbidden.
- Purchased Loretta qualification is explicitly forbidden.
- Purchased injury immunity is explicitly forbidden.
- Purchased stat boosts are explicitly forbidden.
- The relationship between core app access, earned currency, premium currency, rewarded ads, cosmetics, membership, and expansions is documented.
- Future implementation tasks can reference this strategy without needing to invent monetization rules.

## Related Epic
Monetization Strategy

## Labels
type: design, area: monetization, area: economy, priority: p0-critical

# Issue: Design Legacy Coins Premium Currency
## What
Design **Legacy Coins** as the premium currency for Motocross: Chasing the Dream.

Legacy Coins may be:

- Earned through career milestones.
- Earned by winning championships.
- Earned by finishing careers.
- Earned through Legacy Challenges.
- Earned through optional rewarded ads.
- Purchased with real money.

Legacy Coins may be spent on:

- Garage cosmetics.
- Museum displays.
- Phone themes.
- Rider profile customization.
- Documentary themes.
- Photo mode items.
- Decorative memorabilia.
- Seasonal cosmetic collections.

Legacy Coins cannot be spent on:

- Bikes.
- Performance parts.
- Rider stats.
- Race results.
- Injury recovery.
- Sponsor boosts.
- Loretta qualification.
- Cash simulation money.

## Why
Legacy Coins give the game a monetization path that celebrates the player's story without changing competitive outcomes. They should feel like a way to personalize and commemorate a career, not a way to skip the struggle or buy success.

Because Legacy Coins can be earned or purchased, they need strong rules before any economy implementation begins.

## How
Draft a Legacy Coins design specification that includes:

- Currency purpose and player-facing description.
- Earn sources tied to meaningful career and legacy moments.
- Optional rewarded ad earning rules.
- Real-money purchase boundaries.
- Spend categories limited to cosmetic, profile, decorative, and commemorative content.
- Explicit list of banned spend categories.
- UI copy guidance that avoids pressure, gambling language, deceptive urgency, or competitive framing.
- Economy review checklist to verify Legacy Coins never convert into simulation cash or performance.

## Definition of Done
- Legacy Coins have a clear design definition.
- Earned and purchased sources are documented.
- Allowed spending categories are documented.
- Prohibited spending categories are documented.
- The design explicitly prevents Legacy Coins from affecting bikes, parts, rider performance, injury recovery, sponsor outcomes, race results, Loretta qualification, or simulation cash.
- Future store, phone, garage, museum, profile, and documentary customization work can reference the rules.

## Related Epic
Monetization Strategy

## Labels
type: design, area: monetization, area: economy, area: cosmetics, priority: p0-critical

# Issue: Design Cash vs Legacy Coins Separation
## What
Define the separation between simulation cash and Legacy Coins.

Cash is part of the racing life simulation. Cash is earned from:

- Jobs.
- Parents.
- Sponsors.
- Race winnings.
- Selling bikes.
- Selling parts.
- Marketplace sales.

Cash is used for:

- Bikes.
- Parts.
- Fuel.
- Entry fees.
- Hotels.
- Food.
- Gear.
- Travel.
- Repairs.
- Real garage/shop upgrades.

Legacy Coins are used only for cosmetics, profile items, decorative content, and optional non-performance customization.

## Why
The game needs an economy that feels authentic to motocross life. Cash pressure, family support, job income, sponsor help, travel costs, entry fees, and repair bills are part of the simulation. Premium currency must not distort that simulation or let players buy their way around meaningful racing-life decisions.

A strict currency separation protects the integrity of the career mode and reduces future design ambiguity.

## How
Create an economy separation document that defines:

- Simulation cash purpose.
- Simulation cash earn sources.
- Simulation cash spend categories.
- Legacy Coins purpose.
- Legacy Coins earn and purchase sources.
- Legacy Coins spend categories.
- Prohibited conversions between the currencies.
- UI naming conventions to keep the currencies visually and narratively distinct.
- Examples of invalid economy flows, such as buying Legacy Coins and converting them into bike money, parts money, sponsor boosts, or repair skips.

## Definition of Done
- Cash is documented as the racing life simulation currency.
- Legacy Coins are documented as the personalization and celebration currency.
- Cash earn and spend categories are listed.
- Legacy Coin spend boundaries are listed.
- The design explicitly prevents premium currency from purchasing simulation cash.
- The marketplace, garage, sponsor, race, family, and travel systems have clear economy boundaries to reference.

## Related Epic
Monetization Strategy

## Labels
type: design, area: monetization, area: economy, area: marketplace, priority: p0-critical

# Issue: Design Cosmetic Garage and Museum Shop
## What
Design the cosmetic shop for garage, museum, profile, phone, and documentary personalization.

Purchasable cosmetics may include:

- Garage floor coatings.
- Cabinets.
- Toolboxes.
- Lighting.
- Pegboards.
- Trophy shelves.
- Display cases.
- Wall mounts.
- Posters.
- Banners.
- Museum plaques.
- Phone wallpapers.
- Profile banners.
- Documentary frames.

These items must not affect racing performance.

## Why
The garage and museum are natural places for players to express identity, history, fandom, and pride. A cosmetic shop can support the game financially while reinforcing the fantasy of building a motocross life and preserving memories.

The shop must be framed as personalization, not progression power.

## How
Draft a cosmetic shop design covering:

- Shop categories.
- Item rarity or collection language, if any, without gambling mechanics.
- Preview behavior for garage and museum items.
- Purchase flow using Legacy Coins where applicable.
- Earned cosmetic integration so the shop does not replace achievement-based unlocks.
- Visual rules for items that should feel diegetic, respectful, and story-aligned.
- Explicit statement that cosmetic shop items never change handling, bike stats, rider stats, sponsor chances, race results, or injury outcomes.

## Definition of Done
- Cosmetic shop categories are documented.
- Garage and museum personalization use cases are documented.
- Phone, profile, and documentary cosmetic use cases are documented.
- Performance impact is explicitly forbidden.
- Future UI and content tasks can build from the design without inventing monetization behavior.

## Related Epic
Monetization Strategy

## Labels
type: design, area: monetization, area: garage, area: cosmetics, priority: p1-high

# Issue: Design Rewarded Ads System
## What
Design an optional rewarded ads system.

Rules:

- No forced ads.
- No banner ads during gameplay.
- No interrupting race flow.
- Ads are optional.
- Rewards are cosmetic or Legacy Coins only.

Reward examples:

- Small Legacy Coin reward.
- Random garage decoration.
- Random phone wallpaper.
- Random vintage poster.
- Documentary frame.
- Cosmetic collectible.

## Why
Rewarded ads can provide an optional path for players who want small personalization rewards without spending money. However, ads can easily damage immersion, trust, and respect if they interrupt gameplay or feel coercive.

The design must ensure ads are opt-in, non-invasive, and never tied to competitive advantage.

## How
Create a rewarded ads design specification that includes:

- Eligible ad entry points, such as the phone app or Legacy Shop.
- Disallowed ad placements, including races, loading into races, post-crash moments, injury screens, and emotional story scenes.
- Reward categories limited to Legacy Coins or cosmetics.
- Frequency limits and cooldown recommendations.
- Player choice wording and decline behavior.
- Rules for ad unavailability.
- Privacy and age-appropriate considerations to hand off to compliance work.
- Testing checklist for ensuring ad prompts do not interrupt meaningful gameplay.

## Definition of Done
- Rewarded ads are documented as optional only.
- Forced ads are explicitly forbidden.
- Banner ads during gameplay are explicitly forbidden.
- Race-flow interruptions are explicitly forbidden.
- Rewards are limited to cosmetics or Legacy Coins.
- Future ad implementation tasks can reference placement, reward, frequency, and tone rules.

## Related Epic
Monetization Strategy

## Labels
type: design, area: monetization, area: ads, area: phone, priority: p1-high

# Issue: Design Legacy Membership
## What
Design an optional **Legacy Membership** subscription or membership concept.

Possible benefits:

- Monthly Legacy Coins.
- Exclusive cosmetics.
- Monthly memorabilia item.
- Early beta access.
- Extra garage decorations.
- Cloud save benefits if appropriate.
- Profile customization.
- Behind-the-scenes updates.

Rules:

- No competitive advantages.
- No stat boosts.
- No better parts.
- No easier racing outcomes.

## Why
Legacy Membership can create recurring support for the game while giving committed players a steady stream of personalization, collectibles, and community-aligned benefits. It must never make members better racers or give them superior outcomes.

Documenting the membership early keeps future subscription work aligned with the project's player-first monetization principle.

## How
Draft a membership design covering:

- Membership positioning and player-facing value proposition.
- Benefit categories that are allowed.
- Benefit categories that are forbidden.
- Monthly cadence and content planning expectations.
- How membership cosmetics differ from earned achievements.
- Subscription disclosure requirements to hand off to IAP compliance work.
- Cancellation, lapse, and entitlement behavior at a design level.
- Guidance that non-members still receive a complete, respectful core experience.

## Definition of Done
- Legacy Membership benefits are documented.
- Competitive advantages are explicitly forbidden.
- Stat boosts are explicitly forbidden.
- Better parts are explicitly forbidden.
- Easier racing outcomes are explicitly forbidden.
- Membership disclosure and entitlement questions are captured for future implementation and compliance tasks.

## Related Epic
Monetization Strategy

## Labels
type: design, area: monetization, area: membership, priority: p2-medium

# Issue: Design Paid Expansion Strategy
## What
Design the long-term paid expansion strategy.

Expansion examples:

- Florida Training Expansion.
- West Coast Expansion.
- Supercross Expansion.
- Vintage Era Expansion.
- Europe/MXGP Expansion.
- Amateur Nationals Expansion.
- Parent Mode Expansion.
- Factory Life Expansion.

Each expansion should add:

- New stories.
- New places.
- New events.
- New bikes/gear if licensed or fictionalized.
- New career paths.
- New memories.
- New replay value.

## Why
Paid expansions should extend the world, not sell shortcuts. They are an opportunity to deepen the player's motocross life with new places, eras, story arcs, events, and career paths while preserving the integrity of the core progression systems.

A documented expansion strategy helps future content planning avoid fragmenting competitive balance or locking core progression behind paid content.

## How
Create an expansion strategy document that defines:

- Expansion design principles.
- Example expansion themes and scope boundaries.
- Content categories expansions may include.
- Content categories expansions must avoid.
- How expansions interact with existing careers, saves, and memories at a design level.
- Rules for licensed vs fictionalized bikes, gear, brands, tracks, and organizations.
- Statement that expansions add stories, places, and replay value rather than competitive shortcuts.

## Definition of Done
- Paid expansion principles are documented.
- Example expansion themes are listed.
- Required content categories are described.
- Competitive shortcut restrictions are documented.
- Future content planning can estimate expansion scope from the issue.

## Related Epic
Monetization Strategy

## Labels
type: design, area: monetization, area: expansions, area: content, priority: p1-high

# Issue: Design Legacy Collections
## What
Design collectible cosmetic sets called **Legacy Collections**.

Collection examples:

- Honda-inspired collection.
- Yamaha-inspired collection.
- KTM-inspired collection.
- Loretta Lynn's collection.
- Vintage two-stroke collection.
- Factory garage collection.
- Pro race memorabilia collection.
- Regional track collection.

Collections may include:

- Posters.
- Jerseys.
- Number plates.
- Signed items.
- Brochures.
- Dealer signs.
- Trophy replicas.
- Garage displays.

Completing a collection may unlock a cosmetic display, badge, or documentary frame.

## Why
Collections let players celebrate motocross culture, personal history, brands, eras, tracks, and career memories without affecting competition. They can support long-term engagement and monetization while fitting naturally into garages, museums, profiles, and documentary recaps.

## How
Draft a Legacy Collections design specification that includes:

- Collection themes and naming rules.
- Item types and display locations.
- Completion reward rules.
- Earned, purchased, seasonal, and expansion-linked collection sources.
- Rules for brand-inspired content, fictionalization, and licensing review.
- No loot-box or gambling-style acquisition rules.
- Clear statement that collection completion rewards are cosmetic only.

## Definition of Done
- Legacy Collection themes are documented.
- Collection item types are documented.
- Completion reward types are documented.
- Cosmetic-only rules are documented.
- Licensing and fictionalization considerations are captured for future review.
- Future collection content tasks have enough detail to create scoped item sets.

## Related Epic
Monetization Strategy

## Labels
type: design, area: monetization, area: collectibles, area: garage, priority: p2-medium

# Issue: Design Seasonal Legacy Challenges
## What
Design optional recurring **Seasonal Legacy Challenges**.

Examples:

- Win 5 local races.
- Complete a career.
- Qualify for Regionals.
- Restore a vintage bike.
- Earn money from marketplace sales.
- Complete a season without missing a race.
- Finish a comeback after injury.
- Build a memorabilia collection.

Rewards:

- Legacy Coins.
- Cosmetics.
- Garage decorations.
- Profile badges.
- Documentary frames.

Rules:

- No required participation.
- No pay-to-win rewards.
- No punishment for missing challenges.

## Why
Seasonal challenges can encourage replayability and give players fresh goals while respecting the game's story-first identity. They should feel like optional celebrations of career accomplishments, not chores or fear-of-missing-out pressure.

## How
Create a Seasonal Legacy Challenges design document that defines:

- Challenge cadence options.
- Challenge categories tied to authentic motocross career actions.
- Reward categories.
- Rules for players who skip a season or join late.
- How challenges reference existing saves and careers without forcing restarts.
- Anti-FOMO tone and copy guidelines.
- No pay-to-win reward restrictions.
- No penalty rules for missed or incomplete challenges.

## Definition of Done
- Seasonal challenge examples are documented.
- Reward categories are documented.
- Participation is documented as optional.
- Pay-to-win rewards are explicitly forbidden.
- Punishment for missing challenges is explicitly forbidden.
- Future challenge implementation tasks can reference cadence, eligibility, reward, and tone guidance.

## Related Epic
Monetization Strategy

## Labels
type: design, area: monetization, area: challenges, area: replayability, priority: p1-high

# Issue: Design In-App Purchase Guardrails
## What
Design purchase safety and App Store compliance guardrails for any future monetization implementation.

Include:

- Clear price display.
- Restore purchases.
- Parental controls.
- Purchase confirmation.
- Subscription disclosure if membership exists.
- No deceptive timers.
- No manipulative paywalls.
- No gambling-style loot boxes.
- Privacy compliance.
- App Store review compliance.

## Why
The project needs explicit guardrails before any in-app purchase, membership, currency, or paid expansion implementation begins. Purchase flows must be transparent, respectful, age-appropriate, and compliant with platform requirements.

This issue is not permission to implement payments. It creates design and compliance criteria for future work.

## How
Draft an IAP guardrails document that covers:

- Purchase flow principles.
- Price display requirements.
- Restore purchase expectations.
- Confirmation and cancellation behavior.
- Parental control and age-appropriate purchase considerations.
- Subscription disclosure requirements for Legacy Membership.
- Prohibited monetization tactics.
- Privacy and data handling considerations.
- App Store review checklist.
- Required handoff points to legal/compliance before implementation.

## Definition of Done
- Purchase safety principles are documented.
- App Store compliance topics are listed.
- Restore purchase requirements are documented.
- Subscription disclosure requirements are documented if membership remains in scope.
- Deceptive timers, manipulative paywalls, and gambling-style loot boxes are explicitly forbidden.
- The document clearly states that this issue does not implement payments or create real store products.

## Related Epic
Monetization Strategy

## Labels
type: design, area: monetization, area: app-store, area: privacy, priority: p0-critical

# Issue: Design Monetization UI in Phone App
## What
Design how monetization appears in the game UI.

Monetization should be accessed through:

- Phone app.
- Garage catalog.
- Museum catalog.
- Profile customization.
- Documentary customization.
- Legacy Shop.

Do not make monetization feel like a pop-up casino.

Tone should be:

- Respectful.
- Optional.
- Clean.
- Non-invasive.
- Story-aligned.

## Why
The phone app and in-world catalogs are natural places to present optional personalization. Monetization UI should feel like part of the rider's life, not an external pressure system. A respectful UI protects immersion and trust.

## How
Create a monetization UI design brief that includes:

- Approved entry points.
- Disallowed pop-up and interruption patterns.
- Navigation rules for the Legacy Shop.
- How Legacy Coins, cosmetics, collections, ads, membership, and expansions may be surfaced.
- Copy tone examples.
- Accessibility and clarity considerations.
- Rules for avoiding casino-like presentation, excessive animation, aggressive urgency, and manipulative notification badges.
- Player settings or notification controls to consider in future implementation.

## Definition of Done
- Approved monetization UI entry points are documented.
- Pop-up casino-style presentation is explicitly forbidden.
- Tone guidance is documented.
- Phone, garage, museum, profile, documentary, and Legacy Shop surfaces are addressed.
- Future UI implementation tasks can reference the design for placement, copy, and behavior.

## Related Epic
Monetization Strategy

## Labels
type: design, area: monetization, area: phone, area: ui, priority: p1-high

# Issue: Update Design Decision Log
## What
Add the following design decisions to the Design Decision Log:

**DD-0031 — Monetization Must Never Determine Competitive Success**

Purchases cannot buy race wins, rider stats, better bikes, better parts, Loretta qualification, injury immunity, or sponsor advantages.

**DD-0032 — Legacy Coins Are for Personalization and Celebration**

Legacy Coins may be earned or purchased but are used only for cosmetics, collectibles, profile customization, documentary themes, and non-performance personalization.

**DD-0033 — Ads Are Optional and Reward-Based**

The game may include rewarded ads, but not forced ads, banner ads, or interruptions during meaningful gameplay.

**DD-0034 — Paid Expansions Add Stories, Not Shortcuts**

Expansions should add regions, eras, events, career paths, and story content, not shortcuts to success.

## Why
These design decisions preserve the core monetization principle in a durable place where future design, economy, UI, and implementation work can reference it. The monetization model affects many systems, so the key rules need to be recorded as high-level project decisions.

## How
Update the design decision log by adding DD-0031 through DD-0034 with:

- Decision title.
- Decision statement.
- Rationale.
- Systems affected.
- Prohibited behavior.
- Follow-up issue references to the monetization strategy, Legacy Coins, rewarded ads, expansions, and IAP guardrails drafts.

## Definition of Done
- DD-0031 is added and forbids purchases from affecting competitive success.
- DD-0032 is added and limits Legacy Coins to personalization and celebration.
- DD-0033 is added and documents ads as optional and reward-based only.
- DD-0034 is added and frames paid expansions as story/content additions rather than shortcuts.
- The decisions are easy for future Claude/Codex work to find and reference.

## Related Epic
Monetization Strategy

## Labels
type: documentation, area: gdd, area: monetization, priority: p1-high
