# Regional Identity Framework

## Principle

Future regions are not clones of the Northeast. Shared code provides primitives, interfaces, persistence contracts, and reusable UI patterns only. Every real region requires its own research-backed regional profile before gameplay implementation begins.

## Required research profile

Every region must document:

- Geographic footprint and realistic home bases
- Climate and riding season
- Dominant surfaces and terrain
- Event density and weekend cadence
- Local versus long-distance travel patterns
- Promoter/series structure and local prestige
- Entry, gate, travel, and lodging economics
- Practice culture and off-weekend opportunities
- Dealer, shop, team, and sponsor ecosystem
- Rider field size, archetypes, and competition culture
- Weather disruptions and seasonal constraints
- Loretta Area/Regional routing relevant to that region
- Additional local pressures that should materially change gameplay
- Research sources and review date

## Architecture contract

`src/systems/regionalProfiles.js` owns the validation contract and reusable runtime primitives. Region-specific content belongs in profiles/adapters rather than hard-coded branches in shared engines.

A future region is not considered implementation-ready until `validateRegionalProfile()` passes and its research sources are documented.

## Approved researched profiles

- **Northeast** — reference region and first deeply modeled career world.
- **Southeast** — Region #2 research gate approved in [`SOUTHEAST_REGIONAL_RESEARCH.md`](./SOUTHEAST_REGIONAL_RESEARCH.md). The research profile authorizes implementation through child issue #319; it does not imply that Southeast gameplay is complete.

## Northeast assumptions audited

The current Northeast vertical slice contains several assumptions that must not become universal defaults:

- March-October riding season
- Four-season freeze/mud/heat/fall pattern
- Day-trip and short interstate travel density
- Northeast-specific toll/lodging pressure
- Hardpack/sand/loam/rocky surface mix
- Weekend club/regional event cadence
- Local dealer/shop/team relationship emphasis
- Repeat local rival fields
- Northeast Loretta routing

These are valid Northeast content. They are not generic U.S. motocross rules.

## Extension points

Regional implementations may vary:

- Event generators and cadence
- Weather and closure logic
- Travel bands and cost assumptions
- Practice availability
- Track surface distribution
- Event economics
- Support ecosystems
- Reputation sources
- Competition field composition
- Seasonal scheduling constraints
- Loretta routing metadata

## Gate for future regions

Before any future region is marked complete:

1. Produce a research-backed regional profile.
2. Validate it through the shared contract.
3. Identify mechanics that differ from existing regions.
4. Implement those differences through profile/adapters rather than copying Northeast files.
5. Add tests proving the region behaves materially differently where research says it should.
6. Run a region-specific multi-season E2E proof.

A simple data reskin does not satisfy this gate.
