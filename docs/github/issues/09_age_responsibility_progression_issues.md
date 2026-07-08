# Issue: Design Age & Responsibility Progression System

## What
Design the parent system for age-gated responsibility progression in **Motocross: Chasing the Dream**.

The system must express the core design rule: the rider should only have access to decisions, information, money, tools, and independence that make sense for their age, trust level, family situation, and career stage.

Define age bands:

- **Ages 4–6: Tiny Wheels** — the rider mostly asks parents to ride, race, or buy a bike; parents control scheduling, travel, money, communication, safety, and most information.
- **Ages 7–9: First Racer** — the rider can express preferences, help in very small ways, and start understanding routines, but parents still make nearly all decisions.
- **Ages 10–12: Developing Amateur** — the rider can take on small chores or simple jobs, learn basic bike care, make practice requests, and begin seeing limited costs with parent framing.
- **Ages 13–15: Serious Amateur** — the rider gains more responsibility for training, school balance, bike care, season input, and limited phone/marketplace interaction under parent oversight.
- **Ages 16–17: High-Level Amateur** — the rider can work part-time, sell personal items, buy parts with limits, help manage setup, communicate with sponsors/coaches with oversight, and possibly drive locally depending on trust and family context.
- **Ages 18+: Adult Racer** — the rider can make independent financial, work, travel, contract, and career decisions while still being affected by relationship history, budget, reputation, injuries, and life obligations.

## Why
Age progression is central to making a motocross life feel authentic. A 4-year-old should not be able to buy a bike, message sponsors, plan a national schedule, or browse used listings alone. A 16-year-old should feel the growing freedom and pressure of earning money, making choices, managing consequences, and being trusted by family.

This system turns growing up into gameplay context without implementing gameplay yet. It gives future design and implementation work a shared language for what the rider can know, ask for, decide, and do at each life stage.

## How
Create a design specification that includes:

- A responsibility model where **age sets the baseline** and trust/family/career context modifies available freedom.
- A matrix of what each age band can and cannot do across family, phone, garage, money, work, marketplace, training, school, travel, sponsor, and race-planning areas.
- Clear distinction between:
  - Actions the rider can do independently.
  - Actions the rider can request from parents.
  - Actions the rider can suggest but not finalize.
  - Actions hidden from younger riders entirely.
- Examples for each band showing realistic rider agency.
- Rules for how birthdays and career transitions update available choices.
- Dependencies on Family & Economy, Relationship, Phone / Internet UI, Marketplace, Education, Injury Recovery, Career Progression, and Memory systems.
- Notes that this issue is design-only and should not implement gameplay.

## Definition of Done
- [ ] Age bands are documented with names, age ranges, and design intent.
- [ ] Each age band has clear examples of allowed, request-only, restricted, and hidden actions.
- [ ] The system states that age is the baseline and trust/responsibility/family context modifies freedom.
- [ ] Cross-system dependencies are documented.
- [ ] Edge cases are listed, including exceptional maturity, strict parents, financial hardship, injury recovery, homeschool, and team/sponsor pressure.
- [ ] Open implementation questions are documented for future issues.
- [ ] No gameplay implementation is included in this issue.

## Related Epic
EPIC: Career Progression  
EPIC: Family & Economy Engine  
EPIC: Relationship Engine  
EPIC: Parent Campaign  
EPIC: Rider Campaign

## Labels
`type: design`, `area: career`, `area: family`, `priority: p0-critical`

# Issue: Define Age-Based Action Permissions

## What
Define a permission matrix for what riders can do, request, suggest, or not access at each age band.

Actions to cover:

- Ask parents to ride.
- Ask parents to race.
- Ask for bike/gear.
- Practice choices.
- Help wash bike.
- Help load gear.
- Basic maintenance.
- Browse phone/internet.
- Browse marketplace.
- Save marketplace listings.
- Buy small items.
- Sell personal items.
- Work jobs.
- Choose training focus.
- Help plan season.
- Register for races.
- Communicate with sponsors/coaches.
- Travel independently.
- Sign contracts.
- Manage finances.

## Why
Future implementation needs one authoritative design source for action gating. Without clear permission rules, young riders could make unrealistic choices and older riders may not feel the reward of earned responsibility.

## How
Create a matrix using the age bands from the parent system:

- **Independent** — rider can do it directly.
- **Ask/Request** — rider can ask a parent or guardian.
- **Suggest/Input** — rider can influence but not finalize.
- **Parent Only** — rider may see the outcome but not control the action.
- **Hidden** — rider should not see the action or full information yet.
- **Locked** — action is unavailable until a later age or legal/career condition.

For each action, define:

- Minimum age baseline.
- Trust modifiers that can loosen or tighten access.
- Parent approval requirements.
- UI language for younger riders.
- Whether the action should create a memory.
- Whether the action affects school, fatigue, stress, family trust, money, or career momentum.

Include examples such as:

- A 5-year-old can ask to ride after school but cannot choose a training plan.
- An 11-year-old can help wash bikes and save money from small chores, but cannot independently buy parts.
- A 14-year-old can suggest race weekends and save marketplace listings, but parents approve spending and travel.
- A 17-year-old can help communicate with sponsors, sell personal items, and plan a season, but contracts still require guardian approval if under 18.
- An adult racer can manage finances, travel, work, and contracts independently.

## Definition of Done
- [ ] Permission matrix covers every listed action.
- [ ] Each action has a baseline permission by age band.
- [ ] Each action identifies parent approval, trust modifiers, and hidden-information rules where relevant.
- [ ] Examples are provided for young child, pre-teen, early teen, older teen, and adult cases.
- [ ] Matrix is ready for future implementation tickets without adding gameplay now.

## Related Epic
EPIC: Career Progression  
EPIC: Family & Economy Engine  
EPIC: Phone / Internet UI  
EPIC: Parent Campaign  
EPIC: Rider Campaign

## Labels
`type: design`, `area: career`, `area: family`, `priority: p0-critical`

# Issue: Design Trust Modifier System

## What
Design a trust/freedom modifier system that changes how much independence a rider receives beyond their age baseline.

Trust inputs must include:

- Grades.
- Honesty.
- Work ethic.
- Helps with bike.
- Respects parents.
- Spending choices.
- Injury history.
- Bike care.
- Parent stress.
- Family finances.
- Sponsor/team pressure.
- Past irresponsible decisions.

Trust effects must include:

- More/less phone access.
- More/less marketplace access.
- More/less season planning input.
- More/less permission to work.
- More/less permission to travel.
- More/less permission to buy parts.
- More/less sponsor communication.

## Why
Age alone is not enough. Two riders of the same age can have very different freedom depending on grades, behavior, maturity, injury history, family stress, and past choices. Trust lets the game model earned responsibility, parental worry, and the emotional consequences of decisions.

## How
Design trust as a modifier layered on top of age permissions:

- Age defines the default permission band.
- Trust can expand, delay, restrict, or condition permissions.
- Parent personality changes how trust is interpreted.
- Family finances and stress can reduce freedom even for responsible riders.
- Career pressure can push parents to grant more access or clamp down.
- Injury history can specifically restrict riding, travel, training, or race-after-injury decisions.

Define:

- Trust categories or scores.
- Positive and negative inputs.
- Decay/recovery behavior after mistakes.
- Parent memory hooks for responsible or irresponsible decisions.
- Threshold examples, such as “can message seller with parent copied” or “can work one afternoon per week if grades stay up.”
- How trust is shown to the player without exposing unrealistic hidden formulas.
- How strict, supportive, anxious, financially stressed, or racing-focused parents interpret the same behavior differently.

## Definition of Done
- [ ] Trust inputs are documented with examples.
- [ ] Trust effects are mapped to phone, marketplace, season planning, jobs, travel, purchases, and sponsor communication.
- [ ] The design explains how trust modifies age baseline permissions.
- [ ] Parent personality, stress, finances, injuries, grades, and past memories are included.
- [ ] Recovery from lost trust is defined.
- [ ] UI/message examples communicate trust changes emotionally and age-appropriately.
- [ ] No gameplay implementation is included.

## Related Epic
EPIC: Relationship Engine  
EPIC: Family & Economy Engine  
EPIC: Career Progression  
EPIC: Parent Campaign  
EPIC: Memory Engine

## Labels
`type: design`, `area: relationship`, `area: family`, `area: career`, `priority: p0-critical`

# Issue: Define Job, Chore, and Work Progression

## What
Define age-appropriate ways riders can earn money and how work competes with training, school, rest, and family life.

Examples by age:

- **Ages 4–9:** no real work; possible small allowance, simple chores, or family praise for helping.
- **Ages 10–12:** paper route, mowing lawns, washing bikes, helping at the track, small family chores.
- **Ages 13–15:** bike shop helper, track worker, more regular chores/jobs, cleaning gear, helping younger riders under supervision.
- **Ages 16–17:** part-time job, dealership work, mechanic apprentice, construction, helping a family business, regular track work.
- **Ages 18+:** full-time work, coaching, mechanic work, privateer income, business ownership, flexible or unstable racing-adjacent income.

Every job should create tradeoffs:

- Money gained.
- Training time lost.
- Rest lost.
- Homework impact.
- Family trust impact.
- Work ethic growth.
- Fatigue/stress impact.

## Why
Money should feel earned and costly. A rider buying parts with their own money should carry emotional weight because it required time, sacrifice, discipline, and tradeoffs. Work also connects family finances, responsibility, grades, fatigue, and racing ambition.

## How
Design a progression of work options by age band with:

- Minimum age or parent approval.
- Time cost per week or per shift.
- Typical earnings range.
- Training/rest/homework tradeoffs.
- Trust and work ethic impacts.
- Fatigue, stress, burnout, and injury-risk considerations.
- Seasonal availability, such as summer jobs or race-weekend track work.
- Family context, such as helping a parent business or needing work because finances are tight.
- Career context, such as sponsor obligations limiting job availability.

Include design notes for:

- Small chores and allowances not feeling like adult employment.
- Younger riders seeing work through family language, not financial optimization.
- How missed shifts, poor grades, or irresponsible spending affect trust.
- How strong work ethic can unlock greater independence.
- How overworking can hurt training and emotional well-being.

## Definition of Done
- [ ] Work/chore options are defined for all age bands.
- [ ] Each option includes money, time, school, rest, trust, work ethic, fatigue, and stress tradeoffs.
- [ ] Parent approval and legal/age constraints are documented at a design level.
- [ ] Family-finance and career-pressure scenarios are included.
- [ ] Memory hooks for first job, first earned part, and family sacrifice are identified.
- [ ] No job gameplay implementation is included.

## Related Epic
EPIC: Family & Economy Engine  
EPIC: Career Progression  
EPIC: Education School Engine  
EPIC: Opportunity Engine  
EPIC: Rider Campaign

## Labels
`type: design`, `area: economy`, `area: career`, `area: family`, `priority: p1-high`

# Issue: Define Phone and Internet Access by Age

## What
Define how phone and internet access changes as the rider grows up.

Age access:

- **Ages 4–6:** no phone; parents control communication.
- **Ages 7–9:** family tablet or parent-shown messages.
- **Ages 10–12:** limited phone/internet with approval.
- **Ages 13–15:** broader phone access with parent oversight.
- **Ages 16–17:** mostly full access, but major purchases/contracts still require parent approval.
- **Ages 18+:** full access.

Phone apps affected:

- Messages.
- Marketplace.
- Dealer websites.
- Race calendar.
- Social media.
- MotoNews.
- Garage app.
- Sponsor/team contacts.

## Why
The in-game phone should not behave the same for a 6-year-old and a 17-year-old. Phone access is one of the clearest ways to show growing independence, parental oversight, sponsor pressure, social risk, marketplace temptation, and access to career information.

## How
Create a design matrix for phone and internet access by age band:

- Which apps are hidden, parent-controlled, read-only, limited, supervised, or fully available.
- Parent approval flows for messages, purchases, posts, sponsor contacts, marketplace sellers, and training camp/race registration links.
- Trust and parent personality modifiers.
- Safety rules for minors.
- UI copy that makes young-rider access feel natural, such as “Mom shows you a message from your coach.”
- How school performance, bad behavior, injury recovery, or parent stress can restrict access.
- How sponsor/team pressure can introduce communication earlier while still keeping parent oversight.

## Definition of Done
- [ ] Phone/internet access levels are defined for all age bands.
- [ ] Each listed app has an access state by age band.
- [ ] Parent approval and oversight rules are documented.
- [ ] Trust, grades, injuries, parent stress, and sponsor pressure modifiers are included.
- [ ] Age-appropriate UI/message examples are provided.
- [ ] No phone gameplay implementation is included.

## Related Epic
EPIC: Phone / Internet UI  
EPIC: Family & Economy Engine  
EPIC: Career Progression  
EPIC: Relationship Engine

## Labels
`type: design`, `area: phone`, `area: career`, `area: family`, `priority: p1-high`

# Issue: Define Marketplace Access by Age

## What
Define how marketplace permissions change with age.

Progression:

- Young kids cannot browse marketplace.
- Pre-teens can look with parents.
- Early teens can save listings and suggest purchases.
- Mid-teens can message sellers with approval.
- Older teens can buy/sell personal items.
- Adults have full marketplace access.

Include:

- Parent approval flow.
- Spending limits.
- Selling garage items.
- Selling personal items.
- Risk of scams.
- Trust impact from responsible/irresponsible buying.
- Hidden family finances in rider mode.

## Why
Used bikes and parts are a major part of motocross life, but young riders should not have full marketplace freedom. Marketplace access should become a meaningful sign of growing up, earning trust, learning value, and understanding family sacrifice.

## How
Design age-based marketplace permissions:

- **Ages 4–6:** no direct marketplace UI; parents may discuss affordability in simple language.
- **Ages 7–9:** parent-shown listings only, such as “Dad found a used 65.”
- **Ages 10–12:** supervised browsing or wishlist-style suggestions.
- **Ages 13–15:** save listings, compare prices, suggest purchases, and possibly draft messages with parent review.
- **Ages 16–17:** message sellers with approval, buy small items within limits, sell personal items, and help evaluate bikes/parts.
- **Ages 18+:** full browse, buy, sell, negotiate, and risk ownership.

Define:

- Approval thresholds by item type and cost.
- Difference between selling personal items, garage items, family assets, and race-critical parts.
- How hidden family finances limit what the rider sees.
- Scam/hidden damage risk and how trust/experience affects outcomes.
- How irresponsible purchases reduce trust.
- How responsible research, fair pricing, and honest selling increase trust.
- Memory triggers for first saved listing, first negotiated part, first self-funded purchase, and first sale.

## Definition of Done
- [ ] Marketplace access progression is documented for all age bands.
- [ ] Parent approval flow and spending limits are defined.
- [ ] Selling rules distinguish personal items, garage items, and family-owned assets.
- [ ] Scam risk and trust impacts are documented.
- [ ] Hidden family finance rules are included for rider mode.
- [ ] No marketplace gameplay implementation is included.

## Related Epic
EPIC: Marketplace Engine  
EPIC: Phone / Internet UI  
EPIC: Family & Economy Engine  
EPIC: Asset Engine  
EPIC: Career Progression

## Labels
`type: design`, `area: marketplace`, `area: family`, `area: career`, `priority: p1-high`

# Issue: Define Parent Approval Rules by Age

## What
Define parent approval logic for age-gated decisions.

Parent approval should apply to:

- Race attendance.
- Far travel.
- Loretta qualifier attempts.
- Bike purchases.
- Expensive parts.
- Training camps.
- Jobs/work schedule.
- Marketplace purchases.
- Social media activity.
- Sponsor communication.
- Medical/racing-after-injury decisions.
- School/homeschool changes.

Approval should depend on:

- Age.
- Trust.
- Parent personality.
- Budget.
- Parent stress.
- Family schedule.
- School performance.
- Injury status.
- Career stakes.
- Past memories.

## Why
Parents are central to youth motocross. Approval rules should create emotional, realistic family dynamics rather than simple locked/unlocked buttons. The same request should feel different depending on the family’s finances, stress, memories, and belief in the rider.

## How
Design an approval model that evaluates:

- Baseline age permission.
- Whether the action is ask-only, suggest-only, parent-only, or independently allowed.
- Trust and responsibility history.
- Parent personality traits such as supportive, strict, anxious, racing-focused, financially cautious, or burned-out.
- Budget and visible/hidden family finances.
- Time conflicts with school, work, siblings, parent jobs, and family obligations.
- Injury and medical advice.
- Career opportunity value and urgency.
- Past memories, including promises kept, money wasted, crashes, strong effort, or dishonest behavior.

Include result types:

- Approved.
- Approved with conditions.
- Delayed.
- Denied with explanation.
- Parent decides without rider input.
- Family discussion event.

Include examples for:

- A young rider asking to race this weekend.
- A 12-year-old asking for a job to pay for parts.
- A 15-year-old asking to attempt a Loretta qualifier.
- A 16-year-old asking to buy used suspension.
- A rider returning from injury asking to race early.

## Definition of Done
- [ ] Approval inputs are documented.
- [ ] Approval result types are defined.
- [ ] Age, trust, parent personality, budget, stress, school, injury, career stakes, and memories all affect approval.
- [ ] Approval examples cover racing, travel, purchases, jobs, sponsor communication, social media, medical choices, and school changes.
- [ ] The design explains how approvals should be communicated emotionally and age-appropriately.
- [ ] No parent approval gameplay implementation is included.

## Related Epic
EPIC: Family & Economy Engine  
EPIC: Relationship Engine  
EPIC: Career Progression  
EPIC: Parent Campaign  
EPIC: Road to Loretta’s

## Labels
`type: design`, `area: family`, `area: relationship`, `area: career`, `priority: p0-critical`

# Issue: Define Age-Based UI and Information Visibility

## What
Define how UI and information visibility change as the rider grows up.

Younger riders should not see full finances, contract details, or complete logistics. They should see age-appropriate language like:

- “Dad says it costs too much.”
- “Mom looks worried.”
- “Your parents are talking about skipping the race.”

Older riders gradually see:

- Entry fees.
- Travel costs.
- Parts costs.
- Sponsor discounts.
- Budget contributions.
- Work income.
- Contract terms.
- Debt/loans as adults.

## Why
Information visibility is part of the fantasy of growing up. Young riders experience racing through parents, emotions, permission, and simple explanations. Older riders slowly understand the real cost, planning, pressure, and consequences behind the dream.

## How
Design visibility levels by age band:

- Hidden details for young children.
- Parent-framed explanations for kids.
- Partial costs and simple tradeoffs for pre-teens.
- More complete planning and spending information for teens.
- Full financial, contractual, debt, and career information for adults.

Define which UI areas are affected:

- Family budget and race affordability.
- Bike and parts costs.
- Travel logistics.
- Race registration and entry fees.
- Job income and work schedule.
- Sponsor offers and discounts.
- Contracts and obligations.
- Injury/medical costs and risk language.
- School and eligibility information.

Include rules for rider mode versus parent mode if both campaigns expose the same events differently. Define tone guidelines so hidden information never feels like missing UI; it should feel like the rider realistically does not know everything yet.

## Definition of Done
- [ ] UI visibility levels are defined for all age bands.
- [ ] Finance, logistics, sponsor, contract, job, medical, school, and race information visibility is documented.
- [ ] Age-appropriate copy examples are provided.
- [ ] Rider-mode hidden family finance behavior is defined.
- [ ] Adult visibility includes full finances, contracts, debt/loans, and independent obligations.
- [ ] No UI implementation is included.

## Related Epic
EPIC: Phone / Internet UI  
EPIC: Family & Economy Engine  
EPIC: Career Progression  
EPIC: Parent Campaign  
EPIC: Rider Campaign

## Labels
`type: design`, `area: ui`, `area: career`, `area: family`, `priority: p1-high`

# Issue: Add Age-Based Memory Hooks

## What
Design memory creation hooks tied to growing up and earning responsibility.

Memory examples:

- First time asking Dad to race.
- First time helping wash the bike.
- First time earning money for parts.
- First part purchased with own money.
- First time Dad trusts rider to work on bike.
- First job.
- First time selling an item.
- First time driving to practice.
- First sponsor message handled directly.
- First adult purchase.
- Parent handing over garage responsibility.

## Why
The responsibility system should create life milestones, not just permission changes. Memories make age progression emotional: the first earned part, the first trusted task, the first solo drive to practice, or the first adult purchase can become part of the rider’s story.

## How
Define memory triggers for age/responsibility milestones:

- First request moments.
- First approved responsibility.
- First denied responsibility that mattered.
- First earned money.
- First self-funded racing purchase.
- First trusted garage task.
- First marketplace interaction.
- First direct sponsor/coach communication.
- First independent travel or drive.
- First adult financial decision.
- Parent transfer-of-trust moments.

For each memory hook, define:

- Trigger conditions.
- Age bands where it can occur.
- Parent/family participants.
- Emotional tone variants.
- Trust impact.
- Future callback opportunities.
- UI or narrative snippet needs.
- Whether the memory belongs to rider, parent, bike, garage, sponsor, or family history.

## Definition of Done
- [ ] Memory hook list includes all required examples.
- [ ] Each hook has trigger conditions and age/trust context.
- [ ] Emotional tone variants are documented.
- [ ] Memory ownership targets are identified.
- [ ] Future callbacks are described.
- [ ] No memory engine implementation is included.

## Related Epic
EPIC: Memory Engine  
EPIC: Career Progression  
EPIC: Family & Economy Engine  
EPIC: Relationship Engine  
EPIC: Rider Campaign

## Labels
`type: design`, `area: memory`, `area: career`, `area: family`, `priority: p1-high`

# Issue: Update Design Decision Log for Responsibility Earned Through Age and Trust

## What
Add a new design decision:

**DD-0019 — Responsibility Is Earned Through Age and Trust**

Description:

The rider’s available actions, information, money access, phone access, marketplace access, and independence are based on age first, then modified by trust, responsibility, family context, grades, injuries, parent stress, and past behavior.

## Why
This decision captures a foundational rule for Motocross: Chasing the Dream. It prevents unrealistic agency for young riders while making growing up, earning trust, and taking responsibility part of the emotional career arc.

## How
Create a documentation task to update the Design Decision Log or equivalent GDD/design-bible location with:

- Decision ID: DD-0019.
- Decision title: Responsibility Is Earned Through Age and Trust.
- Decision description.
- Rationale tied to authenticity, family, emotional progression, and age-appropriate agency.
- Consequences for phone, marketplace, finances, jobs, travel, race planning, sponsor communication, and UI visibility.
- Cross-reference to the Age & Responsibility Progression System issue draft.

## Definition of Done
- [ ] DD-0019 is added to the Design Decision Log or equivalent design documentation.
- [ ] The decision states age is the baseline for responsibility.
- [ ] The decision states trust, family context, grades, injuries, parent stress, and past behavior modify freedom.
- [ ] Consequences for actions, information, money, phone, marketplace, and independence are documented.
- [ ] Related issue drafts and epics are cross-referenced.
- [ ] No gameplay implementation is included.

## Related Epic
EPIC: Career Progression  
EPIC: Family & Economy Engine  
EPIC: Relationship Engine  
EPIC: Phone / Internet UI

## Labels
`type: documentation`, `area: gdd`, `area: career`, `priority: p1-high`
