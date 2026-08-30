// Equipment Lifecycle 2.0 — gear, safety equipment & consumables (#455)

export const EQUIPMENT_CATEGORIES=Object.freeze({
  helmet:{kind:'safety',maxUses:70,wearPerUse:1.35,replaceAt:68,outgrowable:true},
  boots:{kind:'safety',maxUses:120,wearPerUse:.75,replaceAt:62,outgrowable:true},
  protection:{kind:'safety',maxUses:150,wearPerUse:.45,replaceAt:60,outgrowable:true},
  jersey:{kind:'apparel',maxUses:140,wearPerUse:.35,replaceAt:38,outgrowable:true},
  pants:{kind:'apparel',maxUses:120,wearPerUse:.45,replaceAt:42,outgrowable:true},
  gloves:{kind:'apparel',maxUses:55,wearPerUse:1.05,replaceAt:38,outgrowable:true},
  goggles:{kind:'vision',maxUses:90,wearPerUse:.55,replaceAt:48,outgrowable:false},
  lens:{kind:'consumable',maxUses:18,wearPerUse:3.8,replaceAt:30,outgrowable:false},
  tire:{kind:'consumable',maxUses:12,wearPerUse:7.5,replaceAt:28,outgrowable:false},
  tube:{kind:'consumable',maxUses:24,wearPerUse:2.4,replaceAt:25,outgrowable:false},
  mousse:{kind:'consumable',maxUses:35,wearPerUse:1.8,replaceAt:28,outgrowable:false},
  chain:{kind:'consumable',maxUses:45,wearPerUse:1.25,replaceAt:32,outgrowable:false},
  sprocket:{kind:'consumable',maxUses:55,wearPerUse:1.05,replaceAt:32,outgrowable:false},
  brakePads:{kind:'consumable',maxUses:28,wearPerUse:2.3,replaceAt:30,outgrowable:false},
  filter:{kind:'consumable',maxUses:5,wearPerUse:16,replaceAt:30,outgrowable:false},
  fluids:{kind:'consumable',maxUses:8,wearPerUse:11,replaceAt:22,outgrowable:false},
  plastics:{kind:'cosmetic',maxUses:180,wearPerUse:.25,replaceAt:20,outgrowable:false},
  controls:{kind:'component',maxUses:100,wearPerUse:.45,replaceAt:35,outgrowable:false},
});
const clamp=(v,lo=0,hi=100)=>Math.max(lo,Math.min(hi,Number(v)||0));

export function normalizeEquipmentItem(raw={}){
 const category=raw.category??'jersey',rule=EQUIPMENT_CATEGORIES[category]??EQUIPMENT_CATEGORIES.jersey;
 return {...raw,id:String(raw.id??`${category}-${raw.name??'item'}`),category,condition:clamp(raw.condition??100),uses:Math.max(0,Number(raw.uses??0)),quantity:Math.max(0,Number(raw.quantity??1)),source:raw.source??'family-paid',ownershipStatus:raw.ownershipStatus??'owned',fitStatus:raw.fitStatus??'fits',history:Array.isArray(raw.history)?raw.history.map(x=>({...x})):[],rule};
}

export function recordEquipmentUse(itemRaw,{sessions=1,kind='practice',conditions={}}={}){
 const item=normalizeEquipmentItem(itemRaw),rule=item.rule,count=Math.max(0,Number(sessions)||0);
 const factor=(kind==='race'?1.2:1)*(conditions.mud?1.2:1)*(conditions.sand?1.1:1)*(conditions.rain?1.08:1);
 item.uses+=count;item.condition=clamp(item.condition-rule.wearPerUse*count*factor);
 if(rule.kind==='consumable'&&['filter','fluids'].includes(item.category))item.quantity=Math.max(0,item.quantity-count);
 item.history.push({type:'use',kind,sessions:count,conditions:{...conditions}});return item;
}

export function equipmentAttention(itemRaw,{riderAge=null,growthChanged=false}={}){
 const item=normalizeEquipmentItem(itemRaw),rule=item.rule;
 const outgrown=Boolean(rule.outgrowable&&(item.fitStatus==='outgrown'||growthChanged&&item.fitStatus==='tight'));
 const depleted=rule.kind==='consumable'&&item.quantity<=0;
 const replace=item.condition<=rule.replaceAt||outgrown||depleted;
 const urgent=replace&&(rule.kind==='safety'||item.category==='tire'||item.category==='brakePads'||depleted);
 return {itemId:item.id,replace,urgent,outgrown,depleted,condition:item.condition,category:item.category,reason:outgrown?'outgrown':depleted?'depleted':item.condition<=rule.replaceAt?(rule.kind==='safety'?'safety-wear':'worn'):'ok',readinessPenalty:urgent?12:replace?4:0,riderAge};
}

export function equipmentReadiness(items=[]){
 const attention=items.map(i=>equipmentAttention(i)),urgent=attention.filter(a=>a.urgent),needs=attention.filter(a=>a.replace);
 return {ready:urgent.length===0,urgent,needs,penalty:Math.min(35,attention.reduce((s,a)=>s+a.readinessPenalty,0))};
}

export function replacementCost(itemRaw,{retailPrice=null,discountPct=0,allotmentRemaining=0}={}){
 const item=normalizeEquipmentItem(itemRaw),base=Math.max(0,Number(retailPrice??item.retailPrice??50));
 if(allotmentRemaining>0)return {gross:base,support:base,outOfPocket:0,source:'product-allotment'};
 const support=Math.round(base*Math.max(0,Math.min(100,Number(discountPct)||0))/100);
 return {gross:base,support,outOfPocket:Math.max(0,base-support),source:support?'discount':'family-paid'};
}

export function youthGearDisposition(itemRaw,{marketValue=0,siblingCanUse=false}={}){
 const item=normalizeEquipmentItem(itemRaw),a=equipmentAttention(item,{growthChanged:true});
 if(!a.outgrown)return {needed:false,options:[]};
 return {needed:true,options:[siblingCanUse?{id:'hand-me-down',value:0}:{id:'store',value:0},{id:'sell',value:Math.max(0,Number(marketValue)||0)},{id:'replace',value:-(Number(item.retailPrice)||0)}]};
}
