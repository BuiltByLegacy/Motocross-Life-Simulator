import { RIDER_SKILLS, createRiderDevelopmentProfile, ageDevelopmentCurve } from './riderDevelopment.js';

const LABELS={starts:'starts',cornering:'corner speed',ruts:'ruts',braking:'braking',jumping:'jumping',roughTerrain:'rough-track riding',lineChoice:'line choice',racecraft:'racecraft',consistency:'consistency',fitness:'fitness',composure:'composure',adaptability:'adaptability'};
const TECHNICAL=new Set(['cornering','ruts','braking','jumping','roughTerrain','lineChoice']);
const RACE=new Set(['starts','racecraft','consistency','composure']);
const clamp=(v,lo=0,hi=100)=>Math.max(lo,Math.min(hi,Number(v)||0));

export function developmentSnapshot(profileRaw,{adaptation=null,mental=null,trainingHistory=null}={}){
  const profile=createRiderDevelopmentProfile(profileRaw);
  const ranked=RIDER_SKILLS.map(skill=>({skill,label:LABELS[skill],value:profile.skills[skill]})).sort((a,b)=>b.value-a.value||a.skill.localeCompare(b.skill));
  const strengths=ranked.slice(0,3),weaknesses=[...ranked].reverse().slice(0,3);
  const avg=Math.round(ranked.reduce((s,x)=>s+x.value,0)/ranked.length);
  const curve=ageDevelopmentCurve(profile.age);
  return {profile,average:avg,stage:curve.stage,strengths,weaknesses,adaptation,mental,trainingHistory};
}

export function riderDevelopmentNarrative(profileRaw,context={}){
  const s=developmentSnapshot(profileRaw,context),top=s.strengths[0],second=s.strengths[1],weak=s.weaknesses[0];
  const identity=top.value>=75?`A clear strength is ${top.label}`:`The rider is currently strongest in ${top.label}`;
  const support=second&&second.value>=s.average+5?`, backed up by ${second.label}`:'';
  let need=`The biggest development opportunity is ${weak.label}.`;
  if(context.adaptation?.readinessBand&&context.adaptation.readinessBand!=='settled') need+=` The current bike/class still needs adaptation, so execution may lag behind underlying ability.`;
  if(context.mental?.band==='slump'||context.mental?.band==='tight') need+=` Recent mental form is affecting execution, not base talent.`;
  return `${identity}${support}. ${need}`;
}

export function coachingFeedback(profileRaw,{adaptation=null,mental=null,recentTraining=[]}={}){
  const s=developmentSnapshot(profileRaw,{adaptation,mental});
  const weak=s.weaknesses[0],second=s.weaknesses[1];
  const practiced=new Map();
  for(const row of recentTraining||[]) if(row?.activity) practiced.set(row.activity,(practiced.get(row.activity)||0)+1);
  const focus=TECHNICAL.has(weak.skill)?'technique':weak.skill==='fitness'?'conditioning':RACE.has(weak.skill)?'coaching':'motos';
  const secondary=TECHNICAL.has(second.skill)?'technique':second.skill==='fitness'?'conditioning':RACE.has(second.skill)?'coaching':'motos';
  const cautions=[];
  if((practiced.get(focus)||0)>=3)cautions.push(`Repeated ${focus} work is starting to see diminishing returns; mix the week instead of grinding one drill.`);
  if(adaptation?.readinessBand&&['raw','unsettled'].includes(adaptation.readinessBand))cautions.push('Prioritize adaptation reps before judging race pace on the new bike/class.');
  if(mental?.band==='slump')cautions.push('Use a confidence-building session or smaller win rather than adding raw training load.');
  return {primary:{skill:weak.skill,label:weak.label,activity:focus},secondary:{skill:second.skill,label:second.label,activity:secondary},cautions,summary:`Work on ${weak.label} first through ${focus}; keep ${second.label} as the secondary focus.`};
}

export function developmentTrend(profileRaw){
  const p=createRiderDevelopmentProfile(profileRaw),totals={};
  for(const h of p.history||[])for(const [skill,gain] of Object.entries(h.gains||{}))totals[skill]=(totals[skill]||0)+Number(gain||0);
  const ranked=Object.entries(totals).map(([skill,gain])=>({skill,label:LABELS[skill]||skill,gain:Math.round(gain*100)/100})).sort((a,b)=>b.gain-a.gain);
  return {improving:ranked.filter(x=>x.gain>0).slice(0,3),regressing:ranked.filter(x=>x.gain<0).sort((a,b)=>a.gain-b.gain).slice(0,3)};
}

export function compactDevelopmentCard(profileRaw,context={}){
  const s=developmentSnapshot(profileRaw,context),feedback=coachingFeedback(profileRaw,context),trend=developmentTrend(profileRaw);
  return {title:'RIDER DEVELOPMENT',headline:riderDevelopmentNarrative(profileRaw,context),strengths:s.strengths.map(x=>x.label),focus:feedback.primary.label,coach:feedback.summary,cautions:feedback.cautions,trend,stage:s.stage};
}
