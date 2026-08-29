function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = String(text);
  return n;
}
function add(parent, ...kids) { kids.flat().filter(Boolean).forEach((k) => parent.appendChild(k)); return parent; }
function ensureStyles() {
  if (document.querySelector('link[data-ui2-race-styles]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './ui2RaceWeekend.css';
  link.dataset.ui2RaceStyles = 'true';
  document.head.appendChild(link);
}
function ordinal(n) { const x=Number(n); const s=['th','st','nd','rd'], v=x%100; return `${x}${s[(v-20)%10]||s[v]||s[0]}`; }
function contextualFacts(g) {
  const race = g.meta()?.race || {};
  return [
    ['WEATHER', race.weather || g.state?.weather?.label || 'Track-day conditions'],
    ['BIKE', `${Math.round(g.bike?.condition ?? 0)}% condition`],
    ['RIDER', `${Math.round(g.rider?.fatigue ?? 0)} fatigue · ${Math.round(g.rider?.confidence ?? 0)} confidence`],
  ];
}
function phaseRail(active) {
  const names=['ARRIVE','PREP','MOTO','RESULTS','HOME'];
  return add(el('div','race2-phases'), ...names.map((n,i)=>el('span', i===active?'active':i<active?'done':'', n)));
}

export function installUi2RaceWeekendPatch(App) {
  if (!App || App.prototype.__ui2RaceWeekendInstalled) return;
  App.prototype.__ui2RaceWeekendInstalled = true;
  ensureStyles();

  const legacyParentIntro = App.prototype.viewParentRaceIntro;

  App.prototype.viewRaceIntro = function ui2RaceIntro() {
    const g=this.game; const race=g.meta().race;
    if (g.isParent && legacyParentIntro) return legacyParentIntro.call(this, race, 0, '', []);
    const root=el('section','race2'); root.dataset.testid='race-weekend-arrival';
    const hero=add(el('div','race2-hero'),
      add(el('div'), el('small','race2-kicker', race.kind==='regional'?'REGIONAL WEEKEND':'RACE WEEKEND'), el('h1','',race.name), el('p','',`${race.motos} motos · ${race.laps} laps · ${race.riders ?? (g.world.field().length+1)} riders`)),
      add(el('div','race2-number'), el('span','',g.rider?.number ?? '27'), el('small','',g.rider?.klass || '50cc'))
    );
    const facts=add(el('div','race2-facts'), ...contextualFacts(g).map(([k,v])=>add(el('div'),el('small','',k),el('strong','',v))));
    const warning=(g.bike.condition<45||g.bike.reliability<50||g.rider.fatigue>60||g.rider.injury)
      ? add(el('div','race2-callout warn'),el('small','','NEEDS ATTENTION'),el('strong','',g.rider.injury?'Racing hurt changes the day.':g.bike.condition<45?'The bike needs care before the gate.':'Manage the weekend, not just the lap.'))
      : add(el('div','race2-callout'),el('small','','PADDOCK CHECK'),el('strong','','Bike and rider are ready to line up.'));
    const actions=add(el('div','race2-actions'),
      add(el('button','race2-primary','ENTER THE PADDOCK →')),
      add(el('button','race2-secondary','QUICK-SIM WEEKEND'))
    );
    actions.children[0].onclick=()=>this.startInteractiveRace();
    actions.children[1].onclick=()=>this.quickSimRace();
    add(root,phaseRail(0),hero,facts,warning,this.classEntrySection?.(),actions);
    return root;
  };

  App.prototype.viewMoto = function ui2Moto() {
    const g=this.game, race=this.race;
    const standings=race.standings().slice(0,8); const playerOut=standings.find(s=>s.isPlayer)?.out;
    const root=el('section','race2 live'); root.dataset.testid='race-weekend-live';
    const header=add(el('div','race2-livehead'),
      add(el('div'),el('small','race2-kicker',race.race.name),el('h1','',`MOTO ${race.motoIndex+1}`)),
      add(el('div','race2-lap'),el('small','','LAP'),el('strong','',`${Math.min(race.lapDone,race.lapsPerMoto)} / ${race.lapsPerMoto}`))
    );
    const leaderboard=el('ol','race2-leaderboard');
    standings.forEach(s=>add(leaderboard,add(el('li',(s.isPlayer?'me ':'')+(s.out?'out':'')),el('b','',String(s.pos)),el('span','',s.isPlayer?`${s.name} · YOU`:s.name),s.isRival?el('em','','RIVAL'):null,s.dnf?el('small','','DNF'):null)));
    const feed=el('div','race2-feed');
    race.motoEvents.slice(-8).forEach(e=>add(feed,add(el('div',e.kind||''),el('span','',e.text))));
    let controls;
    if (race.motoOver) {
      controls=el('button','race2-primary wide',race.hasNextMoto()?`LINE UP FOR MOTO ${race.motoIndex+2} →`:'SEE OVERALL RESULT →');
      controls.onclick=()=>this.onMotoContinue();
    } else if (playerOut) {
      controls=el('button','race2-secondary wide','WATCH THE MOTO PLAY OUT →');
      controls.onclick=()=>{ while(!race.motoOver) race.stepLap('steady'); this.render(); };
    } else {
      controls=el('div','race2-strategy');
      [['safe','PROTECT','Bring it home'],['steady','HIT YOUR MARKS','Race the plan'],['attack','PUSH','Go after them']].forEach(([key,title,sub])=>{
        const b=add(el('button',key==='attack'?'attack':''),el('strong','',title),el('span','',sub)); b.onclick=()=>this.doLap(key); controls.appendChild(b);
      });
    }
    add(root,phaseRail(2),header,add(el('div','race2-livegrid'),leaderboard,feed),controls);
    return root;
  };

  App.prototype.viewRaceResult = function ui2RaceResult(result) {
    const g=this.game; const place=result.dnf?'DNF':ordinal(result.overall); const rivalName=g.world.rival()?.name || 'Rival';
    const root=el('section','race2 results'); root.dataset.testid='race-weekend-results';
    const hero=add(el('div','race2-result-hero'),el('small','race2-kicker',result.race.name),el('div','race2-place',place),el('h1','',result.dnf?'A hard day. Still part of the story.':result.overall<=3?'Podium day.':'Weekend complete.'));
    const motos=add(el('div','race2-result-strip'),...result.motos.map((m,i)=>add(el('div'),el('small','',`MOTO ${i+1}`),el('strong','',m>result.fieldSize?'DNF':ordinal(m)))));
    const consequences=el('div','race2-consequences');
    add(consequences,
      add(el('div'),el('small','','CHAMPIONSHIP'),el('strong','',`+${result.points} points`)),
      result.rivalOverall?add(el('div'),el('small','','RIVALRY'),el('strong','',result.overall<result.rivalOverall?`Beat ${rivalName}`:`${rivalName} got this one`)):null,
      add(el('div'),el('small','','BIKE / BODY'),el('strong','',g.rider.injury?`Injured · ${g.rider.injury.name}`:`${Math.round(g.bike.condition)}% bike · ${Math.round(g.rider.fatigue)} fatigue`))
    );
    const podium=el('div','race2-podium');
    result.podium.forEach(p=>add(podium,add(el('div',p.isPlayer?'me':''),el('small','',`P${p.pos}`),el('strong','',p.isPlayer?`${p.name} · YOU`:p.name))));
    const home=el('button','race2-primary wide','LOAD UP · HEAD HOME →'); home.onclick=()=>this.finishWeek();
    add(root,phaseRail(3),hero,motos,podium,consequences,home);
    return root;
  };
}
