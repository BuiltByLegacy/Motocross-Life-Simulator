// Equipment & Ownership Lifecycle 2.0 — shared valuation service (#454)
import { ensureMechanicalState } from './equipmentWear.js';

const clamp=(v,lo=0,hi=1)=>Math.max(lo,Math.min(hi,Number(v)||0));
const money=(v)=>Math.max(0,Math.round(Number(v)||0));

function ageFactor(modelYear,currentYear){const age=Math.max(0,(Number(currentYear)||2026)-(Number(modelYear)||Number(currentYear)||2026));return Math.max(.22,Math.pow(.86,age));}
function conditionFactor(condition){const c=clamp((Number(condition)||0)/100);return .38+c*.62;}
function hoursFactor(engineHours,suspensionHours){const weighted=Math.max(Number(engineHours)||0,(Number(suspensionHours)||0)*.7);return Math.max(.42,1-Math.min(.58,weighted/180));}
function rebuildFactor(mechanical){const recent=(mechanical.rebuilds??[]).slice(-2);return Math.min(1.12,1+recent.length*.035);}
function modificationFactor(mods=[]){
  let purchase=0,recoverable=0;
  for(const mod of mods||[]){const cost=Number(mod.cost)||0;purchase+=cost;const fit=mod.transferable===false?.05:mod.desirable===false?.12:.28;recoverable+=cost*fit;}
  return {purchaseCost:money(purchase),recoverableValue:money(recoverable)};
}
function provenancePremium(prov={}){
  const championships=Number(prov.championships??0),majorWins=Number(prov.majorWins??0),famousEvents=Number(prov.famousEvents??0),memories=Number(prov.memoryCount??prov.memories?.length??0);
  const score=Math.min(1,championships*.28+majorWins*.08+famousEvents*.12+memories*.015);
  return {score,marketMultiplier:1+score*.08,collectorMultiplier:1+score*.45};
}

export function equipmentValuation(assetRaw={},context={}){
  const asset=ensureMechanicalState(assetRaw),m=asset.mechanical;
  const msrp=Number(context.originalMSRP??asset.originalMSRP??asset.msrp??asset.purchasePrice??5000);
  const currentYear=Number(context.currentYear??2026);
  const demand=Math.max(.7,Math.min(1.35,Number(context.marketDemand??1)));
  const regional=Math.max(.8,Math.min(1.2,Number(context.regionalDemand??1)));
  const age=ageFactor(asset.year??asset.modelYear,currentYear);
  const condition=conditionFactor(m.condition??asset.condition??100);
  const hours=hoursFactor(m.engineHours,m.suspensionHours);
  const rebuild=rebuildFactor(m);
  const mods=modificationFactor(asset.modifications??asset.installedParts??[]);
  const provenance=provenancePremium(context.provenance??asset.provenance??{});
  const restricted=Boolean(context.ownershipRestricted??asset.ownershipRestricted||context.sponsorRestricted||context.teamOwned);
  const base=(msrp*age*condition*hours*rebuild*demand*regional)+mods.recoverableValue;
  const market=money(base*provenance.marketMultiplier);
  const collector=money(base*provenance.collectorMultiplier);
  const privateAsk=money(market*1.08);
  const privateExpected=money(market*.98);
  const tradeIn=money(market*.78);
  const replacement=money(Math.max(market,msrp*age*.82)+mods.recoverableValue*.25);
  return {
    assetId:asset.assetId??asset.id??null,
    restricted,
    sellable:!restricted,
    marketEstimate:market,
    privateAsk,
    privateExpected,
    tradeIn,
    replacementEstimate:replacement,
    collectorEstimate:collector,
    factors:{age:Math.round(age*1000)/1000,condition:Math.round(condition*1000)/1000,hours:Math.round(hours*1000)/1000,rebuild:Math.round(rebuild*1000)/1000,marketDemand:demand,regionalDemand:regional,provenance:Math.round(provenance.score*100)/100},
    modifications:mods,
  };
}

export function compareDisposition(asset,context={}){
  const v=equipmentValuation(asset,context);
  return {privateSale:{value:v.privateExpected,wait:'variable'},tradeIn:{value:v.tradeIn,wait:'immediate'},keep:{value:v.marketEstimate},collector:{value:v.collectorEstimate,liquid:false},restricted:v.restricted};
}

export function depreciationSnapshot(asset,years=[0,1,2,3],context={}){
  const start=Number(context.currentYear??2026);
  return years.map(offset=>({year:start+offset,...equipmentValuation(asset,{...context,currentYear:start+offset})}));
}
