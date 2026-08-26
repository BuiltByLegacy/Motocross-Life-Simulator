import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createHomeGeography } from '../src/systems/geography.js';
import {
  applyTravelCommit,
  resolveVenueWeekend,
  serializeGeographyIntegration,
  restoreGeographyIntegration,
} from '../src/systems/geographyIntegration.js';
import {
  ChampionshipState,
  LocalReputationState,
  NortheastRivalWorld,
  careerWorldSnapshot,
  restoreCareerWorldSnapshot,
} from '../src/systems/northeastCareerWorld.js';
import {
  applyOffWeekendOpportunity,
  generateOffWeekendOpportunities,
  resolveEventDisruption,
  serializeNortheastWeekendLife,
  restoreNortheastWeekendLife,
} from '../src/systems/northeastWeekendLife.js';
import { LorettasPath } from '../src/systems/lorettasPath.js';

function pickAvailable(opportunities, preferred = ['open-practice', 'club-practice', 'training', 'maintenance', 'family', 'rest']) {
  for (const type of preferred) {
    const found = opportunities.find((o) => o.type === type && o.available);
    if (found) return found;
  }
  return null;
}

test('#302 Northeast two-season career E2E survives travel, practice, cancellation, Loretta path, rollover, and reload', () => {
  const careerSeed = 'e2e-302-youth-career';
  let home = createHomeGeography({ regionId: 'northeast', state: 'CT', lat: 41.86, lon: -72.45 });
  let budget = 5200;
  let fatigue = 8;
  let weekendState = { budget, fatigue, bikeHours: 0, riderSkill: 42, familiarity: {}, calendarLog: [] };

  const local = new ChampionshipState({ seriesId: 'ne-local-cup', seasonYear: 2028 });
  const regional = new ChampionshipState({ seriesId: 'ne-regional-challenge', seasonYear: 2028 });
  const rivals = new NortheastRivalWorld({ seasonYear: 2028 });
  const reputation = new LocalReputationState();
  const lorettas = new LorettasPath({ homeRegion: 'Northeast' });

  // Season 1: commit a local race, pay travel cost, return home, build familiarity/reputation,
  // score championship points, and establish a recurring rival history.
  const localEvent = { ...local.schedule[0], date: '2028-05-06', level: 'local', type: 'local-race' };
  const committed = applyTravelCommit({ home, event: localEvent, budget, fatigue });
  assert.equal(committed.ok, true);
  budget = committed.budget;
  fatigue = committed.fatigue;

  const field = rivals.fieldForEvent({ eventId: localEvent.id, klass: '50cc', level: 'local', venueId: localEvent.venueId });
  assert.ok(field.length > 0);
  const firstRival = field[0];
  local.recordEventResult(localEvent.id, [
    { riderId: 'player', name: 'Player', finish: 2 },
    { riderId: firstRival.id, name: firstRival.name, finish: 3 },
  ]);
  rivals.encounter(firstRival.id, { playerFinish: 2, rivalFinish: 3, venueId: localEvent.venueId });
  reputation.recordVenueResult({ venueId: localEvent.venueId, finish: 2 });

  const weekendResolved = resolveVenueWeekend({ home, event: localEvent, result: { finish: 2, podium: true }, fatigue });
  home = weekendResolved.home;
  fatigue = weekendResolved.fatigueAfterReturn;
  assert.equal(home.visits[localEvent.venueId], 1);
  assert.ok(home.familiarity[localEvent.venueId] >= 8);

  // An off weekend is playable rather than a dead-end. The player can practice/rest and continue.
  weekendState = { ...weekendState, budget, fatigue, familiarity: { ...home.familiarity } };
  const offWeekend = generateOffWeekendOpportunities({
    home,
    date: '2028-05-20',
    age: 11,
    parentApproved: true,
    schoolConflict: false,
    budget: weekendState.budget,
    careerSeed,
  });
  const chosen = pickAvailable(offWeekend);
  assert.ok(chosen, 'expected at least one safe off-weekend option');
  const applied = applyOffWeekendOpportunity(weekendState, chosen);
  assert.equal(applied.ok, true);
  weekendState = applied.state;
  budget = weekendState.budget;
  fatigue = weekendState.fatigue;
  assert.ok(weekendState.calendarLog.length >= 1);

  // Weather/cancellation recovery is explicit and never leaves the calendar without an action.
  const winterDisruption = resolveEventDisruption({
    event: { id: 'winter-test', venueId: 'ne-ct-riverbend', date: '2028-01-13', month: 1 },
    home,
    careerSeed,
  });
  assert.equal(winterDisruption.status, 'cancelled');
  assert.ok(winterDisruption.recovery.some((r) => r.type === 'rest'));
  assert.ok(winterDisruption.recovery.some((r) => r.type === 'maintenance'));

  // Loretta's remains a separate national qualification path, not a home-region championship shortcut.
  const area = { id: 'aq-ne-2028', name: 'Northeast Area Qualifier', lorettaStage: 'area', region: 'Northeast', classes: ['50cc'] };
  const reg = { id: 'regional-ne-2028', name: 'Northeast Regional Championship', lorettaStage: 'regional', region: 'Northeast', classes: ['50cc'] };
  const national = { id: 'lorettas-2028', name: "Loretta Lynn's National", lorettaStage: 'national', classes: ['50cc'] };

  assert.equal(lorettas.eligibleToEnter(area, { klass: '50cc', age: 11, homeRegion: 'Northeast' }).ok, true);
  lorettas.recordAttempt(area, { klass: '50cc', finish: 7, fieldSize: 38, day: '2028-04-22' });
  assert.equal(lorettas.eligibleToEnter(reg, { klass: '50cc', age: 11, homeRegion: 'Northeast' }).ok, true);
  lorettas.recordAttempt(reg, { klass: '50cc', finish: 5, fieldSize: 42, day: '2028-06-09' });
  assert.equal(lorettas.eligibleToEnter(national, { klass: '50cc', age: 11, homeRegion: 'Northeast' }).ok, true);
  assert.equal(lorettas.advancementStatus('50cc').qualifiedForNational, true);

  // Persist all reference-world state at the end of season 1.
  const geographySave = serializeGeographyIntegration({ home, budget, fatigue });
  const weekendSave = serializeNortheastWeekendLife(weekendState);
  const worldSave = JSON.stringify(careerWorldSnapshot({ championships: [local, regional], rivalWorld: rivals, reputation }));
  const lorettasSave = JSON.stringify(lorettas.toJSON());

  const geo2 = restoreGeographyIntegration(geographySave);
  const weekend2 = restoreNortheastWeekendLife(weekendSave);
  const world2 = restoreCareerWorldSnapshot(worldSave);
  const lorettas2 = LorettasPath.fromJSON(JSON.parse(lorettasSave));

  assert.equal(geo2.home.visits[localEvent.venueId], 1);
  assert.equal(geo2.home.familiarity[localEvent.venueId], home.familiarity[localEvent.venueId]);
  assert.equal(geo2.budget, budget);
  assert.equal(geo2.fatigue, fatigue);
  assert.equal(weekend2.calendarLog.length, weekendState.calendarLog.length);
  assert.equal(world2.championships[0].recap('player').starts, 1);
  assert.equal(world2.rivalWorld.history[firstRival.id].meetings, 1);
  assert.ok(world2.reputation.regionScore > 0);
  assert.equal(lorettas2.advancementStatus('50cc').qualifiedForNational, true);

  // Season rollover: rivals change/develop, championships reset to a new year,
  // but persistent identity, history, geography and budget state carry forward.
  world2.rivalWorld.advanceSeason({ nextYear: 2029 });
  const season2Local = new ChampionshipState({ seriesId: 'ne-local-cup', seasonYear: 2029 });
  const season2Regional = new ChampionshipState({ seriesId: 'ne-regional-challenge', seasonYear: 2029 });
  const season2Event = { ...season2Local.schedule[0], date: '2029-05-05', level: 'local', type: 'local-race' };

  const season2Commit = applyTravelCommit({ home: geo2.home, event: season2Event, budget: geo2.budget, fatigue: geo2.fatigue });
  assert.equal(season2Commit.ok, true);
  const season2Field = world2.rivalWorld.fieldForEvent({ eventId: season2Event.id, klass: '50cc', level: 'local', venueId: season2Event.venueId });
  assert.ok(Array.isArray(season2Field));

  season2Local.recordEventResult(season2Event.id, [{ riderId: 'player', name: 'Player', finish: 4 }]);
  world2.reputation.recordVenueResult({ venueId: season2Event.venueId, finish: 4 });
  const season2Venue = resolveVenueWeekend({ home: geo2.home, event: season2Event, result: { finish: 4 }, fatigue: season2Commit.fatigue });

  assert.equal(world2.rivalWorld.seasonYear, 2029);
  assert.equal(world2.rivalWorld.history[firstRival.id].meetings, 1, 'rival history must survive rollover even if that rival misses the first 2029 event');
  assert.ok(season2Venue.home.visits[season2Event.venueId] >= 2, 'venue history should span seasons');
  assert.ok(world2.reputation.regionScore >= reputation.regionScore, 'local reputation should persist and continue growing');
  assert.equal(season2Regional.seasonYear, 2029);

  // Final multi-season save/reload proves all persistent domains still serialize cleanly.
  const finalWorld = restoreCareerWorldSnapshot(JSON.stringify(careerWorldSnapshot({
    championships: [season2Local, season2Regional],
    rivalWorld: world2.rivalWorld,
    reputation: world2.reputation,
  })));
  const finalGeo = restoreGeographyIntegration(serializeGeographyIntegration({
    home: season2Venue.home,
    budget: season2Commit.budget,
    fatigue: season2Venue.fatigueAfterReturn,
  }));

  assert.equal(finalWorld.rivalWorld.seasonYear, 2029);
  assert.equal(finalWorld.championships[0].seasonYear, 2029);
  assert.equal(finalWorld.championships[0].recap('player').starts, 1);
  assert.ok(finalGeo.home.visits[season2Event.venueId] >= 2);
  assert.ok(finalGeo.budget >= 0);
  assert.ok(finalGeo.fatigue >= 0 && finalGeo.fatigue <= 100);
});
