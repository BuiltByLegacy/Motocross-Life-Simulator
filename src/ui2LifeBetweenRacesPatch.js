import { openLifeBetweenRaces } from './systems/lifeBetweenRacesGame.js';
import { expandedLifeBetweenRacesChoices, takeExpandedLifeBetweenRacesDecision } from './systems/lifeBetweenRacesExpandedGame.js';

function el(tag, cls, text) { const n=document.createElement(tag); if(cls)n.className=cls; if(text!=null)n.textContent=String(text); return n; }
function add(p,...c){c.filter(Boolean).forEach(x=>p.appendChild(x));return p;}
function ensureStyles(){ if(document.querySelector('link[data-ui2-lbr]'))return; const l=document.createElement('link'); l.rel='stylesheet'; l.href='./ui2LifeBetweenRaces.css'; l.dataset.ui2Lbr='1'; document.head.appendChild(l); }
function familyLabel(f){ return ({training:'Training',recovery:'Recovery',maintenance:'Garage Prep',responsibility:'Life Responsibilities',prep:'Race Prep',relationship:'People & Life'})[f]??f; }

function buildScene(app){
  const game=app.game; if(!game)return null;
  const opened=openLifeBetweenRaces(game); if(!opened?.period)return null;
  const choices=expandedLifeBetweenRacesChoices(game)??[];
  const recommended=choices.find(c=>c.recommended)??choices[0];
  const root=el('section','lbr2-scene'); root.dataset.testid='life-between-races-scene';
  add(root, el('span','lbr2-kicker','BETWEEN RACES'), el('h2','',recommended?familyLabel(recommended.family):'This Week Matters'));
  const used=Number(opened.period.timeUsed??0), total=Number(opened.period.timeBudget??0);
  add(root, el('p','lbr2-context',`${Math.max(0,total-used)} of ${total} time slots left. Training, recovery, bike work, family, money, travel prep and people all compete for the same week.`));
  const list=el('div','lbr2-actions');
  const firstByFamily=[]; const seen=new Set();
  for(const choice of choices){ if(seen.has(choice.family))continue; seen.add(choice.family); firstByFamily.push(choice); }
  firstByFamily.slice(0,6).forEach((choice)=>{
    const b=el('button',`lbr2-action${choice.recommended?' recommended':''}`); b.type='button'; b.dataset.testid=`lbr-choice-${choice.family}`;
    add(b,el('small','',choice.recommended?'RECOMMENDED':'OPTION'),el('strong','',familyLabel(choice.family)),el('span','',choice.description??choice.label??'Open this part of the week'));
    b.onclick=()=>{ takeExpandedLifeBetweenRacesDecision(game,choice); app.render(); };
    list.appendChild(b);
  });
  add(root,list);
  return root;
}

export function installUi2LifeBetweenRacesPatch(App){
  if(!App||App.prototype.__ui2LbrInstalled)return; App.prototype.__ui2LbrInstalled=true; ensureStyles();
  const prior=App.prototype.render;
  App.prototype.render=function renderLbr2(){
    prior.call(this);
    if(!this.game || !['garage','week'].includes(this.tab))return;
    const scene=buildScene(this); if(!scene)return;
    const host=this.root?.querySelector('.scroll-area'); if(!host)return;
    host.querySelector('[data-testid="life-between-races-scene"]')?.remove();
    if(this.tab==='garage') host.prepend(scene); else host.append(scene);
  };
}
