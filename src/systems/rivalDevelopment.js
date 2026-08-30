import { createRiderDevelopmentProfile, seasonalDevelopment } from './riderDevelopment.js';
import { createAdaptationState, transitionAdaptation, recordAdaptationRep } from './riderAdaptation.js';
import { createMentalState, applyMentalEvent } from './mentalPerformance.js';

function hashUnit(text){let h=2166136261;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return(h>>>0)/4294967295;}

export function createRivalDevelopment(raw={}){
  return{version:1,id:raw.id??`rival-${Math.round(hashUnit(JSON.stringify(raw))*1e9)}`,name:raw.name??'Rival',age:Number(raw.age??12),klass:raw.klass??'85cc',profile:createRiderDevelopmentProfile(raw.profile??{skills:raw.skills??{},age:raw.age??12,traits:raw.traits??{}}),adaptation:createAdaptationState(raw.adaptation??{currentClass:raw.klass??'85cc'}),mental:createMentalState(raw.mental??{confidence:raw.confidence??50}),specialties:Array.isArray(raw.specialties)?[...raw.specialties]:[],history:Array.isArray(raw.history)?raw.history.map(x=>({...x})):[]};
}

export function developRivalSeason(raw,{seed=1,season=1,trainingQuality=1,injuryWeeks=0,stress=20,resultEvent='solid'}={}){
  const r=createRivalDevelopment(raw);r.profile.age=r.age;
  const growth=seasonalDevelopment(r.profile,{seed:`${seed}:${r.id}`,season,trainingQuality,injuryWeeks,stress});r.profile=growth.profile;
  const mental=applyMentalEvent(r.mental,resultEvent,{source:`season-${season}`});r.mental=mental.state;
  const ranked=Object.entries(r.profile.skills).sort((a,b)=>b[1]-a[1]);r.specialties=ranked.slice(0,2).map(([k])=>k);
  r.history.push({type:'season-development',season,gains:growth.gains,breakthrough:growth.breakthrough,specialties:[...r.specialties]});
  return r;
}

export function rivalClassMove(raw,toClass,{seed=1,bikeId=null}={}){
  const r=createRivalDevelopment(raw),t=transitionAdaptation(r.adaptation,{fromClass:r.klass,toClass,bikeId,confidence:r.mental.confidence});r.klass=toClass;r.adaptation=t.state;r.mental=createMentalState({...r.mental,confidence:t.confidenceAfter});r.history.push({type:'class-move',toClass,warning:t.warning,carried:t.carried,seed});return r;
}

export function rivalPracticeRep(raw,{quality=1,bikeId=null}={}){const r=createRivalDevelopment(raw);r.adaptation=recordAdaptationRep(r.adaptation,{klass:r.klass,bikeId,quality});r.history.push({type:'adaptation-rep',klass:r.klass});return r;}

export function simulateRivalCareer(raw,{seed=1,seasons=1}={}){
  let r=createRivalDevelopment(raw);for(let s=1;s<=seasons;s+=1){const roll=hashUnit(`${seed}:${r.id}:${s}`),event=roll>.78?'podium':roll<.16?'poor':'solid',quality=.82+hashUnit(`${seed}:${r.id}:training:${s}`)*.34;r=developRivalSeason(r,{seed,season:s,trainingQuality:quality,resultEvent:event});if(s%2===0&&r.age<19&&hashUnit(`${seed}:${r.id}:move:${s}`)>.7){const order=['50cc','65cc','85cc','Supermini','125','250F','450F'];const i=order.indexOf(r.klass);if(i>=0&&i<order.length-1)r=rivalClassMove(r,order[i+1],{seed});}r.age+=1;r.profile.age=r.age;}
  return r;
}

export function serializeRivalDevelopment(raw){return JSON.parse(JSON.stringify(createRivalDevelopment(raw)));}
export function restoreRivalDevelopment(raw){return createRivalDevelopment(raw);}
