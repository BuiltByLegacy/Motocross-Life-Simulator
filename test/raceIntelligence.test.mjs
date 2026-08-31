import test from 'node:test';
import assert from 'node:assert/strict';
import { VENUE_PROFILES, trackProfileForRace, evolveTrackConditions, resolveRiderTrackFit, raceIntelligenceFor } from '../src/systems/raceIntelligence.js';

test('existing venues resolve to materially different data-driven profiles',()=>{
 const rocky=trackProfileForRace({name:'Rocky Ridge MX — Round 1'}); const sandy=trackProfileForRace({name:'Sandy Creek — Round 3'});
 assert.equal(rocky.id,'rocky_ridge'); assert.equal(sandy.id,'sandy_creek'); assert.ok(sandy.demands.fitness>rocky.demands.fitness+15); assert.ok(rocky.demands.ruts>sandy.demands.ruts);
});

test('weather and traffic deterministically evolve track demands',()=>{
 const input={weather:'rain',phase:'moto2',traffic:82,temperatureF:91,drying:70}; const a=evolveTrackConditions(VENUE_PROFILES.rocky_ridge,input); const b=evolveTrackConditions(VENUE_PROFILES.rocky_ridge,input);
 assert.deepEqual(a,b); assert.equal(a.surface,'drying-mud'); assert.ok(a.demands.ruts>VENUE_PROFILES.rocky_ridge.demands.ruts); assert.ok(a.demands.fitness>VENUE_PROFILES.rocky_ridge.demands.fitness); assert.ok(a.notes.length>=3);
});

test('practice and later moto can expose different conditions',()=>{
 const p=evolveTrackConditions(VENUE_PROFILES.pine_hollow,{weather:'clear',phase:'practice',traffic:15}); const m=evolveTrackConditions(VENUE_PROFILES.pine_hollow,{weather:'clear',phase:'moto2',traffic:85});
 assert.ok(m.demands.roughTerrain>p.demands.roughTerrain); assert.ok(m.demands.ruts>p.demands.ruts);
});

test('contrasting rider archetypes fit contrasting tracks differently',()=>{
 const technical={skills:{starts:62,cornering:88,ruts:90,braking:86,jumping:60,roughTerrain:55,lineChoice:84,racecraft:82,consistency:78,fitness:58,composure:80,adaptability:75},confidence:70};
 const sand={skills:{starts:58,cornering:62,ruts:55,braking:60,jumping:64,roughTerrain:92,lineChoice:72,racecraft:65,consistency:74,fitness:94,composure:70,adaptability:82},confidence:70};
 const technicalRock=resolveRiderTrackFit(technical,VENUE_PROFILES.rocky_ridge,{familiarity:50}); const sandRock=resolveRiderTrackFit(sand,VENUE_PROFILES.rocky_ridge,{familiarity:50});
 const technicalSand=resolveRiderTrackFit(technical,VENUE_PROFILES.sandy_creek,{familiarity:50}); const sandSand=resolveRiderTrackFit(sand,VENUE_PROFILES.sandy_creek,{familiarity:50});
 assert.ok(technicalRock.score>sandRock.score); assert.ok(sandSand.score>technicalSand.score); assert.ok(technicalRock.strengths.length); assert.ok(technicalSand.weaknesses.length);
});

test('familiarity and confidence change execution modestly without replacing talent',()=>{
 const rider={skills:{starts:65,cornering:65,ruts:65,braking:65,jumping:65,roughTerrain:65,lineChoice:65,racecraft:65,consistency:65,fitness:65,composure:65,adaptability:65}};
 const low=resolveRiderTrackFit(rider,VENUE_PROFILES.rocky_ridge,{familiarity:0,confidence:25}); const high=resolveRiderTrackFit(rider,VENUE_PROFILES.rocky_ridge,{familiarity:100,confidence:90});
 assert.ok(high.score>low.score); assert.ok(high.score-low.score<10); assert.ok(low.uncertainty>high.uncertainty);
});

test('shared resolver accepts the same rider shape for player or AI',()=>{
 const ai={skills:{starts:70,cornering:70,ruts:70,braking:70,jumping:70,roughTerrain:70,lineChoice:70,racecraft:70,consistency:70,fitness:70,composure:70,adaptability:70},confidence:60};
 const a=raceIntelligenceFor(ai,{name:'Pine Hollow — Round 2'},{weather:'wind',phase:'moto1',familiarity:30}); const b=raceIntelligenceFor(ai,{name:'Pine Hollow — Round 2'},{weather:'wind',phase:'moto1',familiarity:30}); assert.deepEqual(a,b); assert.ok(a.fit.breakdown.length>=10);
});
