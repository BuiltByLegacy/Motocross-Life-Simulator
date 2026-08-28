import test from 'node:test';
import assert from 'node:assert/strict';

import { NORTHEAST_PROFILE, SOUTHEAST_PROFILE, validateRegionalProfile, createRegionalRuntime } from '../src/systems/regionalProfiles.js';
import { createHomeGeography, venueById, venuesForRegion, travelQuote } from '../src/systems/geography.js';
import { regionalRidingAvailability } from '../src/systems/calendarLife.js';
import { buildSoutheastCalendar, southeastEventPreview, southeastTrackCondition, southeastWeather, createSoutheastWorldState, recordSoutheastWeekend, restoreSoutheastWorld, serializeSoutheastWorld } from '../src/systems/southeastWorld.js';
import { createSoutheastLivingWorld, recordSoutheastResult, southeastSupportOpportunities, applySupportInteraction, rolloverSoutheastLivingWorld, restoreSoutheastLivingWorld, serializeSoutheastLivingWorld } from '../src/systems/southeastLivingWorld.js';
import { createMultiRegionCareer, previewCrossRegionTrip, commitCrossRegionEvent, recordCrossRegionResult, recordLorettaAreaResult, recordLorettaRegionalResult, canAttemptAreaQualifier, rolloverMultiRegionCareer, restoreMultiRegionCareer, serializeMultiRegionCareer } from '../src/systems/multiRegionCareer.js';

test('Southeast research profile validates and is materially different from Northeast', () => {
  assert.equal(validateRegionalProfile(SOUTHEAST_PROFILE).ok, true);
  assert.equal(validateRegionalProfile(NORTHEAST_PROFILE).ok, true);
  assert.equal(SOUTHEAST_PROFILE.geography.states.length, 6);
  assert.equal(venuesForRegion('southeast').length >= 8, true);

  const jan = '2027-01-15';
  assert.equal(regionalRidingAvailability(NORTHEAST_PROFILE, jan).status, 'closed');
  assert.equal(regionalRidingAvailability(SOUTHEAST_PROFILE, jan).status, 'open');
  assert.equal(SOUTHEAST_PROFILE.surfaces.includes('red-clay'), true);
  assert.equal(NORTHEAST_PROFILE.surfaces.includes('red-clay'), false);
  assert.notEqual(SOUTHEAST_PROFILE.eventCulture.cadence, NORTHEAST_PROFILE.eventCulture.cadence);

  const neRuntime = createRegionalRuntime(NORTHEAST_PROFILE);
  const seRuntime = createRegionalRuntime(SOUTHEAST_PROFILE);
  assert.equal(neRuntime.travelBandForMiles(250), 'regional');
  assert.equal(seRuntime.travelBandForMiles(250), 'overnight');
});

test('Southeast calendar uses real dates and region-specific weather/surface conditions', () => {
  const calendar = buildSoutheastCalendar(2027);
  assert.equal(calendar.length >= 8, true);
  for (const event of calendar) {
    assert.match(event.date, /^2027-\d{2}-\d{2}$/);
    assert.equal(event.regionId, 'southeast');
    assert.equal('week' in event, false);
  }

  const wet = { rain: 0.8, heat: 0.4 };
  assert.equal(southeastTrackCondition('se-ga-echeconnee', wet).condition, 'slick-rutted-clay');
  assert.equal(southeastTrackCondition('se-fl-orlando', wet).condition, 'deep-wet-sand');

  const weather = southeastWeather('2027-07-18', 'proof-seed');
  assert.equal(weather.heat > 0.6, true);
  assert.equal(weather.humidity > 0.65, true);
});

test('Northeast rider can travel into Southeast with real cost, fatigue and independent reputation', () => {
  const home = createHomeGeography({ regionId: 'northeast', state: 'CT', lat: 41.86, lon: -72.45 });
  let career = createMultiRegionCareer({ homeRegionId: 'northeast', seasonYear: 2027 });
  const event = buildSoutheastCalendar(2027).find((e) => e.venueId === 'se-ga-echeconnee');
  const preview = southeastEventPreview({ home, event, budget: 10000, seed: 'proof' });
  assert.equal(preview.valid, true);
  assert.equal(preview.travel.crossRegion, true);
  assert.equal(preview.travel.band, 'long-haul');
  assert.equal(preview.totalCost > 500, true);

  const trip = previewCrossRegionTrip({ state: career, home, event: { ...event, entryFee: preview.entryFee }, budget: 10000, fatigue: 10 });
  assert.equal(trip.ok, true);
  assert.equal(trip.crossRegion, true);
  assert.equal(trip.projectedFatigue > 10, true);
  career = commitCrossRegionEvent(career, trip).state;
  career = recordCrossRegionResult(career, { event, finish: 2, fieldSize: 30, relationshipIds: ['se-dealer-redclay'] });

  assert.equal(career.reputation.southeast.regional > 0, true);
  assert.equal(career.reputation.northeast.regional, 0);
  assert.equal(career.venueFamiliarity[event.venueId] > 0, true);
  assert.equal(career.relationships.southeast['se-dealer-redclay'].meetings, 1);

  const restored = restoreMultiRegionCareer(serializeMultiRegionCareer(career));
  assert.deepEqual(restored, career);
});

test('Southeast rider can cross north and cross-region travel is more burdensome than nearby regional racing', () => {
  const home = createHomeGeography({ regionId: 'southeast', state: 'GA', lat: 33.75, lon: -84.39 });
  const localVenue = venueById('se-ga-echeconnee');
  const northeastVenue = venueById('ne-ct-riverbend');
  const local = travelQuote(home, localVenue);
  const north = travelQuote(home, northeastVenue);
  assert.equal(local.crossRegion, false);
  assert.equal(north.crossRegion, true);
  assert.equal(north.cost > local.cost, true);
  assert.equal(north.fatigue > local.fatigue, true);
  assert.equal(north.miles > local.miles, true);
});

test('Southeast living world persists rivals, support relationships and season carryover', () => {
  const event = buildSoutheastCalendar(2027)[1];
  let world = createSoutheastLivingWorld({ seasonYear: 2027, seed: 'living-proof' });
  world = recordSoutheastResult(world, {
    event,
    finish: 1,
    fieldSize: 32,
    professionalismDelta: 8,
    rivalResults: { 'se-rival-mason': 4, 'se-rival-jace': 2 },
  });
  assert.equal(world.rivals['se-rival-mason'].meetings, 1);
  assert.equal(world.rivals['se-rival-mason'].riderWins, 1);
  assert.equal(world.reputation.regional > 0, true);

  world.reputation.local = 40;
  world.reputation.regional = 40;
  const opportunities = southeastSupportOpportunities(world, { resultsScore: 80 });
  assert.equal(opportunities.length > 0, true);
  world = applySupportInteraction(world, { opportunity: opportunities[0], outcome: 'good-introduction', relationshipDelta: 7 });
  assert.equal(world.relationships[opportunities[0].id].meetings, 1);

  const restored = restoreSoutheastLivingWorld(serializeSoutheastLivingWorld(world));
  assert.deepEqual(restored, world);
  const next = rolloverSoutheastLivingWorld(restored, 2028);
  assert.equal(next.seasonYear, 2028);
  assert.equal(next.relationships[opportunities[0].id].meetings, 1);
});

test('Loretta routing remains region-specific and blocks Area Qualifier reroll after qualification', () => {
  let career = createMultiRegionCareer({ homeRegionId: 'northeast', seasonYear: 2027 });
  const aq = recordLorettaAreaResult(career, {
    classId: '65cc-7-9', regionId: 'southeast', eventId: 'se-aq-proof', finish: 5, advanceThrough: 9,
  });
  assert.equal(aq.qualified, true);
  career = aq.state;
  assert.deepEqual(canAttemptAreaQualifier(career, { classId: '65cc-7-9', regionId: 'northeast' }), {
    ok: false, reason: 'already-qualified-for-regional', qualifiedRegionId: 'southeast',
  });

  const wrongRegional = recordLorettaRegionalResult(career, {
    classId: '65cc-7-9', regionId: 'northeast', eventId: 'ne-regional', finish: 2, advanceThrough: 6,
  });
  assert.equal(wrongRegional.qualified, false);
  assert.equal(wrongRegional.reason, 'wrong-or-unqualified-region');

  const correctRegional = recordLorettaRegionalResult(career, {
    classId: '65cc-7-9', regionId: 'southeast', eventId: 'se-regional', finish: 4, advanceThrough: 6,
  });
  assert.equal(correctRegional.qualified, true);
  assert.equal(correctRegional.state.loretta.classes['65cc-7-9'].nationalQualified, true);
});

test('Southeast world and multi-region career survive save/load and season rollover', () => {
  const event = buildSoutheastCalendar(2027)[0];
  const home = createHomeGeography({ regionId: 'northeast' });
  const preview = southeastEventPreview({ home, event, budget: 20000 });
  let regional = createSoutheastWorldState(2027);
  regional = recordSoutheastWeekend(regional, { event, result: { finish: 6 }, preview });
  assert.deepEqual(restoreSoutheastWorld(serializeSoutheastWorld(regional)), regional);

  let career = createMultiRegionCareer({ homeRegionId: 'northeast', seasonYear: 2027 });
  career = recordCrossRegionResult(career, { event, finish: 6, fieldSize: 25 });
  const before = career.reputation.southeast.local;
  career = rolloverMultiRegionCareer(career, 2028);
  assert.equal(career.seasonYear, 2028);
  assert.equal(career.seasonHistory.length, 1);
  assert.equal(career.reputation.southeast.local > 0, true);
  assert.equal(career.reputation.southeast.local <= before, true);
});
