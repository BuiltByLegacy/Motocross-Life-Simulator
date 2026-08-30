import { createRiderDevelopmentProfile, migrateLegacySkills, legacySkillView, RIDER_SKILLS } from './riderDevelopment.js';

export const RIDER_DEVELOPMENT_SCHEMA_VERSION=2;

export function migrateRiderDevelopmentState(raw={}){
  if(raw?.version===2&&raw.skills)return createRiderDevelopmentProfile(raw);
  const source=raw?.development??raw;
  const legacySkills=source?.skills??raw?.skills??{};
  const traits=source?.traits&& !Array.isArray(source.traits)?source.traits:{};
  const profile=createRiderDevelopmentProfile({skills:migrateLegacySkills(legacySkills),traits,age:source?.age??raw?.age??12,history:source?.history??[]});
  profile.history=[...profile.history,{type:'migration',source:'rider-development-2',fromVersion:Number(raw?.version||1),toVersion:2}];
  return profile;
}

export function attachRiderDevelopment(riderRaw={}){
  const rider={...riderRaw};
  const profile=migrateRiderDevelopmentState(rider.development??rider);
  return {...rider,development:profile,skills:legacySkillView(profile)};
}

export function serializeRiderDevelopment(profileRaw){
  const p=createRiderDevelopmentProfile(profileRaw);
  return {version:2,age:p.age,skills:{...p.skills},traits:{...p.traits},history:p.history.map(x=>({...x,gains:x.gains?{...x.gains}:x.gains}))};
}

export function restoreRiderDevelopment(raw){return migrateRiderDevelopmentState(raw);}

export function validateRiderDevelopment(profileRaw){
  const p=createRiderDevelopmentProfile(profileRaw),errors=[];
  if(p.version!==2)errors.push('schema-version');
  for(const skill of RIDER_SKILLS){const value=p.skills[skill];if(!Number.isFinite(value)||value<0||value>100)errors.push(`skill:${skill}`);}
  if(!Number.isFinite(p.age)||p.age<3||p.age>80)errors.push('age');
  if(!Array.isArray(p.history))errors.push('history');
  return {valid:errors.length===0,errors,profile:p};
}

export function developmentSaveRoundTrip(profileRaw){return restoreRiderDevelopment(JSON.parse(JSON.stringify(serializeRiderDevelopment(profileRaw))));}
