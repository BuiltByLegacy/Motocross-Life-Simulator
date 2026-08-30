import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';
import { createLifeBetweenRacesState, openBetweenRacesPeriod, resolveTrainingDecision } from '../src/systems/lifeBetweenRaces.js';
import { buildTrainingCatalog, quoteTrainingSession, trainingUsage, createTrainingReceipt } from '../src/systems/trainingPractice.js';
import { availableTrainingSessions, trainingSessionQuote, takeLifeBetweenRacesDecision } from '../src/systems/lifeBetweenRacesGame.js';

const ctx=(patch={})=>({week:2,seasonNumber:1,isRaceWeek:false,nextRaceWeek:3,availableSlots:8,rider:{age:12,fatigue:20,injury:null},family:{money:500,stress:20},bike:{id:'bike-1',name:'Race Bike',condition:80},...patch});

test('catalog exposes every training family with cost time targets and usage before mutation',()=>{
 const opened=openBetweenRacesPeriod(createLifeBetweenRacesState(),ctx());const catalog=buildTrainingCatalog(opened.state,ctx());
 assert.deepEqual(catalog.map(x=>x.trainingId),['starts','technique','motos','conditioning','coaching','light_ride']);
 const coaching=catalog.find(x=>x.trainingId==='coaching');assert.equal(coaching.cost.outOfPocket,90);assert.equal(coaching.time.slots,2);assert.ok(coaching.targets.includes('racecraft'));assert.equal(opened.state.trainingHistory.length,0);
});

test('quotes explain money injury weather and facility restrictions',()=>{
 let opened=openBetweenRacesPeriod(createLifeBetweenRacesState(),ctx({family:{money:10,stress:20}}));assert.equal(quoteTrainingSession(opened.state,'motos',ctx({family:{money:10,stress:20}})).reason,'not-enough-money');
 const injured=ctx({rider:{age:12,fatigue:20,injury:{weeksOut:2,severity:2}}});opened=openBetweenRacesPeriod(createLifeBetweenRacesState(),injured);assert.equal(quoteTrainingSession(opened.state,'motos',injured).reason,'injury-restriction');
 const weather=ctx({weatherBlocked:true});opened=openBetweenRacesPeriod(createLifeBetweenRacesState(),weather);assert.equal(quoteTrainingSession(opened.state,'technique',weather).reason,'weather-or-track-unavailable');
 const facility=ctx({facilityAvailable:false});opened=openBetweenRacesPeriod(createLifeBetweenRacesState(),facility);assert.equal(quoteTrainingSession(opened.state,'coaching',facility).reason,'facility-unavailable');
});

test('usage reports recent season career counts and readable diminishing bands',()=>{
 let opened=openBetweenRacesPeriod(createLifeBetweenRacesState(),ctx()),state=opened.state;
 for(let i=0;i<3;i++){const r=resolveTrainingDecision(state,'starts',ctx(),{seed:9});state=r.state;}
 const u=trainingUsage(state,'starts',{seasonNumber:1});assert.equal(u.recent,3);assert.equal(u.season,3);assert.equal(u.career,3);assert.equal(u.band,'saturated');
});

test('game quote does not spend and completed training returns persistent receipt',()=>{
 const g=new Game({riderName:'Quote Rider',seed:18,birthdate:'2014-05-15'});g.state.week=2;g.family.money=500;
 const money=g.family.money,history=g.state.lifeBetweenRaces?.trainingHistory?.length??0,sessions=availableTrainingSessions(g);assert.equal(sessions.length,6);const quote=trainingSessionQuote(g,'starts');assert.equal(quote.cost.outOfPocket,15);assert.equal(g.family.money,money);assert.equal(g.state.lifeBetweenRaces.trainingHistory.length,history);
 const result=takeLifeBetweenRacesDecision(g,'training','starts');assert.equal(result.error,null);assert.equal(result.receipt.actual.cost,15);assert.equal(result.receipt.trainingId,'starts');assert.equal(result.receipt.usageAfter.career,1);assert.equal(g.state.lifeBetweenRaces.latestTrainingReceipt.id,result.receipt.id);assert.equal(g.state.lifeBetweenRaces.trainingHistory[0].cost,15);
});

test('receipt preserves quote versus actual and survives normal save/load',()=>{
 const g=new Game({riderName:'Saved Training Rider',seed:21,birthdate:'2014-05-15'});g.state.week=2;g.family.money=500;const result=takeLifeBetweenRacesDecision(g,'training','technique');const saved=g.toSave();const loaded=Game.load(structuredClone(saved));
 assert.equal(result.receipt.quoted.cost.outOfPocket,20);assert.equal(loaded.state.lifeBetweenRaces.latestTrainingReceipt.trainingId,'technique');assert.equal(loaded.state.lifeBetweenRaces.trainingHistory[0].receiptId,result.receipt.id);
});

test('receipt helper captures a deterministic completed-session contract',()=>{
 const quote={label:'Gate & Starts',usage:{band:'fresh'},cost:{outOfPocket:15},time:{slots:1},load:8,fatigue:6,diminishingFactor:1};const decision={id:'s1:w2:d1',trainingId:'starts',time:1,load:8,fatigueDelta:6,confidenceDelta:1,gains:{starts:2},risk:{band:'low'}};
 const receipt=createTrainingReceipt({quote,decision,before:{money:100,week:2,seasonNumber:1},after:{money:85,usage:{career:1}}});assert.equal(receipt.actual.cost,15);assert.equal(receipt.actual.gains.starts,2);assert.equal(receipt.dismissed,false);
});
