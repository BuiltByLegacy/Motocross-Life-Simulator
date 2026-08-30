// Equipment & Ownership Lifecycle 2.0 — bike usage, wear and rebuild history (#450)

const clamp=(v,lo=0,hi=100)=>Math.max(lo,Math.min(hi,Number(v)||0));

export function createMechanicalState(raw={}){
  return {
    engineHours:Number(raw.engineHours??0),
    suspensionHours:Number(raw.suspensionHours??0),
    raceHours:Number(raw.raceHours??0),
    practiceHours:Number(raw.practiceHours??0),
    condition:clamp(raw.condition??100),
    reliability:clamp(raw.reliability??100),
    serviceDebt:Math.max(0,Number(raw.serviceDebt??0)),
    rebuilds:Array.isArray(raw.rebuilds)?raw.rebuilds.map(x=>({...x})):[],
    maintenance:Array.isArray(raw.maintenance)?raw.maintenance.map(x=>({...x})):[],
  };
}

export function ensureMechanicalState(bike={}){return {...bike,mechanical:createMechanicalState(bike.mechanical??bike)};}

export function usageWearProfile(kind='practice',conditions={}){
  const mud=conditions.mud?1.18:1,heat=conditions.heat?1.08:1,deep=conditions.deepSand?1.12:1;
  const base={practice:{engine:1,suspension:1,condition:1.05,reliability:.35},race:{engine:1.15,suspension:1.18,condition:1.35,reliability:.5},training:{engine:1.05,suspension:1.08,condition:1.15,reliability:.4}}[kind]??{engine:1,suspension:1,condition:1,reliability:.35};
  const factor=mud*heat*deep;
  return Object.fromEntries(Object.entries(base).map(([k,v])=>[k,v*factor]));
}

export function recordBikeUsage(bikeRaw,{hours=1,kind='practice',conditions={},date=null,eventId=null}={}){
  const bike=ensureMechanicalState(bikeRaw),m=bike.mechanical,h=Math.max(0,Number(hours)||0),wear=usageWearProfile(kind,conditions);
  m.engineHours+=h*wear.engine;m.suspensionHours+=h*wear.suspension;
  if(kind==='race')m.raceHours+=h;else m.practiceHours+=h;
  const serviceFactor=1+Math.min(1.5,m.serviceDebt/20);
  m.condition=clamp(m.condition-h*wear.condition*serviceFactor);
  m.reliability=clamp(m.reliability-h*wear.reliability*serviceFactor);
  m.maintenance.push({type:'usage',kind,hours:h,date,eventId,conditions:{...conditions}});
  return bike;
}

export function serviceThresholds(bikeRaw){
  const m=ensureMechanicalState(bikeRaw).mechanical;
  const engineDue=Math.max(0,20-(m.engineHours%20)),suspensionDue=Math.max(0,30-(m.suspensionHours%30));
  const risk=clamp((100-m.reliability)*.55+(100-m.condition)*.3+m.serviceDebt*1.8);
  return {engineHours:m.engineHours,suspensionHours:m.suspensionHours,engineServiceIn:Math.round(engineDue*10)/10,suspensionServiceIn:Math.round(suspensionDue*10)/10,risk:risk<20?'low':risk<45?'moderate':risk<70?'high':'critical',riskScore:Math.round(risk)};
}

export function deferService(bikeRaw,{severity=1,date=null,reason='budget'}={}){
  const bike=ensureMechanicalState(bikeRaw),m=bike.mechanical;
  m.serviceDebt+=Math.max(.5,Number(severity)||1)*2;
  m.reliability=clamp(m.reliability-Math.max(.25,Number(severity)||1));
  m.maintenance.push({type:'service-deferred',severity:Number(severity)||1,date,reason});
  return bike;
}

export function performService(bikeRaw,{kind='routine',cost=0,date=null,parts=[]}={}){
  const bike=ensureMechanicalState(bikeRaw),m=bike.mechanical;
  const restore=kind==='suspension'?10:kind==='top-end'?20:kind==='full-rebuild'?38:6;
  m.condition=clamp(m.condition+restore);
  m.reliability=clamp(m.reliability+restore*.8);
  m.serviceDebt=Math.max(0,m.serviceDebt-(kind==='full-rebuild'?20:kind==='top-end'?10:5));
  const record={type:'service',kind,cost:Number(cost)||0,date,parts:[...parts],engineHours:m.engineHours,suspensionHours:m.suspensionHours};
  m.maintenance.push(record);
  if(['top-end','full-rebuild'].includes(kind))m.rebuilds.push({...record});
  return bike;
}

export function splitPracticeAndRaceUsage({raceBike,practiceBike=null},usage){
  if(practiceBike)return {raceBike:ensureMechanicalState(raceBike),practiceBike:recordBikeUsage(practiceBike,{...usage,kind:'practice'}),usedRaceBikeForPractice:false};
  return {raceBike:recordBikeUsage(raceBike,{...usage,kind:'practice'}),practiceBike:null,usedRaceBikeForPractice:true};
}

export function maintenanceHistory(bikeRaw){return ensureMechanicalState(bikeRaw).mechanical.maintenance.map(x=>({...x}));}
