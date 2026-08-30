import test from 'node:test';
import assert from 'node:assert/strict';
import { migrateBikeOwnership } from '../src/systems/equipmentOwnership.js';
import { deferService, recordBikeUsage } from '../src/systems/equipmentWear.js';
import { evaluateBikeSeasonDecision, seasonEquipmentPlan } from '../src/systems/equipmentSeasonDecision.js';
import { createMarketplaceState, createPlayerListing, makeOffer, counterOffer, cancelListing, completePrivateSale, dealerTradeIn, canListAsset } from '../src/systems/equipmentMarketplace.js';
import { evaluateUsedListing, inspectUsedListing, purchaseUsedBike, evaluateUsedPart } from '../src/systems/usedEquipmentBuying.js';

function bike(overrides={}) { return { assetId:'bike_1', year:2024, model:'250F', originalMSRP:8500, condition:88, mechanical:{condition:88,reliability:90,engineHours:18,suspensionHours:20,serviceDebt:0,rebuilds:[],maintenance:[]}, ...overrides }; }

test('budget privateer can rationally rebuild instead of auto replacing',()=>{
  let b=bike(); b=recordBikeUsage(b,{hours:10,kind:'practice'}); b=deferService(b,{severity:3});
  const r=evaluateBikeSeasonDecision(b,{cash:1800,rebuildCost:900,replacementCost:7500,seasonIntensity:55,supportContribution:0});
  assert.notEqual(r.recommendation.id,'replace');
  assert.equal(r.options.find(x=>x.id==='rebuild-keep').affordable,true);
});

test('class-ineligible youth transition makes replacement effectively necessary',()=>{
  const r=evaluateBikeSeasonDecision(bike(),{classEligible:false,cash:9000,replacementCost:7000});
  assert.equal(r.recommendation.id,'replace');
  assert.equal(r.classEligible,false);
});

test('supported high-intensity rider gets practice-bike recommendation',()=>{
  const ownership=migrateBikeOwnership({bike:bike()});
  const plan=seasonEquipmentPlan(ownership,{seasonIntensity:90,supportTier:'development',floorCapacity:2,typicalRaceBikeValue:7000});
  assert.equal(plan.addPracticeBike.recommended,true);
  assert.ok(plan.addPracticeBike.estimatedBudget>0);
});

test('player listing supports offers, counteroffers, cancel and persistence shape',()=>{
  const asset=bike();
  let {market,listing}=createPlayerListing(createMarketplaceState(),asset,{askingPrice:6000});
  let offerResult=makeOffer(market,listing.listingId,{buyer:'rival-family',amount:5300}); market=offerResult.market;
  let counter=counterOffer(market,listing.listingId,offerResult.offer.offerId,5700); market=counter.market;
  assert.equal(counter.offer.counterAmount,5700);
  market=cancelListing(market,listing.listingId);
  assert.equal(market.listings[0].status,'canceled');
  assert.deepEqual(createMarketplaceState(JSON.parse(JSON.stringify(market))),market);
});

test('completed private bike sale credits cash once, removes ownership and preserves circulation/provenance',()=>{
  const ownership=migrateBikeOwnership({bike:bike()});
  const provenance={ownership:[{type:'purchase',from:'dealer',to:'me',year:2024,price:7000}],memories:['first_win']};
  const {market,listing}=createPlayerListing({},ownership.bikes[0],{askingPrice:6000});
  const sold=completePrivateSale({market,ownership,listingId:listing.listingId,buyer:'local-rider',price:5600,provenance,cash:400});
  assert.equal(sold.cash,6000);
  assert.equal(sold.ownership.bikes.length,0);
  assert.equal(sold.market.circulation.length,1);
  assert.equal(sold.provenance.ownership.at(-1).to,'local-rider');
});

test('trade-in is lower than private potential and removes bike immediately',()=>{
  const ownership=migrateBikeOwnership({bike:bike()});
  const privateListing=createPlayerListing({},ownership.bikes[0]).listing;
  const trade=dealerTradeIn({ownership,bikeId:'bike_1',cash:1000});
  assert.ok(trade.tradeInValue<privateListing.valuation.privateExpected);
  assert.equal(trade.ownership.bikes.length,0);
  assert.equal(trade.cash,1000+trade.tradeInValue);
});

test('installed or contract-restricted assets cannot be listed',()=>{
  assert.equal(canListAsset(bike(),{installed:true}).allowed,false);
  assert.equal(canListAsset({...bike(),ownershipRestricted:true},{}).allowed,false);
});

test('inspection reveals hidden wear and reduces residual risk',()=>{
  const listing={kind:'bike',price:3200,condition:78,hiddenWear:60,sellerReputation:35};
  const raw=evaluateUsedListing(listing,{inspectionLevel:'none'});
  const inspected=evaluateUsedListing(listing,{inspectionLevel:'dealer'});
  assert.ok(inspected.revealedWear>raw.revealedWear);
  assert.ok(inspected.residualRisk<raw.residualRisk);
  assert.equal(inspectUsedListing(listing,'mechanic').inspection.level,'mechanic');
});

test('used bike purchase charges inspection, preserves source and adds owned bike',()=>{
  const ownership=migrateBikeOwnership({});
  const listing={assetId:'used_125',kind:'bike',model:'125',price:2800,condition:82,hiddenWear:30,seller:'Sam',sellerReputation:70,engineHours:25};
  const result=purchaseUsedBike({ownership,listing,cash:4000,inspectionLevel:'mechanic'});
  assert.equal(result.cash,1090);
  assert.equal(result.ownership.bikes.length,1);
  assert.equal(result.ownership.bikes[0].assetId,'used_125');
  assert.equal(result.provenance.ownership.at(-1).from,'Sam');
});

test('incompatible part and used safety-critical gear are rejected by evaluation',()=>{
  const part=evaluateUsedPart({kind:'part',price:50},{compatible:false});
  assert.equal(part.allowed,false); assert.equal(part.fitmentAuthoritative,'reject');
  const helmet=evaluateUsedListing({category:'helmet',price:100,condition:90},{compatible:true});
  assert.equal(helmet.allowed,false); assert.ok(helmet.reasons.includes('used-safety-critical'));
});
