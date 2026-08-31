// Race Intelligence 2.0 — canonical track demand, condition evolution and rider-fit foundation.
// UI should explain these outputs; it must not own this simulation logic.

export const TRACK_PROFILE_VERSION = 2;
export const TRACK_DEMAND_KEYS = [
  'starts','speed','braking','cornering','ruts','jumping','roughTerrain','lineChoice','racecraft','fitness',
];

const clamp = (v, lo=0, hi=100) => Math.max(lo, Math.min(hi, Number(v) || 0));
const demand = (v) => clamp(v);

export const VENUE_PROFILES = Object.freeze({
  rocky_ridge: profile('rocky_ridge','Rocky Ridge MX',{region:'northeast',soil:'loam',starts:62,speed:54,braking:68,cornering:72,ruts:74,jumping:55,roughTerrain:66,lineChoice:70,racecraft:62,fitness:64,passingDifficulty:58,lineVariety:76,elevation:52}),
  pine_hollow: profile('pine_hollow','Pine Hollow',{region:'northeast',soil:'hardpack',starts:55,speed:72,braking:78,cornering:66,ruts:46,jumping:68,roughTerrain:58,lineChoice:56,racecraft:70,fitness:60,passingDifficulty:70,lineVariety:48,elevation:44}),
  sandy_creek: profile('sandy_creek','Sandy Creek',{region:'northeast',soil:'sand',starts:58,speed:64,braking:42,cornering:62,ruts:58,jumping:52,roughTerrain:84,lineChoice:68,racecraft:56,fitness:88,passingDifficulty:48,lineVariety:72,elevation:28}),
  southeast_red_clay: profile('southeast_red_clay','Red Clay MX',{region:'southeast',soil:'clay',starts:66,speed:68,braking:64,cornering:70,ruts:78,jumping:74,roughTerrain:62,lineChoice:76,racecraft:68,fitness:74,passingDifficulty:62,lineVariety:74,elevation:36}),
});

function profile(id,name,p={}) {
  const demands={}; for(const k of TRACK_DEMAND_KEYS) demands[k]=demand(p[k] ?? 50);
  return Object.freeze({version:TRACK_PROFILE_VERSION,id,name,region:p.region??'unknown',soil:p.soil??'loam',demands,
    passingDifficulty:demand(p.passingDifficulty??50),lineVariety:demand(p.lineVariety??50),elevation:demand(p.elevation??30)});
}

export function venueIdForRace(race={}) {
  const s=String(race.venueId??race.name??'').toLowerCase();
  if(s.includes('rocky')) return 'rocky_ridge'; if(s.includes('pine')) return 'pine_hollow';
  if(s.includes('sandy')) return 'sandy_creek'; if(s.includes('red clay')) return 'southeast_red_clay';
  return race.venueId ?? 'rocky_ridge';
}
export function trackProfileForRace(race={}) { return VENUE_PROFILES[venueIdForRace(race)] ?? VENUE_PROFILES.rocky_ridge; }

// Deterministic: same profile + weather/event phase/traffic always yields the same condition.
export function evolveTrackConditions(baseProfile, input={}) {
  const base=baseProfile ?? VENUE_PROFILES.rocky_ridge;
  const weather=String(input.weather??'clear').toLowerCase(); const phase=String(input.phase??'moto1').toLowerCase();
  const traffic=clamp(input.traffic ?? (phase==='practice'?20:phase==='moto2'?80:55));
  const temp=Number(input.temperatureF ?? 72); const drying=clamp(input.drying ?? (temp>78?55:30));
  const d={...base.demands}; let surface=base.soil; const notes=[];
  if(weather.includes('rain')||weather.includes('storm')) { surface='mud'; d.ruts+=18; d.lineChoice+=15; d.braking+=12; d.speed-=12; d.jumping+=8; notes.push('Rain is building mud and deeper ruts, making line choice and braking more important.'); }
  if(weather.includes('wind')) { d.jumping+=12; d.speed+=5; notes.push('Wind makes jump timing and high-speed commitment less predictable.'); }
  if(temp>=88||weather.includes('heat')) { d.fitness+=14; notes.push('Heat raises the physical demand as the motos wear on.'); }
  if(temp<=45||weather.includes('cold')) { d.starts+=5; d.braking+=4; notes.push('Cold conditions reduce early grip and make warm-up execution matter.'); }
  if(drying>=65 && surface==='mud') { surface='drying-mud'; d.ruts+=8; d.lineChoice+=8; notes.push('The surface is drying unevenly, leaving tacky lines beside slick patches.'); }
  d.roughTerrain += Math.round(traffic*0.22); d.ruts += Math.round(traffic*0.16); d.lineChoice += Math.round(traffic*0.10);
  if(traffic>=65) notes.push('Race traffic has developed chop and ruts since the earlier sessions.');
  if(base.soil==='hardpack' && !weather.includes('rain')) { surface='hardpack'; d.braking+=7; d.cornering+=5; }
  if(base.soil==='sand') { d.roughTerrain+=8; d.fitness+=7; }
  for(const k of TRACK_DEMAND_KEYS) d[k]=clamp(d[k]);
  return {version:2,venueId:base.id,phase,weather,temperatureF:temp,traffic,drying,surface,demands:d,notes};
}

const SKILL_MAP={
  starts:[['starts',1]], speed:[['adaptability',.45],['consistency',.25],['fitness',.3]], braking:[['braking',.75],['cornering',.25]],
  cornering:[['cornering',.65],['lineChoice',.2],['consistency',.15]], ruts:[['ruts',.65],['cornering',.2],['adaptability',.15]],
  jumping:[['jumping',.7],['composure',.15],['adaptability',.15]], roughTerrain:[['roughTerrain',.6],['fitness',.25],['adaptability',.15]],
  lineChoice:[['lineChoice',.65],['racecraft',.2],['adaptability',.15]], racecraft:[['racecraft',.7],['composure',.15],['lineChoice',.15]], fitness:[['fitness',1]],
};
function skillValue(skills,key){ const aliases={roughTerrain:['roughTerrain','whoops'],lineChoice:['lineChoice','raceIQ'],racecraft:['racecraft','raceIQ'],composure:['composure','consistency'],adaptability:['adaptability','consistency'],braking:['braking','cornering'],ruts:['ruts','cornering']}; for(const k of aliases[key]??[key]) if(Number.isFinite(skills?.[k])) return clamp(skills[k]); return 50; }

export function resolveRiderTrackFit(rider={}, trackOrCondition, opts={}) {
  const demands=trackOrCondition?.demands ?? trackOrCondition?.profile?.demands ?? VENUE_PROFILES.rocky_ridge.demands;
  const skills=rider.skills ?? rider; const rows=[]; let weighted=0,totalWeight=0;
  for(const key of TRACK_DEMAND_KEYS){ const req=clamp(demands[key]); const mappings=SKILL_MAP[key]??[[key,1]]; const competency=mappings.reduce((s,[skill,w])=>s+skillValue(skills,skill)*w,0); const weight=Math.max(.15,req/100); const margin=competency-req; weighted+=margin*weight; totalWeight+=weight; rows.push({demand:key,required:Math.round(req),competency:Math.round(competency),margin:Math.round(margin)}); }
  const familiarity=clamp(opts.familiarity??rider.familiarity??0); const confidence=clamp(opts.confidence??rider.confidence??50);
  const executionModifier=(familiarity-50)*0.035+(confidence-50)*0.025; // deliberately small: execution, not talent replacement.
  const raw=weighted/Math.max(.1,totalWeight); const score=clamp(50+raw*.55+executionModifier);
  const strengths=rows.filter(r=>r.margin>=8).sort((a,b)=>b.margin-a.margin).slice(0,3); const weaknesses=rows.filter(r=>r.margin<=-8).sort((a,b)=>a.margin-b.margin).slice(0,3);
  const uncertainty=Math.round(clamp(18-(familiarity*.10)+(Math.abs(confidence-50)*.04),5,22));
  return {version:2,score:Math.round(score),rawMargin:Number(raw.toFixed(2)),executionModifier:Number(executionModifier.toFixed(2)),familiarity,confidence,uncertainty,strengths,weaknesses,breakdown:rows,
    summary: weaknesses.length ? `Track fit is challenged most by ${weaknesses.map(x=>x.demand).join(', ')}.` : strengths.length ? `Rider strengths match ${strengths.map(x=>x.demand).join(', ')}.` : 'Balanced rider-to-track fit with no dominant mismatch.'};
}

export function raceIntelligenceFor(rider,race,input={}) { const profile=trackProfileForRace(race); const conditions=evolveTrackConditions(profile,input); return {profile,conditions,fit:resolveRiderTrackFit(rider,conditions,input)}; }
