import test from 'node:test';
import assert from 'node:assert/strict';
import { createConflict, repairConflict, driftRelationship, evolveGuardianship, approvalAuthority, classifyEconomicArchetype, seasonAffordability, quoteWork, applyWork } from '../src/systems/peopleEconomyLifePressure.js';
import { ensureRelationshipLifecycle } from '../src/systems/peopleRelationships2.js';
import { expectedBalance } from '../src/systems/careerEconomy2.js';

test('conflict has source/severity and repair takes repeated actions',()=>{
  let dad=ensureRelationshipLifecycle({id:'dad',role:'Parent',values:{trust:70,support:70}});
  dad=createConflict(dad,{source:'missed-race',severity:3,seasonNumber:2,week:8});
  assert.equal(dad.lifecycle.activeConflict.status,'active');
  const trustAfterConflict=dad.lifecycle.dimensions.trust;
  dad=repairConflict(dad,{action:'apology',seasonNumber:2,week:9});
  assert.equal(dad.lifecycle.activeConflict.status,'active');
  assert.ok(dad.lifecycle.dimensions.trust>trustAfterConflict);
  dad=repairConflict(dad,{action:'follow_through',seasonNumber:2,week:10});
  dad=repairConflict(dad,{action:'follow_through',seasonNumber:2,week:11});
  assert.equal(dad.lifecycle.activeConflict.status,'repaired');
});

test('relationships can drift without a dramatic conflict',()=>{
  const friend=ensureRelationshipLifecycle({id:'friend',role:'Friend',values:{friendship:80,loyalty:75}});
  const drifted=driftRelationship(friend,{weeks:12,seasonNumber:3,week:20});
  assert.ok(drifted.lifecycle.dimensions.closeness<friend.lifecycle.dimensions.closeness);
  assert.match(drifted.lifecycle.history.at(-1).reason,/drift/);
});

test('guardian authority evolves with age and responsibility while history survives',()=>{
  let dad=ensureRelationshipLifecycle({id:'dad',role:'Parent',values:{trust:75}});
  assert.equal(approvalAuthority(dad,{riderAge:14,responsibility:80}),'guardian-required');
  dad=evolveGuardianship(dad,{age:16,responsibility:72,seasonNumber:5,week:1});
  assert.equal(dad.lifecycle.role,'Parent Advisor');
  assert.equal(approvalAuthority(dad,{riderAge:16,responsibility:72}),'shared');
  dad=evolveGuardianship(dad,{age:18,responsibility:80,seasonNumber:7,week:1});
  assert.equal(dad.lifecycle.role,'Advisor');
  assert.equal(dad.lifecycle.roleHistory.length,2);
});

test('economic archetypes produce materially different out-of-pocket pressure',()=>{
  const youth=classifyEconomicArchetype({age:13,supportLevel:0});
  const privateer=classifyEconomicArchetype({age:21,scope:'national'});
  const factory=classifyEconomicArchetype({age:24,factory:true});
  const a=seasonAffordability(null,{cash:2500,plannedCost:8000,archetype:youth.id});
  const b=seasonAffordability(null,{cash:2500,plannedCost:8000,archetype:privateer.id});
  const c=seasonAffordability(null,{cash:2500,plannedCost:8000,archetype:factory.id});
  assert.ok(a.outOfPocket<b.outOfPocket);
  assert.ok(c.outOfPocket<a.outOfPocket);
  assert.ok(b.pressureScore>a.pressureScore);
});

test('work quote exposes age, race-week, time and practice tradeoffs',()=>{
  assert.equal(quoteWork('part_time',{age:14,availableSlots:4}).reason,'age-restriction');
  assert.equal(quoteWork('part_time',{age:17,availableSlots:4,isRaceWeek:true}).reason,'race-week-conflict');
  assert.equal(quoteWork('full_shift',{age:20,availableSlots:2}).reason,'not-enough-time');
  const q=quoteWork('shop_shift',{age:18,availableSlots:4});
  assert.equal(q.allowed,true);assert.equal(q.remainingSlots,2);assert.equal(q.practiceCost,1);
});

test('work income is ledgered once and does not create a parallel wallet',()=>{
  const first=applyWork(null,'shop_shift',{age:18,availableSlots:4,seasonNumber:2,week:4,openingBalance:500});
  assert.equal(first.income,150);assert.equal(first.timeUsed,2);assert.equal(first.fatigueDelta,5);assert.equal(expectedBalance(first.economy),650);
  const second=applyWork(first.economy,'shop_shift',{age:18,availableSlots:4,seasonNumber:2,week:4,openingBalance:500});
  assert.equal(second.duplicate,true);assert.equal(expectedBalance(second.economy),650);
});
