# Real-World Motocross Career Research Benchmark

Issue: #428

## Purpose

This benchmark exists to keep **Legacy: Motocross** from collapsing motocross careers into a single linear ladder. Real riders reach the same paddock through very different combinations of family support, amateur programs, money, relocation, coaching, opportunity timing, injury history, team infrastructure, motivation, and luck. The simulation should model those ingredients and let the career emerge.

The benchmark is not intended to recreate real riders. It extracts repeated patterns and valid edge cases that can calibrate the game.

## Research method and evidence standard

Source priority:
1. Official manufacturer/team/series/AMA biographies and announcements.
2. Direct rider/family interviews.
3. Reputable motocross journalism and long-form profiles, especially Racer X.
4. Secondary summaries only for context, not as anchors for simulation rules.

For every finding, distinguish:
- **Verified fact:** directly stated in a credible source.
- **Pattern:** repeated across multiple careers.
- **Design implication:** a simulation rule suggested by the evidence.

No single rider anecdote should become a universal rule. Rare events are valid as low-frequency career outcomes when they fit the world state.

---

# Benchmark career profiles

## 1. Haiden Deegan — structured amateur-to-pro pipeline

### Verified career pattern
Haiden Deegan spent years in KTM's Orange Brigade before his family chose Monster Energy/Star Yamaha Racing. Brian Deegan explicitly described the family's main decision criterion as which program could best manage the difficult transition from amateur racing into the professional ranks. Star's infrastructure included a proven amateur-to-pro ladder, pro-team resources, testing, equipment and continuity.

Deegan turned professional young and remained in the 250 class for multiple seasons rather than instantly jumping to the premier class after early success. The family has also spoken publicly about intentionally managing that transition and the importance of team infrastructure.

### Simulation implications
- Amateur support programs should have **pipeline quality**, not just equipment bonuses.
- Family/guardian decisions should evaluate long-term transition quality, not only money.
- A top prospect can reasonably stay in a development class after becoming competitive.
- Team training tracks, race shops, testing staff and pro-team integration should reduce preparation friction and improve development consistency.
- High visibility and family brand/media presence can increase opportunity and expectation pressure simultaneously.

Primary sources:
- Racer X, Brian Deegan on Haiden's Yamaha decision: https://racerxonline.com/2022/02/02/where-are-they-now-brian-deegan
- Racer X, Brian Deegan on the development formula: https://racerxonline.com/2025/06/27/brian-deegan-is-all-in
- Racer X, 2026 discussion of 250-to-450 timing: https://racerxonline.com/2026/03/04/brian-deegan-haiden-has-been-riding-the-450-the-last-few-weeks

## 2. Chase Sexton — potential, pipeline, and injury-delayed debut

### Verified career pattern
Sexton was recruited from the amateur ranks into Factory Connection/GEICO Honda's development pipeline. Training relationships helped create the opportunity. His professional debut was then delayed by three major injuries: knee, both wrists, and femur. He eventually debuted and progressed from amateur Honda support to GEICO Honda and then the factory Honda team.

His career demonstrates that development trajectory and calendar opportunity can be interrupted repeatedly without the underlying potential disappearing. Later professional seasons also show the importance of accumulated physical load and strategic time away from racing.

### Simulation implications
- Separate **potential**, **current ability**, **race readiness**, and **career momentum**.
- Injury can delay debut/class progression without lowering long-term ceiling automatically.
- Development-team relationships and training networks can create opportunities.
- Return-to-racing readiness should include re-acclimation, not just a binary healed/not-healed state.
- A rider/team can intentionally pause competition to restore body condition.

Primary sources:
- Racer X, 2015 amateur signing: https://racerxonline.com/2015/10/14/250-words-chase-sexton
- Racer X, three injuries delaying pro debut: https://racerxonline.com/2017/11/28/open-mic-chase-sexton
- Honda Racing profile: https://honda.racing/ama-sx/profiles/15

## 3. Cooper Webb — planned amateur/pro contract and family timing

### Verified career pattern
At age 15, Webb signed a three-year amateur-to-pro contract with Star Racing Yamaha. The deal explicitly supplied top equipment and pro-team resources while leaving the actual decision of when to turn professional to Webb's family and team management. Webb accumulated extensive amateur success before moving into the professional ranks.

### Simulation implications
- Contracts can span **amateur and pro phases**.
- Turning pro should be a strategic timing decision, not an automatic age/result unlock.
- Families and teams can jointly decide readiness.
- Strong infrastructure may be more valuable than short-term cash.
- The same team relationship can evolve from development support to professional employment.

Primary sources:
- Racer X, 2011 Star Racing signing: https://racerxonline.com/2011/11/15/amateur-star-cooper-webb-signs-with-star-racing-yamaha
- Racer X, 2012 amateur progression: https://racerxonline.com/2012/11/26/monday-conversation-cooper-webb

## 4. Eli Tomac — patient development, parental expertise, burnout prevention

### Verified career pattern
As a 16-year-old amateur, Tomac described his father John as deeply involved in training. The family intentionally limited riding during the minicycle years to avoid burnout, then increased workload as Eli moved to bigger bikes. Tomac also reflected that many of the rivals encountered at Loretta's remained part of his competitive world into the professional ranks.

### Simulation implications
- More training is not always better for young riders.
- Parent expertise can improve training quality without requiring professional coaching.
- Youth development should reward sustainable workload and allow deliberate restraint.
- Rival networks should persist from amateur to pro careers.
- The competitive world should feel continuous rather than generating a new cast at every class step.

Primary sources:
- Racer X, 2009 amateur interview: https://racerxonline.com/2009/08/10/monday-conversation-eli-tomac
- Racer X, amateur-rival continuity: https://racerxonline.com/2020/07/17/great-lorettas-battles-elis-generation

## 5. Ryan Dungey — voluntary retirement while still capable, then comeback

### Verified career pattern
Dungey retired in 2017 while physically fit, well-equipped and still championship-capable. He described difficulty maintaining the mental drive required for the relentless racing schedule and a growing pull toward normal life. Five years later he returned to Pro Motocross, initially framed around limited participation, then raced the season. Afterward he described the comeback as providing personal closure and chose not to continue full-time.

### Simulation implications
- **Motivation/drive must be separate from fitness, confidence, and skill.**
- A rider can retire at a high performance level.
- Normal-life pull and accumulated pressure should matter.
- Retirement need not permanently disable racing.
- Comebacks can be motivated by challenge, unfinished business, identity or closure rather than money alone.
- A comeback can succeed emotionally even without wins.

Primary sources:
- Racer X, retirement announcement: https://racerxonline.com/2017/05/16/ryan-dungey-announces-retirement
- Racer X, motivation discussion: https://racerxonline.com/2017/05/07/the-conversation-anderson-grant-tomac-dungey
- Racer X, re-retirement and closure: https://racerxonline.com/2022/11/17/the-conversation-ryan-dungey

## 6. Jett Lawrence — family all-in relocation and international development

### Verified career pattern
The Lawrence family sold their possessions and moved from Australia to Europe in 2016 to pursue motocross. Jett has described the substantial family sacrifice, including the impact on his brother Tate, and later said the family arrived in Europe with very limited money while waiting for the family home to sell. The family moved through Holland and Belgium before relocating to the United States in 2019. Jett developed through Australian youth racing, European/ADAC/EMX competition, Factory Connection Honda and finally factory Honda.

### Simulation implications
- International relocation can be a **family-level financial gamble**.
- Moving should change costs, support network, schooling/family stability, training environment and opportunity access.
- European development can improve terrain/condition experience that later transfers partially to U.S. racing.
- Family sacrifice should create pressure and meaning without guaranteeing success.
- Relocation can be multi-stage: home country → Europe → U.S., not just home → pro team.

Primary sources:
- Red Bull athlete profile: https://www.redbull.com/us-en/athlete/jett-lawrence
- Honda Racing championship profile: https://honda.racing/ama-sx/post/jett-lawrence-secures-ama-pro-motocross-250-mx-championship
- Racer X, family financial struggle and Europe experience: https://racerxonline.com/2023/08/28/the-conversation-super-lawrence-bros

## 7. Hunter Lawrence — route selection, adaptation, delayed payoff

### Verified career pattern
Hunter progressed from Australian junior success to Europe, then MX2, then the United States. He has explained that the family believed the Europe route gave Australians a better chance of eventual success in America than moving directly. His U.S. career required learning supercross and took several seasons before culminating in 250 championships. He later moved to the 450 class.

### Simulation implications
- Multiple development routes should exist with different strengths and costs.
- International experience should transfer partially, while discipline-specific skills such as supercross still require adaptation.
- A rider can be a long-term top prospect without immediately winning titles.
- Route quality can matter years later.
- Family strategic beliefs can influence route selection even when no path is guaranteed.

Primary sources:
- Honda Racing profile: https://honda.racing/ama-sx/profiles/17
- Racer X, move to America and Europe-route reasoning: https://racerxonline.com/2018/12/13/250-words-hlunter-lawrence

## 8. Ken Roczen — catastrophic injury, chronic residual effects, adaptation

### Verified career pattern
Roczen's major arm injury created a long rehabilitation, movement restrictions and secondary problems in the shoulder and hand. He later explained that the arm would never be the same, but he adapted his riding and training around the limitations and returned to race-winning level. His recovery involved gradual load, physical therapy and substantial uncertainty rather than a clean countdown timer.

### Simulation implications
- Major injuries can create **persistent residual limitations** without ending competitiveness.
- Recovery should include secondary effects, reconditioning and adaptation.
- A healed rider may still need modified training or technique.
- Chronic effects should alter recovery/risk/comfort selectively, not apply a universal permanent speed penalty.
- Return timelines should have uncertainty bands.

Primary sources:
- Racer X, return and residual limitations: https://racerxonline.com/2017/12/15/the-conversation-ken-roczen
- Racer X, early return-to-riding adaptation: https://racerxonline.com/2017/10/09/the-conversation-ken-roczen

## 9. Chad Reed — international ambition, specialization, private ownership

### Verified career pattern
Reed left Australia with the explicit goal of reaching America, using an international route rather than a guaranteed ladder. Later in his career he created TwoTwo Motorsports, initially buying and testing bikes himself and operating as a privateer before building a larger organization. Reed also publicly discussed a supercross-only contract and deliberately choosing not to divert preparation toward motocross because his contract and career goal were centered on supercross.

### Simulation implications
- Career goals may specialize by discipline/series.
- Contracts should be able to specify SX-only, MX-only, selected rounds or full programs.
- Veteran riders may rationally decline races they could physically enter.
- Team ownership can emerge from the rider's own assets/reputation/relationships.
- A rider-owned team can begin as a small privateer effort and scale.

Primary sources:
- Racer X, TwoTwo origins: https://racerxonline.com/2015/07/01/the-list-big-moments-for-twotwo
- Racer X, TwoTwo oral history: https://racerxonline.com/2018/05/16/long-shot-the-oral-history-of-twotwo-motorsports
- Racer X, supercross-only contract and preparation choice: https://racerxonline.com/2016/10/10/open-mic-chad-reed

## 10. Adam Cianciarulo — elite amateur expectations, injuries, retirement, new identity

### Verified career pattern
Cianciarulo spent roughly two decades in Kawasaki's ecosystem from Team Green through Pro Circuit and factory Kawasaki. He won 11 Loretta Lynn's championships and entered the professional ranks with exceptional expectations. His professional career included major successes but repeated injuries and a nerve injury that became an important factor in retirement. After racing, he intentionally transitioned into broadcasting and later described the need to build a new identity outside being a racer.

### Simulation implications
- Amateur dominance should create **expectation/reputation**, not guarantee professional outcomes.
- Expectations can generate pressure independent of skill.
- Long manufacturer relationships should accumulate trust and opportunity history.
- Chronic injury can influence retirement even when the rider still loves riding.
- Post-career roles should be selectable/earned before retirement and can make retirement easier to accept.
- Identity transition deserves explicit long-term-life state.

Primary sources:
- Kawasaki retirement announcement: https://www.kawasaki.com/en-us/racing/news/4084/monster-energy-kawasaki-rider-adam-cianciarulo-announces-retirement
- Racer X, retirement/broadcast transition: https://racerxonline.com/2025/09/24/cianciarulo-i-was-ready
- Racer X, 2026 life-after-racing discussion: https://racerxonline.com/2026/07/02/ac-on-life-after-racing-injuries-and-more

## 11. Kyle Partridge — supported privateer economics

### Verified career pattern
Partridge described a team covering flights, hotels, bikes, entries and other expensive race costs. His income still depended on race earnings and personal financial backers because race pay alone was modest. He estimated the team's support investment and discussed using local races to make additional money during the summer.

### Simulation implications
- Do not represent support with one money number.
- Separate **team-covered expenses**, **personal sponsor income**, **race earnings**, **bonuses**, and **household living costs**.
- A rider can be well-supported operationally but still have weak personal income.
- Local races can provide cash between major series rounds.
- Privateer sustainability is a cash-flow problem, not only a season-budget total.

Primary sources:
- Racer X, privateer finances: https://racerxonline.com/2015/04/01/privateer-profile-kyle-partridge
- Racer X, travel and outside financial support: https://racerxonline.com/2015/01/22/privateer-profile-kyle-partridge

## 12. Kyle Chisholm — team money vs personal money

### Verified career pattern
Chisholm described explicitly separating team sponsorship money from personal gear deals. Team sponsorship funded travel, mechanic, truck driver and road costs; personal deals functioned more like his own salary. This is a useful real-world accounting boundary for a privateer/small-team career.

### Simulation implications
- Sponsorship support should have destination/restrictions: team operations, rider income, product, travel, parts, bonuses.
- A sponsor paying the team is not equivalent to money available for household bills.
- Personal endorsements and team contracts can coexist.
- Contract exclusivity needs category-level logic rather than one global sponsor lock.

Primary source:
- Racer X, privateer/team sponsorship structure: https://racerxonline.com/2020/04/20/privateer-profile-kyle-chisholm

## 13. Fredrik Noren — self-funded privateer to factory fill-in

### Verified career pattern
Noren moved from Sweden to the United States after selling what he had and spent years in the privateer ranks, at times effectively sponsoring himself. A factory Honda opportunity appeared when an injured factory rider created an opening. Later, when running a very small privateer program, he described how limited budgets made bike development slower even when the rider felt physically strong.

### Simulation implications
- Fill-in rides and replacement seats should be real dynamic opportunities.
- Availability and timing can produce sudden career jumps.
- Privateer results plus reputation can make a rider an attractive substitute.
- Equipment/setup development rate depends on resources, not just rider feedback skill.
- Losing factory infrastructure can reduce preparation efficiency without changing rider talent.

Primary sources:
- Racer X, 2014 privateer-to-Honda fill-in: https://racerxonline.com/2014/07/03/privateer-profile-fredrik-noren
- Racer X, small-budget setup limitations: https://racerxonline.com/2021/07/22/privateer-profile-fredrik-noren

## 14. Alex Ray / Heath Harrison — survival, incremental progress, and low-budget logistics

### Verified career pattern
Alex Ray progressed from struggling to make night shows to regularly making 450SX mains. Earlier in his career he described traveling in a basic rig, rough living conditions, putting earnings back into racing and relying on family help before gaining more team support. Heath Harrison described funding racing with savings from local racing and arenacross, paying most costs himself, traveling/living out of a van and using extremely low-cost mechanic arrangements.

### Simulation implications
- Careers need meaningful milestones below wins: qualify for night show, first main, first points, top 20, top 15, first factory inquiry.
- Privateer logistics should consume time, comfort and energy.
- Small improvements in training/support can change qualification probability without requiring huge skill jumps.
- Players should be able to define success relative to their current career tier.
- A meaningful career can exist entirely below factory championship contention.

Primary sources:
- Racer X, Alex Ray journey: https://racerxonline.com/2020/11/27/privateer-profile-alex-rays-journey
- Racer X, Alex Ray early privateer conditions: https://racerxonline.com/2015/04/09/privateer-profile-alex-ray
- Racer X, Heath Harrison privateer economics: https://racerxonline.com/2016/07/07/privateer-profile-heath-harrison

---

# Cross-career findings

## A. There is no single career ladder

Repeated routes include:
- family-supported amateur → OEM amateur program → pro team → factory
- amateur → development team with guaranteed transition structure
- home-country junior → Europe → U.S.
- self-funded/privateer → breakthrough result → fill-in ride → team seat
- supported rider → injury/regression → privateer rebuild
- factory champion → retirement → comeback
- racer → broadcaster/coach/team owner

**Design rule:** Career progression must be an opportunity graph, not a level ladder.

## B. Infrastructure is a first-class variable

The difference between programs includes:
- mechanic labor
- truck/transport
- flights/hotels
- bike/parts supply
- testing staff
- training facility access
- coaching
- data/setup continuity
- amateur-to-pro planning

**Design rule:** Support infrastructure should reduce preparation friction, increase consistency and expand choices. It should not simply add speed.

## C. Family capital and sacrifice matter most before the rider can self-fund

The Lawrence family is the strongest benchmark example, but the pattern appears throughout amateur racing: parents provide transport, labor, money, schooling decisions and career timing.

**Design rule:** Youth career economics belong to the household. Family willingness, stress and runway must be separate from rider ambition.

## D. Potential and current results must be separate

Sexton and Cianciarulo show why. Injury, adaptation or opportunity timing can suppress current results without erasing long-term potential.

**Design rule:** Track potential/learning profile, current skill, readiness, confidence/motivation, equipment fit and opportunity separately.

## E. Training quality matters more than raw volume

Tomac's youth program deliberately avoided excessive riding. Structured programs provide better coaching/testing access. Repeated practice has diminishing returns and physical cost.

**Design rule:** The #388 training-load foundation is directionally correct. Add quality/context/resources rather than encouraging maximum volume.

## F. Injury recovery is not a countdown timer

Roczen and Cianciarulo demonstrate persistent limitations and adaptation; Sexton demonstrates repeated delays; riders often regain competitiveness while carrying residual effects.

**Design rule:** Recovery should include readiness, residual effect, recurrence sensitivity, reconditioning and technique adaptation.

## G. Motivation can end careers before ability does

Dungey is the clearest benchmark. Elite riders may stop because the required lifestyle no longer matches priorities.

**Design rule:** Motivation/identity/normal-life pull must exist independently of burnout and confidence.

## H. Privateer money has multiple buckets

Team support, product, travel coverage, personal sponsors, race purse/earnings, bonuses and living expenses are distinct.

**Design rule:** A season can be affordable for the race operation while the rider personally struggles to pay bills—or the inverse.

## I. Opportunity timing is dynamic

Noren's replacement ride demonstrates that a career can change because another rider gets hurt. The right rider being available matters.

**Design rule:** Generate short-duration opportunity windows from world events and AI rosters.

## J. Careers can specialize

Reed's supercross-only contract is a direct example. Riders can choose selective schedules for health, career strategy, retirement transition or contract scope.

**Design rule:** Do not require every serious career to race every discipline/round.

## K. Success metrics must scale with career tier

For a championship rider, a fifth can be disappointing. For an underfunded privateer, making the main or scoring points can be career-changing.

**Design rule:** Career goals, sponsor expectations, confidence and memories should evaluate results against context and expectations, not absolute finishing position alone.

---

# Career archetypes to support

These are not fixed classes. A rider can move between them.

1. **Family-built youth racer** — parent labor/money dominant; local/regional focus.
2. **OEM-supported amateur prospect** — product/equipment and development opportunities, still family-dependent.
3. **Structured development prospect** — explicit amateur-to-pro pipeline with team resources.
4. **Regional privateer** — selective events, self/family funding, local sponsors.
5. **National privateer** — travel-heavy, mixed support buckets, qualification/results survival.
6. **Satellite/shop-team professional** — substantial operational coverage but limited factory resources.
7. **Factory/development-team professional** — high infrastructure, testing and expectations.
8. **International transplant** — relocation risk plus adaptation and support-network changes.
9. **Injury-delayed prospect/comeback rider** — talent remains, readiness/opportunity interrupted.
10. **Veteran specialist** — selective series/rounds and targeted contracts.
11. **Rider-owner / entrepreneurial veteran** — builds own team/business structure.
12. **Retired industry figure** — broadcast, coach, mentor, shop/team ownership, community role.

---

# Audit of post-UI gameplay roadmap (#382–#426)

## #382 Life Between Races 2.0

### Strong coverage already
- #387 canonical off-week choice loop
- #388 load + diminishing returns
- #389 recovery/body readiness
- #390 maintenance tradeoffs
- #391 school/work/family pressure
- #392 money/sponsor/travel prep
- #393 relationships/events/memories
- #394 UI/E2E

### Benchmark clarifications needed
- #392 must distinguish **household money, rider income, team-paid expenses, sponsor-designated support and race earnings**.
- #391 should allow family labor/time sacrifice to be an explicit cost.
- Training quality should later consume support infrastructure from #437.

No additional #382 issue required beyond those clarifications.

## #383 Rider Development 2.0

### Strong coverage already
- skill taxonomy
- nonlinear age/trait growth
- training mapping
- bike/class adaptation
- confidence/momentum/slumps
- AI parity
- readable development UI

### Benchmark clarifications needed
- #396 potential/learning ceiling must remain distinct from current execution.
- #397 training quality should include program infrastructure, coaching, terrain exposure and support resources.
- #398 should extend adaptation beyond bike/class to **discipline and environment exposure** (e.g. European sand experience does not equal instant U.S. supercross mastery).
- #399 should not absorb long-term motivation; that is now #438.

No new rider-development epic is required.

## #384 Race Intelligence & Track Fit 2.0

### Strong coverage already
Track character, conditions, rider fit, bike setup, starts/passing, fatigue, familiarity and explanations already match the benchmark well.

### Benchmark clarifications needed
- #409 familiarity should include **terrain-family experience** in addition to exact venue familiarity.
- #406 setup quality should depend partly on team/testing infrastructure from #437.
- Resource-limited teams should take longer to discover a good setup, as Noren described.

No new race-intelligence issue required.

## #385 Career Opportunities 2.0

### Strong coverage already
Opportunity market, teams, manufacturers, coaching, media, relocation, class moves and decision UI already cover the broad career graph.

### Missing systems added by benchmark
- **#437 Crew, Mechanic, Logistics & Training-Base Support Ladder**
- **#439 Fill-In Rides, Replacement Seats & Breakthrough Opportunity Windows**
- **#440 Contract Scope, Series Specialization & Selective Schedules**

### Benchmark clarifications needed
- #411 opportunity eligibility should include **availability/timing** and support-infrastructure fit.
- #412 team offers should expose actual operational resources, not only money/equipment.
- #416 relocation must support multi-stage international routes and family runway, not only domestic move/travel choices.
- #417 class timing should include development-program strategy and injury-delayed progression.
- #418 history should remember temporary rides, failed/declined opportunities and breakthrough windows.

This epic receives the largest benchmark-driven expansion.

## #386 Long-Term Life 2.0

### Strong coverage already
Aging, education/work, relationships/family, injury history, retirement/return, post-racing careers and legacy map well to real career evidence.

### Missing system added by benchmark
- **#438 Motivation, Identity, Pressure & Voluntary Career Exit**

### Benchmark clarifications needed
- #422 injury history should track residual limitations and adaptation, not only recurrence risk.
- #423 retirement must allow physically capable voluntary retirement and limited/selective comebacks.
- #424 post-racing roles should be foreshadowed/earned during the racing career.
- #425 legacy must value resilience, privateer persistence, community impact and industry contribution—not only elite results.
- #420 finances should distinguish race-operation economics from household/living income.

---

# Recommended sequencing changes

1. Finish **#382 Life Between Races** foundation.
2. Implement **#437 support infrastructure** early enough that training, maintenance and setup systems can consume it.
3. Build **#383 Rider Development** with potential/current-performance separation.
4. Build **#384 Race Intelligence** and integrate infrastructure-limited setup development.
5. Build #385 core opportunity market, then **#439 replacement rides** and **#440 contract scope** before final opportunity UI/E2E.
6. Build **#438 motivation/identity** before retirement logic in #423.
7. Complete #386 post-racing/legacy after motivation and career-opportunity history exist.

---

# Simulation rules the game should NOT assume

- Winning amateur titles guarantees professional success.
- Turning pro happens automatically at a fixed age/result.
- Better team = flat speed boost.
- Injury ends when a timer reaches zero.
- Every rider wants to race every possible event.
- Retirement only happens because age/injury/performance become bad.
- Factory support automatically means strong personal income.
- Privateer means completely unsupported.
- International relocation is a one-time travel-cost decision.
- The player's rivals disappear when classes change.
- A championship is the only meaningful career success.
- Declining an opportunity is necessarily a mistake.

---

# Open research gaps / revisit later

The current benchmark is strong enough to guide systems, but later research should deepen:
- exact amateur-family annual cost ranges by era/class/region
- contemporary purse/contingency economics and how they vary by series
- mechanics' workload/cost and crew staffing at privateer/satellite/factory levels
- schooling models used by current elite youth racers
- contract structures beyond publicly described examples
- differences between SX and MX training calendars
- post-racing income/business transitions across a wider sample
- women's motocross career paths and other disciplines if/when the game expands beyond the current career scope

These gaps should calibrate numbers later; they do not block the architecture described above.
