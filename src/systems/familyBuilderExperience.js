import { createFamilyLifeBuilderState, startingCircumstances, schoolWeekConstraints } from './familyLifeBuilder.js';
import { createRacingSupportHomeState, resolveRacingSupport, startingHomeCircumstances, familySupportHomeSummary } from './familyRacingSupportHome.js';
import { normalizeRelationships, ensurePeople2State } from './peopleRelationships2.js';
import { createCareerEconomyState } from './careerEconomy2.js';

const LEGACY = Object.freeze({
  working_class:{financial:'tight',motocrossKnowledge:'weekend',household:'two_parent',school:'public',supportModel:'family_diy',home:'basic'},
  working_class_kid:{financial:'tight',motocrossKnowledge:'weekend',household:'two_parent',school:'public',supportModel:'family_diy',home:'basic'},
  rich_kid:{financial:'wealthy',motocrossKnowledge:'new',household:'two_parent',school:'private',supportModel:'professional',home:'workshop'},
  wealthy:{financial:'wealthy',motocrossKnowledge:'new',household:'two_parent',school:'private',supportModel:'professional',home:'workshop'},
  homeschooled:{financial:'comfortable',motocrossKnowledge:'weekend',household:'two_parent',school:'homeschool',supportModel:'guardian_mechanic',home:'basic'},
  homeschool:{financial:'comfortable',motocrossKnowledge:'weekend',household:'two_parent',school:'homeschool',supportModel:'guardian_mechanic',home:'basic'},
  blue_collar:{financial:'tight',motocrossKnowledge:'motocross_family',household:'two_parent',school:'public',supportModel:'guardian_mechanic',home:'workshop'},
  blue_collar_family:{financial:'tight',motocrossKnowledge:'motocross_family',household:'two_parent',school:'public',supportModel:'guardian_mechanic',home:'workshop'},
  parents_new:{financial:'comfortable',motocrossKnowledge:'new',household:'two_parent',school:'public',supportModel:'local_shop',home:'basic'},
  parents_new_to_sport:{financial:'comfortable',motocrossKnowledge:'new',household:'two_parent',school:'public',supportModel:'local_shop',home:'basic'},
});

const titleCase=(s='')=>String(s).replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
const uniquePeople=(relationships,actors)=>{const out=normalizeRelationships(relationships);for(const actor of actors??[])out[actor.id]=out[actor.id]??actor;return out;};

function legacyGuardianSeeds(rawState={},mapped={}){
  const relationships=Object.values(rawState.relationships??{});
  const candidates=relationships.filter((person)=>{
    const role=String(person?.lifecycle?.role??person?.role??'').toLowerCase();
    const id=String(person?.id??'').toLowerCase();
    return role.includes('parent')||role.includes('guardian')||role.includes('spouse')||['dad','mom','mother','father','spouse'].includes(id);
  }).sort((a,b)=>{
    const rank=(person)=>String(person?.lifecycle?.role??person?.role??'').toLowerCase().includes('spouse')?1:0;
    return rank(a)-rank(b);
  });
  if(!candidates.length)return[];
  const max=mapped.household==='single_parent'||mapped.household==='guardian_household'?1:2;
  return candidates.slice(0,max).map((person,index)=>({
    id:String(person.id),
    name:String(person.name??(index===0?'Parent':'Parent 2')),
    relation:String(person?.lifecycle?.role??person?.role??'').toLowerCase().includes('guardian')?'Guardian':'Parent',
    roles:index===0
      ?{attendsRaces:true,wrenches:true,financialSupport:true,emotionalSupport:true}
      :{attendsRaces:true,travelSchool:true,financialSupport:true,emotionalSupport:true},
    motocrossKnowledge:mapped.motocrossKnowledge,
    availability:Number(person?.lifecycle?.dimensions?.availability??70),
  }));
}

export function migrateLegacyFamilyBuilder(rawState={}){
  if(rawState.familyBuilder?.version>=2) return rawState;
  const legacyKey=String(rawState.background??'').toLowerCase().replaceAll('-','_').replaceAll(' ','_');
  const mapped={...(LEGACY[legacyKey]??{financial:'comfortable',motocrossKnowledge:'weekend',household:'two_parent',school:rawState.schoolMode==='homeschool'?'homeschool':'public',supportModel:'family_diy',home:'basic'})};
  const guardians=legacyGuardianSeeds(rawState,mapped);
  if(guardians.length)mapped.guardians=guardians;
  rawState.familyBuilder={version:2,initialized:false,migratedFrom:rawState.background??null,builder:createFamilyLifeBuilderState(mapped),support:createRacingSupportHomeState(mapped)};
  return rawState;
}

export function initializeFamilyBuilder(game,builderRaw={},supportRaw={},opts={}){
  if(!game?.state) throw new Error('Family Builder requires a game state.');
  migrateLegacyFamilyBuilder(game.state);
  const existing=game.state.familyBuilder;
  if(existing?.initialized&&!opts.force) return existing;
  const builder=createFamilyLifeBuilderState(builderRaw?.financial?builderRaw:(existing?.builder??builderRaw));
  const supportState=createRacingSupportHomeState(supportRaw?.supportModel?supportRaw:(existing?.support??supportRaw));
  const start=startingCircumstances(builder,{baseCash:opts.baseCash??1200});
  const support=resolveRacingSupport(builder,supportState);
  const home=startingHomeCircumstances(builder,supportState);
  const school=schoolWeekConstraints(builder,{age:game.state.rider?.age??10,raceTravelDays:0});
  const currentCash=Math.max(0,Number(game.state.family?.money??0));
  const currentEconomy=game.state.careerEconomy;

  game.state.relationships=uniquePeople(game.state.relationships,[...start.people,...support.people]);
  game.state.people2=ensurePeople2State(game.state.people2);
  if(opts.preserveEconomy){
    game.state.family.money=currentCash;
    game.state.careerEconomy=createCareerEconomyState(currentEconomy,currentCash);
  }else{
    game.state.family.money=start.economy.startingCash;
    game.state.careerEconomy=createCareerEconomyState(null,start.economy.startingCash);
  }
  game.state.schoolMode=builder.school;
  game.state.familyBuilder={version:2,initialized:true,initializedAt:{seasonNumber:game.state.seasonNumber??1,week:game.state.week??1},migratedFrom:existing?.migratedFrom??null,builder,support:supportState};
  game.state.familyLife={version:2,school,support,home,opportunityContext:start.opportunityContext,equipmentExpectation:start.economy.equipmentExpectation};
  game.state.garage.familyBuilder={toolLevel:home.garage.toolLevel,maintenanceCapacity:home.garage.maintenanceCapacity,storageConstraint:home.equipment.storageConstraint,supportProviderId:home.garage.supportProviderId};
  game.state.compound=game.state.compound??{version:1,seed:home.compoundSeed};
  return game.state.familyBuilder;
}

export function ensureFamilyBuilderInitialized(game){
  if(!game?.state) return null;
  migrateLegacyFamilyBuilder(game.state);
  const fb=game.state.familyBuilder;
  return initializeFamilyBuilder(game,fb.builder,fb.support,{baseCash:1200,preserveEconomy:true});
}

export function familyStory(builderRaw={},supportRaw={},ctx={}){
  const builder=createFamilyLifeBuilderState(builderRaw),start=startingCircumstances(builder,{baseCash:ctx.baseCash??1200}),support=resolveRacingSupport(builder,supportRaw),home=startingHomeCircumstances(builder,supportRaw),summary=familySupportHomeSummary(builder,supportRaw),school=schoolWeekConstraints(builder,{age:ctx.age??10,raceTravelDays:2});
  const people=support.people.filter(p=>p.familyBuilder?.guardian).map(p=>({id:p.id,name:p.name,role:p.role,guardian:p.familyBuilder.guardian}));
  const mechanic=support.assignments.wrenching;const logistics=support.assignments.registration;const schoolPerson=support.assignments.schoolCoordination;
  const who=(id)=>people.find(p=>p.id===id)?.name??support.people.find(p=>p.id===id)?.name??titleCase(id||'family');
  const financeLabel={tight:'Tight-budget',comfortable:'Working-family',well_off:'Well-supported',wealthy:'Well-funded'}[builder.financial]??'Family';
  const mxLabel={new:'new-to-motocross',weekend:'weekend-racing',motocross_family:'motocross',industry:'industry-connected'}[builder.motocrossKnowledge]??'motocross';
  const householdLabel={two_parent:'Two-parent household',single_parent:'Single-parent household',split_household:'Split / co-parenting household',guardian_household:'Guardian household'}[builder.household]??titleCase(builder.household);
  const schoolLabel={public:'Public school',private:'Private school',homeschool:'Homeschool',online:'Online / flexible school'}[builder.school]??titleCase(builder.school);
  const roleBits=[];
  if(mechanic) roleBits.push(`${who(mechanic)} handles most bike work`);
  if(schoolPerson&&schoolPerson!==mechanic) roleBits.push(`${who(schoolPerson)} keeps school and travel organized`);
  if(logistics&&logistics!==mechanic&&logistics!==schoolPerson) roleBits.push(`${who(logistics)} handles race-weekend logistics`);
  const moneyLine=start.economy.financialPressure>=70?'Every race weekend has to earn its place in the family budget.':start.economy.financialPressure<=25?'Money opens doors, but expectations can grow with it.':'Racing is possible, but the family still has to make choices about where the money goes.';
  const homeLine=home.homeId==='rural'?'There is room to grow and eventually ride at home, but the property takes time and money to maintain.':home.equipment.storageConstraint==='severe'?'Bike storage and wrenching space are tight from day one.':`${home.label} gives the program a believable place to start and improve.`;
  const strengths=[...new Set([...(summary.strengths??[]),start.motocross.maintenanceKnowledge>=65?'motocross knowledge':null,start.opportunityContext.familyNetworkExposure>=60?'local connections':null,support.life.familyTimeLoad<45?'lower family labor load':null].filter(Boolean))];
  const pressures=[...new Set([...(summary.pressures??[]),start.economy.financialPressure>=65?'money':null,school.absencePressure>=65?'school absences':null,support.life.sacrificeRisk>=65?'family sacrifice':null].filter(Boolean))];
  return {version:2,title:`${financeLabel} ${mxLabel} family`,subtitle:`${schoolLabel} · ${householdLabel} · ${support.label}`,narrative:[roleBits.join('. ')+(roleBits.length?'.':''),moneyLine,homeLine].filter(Boolean).join(' '),strengths,pressures,people,starting:{cash:start.economy.startingCash,equipment:start.economy.equipmentExpectation,home:home.label,storage:home.equipment.storageConstraint,support:support.label,school:schoolLabel},tradeoffs:{weekdayFlex:school.weekdayFlex,travelFlex:school.travelFlex,familyTimeLoad:support.life.familyTimeLoad,propertyUpkeep:home.economy.propertyUpkeepPressure},riderPerformanceModifiers:{}};
}
