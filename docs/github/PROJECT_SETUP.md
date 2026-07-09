# GitHub Project Setup

Use this guide to configure Issues and Projects for design-driven work.

## Issue forms

The repository includes issue forms for bugs, features, design tasks, epics, research tasks, and implementation tasks. Prefer forms over blank issues so every issue includes enough context to act on.

## Suggested project columns

1. Inbox
2. Needs Research
3. Needs Design
4. Ready
5. In Progress
6. Review
7. Done
8. Blocked

## Suggested custom fields

- **Type:** Epic, Research, Design, Implementation, Bug, Tech Debt
- **Area:** Simulation, Career, Family, Racing, Marketplace, UI, Docs, Tooling
- **Priority:** Critical, High, Medium, Low
- **Milestone:** Delivery grouping from `MILESTONES.md`
- **Owner:** Person or agent responsible for next action

## Workflow recommendations

- Triage new issues before implementation begins.
- Split broad ideas into research, design, and implementation issues.
- Keep epics as parent issues with linked child task lists.
- Move issues to Ready only when Definition of Done and testing expectations are clear.
- Close issues only after acceptance criteria are verified.
## Social planning references

The Friends, Connected Careers, and Leaderboard System issue drafts introduce the asynchronous multiplayer/social layer for the project. Use `docs/github/issues/10_friends_leaderboards_connected_careers_issues.md` when triaging design work for:

- Friends System in the in-game phone app.
- Connected Careers profile cards and career comparison.
- Story-first leaderboards that value outcomes, memories, garage value, sponsors, injuries, fan following, and legacy.
- Career Sharing through season recaps and final career documentaries.
- Asynchronous multiplayer/social layer features such as friend notifications and optional world cameos.

These drafts are documentation only and should not be treated as approval to implement gameplay, live multiplayer, backend services, or GitHub API automation.

## Human Development, Sport Evolution, and History planning references

The Human Development, Sport Evolution, and Motocross History issue drafts in `docs/github/issues/12_human_development_sport_evolution_history_issues.md` introduce the next major design systems for the project. Use these drafts when triaging design work for:

- Human Development Engine
- Injury & Medical System
- Education & School System
- Nutrition & Fitness System
- Crew Management
- Travel & Camping
- Race Day Routine
- Local Track Community
- Equipment Wear
- Family Tree
- Contracts & Negotiation
- Dynamic Goals
- AI Coach
- Pit Atmosphere
- Sport Evolution
- Era Selection
- Motocross History

These drafts are documentation only and should not be treated as approval to implement gameplay, call the GitHub API, or create real GitHub issues directly. They also reinforce the design direction that sport changes should be gradual and authentic rather than disruptive random annual rule changes.

## Release Readiness planning references

The Release Readiness epic and issue drafts prepare **Motocross: Chasing the Dream** for App Store Version 1.0. Use `docs/github/epics/17_release_readiness.md` and `docs/github/issues/14_release_readiness_issues.md` when triaging work for:

- App Store Version 1.0 launch scope and non-goals.
- TestFlight internal and external beta planning.
- Launch checklist, App Store assets, privacy/compliance, and final submission readiness.
- Core career-loop, save/load, performance, accessibility, audio, balance, and UI polish validation.
- Crash reporting, analytics, bug bash, and post-launch monitoring.

These drafts are documentation only and should not be treated as approval to implement gameplay, call the GitHub API, or create real GitHub issues directly.

## Monetization Strategy planning references

The Monetization Strategy issue drafts in `docs/github/issues/15_monetization_strategy_issues.md` define how **Motocross: Chasing the Dream** can support sustainable monetization without allowing purchases to determine competitive success. Use these drafts when triaging design work for:

- Monetization Strategy
- Legacy Coins
- Cash vs Legacy Coins economy separation
- Cosmetic Shop
- Rewarded Ads
- Legacy Membership
- Paid Expansions
- Legacy Collections
- Seasonal Legacy Challenges
- IAP Guardrails
- Monetization UI in the phone app, garage catalog, museum catalog, profile customization, documentary customization, and Legacy Shop

These drafts are documentation only and should not be treated as approval to implement payments, implement ads, create gameplay systems, call the GitHub API, or create real GitHub issues directly. They reinforce the rule that purchases cannot buy race wins, rider stats, better bikes, better parts, Loretta qualification, injury immunity, sponsor advantages, or any other competitive shortcut.

## Version 1.0 scope and roadmap planning references

The Version 1.0 Scope, Roadmap, and MVP Cutline issue drafts in `docs/github/issues/16_v1_scope_roadmap_mvp_cutline_issues.md` should be used when sorting GitHub Projects into **v1.0 / later / someday**. Prioritize these planning anchors during triage:

- v1.0 Scope
- MVP Cutline
- Vertical Slice
- Launch Non-Goals
- Version Roadmap

These drafts are documentation only and should not be treated as approval to implement gameplay, call the GitHub API, create real GitHub issues directly, or delete existing planned issues.

## Living Garage System planning references

The Living Garage System issue drafts in `docs/github/issues/17_living_garage_system_issues.md` reframe the garage from an abstract inventory menu into the player's living home hub, workshop, storage space, museum, and physical interface. Use these drafts when triaging design work for:

- Living Garage System
- Physical inventory (shelves, bins, racks, hooks, stands, display cases)
- Bike display and interaction
- Parts shelves and component storage
- Garage clutter and capacity
- Garage upgrades and expansion
- Garage museum and memory display
- Family and social interactions in the garage
- Garage arrival flow for purchased items
- Garage UI navigation (the garage as a physical menu)
- Garage visual states over time
- Garage persistence and save data
- Minimum Living Garage for v1.0
- DD-0036, DD-0037, DD-0038

These drafts are documentation only and should not be treated as approval to implement gameplay, call the GitHub API, create real GitHub issues directly, or delete existing planned issues.

## P0 Calendar, Loretta, Marketplace & Season-Flow fix planning references

The P0 fix issue drafts in `docs/github/issues/18_p0_calendar_loretta_marketplace_fixes.md` capture urgent, high-priority corrections to core loops. Use these drafts when triaging critical fixes for:

- Parent-controlled marketplace/dealer purchases and bike repairs for young riders
- Correcting the Loretta Lynn's qualification structure (Area Qualifiers → Regional Championships → National), including research and citation
- Changing the calendar from a week view to a month-based season calendar
- Safe mid-season schedule editing that never traps the player or hides "Go Racing"
- Calendar and season-flow regression tests

These drafts are documentation only and should not be treated as approval to implement gameplay, call the GitHub API, create real GitHub issues directly, or delete existing planned issues.
