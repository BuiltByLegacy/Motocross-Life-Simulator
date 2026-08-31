import { ensureRelationshipLifecycle, applyRelationshipChange, changeRelationshipRole } from './peopleRelationships2.js';
import { createCareerEconomyState, recordCashChange, economySummary } from './careerEconomy2.js';

const clamp=(v,lo=0,hi=100)=>Math.max(lo,Math.min(hi,Number(v)||0));
export const ECONOMIC_ARCHETYPES=Object.freeze({
  family_youth:{id:'family_youth',label:'Family-Funded Youth',supportShare:.72,workEligible:false,pressureBias:-8},
  budget_amateur:{id:'budget_amateur',label:'Budget Amateur',supportShare:.28,workEligible:true,pressureBias:8},
  regional_privateer:{id:'regional_privateer',label:'Regional Privateer',supportShare:.16,workEligible:true,pressureBias:14},
  national_privateer:{id:'national_privateer',label:'National Privateer',supportShare:.08,workEligible:true,pressureBias:22},
  supported_amateur:{id:'supported_amateur',label:'Supported Amateur',supportShare:.52,workEligible:true,pressureBias:-2},
  team_factory:{id:'team_factory',label:'Team / Factory Rider',supportShare:.88,workEligible:false,pressureBias:-18},
});

export function classifyEconomicArchetype(ctx={}){
  if(ctx.teamBacked||ctx.factory)return ECONOMIC_ARCHETYPES.team_factory;
  if(ctx.supported||Number(ctx.supportLevel??0)>=2)return ECONOMIC_ARCHETYPES.supported_amateur;
  const age=Number(ctx.age??18),scope=ctx.scope??'regional';
  if(age<16)return ECONOMIC_ARCHETYPES.family_youth;
  if(scope==='national')return ECONOMIC_ARCHETYPES.national_privateer;
  if(scope==='regional')return ECONOMIC_ARCHETYPES.regional_privateer;
  return ECONOMIC_ARCHETYPES.budget_amateur;
}

export function seasonAffordability(economyRaw,{cash=0,plannedCost=0,archetype='budget_amateur',supportExpected=0}={}){
  const econ=createCareerEconomyState(economyRaw,cash),summary=economySummary(econ),a=ECONOMIC_ARCHETYPES[archetype]??ECONOMIC_ARCHETYPES.budget_amateur;
  const support=Math.max(0,Number(supportExpected)||Math.round(Number(plannedCost||0)*a.supportShare));
  const oop=Math.max(0,Number(plannedCost||0)-support),available=Math.max(0,Number(cash||0)+summary.netCash),gap=oop-available;
  const score=clamp(50+(gap/Math.max(100,plannedCost||1))*60+a.pressureBias);
  return{archetype:a.id,label:a.label,plannedCost:Number(plannedCost||0),expectedSupport:support,outOfPocket:oop,availableCash:available,gap:Math.round(gap),pressureScore:Math.round(score),band:score>=75?'critical':score>=55?'tight':score>=35?'managed':'comfortable',viable:gap<=0};
}

export function createConflict(recordRaw,{source='unknown',severity=2,seasonNumber=1,week=0,expectationDelta=0}={}){
  const s=clamp(severity,1,5),rec=applyRelationshipChange(recordRaw,{conflict:s*8,trust:-s*3,closeness:-s*2,reliability:-s,expectations:expectationDelta},{seasonNumber,week,reason:`conflict:${source}`,source});
  rec.lifecycle.activeConflict={id:`conflict:${rec.id}:${seasonNumber}:${week}:${source}`,source,severity:s,opened:{seasonNumber,week},repairProgress:0,status:'active'};return rec;
}
export function repairConflict(recordRaw,{action='talk',effort=1,seasonNumber=1,week=0}={}){
  let rec=ensureRelationshipLifecycle(recordRaw),c=rec.lifecycle.activeConflict;if(!c||c.status!=='active')return rec;
  const value={talk:1,apology:2,show_up:2,follow_through:3,space:1}[action]??1;c={...c,repairProgress:Number(c.repairProgress||0)+Math.max(1,Number(effort||1))*value};
  const needed=4+c.severity*2;rec=applyRelationshipChange(rec,{conflict:-value*4,trust:value*(action==='follow_through'?2:1),closeness:value},{seasonNumber,week,reason:`repair:${action}`,source:c.id});
  if(c.repairProgress>=needed)c={...c,status:'repaired',closed:{seasonNumber,week}};rec.lifecycle.activeConflict=c;return rec;
}
export function driftRelationship(recordRaw,{weeks=4,seasonNumber=1,week=0}={}){const d=Math.max(0,Number(weeks||0))/4;return applyRelationshipChange(recordRaw,{closeness:-d,reliability:-d*.4,availability:-d*.5},{seasonNumber,week,reason:'passive-drift'});}

export function evolveGuardianship(recordRaw,{age=12,responsibility=50,seasonNumber=1,week=0}={}){
  const rec=ensureRelationshipLifecycle(recordRaw);if(rec.role!=='Parent'&&rec.lifecycle.role!=='Parent'&&!['Parent Advisor','Advisor'].includes(rec.lifecycle.role))return rec;
  const target=age>=18?'Advisor':age>=16&&responsibility>=65?'Parent Advisor':'Parent';return changeRelationshipRole(rec,target,{seasonNumber,week,reason:'age-and-responsibility'});
}
export function approvalAuthority(recordRaw,{riderAge=12,responsibility=50}={}){ensureRelationshipLifecycle(recordRaw);if(riderAge>=18)return'advisory';if(riderAge>=16&&responsibility>=70)return'shared';return'guardian-required';}

export const WORK_OPTIONS=Object.freeze({
  chores:{id:'chores',label:'Family / Shop Chores',minAge:10,time:1,income:25,fatigue:2,practiceCost:0},
  part_time:{id:'part_time',label:'Part-Time Work',minAge:16,time:2,income:120,fatigue:6,practiceCost:1},
  shop_shift:{id:'shop_shift',label:'Shop Shift',minAge:16,time:2,income:150,fatigue:5,practiceCost:1},
  full_shift:{id:'full_shift',label:'Full Work Shift',minAge:18,time:3,income:240,fatigue:9,practiceCost:2},
});
export function quoteWork(optionId,{age=18,availableSlots=0,isRaceWeek=false}={}){const w=WORK_OPTIONS[optionId];if(!w)return{allowed:false,reason:'unknown-work'};let reason=null;if(age<w.minAge)reason='age-restriction';else if(isRaceWeek&&w.time>1)reason='race-week-conflict';else if(w.time>availableSlots)reason='not-enough-time';return{...w,allowed:!reason,reason,availableSlots,remainingSlots:Math.max(0,availableSlots-w.time),tradeoff:w.practiceCost?`Costs roughly ${w.practiceCost} practice/recovery slot${w.practiceCost>1?'s':''}.`:'Low time cost.'};}
export function applyWork(economyRaw,optionId,{age=18,availableSlots=0,isRaceWeek=false,seasonNumber=1,week=0,openingBalance=0}={}){const q=quoteWork(optionId,{age,availableSlots,isRaceWeek});if(!q.allowed)return{economy:createCareerEconomyState(economyRaw,openingBalance),quote:q,error:q.reason};const r=recordCashChange(economyRaw,q.income,{sourceId:`work:${seasonNumber}:${week}:${optionId}`,seasonNumber,week,kind:'work-income',category:'work',description:q.label,fundingSource:'employer',beneficiary:'rider'},openingBalance);return{economy:r.state,quote:q,entry:r.entry,timeUsed:q.time,fatigueDelta:q.fatigue,income:q.income,duplicate:r.duplicate};}
