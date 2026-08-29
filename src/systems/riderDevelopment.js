// Rider Development 2.0 foundation (#395/#396)
// Preserves legacy development exports while adding the canonical skill profile.

export const DEVELOPMENT_TRAITS = {
  early_bloomer: { growth: 1.18, peakShift: -2, transition: 0 },
  late_bloomer: { growth: 0.9, peakShift: 3, transition: 0 },
  fast_learner: { growth: 1.15, peakShift: 0, transition: 4 },
  slow_adapter: { growth: 0.92, peakShift: 0, transition: -7 },
  transition_sensitive: { growth: 1, peakShift: 0, transition: -10 },
  mentally_resilient: { growth: 1.04, peakShift: 0, confidence: 7 },
  confidence_fragile: { growth: 1, peakShift: 0, confidence: -8 },
  high_ceiling: { growth: 1.03, peakShift: 1, ceiling: 10 },
  work_ethic: { growth: 1.08, peakShift: 0, ceiling: 3 },
};

const LEGACY_SKILLS = ['starts', 'cornering', 'jumping', 'whoops', 'raceIQ', 'consistency', 'fitness'];
export const RIDER_SKILLS = Object.freeze(['starts','cornering','ruts','braking','jumping','roughTerrain','lineChoice','racecraft','consistency','fitness','composure','adaptability']);
export const DEFAULT_TRAIT_PROFILE = Object.freeze({ learning:50, ceiling:50, consistency:50, adaptability:50, resilience:50 });
const clamp=(v,lo=0,hi=100)=>Math.max(lo,Math.min(hi,Number(v)||0));
const seeded=(text)=>{let h=2166136261;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return(h>>>0)/4294967295;};

export function migrateLegacySkills(old={}) {
  const raceIQ=Number(old.raceIQ??old.racecraft??32), cornering=Number(old.cornering??38), consistency=Number(old.consistency??40);
  const base={starts:old.starts??34,cornering,ruts:old.ruts??Math.round((cornering+raceIQ)/2),braking:old.braking??Math.round(cornering*.55+raceIQ*.45),jumping:old.jumping??30,roughTerrain:old.roughTerrain??old.whoops??28,lineChoice:old.lineChoice??raceIQ,racecraft:old.racecraft??raceIQ,consistency,fitness:old.fitness??45,composure:old.composure??Math.round((consistency+raceIQ)/2),adaptability:old.adaptability??Math.round((consistency+raceIQ)/2)};
  return Object.fromEntries(RIDER_SKILLS.map(k=>[k,clamp(base[k])]));
}

export function createRiderDevelopmentProfile({skills={},traits={},age=12,history=[]}={}) {
  return {version:2,age:Number(age)||12,skills:migrateLegacySkills(skills),traits:{...DEFAULT_TRAIT_PROFILE,...Object.fromEntries(Object.entries(traits).map(([k,v])=>[k,clamp(v)]))},history:Array.isArray(history)?history.map(x=>({...x})):[]};
}

export function legacySkillView(profileRaw){
  const p=createRiderDevelopmentProfile(profileRaw);
  return {starts:p.skills.starts,cornering:p.skills.cornering,jumping:p.skills.jumping,whoops:p.skills.roughTerrain,raceIQ:Math.round((p.skills.lineChoice+p.skills.racecraft+p.skills.composure)/3),consistency:p.skills.consistency,fitness:p.skills.fitness};
}

export function ageDevelopmentCurve(age){
  const a=Number(age)||12;
  if(a<=11)return{stage:'youth',learning:1.18,physical:.82,recovery:1.12,regression:0};
  if(a<=16)return{stage:'adolescence',learning:1.28,physical:1.03,recovery:1.08,regression:0};
  if(a<=29)return{stage:'prime',learning:1,physical:1.12,recovery:1,regression:0};
  if(a<=36)return{stage:'veteran',learning:.82,physical:.98,recovery:.88,regression:.15};
  return{stage:'later-career',learning:.68,physical:.82,recovery:.72,regression:.35};
}

export function skillCeiling(profileRaw,skill){const p=createRiderDevelopmentProfile(profileRaw);const bias=['adaptability','composure','racecraft','lineChoice'].includes(skill)?(p.traits.adaptability-50)*.1:0;return clamp(72+(p.traits.ceiling-50)*.32+bias,45,99);}

export function developmentGain(profileRaw,skill,{base=2,seed=1,contextKey='growth',fatigue=0,stress=0,motivation=50,repetition=0}={}){
  const p=createRiderDevelopmentProfile(profileRaw),current=p.skills[skill]??50,curve=ageDevelopmentCurve(p.age),ceiling=skillCeiling(p,skill),room=Math.max(0,ceiling-current)/Math.max(1,ceiling),diminishing=Math.max(.22,1-Number(repetition)*.17),condition=Math.max(.18,1-clamp(fatigue)/160-clamp(stress)/220+(clamp(motivation)-50)/250),trait=.72+p.traits.learning/180,roll=.78+seeded(`${seed}:${contextKey}:${skill}:${p.age}:${current}`)*.44;
  return Math.max(0,Math.round(Number(base)*curve.learning*trait*(.35+room*.9)*diminishing*condition*roll*100)/100);
}

export function applyDevelopment(profileRaw,gains={},meta={}){const p=createRiderDevelopmentProfile(profileRaw),next={...p,skills:{...p.skills},history:[...p.history]};for(const s of RIDER_SKILLS)if(gains[s])next.skills[s]=clamp(next.skills[s]+Number(gains[s]));next.history.push({type:meta.type??'development',source:meta.source??'system',age:next.age,gains:{...gains},season:meta.season??null,week:meta.week??null});return next;}

export function seasonalDevelopment(profileRaw,{seed=1,season=1,trainingQuality=1,injuryWeeks=0,stress=20}={}){const p=createRiderDevelopmentProfile(profileRaw),curve=ageDevelopmentCurve(p.age),gains={};for(const s of RIDER_SKILLS){const base=(['fitness','roughTerrain'].includes(s)?1.4:1.15)*Number(trainingQuality);gains[s]=developmentGain(p,s,{base,seed,contextKey:`season:${season}`,stress,fatigue:Number(injuryWeeks)*3,motivation:55});if(curve.regression>0&&['fitness','consistency','composure'].includes(s))gains[s]=Math.max(-1.5,gains[s]-curve.regression*(1+Number(injuryWeeks)*.08));}const breakthrough=seeded(`${seed}:breakthrough:${season}:${p.age}`)>.92;if(breakthrough){const s=RIDER_SKILLS[Math.floor(seeded(`${seed}:skill:${season}`)*RIDER_SKILLS.length)%RIDER_SKILLS.length];gains[s]+=1.5+p.traits.learning/100;}return{profile:applyDevelopment(p,gains,{type:breakthrough?'breakthrough':'season-growth',source:'season',season}),gains,breakthrough,stage:curve.stage};}

// Legacy APIs remain available for current callers until migration wave #402.
export function developmentProfile(traits = []) { return traits.reduce((p,key)=>{const t=DEVELOPMENT_TRAITS[key];if(!t)return p;p.traits.push(key);p.growth*=t.growth??1;p.peakAge+=t.peakShift??0;p.transitionModifier+=t.transition??0;p.confidenceModifier+=t.confidence??0;p.ceiling+=t.ceiling??0;return p;},{traits:[],growth:1,peakAge:16,transitionModifier:0,confidenceModifier:0,ceiling:88}); }
export function projectSeasonGrowth(rider,{traits=[],trainingLoad=1,classChanged=false,injuryWeeks=0,schoolStress=0}={}){const profile=developmentProfile(traits),ageDistance=Math.abs((rider.age??12)-profile.peakAge),ageCurve=Math.max(.55,1-ageDistance*.055),injuryDrag=Math.max(.55,1-injuryWeeks*.08),stressDrag=Math.max(.7,1-schoolStress*.004),base=profile.growth*ageCurve*injuryDrag*stressDrag*Math.max(.5,trainingLoad),gains={};for(const skill of LEGACY_SKILLS){const current=rider.skills?.[skill]??40,room=Math.max(0,profile.ceiling-current);gains[skill]=Math.max(0,Math.round(Math.min(6,room*.08*base)));}const transitionPenalty=classChanged?Math.min(0,profile.transitionModifier):0,confidenceDelta=Math.round((classChanged?transitionPenalty:0)+profile.confidenceModifier*.4);return{profile,gains,confidenceDelta,transitionPenalty};}
export function applySeasonGrowth(rider,opts={}){const growth=projectSeasonGrowth(rider,opts),next={...rider,skills:{...rider.skills}};for(const[skill,gain]of Object.entries(growth.gains))next.skills[skill]=clamp((next.skills[skill]??0)+gain);next.confidence=clamp((next.confidence??50)+growth.confidenceDelta);return{rider:next,growth};}
export function transitionReadiness(rider,nextClass,{traits=[],ownedBike=false,parentApproval=true}={}){const profile=developmentProfile(traits),avg=LEGACY_SKILLS.reduce((sum,s)=>sum+(rider.skills?.[s]??40),0)/LEGACY_SKILLS.length,score=Math.round(avg+(rider.confidence??50)*.25+profile.transitionModifier+(ownedBike?10:-18)+(parentApproval?5:-20));return{nextClass,score,ready:score>=65,risks:[!ownedBike?'needs_bike':null,!parentApproval?'needs_parent_approval':null,profile.transitionModifier<-5?'transition_sensitive':null,(rider.confidence??50)<40?'low_confidence':null].filter(Boolean)};}
