// Equipment Lifecycle 2.0 — sponsor/dealer/team support (#456)

export const OWNERSHIP_SOURCES=Object.freeze(['rider-owned','family-owned','dealer-loaned','sponsor-provided','team-owned']);
const clamp=(v,lo=0,hi=100)=>Math.max(lo,Math.min(hi,Number(v)||0));

export function normalizeSupportAsset(asset={},terms={}){
 const source=OWNERSHIP_SOURCES.includes(asset.ownershipSource)?asset.ownershipSource:(asset.ownershipStatus==='loaned'?'dealer-loaned':'family-owned');
 const returnRequired=terms.returnRequired??['dealer-loaned','team-owned'].includes(source);
 return {...asset,ownershipSource:source,supportContractId:asset.supportContractId??terms.contractId??null,returnRequired:Boolean(returnRequired),transferAllowed:Boolean(terms.transferAllowed??asset.transferAllowed??!returnRequired),supportBrand:asset.supportBrand??terms.brand??null};
}

export function supportPackage(raw={}){
 return {id:String(raw.id??'support'),providerType:raw.providerType??'sponsor',provider:raw.provider??null,brand:raw.brand??null,bikeDiscountPct:clamp(raw.bikeDiscountPct??0),partsDiscountPct:clamp(raw.partsDiscountPct??0),gearDiscountPct:clamp(raw.gearDiscountPct??0),tireAllotment:Math.max(0,Number(raw.tireAllotment??0)),partsCredit:Math.max(0,Number(raw.partsCredit??0)),gearCredit:Math.max(0,Number(raw.gearCredit??0)),contingencyCredit:Math.max(0,Number(raw.contingencyCredit??0)),bikeLoans:Array.isArray(raw.bikeLoans)?raw.bikeLoans.map(x=>({...x})):[],exclusivity:Array.isArray(raw.exclusivity)?[...raw.exclusivity]:[],active:raw.active!==false};
}

export function applySupportToExpense(expense={},packages=[]){
 const gross=Math.max(0,Number(expense.amount)||0),category=expense.category??'parts';let remaining=gross,support=0,details=[];
 for(const pRaw of packages){const p=supportPackage(pRaw);if(!p.active)continue;
  const pct=category==='bike'?p.bikeDiscountPct:category==='gear'?p.gearDiscountPct:category==='parts'||category==='tires'?p.partsDiscountPct:0;
  if(pct>0&&remaining>0){const v=Math.round(remaining*pct/100);support+=v;remaining-=v;details.push({packageId:p.id,type:'discount',amount:v});}
  const creditKey=category==='gear'?'gearCredit':category==='parts'||category==='tires'?'partsCredit':null;
  if(creditKey&&p[creditKey]>0&&remaining>0){const v=Math.min(remaining,p[creditKey]);support+=v;remaining-=v;details.push({packageId:p.id,type:'credit',amount:v});}
 }
 return {gross,support,outOfPocket:remaining,details};
}

export function exclusivityConflict(assetOrPurchase={},packages=[]){
 const brand=assetOrPurchase.brand??assetOrPurchase.make??null;if(!brand)return {conflict:false,reasons:[]};const reasons=[];
 for(const pRaw of packages){const p=supportPackage(pRaw);if(!p.active)continue;for(const rule of p.exclusivity){if(rule.category&&(rule.category!==assetOrPurchase.category))continue;if(rule.brand&&rule.brand!==brand)reasons.push(`${p.provider??p.id} requires ${rule.brand} for ${rule.category??'equipment'}`);}}
 return {conflict:reasons.length>0,reasons};
}

export function endSupportContract(assets=[],contractId,{conversionPriceByAsset={}}={}){
 return assets.map(a=>{const asset=normalizeSupportAsset(a);if(asset.supportContractId!==contractId)return {asset,action:'unchanged',cost:0};
  if(asset.returnRequired)return {asset:{...asset,ownershipStatus:'return-due'},action:'return',cost:0};
  const price=Math.max(0,Number(conversionPriceByAsset[asset.assetId]??0));if(price>0)return {asset:{...asset,ownershipStatus:'conversion-offered'},action:'buyout',cost:price};
  return {asset:{...asset,supportContractId:null},action:'retain',cost:0};});
}

export function supportedProgramFeasibility({annualBikeCost=0,annualPartsCost=0,annualGearCost=0,availableCash=0,packages=[]}={}){
 const bike=applySupportToExpense({category:'bike',amount:annualBikeCost},packages),parts=applySupportToExpense({category:'parts',amount:annualPartsCost},packages),gear=applySupportToExpense({category:'gear',amount:annualGearCost},packages);
 const burden=bike.outOfPocket+parts.outOfPocket+gear.outOfPocket,totalSupport=bike.support+parts.support+gear.support;
 return {burden,totalSupport,affordable:burden<=Math.max(0,Number(availableCash)||0),supportsMultiBike:totalSupport>=annualBikeCost*.25||packages.some(p=>supportPackage(p).bikeLoans.length>0),breakdown:{bike,parts,gear}};
}
