import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createCultureState,
  restoreCultureState,
  serializeCultureState,
  discoverProAttendanceEvents,
  previewProAttendance,
  buildPitAtmosphere,
  attendProRace,
  acquireMemorabilia,
  displayMemorabilia,
  transferMemorabilia,
  collectionSummary,
} from '../src/systems/motocrossCulture.js';

test('#102 pro attendance discovery is region-specific and date based', () => {
  const northeast = discoverProAttendanceEvents({ year: 2027, regionId: 'northeast' });
  const southeast = discoverProAttendanceEvents({ year: 2027, regionId: 'southeast' });
  assert.ok(northeast.length >= 2);
  assert.ok(southeast.length >= 2);
  assert.ok(northeast.every((event) => event.regionId === 'northeast'));
  assert.ok(southeast.every((event) => event.regionId === 'southeast'));
  assert.match(northeast[0].date, /^2027-\d{2}-\d{2}$/);
  assert.notDeepEqual(northeast.map((e) => e.eventId), southeast.map((e) => e.eventId));
});

test('#102 youth attendance requires a guardian and respects family budget', () => {
  const event = discoverProAttendanceEvents({ year: 2027, regionId: 'northeast' })[0];
  const blocked = previewProAttendance({ event, familyBudget: 20, riderAge: 9, travelMiles: 80, familySize: 3 });
  assert.equal(blocked.guardianRequired, true);
  assert.equal(blocked.eligible, false);
  const approved = previewProAttendance({ event, familyBudget: 1200, riderAge: 9, travelMiles: 80, familySize: 3 });
  assert.equal(approved.eligible, true);
  assert.ok(approved.totalCost > event.baseTicket);
});

test('#155 pit atmosphere reacts to access and weather while staying deterministic', () => {
  const event = discoverProAttendanceEvents({ year: 2027, regionId: 'southeast' })[0];
  const general = buildPitAtmosphere({ event, weather: 'hot', access: 'general', riderAge: 10 });
  const paddock = buildPitAtmosphere({ event, weather: 'hot', access: 'paddock', riderAge: 10 });
  assert.deepEqual(general, buildPitAtmosphere({ event, weather: 'hot', access: 'general', riderAge: 10 }));
  assert.ok(paddock.pitAccess > general.pitAccess);
  assert.ok(general.sensoryIntensity > 0);
  assert.ok(general.details.length >= 4);
  const storm = buildPitAtmosphere({ event, weather: 'storm', access: 'general', riderAge: 10 });
  assert.ok(storm.familyComfort < general.familyComfort);
});

test('#102/#155 attending a pro race creates an actual career memory and inspiration', () => {
  const event = discoverProAttendanceEvents({ year: 2027, regionId: 'northeast' })[0];
  const preview = previewProAttendance({ event, familyBudget: 1500, riderAge: 11, travelMiles: 40, familySize: 2 });
  const result = attendProRace(createCultureState({ seasonYear: 2027 }), {
    event,
    preview,
    riderAge: 11,
    weather: 'clear',
    access: 'pit-pass',
    heroName: 'Jordan Hale',
  });
  assert.equal(result.attended, true);
  assert.equal(result.state.attendance.length, 1);
  assert.equal(result.state.memories.length, 1);
  assert.equal(result.state.memories[0].eventId, event.eventId);
  assert.ok(result.state.inspiration > 0);
  const duplicate = attendProRace(result.state, { event, preview, riderAge: 11 });
  assert.equal(duplicate.attended, false);
});

test('#101 memorabilia has stable provenance, ownership history and memory links', () => {
  const event = discoverProAttendanceEvents({ year: 2027, regionId: 'northeast' })[0];
  const preview = previewProAttendance({ event, familyBudget: 1500, riderAge: 12 });
  const attended = attendProRace(createCultureState({ seasonYear: 2027 }), { event, preview, riderAge: 12, access: 'pit-pass', heroName: 'Casey Ward' });
  const acquired = acquireMemorabilia(attended.state, {
    eventId: event.eventId,
    type: 'signed_number_plate',
    acquiredDate: event.date,
    ownerId: 'rider-1',
    signedBy: 'Casey Ward',
    source: 'paddock-gift',
    memoryId: attended.memory.id,
  });
  assert.equal(acquired.acquired, true);
  assert.match(acquired.item.assetId, /^mxm-/);
  assert.match(acquired.item.serial, /^MEM-/);
  assert.equal(acquired.item.sourceEventId, event.eventId);
  assert.equal(acquired.item.ownershipHistory[0].ownerId, 'rider-1');
  assert.deepEqual(acquired.item.memoryLinks, [attended.memory.id]);
  assert.ok(acquired.item.significance >= 70);
});

test('#101 collection supports display, transfer and meaningful summaries', () => {
  let state = createCultureState({ seasonYear: 2028 });
  let result = acquireMemorabilia(state, { eventId: 'event-a', type: 'signed_jersey', acquiredDate: '2028-05-01', ownerId: 'rider', signedBy: 'Avery Stone' });
  state = result.state;
  const assetId = result.item.assetId;
  result = acquireMemorabilia(state, { eventId: 'event-a', type: 'event_program', acquiredDate: '2028-05-01', ownerId: 'rider' });
  state = result.state;
  const displayed = displayMemorabilia(state, assetId, 'garage-trophy-wall');
  assert.equal(displayed.displayed, true);
  assert.equal(displayed.item.displayLocation, 'garage-trophy-wall');
  const summary = collectionSummary(displayed.state);
  assert.equal(summary.count, 2);
  assert.equal(summary.displayed, 1);
  assert.equal(summary.signed, 1);
  assert.equal(summary.mostMeaningful.assetId, assetId);
  const transferred = transferMemorabilia(displayed.state, assetId, { toOwnerId: 'child-rider', date: '2048-12-25', reason: 'inheritance' });
  assert.equal(transferred.transferred, true);
  assert.equal(transferred.item.ownerId, 'child-rider');
  assert.equal(transferred.item.ownershipHistory.at(-1).reason, 'inheritance');
});

test('#101/#102/#155 culture state survives save/load', () => {
  const event = discoverProAttendanceEvents({ year: 2029, regionId: 'southeast' })[0];
  const preview = previewProAttendance({ event, familyBudget: 2200, riderAge: 13 });
  let state = attendProRace(createCultureState({ seasonYear: 2029 }), { event, preview, riderAge: 13, weather: 'hot', access: 'paddock', heroName: 'Morgan Reed' }).state;
  const memoryId = state.memories[0].id;
  state = acquireMemorabilia(state, { eventId: event.eventId, type: 'signed_goggles', acquiredDate: event.date, ownerId: 'rider', signedBy: 'Morgan Reed', memoryId }).state;
  const restored = restoreCultureState(JSON.parse(serializeCultureState(state)));
  assert.deepEqual(restored, state);
  assert.equal(restored.attendance.length, 1);
  assert.equal(Object.keys(restored.memorabilia).length, 1);
});
