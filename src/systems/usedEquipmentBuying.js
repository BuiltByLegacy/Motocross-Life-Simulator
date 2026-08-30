import { addOwnedBike } from './equipmentOwnership.js';
import { ensureMechanicalState } from './equipmentWear.js';
import { makeProvenance } from './assetProvenance.js';

const SAFETY_CRITICAL=new Set(['helmet','neck-brace','chest-protector']);
const clamp=(v,lo=0,hi=100)=>Math.max(lo,Math.min(hi,Number(v)||0));

export function evaluateUsedListing(listing={},context={}){
  const category=listing.category??listing.kind??'bike';
  const compatible=context.compatible!==false&&listing.compatible!==false;
  const sellerRep=clamp(listing.sellerReputation??50);
  const knownCondition=listing.condition!=null;
  const inspectionLevel=context.inspectionLevel??'none';
  const inspectFactor={none:0,basic:.35,mechanic:.75,dealer:.9}[inspectionLevel]??0;
  const hiddenWear=clamp(listing.hiddenWear??Math.max(0,60-sellerRep*.35));
  const revealedWear=Math.round(hiddenWear*inspectFactor);
  const residualRisk=Math.round(hiddenWear-revealedWear);
  const condition=clamp((listing.condition??75)-revealedWear*.45);
  const safetyCritical=SAFETY_CRITICAL.has(category);
  const reasons=[];
  if(!compatible)reasons.push('incompatible');
  if(safetyCritical&&context.allowUsedSafetyCritical!==true)reasons.push('used-safety-critical');
  if(!knownCondition)reasons.push('unknown-condition');
  return {compatible,safetyCritical,inspectionLevel,inspectionCost:inspectionLevel==='dealer'?180:inspectionLevel==='mechanic'?110:inspectionLevel==='basic'?40:0,revealedWear,residualRisk,estimatedCondition:condition,maintenanceRisk:residualRisk>=45?'high':residualRisk>=20?'moderate':'low',allowed:reasons.length===0,reasons};
}

export function inspectUsedListing(listing={},level='mechanic'){
  const evaluation=evaluateUsedListing(listing,{inspectionLevel:level,compatible:true,allowUsedSafetyCritical:true});
  return {...listing,inspection:{level,cost:evaluation.inspectionCost,revealedWear:evaluation.revealedWear,estimatedCondition:evaluation.estimatedCondition,residualRisk:evaluation.residualRisk}};
}

export function purchaseUsedBike({ownership,listing,cash=0,inspectionLevel='none',compatible=true,buyer='me'}={}){
  const evaluation=evaluateUsedListing(listing,{inspectionLevel,compatible,allowUsedSafetyCritical:true});if(!evaluation.compatible)throw new Error('incompatible-equipment');
  const total=Math.round(Number(listing.price)||0)+evaluation.inspectionCost;if(total>Number(cash||0))throw new Error('insufficient-cash');
  const mechanicalSource={...listing,condition:evaluation.estimatedCondition,reliability:Math.max(25,evaluation.estimatedCondition-evaluation.residualRisk*.3),serviceDebt:Math.min(1,(evaluation.residualRisk/100)+Number(listing.serviceDebt||0))};
  const bike=ensureMechanicalState(mechanicalSource);
  const provenance=listing.provenance??makeProvenance({assetId:bike.assetId,kind:'bike',name:bike.name??bike.model??'',acquiredVia:'purchase',from:listing.seller??'used-seller',year:listing.currentYear??null,price:Number(listing.price)||0});
  if(provenance.ownership?.length)provenance.ownership.push({type:'purchase',from:listing.seller??'used-seller',to:buyer,year:listing.currentYear??null,price:Number(listing.price)||0,note:`Used purchase; inspection ${inspectionLevel}`});
  const next=addOwnedBike(ownership,{...bike,provenance},{role:'race'});
  return {ownership:next,cash:Math.round(Number(cash)||0)-total,bike:next.bikes.find(x=>x.assetId===bike.assetId)??bike,provenance,evaluation,totalCost:total};
}

export function evaluateUsedPart(listing={},context={}){
  const evaluation=evaluateUsedListing(listing,{inspectionLevel:context.inspectionLevel??'none',compatible:context.compatible,allowUsedSafetyCritical:context.allowUsedSafetyCritical});
  return {...evaluation,fitmentAuthoritative:!evaluation.compatible?'reject':'accept',recommendation:!evaluation.allowed?'avoid':evaluation.maintenanceRisk==='high'?'inspect-or-budget-repair':evaluation.maintenanceRisk==='moderate'?'buy-with-margin':'reasonable-buy'};
}
