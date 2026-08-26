# Road to Loretta's — 2026 Qualification Structure

This document is the research-backed source of truth for the game's Road to Loretta's model.

> **Principle:** Loretta's is a qualification journey, never a normal selectable race. The player earns each next step.

## Official 2026 path

The AMA Amateur National Motocross Championship uses a two-step qualifying program before the National:

1. **Area Qualifier**
2. **Regional Championship**
3. **Loretta Lynn's National** — only after Regional qualification

Riders may attempt **as many Area Qualifiers, in as many regions, as they choose**. Advancing from an Area earns access to the Regional Championship for that same region. A rider can therefore keep multiple regional paths alive if time, budget, class eligibility, and the calendar allow it.

### Eight regions

- Northeast
- Southeast
- Mid-East
- North Central
- South Central
- Northwest
- Mid-West
- Southwest

### 2026 guaranteed advancement positions

| Region | Area -> Regional | Regional -> National |
| --- | ---: | ---: |
| Northeast | 9 | 6 |
| Southeast | 9 | 6 |
| Mid-East | 9 | 6 |
| North Central | 9 | 6 |
| South Central | 9 | 6 |
| Northwest | 10 | 4 |
| Mid-West | 12 | 4 |
| Southwest | 12 | 4 |

The game must **not** use one universal Top-9/Top-6 rule.

### Moto format

- Area Qualifiers: 2 motos.
- Most Regional Championships: 3 motos.
- Northwest, Mid-West, and Southwest are combined Amateur/Youth Regionals in 2026 and use the combined Regional format modeled as 2 motos.
- Loretta Lynn's National: 3 motos.

A rider must receive a numeric finish in at least one moto at an Area Qualifier to advance to a Regional, and in at least one Regional moto to advance to the National.

### Multiple Regional qualifications

If a rider qualifies for the National from multiple Regionals:

1. Use the rider's **home region** if the rider qualified there.
2. If the rider did not qualify in the home region, use the region with the **better Regional finish**.
3. If finishes are equal, use the region in which the rider **qualified first**.

This matters because the unused qualification position in another region moves down to another racer.

### Registration and timing

Regional qualification does not mean the family can ignore registration. Riders must pre-register for the Regional by the deadline to keep a guaranteed position. For the published 2026 Regional registration schedule, deadlines are the Monday before the event.

The 2026 National is at Loretta Lynn's Ranch in Hurricane Mills, Tennessee, **August 3–8, 2026**.

Regional events run from late May through late June in 2026. The calendar must represent Area Qualifiers, Regionals, deadlines, and the National on real dates/months rather than a generic weekly progression.

### Current age constraints modeled

The full AMA class matrix remains event data, but the current simplified game supports two explicit 2026 constraints:

- Rider must be at least **14** on the Area Qualifier date to ride a 250cc machine.
- Rider must be at least **12** on the Area Qualifier date to ride Supermini.
- Riders under 18 require a parent present or applicable parental consent under the official rules.

## Game implementation

Rules live in `src/systems/lorettasRules2026.js`.

Career-path state lives in `src/systems/lorettasPath.js`.

### Per-class state

Each class tracks:

- all Area attempts
- Area-qualified regions
- Regional attempts
- Regional-qualified regions
- home region
- selected National source region
- National qualification
- best National result
- milestones/memories

This is intentionally per class because motocross careers are nonlinear. Winning Loretta's on a 50 does not make a rider automatically successful on a 65.

### Eligibility behavior

- An Area Qualifier can be entered in any valid region if the rider/class is eligible.
- A Regional can only be entered after Area advancement **in that same region**.
- The National stays locked until at least one Regional qualification is earned.
- Multiple Area regions are valid and should not generate a planner warning.
- Planned Regionals without an earlier same-region Area path should generate a high-severity warning.

### Failure behavior

Missing an Area or Regional transfer is not a career progression wall. The player can:

- try another eligible Area Qualifier if the calendar still permits
- use another already-earned Regional path
- focus on local racing
- train
- save money
- reconsider class/bike strategy

Failure remains part of the story, not a reason for the game to force upward progression.

## Official sources

- MX Sports 2026 Supplemental Rules: https://mxsports.com/supplemental-rules
- MX Sports — How to Qualify: https://mxsports.com/how-to-qualify
- 2026 Area Qualifier and Regional Championship dates: https://mxsports.com/2025/12/11/2026-ama-amateur-national-motocross-area-qualifier-and-regional-championship-dates
- 2026 Regional Championship registration: https://mxsports.com/2026/04/01/2026-regional-championship-registration-now-open
- 2026 National registration: https://mxsports.com/2026/06/30/national-registration-is-open-for-45th-annual-ama-amateur-national-motocross-championship

## Still deferred

These should remain explicit follow-on work rather than being guessed:

- complete 2026 AMA National class matrix and every class-specific age/displacement rule
- alternate registration and Power Ranking mechanics
- detailed class caps per day in UI
- every published 2026 Area Qualifier and Regional as production content
- historical rule sets for future era modes
