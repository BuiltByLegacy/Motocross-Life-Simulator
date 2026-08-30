import test from 'node:test';
import assert from 'node:assert/strict';
import { createRiderDevelopmentProfile, seasonalDevelopment } from '../src/systems/riderDevelopment.js';
import { developmentSnapshot, riderDevelopmentNarrative, coachingFeedback, developmentTrend, compactDevelopmentCard } from '../src/systems/riderDevelopmentPresentation.js';
import { migrateRiderDevelopmentState, attachRiderDevelopment, developmentSaveRoundTrip, validateRiderDevelopment } from '../src/systems/riderDevelopmentMigration.js';

test('development presentation turns skills into readable strengths and focus',()=>{
 const p=createRiderDevelopmentProfile({age:15,skills:{starts:82,cornering:76,jumping:70,raceIQ:65,fitness:48,consistency:62}});
 const snap=developmentSnapshot(p),text=riderDevelopmentNarrative(p),coach=coachingFeedback(p);
 assert.equal(snap.strengths[0].skill,'starts');
 assert.match(text,/strength|strongest/i);
 assert.ok(coach.primary.skill);
 assert.match(coach.summary,/Work on/i);
});

test('presentation keeps adaptation and mental execution separate from base talent',()=>{
 const p=createRiderDevelopmentProfile({skills:{starts:80,fitness:55}});
 const before=p.skills.starts;
 const card=compactDevelopmentCard(p,{adaptation:{readinessBand:'raw'},mental:{band:'slump'}});
 assert.equal(p.skills.starts,before);
 assert.match(card.headline,/adaptation/i);
 assert.match(card.headline,/base talent/i);
});

test('legacy rider migration preserves a compatibility skill view',()=>{
 const rider=attachRiderDevelopment({age:13,skills:{starts:44,cornering:50,jumping:41,whoops:39,raceIQ:46,consistency:48,fitness:52}});
 assert.equal(rider.development.version,2);
 assert.equal(rider.skills.whoops,rider.development.skills.roughTerrain);
 assert.equal(validateRiderDevelopment(rider.development).valid,true);
 assert.equal(rider.development.history.at(-1).type,'migration');
});

test('save round trip preserves canonical development profile',()=>{
 const p=createRiderDevelopmentProfile({age:17,traits:{learning:72},skills:{cornering:68},history:[{type:'development',gains:{cornering:2}}]});
 assert.deepEqual(developmentSaveRoundTrip(p),p);
});

test('multi-season development is deterministic and can show veteran regression',()=>{
 let a=createRiderDevelopmentProfile({age:35,skills:{fitness:90,consistency:90,composure:90},traits:{learning:45,ceiling:70}}),b=structuredClone(a);
 for(let season=1;season<=5;season++){
  const ra=seasonalDevelopment(a,{seed:77,season,trainingQuality:.6,injuryWeeks:3,stress:55});
  const rb=seasonalDevelopment(b,{seed:77,season,trainingQuality:.6,injuryWeeks:3,stress:55});
  a={...ra.profile,age:a.age+1}; b={...rb.profile,age:b.age+1};
 }
 assert.deepEqual(a,b);
 assert.ok(a.skills.fitness<90 || a.skills.consistency<90 || a.skills.composure<90);
 const trend=developmentTrend(a);
 assert.ok(Array.isArray(trend.regressing));
});

test('migration is idempotent for v2 profiles',()=>{
 const p=createRiderDevelopmentProfile({age:14,skills:{racecraft:61}});
 assert.deepEqual(migrateRiderDevelopmentState(p),p);
});
