import { createFamilyLifeBuilderState, ensureHouseholdActors, motocrossBackground, financialBackground } from './familyLifeBuilder.js';
import { ensureRecurringBond } from './peopleEconomyBondsRisk.js';

const clamp=(v,lo=0,hi=100)=>Math.max(lo,Math.min(hi,Number(v)||0));
const SUPPORT_MODELS=Object.freeze({
  family_diy:{label:'We do everything ourselves',familyLabor:88,cashCost:18,maintenanceBase:52,provider:'family'},
  guardian_mechanic:{label:'Parent / guardian is primary mechanic',familyLabor:82,cashCost:22,maintenanceBase:66,provider:'guardian'},
  local_shop:{label:'Local shop helps us',familyLabor:45,cashCost:55,maintenanceBase:72,provider:'shop'},
  professional:{label:'We pay for professional help',familyLabor:18,cashCost:88,maintenanceBase:86,provider:'professional'},
  hybrid:{label:'Hybrid support',familyLabor:55,cashCost:50,maintenanceBase:74,provider:'mixed'},
});
const HOMES=Object.freeze({
  minimal:{label:'Small home / minimal storage',storage:24,workspace:12,parking:22,toolLevel:18,rideSpace:0,upkeep:12,expandability:18,transportConstraint:78},
  basic:{label:'Typical home + shed / basic garage',storage:48,workspace:38,parking:48,toolLevel:35,rideSpace:5,upkeep:28,expandability:42,transportConstraint:52},
  workshop:{label:'Home with usable workshop / garage',storage:72,workspace:74,parking:65,toolLevel:62,rideSpace:8,upkeep:45,expandability:58,transportConstraint:30},
  rural:{label:'Rural property with space to ride / work',storage:76,workspace:62,parking:84,toolLevel:48,rideSpace:72,upkeep:78,expandability:88,transportConstraint:20},
});
const SUPPORT_KEYS=new Set(Object.keys(SUPPORT_MODELS));
const HOME_KEYS=new Set(Object.keys(HOMES));
const key=(value,allowed,fallback)=>allowed.has(value)?value:fallback;

export function createRacingSupportHomeState(raw={}){
  return {version:2,supportModel:key(raw.supportModel,SUPPORT_KEYS,'family_diy'),home:key(raw.home,HOME_KEYS,'basic'),assignments:{wrenching:raw.assignments?.wrenching??null,transport:raw.assignments?.transport??null,registration:raw.assignments?.registration??null,schoolCoordination:raw.assignments?.schoolCoordination??null,financialSupport:raw.assignments?.financialSupport??null},provider:raw.provider?{...raw.provider}:null};
}
function guardianByRole(people,role){return people.find(p=>p.familyBuilder?.guardian?.roles?.[role])??people[0]??null;}
function providerActor(support,people){
  if(support.provider==='family'||support.provider==='guardian') return guardianByRole(people,'wrenches');
  if(support.provider==='shop') return ensureRecurringBond({id:'support-local-shop',name:'Local Shop',role:'Dealer',values:{trust:58,respect:58,reliability:62}},'Dealer');
  if(support.provider==='professional') return ensureRecurringBond({id:'support-pro-mechanic',name:'Professional Mechanic',role:'Mechanic',values:{trust:55,respect:64,reliability:78}},'Mechanic');
  return guardianByRole(people,'wrenches')??ensureRecurringBond({id:'support-local-shop',name:'Local Shop',role:'Dealer',values:{trust:55,respect:58,reliability:62}},'Dealer');
}
export function resolveRacingSupport(builderRaw={},supportRaw={}){
  const builder=createFamilyLifeBuilderState(builderRaw),state=createRacingSupportHomeState(supportRaw),support=SUPPORT_MODELS[state.supportModel],knowledge=motocrossBackground(builder.motocrossKnowledge),people=ensureHouseholdActors(builder),provider=providerActor(support,people);
  const assigned=(field,role)=>state.assignments[field]??guardianByRole(people,role)?.id??provider?.id??null;
  const maintenanceCapacity=clamp(support.maintenanceBase+knowledge.maintenanceKnowledge*.25);
  const advicePrecision=clamp(knowledge.advicePrecision+(support.provider==='professional'?8:support.provider==='shop'?4:0));
  return {version:2,model:state.supportModel,label:support.label,people:[...people,...(!people.some(p=>p.id===provider?.id)&&provider?[provider]:[])],primaryProviderId:provider?.id??null,assignments:{wrenching:assigned('wrenching','wrenches'),transport:assigned('transport','attendsRaces'),registration:assigned('registration','attendsRaces'),schoolCoordination:assigned('schoolCoordination','travelSchool'),financialSupport:assigned('financialSupport','financialSupport')},garageSupport:{maintenanceCapacity:Math.round(maintenanceCapacity),advicePrecision:Math.round(advicePrecision),familyLabor:support.familyLabor},economy:{supportCostPressure:support.cashCost,expenseOwnerId:provider?.id??assigned('financialSupport','financialSupport')},life:{familyTimeLoad:support.familyLabor,sacrificeRisk:Math.round(clamp(support.familyLabor*.7+(100-(provider?.familyBuilder?.guardian?.availability??75))*.3))},riderPerformanceModifiers:{}};
}
export function raceWeekendSupportAttribution(builderRaw={},supportRaw={}){
  const resolved=resolveRacingSupport(builderRaw,supportRaw);return {mechanicId:resolved.assignments.wrenching,transportId:resolved.assignments.transport,logisticsId:resolved.assignments.registration,schoolCoordinatorId:resolved.assignments.schoolCoordination,payerId:resolved.assignments.financialSupport,primaryProviderId:resolved.primaryProviderId};
}
export function startingHomeCircumstances(builderRaw={},supportRaw={}){
  const builder=createFamilyLifeBuilderState(builderRaw),state=createRacingSupportHomeState(supportRaw),home=HOMES[state.home],finance=financialBackground(builder.financial),support=resolveRacingSupport(builder,state);
  const toolBonus=builder.motocrossKnowledge==='industry'?12:builder.motocrossKnowledge==='motocross_family'?7:0;
  const toolLevel=clamp(home.toolLevel+toolBonus);
  const equipmentPosture=finance.equipment;
  return {version:2,homeId:state.home,label:home.label,property:{storageCapacity:home.storage,workspaceCapacity:home.workspace,parkingCapacity:home.parking,ridingSpace:home.rideSpace,expandability:home.expandability,upkeepPressure:home.upkeep,transportConstraint:home.transportConstraint},garage:{toolLevel:Math.round(toolLevel),maintenanceCapacity:Math.round(clamp((home.workspace*.45)+(toolLevel*.3)+(support.garageSupport.maintenanceCapacity*.25))),supportProviderId:support.primaryProviderId},equipment:{startingPosture:equipmentPosture,storageConstraint:home.storage<35?'severe':home.storage<60?'limited':'comfortable',newBikeExpectation:equipmentPosture==='premium-capable'||equipmentPosture==='new-capable'},economy:{propertyUpkeepPressure:home.upkeep,supportCostPressure:support.economy.supportCostPressure},compoundSeed:{propertyType:state.home,buildableSpace:home.expandability,ridingSpaceEligibility:home.rideSpace>=50},riderPerformanceModifiers:{}};
}
export function familySupportHomeSummary(builderRaw={},supportRaw={}){const support=resolveRacingSupport(builderRaw,supportRaw),home=startingHomeCircumstances(builderRaw,supportRaw);return {support:support.label,primaryProviderId:support.primaryProviderId,home:home.label,maintenanceCapacity:home.garage.maintenanceCapacity,storageConstraint:home.equipment.storageConstraint,pressures:[home.economy.propertyUpkeepPressure>=65?'property upkeep':null,support.life.familyTimeLoad>=70?'family time':null,support.economy.supportCostPressure>=70?'paid support cost':null,home.property.transportConstraint>=65?'storage / transport':null].filter(Boolean),strengths:[home.property.ridingSpace>=50?'space to ride':null,home.garage.toolLevel>=60?'strong tool setup':null,support.garageSupport.advicePrecision>=70?'experienced support':null].filter(Boolean)};}
