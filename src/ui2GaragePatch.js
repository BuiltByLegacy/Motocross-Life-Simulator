function node(tag, cls, text) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text != null) el.textContent = String(text);
  return el;
}
function add(parent, ...children) { children.filter(Boolean).forEach((c) => parent.appendChild(c)); return parent; }
function safe(value, fallback = '—') { return value == null || value === '' ? fallback : value; }
function ensureGarageStyles() { if (document.querySelector('link[data-ui2-garage-styles]')) return; const link=document.createElement('link'); link.rel='stylesheet'; link.href='./ui2Garage.css'; link.dataset.ui2GarageStyles='true'; document.head.appendChild(link); }
function go(app, tab) { app.tab=tab; app.render(); try { window.scrollTo(0,0); } catch (_) {} }
function riderState(app) { const g=app.game; const rider=g?.rider??g?.state?.rider??{}; const bike=g?.bike??g?.state?.bike??{}; const date=g?.monthCalendar?.dateForWeek?.(g.week)??null; const dateLabel=date instanceof Date?date.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}):`Season ${safe(g?.state?.seasonNumber,1)} · Week ${safe(g?.week,1)}`; const money=g?.money??g?.state?.money??g?.state?.household?.money??0; const condition=bike?.condition??g?.state?.bikeCondition??null; const fatigue=rider?.fatigue??g?.state?.fatigue??0; const confidence=rider?.confidence??g?.state?.confidence??null; return {g,rider,bike,dateLabel,money,condition,fatigue,confidence}; }
function attentionFor(s) { if(Number(s.condition)<35)return{kind:'danger',kicker:'BIKE NEEDS ATTENTION',title:'Garage time before the next ride',action:'Open bike',tab:'garage'}; if(Number(s.fatigue)>=65)return{kind:'warn',kicker:'RECOVERY',title:'Back off and recover this week',action:'Plan the week',tab:'week'}; if(Number(s.money)<100)return{kind:'warn',kicker:'FAMILY BUDGET',title:'Money is tight — choose the next trip carefully',action:'View calendar',tab:'week'}; return{kind:'normal',kicker:'THIS WEEK',title:'Home week · ride, learn, prep, live',action:'Plan the week',tab:'week'}; }
function buildGarage(app) {
  const s=riderState(app), focus=attentionFor(s), root=node('section','garage2'); root.dataset.testid='ui2-garage-home';
  const identity=node('header','garage2-identity'), name=safe(s.rider?.name,'Rider'), klass=safe(s.rider?.klass,'50cc');
  add(identity,add(node('div','garage2-rider'),node('div','garage2-number',safe(s.rider?.number,'27')),add(node('div'),node('strong','',name),node('span','',`${klass} · ${s.dateLabel}`))),add(node('div','garage2-cash'),node('small','','AVAILABLE'),node('strong','',`$${Number(s.money||0).toLocaleString()}`)));
  const scene=node('div','garage2-scene'); scene.dataset.testid='garage-world-hero'; add(scene,add(node('div','garage2-scene-copy'),node('span','garage2-kicker','HOME BASE'),node('h1','','GARAGE'),node('p','','The bikes, work and memories that make this life yours.')),add(node('div','garage2-bike-silhouette'),node('span','','27'),node('small','',klass)),add(node('div','garage2-wall'),node('span','','RIDE'),node('span','','LEARN'),node('span','','REMEMBER')));
  const focusEl=node('button',`garage2-focus ${focus.kind}`); focusEl.type='button'; focusEl.dataset.testid='garage-primary-action'; focusEl.onclick=()=>go(app,focus.tab); add(focusEl,add(node('span'),node('small','',focus.kicker),node('strong','',focus.title)),node('b','',`${focus.action} →`));
  const objects=node('div','garage2-objects'); [['BIKE',Number(s.condition)<35?'Needs work':'Ready to ride','garage','bike'],['NEXT UP','Open the season board','week','calendar'],['PEOPLE','Family · rivals · coaches','people','people'],['MEMORIES','Photos · milestones · history','journal','memory']].forEach(([label,detail,tab,id])=>{const b=node('button',`garage2-object ${id}`); b.type='button'; b.dataset.testid=`garage-object-${id}`; b.onclick=()=>go(app,tab); add(b,node('small','',label),node('strong','',detail),node('span','','Open →')); objects.appendChild(b);});
  const pulse=node('div','garage2-pulse'), facts=[]; if(s.confidence!=null)facts.push(['CONFIDENCE',`${s.confidence}`,Number(s.confidence)>=60?'Building':'Keep riding']); facts.push(['FATIGUE',`${safe(s.fatigue,0)}`,Number(s.fatigue)>=65?'Recovery matters':'Fresh']); if(s.condition!=null)facts.push(['BIKE',`${s.condition}%`,Number(s.condition)<35?'Service now':'Ready']); facts.slice(0,3).forEach(([k,v,note])=>add(pulse,add(node('div'),node('small','',k),node('strong','',v),node('span','',note))));
  add(root,identity,scene,focusEl,objects,pulse); return root;
}
export function installUi2GaragePatch(App) {
  if(!App||App.prototype.__ui2GarageInstalled)return; App.prototype.__ui2GarageInstalled=true; ensureGarageStyles();
  const priorRender=App.prototype.render;
  App.prototype.render=function renderGarage2(){
    priorRender.call(this); if(!this.game||this.tab!=='garage')return;
    const screen=this.root?.querySelector('.screen'), scroll=this.root?.querySelector('.scroll-area'), head=this.root?.querySelector('.sticky-head'); if(!scroll)return;
    // Sponsorship hardening owns live compliance actions. Preserve that domain UI
    // as a contextual garage station instead of deleting it during visual migration.
    const sponsorStation=scroll.querySelector('[data-s2-garage="brand-compliance"]');
    screen?.classList.add('garage2-screen'); head?.classList.add('garage2-legacy-head');
    const garage=buildGarage(this);
    if(sponsorStation){ const station=node('section','garage2-sponsor-station'); add(station,node('div','garage2-station-label','SPONSOR WORKBENCH'),sponsorStation); garage.appendChild(station); }
    scroll.replaceChildren(garage);
  };
}