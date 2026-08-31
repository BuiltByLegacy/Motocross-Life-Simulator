// Race Intelligence 2.0 — mechanical fit, passing/battle, fatigue/mistake/reliability dynamics.
// Pure domain helpers: deterministic for a supplied roll, shared by player and AI.

const clamp=(v,lo=0,hi=100)=>Math.max(lo,Math.min(hi,Number(v)||0));
const n=(v,d=50)=>Number.isFinite(Number(v))?Number(v):d;

export const SETUP_PRESETS=Object.freeze({
  balanced:{id:'balanced',label:'Balanced',suspension:0,gearing:0,traction:0,stability:0},
  tight:{id:'tight',label:'Tight / technical',suspension:8,gearing:-6,traction:5,stability:-4},
  fast:{id:'fast',label:'Fast / flowing',suspension:-4,gearing:9,traction:-2,stability:8},
  rough:{id:'rough',label:'Rough / chopped',suspension:10,gearing:-2,traction:7,stability:9},
  mud:{id:'mud',label:'Mud / deep ruts',suspension:5,gearing:-5,traction:12,stability:3},
});

export function resolveBikeTrackFit(bike={},track={},opts={}){
 const d=track.demands??track.profile?.demands??{}; const setup=typeof opts.setup==='string'?SETUP_PRESETS[opts.setup]??SETUP_PRESETS.balanced:{...SETUP_PRESETS.balanced,...opts.setup};
 const parts=bike.parts??{}; const tireLife=n(parts.tires??(100-(bike.tireWear??0)),100); const brakeLife=n(parts.brakes,100); const chainLife=n(parts.chain,100); const topEnd=n(parts.topEnd,100);
 const condition=clamp(bike.condition??70), handling=clamp(bike.handling??50), performance=clamp(bike.performance??50), starts=clamp(bike.starts??50), reliability=clamp(bike.reliability??60);
 const suspension=clamp(handling+setup.suspension); const drive=clamp(performance+setup.gearing); const traction=clamp((handling*.45+tireLife*.55)+setup.traction); const stability=clamp((handling*.6+condition*.4)+setup.stability);
 const rows=[
  row('starts',starts,d.starts), row('speed',drive,d.speed), row('braking',(handling*.45+brakeLife*.55),d.braking), row('cornering',(suspension*.5+traction*.5),d.cornering),
  row('ruts',(traction*.55+suspension*.45),d.ruts), row('jumping',(suspension*.5+stability*.5),d.jumping), row('roughTerrain',(suspension*.6+stability*.4),d.roughTerrain)
 ];
 const weighted=rows.reduce((s,r)=>s+r.margin*Math.max(.2,r.required/100),0)/rows.reduce((s,r)=>s+Math.max(.2,r.required/100),0);
 const wearPenalty=((100-condition)*.08+(100-tireLife)*.05+(100-brakeLife)*.025);
 const mechanicalRisk=clamp((100-reliability)*.28+(100-condition)*.18+(100-chainLife)*.10+(100-topEnd)*.14,0,65);
 const score=clamp(50+weighted*.55-wearPenalty*.2);
 const strengths=rows.filter(x=>x.margin>=8).sort((a,b)=>b.margin-a.margin).slice(0,3); const weaknesses=rows.filter(x=>x.margin<=-8).sort((a,b)=>a.margin-b.margin).slice(0,3);
 return {score:Math.round(score),setup:setup.id??'custom',strengths,weaknesses,breakdown:rows,condition,tireLife,mechanicalRisk:Math.round(mechanicalRisk),
  tradeoffs:setup.id==='balanced'?['Neutral setup: no specialized advantage.']:[`${setup.label} setup helps some demands but sacrifices others.`],
  summary: weaknesses.length?`Bike is least comfortable with ${weaknesses.map(x=>x.demand).join(', ')}.`:'Bike is reasonably matched to the current track.'};
}
function row(demand,cap,req=50){cap=clamp(cap);req=clamp(req);return {demand,capacity:Math.round(cap),required:Math.round(req),margin:Math.round(cap-req)};}

export function resolveStart({rider={},bike={},track={},reaction=50,roll=0.5}={}){
 const skill=clamp(rider.skills?.starts??rider.starts??50); const hardware=clamp(bike.starts??50); const demand=clamp(track.demands?.starts??50);
 const noise=(clamp(roll,0,1)-.5)*18; const quality=clamp(skill*.48+hardware*.32+clamp(reaction)*.20-demand*.12+noise+12);
 return {quality:Math.round(quality),band:quality>=75?'excellent':quality>=58?'good':quality>=42?'average':'poor',paceSeed:Number(((quality-50)*.34).toFixed(2))};
}

export function passingOpportunity({attacker={},defender={},track={},aggression=.5,roll=.5,pressure=50}={}){
 const passDifficulty=clamp(track.passingDifficulty??60); const lineVariety=clamp(track.lineVariety??50); const racecraft=clamp(attacker.skills?.racecraft??attacker.racecraft??attacker.skills?.raceIQ??50); const lineChoice=clamp(attacker.skills?.lineChoice??attacker.skills?.raceIQ??50);
 const composure=clamp(attacker.skills?.composure??attacker.skills?.consistency??50); const defense=clamp(defender.skills?.racecraft??defender.racecraft??defender.skills?.raceIQ??50);
 const agg=clamp(Number(aggression)*100); const chance=clamp(22+racecraft*.28+lineChoice*.18+lineVariety*.18+agg*.12-composure*.02-defense*.18-passDifficulty*.34-pressure*.03,3,86);
 const success=clamp(roll,0,1)*100<chance; const mistakeRisk=clamp(4+agg*.14+passDifficulty*.06+pressure*.08-composure*.10,1,35);
 return {chance:Math.round(chance),success,mistakeRisk:Math.round(mistakeRisk),explanation:success?'The rider created and completed a passing opportunity.':passDifficulty>68?'Traffic and a narrow racing line made the pass difficult.':'The rider could not complete the move this time.'};
}

export function resolvePositionBattle({attacker,defender,track,aggression=.5,roll=.5,attackerPace=50,defenderPace=50,pressure=50}={}){
 const opportunity=passingOpportunity({attacker,defender,track,aggression,roll,pressure}); const paceEdge=n(attackerPace)-n(defenderPace);
 const adjustedChance=clamp(opportunity.chance+paceEdge*.65,2,92); const success=clamp(roll,0,1)*100<adjustedChance;
 const state=success?'pass':paceEdge>5?'stuck':paceEdge<-6?'defending':'battle';
 return {...opportunity,chance:Math.round(adjustedChance),success,state,paceEdge:Number(paceEdge.toFixed(1)),summary:success?'Pass completed.':state==='stuck'?'Faster rider is stuck in traffic.':state==='defending'?'Rider is under pressure and defending.':'Position battle remains unresolved.'};
}

export function resolveLateMotoExecution({rider={},track={},phase=.5,aggression=.5,pressure=50,priorLoad=0,injury=null,recovery=70,temperatureF=72}={}){
 const skills=rider.skills??rider; const fitness=clamp(skills.fitness??50); const consistency=clamp(skills.consistency??50); const composure=clamp(skills.composure??consistency); const technical=average(track.demands?.ruts,track.demands?.roughTerrain,track.demands?.lineChoice,track.demands?.jumping);
 const heat=Math.max(0,n(temperatureF,72)-78)*.45; const injuryPenalty=injury?({minor:7,moderate:14,severe:24}[injury.severity]??10):0; const phaseLoad=clamp(phase,0,1)*38;
 const fatigue=clamp(priorLoad*.35+phaseLoad+technical*.18+heat+injuryPenalty-fitness*.28-clamp(recovery)*.12+20);
 const aggressionLoad=clamp(Number(aggression)*100)*.06; const fade=clamp((fatigue-45)*.28-fitness*.05,0,18); const stabilize=fitness>=72&&consistency>=68&&fatigue<72; const finishStrong=fitness>=82&&composure>=72&&clamp(recovery)>=70;
 const mistakeRisk=clamp(3+fatigue*.16+technical*.08+aggressionLoad+clamp(pressure)*.05-consistency*.09-composure*.07,1,38);
 return {fatigue:Math.round(fatigue),pacePenalty:Number(fade.toFixed(1)),mistakeRisk:Number(mistakeRisk.toFixed(1)),state:finishStrong?'finish-strong':stabilize?'stable':fade>=6?'fade':'holding',
  summary:finishStrong?'Fitness and composure leave enough reserve to finish stronger.':stabilize?'The rider is managing the late-moto load.':fade>=6?'Fatigue is beginning to cost pace and precision.':'The rider is still holding expected pace.'};
}

export function mechanicalReliability({bike={},track={},phase=.5,aggression=.5}={}){
 const parts=bike.parts??{}; const rel=clamp(bike.reliability??60), condition=clamp(bike.condition??70); const top=clamp(parts.topEnd??100),chain=clamp(parts.chain??100); const rough=clamp(track.demands?.roughTerrain??50);
 const stress=rough*.12+clamp(phase,0,1)*10+clamp(Number(aggression)*100)*.06; const weakness=(100-rel)*.20+(100-condition)*.13+(100-top)*.10+(100-chain)*.08;
 const failureChance=clamp((weakness+stress-16)*.035,.05,4.5); return {failureChance:Number(failureChance.toFixed(2)),riskBand:failureChance>=2.5?'high':failureChance>=1?'elevated':'normal',stress:Math.round(stress)};
}
function average(...v){const xs=v.filter(x=>Number.isFinite(Number(x))).map(Number);return xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:50;}
