import test from 'node:test';
import assert from 'node:assert/strict';
import { RIDER_SKILLS, createRiderDevelopmentProfile, migrateLegacySkills, legacySkillView, ageDevelopmentCurve, developmentGain, seasonalDevelopment } from '../src/systems/riderDevelopment.js';
import { trainingTargets, resolveTrainingDevelopment, summarizeTrainingHistory } from '../src/systems/riderTrainingDevelopment.js';

const legacy={starts:40,cornering:45,jumping:38,whoops:34,raceIQ:42,consistency:48,fitness:50};

test('canonical profile migrates legacy skills into full motocross taxonomy',()=>{
  const skills=migrateLegacySkills(legacy); assert.deepEqual(Object.keys(skills),RIDER_SKILLS); assert.equal(skills.starts,40); assert.equal(skills.roughTerrain,34); assert.ok(skills.ruts>0&&skills.braking>0&&skills.composure>0&&skills.adaptability>0);
  const profile=createRiderDevelopmentProfile({skills:legacy,age:13}); assert.equal(profile.version,2); assert.equal(profile.age,13);
  const view=legacySkillView(profile); assert.equal(view.whoops,profile.skills.roughTerrain); assert.ok(view.raceIQ>0);
});

test('age curves distinguish youth adolescence prime and later career',()=>{
  assert.equal(ageDevelopmentCurve(10).stage,'youth'); assert.equal(ageDevelopmentCurve(15).stage,'adolescence'); assert.equal(ageDevelopmentCurve(24).stage,'prime'); assert.equal(ageDevelopmentCurve(40).stage,'later-career');
  assert.ok(ageDevelopmentCurve(15).learning>ageDevelopmentCurve(40).learning);
});

test('development is deterministic and repetition/fatigue/stress reduce gains',()=>{
  const p=createRiderDevelopmentProfile({skills:legacy,age:15,traits:{learning:70}});
  const a=developmentGain(p,'starts',{base:3,seed:42,contextKey:'x'}); const b=developmentGain(p,'starts',{base:3,seed:42,contextKey:'x'}); assert.equal(a,b);
  const burdened=developmentGain(p,'starts',{base:3,seed:42,contextKey:'x',fatigue:70,stress:70,repetition:4}); assert.ok(burdened<a);
});

test('season growth supports nonlinear breakthroughs and later-career regression',()=>{
  const young=createRiderDevelopmentProfile({skills:legacy,age:15}); const old=createRiderDevelopmentProfile({skills:legacy,age:41});
  const y=seasonalDevelopment(young,{seed:5,season:2,trainingQuality:1.1}); const o=seasonalDevelopment(old,{seed:5,season:2,trainingQuality:.5,injuryWeeks:8,stress:60});
  assert.ok(Object.keys(y.gains).length===RIDER_SKILLS.length); assert.ok(y.gains.fitness>=o.gains.fitness);
  assert.doesNotThrow(()=>JSON.stringify(y.profile));
});

test('each off-week training family targets specific competencies',()=>{
  assert.deepEqual(Object.keys(trainingTargets('starts')).sort(),['composure','racecraft','starts']);
  assert.ok(trainingTargets('technique').ruts>0); assert.ok(trainingTargets('motos').fitness>0); assert.ok(trainingTargets('coaching').adaptability>0);
});

test('coaching/facility quality and repetition change training efficiency',()=>{
  let p=createRiderDevelopmentProfile({skills:legacy,age:14});
  const low=resolveTrainingDevelopment(p,'technique',{seed:9,week:2,coachingQuality:20,facilityQuality:20});
  const high=resolveTrainingDevelopment(p,'technique',{seed:9,week:2,coachingQuality:90,facilityQuality:90});
  const sum=(x)=>Object.values(x.gains).reduce((a,b)=>a+b,0); assert.ok(sum(high)>sum(low));
  p=high.profile; for(let i=0;i<4;i++)p=resolveTrainingDevelopment(p,'technique',{seed:9,week:3+i,coachingQuality:90,facilityQuality:90}).profile;
  const repeat=resolveTrainingDevelopment(p,'technique',{seed:9,week:8,coachingQuality:90,facilityQuality:90}); assert.ok(repeat.repetition>=4);
});

test('training history is queryable for development explanations',()=>{
  let p=createRiderDevelopmentProfile({skills:legacy,age:14}); p=resolveTrainingDevelopment(p,'starts',{seed:1,week:2}).profile; p=resolveTrainingDevelopment(p,'starts',{seed:1,week:3}).profile; p=resolveTrainingDevelopment(p,'motos',{seed:1,week:4}).profile;
  const summary=summarizeTrainingHistory(p); assert.equal(summary.sessions,3); assert.equal(summary.mostPracticed,'starts'); assert.ok(summary.totals.starts>0);
  assert.deepEqual(createRiderDevelopmentProfile(JSON.parse(JSON.stringify(p))),p);
});
