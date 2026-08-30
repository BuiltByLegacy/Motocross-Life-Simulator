import { createEquipmentCareerState } from './equipmentCareer.js';
import { equipmentValuation } from './equipmentValuation.js';
import { serviceThresholds } from './equipmentWear.js';
import { equipmentReadiness } from './equipmentConsumables.js';

const ROLE_LABELS={race:'Race Bike',practice:'Practice Bike',spare:'Spare Bike',project:'Project',retired:'Retired',display:'Display Bike','for-sale':'For Sale'};

export function bikePresentation(bike,context={}){
 const value=equipmentValuation(bike,context),service=serviceThresholds(bike),m=bike.mechanical??bike;
 const attention=service.risk==='critical'?'service-now':service.risk==='high'?'service-soon':bike.role==='for-sale'?'listed':null;
 return {assetId:bike.assetId,role:bike.role,roleLabel:ROLE_LABELS[bike.role]??bike.role,name:bike.name??[bike.year,bike.make??bike.brand,bike.model].filter(Boolean).join(' ')||'Motocross Bike',condition:Math.round(Number(m.condition??bike.condition??100)),reliability:Math.round(Number(m.reliability??100)),engineHours:Math.round(Number(m.engineHours??0)*10)/10,rebuildCount:(m.rebuilds??[]).length,value:value.marketEstimate,tradeIn:value.tradeIn,ownershipSource:bike.ownershipSource??bike.ownershipStatus??'owned',memories:Number(bike.provenance?.memories?.length??bike.memoryCount??0),attention};
}
export function equipmentGarageScene(stateRaw,context={}){
 const s=createEquipmentCareerState(stateRaw),bikes=s.ownership.bikes.map(b=>bikePresentation(b,context));const gear=equipmentReadiness(s.gear);
 const priority=bikes.find(b=>b.attention==='service-now')??bikes.find(b=>b.role==='race')??bikes[0]??null;
 return {cash:s.cash,season:s.season,bikes,gearAttention:gear.needs.slice(0,3),priority,listed:s.market.listings.filter(l=>l.status==='listed').length,soldHistory:s.market.circulation.length,headline:priority?`${priority.roleLabel}: ${priority.name}`:'No bike in the garage',subhead:priority?.attention==='service-now'?'Needs mechanical attention before the next important ride.':gear.urgent.length?'Gear needs attention before racing.':'Equipment is ready for the next decision.'};
}
export function marketplacePresentation(stateRaw){const s=createEquipmentCareerState(stateRaw);return {activeListings:s.market.listings.filter(l=>l.status==='listed').map(l=>({listingId:l.listingId,assetId:l.assetId,askingPrice:l.askingPrice,offers:l.offers?.length??0})),sold:s.market.circulation.map(c=>({assetId:c.assetId,lastPrice:c.lastPrice,lastOwner:c.lastOwner})),cash:s.cash};}
export function seasonalEquipmentDecisionCard(decision){if(!decision)return null;const top=decision.recommendation??decision.options?.[0];return {bikeId:decision.bikeId,title:'Next season equipment',decision:top?.id??'keep-race',reason:top?.reason??'',cost:top?.cost??0,affordable:top?.affordable!==false,alternatives:(decision.options??[]).slice(1,4).map(x=>({id:x.id,cost:x.cost,affordable:x.affordable}))};}
