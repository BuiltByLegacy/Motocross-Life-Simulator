import { createRiderDevelopmentProfile } from './riderDevelopment.js';

const clamp=(v,lo=0,hi=100)=>Math.max(lo,Math.min(hi,Number(v)||0));

export const CLASS_FAMILIES=Object.freeze({
  '50cc':{power:12,size:18,weight:14},'65cc':{power:28,size:34,weight:28},'85cc':{power:44,size:48,weight:42},'Supermini':{power:54,size:56,weight:48},'125':{power:64,size:66,weight:58},'250F':{power:76,size:78,weight:70},'450F':{power:100,size:94,weight:92},
});

export function classSimilarity(a,b){
  if(a===b)return 1;
  const x=CLASS_FAMILIES[a]??CLASS_FAMILIES['250F'],y=CLASS_FAMILIES[b]??CLASS_FAMILIES['250F'];
  const diff=(Math.abs(x.power-y.power)+Math.abs(x.size-y.size)+Math.abs(x.weight-y.weight))/3;
  return Math.max(.18,1-diff/100);
}

export function createAdaptationState(raw={}){
  return {version:1,currentClass:raw.currentClass??null,currentBikeId:raw.currentBikeId??null,byClass:{...(raw.byClass??{})},byBike:{...(raw.byBike??{})},history:Array.isArray(raw.history)?raw.history.map(x=>({...x})):[]};
}

export function transitionAdaptation(raw,{fromClass=null,toClass,bikeId=null,priorBikeId=null,confidence=50}={}){
  const s=createAdaptationState(raw),prior=s.byClass[fromClass]?.adaptation??(fromClass===toClass?100:0),similarity=classSimilarity(fromClass,toClass);
  const carried=Math.round(Math.max(s.byClass[toClass]?.adaptation??0,prior*similarity*.68));
  const jump=Math.max(0,1-similarity),warning=jump>.42?'major-transition':jump>.23?'adaptation-needed':null;
  const confidencePenalty=Math.round(-Math.min(14,jump*18));
  const next={...s,currentClass:toClass,currentBikeId:bikeId??priorBikeId??s.currentBikeId,byClass:{...s.byClass,[toClass]:{adaptation:clamp(carried),reps:0,similarityFromPrior:Math.round(similarity*100)}},byBike:{...s.byBike},history:[...s.history,{type:'transition',fromClass,toClass,bikeId,carried,similarity,warning}]};
  if(next.currentBikeId)next.byBike[next.currentBikeId]={adaptation:Math.max(20,Math.round(carried*.85)),reps:0};
  return {state:next,carried,similarity,warning,confidenceAfter:clamp(confidence+confidencePenalty),confidencePenalty};
}

export function recordAdaptationRep(raw,{klass,bikeId=null,quality=1}={}){
  const s=createAdaptationState(raw),c={...(s.byClass[klass]??{adaptation:0,reps:0})},gain=Math.max(2,Math.round((12-c.adaptation*.07)*Number(quality)));
  c.reps=(c.reps??0)+1;c.adaptation=clamp(c.adaptation+gain);
  const byBike={...s.byBike};if(bikeId){const b={...(byBike[bikeId]??{adaptation:20,reps:0})};b.reps=(b.reps??0)+1;b.adaptation=clamp(b.adaptation+Math.max(2,Math.round(gain*.9)));byBike[bikeId]=b;}
  return {...s,currentClass:klass,currentBikeId:bikeId??s.currentBikeId,byClass:{...s.byClass,[klass]:c},byBike,history:[...s.history,{type:'rep',klass,bikeId,gain,adaptation:c.adaptation}]};
}

export function adaptationEffects(raw,{klass,bikeId=null,profile=null}={}){
  const s=createAdaptationState(raw),a=s.byClass[klass]?.adaptation??0,b=bikeId?(s.byBike[bikeId]?.adaptation??a):a,score=clamp(Math.round(a*.7+b*.3));
  const penalty=(100-score)/100;
  const competencies={starts:-Math.round(penalty*9),braking:-Math.round(penalty*8),jumping:-Math.round(penalty*7),roughTerrain:-Math.round(penalty*6),composure:-Math.round(penalty*8),adaptability:0};
  if(profile){const p=createRiderDevelopmentProfile(profile);competencies.adaptability+=Math.round((p.skills.adaptability-50)*.06);}
  return {score,penalty:Math.round(penalty*100),competencies,readiness:score>=80?'settled':score>=55?'adapting':score>=30?'unsettled':'raw'};
}
