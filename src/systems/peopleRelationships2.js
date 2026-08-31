export const PEOPLE_RELATIONSHIP_VERSION=2;
const clamp=(v,lo=0,hi=100)=>Math.max(lo,Math.min(hi,Number(v)||0));
const DIMS=['trust','closeness','respect','reliability','conflict','expectations','availability'];

function infer(record,key,fallback=50){
  const v=record?.values??{};
  const map={trust:['trust','belief','agreement'],closeness:['friendship','love','support','communication'],respect:['respect','pride','reputation'],reliability:['loyalty','trust','support'],conflict:['strain','frustration','rivalry','jealousy','fear'],expectations:['pressure','pride','belief'],availability:['support','loyalty','communication']};
  const values=(map[key]??[key]).filter(k=>Number.isFinite(v[k])).map(k=>Number(v[k]));
  return values.length?clamp(values.reduce((a,b)=>a+b,0)/values.length):fallback;
}

export function ensureRelationshipLifecycle(recordRaw={}){
  const record={...recordRaw,values:{...(recordRaw.values??{})},sharedMemories:[...(recordRaw.sharedMemories??[])]};
  const old=recordRaw.lifecycle??{}; const dimensions={};
  for(const k of DIMS)dimensions[k]=clamp(old.dimensions?.[k]??infer(record,k,k==='conflict'?20:50));
  record.lifecycle={version:PEOPLE_RELATIONSHIP_VERSION,role:old.role??record.role??'Person',roleHistory:[...(old.roleHistory??[])],dimensions,history:[...(old.history??[])],supportIds:[...(old.supportIds??[])],sacrifice:{money:Number(old.sacrifice?.money??0),time:Number(old.sacrifice?.time??0),labor:Number(old.sacrifice?.labor??0)},lastMeaningfulAt:old.lastMeaningfulAt??null};
  return record;
}

export function ensurePeople2State(raw={},relationships={}){
  const normalized={};for(const [id,rec] of Object.entries(relationships??{}))normalized[id]=ensureRelationshipLifecycle({...rec,id:rec.id??id});
  return {version:2,supportHistory:[...(raw.supportHistory??[])],relationships:normalized};
}

export function applyRelationshipChange(recordRaw,changes={},meta={}){
  const record=ensureRelationshipLifecycle(recordRaw);const before={...record.lifecycle.dimensions};
  for(const [k,d] of Object.entries(changes))if(DIMS.includes(k))record.lifecycle.dimensions[k]=clamp(record.lifecycle.dimensions[k]+Number(d||0));
  const changed=Object.fromEntries(DIMS.filter(k=>record.lifecycle.dimensions[k]!==before[k]).map(k=>[k,record.lifecycle.dimensions[k]-before[k]]));
  if(Object.keys(changed).length){record.lifecycle.history.push({id:meta.id??`rel:${record.id}:${meta.seasonNumber??1}:${meta.week??0}:${record.lifecycle.history.length}`,seasonNumber:Number(meta.seasonNumber??1),week:Number(meta.week??0),reason:meta.reason??'relationship-event',changes:changed,source:meta.source??null});record.lifecycle.lastMeaningfulAt={seasonNumber:Number(meta.seasonNumber??1),week:Number(meta.week??0)};}
  return record;
}

export function changeRelationshipRole(recordRaw,newRole,meta={}){
  const record=ensureRelationshipLifecycle(recordRaw);if(!newRole||newRole===record.lifecycle.role)return record;
  record.lifecycle.roleHistory.push({from:record.lifecycle.role,to:newRole,seasonNumber:Number(meta.seasonNumber??1),week:Number(meta.week??0),reason:meta.reason??'role-evolution'});record.lifecycle.role=newRole;record.role=newRole;return record;
}

export function recordSupportEvent(peopleStateRaw,relationshipsRaw,event={}){
  const state=ensurePeople2State(peopleStateRaw,relationshipsRaw);const actorId=String(event.actorId??'unknown');const sourceId=String(event.sourceId??`${event.kind??'help'}:${actorId}:${event.seasonNumber??1}:${event.week??0}`);const existing=state.supportHistory.find(x=>x.sourceId===sourceId);if(existing)return{state,relationships:state.relationships,event:existing,duplicate:true};
  const row={id:`support:${sourceId}`,sourceId,actorId,recipientId:String(event.recipientId??'rider'),kind:event.kind??'general-support',seasonNumber:Number(event.seasonNumber??1),week:Number(event.week??0),money:Math.max(0,Number(event.money??0)),time:Math.max(0,Number(event.time??0)),labor:Math.max(0,Number(event.labor??0)),nonCashValue:Math.max(0,Number(event.nonCashValue??0)),context:event.context??null,economyEntryId:event.economyEntryId??null};
  state.supportHistory.push(row);
  if(state.relationships[actorId]){let rec=state.relationships[actorId];rec.lifecycle.supportIds.push(row.id);rec.lifecycle.sacrifice.money+=row.money;rec.lifecycle.sacrifice.time+=row.time;rec.lifecycle.sacrifice.labor+=row.labor;const magnitude=Math.min(5,Math.max(1,Math.round((row.money/250)+(row.time/4)+(row.labor/4)+(row.nonCashValue/300))));rec=applyRelationshipChange(rec,{trust:magnitude*.4,closeness:magnitude*.5,reliability:magnitude*.5,availability:-Math.max(0,magnitude-3)*.2},{id:`rel-support:${sourceId}`,seasonNumber:row.seasonNumber,week:row.week,reason:`support:${row.kind}`,source:sourceId});state.relationships[actorId]=rec;}
  return{state,relationships:state.relationships,event:row,duplicate:false};
}

export function supportSummary(peopleStateRaw,relationshipsRaw,{seasonNumber=null}={}){
  const s=ensurePeople2State(peopleStateRaw,relationshipsRaw);const rows=seasonNumber==null?s.supportHistory:s.supportHistory.filter(x=>x.seasonNumber===Number(seasonNumber));const byPerson={};
  for(const r of rows){const b=byPerson[r.actorId]??(byPerson[r.actorId]={events:0,money:0,time:0,labor:0,nonCashValue:0});b.events++;b.money+=r.money;b.time+=r.time;b.labor+=r.labor;b.nonCashValue+=r.nonCashValue;}
  return{events:rows.length,money:rows.reduce((a,b)=>a+b.money,0),time:rows.reduce((a,b)=>a+b.time,0),labor:rows.reduce((a,b)=>a+b.labor,0),nonCashValue:rows.reduce((a,b)=>a+b.nonCashValue,0),byPerson};
}
