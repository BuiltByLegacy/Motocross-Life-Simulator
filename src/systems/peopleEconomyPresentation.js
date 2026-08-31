import { ensureRelationshipLifecycle, ensurePeople2State, supportSummary } from './peopleRelationships2.js';
import { createCareerEconomyState, economySummary } from './careerEconomy2.js';
import { financialPosture, rivalryProfile } from './peopleEconomyBondsRisk.js';

const money=v=>`$${Math.round(Math.max(0,Number(v)||0)).toLocaleString()}`;
const title=s=>String(s??'').replaceAll('_',' ').replaceAll('-',' ').replace(/\b\w/g,c=>c.toUpperCase());

function reasonText(reason='relationship event'){
 const raw=String(reason).replace(/^bond:/,'').replace(/^repair:/,'').replace(/^conflict:/,'').replace(/^support:/,'');
 return title(raw);
}
function changeText(changes={}){const rows=Object.entries(changes).filter(([,v])=>Number(v)!==0).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,2);return rows.map(([k,v])=>`${title(k)} ${v>0?'+':''}${Math.round(v)}`).join(' · ');}

export function personStory(recordRaw,peopleStateRaw=null){
 const r=ensureRelationshipLifecycle(recordRaw),d=r.lifecycle.dimensions,p=ensurePeople2State(peopleStateRaw),support=p.supportHistory.filter(x=>x.actorId===r.id).slice(-4).reverse(),history=r.lifecycle.history.slice(-5).reverse();
 const tension=r.lifecycle.activeConflict?.status==='active'?`There is an unresolved ${reasonText(r.lifecycle.activeConflict.source)} conflict.`:d.conflict>=55?'Things feel strained right now.':null;
 const supportLine=(r.lifecycle.sacrifice.money||r.lifecycle.sacrifice.time||r.lifecycle.sacrifice.labor)?`${r.name??r.id} has put in ${r.lifecycle.sacrifice.time||0} hours, ${r.lifecycle.sacrifice.labor||0} hours of hands-on help and ${money(r.lifecycle.sacrifice.money)} toward the program.`:null;
 const strength=(d.trust+d.closeness+d.respect+d.reliability)/4;
 const state=tension?'strained':strength>=72?'strong':strength>=55?'steady':'distant';
 const role=r.lifecycle.role??r.role??'Person';
 const rival=role==='Rival'?rivalryProfile(r):null;
 return{id:r.id,name:r.name??title(r.id),role,state,headline:tension??supportLine??(rival?.summary)||`${r.name??title(r.id)} is a ${state} part of the rider’s life right now.`,tension,supportLine,sacrifice:{...r.lifecycle.sacrifice},recentHistory:history.map(h=>({when:`S${h.seasonNumber} · W${h.week}`,label:reasonText(h.reason),detail:changeText(h.changes)})),recentSupport:support.map(s=>({when:`S${s.seasonNumber} · W${s.week}`,label:reasonText(s.kind),detail:[s.money?money(s.money):null,s.time?`${s.time}h time`:null,s.labor?`${s.labor}h labor`:null,s.context].filter(Boolean).join(' · ')})),conversation:r.lifecycle.activeConflict?.status==='active'?['talk','apology','follow_through']:['check_in'],dimensions:{trust:Math.round(d.trust),closeness:Math.round(d.closeness),respect:Math.round(d.respect),reliability:Math.round(d.reliability),conflict:Math.round(d.conflict)}};
}

export function peopleStory(relationshipsRaw={},peopleStateRaw=null){
 const people=Object.values(relationshipsRaw??{}).map(r=>personStory(r,peopleStateRaw));
 people.sort((a,b)=>{const rank={strained:0,strong:1,steady:2,distant:3};return (rank[a.state]??4)-(rank[b.state]??4);});
 const support=supportSummary(peopleStateRaw);
 return{people,support,headline:people.some(p=>p.state==='strained')?'Some relationships need attention.':support.events?`${support.events} acts of support are part of this career story.`:'The people around the rider are still becoming part of the story.'};
}

export function fundingStory(economyRaw,ctx={}){
 const econ=createCareerEconomyState(economyRaw,ctx.cash??0),seasonNumber=ctx.seasonNumber??null,summary=economySummary(econ,{seasonNumber}),posture=financialPosture(econ,ctx);
 const rows=seasonNumber==null?econ.ledger:econ.ledger.filter(x=>x.seasonNumber===Number(seasonNumber));
 const grossSpend=rows.reduce((a,r)=>a+Number(r.designated?.gross??(r.cashDelta<0?Math.abs(r.cashDelta):0)),0),outOfPocket=rows.filter(r=>r.cashDelta<0).reduce((a,r)=>a+Math.abs(r.cashDelta),0),support=rows.reduce((a,r)=>a+Number(r.designated?.support??r.nonCashValue??0),0);
 const categories=Object.entries(summary.byCategory).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([name,value])=>({name:title(name),value}));
 const sources=Object.entries(summary.bySource).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([name,value])=>({name:title(name),value}));
 const recent=rows.slice(-5).reverse().map(r=>({label:r.description??title(r.category),amount:r.cashDelta,status:r.cashDelta>0?'in':'out',source:title(r.fundingSource),support:Number(r.designated?.support??r.nonCashValue??0)}));
 const fundingLine=support>0?`${money(support)} of ${money(grossSpend)} in recorded program cost was covered by support; the rider/family carried ${money(outOfPocket)} out of pocket.`:`The rider/family has carried ${money(outOfPocket)} of recorded program cost out of pocket.`;
 return{version:2,summary,posture,grossSpend,outOfPocket,support,categories,sources,recent,headline:posture.summary,fundingLine,capacity:posture.commitmentCapacity};
}
