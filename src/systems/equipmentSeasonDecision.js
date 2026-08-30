import { migrateBikeOwnership, bikesByRole, garageBikePressure } from './equipmentOwnership.js';
import { equipmentValuation } from './equipmentValuation.js';
import { ensureMechanicalState, serviceThresholds } from './equipmentWear.js';

const clamp=(v,lo=0,hi=100)=>Math.max(lo,Math.min(hi,Number(v)||0));

export function evaluateBikeSeasonDecision(bikeRaw,context={}){
  const bike=ensureMechanicalState(bikeRaw),m=bike.mechanical,thresholds=serviceThresholds(bike);
  const serviceDebt=Math.min(1,Math.max(0,m.serviceDebt/20));
  const status={...thresholds,condition:m.condition,reliability:m.reliability,serviceDebt,band:thresholds.risk==='low'?'ready':thresholds.risk==='moderate'?'watch':'service-needed'};
  const value=equipmentValuation(bike,{currentYear:context.currentYear,marketDemand:context.marketDemand,regionalDemand:context.regionalDemand,provenance:context.provenance});
  const classEligible=context.classEligible!==false;
  const cash=Math.max(0,Number(context.cash)||0), rebuildCost=Math.max(0,Number(context.rebuildCost)||900), replacementCost=Math.max(0,Number(context.replacementCost)||Math.max(value.replacementEstimate,4500));
  const support=Math.max(0,Number(context.supportContribution)||0), seasonIntensity=clamp(context.seasonIntensity??55), debtTolerance=clamp(context.debtTolerance??25), sentimental=clamp(context.sentimentalValue??0);
  const effectiveCash=cash+support;
  const options=[];
  const push=(id,score,reason,cost=0)=>options.push({id,score:Math.round(score),reason,cost,affordable:cost<=effectiveCash||debtTolerance>=70});
  if(classEligible){
    push('keep-race',72+(status.band==='ready'?15:0)-(serviceDebt*18)-(seasonIntensity>75?8:0),'Keep the current bike as the race bike and accept its existing wear profile.');
    push('move-practice',48+(serviceDebt<.4?8:0)+(seasonIntensity>65?12:0),'Move this bike to practice duty to protect a newer race bike.');
    push('rebuild-keep',60+serviceDebt*28+(effectiveCash>=rebuildCost?10:-18),'Rebuild the existing bike and keep its known setup/history.',rebuildCost);
  } else {
    push('replace',96,'The next class is not compatible with this bike, so replacement is effectively required.',replacementCost);
  }
  if(classEligible) push('replace',50+(serviceDebt*25)+(seasonIntensity>80?14:0)+(support>0?10:0)-(effectiveCash<replacementCost?24:0),'Replace with newer equipment for reliability and class/season fit.',replacementCost);
  push('sell-private',42+(value.privateExpected>rebuildCost?10:0)-(sentimental*.18),'Sell privately to maximize proceeds for the next season.');
  push('trade-dealer',38+(context.conveniencePriority??0)*.3,'Trade at a dealer for lower proceeds but immediate, simple turnover.');
  push('retire-display',25+sentimental*.7+(value.collectorEstimate>value.marketEstimate*1.15?15:0),'Preserve the bike because its history matters more than its liquid value.');
  options.sort((a,b)=>b.score-a.score);
  return {bikeId:bike.assetId??bike.id??null,status,value,classEligible,rebuildCost,replacementCost,effectiveCash,options,recommendation:options[0]};
}

export function seasonEquipmentPlan(ownershipRaw,context={}){
  const ownership=migrateBikeOwnership(ownershipRaw),decisions=ownership.bikes.filter(b=>!['for-sale','retired','display'].includes(b.role)).map(b=>evaluateBikeSeasonDecision(b,{...context,classEligible:context.classEligibility?.[b.assetId]??context.classEligible,provenance:context.provenanceByBike?.[b.assetId]}));
  const race=bikesByRole(ownership,'race').length,practice=bikesByRole(ownership,'practice').length;
  const pressure=garageBikePressure(ownership,{floorCapacity:context.floorCapacity,supportTier:context.supportTier});
  const intensity=clamp(context.seasonIntensity??55),supportTier=context.supportTier??'family';
  const addPracticeBike=race>=1&&practice===0&&intensity>=70&&['privateer','satellite','development','factory'].includes(supportTier)&&pressure.state!=='over-capacity';
  const estimatedPracticeBikeBudget=Math.max(1200,Math.round((Number(context.typicalRaceBikeValue)||5000)*.48));
  return {decisions,addPracticeBike:{recommended:addPracticeBike,estimatedBudget:estimatedPracticeBikeBudget,reason:addPracticeBike?'High workload/support justify separating practice wear from the race bike.':'Current workload, support, or garage capacity does not justify a dedicated practice bike yet.'},equipmentBudgetNeed:Math.round(decisions.reduce((s,d)=>s+(d.recommendation?.cost||0),0)+(addPracticeBike?estimatedPracticeBikeBudget:0)),pressure};
}
