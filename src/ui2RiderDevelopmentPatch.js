import { compactDevelopmentCard } from './systems/riderDevelopmentPresentation.js';
import { migrateRiderDevelopmentState } from './systems/riderDevelopmentMigration.js';

function findProfile(game){
 const state=game?.state??game;
 const rider=state?.rider??state?.career?.rider??null;
 if(!rider)return null;
 return rider.development??(rider.skills?migrateRiderDevelopmentState(rider):null);
}

function scene(game){
 const profile=findProfile(game); if(!profile)return '';
 const card=compactDevelopmentCard(profile);
 const strengths=card.strengths.slice(0,3).map(x=>`<li>${x}</li>`).join('');
 const cautions=card.cautions.slice(0,2).map(x=>`<p>${x}</p>`).join('');
 return `<section class="ui2-development" data-testid="ui2-rider-development"><div class="ui2-development-kicker">${card.title}</div><h3>${card.headline}</h3><div class="ui2-development-body"><div><strong>What travels with you</strong><ul>${strengths}</ul></div><div><strong>Coach's focus</strong><p>${card.coach}</p>${cautions}</div></div></section>`;
}

export function installUi2RiderDevelopmentPatch(App){
 if(!App?.prototype||App.prototype.__ui2RiderDevelopmentInstalled)return;
 App.prototype.__ui2RiderDevelopmentInstalled=true;
 for(const method of ['renderStats','renderCareer']){
  if(typeof App.prototype[method]!=='function')continue;
  const original=App.prototype[method];
  App.prototype[method]=function(...args){const out=original.apply(this,args);const host=this.root?.querySelector('[data-testid="ui2-career-record"], .career-record, .tab-content, main');if(host&&!host.querySelector('[data-testid="ui2-rider-development"]'))host.insertAdjacentHTML('beforeend',scene(this.game??this));return out;};
 }
}
