import { trackProfileForRace, evolveTrackConditions, resolveRiderTrackFit } from './raceIntelligence.js';

const clamp=(v,lo=0,hi=100)=>Math.max(lo,Math.min(hi,Number(v)||0));
export function restoreVenueKnowledge(raw={}){return {version:2,venues:{...(raw.venues??{})},history:[...(raw.history??[])]};}
export function venueKnowledge(state,venueId){const s=restoreVenueKnowledge(state),v=s.venues[venueId]??{};return {venueId,visits:Number(v.visits??0),practiceSessions:Number(v.practiceSessions??0),motos:Number(v.motos??0),starts:clamp(v.starts??0),lines:clamp(v.lines??0),rhythm:clamp(v.rhythm??0),surface:clamp(v.surface??0),familiarity:clamp(v.familiarity??0),lastWeather:v.lastWeather??null};}
export function learnVenue(state,venueId,{source='practice',weather='clear',trackChange=0,local=false}={}){
 const s=restoreVenueKnowledge(state),v=venueKnowledge(s,venueId),rep=v.practiceSessions+v.motos,base=source==='practice'?14:source==='moto'?8:5,taper=Math.max(.25,1-rep*.09),localBoost=local?2:0,weatherMismatch=v.lastWeather&&v.lastWeather!==weather?0.78:1,changePenalty=1-clamp(trackChange,0,80)/160,gain=Math.max(1,Math.round((base*taper+localBoost)*weatherMismatch*changePenalty));
 const next={...v,visits:v.visits+(source==='visit'?1:0),practiceSessions:v.practiceSessions+(source==='practice'?1:0),motos:v.motos+(source==='moto'?1:0),starts:clamp(v.starts+Math.round(gain*.65)),lines:clamp(v.lines+gain),rhythm:clamp(v.rhythm+Math.round(gain*.8)),surface:clamp(v.surface+Math.round(gain*(weatherMismatch<1?.55:.8))),familiarity:clamp(v.familiarity+gain),lastWeather:weather};
 s.venues[venueId]=next;s.history.push({venueId,source,weather,gain,familiarity:next.familiarity});return {state:s,knowledge:next,gain};
}
export function effectiveFamiliarity(knowledge,{weather='clear',trackChange=0}={}){const k=knowledge??{},mismatch=k.lastWeather&&k.lastWeather!==weather?0.86:1,change=1-clamp(trackChange,0,100)*.0035;return Math.round(clamp(Number(k.familiarity??0)*mismatch*change));}

function observationsFrom({profile,conditions,bike,motoEvents=[]}){
 const obs=[],parts=bike?.parts??{};
 if(conditions.demands.ruts>=75||conditions.demands.cornering>=74)obs.push({area:'front',severity:'medium',text:'Front-end confidence matters here; the bike needs to settle and hold a rut.',recommend:'tight'});
 if(conditions.demands.roughTerrain>=78)obs.push({area:'suspension',severity:'high',text:'The track is getting chopped up. The rear needs to stay calm and drive forward.',recommend:'rough'});
 if(conditions.surface==='mud'||conditions.surface==='drying-mud')obs.push({area:'tires',severity:'high',text:'Traction is changing quickly. Tire choice and clean drive matter more than outright power.',recommend:'mud'});
 if(conditions.demands.speed>=70)obs.push({area:'gearing',severity:'medium',text:'The faster sections reward stability and usable top-end rather than a short, busy setup.',recommend:'fast'});
 if((parts.tires??100)<45)obs.push({area:'tires',severity:'high',text:'Tire life is low enough to compromise grip.',recommend:'change_tires'});
 if((parts.brakes??100)<40)obs.push({area:'service',severity:'high',text:'Brake condition is becoming a race risk.',recommend:'service'});
 if((parts.chain??100)<35||(parts.topEnd??100)<35)obs.push({area:'service',severity:'high',text:'Drivetrain/engine service state needs attention before the next gate.',recommend:'service'});
 if(motoEvents.some(e=>e.kind==='crash'))obs.push({area:'rider_feel',severity:'medium',text:'The crash suggests the current pace/setup combination is asking too much in the technical sections.',recommend:'balanced'});
 return obs.slice(0,5);
}
export function buildSessionDebrief({race,rider,bike,phase='practice',weather='clear',traffic,temperatureF=72,familiarity=0,motoEvents=[],advisor='Dad',advisorQuality=55}={}){
 const profile=trackProfileForRace(race),conditions=evolveTrackConditions(profile,{weather,phase,traffic,temperatureF}),fit=resolveRiderTrackFit(rider,conditions,{familiarity,confidence:rider?.confidence??50}),observations=observationsFrom({profile,conditions,bike,motoEvents});
 const recs=[];for(const o of observations){if(!recs.includes(o.recommend))recs.push(o.recommend);}if(!recs.length)recs.push('balanced');
 const precision=advisorQuality>=75?'high':advisorQuality>=45?'practical':'basic';
 return {version:2,phase,advisor,advisorQuality,precision,profile,conditions,fit,observations,recommendations:recs,headline:phase==='practice'?`${advisor}: “Here’s what I saw in practice.”`:`${advisor}: “Here’s what Moto 1 told us.”`,summary:observations.length?observations.map(o=>o.text).slice(0,2).join(' '):'The bike is behaving predictably. Make changes only if the rider feels something specific.'};
}
export function applyDebriefChoice(weekend={},choice='balanced',{inventory={tires:0},bike={}}={}){
 const next={...weekend,setupChoice:choice,changes:[...(weekend.changes??[])]};let result={ok:true,choice,cost:0};
 if(choice==='change_tires'){
   if(Number(inventory.tires??0)<=0)return {weekend:next,result:{ok:false,choice,reason:'no-tire-inventory'}};
   inventory.tires-=1;if(bike.parts)bike.parts.tires=100;next.changes.push({type:'tires',choice});result={ok:true,choice,consumed:{tires:1},cost:0};
 } else if(choice==='service'){
   next.changes.push({type:'service-check',choice});result={ok:true,choice,note:'Urgent service flagged for mechanic attention.'};
 } else {next.changes.push({type:'setup',choice});}
 return {weekend:next,result};
}
export function weekendIntelligenceRecord(raw={}){return {version:2,venueKnowledge:restoreVenueKnowledge(raw.venueKnowledge),debriefs:[...(raw.debriefs??[])],setupChoice:raw.setupChoice??'balanced',changes:[...(raw.changes??[])]};}
