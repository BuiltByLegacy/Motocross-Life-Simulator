import test from 'node:test';
import assert from 'node:assert/strict';
import { migrateBikeOwnership, addOwnedBike, setBikeRole, setActiveBike, ownershipSnapshot, garageBikePressure } from '../src/systems/equipmentOwnership.js';
import { ensureMechanicalState, recordBikeUsage, splitPracticeAndRaceUsage, performService, deferService, serviceThresholds } from '../src/systems/equipmentWear.js';
import { equipmentValuation, compareDisposition, depreciationSnapshot } from '../src/systems/equipmentValuation.js';

test('legacy one-bike save migrates to a stable owned race bike',()=>{
  const legacy={bike:{year:2025,make:'Yamaha',model:'YZ85',condition:88}};
  const a=migrateBikeOwnership(legacy),b=migrateBikeOwnership(legacy);
  assert.equal(a.version,2);
  assert.equal(a.bikes.length,1);
  assert.equal(a.bikes[0].role,'race');
  assert.equal(a.bikes[0].assetId,b.bikes[0].assetId);
  assert.equal(a.active.raceBikeId,a.bikes[0].assetId);
});

test('race and practice bikes can coexist with explicit active roles',()=>{
  let o=migrateBikeOwnership({bike:{id:'race-1',year:2026,model:'250F'}});
  o=addOwnedBike(o,{id:'practice-1',year:2024,model:'250F'},{role:'practice'});
  o=setActiveBike(o,'practice','practice-1');
  const snap=ownershipSnapshot(o);
  assert.equal(snap.roles.race,1);
  assert.equal(snap.roles.practice,1);
  assert.equal(snap.active.practiceBikeId,'practice-1');
});

test('retiring an active bike clears contradictory active state',()=>{
  let o=migrateBikeOwnership({bike:{id:'bike-a'}});
  o=setBikeRole(o,'bike-a','retired');
  assert.equal(o.active.raceBikeId,null);
  assert.throws(()=>setActiveBike(o,'race','bike-a'),/bike-not-active-eligible/);
});

test('garage pressure reflects support and physical capacity without deleting bikes',()=>{
  let o=migrateBikeOwnership({bike:{id:'a'}});
  o=addOwnedBike(o,{id:'b'},{role:'practice'});
  o=addOwnedBike(o,{id:'c'},{role:'spare'});
  assert.equal(garageBikePressure(o,{floorCapacity:2,supportTier:'family'}).state,'over-capacity');
  assert.equal(garageBikePressure(o,{floorCapacity:2,supportTier:'satellite'}).state,'ok');
  assert.equal(o.bikes.length,3);
});

test('one-bike privateer practice consumes the race bike while a practice bike protects it',()=>{
  const race={id:'race',mechanical:{condition:100,reliability:100}};
  const solo=splitPracticeAndRaceUsage({raceBike:race},{hours:4});
  assert.equal(solo.usedRaceBikeForPractice,true);
  assert.ok(solo.raceBike.mechanical.practiceHours>=4);
  const paired=splitPracticeAndRaceUsage({raceBike:race,practiceBike:{id:'practice'}},{hours:4});
  assert.equal(paired.usedRaceBikeForPractice,false);
  assert.equal(paired.raceBike.mechanical.practiceHours,0);
  assert.ok(paired.practiceBike.mechanical.practiceHours>=4);
});

test('race usage creates more wear pressure and deferred service raises risk',()=>{
  const base=ensureMechanicalState({id:'x'});
  const practice=recordBikeUsage(base,{hours:2,kind:'practice'});
  const race=recordBikeUsage(base,{hours:2,kind:'race'});
  assert.ok(race.mechanical.condition<practice.mechanical.condition);
  const deferred=deferService(race,{severity:3});
  assert.ok(deferred.mechanical.serviceDebt>0);
  assert.ok(serviceThresholds(deferred).riskScore>serviceThresholds(race).riskScore);
});

test('rebuild restores mechanical health and becomes permanent history',()=>{
  let bike=recordBikeUsage({id:'x',mechanical:{condition:50,reliability:60,engineHours:28,suspensionHours:31}},{hours:2,kind:'race'});
  const before=bike.mechanical.condition;
  bike=performService(bike,{kind:'full-rebuild',cost:1400,date:'2026-11-01',parts:['piston','crank']});
  assert.ok(bike.mechanical.condition>before);
  assert.equal(bike.mechanical.rebuilds.length,1);
  assert.equal(bike.mechanical.rebuilds[0].cost,1400);
});

test('high hours and poor condition lower market value while rebuild history can recover value',()=>{
  const fresh={assetId:'fresh',year:2025,msrp:9000,mechanical:{condition:95,reliability:96,engineHours:8,suspensionHours:10}};
  const tired={assetId:'tired',year:2025,msrp:9000,mechanical:{condition:55,reliability:65,engineHours:75,suspensionHours:80}};
  const rebuilt={...tired,mechanical:{...tired.mechanical,rebuilds:[{kind:'full-rebuild'}]}};
  const fv=equipmentValuation(fresh,{currentYear:2026});
  const tv=equipmentValuation(tired,{currentYear:2026});
  const rv=equipmentValuation(rebuilt,{currentYear:2026});
  assert.ok(fv.marketEstimate>tv.marketEstimate);
  assert.ok(rv.marketEstimate>tv.marketEstimate);
});

test('modifications do not recover full purchase cost and trade-in is below private sale',()=>{
  const bike={year:2025,msrp:8500,modifications:[{cost:2000,desirable:true},{cost:800,desirable:false}]};
  const v=equipmentValuation(bike,{currentYear:2026});
  assert.ok(v.modifications.recoverableValue<v.modifications.purchaseCost);
  assert.ok(v.tradeIn<v.privateExpected);
  assert.equal(compareDisposition(bike,{currentYear:2026}).tradeIn.wait,'immediate');
});

test('significant provenance raises collector value more than ordinary market value',()=>{
  const bike={year:2023,msrp:8000,mechanical:{condition:80,reliability:85,engineHours:30,suspensionHours:35}};
  const normal=equipmentValuation(bike,{currentYear:2026});
  const historic=equipmentValuation(bike,{currentYear:2026,provenance:{championships:2,majorWins:4,famousEvents:2,memoryCount:18}});
  assert.ok(historic.collectorEstimate>historic.marketEstimate);
  assert.ok((historic.collectorEstimate-normal.collectorEstimate)>(historic.marketEstimate-normal.marketEstimate));
});

test('team or sponsor restricted equipment cannot be treated as sellable',()=>{
  const v=equipmentValuation({year:2026,msrp:10000},{currentYear:2026,teamOwned:true});
  assert.equal(v.restricted,true);
  assert.equal(v.sellable,false);
});

test('depreciation snapshot declines over future years holding other factors constant',()=>{
  const rows=depreciationSnapshot({year:2026,msrp:10000},[0,1,2,3],{currentYear:2026});
  assert.ok(rows[0].marketEstimate>rows.at(-1).marketEstimate);
});
