import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHomeGeography } from '../src/systems/geography.js';
import {
  discoverRegionAwareEvents, geographyCommitPreview, applyTravelCommit,
  resolveVenueWeekend, geographyDashboard, serializeGeographyIntegration,
  restoreGeographyIntegration,
} from '../src/systems/geographyIntegration.js';

test('#290 region-aware discovery ranks local events first but preserves distant opportunities', () => {
  const home = createHomeGeography();
  const events = [
    { id: 'local', venueId: 'ne-ct-riverbend', level: 'local', type: 'race' },
    { id: 'regional', venueId: 'ne-pa-ridge', level: 'regional', type: 'race' },
    { id: 'qualifier', venueId: 'ne-me-pine', level: 'regional', type: 'area-qualifier' },
  ];
  const discovered = discoverRegionAwareEvents(home, events);
  assert.equal(discovered[0].id, 'local');
  assert.equal(discovered.length, 3);
  assert.ok(discovered.some((e) => e.id === 'qualifier'));
});

test('#290 commit preview exposes travel burden and blocks unaffordable trips', () => {
  const home = createHomeGeography();
  const event = { id: 'maine', venueId: 'ne-me-pine', level: 'regional', type: 'race' };
  const preview = geographyCommitPreview({ home, event, budget: 50, currentFatigue: 40 });
  assert.equal(preview.canCommit, false);
  assert.ok(preview.warnings.some((w) => w.code === 'over-budget'));
  assert.ok(preview.opportunity.travel.cost > 50);
});

test('#290 travel commit applies economy and fatigue consequences', () => {
  const home = createHomeGeography();
  const event = { id: 'pa', venueId: 'ne-pa-ridge', level: 'regional', type: 'race' };
  const result = applyTravelCommit({ home, event, budget: 2000, fatigue: 5 });
  assert.equal(result.ok, true);
  assert.ok(result.budget < 2000);
  assert.ok(result.fatigue > 5);
  assert.equal(result.calendarLocation.venueId, 'ne-pa-ridge');
});

test('#291 dashboard exposes local, regional, travel, and familiarity context', () => {
  const home = createHomeGeography();
  const events = [
    { id: 'local', venueId: 'ne-ct-riverbend', level: 'local', type: 'race' },
    { id: 'regional', venueId: 'ne-pa-ridge', level: 'regional', type: 'race' },
  ];
  const dashboard = geographyDashboard(home, events);
  assert.equal(dashboard.home.regionName, 'Northeast');
  assert.ok(dashboard.nearbyOpportunities.length >= 1);
  assert.ok(dashboard.regionalOpportunities.length >= 1);
});

test('#291 Northeast reference journey survives travel, return home, familiarity, and reload', () => {
  let home = createHomeGeography({ state: 'CT' });
  const local = { id: 'local-race', venueId: 'ne-ct-riverbend', level: 'local', type: 'race' };
  const area = { id: 'area-qualifier', venueId: 'ne-me-pine', level: 'regional', type: 'area-qualifier', lorettaRegion: 'northeast' };
  const regional = { id: 'regional-championship', venueId: 'ne-ny-valley', level: 'regional', type: 'regional-championship', lorettaRegion: 'northeast' };

  let budget = 3000;
  let fatigue = 0;
  const localTrip = applyTravelCommit({ home, event: local, budget, fatigue });
  assert.equal(localTrip.ok, true);
  budget = localTrip.budget;
  fatigue = localTrip.fatigue;
  let resolved = resolveVenueWeekend({ home, event: local, result: { finish: 2, podium: true }, fatigue });
  home = resolved.home;
  fatigue = resolved.fatigueAfterReturn;

  const areaTrip = applyTravelCommit({ home, event: area, budget, fatigue });
  assert.equal(areaTrip.ok, true);
  budget = areaTrip.budget;
  fatigue = areaTrip.fatigue;
  resolved = resolveVenueWeekend({ home, event: area, result: { finish: 4 }, fatigue });
  home = resolved.home;
  fatigue = resolved.fatigueAfterReturn;

  const regionalTrip = applyTravelCommit({ home, event: regional, budget, fatigue });
  assert.equal(regionalTrip.ok, true);
  budget = regionalTrip.budget;
  fatigue = regionalTrip.fatigue;
  resolved = resolveVenueWeekend({ home, event: regional, result: { finish: 6 }, fatigue });
  home = resolved.home;
  fatigue = resolved.fatigueAfterReturn;

  assert.equal(home.state, 'CT');
  assert.ok(home.visits['ne-ct-riverbend'] >= 1);
  assert.ok(home.visits['ne-me-pine'] >= 1);
  assert.ok(home.visits['ne-ny-valley'] >= 1);
  assert.ok(budget < 3000);

  const restored = restoreGeographyIntegration(serializeGeographyIntegration({ home, budget, fatigue }));
  assert.equal(restored.home.regionId, 'northeast');
  assert.equal(restored.home.state, 'CT');
  assert.equal(restored.budget, budget);
  assert.deepEqual(restored.home.visits, home.visits);
});
