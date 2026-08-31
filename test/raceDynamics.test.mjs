import test from 'node:test';
import assert from 'node:assert/strict';
import { VENUE_PROFILES } from '../src/systems/raceIntelligence.js';
import { resolveBikeTrackFit, resolveStart, passingOpportunity, resolvePositionBattle, resolveLateMotoExecution, mechanicalReliability } from '../src/systems/raceDynamics.js';

const bike={starts:68,handling:70,performance:72,reliability:74,condition:80,parts:{tires:84,brakes:90,chain:82,topEnd:86}};

test('setup presets create track-specific tradeoffs instead of universal upgrades',()=>{
 const tight=resolveBikeTrackFit(bike,VENUE_PROFILES.rocky_ridge,{setup:'tight'}); const fast=resolveBikeTrackFit(bike,VENUE_PROFILES.rocky_ridge,{setup:'fast'});
 assert.notEqual(tight.score,fast.score); assert.ok(tight.breakdown.find(x=>x.demand==='cornering').capacity>fast.breakdown.find(x=>x.demand==='cornering').capacity); assert.ok(fast.breakdown.find(x=>x.demand==='speed').capacity>tight.breakdown.find(x=>x.demand==='speed').capacity);
});

test('worn bike raises mechanical risk without guaranteeing failure',()=>{
 const fresh=resolveBikeTrackFit(bike,VENUE_PROFILES.sandy_creek,{setup:'rough'}); const worn=resolveBikeTrackFit({...bike,reliability:42,condition:38,parts:{tires:32,brakes:45,chain:30,topEnd:28}},VENUE_PROFILES.sandy_creek,{setup:'rough'});
 assert.ok(worn.mechanicalRisk>fresh.mechanicalRisk+20); const risk=mechanicalReliability({bike:{...bike,reliability:42,condition:38,parts:{chain:30,topEnd:28}},track:VENUE_PROFILES.sandy_creek,phase:.9,aggression:.8}); assert.ok(risk.failureChance<5); assert.equal(risk.riskBand,'high');
});

test('start quality is separate from lap pace and responds to rider plus hardware',()=>{
 const strong=resolveStart({rider:{skills:{starts:90}},bike:{starts:88},track:VENUE_PROFILES.pine_hollow,reaction:80,roll:.5}); const weak=resolveStart({rider:{skills:{starts:45}},bike:{starts:42},track:VENUE_PROFILES.pine_hollow,reaction:45,roll:.5}); assert.ok(strong.quality>weak.quality+25); assert.ok(strong.paceSeed>weak.paceSeed);
});

test('passing difficulty and line variety shape opportunity',()=>{
 const attacker={skills:{racecraft:82,lineChoice:84,composure:78}}; const defender={skills:{racecraft:68}};
 const open={...VENUE_PROFILES.sandy_creek,passingDifficulty:35,lineVariety:85}; const narrow={...VENUE_PROFILES.pine_hollow,passingDifficulty:82,lineVariety:35};
 const a=passingOpportunity({attacker,defender,track:open,aggression:.65,roll:.4}); const b=passingOpportunity({attacker,defender,track:narrow,aggression:.65,roll:.4}); assert.ok(a.chance>b.chance+15);
});

test('position battle distinguishes pass, traffic and defense states',()=>{
 const attacker={skills:{racecraft:78,lineChoice:80,composure:76}}; const defender={skills:{racecraft:74}}; const track=VENUE_PROFILES.pine_hollow;
 const pass=resolvePositionBattle({attacker,defender,track,attackerPace:78,defenderPace:65,aggression:.7,roll:.2}); const stuck=resolvePositionBattle({attacker,defender,track,attackerPace:78,defenderPace:72,aggression:.45,roll:.95}); assert.equal(pass.state,'pass'); assert.equal(stuck.state,'stuck');
});

test('late moto execution can fade, stabilize or finish strong from real attributes',()=>{
 const hard=VENUE_PROFILES.sandy_creek; const fading=resolveLateMotoExecution({rider:{skills:{fitness:42,consistency:45,composure:40}},track:hard,phase:.9,aggression:.8,pressure:80,priorLoad:70,recovery:35,temperatureF:94}); const strong=resolveLateMotoExecution({rider:{skills:{fitness:92,consistency:82,composure:84}},track:hard,phase:.9,aggression:.55,pressure:55,priorLoad:20,recovery:88,temperatureF:76}); assert.equal(fading.state,'fade'); assert.equal(strong.state,'finish-strong'); assert.ok(fading.mistakeRisk>strong.mistakeRisk+10); assert.ok(fading.pacePenalty>strong.pacePenalty);
});
