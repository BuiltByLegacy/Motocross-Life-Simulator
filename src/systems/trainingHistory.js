import { restoreLifeBetweenRacesState } from './lifeBetweenRaces.js';

const n=v=>Number(v)||0;
export function trainingHistorySummary(state,{seasonNumber=null,limit=8}={}){
 const s=restoreLifeBetweenRacesState(state),all=s.trainingHistory??[],season=seasonNumber==null?all:all.filter(h=>Number(h.seasonNumber??String(h.periodKey??'').match(/^s(\d+)/)?.[1])===Number(seasonNumber));
 const bySession={};for(const h of season){const id=h.trainingId??'unknown';bySession[id]=(bySession[id]??0)+1;}
 const spend=season.reduce((a,h)=>a+n(h.cost),0),retail=season.reduce((a,h)=>a+n(h.retailCost??h.cost),0),support=season.reduce((a,h)=>a+n(h.support),0);
 return{recent:all.slice(-limit).reverse(),seasonCount:season.length,careerCount:all.length,bySession,spend:{outOfPocket:spend,retail,support},latestReceipt:s.latestTrainingReceipt??null};
}
export function coachingNarrative(state,{seasonNumber=null,nextRace=null}={}){
 const x=trainingHistorySummary(state,{seasonNumber}),entries=Object.entries(x.bySession).sort((a,b)=>b[1]-a[1]),top=entries[0],low=entries.filter(([,c])=>c===1).map(([id])=>id);
 if(!x.careerCount)return{headline:'Build the first training block',body:'No sessions are on record yet. Mix technique, starts, motos, conditioning and recovery around what the rider actually needs.'};
 if(top?.[1]>=4)return{headline:`Too much ${top[0].replaceAll('_',' ')}`,body:`${top[1]} ${top[0].replaceAll('_',' ')} sessions this season are creating repetition pressure. ${low.length?`Balance it with ${low[0].replaceAll('_',' ')} work.`:'Add a different stimulus before repeating it again.'}${nextRace?` Prepare specifically for ${nextRace}.`:''}`};
 return{headline:'Training mix is building',body:`${x.seasonCount} sessions this season with $${x.spend.outOfPocket} paid out of pocket${x.spend.support?` and $${x.spend.support} covered by support`:''}. Keep matching the next session to weaknesses, recovery and the next race.`};
}
export function trainingHistoryRows(state,{limit=8}={}){return trainingHistorySummary(state,{limit}).recent.map(h=>({trainingId:h.trainingId,week:h.week,cost:n(h.cost),retailCost:n(h.retailCost??h.cost),support:n(h.support),supportSource:h.supportSource??null,time:n(h.time),risk:h.risk??null,gains:{...(h.gains??{})},receiptId:h.receiptId??null}));}
