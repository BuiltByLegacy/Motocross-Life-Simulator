# Southeast Regional Identity Research

Issue: #318  
Reviewed: 2026-08-26

## Purpose

Define Region #2 from research before gameplay implementation. The Southeast is not a reskinned Northeast. Shared systems remain generic; the region supplies distinct geography, climate, seasonality, travel burden, surfaces, event timing, opportunity structure, and Loretta routing.

## Game Content Footprint

For Region #2, the initial game-content footprint is **North Carolina, South Carolina, Georgia, Florida, Alabama, and Tennessee**. This is a product scope boundary for the first Southeast implementation, not a claim that these six states exactly equal an AMA administrative boundary.

## 2026 Road to Loretta's Reference

MX Sports' 2026 Southeast Area Qualifier schedule provides a strong representative venue set:

- Echeconnee MX — Lizella, GA
- South of the Border MX — Hamer, SC
- The Shoals MX — Donalds, SC
- Elizabeth City MX — Elizabeth City, NC
- Orlando MX Park — Orlando, FL
- North Carolina Motorsports Park — Henderson, NC
- Monster Mountain MX Park — Tallassee, AL
- Lazy River MX — Dalton, GA

The 2026 Southeast Regional Championships are split by class group:

- Amateur Regional — Muddy Creek, TN
- Youth Regional — Gatorback, FL

The current MX Sports qualification model remains two-step: Area Qualifier → same-region Regional Championship → Loretta Lynn's National. In 2026, the guaranteed advancement reference is top 9 from Southeast Area Qualifiers and top 6 from Southeast Regionals. This is stored as a dated reference only; production gameplay must continue to consume current rules data rather than freezing 2026 rules forever.

## Climate & Seasonality

NOAA describes most of the Southeast as humid subtropical, warm and wet, with strong warm-season rainfall influences in coastal areas and Florida. NOAA also documents high rainfall, heavy-rain events, heat, drought variability, and tropical weather as meaningful regional pressures.

Gameplay implications:

- Outdoor riding can exist across all 12 months in the regional model, unlike the Northeast's winter closure pattern.
- Winter and early spring become valuable racing/training months.
- Summer remains rideable but carries stronger heat, humidity, thunderstorm, and heavy-rain penalties.
- Fall remains useful but can carry tropical-storm disruption risk.
- Weather should shift track conditions, fatigue, cancellation probability, maintenance burden, and travel decisions rather than simply toggling events on/off.

## Surface Identity

The first Southeast profile emphasizes **sand, loam, clay, red clay, and mixed hardpack**. The goal is not to assign one surface to the entire region; it is to create a different distribution of conditions from the Northeast and force broader setup/skill adaptation.

Gameplay implications:

- Sand competence matters more often, particularly for Florida-oriented programs.
- Clay/red-clay conditions can become slick/rutted after heavy rain and hard/baked when dry.
- Setup choices should react to moisture and heat, not only venue identity.

## Travel & Program Shape

The Southeast content footprint is physically broader than the Northeast reference footprint. A family can realistically face very different commitment levels between a nearby Carolinas/Georgia weekend and a Florida-to-Tennessee regional trip.

Gameplay implications:

- Wider travel bands than Northeast.
- More long-haul weekends for families chasing the full regional program.
- Higher fuel/lodging pressure when pursuing distant qualifiers or regionals.
- More meaningful decisions around school/work time, departure day, fatigue, and whether a distant event is worth the opportunity.

## Event Timing Identity

The 2026 Southeast Area Qualifier schedule begins in February and runs through April, while the Southeast Regionals occur in late May and early June. This creates a materially earlier championship-pressure window than the Northeast reference region.

Gameplay implications:

- Southeast riders can enter meaningful qualification pressure while Northeast riders may still be in winter/off-season mode.
- Preseason bike prep and fitness decisions happen earlier.
- The calendar engine must allow region-specific event windows rather than applying one national cadence.

## Material Differences From Northeast

1. **Riding season:** Southeast modeled as year-round availability; Northeast has winter closure/indoor-heavy months.
2. **Primary weather pressure:** Southeast emphasizes heat, humidity, heavy rain, thunderstorms and tropical systems; Northeast emphasizes snow/freeze, spring saturation and shorter season constraints.
3. **Travel footprint:** Southeast uses broader travel bands and more frequent long-haul choices across its first content footprint.
4. **Surface distribution:** Southeast adds clay/red-clay emphasis and stronger sand frequency; Northeast retains more hardpack/rocky/mixed technical identity.
5. **Qualifier timing:** Southeast Road to Loretta activity starts earlier in the year in the 2026 reference schedule.
6. **Career rhythm:** Southeast can support winter racing/training, changing when families spend money, rebuild bikes, and peak fitness.

## Explicit Non-Goals / Research Guardrails

- Do not copy Northeast venues, schedules, travel thresholds, weather curves, or economy values and merely rename them.
- Do not treat the six-state game footprint as an immutable official AMA region definition.
- Do not freeze annual Loretta dates or advancement counts in gameplay logic.
- Do not assume every Southeast track is sand or every family trains year-round.
- Training-facility, dealer/team, sponsor, and local-series depth should be expanded only when later child issues have sufficient source-backed content.

## Sources

- MX Sports — 2026 Amateur Race Schedule: https://mxsports.com/events
- MX Sports — How to Qualify: https://mxsports.com/how-to-qualify
- MX Sports — 2026 Supplemental Rules: https://mxsports.com/supplemental-rules
- MX Sports — 2026 Area Qualifier and Regional Championship announcement: https://mxsports.com/2025/12/11/2026-ama-amateur-national-motocross-area-qualifier-and-regional-championship-dates
- NOAA — Climate of the Southeast U.S.: https://repository.library.noaa.gov/view/noaa/56807/noaa_56807_DS1.pdf
- U.S. Climate Resilience Toolkit / NOAA — Southeast climate content: https://toolkit.climate.gov/region/southeast/previous-content

## Approval Gate

This research authorizes implementation of the **regional profile contract only**. Child issue #319 remains responsible for building actual Southeast venues, series, calendar, weather, travel, and economy gameplay from this profile.
