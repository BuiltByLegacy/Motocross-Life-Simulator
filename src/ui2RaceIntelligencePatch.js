import { buildSessionDebrief, learnVenue, effectiveFamiliarity, applyDebriefChoice, weekendIntelligenceRecord } from './systems/raceWeekendIntelligence.js';
import { venueIdForRace } from './systems/raceIntelligence.js';

function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=String(text);return n;}
function add(parent,...kids){kids.flat().filter(Boolean).forEach(k=>parent.appendChild(k));return parent;}
function stateFor(g){g.state.raceWeekendIntelligence=weekendIntelligenceRecord(g.state.raceWeekendIntelligence);return g.state.raceWeekendIntelligence;}
function advisorFor(g){const supported=g.state?.supportInfrastructure?.mechanic??0;return supported>=70?{name:'Mechanic',quality:supported}:{name:'Dad',quality:Math.max(45,Number(g.family?.support??55))};}
function weatherFor(g){return g.meta()?.race?.weather??g.state?.weather?.label??'clear';}

export function installUi2RaceIntelligencePatch(App){
 if(!App?.prototype||App.prototype.__ui2RaceIntelligenceInstalled)return;App.prototype.__ui2RaceIntelligenceInstalled=true;
 const originalStart=App.prototype.startInteractiveRace, originalContinue=App.prototype.onMotoContinue, originalIntro=App.prototype.viewRaceIntro, originalMoto=App.prototype.viewMoto, originalResult=App.prototype.viewRaceResult;
 App.prototype._raceIntelDebrief=function(phase){
   const g=this.game,race=this.race?.race??g.meta()?.race??{},rec=stateFor(g),venueId=venueIdForRace(race),advisor=advisorFor(g),weather=weatherFor(g),knowledge=rec.venueKnowledge.venues[venueId]??{};
   const familiarity=effectiveFamiliarity(knowledge,{weather,trackChange:phase==='moto1'?25:5});
   const report=buildSessionDebrief({race,rider:g.rider,bike:this.race?.bike??g.bike,phase:phase==='moto1'?'moto1':'practice',weather,traffic:phase==='moto1'?72:20,temperatureF:g.state?.weather?.temperatureF??72,familiarity,motoEvents:this.race?.motoEvents??[],advisor:advisor.name,advisorQuality:advisor.quality});
   const learned=learnVenue(rec.venueKnowledge,venueId,{source:phase==='practice'?'practice':'moto',weather,trackChange:phase==='moto1'?25:5,local:true});rec.venueKnowledge=learned.state;report.learning={gain:learned.gain,knowledge:learned.knowledge};rec.debriefs.push(report);this._activeRaceDebrief=report;this.saveGame?.();
   this.weekContent=()=>this.viewRaceIntelligenceDebrief();this.render();
 };
 App.prototype.viewRaceIntelligenceDebrief=function(){
   const r=this._activeRaceDebrief,root=el('section','race2 race-intel-debrief');root.dataset.testid=`race-intel-${r.phase}-debrief`;
   add(root,add(el('div','race2-hero'),add(el('div'),el('small','race2-kicker',r.phase==='practice'?'PRACTICE DEBRIEF':'MOTO 1 DEBRIEF'),el('h1','',r.headline),el('p','',r.summary))));
   add(root,add(el('div','race2-callout'),el('small','','WHAT YOU LEARNED'),el('strong','',`+${r.learning?.gain??0} familiarity · ${r.conditions.surface} · ${r.precision} ${r.advisor.toLowerCase()} feedback`)));
   const list=el('div','race2-feed');for(const o of r.observations)add(list,add(el('div',o.severity==='high'?'warn':''),el('strong','',o.area.toUpperCase()),el('span','',o.text)));add(root,list);
   const choices=add(el('div','race2-actions'));const labels={balanced:'KEEP CURRENT SETUP',tight:'MORE TURNING / TECHNICAL',fast:'MORE STABILITY / FAST',rough:'CALM THE CHOP',mud:'MUD / TRACTION SETUP',change_tires:'CHANGE TIRES',service:'MECHANIC CHECK'};
   for(const choice of ['balanced',...r.recommendations].filter((v,i,a)=>a.indexOf(v)===i).slice(0,4)){const b=el('button',choice==='balanced'?'race2-secondary':'race2-primary',labels[choice]??choice);b.dataset.testid=`race-intel-choice-${choice}`;b.onclick=()=>this.applyRaceIntelligenceDebrief(choice);choices.appendChild(b);}add(root,choices);return root;
 };
 App.prototype.applyRaceIntelligenceDebrief=function(choice){
   const g=this.game,rec=stateFor(g),phase=this._activeRaceDebrief?.phase??'practice',inventory=g.state?.equipmentConsumables?.inventory??g.state?.consumables??{tires:0},bike=this.race?.bike??g.bike;
   const applied=applyDebriefChoice(rec,choice,{inventory,bike});if(!applied.result.ok)return;g.state.raceWeekendIntelligence=applied.weekend;this.saveGame?.();this._activeRaceDebrief=null;
   if(phase==='practice'){this._practiceDebriefDone=true;originalStart.call(this);return;}this.race.startNextMoto();this.weekContent=()=>this.viewMoto();this.render();
 };
 App.prototype.startInteractiveRace=function(){if(!this._practiceDebriefDone){this._raceIntelDebrief('practice');return;}return originalStart.call(this);};
 App.prototype.onMotoContinue=function(){if(this.race?.motoOver&&this.race?.hasNextMoto()&&this.race.motoIndex===0&&!this._moto1DebriefDone){this.race.finishMoto();this._moto1DebriefDone=true;this._raceIntelDebrief('moto1');return;}return originalContinue.call(this);};
 App.prototype.viewRaceIntro=function(){const root=originalIntro.call(this),g=this.game,race=g.meta()?.race??{},rec=stateFor(g),venueId=venueIdForRace(race),knowledge=rec.venueKnowledge.venues[venueId]??{};const box=add(el('div','race2-callout'),el('small','','TRACK INTELLIGENCE'),el('strong','',`${venueId.replaceAll('_',' ')} · ${Math.round(knowledge.familiarity??0)} familiarity`),el('span','', ' Practice will give Dad/mechanic feedback before Moto 1.'));root.querySelector('.race2-actions')?.before(box);return root;};
 App.prototype.viewMoto=function(){const root=originalMoto.call(this);if(this.race?.motoOver&&this.race?.hasNextMoto()&&this.race.motoIndex===0){const b=root.querySelector('.race2-primary.wide');if(b)b.textContent='REVIEW MOTO 1 WITH DAD / MECHANIC →';}return root;};
 App.prototype.viewRaceResult=function(result){const root=originalResult.call(this,result),rec=stateFor(this.game);if(rec.debriefs.length){const last=rec.debriefs.at(-1),box=add(el('div','race2-callout'),el('small','','WEEKEND LEARNING'),el('strong','',`${rec.debriefs.length} debriefs · setup: ${rec.setupChoice}`),el('span','',last.summary));root.querySelector('.race2-consequences')?.after(box);}return root;};
}
