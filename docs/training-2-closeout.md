# Training & Practice 2.0 closeout

Training 2.0 now owns the player-facing training lifecycle while Rider Development remains the canonical skill-development engine.

## Player contract
Browse → compare quote → explicit confirm → canonical resolution → persistent receipt → history/coaching review → save/reload.

## Integrated context
- Life Between Races owns available time and responsibility pressure.
- Rider state owns fatigue/injury restrictions.
- Training context can block riding for weather/track access or facilities and can provide coaching/facility quality.
- Training support/access owns passes, packages, discounts and allotments without creating cash.
- The active practice/race bike receives visible wear; starts now count as real riding load.
- When Equipment 2.0 gear is attached to the game state, practice records gear/consumable use through the canonical equipment-use resolver.
- History reconciles out-of-pocket spend, retail value and support rather than keeping a second money ledger.

## Completion proof
`test/trainingCloseout.test.mjs` covers history, coaching narrative, restrictions, equipment consequences and save/load. `e2e/training-2.spec.mjs` proves the 390x844 browse → quote → confirm → receipt → history → reload flow and desktop overflow check.
