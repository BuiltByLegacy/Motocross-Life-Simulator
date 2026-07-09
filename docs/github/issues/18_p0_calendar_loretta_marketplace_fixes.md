# P0 Calendar, Loretta, Marketplace & Season-Flow Fix Drafts

Documentation-only GitHub issue drafts for urgent (P0) fixes to the calendar, the Road to Loretta's qualification structure, parent-controlled marketplace/repairs for young riders, and mid-season schedule editing in **Motocross: Chasing the Dream**. These drafts are self-contained so they can be copied into GitHub issues later without calling the GitHub API or implementing gameplay.

## Draft Index

1. Fix Parent Marketplace and Bike Repair Behavior for Young Riders
2. Research and Correct Loretta Lynn's Qualification Structure
3. Change Calendar From Week View to Month-Based Season Calendar
4. Fix Mid-Season Schedule Editing So Player Cannot Get Stuck
5. Add Calendar Regression Tests for Season Flow

---

# Issue: Fix Parent Marketplace and Bike Repair Behavior for Young Riders

## What
When the rider is young, parents should be able to handle marketplace/dealer purchases and bike repairs on the rider's behalf.

## Why
Young riders should not manage marketplace purchases directly, but the bike still needs to be maintained, repaired, and upgraded. If parents control the money and decisions, they also need behavior that buys parts, schedules repairs, and keeps the program running.

## How
Design a parent-controlled purchase/repair flow:

- Parent checks bike readiness before upcoming events.
- Parent identifies needed parts.
- Parent chooses dealer, used marketplace, shop repair, or skip/repair later.
- Parent approval depends on budget, stress, trust, importance of the upcoming event, and bike condition.
- Purchased parts arrive in the garage.
- Parent/mechanic installs parts if skill/tools are available.
- If not repaired, race-readiness warnings appear.

## Definition of Done
- [ ] Parent purchase flow is defined.
- [ ] Parent repair decision logic is defined.
- [ ] Young-rider restrictions remain intact.
- [ ] Bike readiness can trigger parent marketplace/dealer actions.
- [ ] Repair outcomes update garage, bike condition, money, and calendar.
- [ ] GDD / issue index updated.

## Related Epic
EPIC: Age & Responsibility Progression
EPIC: Marketplace Engine
EPIC: Garage & Shop System
EPIC: Mechanics & Maintenance Engine

## Labels
type: design, area: family, area: marketplace, area: garage, priority: p0-critical

---

# Issue: Research and Correct Loretta Lynn's Qualification Structure

## What
Loretta's must be corrected to follow the real qualification structure:
Area Qualifiers → Regional Championships → Loretta Lynn National.

## Why
Loretta's is one of the most important goals in the game. It cannot behave like a normal selectable race. Riders must qualify through the correct path. Only the best riders in each class earn an invitation to the national event.

## How
Create a research-backed design update using current official sources where possible.

Research:

- Area Qualifier process.
- Regional Championship process.
- National event qualification.
- Class eligibility.
- Region assignment.
- Deadlines.
- How many Area Qualifiers can be attempted.
- Whether riders can qualify in multiple classes.
- How alternates/backups work.
- Moto formats.
- Real-world calendar timing.

Update the existing Road to Loretta's design with:

- Qualification states.
- Area Qualifier event type.
- Regional Championship event type.
- National invite/entry state.
- Failed qualification paths.
- Player-facing explanation.

## Definition of Done
- [ ] Official/current Loretta process researched and cited in docs.
- [ ] Area Qualifier event type exists in design.
- [ ] Regional Championship event type exists in design.
- [ ] Loretta National is locked unless qualified.
- [ ] Failed qualifier outcomes are defined.
- [ ] Qualification state machine is documented.
- [ ] Existing inaccurate Loretta docs/issues are updated.

## Related Epic
EPIC: Road to Loretta's
EPIC: Calendar & Time Engine
EPIC: Season Planner

## Labels
type: research, type: design, area: loretta, area: calendar, priority: p0-critical

---

# Issue: Change Calendar From Week View to Month-Based Season Calendar

## What
Update the calendar design so players see months, not just generic weeks.

## Why
Motocross planning is seasonal and month-based. Area Qualifiers, Regionals, local races, school, holidays, weather, and travel all need realistic timing. A week-only calendar makes the season feel fake and makes it harder to plan.

## How
Design a month calendar:

- Month view.
- Event markers.
- Deadlines.
- Race weekends.
- Practice days.
- Travel days.
- School conflicts.
- Maintenance reminders.
- Registration deadlines.
- Loretta path timing.
- Off weekends.
- Every-other-weekend local race cadence when appropriate.

The calendar should support:

- Monthly overview.
- Tap an event for details.
- Advance to the next event.
- Advance day / week / month.
- Warnings for conflicts.
- Locked/committed events.

## Definition of Done
- [ ] Month-based calendar requirements documented.
- [ ] Existing week-only assumptions removed or revised.
- [ ] Event timing model supports realistic months.
- [ ] Loretta timing can be represented accurately.
- [ ] Local race cadence can vary by month.
- [ ] Calendar UI requirements updated.

## Related Epic
EPIC: Calendar & Time Engine
EPIC: Season Planner
EPIC: Road to Loretta's

## Labels
type: design, area: calendar, area: ui, priority: p0-critical

---

# Issue: Fix Mid-Season Schedule Editing So Player Cannot Get Stuck

## What
Fix the season flow so editing the schedule during an active season does not trap the player or prevent racing.

## Why
Players need flexibility to add/remove/change events during a season, but the game must always return to a valid playable state. If schedule edits break the "go racing" flow, the core loop fails.

## How
Design active-season editing rules:

- Draft edits can be made during the season.
- Changes require review/approval.
- Locked past events cannot be changed.
- The current event cannot be invalidated while in progress.
- Future events can be added/removed if deadlines allow.
- Parent approval required for youth riders.
- Editing must always return to the Active Season state.
- "Go to Next Event" must recalculate after edits.

Add safety states:

- No upcoming events → prompt to add event, practice, rest, or advance time.
- Invalid event → show warning and repair options.
- Missed deadline → remove or mark unavailable.
- Conflict → require resolution before lock-in.

## Definition of Done
- [ ] Active-season edit state machine documented.
- [ ] Past/current/future event rules defined.
- [ ] Re-lock/re-approve flow documented.
- [ ] "Go Racing" cannot disappear after edits.
- [ ] Empty-schedule fallback exists.
- [ ] Conflict recovery states documented.
- [ ] Regression test scenarios listed.

## Related Epic
EPIC: Calendar & Time Engine
EPIC: Season Planner
EPIC: Competition / Race Engine

## Labels
type: design, area: calendar, area: state-machine, priority: p0-critical

---

# Issue: Add Calendar Regression Tests for Season Flow

## What
Create regression test requirements for the calendar and season flow.

## Why
Calendar state bugs can break the whole game. Once fixed, these flows need test coverage so they do not regress.

## How
Document tests for:

- Create season → lock season → race first event.
- Edit future schedule → re-lock → race next event.
- Remove all future events → recover with add/rest/practice options.
- Miss registration deadline → event becomes unavailable.
- Bike not ready → repair or skip options.
- Young rider → parent approval required.
- Loretta path → cannot enter National without qualification.
- Area Qualifier → Regional → National progression.

## Definition of Done
- [ ] Calendar regression scenarios documented.
- [ ] State transition test cases listed.
- [ ] Loretta flow tests listed.
- [ ] Parent approval tests listed.
- [ ] Empty/invalid schedule recovery tests listed.
- [ ] Added to the release readiness or QA checklist.

## Related Epic
EPIC: Release Readiness
EPIC: Calendar & Time Engine
EPIC: Road to Loretta's

## Labels
type: testing, area: calendar, area: qa, priority: p0-critical
