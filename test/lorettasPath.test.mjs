import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LorettasPath, classifyEvent, STAGE_INFO, LORETTA_CLASSES, LORETTA_REGIONS,
} from '../src/systems/lorettasPath.js';
import {
  REGION_ADVANCEMENT_2026, NATIONAL_2026, areaAdvanceSlots, regionalAdvanceSlots,
  regionalMotoCount, selectNationalSourceRegion,
} from '../src/systems/lorettasRules2026.js';

const area = { id: 'aq-ne', name: 'Northeast Area Qualifier', lorettaStage: 'area', region: 'Northeast', day: 20 };
const seArea = { id: 'aq-se', name: 'Southeast Area Qualifier', lorettaStage: 'area', region: 'Southeast', day: 24 };
const nwArea = { id: 'aq-nw', name: 'Northwest Area Qualifier', lorettaStage: 'area', region: 'Northwest', day: 25 };
const mwArea = { id: 'aq-mw', name: 'Mid-West Area Qualifier', lorettaStage: 'area', region: 'Mid-West', day: 26 };
const regional = { id: 'rc-ne', name: 'Northeast Regional', lorettaStage: 'regional', region: 'Northeast', day: 60 };
const seRegional = { id: 'rc-se', name: 'Southeast Regional', lorettaStage: 'regional', region: 'Southeast', day: 62 };
const nwRegional = { id: 'rc-nw', name: 'Northwest Regional', lorettaStage: 'regional', region: 'Northwest', day: 63 };
const national = { id: 'nat', name: "Loretta Lynn's", lorettaStage: 'national', date: '2026-08-03' };
const local = { id: 'local', name: 'County Line', category: 'race', day: 15 };

test('#223 2026 rules use the official eight-region advancement chart', () => {
  assert.equal(LORETTA_REGIONS.length, 8);
  assert.deepEqual(REGION_ADVANCEMENT_2026.Northeast, { areaToRegional: 9, regionalToNational: 6, combinedRegional: false });
  assert.equal(areaAdvanceSlots('Northwest'), 10);
  assert.equal(areaAdvanceSlots('Mid-West'), 12);
  assert.equal(regionalAdvanceSlots('Northeast'), 6);
  assert.equal(regionalAdvanceSlots('Northwest'), 4);
  assert.equal(regionalMotoCount('Northeast'), 3);
  assert.equal(regionalMotoCount('Northwest'), 2);
  assert.equal(NATIONAL_2026.rosterSizePerClass, 42);
  assert.equal(NATIONAL_2026.startDate, '2026-08-03');
  assert.equal(NATIONAL_2026.endDate, '2026-08-08');
  // Compatibility defaults remain available, but the path uses region rules.
  assert.equal(STAGE_INFO.area.advanceSlots, 9);
  assert.equal(STAGE_INFO.regional.advanceSlots, 6);
});

test('classifyEvent maps qualifying stages and ignores ordinary races', () => {
  assert.equal(classifyEvent(area), 'area');
  assert.equal(classifyEvent(regional), 'regional');
  assert.equal(classifyEvent(national), 'national');
  assert.equal(classifyEvent({ category: 'qualifier' }), 'area');
  assert.equal(classifyEvent(local), null);
});

test('#223 riders may attempt Area Qualifiers in multiple regions', () => {
  const p = new LorettasPath({ homeRegion: 'Northeast' });
  assert.equal(p.eligibleToEnter(area, { klass: '85cc' }).ok, true);
  p.recordAttempt(area, { klass: '85cc', finish: 20 }); // failed Area does not lock region
  assert.equal(p.eligibleToEnter(seArea, { klass: '85cc' }).ok, true);
  p.recordAttempt(seArea, { klass: '85cc', finish: 4 });
  assert.equal(p.eligibleToEnter(nwArea, { klass: '85cc' }).ok, true);
});

test('#223 regional eligibility requires Area advancement in that same region', () => {
  const p = new LorettasPath();
  p.recordAttempt(area, { klass: '85cc', finish: 2 });
  assert.equal(p.eligibleToEnter(regional, { klass: '85cc' }).ok, true);
  const wrongRegion = p.eligibleToEnter(seRegional, { klass: '85cc' });
  assert.equal(wrongRegion.ok, false);
  assert.match(wrongRegion.reasons.join(' '), /Southeast/);
  p.recordAttempt(seArea, { klass: '85cc', finish: 2 });
  assert.equal(p.eligibleToEnter(seRegional, { klass: '85cc' }).ok, true);
});

test('#223 Area transfer positions vary by region', () => {
  const northeast = new LorettasPath();
  const ne10 = northeast.recordAttempt(area, { klass: '85cc', finish: 10 });
  assert.equal(ne10.transferSpots, 9);
  assert.equal(ne10.advanced, false);

  const northwest = new LorettasPath();
  const nw10 = northwest.recordAttempt(nwArea, { klass: '85cc', finish: 10 });
  assert.equal(nw10.transferSpots, 10);
  assert.equal(nw10.advanced, true);

  const midwest = new LorettasPath();
  assert.equal(midwest.recordAttempt(mwArea, { klass: '85cc', finish: 12 }).advanced, true);
});

test('#223 Regional transfer positions vary by region', () => {
  const northeast = new LorettasPath();
  northeast.recordAttempt(area, { klass: '85cc', finish: 1 });
  const ne5 = northeast.recordAttempt(regional, { klass: '85cc', finish: 5 });
  assert.equal(ne5.transferSpots, 6);
  assert.equal(ne5.advanced, true);

  const northwest = new LorettasPath();
  northwest.recordAttempt(nwArea, { klass: '85cc', finish: 1 });
  const nw5 = northwest.recordAttempt(nwRegional, { klass: '85cc', finish: 5 });
  assert.equal(nw5.transferSpots, 4);
  assert.equal(nw5.advanced, false);
});

test('#223 a rider must record a numeric finish in at least one qualifier moto to advance', () => {
  const p = new LorettasPath();
  const result = p.recordAttempt(area, { klass: '85cc', finish: 1, numericFinish: false });
  assert.equal(result.advanced, false);
  assert.equal(p.advancementStatus('85cc').areaCleared, false);
});

test('#223 national remains locked until a Regional is cleared', () => {
  const p = new LorettasPath();
  assert.equal(p.eligibleToEnter(national, { klass: '85cc' }).ok, false);
  p.recordAttempt(area, { klass: '85cc', finish: 1 });
  assert.equal(p.eligibleToEnter(national, { klass: '85cc' }).ok, false);
  p.recordAttempt(regional, { klass: '85cc', finish: 1 });
  assert.equal(p.eligibleToEnter(national, { klass: '85cc' }).ok, true);
});

test('#223 multiple Regional qualifications select home region first', () => {
  const p = new LorettasPath({ homeRegion: 'Northeast' });
  p.recordAttempt(area, { klass: '85cc', finish: 1 });
  p.recordAttempt(seArea, { klass: '85cc', finish: 1 });
  p.recordAttempt(seRegional, { klass: '85cc', finish: 1 });
  p.recordAttempt(regional, { klass: '85cc', finish: 6 });
  const status = p.advancementStatus('85cc');
  assert.deepEqual(new Set(status.regionalQualifiedRegions), new Set(['Southeast', 'Northeast']));
  assert.equal(status.selectedNationalRegion, 'Northeast');
});

test('#223 without a home-region qualification, best Regional finish wins; ties use first qualified', () => {
  assert.equal(selectNationalSourceRegion([
    { region: 'Southeast', finish: 4, qualified: true },
    { region: 'Northwest', finish: 2, qualified: true },
  ], 'Northeast'), 'Northwest');
  assert.equal(selectNationalSourceRegion([
    { region: 'Southeast', finish: 2, qualified: true },
    { region: 'Northwest', finish: 2, qualified: true },
  ], 'Northeast'), 'Southeast');
});

test('#223 age gates cover current-game 250 and Supermini constraints', () => {
  const p = new LorettasPath();
  assert.equal(p.eligibleToEnter(area, { klass: '250B', age: 13 }).ok, false);
  assert.equal(p.eligibleToEnter(area, { klass: '250B', age: 14 }).ok, true);
  assert.equal(p.eligibleToEnter(area, { klass: 'Supermini', age: 11 }).ok, false);
  assert.equal(p.eligibleToEnter(area, { klass: 'Supermini', age: 12 }).ok, true);
});

test('milestones preserve the emotional Area -> Regional -> National journey', () => {
  const p = new LorettasPath();
  const r1 = p.recordAttempt(area, { klass: '85cc', finish: 1 });
  assert.ok(r1.milestones.some((m) => m.key === 'first_area_attempt'));
  assert.ok(r1.milestones.some((m) => m.key === 'first_regional_qual'));
  const r2 = p.recordAttempt(regional, { klass: '85cc', finish: 2 });
  assert.ok(r2.milestones.some((m) => m.key === 'first_national_qual' && m.importance >= 90));
  const rn = p.recordAttempt(national, { klass: '85cc', finish: 1 });
  assert.ok(rn.milestones.some((m) => m.key === 'first_national_moto'));
  assert.ok(rn.milestones.some((m) => m.key === 'national_championship'));
});

test('miss-by-one memory uses the region-specific transfer line', () => {
  const p = new LorettasPath();
  const r = p.recordAttempt(nwArea, { klass: '85cc', finish: 11 });
  assert.ok(r.milestones.some((m) => m.key === 'missed_by_one_area'));
  assert.match(r.milestones.find((m) => m.key === 'missed_by_one_area').summary, /10th/);
});

test('#223 planner allows multi-region Area chasing but validates same-region Regional paths', () => {
  const p = new LorettasPath();
  let warnings = p.pathWarnings([area, seArea], { klass: '85cc', hasLorettaGoal: true });
  assert.equal(warnings.some((w) => w.code === 'region_split'), false);
  assert.equal(warnings.some((w) => w.code === 'no_area_qualifier'), false);

  warnings = p.pathWarnings([area, seRegional], { klass: '85cc', hasLorettaGoal: true });
  assert.ok(warnings.some((w) => w.code === 'regional_unqualified' && w.region === 'Southeast'));

  warnings = p.pathWarnings([seArea, seRegional], { klass: '85cc', hasLorettaGoal: true });
  assert.equal(warnings.some((w) => w.code === 'regional_unqualified'), false);
});

test('failed Area attempt offers another Area — including another region', () => {
  const p = new LorettasPath();
  p.recordAttempt(area, { klass: '85cc', finish: 20 });
  const choices = p.followUpChoices('85cc');
  const retry = choices.find((c) => c.id === 'retry_area');
  assert.ok(retry);
  assert.match(retry.blurb, /another region/i);
});

test('serialization round-trips multi-region qualifications and migrates safely', () => {
  const p = new LorettasPath({ homeRegion: 'Northeast' });
  p.recordAttempt(area, { klass: '85cc', finish: 1 });
  p.recordAttempt(seArea, { klass: '85cc', finish: 1 });
  p.recordAttempt(seRegional, { klass: '85cc', finish: 2 });
  const restored = LorettasPath.fromJSON(JSON.parse(JSON.stringify(p.toJSON())));
  assert.deepEqual(restored.advancementStatus('85cc'), p.advancementStatus('85cc'));
  const again = restored.recordAttempt(area, { klass: '85cc', finish: 1 });
  assert.ok(!again.milestones.some((m) => m.key === 'first_area_attempt'));
});

test('current simplified game classes remain documented', () => {
  assert.deepEqual(LORETTA_CLASSES, ['50cc', '65cc', '85cc', 'Supermini', '250B']);
});
