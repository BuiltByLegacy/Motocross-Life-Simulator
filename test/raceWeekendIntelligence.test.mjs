import test from 'node:test';
import assert from 'node:assert/strict';
import { restoreVenueKnowledge, venueKnowledge, learnVenue, effectiveFamiliarity, buildSessionDebrief, applyDebriefChoice, weekendIntelligenceRecord } from '../src/systems/raceWeekendIntelligence.js';

const race={name:'Sandy Creek — Round 3'};
const rider={skills:{starts:60,cornering:68,ruts:58,braking:64,jumping:62,roughTerrain:72,lineChoice:66,racecraft:64,consistency:70,fitness:80,composure:68,adaptability:72},confidence:65};
const bike={condition:72,reliability:68,parts:{tires:42,brakes:75,chain:70,topEnd:70}};

test('practice and repeat visits build persistent familiarity with tapering gains',()=>{
 let state=restoreVenueKnowledge();const gains=[];
 for(let i=0;i<5;i++){const r=learnVenue(state,'sandy_creek',{source:'practice',weather:'clear'});state=r.state;gains.push(r.gain);}
 const k=venueKnowledge(state,'sandy_creek');assert.equal(k.practiceSessions,5);assert.ok(k.familiarity>0);assert.ok(gains[4]<gains[0]);assert.equal(state.history.length,5);
});

test('weather and track changes reduce usefulness of old familiarity without erasing history',()=>{
 let state=restoreVenueKnowledge();state=learnVenue(state,'rocky_ridge',{source:'practice',weather:'clear'}).state;state=learnVenue(state,'rocky_ridge',{source:'moto',weather:'clear'}).state;const k=venueKnowledge(state,'rocky_ridge');
 const same=effectiveFamiliarity(k,{weather:'clear',trackChange:0});const changed=effectiveFamiliarity(k,{weather:'rain',trackChange:60});assert.ok(changed<same);assert.equal(k.motos,1);
});

test('local knowledge helps but does not create runaway gains',()=>{
 const base=learnVenue(restoreVenueKnowledge(),'pine_hollow',{source:'practice',weather:'clear',local:false});const local=learnVenue(restoreVenueKnowledge(),'pine_hollow',{source:'practice',weather:'clear',local:true});assert.ok(local.gain>=base.gain);assert.ok(local.gain-base.gain<=3);
});

test('practice debrief identifies tires and track-specific setup needs',()=>{
 const report=buildSessionDebrief({race,rider,bike,phase:'practice',weather:'clear',familiarity:20,advisor:'Dad',advisorQuality:60});assert.equal(report.phase,'practice');assert.match(report.headline,/Dad/);assert.ok(report.recommendations.includes('change_tires'));assert.ok(report.observations.some(o=>o.area==='tires'));assert.ok(report.fit.breakdown.length>=10);
});

test('Moto 1 debrief uses actual events and evolved race traffic',()=>{
 const report=buildSessionDebrief({race:{name:'Rocky Ridge MX — Round 1'},rider,bike:{...bike,parts:{tires:80,brakes:80,chain:80,topEnd:80}},phase:'moto1',weather:'rain',traffic:78,familiarity:40,motoEvents:[{kind:'crash',text:'down'}],advisor:'Mechanic',advisorQuality:88});assert.equal(report.precision,'high');assert.ok(report.conditions.demands.ruts>=80);assert.ok(report.observations.some(o=>o.area==='rider_feel'));assert.ok(report.recommendations.length);
});

test('debrief changes persist and tire changes consume inventory',()=>{
 const weekend=weekendIntelligenceRecord();const inventory={tires:2};const target={parts:{tires:20}};const result=applyDebriefChoice(weekend,'change_tires',{inventory,bike:target});assert.equal(result.result.ok,true);assert.equal(inventory.tires,1);assert.equal(target.parts.tires,100);assert.equal(result.weekend.changes.at(-1).type,'tires');
});

test('tire change is blocked when no replacement is available',()=>{
 const result=applyDebriefChoice(weekendIntelligenceRecord(),'change_tires',{inventory:{tires:0},bike:{parts:{tires:25}}});assert.equal(result.result.ok,false);assert.equal(result.result.reason,'no-tire-inventory');
});
