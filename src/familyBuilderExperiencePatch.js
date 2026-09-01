import { Game, SIM_DEPTHS } from './game.js';
import { familyStory, initializeFamilyBuilder, ensureFamilyBuilderInitialized } from './systems/familyBuilderExperience.js';

const CHOICES={
  finance:[['tight','Tight','Every race takes sacrifice. Used equipment and skipped events may be part of the story.'],['comfortable','Comfortable','Racing fits the family budget, but big trips and new bikes still require choices.'],['well_off','Well-off','There is room to invest in racing, with expectations that can grow with it.'],['wealthy','Wealthy','Money removes some barriers, but results and expectations can become the pressure.']],
  knowledge:[['new','New to motocross','Your family is learning the sport together. Advice and connections must be earned.'],['weekend','Weekend racing family','Your family knows local racing and the basics of keeping a program going.'],['motocross_family','Motocross family','Racing has been part of family life for years.'],['industry','Industry family','Your family begins with deep racing, mechanical, coaching, shop, or industry knowledge.']],
  household:[['two_parent','Two-parent household','Two adults can share support roles, time, money, and race-weekend responsibilities.'],['single_parent','Single-parent household','One parent carries more of the logistics, money, and emotional load.'],['split_household','Split / co-parenting household','Support exists across two households, with availability and logistics that can change week to week.'],['guardian_household','Grandparent / guardian household','A guardian becomes the central adult in the rider’s life and racing story.']],
  school:[['public','Public school','Traditional weekday schedule with meaningful absence and travel pressure.'],['private','Private school','Structured academics and higher family cost pressure.'],['homeschool','Homeschool','More travel flexibility, but schoolwork still has to get done.'],['online','Online / flexible school','Flexible location and scheduling with real coursework obligations.']],
  support:[['family_diy','We do everything ourselves','Family labor keeps costs down, but takes real time and energy.'],['guardian_mechanic','Parent / guardian is the mechanic','A family member handles most bike work and becomes central to setup decisions.'],['local_shop','Local shop helps us','A recurring dealer/shop relationship adds expertise at a real cost.'],['professional','Professional help','Less family labor and stronger technical support, but a much larger operating cost.'],['hybrid','Hybrid support','Split the workload between family effort and outside help.']],
  home:[['minimal','Small home / minimal storage','Bike storage and wrenching space are tight. Expansion will matter later.'],['basic','Typical home + basic garage','A believable family starting point with some storage and wrenching capacity.'],['workshop','Home with usable workshop','More tools and workspace, but the family still has to fund the racing program.'],['rural','Rural property','Room to work and eventually ride at home, balanced by greater property upkeep.']],
};
const STEPS=['family-finance','family-knowledge','family-household','family-school','family-support','family-home','family-review','options'];

function h(tag,props={},...kids){const n=document.createElement(tag);for(const [k,v] of Object.entries(props)){if(k==='class')n.className=v;else if(k==='html')n.innerHTML=v;else if(k.startsWith('on')&&typeof v==='function')n.addEventListener(k.slice(2).toLowerCase(),v);else if(v!==false&&v!=null)n.setAttribute(k,v);}for(const kid of kids.flat()){if(kid==null||kid===false)continue;n.appendChild(typeof kid==='string'||typeof kid==='number'?document.createTextNode(String(kid)):kid);}return n;}
function ensureOnboard(o){o.family??={financial:'comfortable',motocrossKnowledge:'weekend',household:'two_parent',school:'public'};o.familySupport??={supportModel:'family_diy',home:'basic',assignments:{}};return o;}
function selectedButton(o,key,value,label,blurb,onPick){return h('button',{class:'choice'+(value===key?' sel':''),'data-testid':`family-choice-${key}`,onclick:onPick},h('b',{},label),h('div',{class:'tip'},blurb));}

export function installFamilyBuilderExperiencePatch(App){
  if(App.prototype.__familyBuilderExperienceInstalled)return;
  App.prototype.__familyBuilderExperienceInstalled=true;
  const originalRenderTitle=App.prototype.renderTitle;
  const originalContinue=App.prototype.continueGame;

  App.prototype.renderTitle=function familyBuilderRenderTitle(...args){
    if(this.onboard?.step==='background')this.onboard.step='family-finance';
    if(!this.onboard||!STEPS.includes(this.onboard.step))return originalRenderTitle.apply(this,args);
    const o=ensureOnboard(this.onboard);const go=(step)=>{o.step=step;this.renderTitle();};
    const header=h('div',{class:'title-wrap'},h('div',{class:'logo-mark'},'🏍️'),h('h1',{},'Legacy: Motocross'),h('div',{class:'tagline'},'Build your rider. Build your family. Build a life around racing.'));
    const familySteps=STEPS.slice(0,7);const idx=familySteps.indexOf(o.step);
    const progress=idx>=0?h('div',{class:'eyebrow','data-testid':'family-builder-progress'},`Build Your Family Life · ${idx+1} of ${familySteps.length}`):null;
    let card;
    const choiceCard=(title,copy,rows,current,pick,back,next)=>h('div',{class:'card','data-testid':`family-builder-${o.step}`},progress,h('h2',{},title),h('p',{class:'small faint'},copy),...rows.map(([key,label,blurb])=>selectedButton(o,key,current,label,blurb,()=>{pick(key);this.renderTitle();})),h('div',{class:'toolbar'},h('button',{class:'btn ghost',onclick:()=>go(back)},'‹ Back'),h('button',{class:'btn primary',onclick:()=>go(next)},'Next ›')));

    if(o.step==='family-finance')card=choiceCard('Where does your family stand financially?','Choose the family’s starting circumstances—not a difficulty level.',CHOICES.finance,o.family.financial,v=>o.family.financial=v,'identity','family-knowledge');
    else if(o.step==='family-knowledge')card=choiceCard('What does your family know about motocross?','Knowledge changes advice, wrenching confidence, and connections—not rider speed.',CHOICES.knowledge,o.family.motocrossKnowledge,v=>o.family.motocrossKnowledge=v,'family-finance','family-household');
    else if(o.step==='family-household')card=choiceCard('Who are you growing up with?','This creates the persistent adults who will sacrifice, help, argue, wrench, travel, and grow with your career.',CHOICES.household,o.family.household,v=>o.family.household=v,'family-knowledge','family-school');
    else if(o.step==='family-school')card=choiceCard('What is school life like?','School changes time and travel pressure. Flexible school does not grant free skill.',CHOICES.school,o.family.school,v=>o.family.school=v,'family-household','family-support');
    else if(o.step==='family-support')card=choiceCard('How does your family keep you racing?','Choose how bike work and race-weekend support get done.',CHOICES.support,o.familySupport.supportModel,v=>o.familySupport.supportModel=v,'family-school','family-home');
    else if(o.step==='family-home')card=choiceCard('Where does the racing program live?','Your starting home controls storage, workspace, upkeep, and what can eventually be built.',CHOICES.home,o.familySupport.home,v=>o.familySupport.home=v,'family-support','family-review');
    else if(o.step==='family-review'){
      const story=familyStory(o.family,o.familySupport,{age:Math.max(3,new Date().getFullYear()-parseInt(String(o.birthdate).slice(0,4),10))});
      card=h('div',{class:'card','data-testid':'family-story-review'},progress,h('div',{class:'eyebrow'},'Your Story'),h('h2',{},story.title),h('p',{class:'small muted'},story.subtitle),h('p',{'data-testid':'family-story-narrative'},story.narrative),h('div',{class:'field'},h('label',{},'Starting strengths'),h('div',{class:'tip','data-testid':'family-story-strengths'},story.strengths.length?story.strengths.join(' · '):'A clean slate and room to grow.')),h('div',{class:'field'},h('label',{},'Starting pressures'),h('div',{class:'tip','data-testid':'family-story-pressures'},story.pressures.length?story.pressures.join(' · '):'No major starting pressure dominates the family.')),h('div',{class:'field'},h('label',{},'Home & equipment'),h('div',{class:'tip'},`${story.starting.home} · ${story.starting.equipment} equipment posture · ${story.starting.storage} storage`)),h('div',{class:'toolbar'},h('button',{class:'btn ghost',onclick:()=>go('family-home')},'‹ Edit'),h('button',{class:'btn primary','data-testid':'family-story-continue',onclick:()=>go('options')},'Looks right ›')));
    } else {
      card=h('div',{class:'card','data-testid':'family-builder-options'},h('div',{class:'eyebrow'},'Final step'),h('h2',{},'How do you want to play?'),h('div',{class:'field'},h('label',{},'Simulation depth'),h('div',{class:'depth-grid'},...Object.values(SIM_DEPTHS).map(d=>h('div',{class:'depth-card'+(o.depth===d.key?' selected':''),onclick:()=>{o.depth=d.key;this.renderTitle();}},h('b',{},d.label),h('div',{class:'small muted'},d.blurb))))),h('p',{class:'small faint'},'Your family choices are starting circumstances. They can change as the career and life evolve.'),h('div',{class:'toolbar'},h('button',{class:'btn ghost',onclick:()=>go('family-review')},'‹ Back'),h('button',{class:'btn primary','data-testid':'family-builder-begin',onclick:()=>this.startGame({...o})},`Begin — ${new Date().getFullYear()} Season`)));
    }
    this.root.replaceChildren(h('div',{},header,card,h('p',{class:'faint small center'},'Prototype · Legacy Studios · Build memories, not mechanics.')));window.scrollTo(0,0);
  };

  App.prototype.startGame=function startGameWithFamilyBuilder(o){
    this.clearSave();
    const cfg=ensureOnboard(o);
    this.game=new Game({riderName:cfg.name,depth:cfg.depth,birthdate:cfg.birthdate,campaign:cfg.campaign,avatar:cfg.avatar,background:null,seed:Date.now()});
    initializeFamilyBuilder(this.game,cfg.family,cfg.familySupport,{baseCash:1200});
    this._wireGameAnalytics(this.game);
    this._track('career_started',{campaign:cfg.campaign,background:'family_builder_2',depth:cfg.depth,klass:this.game.rider.klass,familyFinancial:cfg.family.financial,familySchool:cfg.family.school});
    this.onboard=null;this.tab='week';this.saveGame();this.startWeek();
  };

  App.prototype.continueGame=function continueWithFamilyMigration(...args){
    const result=originalContinue.apply(this,args);
    if(this.game){ensureFamilyBuilderInitialized(this.game);this.saveGame();this.render();}
    return result;
  };
}
