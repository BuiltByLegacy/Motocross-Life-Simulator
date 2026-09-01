import { createFamilyLifeBuilderState, startingCircumstances, ensureHouseholdActors, familyBuilderSummary } from './familyLifeBuilder.js';
import { createRacingSupportHomeState, resolveRacingSupport, startingHomeCircumstances, familySupportHomeSummary } from './familyRacingSupportHome.js';
import { ensurePeopleEconomyState } from './peopleEconomyIntegration.js';

const LEGACY_MAP=Object.freeze({
  working_class:{financial:'tight',motocrossKnowledge:'weekend',household:'two_parent',school:'public',supportModel:'family_diy',home:'basic'},
  rich_kid:{financial:'wealthy',motocrossKnowledge:'weekend',household:'two_parent',school:'private',supportModel:'professional',home:'workshop'},
  homeschooled:{financial:'comfortable',motocrossKnowledge:'weekend',household:'two_parent',school:'homeschool',supportModel:'family_diy',home:'basic'},
  blue_collar:{financial:'comfortable',motocrossKnowledge:'motocross_family',household:'two_parent',school:'public',supportModel:'guardian_mechanic',home:'workshop'},
  new_to_sport:{financial:'comfortable',motocrossKnowledge:'new',household:'two_parent',school:'public',supportModel:'family_diy',home:'basic'},
  parents_new:{financial:'comfortable',motocrossKnowledge:'new',household:'two_parent',school:'public',supportModel:'family_diy',home:'basic'},
});
const schoolMode=(school)=>school==='homeschool'?'homeschool':school==='online'?'online':'school';
const uniqById=(rows=[])=>{const seen=new Set();return rows.filter(r=>r?.id&&!seen.has(r.id)&&seen.add(r.id));};

export function migrateLegacyFamilySelection(background){
  const legacy=LEGACY_MAP[background]??LEGACY_MAP.working_class;
  return {builder:createFamilyLifeBuilderState(legacy),supportHome:createRacingSupportHomeState(legacy),legacyBackground:background??'working_class'};
}

export function ensureFamilyLifeSelection(raw={}){
  return {version:2,builder:createFamilyLifeBuilderState(raw.builder??raw.familyLifeBuilder??{}),supportHome:createRacingSupportHomeState(raw.supportHome??raw.racingSupportHome??{})};
}

function actorName(people,id){return people.find(p=>p.id===id)?.name??people.find(p=>p.id===id)?.role??'Your family';}
export function buildFamilyStory(builderRaw={},supportRaw={}){
  const builder=createFamilyLifeBuilderState(builderRaw),supportHome=createRacingSupportHomeState(supportRaw),start=startingCircumstances(builder),support=resolveRacingSupport(builder,supportHome),home=startingHomeCircumstances(builder,supportHome),base=familyBuilderSummary(builder),extra=familySupportHomeSummary(builder,supportHome);
  const mechanic=actorName(support.people,support.assignments.wrenching),schoolLead=actorName(support.people,support.assignments.schoolCoordination);
  const title=`${base.financial} ${builder.motocrossKnowledge==='new'?'new-to-motocross':'motocross'} family`;
  const details=[base.school,householdLabel(builder.household),base.motocross];
  const narrative=`${mechanic} handles most bike support. ${schoolLead} helps keep school and travel moving. ${moneyLine(builder.financial)} ${knowledgeLine(builder.motocrossKnowledge)}`;
  const strengths=[...new Set([...base.strengths,...extra.strengths, ...(support.people.length?'family support':[])])].slice(0,4);
  const pressures=[...new Set([...base.pressures,...extra.pressures])].slice(0,4);
  return {version:2,title,details,narrative,strengths,pressures,startingEquipment:equipmentLine(start.economy.equipmentExpectation,home.equipment.storageConstraint),home:home.label,support:support.label,people:support.people.map(p=>({id:p.id,name:p.name??p.role,role:p.role})),assignments:{...support.assignments},school:{id:builder.school,label:base.school},economy:{startingCash:start.economy.startingCash,financialPressure:start.economy.financialPressure},garage:{...home.garage},property:{...home.property},compoundSeed:{...home.compoundSeed},riderPerformanceModifiers:{}};
}
function householdLabel(id){return ({two_parent:'Two-parent household',single_parent:'Single-parent household',split_household:'Split / co-parenting household',guardian_household:'Guardian household'})[id]??'Family household';}
function moneyLine(id){return id==='tight'?'Every dollar matters, so race choices will require sacrifice.':id==='wealthy'?'Money removes some barriers, but expectations and commitment still matter.':id==='well_off'?'The family can invest in racing, but major steps still require choices.':'Racing is possible, but the family still has to balance costs and everyday life.';}
function knowledgeLine(id){return id==='new'?'Your family is learning the sport alongside you.':id==='industry'?'Your family already understands the sport and its people.':id==='motocross_family'?'Motocross is already part of family life.':'Your family understands local weekend racing.';}
function equipmentLine(posture,storage){const bike=posture==='premium-capable'||posture==='new-capable'?'a newer race-bike setup':'a used race-bike setup';return `${bike} with ${storage==='severe'?'very limited':storage==='limited'?'limited':'comfortable'} storage.`;}

export function initializeFamilyLife(game,builderRaw={},supportRaw={}){
  if(!game?.state)return{ok:false,error:'invalid-game'};
  if(game.state.familyLife?.initialized)return{ok:true,duplicate:true,state:game.state.familyLife};
  const builder=createFamilyLifeBuilderState(builderRaw),supportHome=createRacingSupportHomeState(supportRaw),start=startingCircumstances(builder),support=resolveRacingSupport(builder,supportHome),home=startingHomeCircumstances(builder,supportHome),story=buildFamilyStory(builder,supportHome);
  game.state.familyLife={version:2,initialized:true,builder,supportHome,story};
  game.state.schoolMode=schoolMode(builder.school);
  game.family.money=start.economy.startingCash;
  game.state.people2??={version:2,supportEvents:[],seenSupportSourceIds:[]};
  game.state.relationships=game.state.relationships??{};
  for(const person of uniqById(support.people)){
    game.state.relationships[person.id]=game.state.relationships[person.id]??person;
  }
  game.state.familyLife.school={id:builder.school,...start.school};
  game.state.familyLife.garage={...home.garage};
  game.state.familyLife.equipment={...home.equipment};
  game.state.familyLife.property={...home.property};
  game.state.familyLife.compoundSeed={...home.compoundSeed};
  game.state.familyLife.raceSupport={...support};
  game.state.familyLife.opportunityContext={...start.opportunityContext};
  game.state.familyLife.riderPerformanceModifiers={};
  // Re-anchor pristine Economy 2.0 to the authoritative post-builder opening cash.
  game.state.careerEconomy=undefined;
  ensurePeopleEconomyState(game);
  return{ok:true,state:game.state.familyLife};
}

export function migrateFamilyLifeSave(saveRaw){
  if(!saveRaw?.state)return saveRaw;
  const save=structuredCloneSafe(saveRaw);if(save.state.familyLife?.version>=2)return save;
  const migrated=migrateLegacyFamilySelection(save.state.background);
  const story=buildFamilyStory(migrated.builder,migrated.supportHome);
  save.state.familyLife={version:2,initialized:true,migratedFromLegacy:true,builder:migrated.builder,supportHome:migrated.supportHome,story,riderPerformanceModifiers:{}};
  save.state.schoolMode=save.state.schoolMode??schoolMode(migrated.builder.school);
  // Never rewrite cash/equipment/people on an existing career: migration describes current origins only.
  return save;
}
function structuredCloneSafe(value){try{return structuredClone(value);}catch{return JSON.parse(JSON.stringify(value));}}
