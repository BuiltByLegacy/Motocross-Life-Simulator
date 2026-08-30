// Equipment & Ownership Lifecycle 2.0 — canonical multi-bike ownership (#449)
// Keeps stable physical bike identity separate from temporary role/active status.

export const BIKE_ROLES = Object.freeze(['race','practice','spare','project','retired','display','for-sale']);
export const EQUIPMENT_OWNERSHIP_VERSION = 2;

const clamp=(v,lo=0,hi=100)=>Math.max(lo,Math.min(hi,Number(v)||0));
function hash(text){let h=2166136261;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return(h>>>0).toString(36);}

export function stableBikeId(bike={},index=0){
  if(bike.assetId)return bike.assetId;
  if(bike.id)return String(bike.id);
  const key=[bike.serial,bike.vin,bike.year,bike.make,bike.brand,bike.model,bike.klass,bike.class,bike.displacement,index].filter(v=>v!=null).join(':');
  return `bike_${hash(key||`legacy:${index}`)}`;
}

export function normalizeBike(raw={},index=0){
  const role=BIKE_ROLES.includes(raw.role)?raw.role:(raw.listedForSale?'for-sale':raw.retired?'retired':'race');
  return {
    ...raw,
    assetId:stableBikeId(raw,index),
    role,
    condition:clamp(raw.condition??raw.health??100),
    ownershipStatus:raw.ownershipStatus??'owned',
    activeForClass:raw.activeForClass??null,
    activeForEvent:raw.activeForEvent??null,
    history:Array.isArray(raw.history)?raw.history.map(x=>({...x})):[],
  };
}

export function migrateBikeOwnership(raw={}){
  if(raw?.version===2&&Array.isArray(raw.bikes))return normalizeOwnership(raw);
  const legacyBikes=Array.isArray(raw?.bikes)?raw.bikes:(raw?.bike?[raw.bike]:raw?.activeBike?[raw.activeBike]:[]);
  const bikes=legacyBikes.map(normalizeBike);
  const firstRace=bikes.find(b=>b.role==='race')??bikes[0]??null;
  return normalizeOwnership({version:2,bikes,active:{raceBikeId:firstRace?.assetId??null,practiceBikeId:bikes.find(b=>b.role==='practice')?.assetId??null,eventBikeId:null},history:[{type:'migration',fromVersion:Number(raw?.version||1),toVersion:2}]});
}

export function normalizeOwnership(raw={}){
  const bikes=(raw.bikes??[]).map(normalizeBike);
  const ids=new Set();
  for(const bike of bikes){
    if(ids.has(bike.assetId)) throw new Error(`duplicate-bike-id:${bike.assetId}`);
    ids.add(bike.assetId);
  }
  const active={raceBikeId:raw.active?.raceBikeId??null,practiceBikeId:raw.active?.practiceBikeId??null,eventBikeId:raw.active?.eventBikeId??null};
  for(const key of Object.keys(active))if(active[key]&&!ids.has(active[key]))active[key]=null;
  return {version:2,bikes,active,history:Array.isArray(raw.history)?raw.history.map(x=>({...x})):[]};
}

export function getBike(ownershipRaw,bikeId){return migrateBikeOwnership(ownershipRaw).bikes.find(b=>b.assetId===bikeId)??null;}
export function bikesByRole(ownershipRaw,role){return migrateBikeOwnership(ownershipRaw).bikes.filter(b=>b.role===role);}

export function setBikeRole(ownershipRaw,bikeId,role,{season=null,date=null}={}){
  if(!BIKE_ROLES.includes(role))throw new Error(`invalid-bike-role:${role}`);
  const o=migrateBikeOwnership(ownershipRaw),bike=o.bikes.find(b=>b.assetId===bikeId);if(!bike)throw new Error(`unknown-bike:${bikeId}`);
  const prior=bike.role; bike.role=role;
  if(['retired','display','for-sale','project'].includes(role)){
    if(o.active.raceBikeId===bikeId)o.active.raceBikeId=null;
    if(o.active.practiceBikeId===bikeId)o.active.practiceBikeId=null;
    if(o.active.eventBikeId===bikeId)o.active.eventBikeId=null;
  }
  o.history.push({type:'role-change',bikeId,from:prior,to:role,season,date});
  return o;
}

export function setActiveBike(ownershipRaw,type,bikeId,{klass=null,eventId=null}={}){
  const o=migrateBikeOwnership(ownershipRaw),bike=o.bikes.find(b=>b.assetId===bikeId);if(!bike)throw new Error(`unknown-bike:${bikeId}`);
  if(['retired','display','for-sale','project'].includes(bike.role))throw new Error(`bike-not-active-eligible:${bike.role}`);
  const key=type==='practice'?'practiceBikeId':type==='event'?'eventBikeId':'raceBikeId';
  o.active[key]=bikeId;
  if(klass)bike.activeForClass=klass;
  if(eventId)bike.activeForEvent=eventId;
  return o;
}

export function addOwnedBike(ownershipRaw,bike,{role='race'}={}){
  const o=migrateBikeOwnership(ownershipRaw),normalized=normalizeBike({...bike,role},o.bikes.length);
  if(o.bikes.some(b=>b.assetId===normalized.assetId))throw new Error(`duplicate-bike-id:${normalized.assetId}`);
  o.bikes.push(normalized);o.history.push({type:'bike-added',bikeId:normalized.assetId,role});
  if(!o.active.raceBikeId&&role==='race')o.active.raceBikeId=normalized.assetId;
  return o;
}

export function garageBikePressure(ownershipRaw,{floorCapacity=2,supportTier='family'}={}){
  const o=migrateBikeOwnership(ownershipRaw),physical=o.bikes.filter(b=>b.ownershipStatus==='owned'&&b.role!=='for-sale').length;
  const supportAllowance={family:0,privateer:1,satellite:2,development:3,factory:5}[supportTier]??0;
  const practicalCapacity=Math.max(1,Number(floorCapacity)||2)+supportAllowance;
  return {owned:physical,practicalCapacity,overBy:Math.max(0,physical-practicalCapacity),state:physical>practicalCapacity?'over-capacity':physical===practicalCapacity?'full':'ok'};
}

export function ownershipSnapshot(ownershipRaw){
  const o=migrateBikeOwnership(ownershipRaw);
  return {version:o.version,total:o.bikes.length,roles:Object.fromEntries(BIKE_ROLES.map(r=>[r,o.bikes.filter(b=>b.role===r).length])),active:{...o.active},bikeIds:o.bikes.map(b=>b.assetId)};
}
