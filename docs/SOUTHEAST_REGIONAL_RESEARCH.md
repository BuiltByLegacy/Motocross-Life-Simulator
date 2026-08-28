# Southeast Regional Identity Research

Issue: #318  
Reviewed: 2026-08-26

## Purpose

Define Region #2 before gameplay implementation. The Southeast is intentionally not a Northeast reskin. Shared systems stay generic while the region supplies distinct geography, climate, seasonality, surfaces, travel burden, event timing, support culture, and Road to Loretta routing.

## Game content footprint

The first Southeast game-content footprint is **North Carolina, South Carolina, Georgia, Florida, Alabama, and Tennessee**. This is a product boundary for Region #2, not a claim that these states exactly match an official administrative region.

## Representative venues

The implementation uses a 2026 Road to Loretta reference set plus the two Regional Championship anchors:

1. Echeconnee MX — Georgia
2. South of the Border MX — South Carolina
3. The Shoals MX — South Carolina
4. Elizabeth City MX — North Carolina
5. Orlando MX Park — Florida
6. North Carolina Motorsports Park — North Carolina
7. Monster Mountain MX Park — Alabama
8. Lazy River MX — Georgia
9. Muddy Creek Raceway — Tennessee
10. Gatorback Cycle Park — Florida

Venue coordinates in code are simulation inputs for consistent relative travel calculations, not navigation data.

## Climate and riding season

The gameplay profile models the Southeast as warm, humid, and broadly rideable across the year. That creates a very different season from the Northeast winter-closure pattern. Winter and early spring are valuable racing/training months; summer remains rideable but heat, humidity, thunderstorms, and heavy rain increase fatigue, cancellation risk, maintenance load, and track-condition volatility. Fall remains useful while tropical-weather disruption becomes a regional risk.

## Surface identity

The first profile emphasizes **sand, loam, clay, red clay, and mixed hardpack**. Sand tends to drain better in wet weather but creates greater physical load. Clay and red clay can become slick/rutted in wet conditions and hard/baked when hot and dry. The region therefore rewards setup and skill adaptation rather than a single universal surface model.

## Travel and economics

The six-state footprint creates a wider north/south program than the Northeast reference world. A nearby Carolinas or Georgia weekend can still be a day trip, while Florida-to-Tennessee or Northeast-to-Southeast commitments become true long-haul weekends. The game therefore uses wider local/regional distance bands, then adds a separate cross-region burden for fuel, lodging, time, family/school impact, and fatigue.

## Event timing

The researched reference supports meaningful early-year qualifier pressure, so the game can offer Southeast racing and training while the Northeast is still largely closed. Calendar 2.0 events use real ISO dates; event availability attaches to time rather than defining time.

## Road to Loretta routing

The 2026 reference is stored as dated research only. It represents Area Qualifier → same-region Regional Championship → National progression, with the then-current advancement references stored in the profile. Production systems must keep the rules season-data-driven instead of freezing one year's advancement numbers permanently. Once a rider has qualified to a Regional in a class, the career model prevents using another Area Qualifier in that same class as a reroll exploit.

## Support ecosystem and competition culture

The Southeast profile leans into dealer/shop/local-team relationships, training facilities, long-season visibility, larger mixed fields, and traveling amateur programs. The career world should include repeat regional rivals but also more transient fields than a compact local Northeast program. Sponsor/team/dealer opportunities depend on actual regional history, results, professionalism, and relationships.

## Material differences from Northeast

- Southeast outdoor riding is available across all twelve months; Northeast has winter closure pressure.
- Southeast summer gameplay centers on heat/humidity/storm management; Northeast winter/spring closure and saturation are stronger constraints.
- Southeast has a stronger sand/clay/red-clay mix; Northeast includes rocky hardpack and four-season variation.
- Southeast travel bands are wider and full-region programs create more long-haul commitments.
- Southeast event cadence supports early-year racing/qualifier pressure while Northeast remains more seasonal.
- Southeast fields are modeled with more traveling/transient amateur participation; Northeast emphasizes repeated compact-region rivals.
- Southeast training mobility can become a destination for Northeast families during winter, creating a real cross-region cost/fatigue decision.

## Research provenance

The profile was based on the 2026 MX Sports event/qualification/supplemental-rule references and NOAA Southeast climate references gathered for #318. Annual sporting rules are treated as dated references rather than permanent constants.

## Implementation gate

`SOUTHEAST_PROFILE` must validate against the shared regional contract. Automated tests must prove the profile behaves differently from Northeast before #318 is considered complete.
