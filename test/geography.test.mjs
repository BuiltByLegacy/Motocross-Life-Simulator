import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  NORTHEAST_VENUES, NORTHEAST_SERIES, createHomeGeography, migrateHomeGeography,
  venueById, travelQuote, calendarLocation, rankEventsForHome, recordVenueVisit,
  homeRegionSummary,
} from '../src/systems/geography.js';
import { CareerCalendar, makeEntry } from '../src/systems/careerCalendar.js';

test('#287 Northeast dataset has unique stable venue ids and series references', () => {
  assert.ok(NORTHEAST_VENUES.length >= 8);
  assert.equal(new Set(NORTHEAST_VENUES.map((v) => v.id)).size, NORTHEAST_VENUES.length);
  for (const series of NORTHEAST_SERIES) {
    for (const id of series.venueIds) assert.ok(venueById(id), `${series.id} references ${id}`);
  }
});

test('#287 home geography migrates and persists independently of Loretta competition regions', () => {
  const home = createHomeGeography({ regionId: 'northeast', state: 'CT', lat: 41.86, lon: -72.45 });
  const roundTrip = migrateHomeGeography(JSON.parse(JSON.stringify(home)));
  assert.equal(roundTrip.regionId, 'northeast');
  assert.equal(roundTrip.state, 'CT');
  assert.deepEqual(roundTrip.familiarity, {});
});

test('#289 travel quote makes farther events more expensive and tiring', () => {
  const home = createHomeGeography();
  const near = travelQuote(home, venueById('ne-ct-riverbend'));
  const far = travelQuote(home, venueById('ne-me-pine'));
  assert.equal(near.valid, true);
  assert.equal(far.valid, true);
  assert.ok(far.miles > near.miles);
  assert.ok(far.cost > near.cost);
  assert.ok(far.fatigue > near.fatigue);
});

test('#290 geography location plugs into CareerCalendar travel conflict behavior', () => {
  const home = createHomeGeography();
  const cal = new CareerCalendar({ seasonDays: 84 });
  cal.add(makeEntry({ startDay: 10, category: 'race', title: 'Home race', location: calendarLocation(home, 'ne-ct-riverbend') }));
  cal.add(makeEntry({ startDay: 11, category: 'race', title: 'Maine race', location: calendarLocation(home, 'ne-me-pine') }));
  assert.ok(cal.conflicts().some((c) => c.type === 'travel' || c.type === 'rest'));
});

test('#290 event discovery prefers practical home-region opportunities without hiding distant events', () => {
  const home = createHomeGeography();
  const ranked = rankEventsForHome(home, [
    { id: 'local', venueId: 'ne-ct-riverbend', level: 'local' },
    { id: 'regional', venueId: 'ne-pa-ridge', level: 'regional' },
    { id: 'far', venueId: 'ne-me-pine', level: 'regional' },
  ]);
  assert.equal(ranked[0].id, 'local');
  assert.equal(ranked.length, 3);
  assert.ok(ranked.every((e) => e.travel.valid));
});

test('#291 repeated venue visits create familiarity and home-region dashboard context', () => {
  let home = createHomeGeography();
  home = recordVenueVisit(home, 'ne-ct-riverbend', { result: { finish: 5 } });
  home = recordVenueVisit(home, 'ne-ct-riverbend', { result: { podium: true } });
  assert.equal(home.visits['ne-ct-riverbend'], 2);
  assert.ok(home.familiarity['ne-ct-riverbend'] >= 12);
  const summary = homeRegionSummary(home);
  assert.equal(summary.regionName, 'Northeast');
  assert.equal(summary.state, 'CT');
  assert.equal(summary.visitedVenues, 1);
  assert.equal(summary.mostFamiliar[0], 'ne-ct-riverbend');
  assert.equal(summary.nearby[0].venue.id, 'ne-ct-riverbend');
});
