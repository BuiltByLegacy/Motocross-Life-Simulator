// Game State
// ----------
// The single source of truth for one playthrough. Kept as plain data so it can
// be serialized (save/load) and inspected. Engines never store their own copy
// of the world; they read and mutate this.

import { PEOPLE, PEOPLE_PARENT, BIKE_FOR_CLASS, CLASS_FOR_AGE } from '../data/content.js';

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
      // In Parent mode the "child" person is named after the rider.
      name: p.id === 'child' ? riderName : p.name,
      role: p.role,
      // Hidden values, expressed through behavior (Relationship Engine).
      values: { ...p.startValues },
      arcStage: p.arcStages ? 0 : null,
      sharedMemories: [],
    };
  }

  return {
    seed,
    week: 1,
    phase: 'planning', // planning | scenario | prerace | race | recap | season_over

    rider: {
      name: riderName,
      birthdate,
      birthYear,
      age,
      klass,
      // Skills, 0-100, scaled by age. Expectation inputs for the race sim.
      skills: {
        starts: sk(34),
        cornering: sk(38),
        jumping: sk(30),
        whoops: sk(28),
        raceIQ: sk(32),
        consistency: sk(40),
        fitness: sk(45),
      },
      confidence: 50, // 0-100, volatile (the kid's morale, in Parent mode)
      fatigue: 0, // 0-100, higher = worse
      burnout: 0, // 0-100, Parent-mode: how worn-down on racing the kid is
      injury: null, // { name, weeksOut, severity }
    },

    family: {
      money: 1200,
      stress: 20, // 0-100 household stress (Parent Marriage / world sim)
      // Parent approval, hidden, gates certain choices.
      support_level: 0, // Career Support Ladder (0 = Family Supported)
    },

    // The race bike is an Asset with identity and history (DD-0011).
    bike: BIKE_FOR_CLASS(klass, startYear - 1),

    garage: {
      trophies: [],
      objects: [], // object-memory carrying items (helmets, plates...)
      parts: [], // owned spare parts / gear not yet installed
    },

    relationships,

    memories: [],
    news: [],

    season: {
      results: [], // { week, race, moto1, moto2, overall, points }
      points: 0,
      bestFinish: null,
    },

    market: {
      listings: [], // active marketplace listings
      seenIds: [],
    },

    opportunities: [], // open opportunities (Opportunity Engine)
    flags: {},
    schedule: [], // activities chosen for the current week
    pendingScenario: null,
    lastRace: null, // transient race result for the race screen
    logbook: [], // human-readable week-by-week diary for the recap

    // ---- multi-week / multi-season / campaign scaffolding ----
    campaign: 'rider', // 'rider' | 'parent' (DD-0012)
    schoolMode: 'school', // 'school' | 'homeschool' (issue #5)
    seasonNumber: 1,
    startYear, // calendar year of season 1; season year = startYear + seasonNumber - 1
    _preparedWeek: 0, // guards once-per-week setup across save/load
    chainQueue: [], // scheduled follow-up scenarios: { dueWeek, scenarioId }
    careerHistory: [], // one entry per completed season
  };
}

