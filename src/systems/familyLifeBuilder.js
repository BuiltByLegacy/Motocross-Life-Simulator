import { ensureRelationshipLifecycle } from './peopleRelationships2.js';

const FINANCES = Object.freeze({
  tight:{label:'Tight',cashFactor:.55,supportBudget:35,pressure:82,equipment:'used-budget',network:0},
  comfortable:{label:'Comfortable',cashFactor:1,supportBudget:55,pressure:48,equipment:'mixed-used-new',network:1},
  well_off:{label:'Well-off',cashFactor:1.8,supportBudget:78,pressure:24,equipment:'new-capable',network:2},
  wealthy:{label:'Wealthy',cashFactor:3.2,supportBudget:92,pressure:12,equipment:'premium-capable',network:3},
});
const KNOWLEDGE = Object.freeze({
  new:{label:'New to motocross',advicePrecision:25,networkExposure:10,maintenanceKnowledge:15,expectation:30},
  weekend:{label:'Weekend racing family',advicePrecision:50,networkExposure:35,maintenanceKnowledge:45,expectation:50},
  motocross_family:{label:'Motocross family',advicePrecision:72,networkExposure:62,maintenanceKnowledge:70,expectation:70},
  industry:{label:'Industry family',advicePrecision:88,networkExposure:86,maintenanceKnowledge:82,expectation:82},
});
const SCHOOL = Object.freeze({
  public:{label:'Public school',weekdayFlex:20,absencePressure:75,schoolwork:65,travelFlex:25,costPressure:5},
  private:{label:'Private school',weekdayFlex:18,absencePressure:82,schoolwork:72,travelFlex:22,costPressure:35},
  homeschool:{label:'Homeschool',weekdayFlex:78,absencePressure:20,schoolwork:68,travelFlex:82,costPressure:18},
  online:{label:'Online / flexible school',weekdayFlex:68,absencePressure:30,schoolwork:72,travelFlex:72,costPressure:12},
});
const HOUSEHOLDS = new Set(['two_parent','single_parent','split_household','guardian_household']);
const SCHOOL_KEYS = new Set(Object.keys(SCHOOL));
const FINANCE_KEYS = new Set(Object.keys(FINANCES));
const KNOWLEDGE_KEYS = new Set(Object.keys(KNOWLEDGE));
const clamp=(v,lo=0,hi=100)=>Math.max(lo,Math.min(hi,Number(v)||0));
const key=(value,allowed,fallback)=>allowed.has(value)?value:fallback;

export function createFamilyLifeBuilderState(raw={}){
  return {version:2,financial:key(raw.financial,FINANCE_KEYS,'comfortable'),motocrossKnowledge:key(raw.motocrossKnowledge,KNOWLEDGE_KEYS,'weekend'),household:key(raw.household,HOUSEHOLDS,'two_parent'),school:key(raw.school,SCHOOL_KEYS,'public'),guardians:Array.isArray(raw.guardians)?raw.guardians.map(normalizeGuardian):[],history:Array.isArray(raw.history)?[...raw.history]:[]};
}
export function financialBackground(id){return {...FINANCES[key(id,FINANCE_KEYS,'comfortable')]};}
export function motocrossBackground(id){return {...KNOWLEDGE[key(id,KNOWLEDGE_KEYS,'weekend')]};}
export function schoolStructure(id){return {...SCHOOL[key(id,SCHOOL_KEYS,'public')]};}

function normalizeGuardian(raw={},index=0){
  const relation=raw.relation??(index===0?'Parent':'Guardian');
  return {id:String(raw.id??`guardian-${index+1}`),name:String(raw.name??relation),relation,roles:{attendsRaces:raw.roles?.attendsRaces!==false,wrenches:!!raw.roles?.wrenches,travelSchool:!!raw.roles?.travelSchool,financialSupport:raw.roles?.financialSupport!==false,emotionalSupport:raw.roles?.emotionalSupport!==false},motocrossKnowledge:key(raw.motocrossKnowledge,KNOWLEDGE_KEYS,'new'),availability:clamp(raw.availability??70)};
}
export function householdTemplate(type='two_parent'){
  const t=key(type,HOUSEHOLDS,'two_parent');
  if(t==='single_parent')return [normalizeGuardian({id:'parent-1',name:'Parent',relation:'Parent',roles:{attendsRaces:true,travelSchool:true,financialSupport:true,emotionalSupport:true}})];
  if(t==='split_household')return [normalizeGuardian({id:'parent-1',name:'Parent 1',relation:'Parent',availability:62,roles:{attendsRaces:true,financialSupport:true,emotionalSupport:true}}),normalizeGuardian({id:'parent-2',name:'Parent 2',relation:'Parent',availability:55,roles:{travelSchool:true,financialSupport:true,emotionalSupport:true}})];
  if(t==='guardian_household')return [normalizeGuardian({id:'guardian-1',name:'Guardian',relation:'Guardian',roles:{attendsRaces:true,travelSchool:true,financialSupport:true,emotionalSupport:true}})];
  return [normalizeGuardian({id:'parent-1',name:'Parent 1',relation:'Parent',roles:{attendsRaces:true,wrenches:true,financialSupport:true,emotionalSupport:true}}),normalizeGuardian({id:'parent-2',name:'Parent 2',relation:'Parent',roles:{travelSchool:true,financialSupport:true,emotionalSupport:true}})];
}
export function ensureHouseholdActors(builderRaw={}){
  const builder=createFamilyLifeBuilderState(builderRaw);const guardians=builder.guardians.length?builder.guardians:householdTemplate(builder.household);
  return guardians.map((g)=>ensureRelationshipLifecycle({id:g.id,name:g.name,role:g.relation,values:{trust:72,respect:68,friendship:72,support:g.roles.emotionalSupport?78:55,reliability:Math.round(g.availability)},familyBuilder:{guardian:g}}));
}
export function startingCircumstances(builderRaw={},ctx={}){
  const b=createFamilyLifeBuilderState(builderRaw),f=FINANCES[b.financial],k=KNOWLEDGE[b.motocrossKnowledge],s=SCHOOL[b.school];
  const baseCash=Math.max(0,Number(ctx.baseCash??1200));
  return {version:2,choices:b,economy:{startingCash:Math.round(baseCash*f.cashFactor),supportBudget:f.supportBudget,financialPressure:f.pressure,equipmentExpectation:f.equipment},motocross:{...k,networkExposure:clamp(k.networkExposure+f.network)},school:{...s,id:b.school},people:ensureHouseholdActors(b),opportunityContext:{familyNetworkExposure:clamp(k.networkExposure+f.network),advicePrecision:k.advicePrecision},riderPerformanceModifiers:{}};
}
export function schoolWeekConstraints(builderRaw={},ctx={}){
  const b=createFamilyLifeBuilderState(builderRaw),s=SCHOOL[b.school],age=Number(ctx.age??10),raceTravelDays=Math.max(0,Number(ctx.raceTravelDays??0));
  const youthFactor=age<13?1.08:age<18?1:.75;
  return {school:b.school,weekdayFlex:Math.round(s.weekdayFlex),travelFlex:Math.round(s.travelFlex),absencePressure:Math.round(clamp(s.absencePressure*youthFactor+raceTravelDays*3)),schoolworkLoad:Math.round(clamp(s.schoolwork*youthFactor)),missedSchoolRisk:Math.round(clamp(raceTravelDays*(100-s.travelFlex)/8)),responsibilities:['schoolwork',...(raceTravelDays>0?['travel-catch-up']:[])]};
}
export function changeSchoolStructure(builderRaw,nextSchool,meta={}){const b=createFamilyLifeBuilderState(builderRaw),next=key(nextSchool,SCHOOL_KEYS,b.school);if(next!==b.school){b.history.push({kind:'school-change',from:b.school,to:next,seasonNumber:Number(meta.seasonNumber??1),week:Number(meta.week??0),reason:meta.reason??'family-choice'});b.school=next;}return b;}
export function familyBuilderSummary(builderRaw={},ctx={}){const state=startingCircumstances(builderRaw,ctx),b=state.choices;return {financial:FINANCES[b.financial].label,motocross:KNOWLEDGE[b.motocrossKnowledge].label,household:b.household,school:SCHOOL[b.school].label,startingCash:state.economy.startingCash,pressures:[state.economy.financialPressure>=65?'money':null,state.school.absencePressure>=65?'school absences':null].filter(Boolean),strengths:[state.motocross.maintenanceKnowledge>=65?'mechanical knowledge':null,state.motocross.networkExposure>=60?'motocross connections':null,state.school.travelFlex>=65?'schedule flexibility':null].filter(Boolean)};}
