# Epic Index: Motocross: Chasing the Dream

This index organizes GitHub planning epics for Motocross: Chasing the Dream by Legacy Studios. It is documentation only, does not implement gameplay, and does not require GitHub API usage.

## Project Principles
- Every rider has a story. Chase yours.
- Build memories, not mechanics.
- People before players.
- Memories matter more than rewards.
- Authenticity before convenience.
- The world does not revolve around the player.
- Everything has history.
- Decisions echo.
- Respect the family.
- Design for emotion.
- Leave a legacy.

## Recommended Implementation Priority

| Priority | Epic | Purpose | Rationale |
| --- | --- | --- | --- |
| 1 | [Calendar Time Engine](epics/13_calendar_time_engine.md) | Plans days, weeks, seasons, school years, birthdays, deadlines, aging, and dated history. | Time is the backbone that lets decisions echo across every other system. |
| 2 | [Dynamic Community Engine](epics/09_dynamic_community_engine.md) | Plans persistent riders, families, mechanics, promoters, coaches, sponsors, rumors, and independent lives. | Community context ensures the world does not revolve around the player. |
| 3 | [Family Life Engine](epics/02_family_life_engine.md) | Plans household relationships, sacrifice, support, conflict, finances, and life around racing. | Family is core to motocross authenticity and emotional stakes. |
| 4 | [Competition Engine](epics/01_competition_engine.md) | Plans race weekends, classes, standings, rivalries, pressure, and memorable competitive outcomes. | Racing is the public stage where preparation, family sacrifice, venues, and community history collide. |
| 5 | [Track Venue System](epics/07_track_venue_system.md) | Plans tracks, venues, surfaces, weather, local culture, and place-based memories. | Priority 5 balances foundational dependencies with emotional storytelling needs. |
| 6 | [Personality Identity Engine](epics/10_personality_identity_engine.md) | Plans rider values, style, rituals, fear, confidence, reputation, and self-expression. | Priority 6 balances foundational dependencies with emotional storytelling needs. |
| 7 | [Training Practice Engine](epics/06_training_practice_engine.md) | Plans practice plans, coaching, growth, confidence, fatigue, slumps, and breakthroughs. | Priority 7 balances foundational dependencies with emotional storytelling needs. |
| 8 | [Education School Engine](epics/15_education_school_engine.md) | Plans school schedules, grades, homework, teachers, friends, absences, and eligibility. | Priority 8 balances foundational dependencies with emotional storytelling needs. |
| 9 | [Bike Ownership System](epics/04_bike_ownership_system.md) | Plans buying, selling, borrowing, inheriting, valuing, and remembering motorcycles. | Priority 9 balances foundational dependencies with emotional storytelling needs. |
| 10 | [Garage Shop System](epics/03_garage_shop_system.md) | Plans garage spaces, local shops, parts planning, workbench identity, and visible memory objects. | Priority 10 balances foundational dependencies with emotional storytelling needs. |
| 11 | [Mechanics Maintenance Engine](epics/05_mechanics_maintenance_engine.md) | Plans wear, setup, repairs, mechanic trust, mechanical risk, and lessons learned. | Priority 11 balances foundational dependencies with emotional storytelling needs. |
| 12 | [Injury Recovery Engine](epics/14_injury_recovery_engine.md) | Plans injury, medical guidance, recovery, fear, family concern, missed time, and comeback stories. | Priority 12 balances foundational dependencies with emotional storytelling needs. |
| 13 | [Opportunity Engine](epics/08_opportunity_engine.md) | Plans sponsors, rides, tryouts, jobs, mentorship, favors, and chance encounters. | Priority 13 balances foundational dependencies with emotional storytelling needs. |
| 14 | [Commentary Engine](epics/11_commentary_engine.md) | Plans context-aware race, community, and legacy commentary that references accumulated history. | Priority 14 balances foundational dependencies with emotional storytelling needs. |
| 15 | [Documentary Legacy Recap Engine](epics/12_documentary_legacy_recap_engine.md) | Plans season, milestone, family, career, and community recaps built from remembered events. | Priority 15 balances foundational dependencies with emotional storytelling needs. |
| 16 | [Career Outcomes System](epics/16_career_outcomes_system.md) | Plans amateur, pro, privateer, mechanic, coach, family, retirement, comeback, and legacy outcomes. | Priority 16 balances foundational dependencies with emotional storytelling needs. |
| 17 | [Release Readiness](epics/17_release_readiness.md) | Plans App Store Version 1.0 launch scope, TestFlight beta, launch checklist, compliance, QA, telemetry, polish, and post-launch monitoring. | Priority 17 turns the planned systems into a stable, testable, App Store-ready core release. |

## Planning Notes
- Create one GitHub epic or parent issue from each epic file.
- Use each `Child Issues` section to seed scoped planning issues.
- Keep implementation tasks separate until design dependencies and emotional goals are clear.

## Issue Draft Index

| Draft File | System | Purpose | Related Epics |
| --- | --- | --- | --- |
| [09_age_responsibility_progression_issues.md](issues/09_age_responsibility_progression_issues.md) | Age & Responsibility Progression System | Drafts design/documentation issues for age bands, action permissions, trust modifiers, jobs/chores, phone and marketplace access, parent approval, age-based UI visibility, memory hooks, and DD-0019. | Career Progression; Family & Economy Engine; Relationship Engine; Phone / Internet UI; Memory Engine; Parent Campaign; Rider Campaign |
| [10_friends_leaderboards_connected_careers_issues.md](issues/10_friends_leaderboards_connected_careers_issues.md) | Friends, Connected Careers, and Leaderboard System | Drafts design/documentation issues for the phone-based friends system, connected career profile cards, story-first leaderboards, career comparison, season recap sharing, career documentary sharing, asynchronous friend notifications, privacy controls, friend world cameos, and DD-0020. | Phone / Internet UI; Career Outcomes System; Documentary Legacy Recap Engine; Memory Engine; Dynamic Community Engine; Social Layer |
| [12_human_development_sport_evolution_history_issues.md](issues/12_human_development_sport_evolution_history_issues.md) | Human Development, Sport Evolution, and Motocross History Systems | Drafts design/documentation issues for human development, injury/medical depth, school, nutrition/fitness, crew management, travel/camping, race day routine, local track community, equipment wear, family tree, contracts, dynamic goals, AI coach, pit atmosphere, sport evolution, era selection, motocross history, and DD-0025 through DD-0028. | Human Development; Injury Recovery Engine; Education School Engine; Family Life Engine; Competition Engine; Track Venue System; Garage Shop System; Opportunity Engine; Training Practice Engine; Career Outcomes System; Marketplace; History; Memory Engine; World |
| [14_release_readiness_issues.md](issues/14_release_readiness_issues.md) | Release Readiness | Drafts launch planning issues for App Store Version 1.0, TestFlight, core career-loop verification, save/load validation, UI polish, compliance, telemetry, App Store assets, final launch checklist, and post-launch monitoring. | Core Simulation Engine; Calendar & Time Engine; Competition / Race Engine; Garage & Property System; Phone / Internet UI; Marketplace Engine; Memory Engine; Career Progression; App Store / Deployment |
