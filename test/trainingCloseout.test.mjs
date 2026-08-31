import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';
import { trainingHistorySummary, coachingNarrative } from '../src/systems/trainingHistory.js';
import { trainingSessionQuote, takeLifeBetweenRacesDecision } from '../src/systems/lifeBetweenRacesGame.js';

test('training history reconciles spend, support and session counts',()=>{
 const state={trainingHistory:[{trainingId:'starts',seasonNumber:1,week:2,cost:15,retailCost:15,support:0},{trainingId:'coaching',seasonNumber:1,week:3,cost:45,retailCost:90,support:45},{trainingId:'starts',seasonNumber:2,week:2,cost:15,retailCost:15,support:0}]};
 const s=trainingHistorySummary(state,{seasonNumber:1});assert.equal(s.seasonCount,2);assert.equal(s.careerCount,3);assert.equal(s.spend.outOfPocket,60);assert.equal(s.spend.retail,105);assert.equal(s.spend.support,45);assert.equal(s.bySession.starts,1);
});

test('coaching narrative calls out over-repeated work',()=>{
 const state={trainingHistory:Array.from({length:4},(_,i)=>({trainingId:'starts',seasonNumber:1,week:i+1,cost:15}))};
 const n=coachingNarrative(state,{seasonNumber:1});assert.match(n.headline,/starts/i);assert.match(n.body,/repetition|different stimulus/i);
});

test('weather and facility context block riding but conditioning remains available',()=>{
 const g=new Game({riderName:'Context Rider',seed:31,birthdate:'2014-05-15'});g.state.week=2;g.family.money=500;g.state.trainingContext={weatherBlocked:true};
 assert.equal(trainingSessionQuote(g,'technique').reason,'weather-or-track-unavailable');assert.equal(trainingSessionQuote(g,'conditioning').allowed,true);
 g.state.trainingContext={facilityAvailable:false};assert.equal(trainingSessionQuote(g,'coaching').reason,'facility-unavailable');
});

test('starts now produces visible bike wear and equipment gear use when canonical gear exists',()=>{
 const g=new Game({riderName:'Wear Rider',seed:32,birthdate:'2014-05-15'});g.state.week=2;g.family.money=500;g.state.equipmentCareer={gear:[{id:'helmet-1',category:'helmet',condition:100,uses:0,quantity:1}]};const before=g.trainBike().condition;
 const r=takeLifeBetweenRacesDecision(g,'training','starts');assert.equal(r.error,null);assert.ok(g.trainBike().condition<before);assert.equal(r.receipt.actual.gearUse[0].itemId,'helmet-1');assert.ok(r.receipt.actual.gearUse[0].condition<100);
});

test('latest receipt, history, money and gear consequences survive save/reload',()=>{
 const g=new Game({riderName:'Persist Rider',seed:33,birthdate:'2014-05-15'});g.state.week=2;g.family.money=500;g.state.equipmentCareer={gear:[{id:'goggles-1',category:'goggles',condition:100,uses:0,quantity:1}]};const r=takeLifeBetweenRacesDecision(g,'training','technique');const money=g.family.money;const loaded=Game.load(structuredClone(g.toSave()));
 assert.equal(loaded.family.money,money);assert.equal(loaded.state.lifeBetweenRaces.latestTrainingReceipt.id,r.receipt.id);assert.equal(loaded.state.lifeBetweenRaces.trainingHistory.at(-1).receiptId,r.receipt.id);assert.equal(loaded.state.equipmentCareer.gear[0].uses,1);
});
