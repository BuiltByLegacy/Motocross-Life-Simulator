// Life Between Races 2.0 — responsibility layer (#390-#392)
// Pure domain helpers layered over the canonical period in lifeBetweenRaces.js.

const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Number(v) || 0));

export const MAINTENANCE_ACTIONS = Object.freeze({
  inspect: { id: 'inspect', label: 'Inspect Bike', time: 1, cost: 0, condition: 0, reliability: 6 },
  clean: { id: 'clean', label: 'Clean & Prep', time: 1, cost: 10, condition: 2, reliability: 4 },
  service: { id: 'service', label: 'Routine Service', time: 2, cost: 65, condition: 10, reliability: 14 },
  repair: { id: 'repair', label: 'Repair Worn Parts', time: 2, cost: 150, condition: 22, reliability: 24 },
  replace: { id: 'replace', label: 'Replace Critical Parts', time: 2, cost: 280, condition: 34, reliability: 34 },
  defer: { id: 'defer', label: 'Defer Work', time: 0, cost: 0, condition: -3, reliability: -10 },
});

export const RESPONSIBILITY_ACTIONS = Object.freeze({
  school: { id: 'school', label: 'Protect School Time', time: 1, trust: 4, stress: -2 },
  catch_up: { id: 'catch_up', label: 'Catch Up on Responsibilities', time: 2, trust: 7, stress: -5 },
  work_shift: { id: 'work_shift', label: 'Work a Shift', time: 2, income: 120, trust: 2, stress: 3 },
  family_time: { id: 'family_time', label: 'Family Time', time: 1, trust: 6, stress: -5 },
  skip_obligations: { id: 'skip_obligations', label: 'Prioritize Motocross', time: 0, trust: -7, stress: 7 },
});

export const PREP_ACTIONS = Object.freeze({
  book_travel: { id: 'book_travel', label: 'Book Travel', time: 1, cost: 80, readiness: 18, stress: -3 },
  pack_load: { id: 'pack_load', label: 'Pack & Load', time: 1, cost: 0, readiness: 20, stress: -2 },
  sponsor_duty: { id: 'sponsor_duty', label: 'Sponsor Commitment', time: 1, cost: 0, readiness: 0, sponsor: 8, stress: 2 },
  budget_check: { id: 'budget_check', label: 'Review Race Budget', time: 1, cost: 0, readiness: 8, stress: -4 },
  rush_later: { id: 'rush_later', label: 'Leave Prep for Later', time: 0, cost: 0, readiness: -12, stress: 8 },
});

export function maintenanceNeed({ bike = {}, weeksToRace = null, weather = 'normal', travel = false, raceImportance = 50 } = {}) {
  const condition = clamp(bike.condition ?? 100);
  const wear = clamp(bike.wear ?? (100 - condition));
  let score = (100 - condition) * 0.55 + wear * 0.3;
  if (weeksToRace === 1) score += 12;
  if (travel) score += 8;
  if (['mud', 'rain', 'sand'].includes(String(weather).toLowerCase())) score += 8;
  score += Math.max(0, Number(raceImportance) - 60) * 0.15;
  score = clamp(Math.round(score));
  return { score, band: score >= 70 ? 'critical' : score >= 45 ? 'due' : score >= 22 ? 'watch' : 'ready' };
}

export function evaluateMaintenanceAction(actionId, { bike = {}, money = 0, timeLeft = 0, ...context } = {}) {
  const action = MAINTENANCE_ACTIONS[actionId];
  if (!action) return { allowed: false, reason: 'unknown-maintenance' };
  if (action.time > timeLeft) return { allowed: false, reason: 'not-enough-time', action };
  if (action.cost > money) return { allowed: false, reason: 'not-enough-money', action };
  const need = maintenanceNeed({ bike, ...context });
  return { allowed: true, action, need };
}

export function resolveMaintenanceAction(actionId, context = {}) {
  const check = evaluateMaintenanceAction(actionId, context);
  if (!check.allowed) return { error: check.reason, decision: null };
  const conditionBefore = clamp(context.bike?.condition ?? 100);
  const reliabilityBefore = clamp(context.bike?.reliability ?? conditionBefore);
  return { error: null, decision: {
    family: 'maintenance', actionId, time: check.action.time, cost: check.action.cost,
    conditionDelta: check.action.condition, reliabilityDelta: check.action.reliability,
    conditionAfter: clamp(conditionBefore + check.action.condition),
    reliabilityAfter: clamp(reliabilityBefore + check.action.reliability),
    deferredRisk: actionId === 'defer' ? Math.max(5, Math.round(check.need.score * 0.35)) : 0,
    need: check.need,
  }};
}

export function responsibilityPressure({ age = 18, schoolMode = 'school', schoolStanding = 75, workHours = 0, familyTrust = 70, familyStress = 25, missed = 0 } = {}) {
  const youth = Number(age) < 18;
  let score = Number(missed) * 10 + Math.max(0, 55 - Number(familyTrust)) * 0.45 + Number(familyStress) * 0.2;
  if (youth) score += Math.max(0, 75 - Number(schoolStanding)) * (schoolMode === 'homeschool' ? 0.35 : 0.6);
  else score += Math.max(0, Number(workHours) - 20) * 0.7;
  score = clamp(Math.round(score));
  return { score, band: score >= 70 ? 'strained' : score >= 42 ? 'pressured' : score >= 20 ? 'managed' : 'supported', youth };
}

export function evaluateResponsibilityAction(actionId, { age = 18, schoolMode = 'school', timeLeft = 0, ...context } = {}) {
  const action = RESPONSIBILITY_ACTIONS[actionId];
  if (!action) return { allowed: false, reason: 'unknown-responsibility' };
  if (action.time > timeLeft) return { allowed: false, reason: 'not-enough-time', action };
  if (actionId === 'work_shift' && Number(age) < 16) return { allowed: false, reason: 'age-restriction', action };
  if (actionId === 'school' && Number(age) >= 18 && schoolMode === 'none') return { allowed: false, reason: 'not-applicable', action };
  return { allowed: true, action, pressure: responsibilityPressure({ age, schoolMode, ...context }) };
}

export function resolveResponsibilityAction(actionId, context = {}) {
  const check = evaluateResponsibilityAction(actionId, context);
  if (!check.allowed) return { error: check.reason, decision: null };
  return { error: null, decision: {
    family: 'responsibility', actionId, time: check.action.time,
    moneyDelta: Number(check.action.income ?? 0), trustDelta: Number(check.action.trust ?? 0),
    stressDelta: Number(check.action.stress ?? 0), pressure: check.pressure,
    opportunityApprovalDelta: Math.round(Number(check.action.trust ?? 0) * 0.7 - Math.max(0, Number(check.action.stress ?? 0)) * 0.3),
  }};
}

export function estimateUpcomingRaceCost({ distanceMiles = 0, nights = 0, entryFee = 60, travelSupport = 0, lodgingSupport = 0, entrySupport = 0 } = {}) {
  const transport = Math.round(Math.max(0, Number(distanceMiles)) * 0.32);
  const lodging = Math.round(Math.max(0, Number(nights)) * 115);
  const entry = Math.max(0, Number(entryFee));
  const gross = transport + lodging + entry;
  const support = Math.min(gross, Math.max(0, Number(travelSupport)) + Math.max(0, Number(lodgingSupport)) + Math.max(0, Number(entrySupport)));
  return { transport, lodging, entry, gross, support, outOfPocket: Math.max(0, gross - support) };
}

export function travelPrepStatus({ booked = false, packed = false, bikeReady = false, sponsorDutiesDue = 0, sponsorDutiesDone = 0 } = {}) {
  let readiness = (booked ? 25 : 0) + (packed ? 25 : 0) + (bikeReady ? 35 : 0);
  const duties = Math.max(0, Number(sponsorDutiesDue));
  const done = Math.min(duties, Math.max(0, Number(sponsorDutiesDone)));
  readiness += duties === 0 ? 15 : Math.round(15 * (done / duties));
  readiness = clamp(readiness);
  return { readiness, band: readiness >= 85 ? 'ready' : readiness >= 60 ? 'mostly-ready' : readiness >= 35 ? 'exposed' : 'unprepared' };
}

export function evaluatePrepAction(actionId, { money = 0, timeLeft = 0, ...context } = {}) {
  const action = PREP_ACTIONS[actionId];
  if (!action) return { allowed: false, reason: 'unknown-prep' };
  if (action.time > timeLeft) return { allowed: false, reason: 'not-enough-time', action };
  if (action.cost > money) return { allowed: false, reason: 'not-enough-money', action };
  return { allowed: true, action, status: travelPrepStatus(context) };
}

export function resolvePrepAction(actionId, context = {}) {
  const check = evaluatePrepAction(actionId, context);
  if (!check.allowed) return { error: check.reason, decision: null };
  return { error: null, decision: {
    family: 'prep', actionId, time: check.action.time, cost: check.action.cost,
    readinessDelta: Number(check.action.readiness ?? 0), stressDelta: Number(check.action.stress ?? 0),
    sponsorSatisfactionDelta: Number(check.action.sponsor ?? 0),
    rushCostRisk: actionId === 'rush_later' ? 45 : 0,
    openingStatus: check.status,
  }};
}

export function missedPrepConsequences({ readiness = 100, estimatedCost = 0 } = {}) {
  const gap = Math.max(0, 75 - clamp(readiness));
  return {
    extraCost: Math.round(Number(estimatedCost) * Math.min(0.35, gap / 180)),
    stress: Math.round(gap * 0.28),
    readinessPenalty: Math.round(gap * 0.35),
  };
}
