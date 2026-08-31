import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';
import { gameWorkQuote, takeWorkShift, startRelationshipConflict, repairRelationshipConflict, refreshGuardianRoles, gameSeasonAffordability } from '../src/systems/peopleEconomyLifePressureGame.js';

test('live game work decision trades time/fatigue for canonical cash and ledger history',()=>{
  const g=new Game({riderName:'Privateer',birthdate:'2007-05-15',seed:7});g.state.week=2;g.family.money=500;
  const q=gameWorkQuote(g,'shop_shift');assert.equal(q.allowed,true);
  const before=g.family.money;const r=takeWorkShift(g,'shop_shift');assert.equal(r.error,undefined);assert.equal(g.family.money,before+150);assert.equal(g.state.workHistory.length,1);assert.equal(g.state.careerEconomy.ledger.at(-1).kind,'work-income');
});

test('live relationship conflict and repair preserve person identity',()=>{
  const g=new Game({riderName:'Kid',birthdate:'2012-05-15',seed:8});
  const before=g.state.relationships.dad.id;startRelationshipConflict(g,'dad',{source:'money',severity:2});assert.equal(g.state.relationships.dad.id,before);assert.equal(g.state.relationships.dad.lifecycle.activeConflict.status,'active');
  repairRelationshipConflict(g,'dad',{action:'apology'});assert.equal(g.state.relationships.dad.id,before);
});

test('guardian roles can evolve without replacing the relationship record',()=>{
  const g=new Game({riderName:'Older',birthdate:'2010-05-15',seed:9});g.state.rider.age=16;refreshGuardianRoles(g,80);assert.equal(g.state.relationships.dad.lifecycle.role,'Parent Advisor');
  g.state.rider.age=18;refreshGuardianRoles(g,85);assert.equal(g.state.relationships.dad.lifecycle.role,'Advisor');assert.equal(g.state.relationships.dad.lifecycle.roleHistory.length,2);
});

test('live affordability reflects career support archetype',()=>{
 const g=new Game({riderName:'Budget',birthdate:'2006-05-15',seed:10});g.family.money=1200;const privateer=gameSeasonAffordability(g,7000);g.family.support_level=3;const supported=gameSeasonAffordability(g,7000);assert.ok(supported.outOfPocket<privateer.outOfPocket);assert.ok(supported.pressureScore<privateer.pressureScore);
});
