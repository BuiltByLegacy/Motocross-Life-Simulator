import test from 'node:test';
import assert from 'node:assert/strict';
import {createEquipmentCareerState,useBike,serviceBike,consumeGear,replaceGear,listBikeForSale,completeBikeSale,buyUsedBike,nextEquipmentSeason,equipmentSaveRoundTrip,assertEquipmentIntegrity} from '../src/systems/equipmentCareer.js';
import {equipmentGarageScene,marketplacePresentation} from '../src/systems/equipmentPresentation.js';

function start(){return createEquipmentCareerState({cash:8000,ownership:{bike:{assetId:'old125',year:2022,make:'Yamaha',model:'YZ125',originalMSRP:6999,condition:82,mechanical:{engineHours:18,suspensionHours:22,condition:82,reliability:88}}},gear:[{id:'filter1',category:'filter',quantity:1,condition:100,retailPrice:18},{id:'helmet1',category:'helmet',condition:80,retailPrice:350}]});}

test('full equipment economy flow preserves money and history without duplication',()=>{
 let s=start(),initial=s.cash;
 s=useBike(s,'old125',{hours:5,kind:'practice'});assert.ok(s.ownership.bikes[0].mechanical.engineHours>18);
 s=consumeGear(s,'filter1',{sessions:1,kind:'race'});assert.equal(s.gear.find(g=>g.id==='filter1').quantity,0);
 s=replaceGear(s,'filter1',{retailPrice:18});assert.equal(s.cash,initial-18);
 s=serviceBike(s,'old125',{kind:'top-end',cost:600});assert.equal(s.cash,initial-618);
 const listed=listBikeForSale(s,'old125',{askingPrice:4000});s=listed.state;assert.equal(s.ownership.bikes[0].role,'for-sale');
 s=completeBikeSale(s,listed.listing.listingId,{buyer:'local-racer',price:3900});assert.equal(s.ownership.bikes.length,0);assert.equal(s.cash,initial-618+3900);
 s=buyUsedBike(s,{assetId:'new250',kind:'bike',category:'bike',seller:'dealer-used',year:2025,make:'Honda',model:'CRF250R',price:6500,condition:88,hiddenWear:8,sellerReputation:90,compatible:true},{inspectionLevel:'mechanic',packages:[{id:'dealer-support',bikeDiscountPct:10}]});
 assert.equal(s.ownership.bikes.length,1);assert.equal(s.ownership.bikes[0].assetId,'new250');assert.ok(s.cash>=0);
 s=nextEquipmentSeason(s);const round=equipmentSaveRoundTrip(s);assert.equal(round.season,2);assert.equal(round.market.circulation[0].assetId,'old125');assert.equal(round.ownership.bikes[0].assetId,'new250');assert.equal(assertEquipmentIntegrity(round).valid,true);
 const sales=round.ledger.filter(x=>x.type==='equipment-sale');assert.equal(sales.length,1);
});

test('supported rider can add practice bike and reload with both physical bikes intact',()=>{let s=createEquipmentCareerState({cash:10000,ownership:{bike:{assetId:'race',year:2026,model:'250F',condition:95}}});s=buyUsedBike(s,{assetId:'practice',kind:'bike',category:'bike',seller:'shop',price:4000,condition:80,hiddenWear:5,sellerReputation:95,compatible:true},{packages:[{id:'shop',bikeDiscountPct:50}]});const r=equipmentSaveRoundTrip(s);assert.equal(r.ownership.bikes.length,2);assert.equal(new Set(r.ownership.bikes.map(b=>b.assetId)).size,2);assert.ok(r.ownership.bikes.some(b=>b.role==='practice'));});

test('Garage presentation distinguishes physical roles and contextual attention',()=>{const s=createEquipmentCareerState({cash:1200,ownership:{bikes:[{assetId:'r',role:'race',model:'YZ125',mechanical:{condition:35,reliability:30,engineHours:44,serviceDebt:10}},{assetId:'p',role:'practice',model:'YZ125 Practice',mechanical:{condition:75,reliability:80,engineHours:20}},{assetId:'d',role:'display',model:'First 65',mechanical:{condition:65,reliability:70},provenance:{memories:['m1','m2']}}]},gear:[{id:'h',category:'helmet',condition:55}]});const scene=equipmentGarageScene(s);assert.equal(scene.bikes.length,3);assert.ok(scene.bikes.some(b=>b.roleLabel==='Practice Bike'));assert.equal(scene.gearAttention[0].category,'helmet');assert.ok(scene.priority);});

test('marketplace presentation keeps listed and sold states distinct',()=>{let s=start();const l=listBikeForSale(s,'old125',{askingPrice:4200});s=l.state;let view=marketplacePresentation(s);assert.equal(view.activeListings.length,1);s=completeBikeSale(s,l.listing.listingId,{price:4100});view=marketplacePresentation(s);assert.equal(view.activeListings.length,0);assert.equal(view.sold.length,1);});
