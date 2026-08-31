// Opportunity Engine
// ------------------
// Career Opportunities 2.0 keeps the original relationship/memory hooks but
// discovers persistent, contextual career forks through one canonical market.
import { createCareerOpportunityState, discoverCareerOpportunities, expireCareerOpportunities } from '../systems/careerOpportunities2.js';

export class OpportunityEngine {
  constructor(game) { this.game=game; }
  wire(){this.game.bus.on('race:finished',(p)=>this.onRace(p));}
  state(){const g=this.game;g.state.careerOpportunities2=createCareerOpportunityState(g.state.careerOpportunities2);return g.state.careerOpportunities2;}
  context(extra={}){const g=this.game,results=g.state.season?.results??[];const podiums=results.filter(r=>!r.dnf&&Number(r.overall)<=3).length,wins=results.filter(r=>!r.dnf&&Number(r.overall)===1).length;return{week:g.week,seasonNumber:g.state.seasonNumber,rider:g.rider,family:g.family,klass:g.rider.klass,region:g.state.homeRegion?.id??g.state.homeRegion??'home',results:{score:Math.min(100,wins*14+podiums*7+(g.state.season?.points??0)/8)},form:Math.min(100,wins*18+podiums*8+45),reputation:Math.min(100,35+(g.family.support_level??0)*12+podiums*5),professionalism:Math.max(20,75-(g.family.stress??0)*.2),visibility:Math.min(100,20+wins*15+podiums*7),support:Math.min(100,(g.family.support_level??0)*25),momentum:g.momentum?.confidence??g.rider.confidence??50,readiness:Math.max(20,100-(g.rider.fatigue??0)-(g.rider.injury?30:0)),development:Object.values(g.rider.skills??{}).reduce((a,b)=>a+Number(b||0),0)/Math.max(1,Object.keys(g.rider.skills??{}).length),...extra};}
  discover(extra={}){let s=expireCareerOpportunities(this.state(),this.game.week);s=discoverCareerOpportunities(s,this.context(extra));this.game.state.careerOpportunities2=s;return s.active;}
  onRace({overall,race}){const g=this.game;
    if(overall<=5)g.rel('shop_rocky').change('reputation',overall<=3?6:3);
    if(overall<=3){g.rel('coach_mike').change('belief',3);g.rel('rival_ethan').change('respect',2);}
    if(race.kind==='regional'&&overall<=3){g.grantOpportunity({id:'regional_support_interest',title:'Regional Support Interest',text:'A regional support team took your ride seriously. Next season, a door is open.'});g.memory.record({type:'world',title:'Noticed at the Regional',summary:'A regional podium put your name in front of people who matter.',emotion:['pride','hope'],tags:['regional','milestone','support_ladder'],importance:85,force:true});}
    if(race.kind==='regional'&&g.flag('scout_watching')&&overall>8)g.memory.record({type:'world',title:'The Scout Moved On',summary:'The scout left with someone else’s name in the notebook.',emotion:['regret'],tags:['missed_opportunity','regional'],importance:60,force:true});
    // Dynamic windows: strong results can trigger seats; roster gaps create fill-ins.
    const rosterGap=!!g.flag('roster_gap')||(race.kind==='regional'&&overall<=2&&g.rng.chance(.18));
    const before=this.state().active.length;const active=this.discover({form:Math.max(this.context().form,overall===1?82:overall<=3?72:50),rosterGap});
    if(active.length>before){const newest=active.at(-1);g.addNews(`Career opportunity: ${newest.title}`,'opportunity');}
  }
}
