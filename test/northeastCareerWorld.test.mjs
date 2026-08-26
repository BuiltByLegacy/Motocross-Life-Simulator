import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ChampionshipState,
  LocalReputationState,
  NortheastRivalWorld,
  buildNortheastChampionshipSchedule,
  careerWorldSnapshot,
  restoreCareerWorldSnapshot,
  validateNortheastWorldData,
} from '../src/systems/northeastCareerWorld.js';

test('#296 deterministic Northeast schedule uses real series venues and off weekends', () => {
  const a = buildNortheastChampionshipSchedule({ seriesId: 'ne-local-cup', seasonYear: 2028 });
  const b = buildNortheastChampionshipSchedule({ seriesId: 'ne-local-cup', seasonYear: 2028 });
  assert.deepEqual(a, b);
  assert.equal(a.length, 8);
  assert.ok(a.every((e) => e.championshipEvent && e.lorettasPath === false));
  assert.ok(a.every((e) => [1, 3].includes(e.weekOfMonth)));
  assert.equal(validateNortheastWorldData().valid, true);
});

test('#296 standings update, skipped rounds remain valid, recap survives save/load', () => {
  const champ = new ChampionshipState({ seriesId: 'ne-local-cup', seasonYear: 2028 });
  champ.recordEventResult(champ.schedule[0].id, [
    { riderId: 'player', name: 'Player', finish: 1 },
    { riderId: 'rival', name: 'Rival', finish: 2 },
  ]);
  champ.skipEvent(champ.schedule[1].id);
  champ.recordEventResult(champ.schedule[2].id, [
    { riderId: 'rival', name: 'Rival', finish: 1 },
    { riderId: 'player', name: 'Player', finish: 3 },
  ]);
  const recap = champ.recap('player');
  assert.equal(recap.starts, 2);
  assert.equal(recap.roundsSkipped, 1);
  assert.equal(recap.wins, 1);
  const restored = ChampionshipState.fromJSON(JSON.parse(JSON.stringify(champ.toJSON())));
  assert.deepEqual(restored.table(), champ.table());
  assert.equal(restored.recap('player').roundsSkipped, 1);
});

test('#297 recurring rivals are deterministic across the same event and build head-to-head history', () => {
  const world = new NortheastRivalWorld({ seasonYear: 2028 });
  const first = world.fieldForEvent({ eventId: 'round-1', klass: '50cc', level: 'local', venueId: 'ne-ct-riverbend' });
  const repeat = world.fieldForEvent({ eventId: 'round-1', klass: '50cc', level: 'local', venueId: 'ne-ct-riverbend' });
  assert.deepEqual(first.map((r) => r.id), repeat.map((r) => r.id));
  assert.ok(first.length >= 2);
  const rival = first[0];
  world.encounter(rival.id, { playerFinish: 1, rivalFinish: 2, venueId: 'ne-ct-riverbend' });
  world.encounter(rival.id, { playerFinish: 4, rivalFinish: 2, venueId: 'ne-ma-sandpit', incident: 'hard-pass' });
  const history = world.history[rival.id];
  assert.equal(history.meetings, 2);
  assert.equal(history.playerWins, 1);
  assert.equal(history.rivalWins, 1);
  assert.equal(Object.keys(history.venues).length, 2);
});

test('#297 rivals develop unevenly and class movement is not guaranteed', () => {
  const world = new NortheastRivalWorld({ seasonYear: 2028 });
  const before = Object.values(world.rivals).map((r) => ({ id: r.id, klass: r.currentClass, development: r.development }));
  world.advanceSeason({ nextYear: 2029 });
  const after = Object.values(world.rivals);
  assert.equal(world.seasonYear, 2029);
  assert.ok(after.some((r, i) => r.development !== before[i].development));
  assert.ok(after.some((r, i) => r.currentClass === before[i].klass));
});

test('#297 rival world persists across save/load and season rollover', () => {
  const world = new NortheastRivalWorld({ seasonYear: 2028 });
  const rivalId = Object.keys(world.rivals)[0];
  world.encounter(rivalId, { playerFinish: 2, rivalFinish: 1, venueId: 'ne-ct-riverbend' });
  world.advanceSeason({ nextYear: 2029 });
  const restored = NortheastRivalWorld.fromJSON(JSON.parse(JSON.stringify(world.toJSON())));
  assert.equal(restored.seasonYear, 2029);
  assert.equal(restored.history[rivalId].meetings, 1);
});

test('#298 reputation grows independently of speed and emits venue memories', () => {
  const rep = new LocalReputationState();
  const first = rep.recordVenueResult({ venueId: 'ne-ct-riverbend', finish: 8 });
  assert.ok(first.regionScore > 0);
  assert.ok(first.memories.some((m) => m.type === 'venue-first-visit'));
  const podium = rep.recordVenueResult({ venueId: 'ne-ct-riverbend', finish: 2 });
  assert.ok(podium.memories.some((m) => m.type === 'venue-first-podium'));
  const win = rep.recordVenueResult({ venueId: 'ne-ct-riverbend', finish: 1 });
  assert.ok(win.memories.some((m) => m.type === 'venue-first-win'));
  assert.equal(rep.toJSON().skill, undefined);
});

test('#298 negative sportsmanship can hurt venue reputation without changing racing skill', () => {
  const rep = new LocalReputationState({ regionScore: 30, venueScores: { 'ne-ct-riverbend': 30 } });
  const result = rep.recordVenueResult({ venueId: 'ne-ct-riverbend', finish: 4, incident: 'unsportsmanlike' });
  assert.ok(result.after < 30);
  assert.ok(result.regionScore < 30);
});

test('#298 hometown-hero hooks and all #296-#298 state persist together', () => {
  const champ = new ChampionshipState({ seriesId: 'ne-local-cup', seasonYear: 2028 });
  const rivals = new NortheastRivalWorld({ seasonYear: 2028 });
  const rep = new LocalReputationState({ regionScore: 62, venueScores: { 'ne-ct-riverbend': 70 } });
  const snapshot = careerWorldSnapshot({ championships: [champ], rivalWorld: rivals, reputation: rep });
  const restored = restoreCareerWorldSnapshot(JSON.stringify(snapshot));
  assert.equal(restored.championships.length, 1);
  assert.equal(restored.rivalWorld.seasonYear, 2028);
  assert.equal(restored.reputation.tier().id, 'hero');
  assert.equal(restored.reputation.hooks().media.storyEligible, true);
});
