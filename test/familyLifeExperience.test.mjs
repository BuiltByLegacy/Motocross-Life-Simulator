import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFamilyStory, initializeFamilyLife, migrateFamilyLifeSave, migrateLegacyFamilySelection } from '../src/systems/familyLifeExperience.js';

test('Your Story reflects independent family choices without performance buffs',()=>{
  const story=buildFamilyStory({financial:'tight',motocrossKnowledge:'industry',household:'single_parent',school:'public'},{supportModel:'guardian_mechanic',home:'basic'});
  assert.match(story.title,/Tight/);assert.ok(story.details.includes('Public school'));assert.match(story.narrative,/sport|motocross|family/i);assert.ok(story.strengths.includes('mechanical knowledge'));assert.ok(story.pressures.includes('money'));assert.deepEqual(story.riderPerformanceModifiers,{});
});

test('contrasting families produce different coherent stories',()=>{
  const a=buildFamilyStory({financial:'wealthy',motocrossKnowledge:'new',household:'two_parent',school:'private'},{supportModel:'professional',home:'workshop'});
  const b=buildFamilyStory({financial:'tight',motocrossKnowledge:'motocross_family',household:'single_parent',school:'homeschool'},{supportModel:'family_diy',home:'minimal'});
  assert.notEqual(a.title,b.title);assert.notEqual(a.home,b.home);assert.notEqual(a.support,b.support);assert.ok(a.economy.startingCash>b.economy.startingCash);assert.notDeepEqual(a.pressures,b.pressures);
});

test('initialization is idempotent and authoritative across family systems',()=>{
  const game={state:{seasonNumber:1,week:1,relationships:{}},family:{money:999,stress:0},relationships:{_cache:new Map()}};
  const first=initializeFamilyLife(game,{financial:'tight',motocrossKnowledge:'industry',household:'single_parent',school:'homeschool'},{supportModel:'guardian_mechanic',home:'rural'});
  assert.equal(first.ok,true);const cash=game.family.money;const peopleCount=Object.keys(game.state.relationships).length;
  assert.equal(game.state.schoolMode,'homeschool');assert.equal(game.state.familyLife.compoundSeed.ridingSpaceEligibility,true);assert.deepEqual(game.state.familyLife.riderPerformanceModifiers,{});assert.equal(game.state.careerEconomy.openingBalance,cash);
  const second=initializeFamilyLife(game,{financial:'wealthy'},{supportModel:'professional',home:'workshop'});
  assert.equal(second.duplicate,true);assert.equal(game.family.money,cash);assert.equal(Object.keys(game.state.relationships).length,peopleCount);
});

test('legacy archetypes migrate to composable dimensions',()=>{
  const rich=migrateLegacyFamilySelection('rich');const blue=migrateLegacyFamilySelection('blue_collar');const clueless=migrateLegacyFamilySelection('clueless');
  assert.equal(rich.builder.financial,'wealthy');assert.equal(blue.builder.motocrossKnowledge,'motocross_family');assert.equal(blue.supportHome.supportModel,'guardian_mechanic');assert.equal(clueless.builder.motocrossKnowledge,'new');
});

test('existing save migration preserves live career cash and state',()=>{
  const save={v:3,seed:1,state:{background:'homeschool',schoolMode:'homeschool',family:{money:777},rider:{name:'Riley',skills:{starts:42}},week:8}};
  const migrated=migrateFamilyLifeSave(save);
  assert.equal(migrated.state.family.money,777);assert.equal(migrated.state.rider.skills.starts,42);assert.equal(migrated.state.week,8);assert.equal(migrated.state.familyLife.builder.school,'homeschool');assert.equal(migrated.state.familyLife.migratedFromLegacy,true);
  assert.equal(save.state.familyLife,undefined);
});
