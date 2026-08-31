import { ensurePeople2State, normalizeRelationships, recordSupportEvent } from './peopleRelationships2.js';
import { createCareerEconomyState, recordCashChange, recordFundedExpense, reconcileEconomy } from './careerEconomy2.js';

function pristineEconomy(raw){
  const source=raw&&typeof raw==='object'?raw:{};
  return (source.ledger?.length??0)===0&&(source.seenSourceIds?.length??0)===0&&(source.reconciliations?.length??0)===0;
}

export function ensurePeopleEconomyState(game){
  game.state.people2=ensurePeople2State(game.state.people2);
  game.state.relationships=normalizeRelationships(game.state.relationships);
  const raw=game.state.careerEconomy;
  // The base career state is created before starting-background effects run. Until
  // Economy 2.0 records its first source, the live family balance is therefore the
  // authoritative opening balance. Anchor it once here, then never rewrite it after
  // ledger/reconciliation activity exists.
  if(pristineEconomy(raw)){
    game.state.careerEconomy=createCareerEconomyState({...raw,openingBalance:Number(game.family.money??0)},game.family.money);
  }else{
    game.state.careerEconomy=createCareerEconomyState(raw,game.family.money);
  }
  return game;
}

export function receiveCareerMoney(game,amount,meta={}){
  ensurePeopleEconomyState(game);const n=Math.max(0,Math.round(Number(amount)||0));if(!n)return{ok:false,error:'invalid-amount'};
  const sourceId=meta.sourceId??`income:${meta.category??'general'}:${game.state.seasonNumber}:${game.week}:${game.state.careerEconomy.ledger.length}`;
  const r=recordCashChange(game.state.careerEconomy,n,{...meta,sourceId,seasonNumber:game.state.seasonNumber,week:game.week,kind:meta.kind??'income',fundingSource:meta.fundingSource??'rider'},game.family.money);
  if(r.duplicate)return{ok:true,duplicate:true,entry:r.entry};game.state.careerEconomy=r.state;game.family.money+=n;return{ok:true,entry:r.entry};
}

export function payCareerExpense(game,gross,{sourceId,category='racing',description=null,funding=[],beneficiary='rider'}={}){
  ensurePeopleEconomyState(game);const quote=recordFundedExpense(game.state.careerEconomy,{sourceId,seasonNumber:game.state.seasonNumber,week:game.week,category,description,gross,funding,beneficiary},game.family.money);
  if(quote.duplicate)return{ok:true,duplicate:true,expense:quote.expense};const due=quote.expense.outOfPocket;if(game.family.money<due)return{ok:false,error:'not-enough-money',expense:quote.expense};game.family.money-=due;game.state.careerEconomy=quote.state;return{ok:true,expense:quote.expense,entry:quote.entry};
}

export function attributePersonSupport(game,{actorId,sourceId,kind='general-support',money=0,time=0,labor=0,nonCashValue=0,context=null,economyEntryId=null}={}){
  ensurePeopleEconomyState(game);const r=recordSupportEvent(game.state.people2,game.state.relationships,{actorId,sourceId,kind,money,time,labor,nonCashValue,context,economyEntryId,seasonNumber:game.state.seasonNumber,week:game.week});game.state.people2=r.state;game.state.relationships=r.relationships;game.relationships?._cache?.clear?.();return{ok:true,...r};
}

export function payExpenseWithPersonSupport(game,{sourceId,actorId,gross,personCash=0,personLabor=0,personTime=0,nonCashValue=0,category='racing',description=null}={}){
  const funding=[];if(personCash>0)funding.push({source:`person:${actorId}`,amount:personCash,type:'support',personId:actorId});const paid=payCareerExpense(game,gross,{sourceId,category,description,funding});if(!paid.ok||paid.duplicate)return paid;
  const support=attributePersonSupport(game,{actorId,sourceId:`people:${sourceId}`,kind:'race-program-support',money:personCash,time:personTime,labor:personLabor,nonCashValue,context:description,economyEntryId:paid.entry.id});return{...paid,support:support.event};
}

export function reconcilePeopleEconomy(game){ensurePeopleEconomyState(game);const r=reconcileEconomy(game.state.careerEconomy,game.family.money,{seasonNumber:game.state.seasonNumber,week:game.week});game.state.careerEconomy=r.state;return r;}
