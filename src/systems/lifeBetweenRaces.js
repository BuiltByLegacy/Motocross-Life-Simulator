// Life Between Races 2.0
// -----------------------
// Canonical domain layer for meaningful non-race periods. The UI asks this
// system what matters; the system never owns a second copy of Game state.
// Future issues (#390-#393) can register additional decision families without
// replacing this lifecycle.

const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

export const LIFE_BETWEEN_RACES_VERSION = 1;

export const TRAINING_CATALOG = Object.freeze({
  starts: {
    id: 'starts', label: 'Gate & Starts', family: 'training', time: 1, cost: 15,
    load: 8, fatigue: 6, confidence: 1, targets: ['starts'],
    description: 'Short, high-quality gate reps and first-turn work.',
  },
  technique: {
    id: 'technique', label: 'Technique Session', family: 'training', time: 1, cost: 20,
    load: 9, fatigue: 7, confidence: 1, targets: ['cornering', 'whoops', 'consistency'],
    description: 'Deliberate corners, ruts, braking points and rough-track technique.',
  },
  motos: {
    id: 'motos', label: 'Full Motos', family: 'training', time: 2, cost: 40,
    load: 18, fatigue: 13, confidence: 2, targets: ['cornering', 'jumping', 'whoops', 'raceIQ', 'fitness'],
    description: 'Race-length motos: the biggest stimulus and the biggest recovery bill.',
  },
  conditioning: {
    id: 'conditioning', label: 'Conditioning', family: 'training', time: 1, cost: 0,
    load: 10, fatigue: 7, confidence: 0, targets: ['fitness', 'consistency'],
    description: 'Cardio and strength aimed at keeping execution together late in a moto.',
  },
  coaching: {
    id: 'coaching', label: 'Coached Practice', family: 'training', time: 2, cost: 90,
    load: 12, fatigue: 9, confidence: 2, targets: ['cornering', 'jumping', 'raceIQ', 'consistency'],
    quality: 1.25,
    description: 'A focused day with feedback. Expensive, but efficient when the fit is good.',
  },
  light_ride: {
    id: 'light_ride', label: 'Light Ride', family: 'training', time: 1, cost: 15,
    load: 4, fatigue: 2, confidence: 1, targets: ['consistency', 'raceIQ'],
    quality: 0.65,
    description: 'Easy technique and feel without turning the week into another race weekend.',
  },
});

export const RECOVERY_CATALOG = Object.freeze({
  full_rest: {
    id: 'full_rest', label: 'Full Rest', family: 'recovery', time: 1, cost: 0,
    fatigue: -18, stress: -3, confidence: 0, recoveryQuality: 1.0,
    description: 'Do less on purpose. The highest-value choice when the body is carrying too much load.',
  },
  sleep_focus: {
    id: 'sleep_focus', label: 'Sleep & Routine', family: 'recovery', time: 1, cost: 0,
    fatigue: -12, stress: -2, confidence: 1, recoveryQuality: 0.85,
    description: 'Protect sleep, food, hydration and routine for a quieter recovery gain.',
  },
  active_recovery: {
    id: 'active_recovery', label: 'Active Recovery', family: 'recovery', time: 1, cost: 0,
    fatigue: -9, stress: -1, confidence: 1, recoveryQuality: 0.7,
    description: 'Easy movement and mobility that helps without adding meaningful riding load.',
  },
  therapy: {
    id: 'therapy', label: 'Treatment / Therapy', family: 'recovery', time: 1, cost: 55,
    fatigue: -13, stress: -2, confidence: 1, recoveryQuality: 1.15,
    injuryRecovery: 1,
    description: 'Spend money and time to improve recovery when soreness or injury is becoming the week.',
  },
});

export function createLifeBetweenRacesState() {
  return {
    version: LIFE_BETWEEN_RACES_VERSION,
    active: null,
    periods: [],
    trainingHistory: [],
    recoveryHistory: [],
  };
}

export function restoreLifeBetweenRacesState(raw) {
  const base = createLifeBetweenRacesState();
  if (!raw || typeof raw !== 'object') return base;
  return {
    ...base,
    ...raw,
    version: LIFE_BETWEEN_RACES_VERSION,
    periods: Array.isArray(raw.periods) ? raw.periods : [],
    trainingHistory: Array.isArray(raw.trainingHistory) ? raw.trainingHistory : [],
    recoveryHistory: Array.isArray(raw.recoveryHistory) ? raw.recoveryHistory : [],
  };
}

export function buildOffWeekContext(input = {}) {
  const fatigue = clamp(Number(input.rider?.fatigue ?? 0));
  const familyStress = clamp(Number(input.family?.stress ?? 0));
  const bikeCondition = clamp(Number(input.bike?.condition ?? 100));
  const availableSlots = Math.max(0, Number(input.availableSlots ?? 0));
  const nextRaceWeek = input.nextRaceWeek ?? null;
  const weeksToRace = nextRaceWeek == null ? null : Math.max(0, Number(nextRaceWeek) - Number(input.week ?? 1));
  const injury = input.rider?.injury ?? null;
  const bodyReadiness = clamp(100 - fatigue - (injury ? 18 + 8 * Math.max(0, Number(injury.severity ?? 1) - 1) : 0));
  const pressure = clamp(
    (weeksToRace === 1 ? 28 : weeksToRace === 2 ? 14 : 0)
    + Math.max(0, 55 - bikeCondition) * 0.35
    + Math.max(0, familyStress - 50) * 0.25,
  );
  return {
    week: Number(input.week ?? 1),
    seasonNumber: Number(input.seasonNumber ?? 1),
    isRaceWeek: !!input.isRaceWeek,
    nextRaceWeek,
    weeksToRace,
    availableSlots,
    fatigue,
    familyStress,
    money: Math.max(0, Number(input.family?.money ?? 0)),
    bikeCondition,
    injury,
    bodyReadiness,
    pressure,
    schoolMode: input.schoolMode ?? 'school',
    age: Number(input.rider?.age ?? 18),
  };
}

export function offWeekKey(ctx) {
  return `s${ctx.seasonNumber}:w${ctx.week}`;
}

export function openBetweenRacesPeriod(state, ctxInput = {}) {
  const next = restoreLifeBetweenRacesState(state);
  const ctx = buildOffWeekContext(ctxInput);
  if (ctx.isRaceWeek || ctx.availableSlots <= 0) {
    next.active = null;
    return { state: next, period: null, context: ctx };
  }
  const key = offWeekKey(ctx);
  const existing = next.periods.find((p) => p.key === key);
  if (existing) {
    next.active = existing.key;
    return { state: next, period: existing, context: ctx };
  }
  const period = {
    key,
    seasonNumber: ctx.seasonNumber,
    week: ctx.week,
    opened: true,
    closed: false,
    timeBudget: ctx.availableSlots,
    timeUsed: 0,
    trainingLoad: 0,
    choices: [],
    opening: {
      fatigue: ctx.fatigue,
      bodyReadiness: ctx.bodyReadiness,
      money: ctx.money,
      familyStress: ctx.familyStress,
      bikeCondition: ctx.bikeCondition,
      weeksToRace: ctx.weeksToRace,
    },
  };
  next.periods.push(period);
  next.active = key;
  return { state: next, period, context: ctx };
}

export function activePeriod(state) {
  const s = restoreLifeBetweenRacesState(state);
  return s.active ? s.periods.find((p) => p.key === s.active) ?? null : null;
}

export function recentTrainingCount(state, trainingId, { lookback = 3 } = {}) {
  const history = restoreLifeBetweenRacesState(state).trainingHistory;
  return history.slice(-lookback).filter((h) => h.trainingId === trainingId).length;
}

export function diminishingReturnFactor(state, trainingId) {
  const repeats = recentTrainingCount(state, trainingId, { lookback: 4 });
  return Math.max(0.45, 1 - repeats * 0.16);
}

export function trainingRisk({ fatigue = 0, weeklyLoad = 0, addedLoad = 0, injury = null, bodyReadiness = 100 } = {}) {
  const loadAfter = Math.max(0, weeklyLoad + addedLoad);
  let score = fatigue * 0.35 + Math.max(0, loadAfter - 18) * 1.45 + Math.max(0, 60 - bodyReadiness) * 0.5;
  if (injury) score += 24 + Number(injury.severity ?? 1) * 5;
  const risk = clamp(Math.round(score));
  return {
    score: risk,
    band: risk >= 70 ? 'high' : risk >= 42 ? 'elevated' : risk >= 20 ? 'managed' : 'low',
  };
}

export function evaluateTrainingOption(state, trainingId, ctxInput = {}) {
  const training = TRAINING_CATALOG[trainingId];
  if (!training) return { allowed: false, reason: 'unknown-training' };
  const ctx = buildOffWeekContext(ctxInput);
  const period = activePeriod(state);
  const timeLeft = Math.max(0, (period?.timeBudget ?? ctx.availableSlots) - (period?.timeUsed ?? 0));
  if (training.time > timeLeft) return { allowed: false, reason: 'not-enough-time', training };
  if (training.cost > ctx.money) return { allowed: false, reason: 'not-enough-money', training };
  if (ctx.injury?.weeksOut > 0 && ['motos', 'coaching'].includes(trainingId)) {
    return { allowed: false, reason: 'injury-restriction', training };
  }
  const risk = trainingRisk({
    fatigue: ctx.fatigue,
    weeklyLoad: period?.trainingLoad ?? 0,
    addedLoad: training.load,
    injury: ctx.injury,
    bodyReadiness: ctx.bodyReadiness,
  });
  const factor = diminishingReturnFactor(state, trainingId);
  return { allowed: true, training, risk, diminishingFactor: factor, timeLeft };
}

export function evaluateRecoveryOption(state, recoveryId, ctxInput = {}) {
  const recovery = RECOVERY_CATALOG[recoveryId];
  if (!recovery) return { allowed: false, reason: 'unknown-recovery' };
  const ctx = buildOffWeekContext(ctxInput);
  const period = activePeriod(state);
  const timeLeft = Math.max(0, (period?.timeBudget ?? ctx.availableSlots) - (period?.timeUsed ?? 0));
  if (recovery.time > timeLeft) return { allowed: false, reason: 'not-enough-time', recovery };
  if (recovery.cost > ctx.money) return { allowed: false, reason: 'not-enough-money', recovery };
  return { allowed: true, recovery, timeLeft };
}

export function buildOffWeekDecisionSet(state, ctxInput = {}) {
  const ctx = buildOffWeekContext(ctxInput);
  if (ctx.isRaceWeek) return [];
  const period = activePeriod(state);
  const load = period?.trainingLoad ?? 0;
  const recoveryFirst = ctx.fatigue >= 55 || ctx.injury || load >= 20;
  const trainingIds = recoveryFirst
    ? ['light_ride', 'starts', 'technique', 'conditioning']
    : ctx.weeksToRace === 1
      ? ['starts', 'technique', 'light_ride', 'motos']
      : ['motos', 'technique', 'starts', 'conditioning', 'coaching'];
  const recoveryIds = ctx.injury ? ['therapy', 'full_rest', 'sleep_focus', 'active_recovery'] : ['full_rest', 'sleep_focus', 'active_recovery'];
  const options = [];
  const push = (family, id, evalResult) => {
    if (!evalResult.allowed) return;
    const def = family === 'training' ? evalResult.training : evalResult.recovery;
    options.push({
      family, id, label: def.label, description: def.description,
      time: def.time, cost: def.cost,
      risk: evalResult.risk ?? null,
      diminishingFactor: evalResult.diminishingFactor ?? null,
      recommended: false,
    });
  };
  if (recoveryFirst) recoveryIds.forEach((id) => push('recovery', id, evaluateRecoveryOption(state, id, ctxInput)));
  trainingIds.forEach((id) => push('training', id, evaluateTrainingOption(state, id, ctxInput)));
  if (!recoveryFirst) recoveryIds.forEach((id) => push('recovery', id, evaluateRecoveryOption(state, id, ctxInput)));
  if (options.length) {
    const preferred = recoveryFirst ? options.find((o) => o.family === 'recovery') : options.find((o) => o.family === 'training' && o.risk?.band !== 'high');
    if (preferred) preferred.recommended = true;
  }
  return options;
}

function deterministicUnit(seedText) {
  let h = 2166136261;
  for (const ch of String(seedText)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

function skillGain(base, factor, quality, roll) {
  const variance = 0.82 + roll * 0.36;
  return Math.max(0, Math.round(base * factor * quality * variance));
}

export function resolveTrainingDecision(state, trainingId, ctxInput = {}, { seed = 1 } = {}) {
  const next = restoreLifeBetweenRacesState(state);
  const check = evaluateTrainingOption(next, trainingId, ctxInput);
  if (!check.allowed) return { state: next, error: check.reason, decision: null };
  const period = activePeriod(next);
  if (!period) return { state: next, error: 'no-active-period', decision: null };
  const training = check.training;
  const quality = Number(training.quality ?? 1);
  const gains = {};
  training.targets.forEach((target, index) => {
    const roll = deterministicUnit(`${seed}:${period.key}:${trainingId}:${period.choices.length}:${target}:${index}`);
    const base = trainingId === 'motos' || trainingId === 'coaching' ? 1.5 : 1.1;
    gains[target] = skillGain(base, check.diminishingFactor, quality, roll);
  });
  const decision = {
    id: `${period.key}:d${period.choices.length + 1}`,
    family: 'training', trainingId,
    time: training.time, cost: training.cost,
    load: training.load, fatigueDelta: training.fatigue,
    confidenceDelta: training.confidence,
    gains,
    diminishingFactor: check.diminishingFactor,
    risk: check.risk,
  };
  period.timeUsed += training.time;
  period.trainingLoad += training.load;
  period.choices.push(decision);
  next.trainingHistory.push({ periodKey: period.key, week: period.week, trainingId, load: training.load, gains, risk: check.risk.band });
  return { state: next, decision, error: null };
}

export function resolveRecoveryDecision(state, recoveryId, ctxInput = {}) {
  const next = restoreLifeBetweenRacesState(state);
  const check = evaluateRecoveryOption(next, recoveryId, ctxInput);
  if (!check.allowed) return { state: next, error: check.reason, decision: null };
  const period = activePeriod(next);
  if (!period) return { state: next, error: 'no-active-period', decision: null };
  const recovery = check.recovery;
  const fatigueNow = Number(ctxInput.rider?.fatigue ?? 0);
  // Recovery gets less valuable near zero fatigue, avoiding infinite free value.
  const fatigueScale = clamp(fatigueNow / 35, 0.35, 1);
  const fatigueDelta = Math.round(recovery.fatigue * fatigueScale * recovery.recoveryQuality);
  const decision = {
    id: `${period.key}:d${period.choices.length + 1}`,
    family: 'recovery', recoveryId,
    time: recovery.time, cost: recovery.cost,
    fatigueDelta,
    stressDelta: recovery.stress,
    confidenceDelta: recovery.confidence,
    injuryRecovery: recovery.injuryRecovery ?? 0,
    recoveryQuality: recovery.recoveryQuality,
  };
  period.timeUsed += recovery.time;
  period.choices.push(decision);
  next.recoveryHistory.push({ periodKey: period.key, week: period.week, recoveryId, fatigueDelta, injuryRecovery: decision.injuryRecovery });
  return { state: next, decision, error: null };
}

export function closeBetweenRacesPeriod(state) {
  const next = restoreLifeBetweenRacesState(state);
  const period = activePeriod(next);
  if (period) period.closed = true;
  next.active = null;
  return next;
}

export function serializeLifeBetweenRacesState(state) {
  return restoreLifeBetweenRacesState(state);
}
