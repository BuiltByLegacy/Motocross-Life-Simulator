import { createRiderDevelopmentProfile, developmentGain, applyDevelopment } from './riderDevelopment.js';

export const TRAINING_SKILL_MAP=Object.freeze({
  starts:{starts:1,composure:.35,racecraft:.25},
  motos:{fitness:.75,consistency:.6,racecraft:.55,lineChoice:.45,roughTerrain:.4,cornering:.35},
  technique:{cornering:.6,ruts:.55,braking:.5,jumping:.35,lineChoice:.5,adaptability:.25},
  conditioning:{fitness:1,consistency:.25,composure:.2},
  coaching:{lineChoice:.7,racecraft:.7,adaptability:.65,composure:.4,cornering:.3,starts:.25},
  light_ride:{adaptability:.25,consistency:.2,fitness:.15,cornering:.15},
});

export function trainingTargets(trainingId){return {...(TRAINING_SKILL_MAP[trainingId]??{})};}

export function repetitionCount(profileRaw,trainingId,{lookback=5}={}){const p=createRiderDevelopmentProfile(profileRaw);return p.history.slice(-lookback).filter(h=>h.trainingId===trainingId).length;}

export function resolveTrainingDevelopment(profileRaw,trainingId,{seed=1,season=null,week=null,coachingQuality=50,facilityQuality=50,fatigue=0,injury=null,stress=0,motivation=50}={}){
  const profile=createRiderDevelopmentProfile(profileRaw),targets=trainingTargets(trainingId);
  if(!Object.keys(targets).length)return{profile,error:'unknown-training',gains:{}};
  const repetition=repetitionCount(profile,trainingId),quality=.72+(Number(coachingQuality)+Number(facilityQuality))/500;
  const injuryDrag=injury?.weeksOut>0?Math.max(.25,1-Number(injury.severity??1)*.22):1;
  const gains={};
  for(const [skill,weight] of Object.entries(targets)){
    gains[skill]=Math.round(developmentGain(profile,skill,{base:2.15*Number(weight)*quality*injuryDrag,seed,contextKey:`training:${trainingId}:${season}:${week}`,fatigue,stress,motivation,repetition})*100)/100;
  }
  const next=applyDevelopment(profile,gains,{type:'training',source:'life-between-races',season,week});
  next.history[next.history.length-1].trainingId=trainingId;
  next.history[next.history.length-1].coachingQuality=Number(coachingQuality);
  next.history[next.history.length-1].facilityQuality=Number(facilityQuality);
  next.history[next.history.length-1].repetition=repetition;
  return{profile:next,error:null,gains,repetition,quality};
}

export function summarizeTrainingHistory(profileRaw,{limit=8}={}){
  const p=createRiderDevelopmentProfile(profileRaw),items=p.history.filter(h=>h.type==='training').slice(-limit);
  const totals={};
  for(const item of items)for(const [skill,gain]of Object.entries(item.gains??{}))totals[skill]=Math.round(((totals[skill]??0)+Number(gain))*100)/100;
  return{sessions:items.length,items,totals,mostPracticed:Object.entries(items.reduce((m,h)=>(m[h.trainingId]=(m[h.trainingId]??0)+1,m),{})).sort((a,b)=>b[1]-a[1])[0]?.[0]??null};
}
