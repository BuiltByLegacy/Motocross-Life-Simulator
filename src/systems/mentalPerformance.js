const clamp=(v,lo=0,hi=100)=>Math.max(lo,Math.min(hi,Number(v)||0));
const clampSigned=(v)=>Math.max(-100,Math.min(100,Number(v)||0));

export function createMentalState(raw={}){return{version:1,confidence:clamp(raw.confidence??50),momentum:clampSigned(raw.momentum??0),pressure:clamp(raw.pressure??35),composure:clamp(raw.composure??50),streak:Number(raw.streak??0),history:Array.isArray(raw.history)?raw.history.map(x=>({...x})):[]};}

export const MENTAL_EVENTS=Object.freeze({
  win:{confidence:7,momentum:13,pressure:-2,streak:1,label:'A win reinforced belief.'},
  podium:{confidence:4,momentum:8,pressure:-1,streak:1,label:'A podium built momentum.'},
  solid:{confidence:1,momentum:3,pressure:-1,streak:0,label:'A solid ride steadied things.'},
  poor:{confidence:-4,momentum:-7,pressure:5,streak:-1,label:'A poor result added pressure.'},
  dnf:{confidence:-7,momentum:-12,pressure:7,streak:-1,label:'A DNF shook confidence.'},
  injury:{confidence:-9,momentum:-15,pressure:8,streak:-1,label:'Injury interrupted rhythm.'},
  rivalry_win:{confidence:3,momentum:5,pressure:-2,streak:1,label:'Winning a rivalry battle mattered.'},
  rivalry_loss:{confidence:-2,momentum:-4,pressure:4,streak:-1,label:'A rivalry loss raised the stakes.'},
  prepared:{confidence:3,momentum:2,pressure:-5,streak:0,label:'Good preparation made the weekend feel manageable.'},
  coaching:{confidence:2,momentum:1,pressure:-4,streak:0,label:'Coaching gave the rider a clearer plan.'},
  rest:{confidence:1,momentum:0,pressure:-5,streak:0,label:'Rest lowered the noise.'},
  smaller_win:{confidence:4,momentum:6,pressure:-4,streak:1,label:'A smaller win helped rebuild belief.'},
  major_event:{confidence:0,momentum:0,pressure:12,streak:0,label:'A major event carries more pressure.'},
  expectation:{confidence:0,momentum:0,pressure:8,streak:0,label:'Expectations increased pressure.'},
});

export function applyMentalEvent(raw,event,{scale=1,source=null,note=''}={}){
  const s=createMentalState(raw),e=MENTAL_EVENTS[event];if(!e)return{state:s,error:'unknown-event',entry:null};
  const positive=(e.momentum??0)>0,negative=(e.momentum??0)<0;
  const streakBoost=positive?1+Math.min(.35,Math.max(0,s.streak)*.08):negative?1+Math.min(.35,Math.max(0,-s.streak)*.08):1;
  const before={...s};
  s.confidence=clamp(s.confidence+e.confidence*scale);
  s.momentum=clampSigned(s.momentum+e.momentum*scale*streakBoost);
  s.pressure=clamp(s.pressure+e.pressure*scale);
  if(e.streak>0)s.streak=s.streak>=0?s.streak+1:1;else if(e.streak<0)s.streak=s.streak<=0?s.streak-1:-1;
  const entry={event,label:e.label,source,note,dConfidence:Math.round(s.confidence-before.confidence),dMomentum:Math.round(s.momentum-before.momentum),dPressure:Math.round(s.pressure-before.pressure),streak:s.streak};
  s.history.push(entry);return{state:s,error:null,entry};
}

export function executionModifier(raw){
  const s=createMentalState(raw),belief=(s.confidence-50)*.08,streak=s.momentum*.055,pressurePenalty=Math.max(0,s.pressure-s.composure)*.12,bonus=Math.max(-12,Math.min(10,belief+streak-pressurePenalty));
  return{execution:Math.round(bonus*10)/10,baseTalentModifier:0,state:s,band:bonus>=6?'hot':bonus<=-6?'slump':bonus<=-2?'tight':'steady'};
}

export function mentalExplanation(raw){const x=executionModifier(raw);if(x.band==='hot')return'You are riding with belief right now. Keep the routine simple.';if(x.band==='slump')return'Confidence is low and pressure is affecting execution more than your underlying ability.';if(x.band==='tight')return'You have the speed, but pressure is making clean execution harder.';return'Mental state is steady. Preparation is translating normally.';}

export function recoveryOptions(raw){const s=createMentalState(raw),slump=s.streak<=-2||s.momentum<=-25||s.confidence<40;return[{id:'prepared',label:'Build a clear plan',recommended:slump&&s.pressure>50},{id:'smaller_win',label:'Choose a manageable confidence-builder',recommended:slump&&s.confidence<40},{id:'coaching',label:'Work with a coach',recommended:slump&&s.pressure>=45},{id:'rest',label:'Take pressure off for a week',recommended:slump&&s.momentum<-35}];}
