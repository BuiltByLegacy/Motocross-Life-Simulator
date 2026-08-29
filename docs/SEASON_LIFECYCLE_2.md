# Season Lifecycle 2.0

Issues: #366–#372  
Visual contract: #362

## Purpose

A season is a chapter in the rider's life, not a reset button or twelve disconnected race weeks.

Season Lifecycle 2.0 connects the opening financial/family reality, preseason sponsorship, the season board, in-season opportunities, major pivots, and the closing review into one persistent arc.

## Lifecycle

1. **Season Brief** — where the rider, family, bike, money and support stand now.
2. **Season Posture** — Build Year, Push Year, Breakout Year, Recovery Year or Privateer Grind.
3. **Family Plan** — what the household is willing to spend, travel and sacrifice.
4. **Season Board** — tentative races and open life periods.
5. **Preseason Sponsorship** — belief/support secured before the rider proves the year.
6. **Season Lock** — the opening plan becomes the baseline, not an immutable destiny.
7. **In-season market** — results, reputation, visibility and professionalism can create new support.
8. **Season Check-ins** — material life changes can justify revising future commitments.
9. **Season Review** — planned year versus lived year.
10. **Carryover** — money, reputation, bike/body condition, sponsor interest and unresolved obligations become next year's starting context.

## Season Brief

The brief is a family/workbench conversation rather than a dashboard. It derives from the current save and answers:

- Who is the rider this year: age, class, number and region?
- How much cash is available?
- What does the opening race plan cost?
- How much confirmed sponsor support exists?
- What funding gap remains?
- What condition are the bike and rider in?
- What sponsor obligations already need attention?
- What can realistically derail this year?

The game recommends a posture, but the player may choose a different one.

## Family Plan

The Family Plan exists because a youth motocross season is also a household decision. It persists season-level guardrails including maximum spend, long-travel tolerance, school/family priority, debt stance, equipment stance, parent sacrifice and Loretta intent.

A calendar may exceed those guardrails, but the game must make that trade visible instead of silently assuming infinite money, time or family tolerance.

## Preseason versus in-season support

Preseason sponsorship answers: **Who believes in this program before this season is proven?**

In-season sponsorship answers: **Who is paying attention to what this rider is becoming?**

Market value is deterministic and derives from results, reputation, visibility, professionalism, obligation compliance, major qualification, win momentum and conduct. Thresholds can create local-shop, dealer, regional-team and manufacturer-amateur opportunities.

A midseason offer can bring cash, product, travel help and discounts, but it can also add graphics, product-use, attendance and conduct obligations. Youth support remains guardian-approved.

Repeated poor results do not automatically terminate a relationship. Sponsor outcomes should also consider professionalism, compliance, visibility, conduct and fit.

## Season Check-ins and calendar pivots

A season check-in is reserved for material changes, not weekly noise. Current trigger families include major qualification, breakout results, injury, financial pressure, bike crisis and major support escalation.

Check-ins may recommend protecting/revising the plan or expanding it. Completed history is never rewritten. Only future commitments should change, and sponsorship/budget implications should be re-evaluated after the pivot.

## Season Review

The closing review mirrors the opening brief:

- What did we think this year would be?
- How many races, wins, podiums and DNFs actually happened?
- What did it cost relative to the plan?
- Which sponsor relationships changed?
- Which risks became real?
- What happened to the bike, rider and family?
- What major memories or opportunities were created?
- What carries into next year?

The review is stored as history rather than discarded when the next season begins.

## Persistence contract

Lifecycle state lives under `game.state.seasonLifecycle` and is intentionally serializable with the rest of the career save. The next season retains historical reviews and carryover while creating a fresh opening brief/posture/Family Plan decision.

Sponsorship contracts and obligations continue to use Sponsorship 2.0 as their operational source of truth. Season Lifecycle owns the broader narrative/strategic framing and records in-season sponsor decisions without duplicating race-engine math.

## UI contract

Follow #362: **World first. UI second.**

- Season Brief = family race-year planning meeting.
- Calendar = season board.
- Sponsor breakthrough = somebody in the motocross world noticed.
- Midseason review = consequential check-in.
- Season Review = closing the year's record book and carrying its consequences forward.

Do not turn these flows back into a permanent stat grid or generic card wall.