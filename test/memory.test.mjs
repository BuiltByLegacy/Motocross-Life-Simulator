import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeMemory, MemoryTimeline, FAMILY_ROLES } from '../src/systems/memory.js';

test('#68 makeMemory normalizes legacy shape and adds rich fields', () => {
  const m = makeMemory({
    title: 'First Podium', summary: 'Third overall.', emotion: ['pride'],
    people: ['dad', 'mom'], tags: ['first_time'], importance: 80,
  }, { seasonNumber: 1, week: 5, riderAge: 9, id: 'm1' });
  assert.equal(m.id, 'm1');
  assert.deepEqual(m.tone, ['pride']);
  assert.equal(m.emotion[0], 'pride'); // legacy alias kept
  assert.equal(m.dayIndex, 4 * 7); // (season1, week5)
  assert.equal(m.participants.length, 2);
  assert.equal(m.participants[0].role, 'dad'); // family role inferred
  assert.deepEqual(m.people, ['dad', 'mom']); // legacy flat list preserved
});

test('#68 entity links and source references are stored', () => {
  const m = makeMemory({
    title: 'New Bike', entities: [{ kind: 'bike', id: 'b1', name: 'KX65' }],
    source: { system: 'marketplace', eventId: 'sale7' },
  }, { seasonNumber: 2, week: 1 });
  assert.equal(m.entities[0].kind, 'bike');
  assert.equal(m.source.system, 'marketplace');
  assert.equal(m.seasonNumber, 2);
  assert.equal(m.dayIndex, 84); // season 2 week 1
});

test('#71 rich participants carry role, support, and impact', () => {
  const m = makeMemory({
    title: 'What It Cost',
    participants: [{ id: 'dad', support: 'sacrifice', impact: 'high' }, { id: 'coach_mike', support: 'coached' }],
  });
  const dad = m.participants.find((p) => p.id === 'dad');
  assert.equal(dad.support, 'sacrifice');
  assert.equal(dad.role, 'dad');
  const coach = m.participants.find((p) => p.id === 'coach_mike');
  assert.equal(coach.role, 'coach');
});

function sampleTimeline() {
  return new MemoryTimeline([
    makeMemory({ title: 'First Race', tags: ['racing'], importance: 74, tone: ['nerves'], source: { system: 'race:finished' } }, { seasonNumber: 1, week: 3, id: 'a' }),
    makeMemory({ title: 'First Win', tags: ['milestone'], importance: 90, people: ['dad'], entities: [{ kind: 'event', id: 'e1' }], source: { system: 'race:finished' } }, { seasonNumber: 1, week: 7, id: 'b' }),
    makeMemory({ title: 'New Bike', entities: [{ kind: 'bike', id: 'bike9', name: 'KX85' }], tags: ['bike'], importance: 52 }, { seasonNumber: 2, week: 1, id: 'c' }),
    makeMemory({ title: 'Dad Drove All Night', type: 'relationship', participants: [{ id: 'dad', support: 'drove' }], importance: 60 }, { seasonNumber: 2, week: 2, id: 'd' }),
  ]);
}

test('#72 chronological ordering is deterministic', () => {
  const t = sampleTimeline();
  const ids = t.career({ sort: 'chrono' }).map((m) => m.id);
  assert.deepEqual(ids, ['a', 'b', 'c', 'd']);
  const recent = t.career({ sort: 'recent' }).map((m) => m.id);
  assert.deepEqual(recent, ['d', 'c', 'b', 'a']);
  const important = t.career({ sort: 'importance' }).map((m) => m.id);
  assert.deepEqual(important, ['b', 'a', 'd', 'c']);
});

test('#72 scopes: season, family, bike, object', () => {
  const t = sampleTimeline();
  assert.deepEqual(t.season(1).map((m) => m.id), ['a', 'b']);
  assert.deepEqual(t.family().map((m) => m.id), ['b', 'd']); // dad participants
  assert.deepEqual(t.forBike('bike9').map((m) => m.id), ['c']);
  assert.deepEqual(t.query({ scope: 'object' }).map((m) => m.id), ['c']);
});

test('#72 filters: tag, tone, person, source, date range', () => {
  const t = sampleTimeline();
  assert.deepEqual(t.query({ tag: 'milestone' }).map((m) => m.id), ['b']);
  assert.deepEqual(t.query({ tone: 'nerves' }).map((m) => m.id), ['a']);
  assert.deepEqual(t.forPerson('dad').map((m) => m.id), ['b', 'd']);
  assert.deepEqual(t.query({ source: 'race:finished' }).map((m) => m.id), ['a', 'b']);
  assert.deepEqual(t.query({ fromDay: 84 }).map((m) => m.id), ['c', 'd']); // season 2+
});

test('#72 pagination via limit + offset', () => {
  const t = sampleTimeline();
  assert.deepEqual(t.career({ sort: 'chrono', limit: 2 }).map((m) => m.id), ['a', 'b']);
  assert.deepEqual(t.career({ sort: 'chrono', limit: 2, offset: 2 }).map((m) => m.id), ['c', 'd']);
});

test('#72 seasonsIndex groups counts per season', () => {
  const t = sampleTimeline();
  assert.deepEqual(t.seasonsIndex(), [{ season: 1, count: 2 }, { season: 2, count: 2 }]);
});

test('FAMILY_ROLES contains the core family', () => {
  for (const r of ['dad', 'mom', 'spouse', 'child']) assert.ok(FAMILY_ROLES.has(r));
});
