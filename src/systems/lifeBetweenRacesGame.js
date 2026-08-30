import { restoreLifeBetweenRacesState, openBetweenRacesPeriod, buildOffWeekDecisionSet, resolveTrainingDecision, resolveRecoveryDecision } from './lifeBetweenRaces.js';
import { buildTrainingCatalog, quoteTrainingSession, trainingUsage, createTrainingReceipt } from './trainingPractice.js';

export function lifeBetweenRacesContextFromGame(game) {
  const nextRace=(game.state.calendar??[]).find(c=>c.week>game.week&&c.race);
  return {week:game.week,seasonNumber:game.state.seasonNumber,isRaceWeek:game.isRaceWeek(),nextRaceWeek:nextRace?.week??null,availableSlots:game.weekSlots().length,rider:game.rider,family:game.family,bike:game.trainBike?.()??game.bike,schoolMode:game.state.schoolMode};
}
export function ensureLifeBetweenRaces(game){game.state.lifeBetweenRaces=restoreLifeBetweenRacesState(game.state.lifeBetweenRaces);return game.state.lifeBetweenRaces;}
export function openLifeBetweenRaces(game){const opened=openBetweenRacesPeriod(ensureLifeBetweenRaces(game),lifeBetweenRacesContextFromGame(game));game.state.lifeBetweenRaces=opened.state;return opened;}
export function availableLifeBetweenRacesChoices(game){openLifeBetweenRaces(game);return buildOffWeekDecisionSet(game.state.lifeBetweenRaces,lifeBetweenRacesContextFromGame(game));}
export function availableTrainingSessions(game){openLifeBetweenRaces(game);return buildTrainingCatalog(game.state.lifeBetweenRaces,lifeBetweenRacesContextFromGame(game));}
export function trainingSessionQuote(game,id){openLifeBetweenRaces(game);return quoteTrainingSession(game.state.lifeBetweenRaces,id,lifeBetweenRacesContextFromGame(game));}

function applyTraining(game,decision){
  if(decision.cost>0&&!game.spend(decision.cost))return{error:'not-enough-money'};
  for(const [skill,gain]of Object.entries(decision.gains??{}))if(gain)game.skill(skill,gain);
  game.fatigue(decision.fatigueDelta??0);game.confidence(decision.confidenceDelta??0);
  let bikeWear=null;
  if(['motos','coaching','technique','light_ride'].includes(decision.trainingId)){
    const bike=game.trainBike(),wear=decision.trainingId==='motos'?{condition:-7,parts:{tires:-5,chain:-3,brakes:-2}}:decision.trainingId==='light_ride'?{condition:-2,parts:{tires:-1,chain:-1}}:{condition:-4,parts:{tires:-3,chain:-2,brakes:-1}};
    game.wearBike(bike,wear);bikeWear={bikeId:bike?.id??null,...wear};
  }
  game.log(`🏋️ ${decision.trainingId.replaceAll('_',' ')}: load ${decision.load}, risk ${decision.risk.band}.`);return{ok:true,bikeWear};
}
function applyRecovery(game,decision){if(decision.cost>0&&!game.spend(decision.cost))return{error:'not-enough-money'};game.fatigue(decision.fatigueDelta??0);game.stress(decision.stressDelta??0);game.confidence(decision.confidenceDelta??0);if(decision.injuryRecovery>0&&game.rider.injury?.weeksOut>0){game.rider.injury.weeksOut=Math.max(0,game.rider.injury.weeksOut-decision.injuryRecovery);if(game.rider.injury.weeksOut===0)game.rider.injury=null;}game.log(`🧊 ${decision.recoveryId.replaceAll('_',' ')}: recovery quality ${decision.recoveryQuality}.`);return{ok:true};}

export function takeLifeBetweenRacesDecision(game,family,id){
  openLifeBetweenRaces(game);const ctx=lifeBetweenRacesContextFromGame(game),seed=game.state.seed??game.rng?.seed??1;
  const quote=family==='training'?quoteTrainingSession(game.state.lifeBetweenRaces,id,ctx):null;
  if(quote&&!quote.allowed)return{state:game.state.lifeBetweenRaces,decision:null,error:quote.reason,quote};
  const before=family==='training'?{money:Number(game.family.money??0),week:game.week,seasonNumber:game.state.seasonNumber}:null;
  const resolved=family==='training'?resolveTrainingDecision(game.state.lifeBetweenRaces,id,ctx,{seed}):family==='recovery'?resolveRecoveryDecision(game.state.lifeBetweenRaces,id,ctx):{state:game.state.lifeBetweenRaces,decision:null,error:'unknown-family'};
  if(resolved.error||!resolved.decision)return{...resolved,quote};
  const applied=family==='training'?applyTraining(game,resolved.decision):applyRecovery(game,resolved.decision);if(applied.error)return{...resolved,error:applied.error,quote};
  game.state.lifeBetweenRaces=resolved.state;
  if(family==='training'){
    const usage=trainingUsage(game.state.lifeBetweenRaces,id,{seasonNumber:game.state.seasonNumber});
    const receipt=createTrainingReceipt({quote,decision:resolved.decision,applied,before,after:{money:Number(game.family.money??0),usage}});
    game.state.lifeBetweenRaces.latestTrainingReceipt=receipt;const row=game.state.lifeBetweenRaces.trainingHistory.at(-1);if(row){row.seasonNumber=game.state.seasonNumber;row.cost=receipt.actual.cost;row.time=receipt.actual.time;row.receiptId=receipt.id;row.diminishingFactor=resolved.decision.diminishingFactor;}
    return{...resolved,applied,quote,receipt};
  }
  return{...resolved,applied};
}
