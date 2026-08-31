import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';
import { ensureRelationshipLifecycle, applyRelationshipChange, changeRelationshipRole, recordSupportEvent, supportSummary } from '../src/systems/peopleRelationships2.js';
import { createCareerEconomyState, recordEconomicEntry, recordFundedExpense, economySummary, reconcileEconomy } from '../src/systems/careerEconomy2.js';
import { ensurePeopleEconomyState, payCareerExpense, receiveCareerMoney, payExpenseWithPersonSupport, reconcilePeopleEconomy } from '../src/systems/peopleEconomyIntegration.js';

test('legacy relationship records gain a 2.0 lifecycle without losing existing values',()=>{
 const legacy={id:'dad',name:'Dad',role:'Parent',values:{trust:62,pride:70,support:58},arcStage:1,sharedMemories:['m1']};const r=ensureRelationshipLifecycle(legacy);
 assert.equal(r.values.trust,62);assert.equal(r.lifecycle.version,2);assert.equal(r.lifecycle.role,'Parent');assert.ok(r.lifecycle.dimensions.trust>=50);assert.deepEqual(r.sharedMemories,['m1']);
});

test('relationship changes and role evolution preserve reason-coded history',()=>{
 let r=ensureRelationshipLifecycle({id:'dad',role:'Parent',values:{trust:60}});r=applyRelationshipChange(r,{trust:8,closeness:5,conflict:2},{seasonNumber:2,week:3,reason:'long-road-trip'});r=changeRelationshipRole(r,'Advisor',{seasonNumber:8,week:1,reason:'adult-independence'});
 assert.equal(r.lifecycle.history[0].reason,'long-road-trip');assert.equal(r.lifecycle.role,'Advisor');assert.equal(r.lifecycle.roleHistory[0].from,'Parent');
});

test('specific-person help records sacrifice once and links back to canonical relationship entity',()=>{
 const relationships={dad:{id:'dad',name:'Dad',role:'Parent',values:{trust:55,support:60},sharedMemories:[]}};let p={version:2,supportHistory:[]};let a=recordSupportEvent(p,relationships,{sourceId:'aq-trip',actorId:'dad',kind:'travel-and-wrenching',money:300,time:10,labor:6,seasonNumber:1,week:4});p=a.state;const b=recordSupportEvent(p,a.relationships,{sourceId:'aq-trip',actorId:'dad',money:300,seasonNumber:1,week:4});
 assert.equal(a.duplicate,false);assert.equal(b.duplicate,true);assert.equal(supportSummary(p).money,300);assert.equal(a.relationships.dad.lifecycle.sacrifice.labor,6);assert.equal(a.relationships.dad.lifecycle.supportIds.length,1);
});

test('career ledger distinguishes cash, designated support and non-cash value without a second wallet',()=>{
 let s=createCareerEconomyState({},1200);let r=recordEconomicEntry(s,{sourceId:'job1',kind:'work-income',category:'work',cashDelta:250,fundingSource:'rider'});s=r.state;r=recordFundedExpense(s,{sourceId:'race1',category:'race-entry',gross:300,funding:[{source:'sponsor',amount:200,type:'designated-support'},{source:'family',amount:100,type:'cash'}]});s=r.state;
 const summary=economySummary(s);assert.equal(summary.cashIn,250);assert.equal(summary.cashOut,100);assert.equal(summary.support,200);assert.equal(r.expense.outOfPocket,100);assert.equal(r.expense.gross,300);assert.equal(reconcileEconomy(s,1350).ok,true);
});

test('sponsor or team support lowers out of pocket but never becomes rider income',()=>{
 let s=createCareerEconomyState({},1000);const r=recordFundedExpense(s,{sourceId:'national-round',gross:900,category:'travel',funding:[{source:'team',amount:700,type:'team-paid'}]});s=r.state;const summary=economySummary(s);
 assert.equal(r.expense.outOfPocket,200);assert.equal(r.expense.support,700);assert.equal(summary.cashIn,0);assert.equal(summary.cashOut,200);assert.equal(summary.support,700);
});

test('game integration creates materially different family-funded and supported race costs',()=>{
 const family=new Game({riderName:'Family Kid',seed:1,birthdate:'2014-05-15'});const supported=new Game({riderName:'Supported Kid',seed:2,birthdate:'2014-05-15'});ensurePeopleEconomyState(family);ensurePeopleEconomyState(supported);
 const f=payCareerExpense(family,600,{sourceId:'round1',category:'race-weekend'});const s=payCareerExpense(supported,600,{sourceId:'round1',category:'race-weekend',funding:[{source:'team',amount:450,type:'team-paid'}]});
 assert.equal(f.expense.outOfPocket,600);assert.equal(s.expense.outOfPocket,150);assert.equal(family.family.money,600);assert.equal(supported.family.money,1050);assert.equal(economySummary(supported.state.careerEconomy).cashIn,0);
});

test('Dad can fund and wrench for a youth program with people/economy records linked by source',()=>{
 const g=new Game({riderName:'Youth',seed:3,birthdate:'2016-05-15'});ensurePeopleEconomyState(g);const r=payExpenseWithPersonSupport(g,{sourceId:'regional-weekend',actorId:'dad',gross:500,personCash:250,personTime:8,personLabor:5,category:'race-weekend',description:'Regional race weekend'});
 assert.equal(r.ok,true);assert.equal(r.expense.outOfPocket,250);assert.equal(g.family.money,950);assert.equal(g.state.people2.supportHistory.length,1);assert.equal(g.state.people2.supportHistory[0].economyEntryId,r.entry.id);assert.equal(g.state.relationships.dad.lifecycle.sacrifice.money,250);assert.equal(reconcilePeopleEconomy(g).ok,true);
});

test('income and expense source ids are idempotent and survive normal Game save/load state',()=>{
 const g=new Game({riderName:'Privateer',seed:4,birthdate:'2007-05-15'});ensurePeopleEconomyState(g);const first=receiveCareerMoney(g,400,{sourceId:'weekend-job',kind:'work-income',category:'work'});const again=receiveCareerMoney(g,400,{sourceId:'weekend-job',kind:'work-income',category:'work'});assert.equal(first.ok,true);assert.equal(again.duplicate,true);assert.equal(g.family.money,1600);
 payCareerExpense(g,350,{sourceId:'practice-trip',category:'training'});const save=g.toSave();const loaded=Game.load(structuredClone(save));ensurePeopleEconomyState(loaded);assert.equal(loaded.family.money,1250);assert.equal(loaded.state.careerEconomy.ledger.length,2);assert.equal(reconcilePeopleEconomy(loaded).ok,true);
});

test('legacy saves can initialize the ledger at current cash without migration changing balance',()=>{
 const g=new Game({riderName:'Legacy',seed:5,birthdate:'2012-05-15'});delete g.state.careerEconomy;delete g.state.people2;const before=g.family.money;ensurePeopleEconomyState(g);assert.equal(g.family.money,before);assert.equal(g.state.careerEconomy.openingBalance,before);assert.equal(g.state.careerEconomy.ledger.length,0);assert.equal(reconcilePeopleEconomy(g).ok,true);
});
