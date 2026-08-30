import test from 'node:test';
import assert from 'node:assert/strict';
import { createRiderDevelopmentProfile } from '../src/systems/riderDevelopment.js';
import { classSimilarity, createAdaptationState, transitionAdaptation, recordAdaptationRep, adaptationEffects } from '../src/systems/riderAdaptation.js';
import { createMentalState, applyMentalEvent, executionModifier, mentalExplanation, recoveryOptions } from '../src/systems/mentalPerformance.js';
import { createRivalDevelopment, developRivalSeason, rivalClassMove, rivalPracticeRep, simulateRivalCareer, serializeRivalDevelopment, restoreRivalDevelopment } from '../src/systems/rivalDevelopment.js';

test('similar classes transfer more adaptation than abrupt jumps',()=>{
  assert.ok(classSimilarity('85cc','Supermini')>classSimilarity('65cc','450F'));
  const base=createAdaptationState({byClass:{'85cc':{adaptation:90,reps:12}}});
  const near=transitionAdaptation(base,{fromClass:'85cc',toClass:'Supermini',confidence:60});
  const far=transitionAdaptation(base,{fromClass:'85cc',toClass:'450F',confidence:60});
  assert.ok(near.carried>far.carried);
  assert.ok(far.confidencePenalty<near.confidencePenalty);
  assert.equal(far.warning,'major-transition');
});

test('reps steadily reduce adaptation penalty',()=>{
  let s=transitionAdaptation(createAdaptationState({byClass:{'85cc':{adaptation:75,reps:8}}}),{fromClass:'85cc',toClass:'Supermini',bikeId:'bike-a'}).state;
  const before=adaptationEffects(s,{klass:'Supermini',bikeId:'bike-a'});
  for(let i=0;i<5;i+=1)s=recordAdaptationRep(s,{klass:'Supermini',bikeId:'bike-a',quality:1});
  const after=adaptationEffects(s,{klass:'Supermini',bikeId:'bike-a'});
  assert.ok(after.score>before.score);
  assert.ok(after.penalty<before.penalty);
});

test('adaptation affects execution-relevant competencies not underlying profile',()=>{
  const profile=createRiderDevelopmentProfile({skills:{starts:70,cornering:70,jumping:70,raceIQ:70,fitness:70,consistency:70}});
  const s=transitionAdaptation(createAdaptationState({}),{fromClass:'65cc',toClass:'250F'}).state;
  const effects=adaptationEffects(s,{klass:'250F',profile});
  assert.ok(effects.competencies.starts<0);
  assert.equal(profile.skills.starts,70);
});

test('confidence momentum pressure and composure remain distinct',()=>{
  let s=createMentalState({confidence:50,momentum:0,pressure:35,composure:65});
  s=applyMentalEvent(s,'major_event').state;
  assert.equal(s.confidence,50);
  assert.ok(s.pressure>35);
  s=applyMentalEvent(s,'win').state;
  assert.ok(s.confidence>50);
  assert.ok(s.momentum>0);
});

test('slumps hurt execution more than base talent and have readable recovery paths',()=>{
  let s=createMentalState({confidence:50,momentum:0,pressure:40,composure:55});
  for(let i=0;i<3;i+=1)s=applyMentalEvent(s,'poor').state;
  const exec=executionModifier(s);
  assert.equal(exec.baseTalentModifier,0);
  assert.equal(exec.band,'slump');
  assert.match(mentalExplanation(s),/underlying ability/i);
  assert.ok(recoveryOptions(s).some(x=>x.recommended));
});

test('preparation coaching and smaller wins can recover a slump predictably',()=>{
  let s=createMentalState({confidence:30,momentum:-45,pressure:70,composure:52,streak:-3});
  const before=executionModifier(s).execution;
  s=applyMentalEvent(s,'prepared').state;
  s=applyMentalEvent(s,'coaching').state;
  s=applyMentalEvent(s,'smaller_win').state;
  assert.ok(executionModifier(s).execution>before);
});

test('AI rivals use deterministic development without player rubber-banding',()=>{
  const raw={id:'r1',name:'Rival One',age:13,klass:'85cc',skills:{starts:48,cornering:55,jumping:52,whoops:49,raceIQ:54,fitness:51,consistency:50}};
  const a=simulateRivalCareer(raw,{seed:42,seasons:4});
  const b=simulateRivalCareer(raw,{seed:42,seasons:4});
  assert.deepEqual(a,b);
  assert.equal(a.id,'r1');
  assert.equal(a.history.filter(x=>x.type==='season-development').length,4);
});

test('rivals can specialize plateau move classes and keep identity',()=>{
  let r=createRivalDevelopment({id:'r2',name:'Rival Two',age:15,klass:'125',skills:{starts:75,cornering:55,jumping:60,raceIQ:58,fitness:50,consistency:52}});
  r=developRivalSeason(r,{seed:7,season:1,trainingQuality:.9,resultEvent:'solid'});
  assert.equal(r.specialties.length,2);
  const id=r.id;
  r=rivalClassMove(r,'250F',{seed:7,bikeId:'new-bike'});
  assert.equal(r.id,id);
  assert.equal(r.klass,'250F');
  const before=r.adaptation.byClass['250F'].adaptation;
  r=rivalPracticeRep(r,{quality:1,bikeId:'new-bike'});
  assert.ok(r.adaptation.byClass['250F'].adaptation>before);
});

test('rival development survives save load',()=>{
  const r=simulateRivalCareer({id:'save-rival',name:'Save Rival',age:14,klass:'85cc'},{seed:99,seasons:3});
  const saved=serializeRivalDevelopment(r);
  const loaded=restoreRivalDevelopment(saved);
  assert.deepEqual(serializeRivalDevelopment(loaded),saved);
});
