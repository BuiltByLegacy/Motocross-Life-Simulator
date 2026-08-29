import { openLifeBetweenRaces, availableLifeBetweenRacesChoices, takeLifeBetweenRacesDecision } from './lifeBetweenRacesGame.js';
import { resolveMaintenanceAction, resolveResponsibilityAction, resolvePrepAction, travelPrepStatus } from './lifeBetweenRacesResponsibilities.js';
import { createLifeEventState, generateLifeEvent, resolveLifeEvent } from './lifeBetweenRacesEvents.js';

function period(game){ return openLifeBetweenRaces(game).period; }
function timeLeft(game){ const p=period(game); return p ? Math.max(0, Number(p.timeBudget??0)-Number(p.timeUsed??0)) : 0; }
function spend(game, amount){ return Number(amount)<=0 || game.spend(Number(amount)); }
function useTime(game, amount, family, id){ const p=period(game); if(!p)return; p.timeUsed=Math.min(p.timeBudget, Number(p.timeUsed??0)+Math.max(0,Number(amount??0))); p.choices.push({family,id}); }
function history(game, item){ game.state.lifeBetweenRaces.expandedHistory ??= []; game.state.lifeBetweenRaces.expandedHistory.push(item); }

export function expandedLifeBetweenRacesChoices(game){
  const base=availableLifeBetweenRacesChoices(game);
  const p=period(game); if(!p)return [];
  const left=timeLeft(game), bike=game.trainBike?.()??game.bike??{}, money=game.family?.money??0;
  const extra=[];
  if(left>0) extra.push({family:'maintenance',id:Number(bike.condition??100)<60?'service':'inspect',label:Number(bike.condition??100)<60?'Service the bike':'Inspect the bike',description:'Protect readiness and reliability before the next race.'});
  if(left>0) extra.push({family:'responsibility',id:Number(game.rider?.age??18)<18?'school':'work_shift',label:Number(game.rider?.age??18)<18?'Protect school time':'Cover work responsibilities',description:'Motocross has to fit around the rest of life.'});
  if(left>0) extra.push({family:'prep',id:'budget_check',label:'Prepare the next race',description:'Budget, travel, packing and sponsor duties shape the weekend before you arrive.'});
  const eventState=createLifeEventState(game.state.lifeBetweenRaces.lifeEvents);
  const generated=generateLifeEvent(eventState,{seasonNumber:game.state.seasonNumber,week:game.week,family:true,familyStress:game.family?.stress??0,recentFinish:game.state.lastFinish??99,bikeCondition:bike.condition,reputation:game.rider?.reputation??game.state.reputation??0,sponsorSatisfaction:game.state.sponsorSatisfaction??70,region:game.state.homeRegion??'northeast'},{seed:game.state.seed??1});
  if(generated.event) extra.push({family:'relationship',id:generated.event.choices[0].id,label:generated.event.title,description:generated.event.body,event:generated.event});
  return [...base,...extra].map((c,i)=>({...c,recommended:c.recommended??(i===0)}));
}

export function takeExpandedLifeBetweenRacesDecision(game, choice){
  if(!choice)return {error:'missing-choice'};
  if(['training','recovery'].includes(choice.family)) return takeLifeBetweenRacesDecision(game,choice.family,choice.id);
  const left=timeLeft(game), bike=game.trainBike?.()??game.bike??{}, money=game.family?.money??0;
  if(choice.family==='maintenance'){
    const r=resolveMaintenanceAction(choice.id,{bike,money,timeLeft:left,weeksToRace:1}); if(r.error)return r; if(!spend(game,r.decision.cost))return {error:'not-enough-money'};
    bike.condition=r.decision.conditionAfter; bike.reliability=r.decision.reliabilityAfter; useTime(game,r.decision.time,'maintenance',choice.id); history(game,r.decision); return r;
  }
  if(choice.family==='responsibility'){
    const r=resolveResponsibilityAction(choice.id,{age:game.rider?.age??18,schoolMode:game.state.schoolMode??'school',timeLeft:left,familyTrust:game.family?.trust??60,familyStress:game.family?.stress??0}); if(r.error)return r;
    if(r.decision.moneyDelta>0) game.family.money=Number(game.family.money??0)+r.decision.moneyDelta; game.family.trust=Math.max(0,Math.min(100,Number(game.family.trust??60)+r.decision.trustDelta)); game.stress?.(r.decision.stressDelta); useTime(game,r.decision.time,'responsibility',choice.id); history(game,r.decision); return r;
  }
  if(choice.family==='prep'){
    game.state.lifeBetweenRaces.travelPrep ??={booked:false,packed:false,bikeReady:Number(bike.condition??100)>=55,sponsorDutiesDue:0,sponsorDutiesDone:0};
    const r=resolvePrepAction(choice.id,{...game.state.lifeBetweenRaces.travelPrep,money,timeLeft:left}); if(r.error)return r; if(!spend(game,r.decision.cost))return {error:'not-enough-money'};
    if(choice.id==='budget_check') game.state.lifeBetweenRaces.travelPrep.budgetReviewed=true; useTime(game,r.decision.time,'prep',choice.id); history(game,{...r.decision,status:travelPrepStatus(game.state.lifeBetweenRaces.travelPrep)}); return r;
  }
  if(choice.family==='relationship'){
    const current=createLifeEventState(game.state.lifeBetweenRaces.lifeEvents); const event=choice.event??generateLifeEvent(current,{seasonNumber:game.state.seasonNumber,week:game.week,family:true},{seed:game.state.seed??1}).event; const r=resolveLifeEvent(current,event,choice.id); if(r.error)return r;
    game.state.lifeBetweenRaces.lifeEvents=r.state; const e=r.outcome.effects; if(Number(e.money??0)<0&&!spend(game,-Number(e.money)))return {error:'not-enough-money'}; if(Number(e.money??0)>0)game.family.money+=Number(e.money); game.stress?.(e.stress??0); game.family.trust=Math.max(0,Math.min(100,Number(game.family.trust??60)+Number(e.relationship??0))); game.state.reputation=Math.max(0,Number(game.state.reputation??0)+Number(e.reputation??0)); useTime(game,1,'relationship',choice.id); history(game,r.outcome); return r;
  }
  return {error:'unknown-family'};
}
