// Game State
// ----------
// The single source of truth for one playthrough. Kept as plain data so it can
// be serialized (save/load) and inspected. Engines never store their own copy
// of the world; they read and mutate this.

import { PEOPLE, PEOPLE_PARENT, BIKE_FOR_CLASS, CLASS_FOR_AGE, EVENT_POOL, defaultProgram, buildScheduleFromProgram } from '../data/content.js';

let _uid = 0;
export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${(_uid++).toString(36)}`;
}

export const CURRENT_YEAR = new Date().getFullYear();

// Scale a young rider's starting ability down — a 4-year-old on a PW50 is not a
// 9-year-old. Skills then grow through play and across seasons (growing up).
export function ageSkillFactor(age) {
  return Math.max(0.45, Math.min(1.15, 0.55 + (age - 4) * 0.07));
}

export function createInitialState(riderName = 'Riley', seed = Date.now(), birthdate = '2022-05-15', campaign = 'rider') {
  const birthYear = parseInt(String(birthdate).slice(0, 4), 10) || CURRENT_YEAR - 4;
  const startYear = CURRENT_YEAR;
  const age = Math.max(3, startYear - birthYear);
  const klass = CLASS_FOR_AGE(age);
  const f = ageSkillFactor(age);
  const sk = (n) => Math.round(n * f);
  const people = campaign === 'parent' ? PEOPLE_PARENT : PEOPLE;
  const relationships = {};
  for (const p of people) {
    relationships[p.id] = {
      id: p.id,
      name: p.id === 'child' ? riderName : p.name,
      role: p.role,
      values: { ...p.startValues },
      arcStage: p.arcStages ? 0 : null,
      sharedMemories: [],
    };
  }

  return {
    seed,
    week: 1,
    phase: 'planning',

    rider: {
      name: riderName,
      avatar: '🧒',
      birthdate,
      birthYear,
      age,
      klass,
      skills: {
        starts: sk(34),
        cornering: sk(38),
        jumping: sk(30),
        whoops: sk(28),
        raceIQ: sk(32),
        consistency: sk(40),
        fitness: sk(45),
      },
      confidence: 50,
      fatigue: 0,
      burnout: 0,
      injury: null,
    },

    family: {
      money: 1200,
      stress: 20,
      support_level: 0,
    },

    bike: BIKE_FOR_CLASS(klass, startYear - 1),

    garage: {
      bikes: [],
      trophies: [],
      objects: [],
      parts: [],
    },

    relationships,
    memories: [],
    news: [],

    season: {
      results: [],
      points: 0,
      bestFinish: null,
    },

    market: {
      listings: [],
      seenIds: [],
    },

    opportunities: [],
    sponsors: [],
    flags: {},
    schedule: [],
    pendingScenario: null,
    lastRace: null,
    logbook: [],

    campaign: 'rider',
    schoolMode: 'school',
    program: defaultProgram(EVENT_POOL()),
    programSet: false,
    seasonGoals: [],
    calendar: buildScheduleFromProgram(EVENT_POOL(), null),
    lorettaPath: null,
    progression: null,
    standings: null,
    momentum: null,
    rivals: null,
    assets: null,
    memTriggers: null,
    notifications: null,
    phoneState: null,
    raceWeekend: null,
    responsibility: null,
    garageUpgrades: [],
    seasonCommit: null,
    tutorial: null,
    seasonLifecycle: null,
    lifeBetweenRaces: null, // canonical off-week decisions/training/recovery (#387-#389)
    seasonNumber: 1,
    startYear,
    _preparedWeek: 0,
    chainQueue: [],
    careerHistory: [],
  };
}
