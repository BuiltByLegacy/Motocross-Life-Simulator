import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createHistoryState,
  restoreHistoryState,
  serializeHistoryState,
  recordHistoryEvent,
  registerSeason,
  buildCareerProfile,
  upsertCareerProfile,
  updateRecordBook,
  hallOfFameScore,
  evaluateHallOfFameCandidate,
  inductHallOfFame,
  importCultureHistory,
  historyTimeline,
  eraSummary,
  subjectHistory,
} from '../src/systems/motocrossHistory.js';

test('career profile aggregates result history for player or AI subjects', () => {
  const profile = buildCareerProfile({
    subjectId: 'ai-rider-22',
    name: 'Mason Reed',
    kind: 'ai-rider',
    results: [
      { date: '2027-04-10', finish: 1 },
      { date: '2027-05-01', finish: 2 },
      { date: '2028-04-08', finish: 1 },
      { date: '2028-05-06', finish: 5 },
    ],
  });
  assert.equal(profile.subjectId, 'ai-rider-22');
  assert.equal(profile.kind, 'ai-rider');
  assert.equal(profile.starts, 4);
  assert.equal(profile.wins, 2);
  assert.equal(profile.podiums, 3);
  assert.equal(profile.seasons, 2);
});

test('history timeline is permanent, chronological and deduplicated', () => {
  let state = createHistoryState();
  let result = recordHistoryEvent(state, { id: 'evt-b', date: '2028-05-01', type: 'rivalry', title: 'Regional rivalry peaks', significance: 75 });
  state = result.state;
  result = recordHistoryEvent(state, { id: 'evt-a', date: '2027-06-01', type: 'track-history', title: 'Old track closes', significance: 90 });
  state = result.state;
  const duplicate = recordHistoryEvent(state, { id: 'evt-a', date: '2027-06-01', title: 'Duplicate' });
  assert.equal(duplicate.recorded, false);
  assert.deepEqual(state.events.map((event) => event.id), ['evt-a', 'evt-b']);
});

test('record book replaces a holder but retains the full chain of custody', () => {
  let state = createHistoryState();
  let update = updateRecordBook(state, {
    key: 'career-wins-450', label: '450 career wins', value: 32,
    holderId: 'rider-a', holderName: 'Avery Cole', date: '2031-08-02', category: 'career',
  });
  state = update.state;
  update = updateRecordBook(state, {
    key: 'career-wins-450', label: '450 career wins', value: 35,
    holderId: 'rider-b', holderName: 'Mason Reed', date: '2034-07-12', category: 'career',
  });
  state = update.state;
  assert.equal(update.changed, true);
  assert.equal(state.recordBook['career-wins-450'].holderId, 'rider-b');
  assert.equal(state.recordHistory.length, 2);
  assert.equal(state.recordHistory[1].previous.holderId, 'rider-a');
  assert.equal(state.events.filter((event) => event.type === 'record-set').length, 1);
  assert.equal(state.events.filter((event) => event.type === 'record-broken').length, 1);

  const notBroken = updateRecordBook(state, {
    key: 'career-wins-450', value: 34, holderId: 'rider-c', holderName: 'Jordan Fox', date: '2035-01-01',
  });
  assert.equal(notBroken.changed, false);
  assert.equal(notBroken.state.recordBook['career-wins-450'].holderId, 'rider-b');
});

test('lower-is-better records use the correct comparison direction', () => {
  let state = createHistoryState();
  state = updateRecordBook(state, { key: 'lap-red-clay', value: 92.4, unit: 'seconds', lowerIsBetter: true, holderId: 'one', date: '2028-01-01' }).state;
  const update = updateRecordBook(state, { key: 'lap-red-clay', value: 91.8, unit: 'seconds', lowerIsBetter: true, holderId: 'two', date: '2028-02-01' });
  assert.equal(update.changed, true);
  assert.equal(update.state.recordBook['lap-red-clay'].holderId, 'two');
});

test('Hall of Fame supports competitive and cultural legacy rather than championships alone', () => {
  const candidate = {
    subjectId: 'legacy-rider', name: 'Riley Hart', retired: true, seasons: 12,
    wins: 28, podiums: 70, championships: 2, majorComebacks: 2,
    fanImpact: 88, industryImpact: 82, communityImpact: 90, mentorshipImpact: 76,
    memorySignificance: 94, memorabiliaSignificance: 86, historicFirsts: 1,
    notableMemoryIds: ['mem-1'], notableAssetIds: ['asset-1'],
  };
  const score = hallOfFameScore(candidate);
  const evaluation = evaluateHallOfFameCandidate(candidate);
  assert.ok(score >= 70);
  assert.equal(evaluation.eligible, true);

  let state = upsertCareerProfile(createHistoryState({ currentYear: 2045 }), candidate).state;
  const induction = inductHallOfFame(state, { candidate, date: '2045-11-15' });
  assert.equal(induction.inducted, true);
  state = induction.state;
  assert.equal(state.hallOfFame['legacy-rider'].classOfYear, 2045);
  assert.equal(state.events.at(-1).type, 'hall-of-fame-induction');
  assert.deepEqual(state.events.at(-1).memoryLinks, ['mem-1']);
  assert.deepEqual(state.events.at(-1).assetLinks, ['asset-1']);

  const duplicate = inductHallOfFame(state, { candidate, date: '2046-01-01' });
  assert.equal(duplicate.inducted, false);
  assert.match(duplicate.reason, /already inducted/);
});

test('Hall of Fame rejects an unfinished thin career without an arbitrary auto-award', () => {
  const evaluation = evaluateHallOfFameCandidate({ subjectId: 'young-rider', name: 'Young Rider', seasons: 2, wins: 3, fanImpact: 90 });
  assert.equal(evaluation.eligible, false);
  assert.ok(evaluation.reasons.length > 0);
});

test('season archive, era summary and AI history exist independently of the player', () => {
  let state = createHistoryState({ currentYear: 2027 });
  state = registerSeason(state, {
    year: 2027, seriesId: 'northeast-regional', regionId: 'northeast',
    championId: 'ai-7', championName: 'Cam Torres',
    notableRivalries: [['ai-7', 'ai-8']], tracks: ['pine-hollow'],
  }).state;
  state = upsertCareerProfile(state, { subjectId: 'ai-7', name: 'Cam Torres', kind: 'ai-rider', seasons: 7, regionalTitles: 2 }).state;
  state = recordHistoryEvent(state, {
    date: '2027-09-20', type: 'championship', subjectId: 'ai-7', subjectName: 'Cam Torres', regionId: 'northeast',
    title: 'Cam Torres wins the Northeast Regional title', significance: 78,
  }).state;
  const era = eraSummary(state, { fromYear: 2027, toYear: 2027, regionId: 'northeast' });
  assert.equal(era.seasonCount, 1);
  assert.equal(era.champions[0].id, 'ai-7');
  assert.equal(subjectHistory(state, 'ai-7').events.length, 1);
});

test('culture memories and memorabilia become historical sources with provenance intact', () => {
  const culture = {
    memories: [{ id: 'culture-memory-1', type: 'pro-race-attendance', date: '2026-07-18', title: 'Met a hero', significance: 87, tags: ['pro-race'], people: ['Casey Stone'], eventId: 'ne-pro-2026' }],
    memorabilia: {
      'asset-1': {
        assetId: 'asset-1', serial: 'MEM-123', type: 'signed_jersey', label: 'Signed jersey',
        ownerId: 'rider', sourceEventId: 'ne-pro-2026', signedBy: 'Casey Stone', significance: 96,
        estimatedValue: 350, displayLocation: 'garage-wall', memoryLinks: ['culture-memory-1'],
        ownershipHistory: [{ ownerId: 'rider', date: '2026-07-18', reason: 'event' }],
      },
    },
  };
  const state = importCultureHistory(createHistoryState(), culture, { subjectId: 'rider', subjectName: 'Riley' });
  assert.equal(state.events.length, 1);
  assert.deepEqual(state.events[0].memoryLinks, ['culture-memory-1']);
  assert.equal(state.artifacts['asset-1'].sourceEventId, 'ne-pro-2026');
  assert.equal(state.artifacts['asset-1'].ownershipHistory[0].ownerId, 'rider');
  assert.equal(subjectHistory(state, 'rider').artifacts.length, 1);
});

test('history survives save and restore without losing record or Hall of Fame provenance', () => {
  let state = createHistoryState({ currentYear: 2040 });
  state = updateRecordBook(state, { key: 'starts', label: 'Career starts', value: 180, holderId: 'veteran', holderName: 'Veteran', date: '2040-06-01' }).state;
  const candidate = { subjectId: 'veteran', name: 'Veteran', retired: true, seasons: 15, wins: 25, championships: 2, fanImpact: 85, industryImpact: 80, communityImpact: 80 };
  state = inductHallOfFame(state, { candidate, date: '2040-12-01' }).state;
  const restored = restoreHistoryState(JSON.parse(serializeHistoryState(state)));
  assert.equal(restored.recordBook.starts.holderId, 'veteran');
  assert.equal(restored.recordHistory.length, 1);
  assert.equal(restored.hallOfFame.veteran.subjectId, 'veteran');
  assert.ok(historyTimeline(restored, { subjectId: 'veteran' }).length >= 2);
});
