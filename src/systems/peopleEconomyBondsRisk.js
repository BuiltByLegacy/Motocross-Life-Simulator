import { ensureRelationshipLifecycle, applyRelationshipChange, changeRelationshipRole } from './peopleRelationships2.js';
import { createCareerEconomyState, economySummary, expectedBalance } from './careerEconomy2.js';
import { seasonAffordability } from './peopleEconomyLifePressure.js';

const clamp=(v,lo=0,hi=100)=>Math.max(lo,Math.min(hi,Number(v)||0));
const ROLE_RULES=Object.freeze({
  Rival:{respect:8,trust:2,closeness:2,opportunity:'rival-introduction'},
  Mentor:{respect:6,trust:8,closeness:5,opportunity:'mentor-introduction'},
  Coach:{respect:6,trust:7,closeness:4,opportunity:'coach-referral'},
  Mechanic:{respect:5,trust:8,reliability:9,opportunity:'mechanic-network'},
  Dealer:{respect:4,trust:6,reliability:7,opportunity:'dealer-support'},
  Promoter:{respect:6,trust:4,reliability:3,opportunity:'promoter-invite'},
  Teammate:{respect:5,trust:5,closeness:6,opportunity:'team-introduction'},
});

export function ensureRecurringBond(recordRaw={},role=null){
  const rec=ensureRelationshipLifecycle(recordRaw);const r=role??rec.lifecycle.role??rec.role??'Person';
  rec.lifecycle.role=r;rec.role=r;rec.lifecycle.bond={version:2,role:r,encounters:Number(rec.lifecycle.bond?.encounters??0),sharedRaceWeeks:Number(rec.lifecycle.bond?.sharedRaceWeeks??0),introductions:[...(rec.lifecycle.bond?.introductions??[])],lastInteraction:rec.lifecycle.bond?.lastInteraction??null};return rec;
}
export function recordBondInteraction(recordRaw,event={}){
  let rec=ensureRecurringBond(recordRaw,event.role);const rules=ROLE_RULES[rec.lifecycle.role]??{};const kind=event.kind??'interaction';const intensity=clamp(event.intensity??1,1,5);
  const changes={};if(kind==='help'||kind==='wrench'||kind==='coaching'){changes.trust=(rules.trust??4)*intensity*.18;changes.reliability=(rules.reliability??4)*intensity*.18;changes.closeness=(rules.closeness??3)*intensity*.12;}
  if(kind==='race_battle'){changes.respect=(rules.respect??5)*intensity*.22;changes.conflict=intensity*.8;if(event.clean!==false)changes.closeness=intensity*.2;}
  if(kind==='let_down'){changes.trust=-intensity*2;changes.reliability=-intensity*2.4;changes.conflict=intensity*2;}
  if(kind==='conversation'){changes.trust=intensity*.5;changes.closeness=intensity*.7;}
  rec=applyRelationshipChange(rec,changes,{seasonNumber:event.seasonNumber,week:event.week,reason:`bond:${kind}`,source:event.sourceId??null});rec.lifecycle.bond.encounters++;if(event.raceWeek)rec.lifecycle.bond.sharedRaceWeeks++;rec.lifecycle.bond.lastInteraction={seasonNumber:Number(event.seasonNumber??1),week:Number(event.week??0),kind};return rec;
}
export function bondOpportunity(recordRaw,{seasonNumber=1,week=0,kind=null}={}){
  const rec=ensureRecurringBond(recordRaw),d=rec.lifecycle.dimensions,b=rec.lifecycle.bond,rules=ROLE_RULES[rec.lifecycle.role]??{};
  const strength=(d.trust+d.respect+d.reliability+d.closeness)/4;const eligible=b.encounters>=2&&strength>=58&&d.conflict<55;if(!eligible)return{eligible:false,reason:b.encounters<2?'not-enough-history':'relationship-not-strong-enough',strength:Math.round(strength)};
  const opportunityKind=kind??rules.opportunity??'personal-introduction';const id=`bond-op:${rec.id}:${seasonNumber}:${week}:${opportunityKind}`;if(b.introductions.some(x=>x.id===id))return{eligible:false,reason:'already-used',strength:Math.round(strength)};
  return{eligible:true,id,kind:opportunityKind,actorId:rec.id,actorRole:rec.lifecycle.role,strength:Math.round(strength),seasonNumber:Number(seasonNumber),week:Number(week)};
}
export function recordBondIntroduction(recordRaw,opportunity){const rec=ensureRecurringBond(recordRaw);if(!opportunity?.eligible)return rec;if(!rec.lifecycle.bond.introductions.some(x=>x.id===opportunity.id))rec.lifecycle.bond.introductions.push({...opportunity});return rec;}
export function evolveRecurringRole(recordRaw,newRole,meta={}){const rec=changeRelationshipRole(ensureRecurringBond(recordRaw),newRole,{...meta,reason:meta.reason??'bond-role-evolution'});return ensureRecurringBond(rec,newRole);}
export function rivalryProfile(recordRaw){const rec=ensureRecurringBond(recordRaw),d=rec.lifecycle.dimensions;return{role:rec.lifecycle.role,rivalry:Math.round(clamp(d.conflict*.65+(100-d.closeness)*.2)),respect:Math.round(d.respect),friendship:Math.round(d.closeness),trusted:Math.round(d.trust)>=65,summary:d.respect>=65&&d.closeness>=55?'Competitive, but there is real respect and friendship underneath it.':d.respect>=65?'A serious rivalry with earned respect.':d.conflict>=60?'The relationship is tense and personal.':'A developing competitive relationship.'};}

export function financialPosture(economyRaw,ctx={}){
  const econ=createCareerEconomyState(economyRaw,ctx.cash??0),summary=economySummary(econ),cash=Math.max(0,ctx.cash==null?expectedBalance(econ):Number(ctx.cash||0)),planned=Math.max(0,Number(ctx.plannedCost??0));
  const debt=Math.max(0,Number(ctx.debtExposure??0)),monthlyLiving=Math.max(1,Number(ctx.monthlyLivingCost??800)),cushionMonths=cash/monthlyLiving;
  const affordability=seasonAffordability(econ,{cash,plannedCost:planned,archetype:ctx.archetype??'budget_amateur',supportExpected:ctx.supportExpected??0});
  const equipmentRisk=clamp(ctx.equipmentRisk??0),familyStrain=clamp(ctx.familyStrain??0),commitments=clamp(ctx.commitmentRisk??0);
  const debtScore=clamp((debt/Math.max(500,monthlyLiving*4))*100),cushionRisk=clamp(75-cushionMonths*18);
  const score=clamp(affordability.pressureScore*.38+debtScore*.2+cushionRisk*.18+equipmentRisk*.1+familyStrain*.08+commitments*.06);
  const band=score>=75?'critical':score>=55?'strained':score>=35?'exposed':'stable';
  const drivers=[['season funding gap',affordability.gap>0?clamp(50+affordability.pressureScore/2):0],['thin emergency cushion',cushionRisk],['debt exposure',debtScore],['equipment risk',equipmentRisk],['family strain',familyStrain],['commitment load',commitments]].filter(x=>x[1]>=25).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0]);
  return{version:2,band,pressureScore:Math.round(score),cash:Math.round(cash),cushionMonths:Number(cushionMonths.toFixed(1)),debtExposure:debt,affordability,drivers,commitmentCapacity:band==='critical'?'protect-the-program':band==='strained'?'selective':band==='exposed'?'measured':'flexible',summary:band==='stable'?'The program has room to absorb a setback.':`The program is ${band}; ${drivers.join(' and ')||'current commitments'} are limiting flexibility.`};
}
export function evaluateCommitment(posture,commitment={}){const cost=Math.max(0,Number(commitment.outOfPocket??commitment.cost??0)),risk=clamp(commitment.risk??0),cash=Math.max(0,Number(posture?.cash??0));const reserveNeed=Math.max(0,Number(commitment.reserveRequired??0));const allowed=posture?.band!=='critical'&&cash-cost>=reserveNeed&&(posture?.band!=='strained'||risk<65);return{allowed,reason:allowed?null:posture?.band==='critical'?'financial-pressure':cash-cost<reserveNeed?'insufficient-cushion':'commitment-too-risky',remainingCash:Math.max(0,cash-cost),postureBand:posture?.band??'unknown'};}
