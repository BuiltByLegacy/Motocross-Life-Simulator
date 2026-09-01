import { ensurePeople2State, normalizeRelationships } from './peopleRelationships2.js';
import { createCareerEconomyState, expectedBalance, reconcileEconomy } from './careerEconomy2.js';

function uniqueBy(rows=[],keyFn){const seen=new Set();const out=[];for(const row of rows??[]){const key=keyFn(row);if(key==null||seen.has(key))continue;seen.add(key);out.push(row);}return out;}

export function migratePeopleEconomyState({relationships={},people2=null,careerEconomy=null,currentBalance=0}={}){
  const rels=normalizeRelationships(relationships);
  const people=ensurePeople2State(people2);
  people.supportHistory=uniqueBy(people.supportHistory,x=>x.sourceId??x.id);
  people.seenSourceIds=[...new Set([...(people.seenSourceIds??[]),...people.supportHistory.map(x=>x.sourceId).filter(Boolean)])];
  for(const [id,record] of Object.entries(rels)){
    record.lifecycle.supportIds=[...new Set(record.lifecycle.supportIds??[])];
    record.lifecycle.history=uniqueBy(record.lifecycle.history,x=>x.id);
    rels[id]=record;
  }
  const economy=createCareerEconomyState(careerEconomy,currentBalance);
  economy.ledger=uniqueBy(economy.ledger,x=>x.sourceId??x.id);
  economy.seenSourceIds=[...new Set([...(economy.seenSourceIds??[]),...economy.ledger.map(x=>x.sourceId).filter(Boolean)])];
  economy.reconciliations=[...(economy.reconciliations??[])];
  return{relationships:rels,people2:people,careerEconomy:economy};
}

export function closeoutAudit({relationships={},people2=null,careerEconomy=null,currentBalance=0}={}){
  const migrated=migratePeopleEconomyState({relationships,people2,careerEconomy,currentBalance});
  const supportSources=migrated.people2.supportHistory.map(x=>x.sourceId).filter(Boolean);
  const ledgerSources=migrated.careerEconomy.ledger.map(x=>x.sourceId).filter(Boolean);
  const linkedSupportMissing=migrated.careerEconomy.ledger.filter(x=>x.linkedSupportId&&!migrated.people2.supportHistory.some(s=>s.id===x.linkedSupportId)).map(x=>x.id);
  const relationshipSupportMissing=[];
  for(const [id,record] of Object.entries(migrated.relationships))for(const supportId of record.lifecycle.supportIds??[])if(!migrated.people2.supportHistory.some(x=>x.id===supportId))relationshipSupportMissing.push({personId:id,supportId});
  const expected=expectedBalance(migrated.careerEconomy);const actual=Math.round(Number(currentBalance)||0);
  return{...migrated,ok:new Set(supportSources).size===supportSources.length&&new Set(ledgerSources).size===ledgerSources.length&&linkedSupportMissing.length===0&&relationshipSupportMissing.length===0&&expected===actual,expectedBalance:expected,actualBalance:actual,difference:actual-expected,linkedSupportMissing,relationshipSupportMissing};
}

export function reconcileCloseout(raw,currentBalance,{seasonNumber=1,week=0}={}){
  const migrated=migratePeopleEconomyState({...raw,currentBalance});
  const r=reconcileEconomy(migrated.careerEconomy,currentBalance,{seasonNumber,week});
  return{...migrated,careerEconomy:r.state,reconciliation:{actualBalance:r.actualBalance,expectedBalance:r.expectedBalance,difference:r.difference,ok:r.ok}};
}

export function seasonViability({cash=0,plannedOutOfPocket=0,reserve=0,requiredWeeks=0,availableWeeks=0}={}){
  const remaining=Math.round(Number(cash)||0)-Math.max(0,Math.round(Number(plannedOutOfPocket)||0));
  const moneyOk=remaining>=Math.max(0,Math.round(Number(reserve)||0));const timeOk=Number(availableWeeks)>=Number(requiredWeeks);
  return{viable:moneyOk&&timeOk,moneyOk,timeOk,remainingCash:remaining,reason:!moneyOk?'funding-gap':!timeOk?'calendar-pressure':null};
}

export function peopleArcSummary(relationships={}){
  const rels=normalizeRelationships(relationships);return Object.values(rels).map(r=>({id:r.id,role:r.lifecycle.role,roleChanges:r.lifecycle.roleHistory.length,events:r.lifecycle.history.length,hasConflict:!!r.lifecycle.activeConflict,supportEvents:r.lifecycle.supportIds.length,lastMeaningfulAt:r.lifecycle.lastMeaningfulAt}));
}
