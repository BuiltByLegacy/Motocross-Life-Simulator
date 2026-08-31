import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';
import { createConflict, repairConflict } from '../src/systems/peopleEconomyLifePressure.js';
import { changeRelationshipRole } from '../src/systems/peopleRelationships2.js';
import { ensurePeopleEconomyState, attributePersonSupport, payCareerExpense, receiveCareerMoney, reconcilePeopleEconomy } from '../src/systems/peopleEconomyIntegration.js';
import { migratePeopleEconomyState, closeoutAudit, seasonViability, peopleArcSummary } from '../src/systems/peopleEconomyCloseout.js';

test('legacy People/Economy migration preserves balance and deduplicates history',()=>{
 const raw={relationships:{dad:{id:'dad',role:'Dad',values:{trust:70,support:65}}},people2:{supportHistory:[{id:'support:x',sourceId:'x',actorId:'dad'},{id:'support:x2',sourceId:'x',actorId:'dad'}],seenSourceIds:['x','x']},careerEconomy:null,currentBalance:4200};
 const m=migratePeopleEconomyState(raw);assert.equal(m.careerEconomy.openingBalance,4200);assert.equal(m.careerEconomy.ledger.length,0);assert.equal(m.people2.supportHistory.length,1);assert.equal(m.relationships.dad.lifecycle.version,2);
});

test('multi-season relationship arc survives conflict help repair and role evolution',()=>{
 const g=new Game({riderName:'Arc Rider',seed:77,birthdate:'2012-05-15',campaign:'parent',background:'working_class'});ensurePeopleEconomyState(g);
 g.state.relationships.dad=createConflict(g.state.relationships.dad,{source:'money',severity:3,seasonNumber:1,week:5});
 attributePersonSupport(g,{actorId:'dad',sourceId:'s1-dad-wrench',kind:'wrenching',time:6,labor:5,context:'Race weekend'});
 g.state.relationships.dad=repairConflict(g.state.relationships.dad,{action:'apology',seasonNumber:1,week:6});
 g.state.relationships.dad=repairConflict(g.state.relationships.dad,{action:'follow_through',seasonNumber:2,week:2});
 g.state.relationships.dad=changeRelationshipRole(g.state.relationships.dad,'Advisor',{seasonNumber:3,week:1,reason:'adult-independence'});
 const saved=g.toSave();const loaded=Game.load(structuredClone(saved));ensurePeopleEconomyState(loaded);
 const arc=peopleArcSummary(loaded.state.relationships).find(x=>x.id==='dad');assert.ok(arc.events>=2);assert.ok(arc.supportEvents>=1);assert.ok(arc.roleChanges>=1);assert.equal(loaded.state.people2.supportHistory.filter(x=>x.sourceId==='s1-dad-wrench').length,1);
});

test('sale proceeds work income and sponsor support reconcile once across seasons',()=>{
 const g=new Game({riderName:'Money Rider',seed:88,campaign:'parent',background:'working_class'});ensurePeopleEconomyState(g);const opening=g.family.money;
 payCareerExpense(g,1000,{sourceId:'s1-race',category:'race-weekend',funding:[{source:'sponsor',amount:600,type:'support'}]});
 receiveCareerMoney(g,850,{sourceId:'s1-bike-sale',kind:'sale-proceeds',category:'equipment-sale',fundingSource:'buyer'});
 receiveCareerMoney(g,250,{sourceId:'s1-work',kind:'work-income',category:'work',fundingSource:'employer'});
 const beforeDuplicate=g.family.money;receiveCareerMoney(g,850,{sourceId:'s1-bike-sale',kind:'sale-proceeds',category:'equipment-sale',fundingSource:'buyer'});assert.equal(g.family.money,beforeDuplicate);
 g.state.seasonNumber=2;payCareerExpense(g,700,{sourceId:'s2-race',category:'race-weekend',funding:[{source:'team',amount:500,type:'team-paid'}]});receiveCareerMoney(g,300,{sourceId:'s2-work',kind:'work-income',category:'work',fundingSource:'employer'});
 const rec=reconcilePeopleEconomy(g);assert.equal(rec.ok,true);const audit=closeoutAudit({relationships:g.state.relationships,people2:g.state.people2,careerEconomy:g.state.careerEconomy,currentBalance:g.family.money});assert.equal(audit.ok,true);assert.equal(audit.expectedBalance,g.family.money);assert.notEqual(g.family.money,opening);
});

test('economic decisions can change season viability without changing rider talent',()=>{
 const before=seasonViability({cash:900,plannedOutOfPocket:1400,reserve:300,requiredWeeks:5,availableWeeks:7});const after=seasonViability({cash:900+700+300,plannedOutOfPocket:1400-400,reserve:300,requiredWeeks:5,availableWeeks:7});assert.equal(before.viable,false);assert.equal(after.viable,true);assert.equal('speed' in after,false);
});

test('save reload preserves funding attribution and exact reconciled balance',()=>{
 const g=new Game({riderName:'Reload Rider',seed:99,campaign:'parent',background:'working_class'});ensurePeopleEconomyState(g);payCareerExpense(g,500,{sourceId:'supported-weekend',category:'race',funding:[{source:'dealer',amount:250,type:'support'}]});attributePersonSupport(g,{actorId:'dad',sourceId:'dad-logistics',kind:'travel',time:4,context:'Supported weekend'});receiveCareerMoney(g,175,{sourceId:'work-shift',kind:'work-income',category:'work',fundingSource:'employer'});reconcilePeopleEconomy(g);
 const loaded=Game.load(structuredClone(g.toSave()));ensurePeopleEconomyState(loaded);const audit=closeoutAudit({relationships:loaded.state.relationships,people2:loaded.state.people2,careerEconomy:loaded.state.careerEconomy,currentBalance:loaded.family.money});assert.equal(audit.ok,true);assert.equal(loaded.state.careerEconomy.ledger.find(x=>x.sourceId==='supported-weekend').designated.support,250);assert.equal(loaded.state.people2.supportHistory.filter(x=>x.sourceId==='dad-logistics').length,1);
});
