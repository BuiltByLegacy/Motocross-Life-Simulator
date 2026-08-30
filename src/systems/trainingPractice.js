import { TRAINING_CATALOG, restoreLifeBetweenRacesState, evaluateTrainingOption, activePeriod } from './lifeBetweenRaces.js';
import { trainingTargets } from './riderTrainingDevelopment.js';

const RIDING_IDS=new Set(['starts','technique','motos','coaching','light_ride']);
export const TRAINING_PRACTICE_VERSION=2;

export function trainingUsage(state,trainingId,{seasonNumber=null,recentLookback=4}={}){
  const history=restoreLifeBetweenRacesState(state).trainingHistory.filter(h=>h.trainingId===trainingId);
  const recent=history.slice(-recentLookback).length;
  const season=seasonNumber==null?history.length:history.filter(h=>Number(h.seasonNumber??String(h.periodKey??'').match(/^s(\d+)/)?.[1])===Number(seasonNumber)).length;
  const last=history.at(-1)??null;
  return {trainingId,recent,season,career:history.length,lastUsed:last?.week??null,last,band:recent>=4?'over-repeated':recent===3?'saturated':recent>=1?'useful-repetition':'fresh'};
}
function bikeQuote(trainingId,ctx={}){
  if(!RIDING_IDS.has(trainingId))return{required:false,bike:null,conditionWear:0,parts:{}};
  const bike=ctx.practiceBike??ctx.bike??null;
  const wear=trainingId==='motos'?{conditionWear:7,parts:{tires:5,chain:3,brakes:2}}:trainingId==='light_ride'?{conditionWear:2,parts:{tires:1,chain:1}}:{conditionWear:4,parts:{tires:3,chain:2,brakes:1}};
  return{required:true,bike:bike?{id:bike.id??null,name:bike.name??bike.model??'Current bike',condition:Number(bike.condition??100)}:null,...wear};
}
export function quoteTrainingSession(state,trainingId,ctxInput={}){
  const def=TRAINING_CATALOG[trainingId];if(!def)return{trainingId,allowed:false,reason:'unknown-training'};
  const check=evaluateTrainingOption(state,trainingId,ctxInput),usage=trainingUsage(state,trainingId,{seasonNumber:Number(ctxInput.seasonNumber??1)}),period=activePeriod(state);
  const timeLeft=Math.max(0,Number(period?.timeBudget??ctxInput.availableSlots??0)-Number(period?.timeUsed??0)),reasons=[];
  if(!check.allowed)reasons.push(check.reason);if(ctxInput.weatherBlocked&&RIDING_IDS.has(trainingId))reasons.push('weather-or-track-unavailable');if(ctxInput.facilityAvailable===false&&['motos','coaching'].includes(trainingId))reasons.push('facility-unavailable');
  return{version:TRAINING_PRACTICE_VERSION,trainingId,label:def.label,description:def.description,allowed:reasons.length===0,reasons,reason:reasons[0]??null,cost:{retail:Number(def.cost??0),support:0,outOfPocket:Number(def.cost??0)},time:{slots:Number(def.time??0),remainingBefore:timeLeft,remainingAfter:Math.max(0,timeLeft-Number(def.time??0))},load:Number(def.load??0),fatigue:Number(def.fatigue??0),confidence:Number(def.confidence??0),risk:check.risk??null,diminishingFactor:check.diminishingFactor??Math.max(.45,1-usage.recent*.16),usage,targets:Object.keys(trainingTargets(trainingId)),bike:bikeQuote(trainingId,ctxInput),quality:{coaching:Number(ctxInput.coachingQuality??(trainingId==='coaching'?75:50)),facility:Number(ctxInput.facilityQuality??50)},restrictions:reasons};
}
export function buildTrainingCatalog(state,ctxInput={}){return Object.keys(TRAINING_CATALOG).map(id=>quoteTrainingSession(state,id,ctxInput));}
export function createTrainingReceipt({quote,decision,applied={},before={},after={}}={}){
  if(!quote||!decision)return null;
  return{id:`receipt:${decision.id}`,status:'completed',trainingId:decision.trainingId,label:quote.label,seasonNumber:Number(before.seasonNumber??1),week:Number(before.week??0),periodKey:String(decision.id??'').split(':d')[0],quoted:{cost:quote.cost,time:quote.time,load:quote.load,fatigue:quote.fatigue,diminishingFactor:quote.diminishingFactor},actual:{cost:Number(before.money??0)-Number(after.money??0),time:Number(decision.time??0),load:Number(decision.load??0),fatigueDelta:Number(decision.fatigueDelta??0),confidenceDelta:Number(decision.confidenceDelta??0),gains:{...(applied.development?.gains??decision.gains??{})},bikeWear:applied.bikeWear??null},usageAfter:after.usage??null,risk:decision.risk??quote.risk??null,takeaway:['saturated','over-repeated'].includes(quote.usage?.band)?'This work is getting repetitive. A different session may produce better development.':`Completed ${quote.label}. Review the gains and recovery cost before scheduling the next session.`,dismissed:false};
}
export function latestTrainingReceipt(state){return restoreLifeBetweenRacesState(state).latestTrainingReceipt??null;}
export function dismissTrainingReceipt(state){const next=restoreLifeBetweenRacesState(state);if(next.latestTrainingReceipt)next.latestTrainingReceipt={...next.latestTrainingReceipt,dismissed:true};return next;}
