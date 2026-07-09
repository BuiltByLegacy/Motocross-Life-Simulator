// Age & Responsibility System
// ---------------------------
// Pure permission and approval logic for young-rider agency. Age is the
// baseline; trust, grades, injury, budget, family stress, and stakes adjust the
// outcome. The UI can use the same result shape for rider and parent campaigns.

export const AGE_BANDS = [
  { key: 'tiny_wheels', label: 'Tiny Wheels', min: 4, max: 6 },
  { key: 'first_racer', label: 'First Racer', min: 7, max: 9 },
  { key: 'developing_amateur', label: 'Developing Amateur', min: 10, max: 12 },
  { key: 'serious_amateur', label: 'Serious Amateur', min: 13, max: 15 },
  { key: 'high_level_amateur', label: 'High-Level Amateur', min: 16, max: 17 },
  { key: 'adult_racer', label: 'Adult Racer', min: 18, max: 99 },
];

export const PERMISSION = {
  hidden: 'hidden',
  parentOnly: 'parent_only',
  request: 'request',
  suggest: 'suggest',
  supervised: 'supervised',
  independent: 'independent',
  locked: 'locked',
};

const ACTIONS = {
  ask_ride: ['request', 'request', 'supervised', 'independent', 'independent', 'independent'],
  ask_race: ['request', 'request', 'suggest', 'suggest', 'supervised', 'independent'],
  buy_bike: ['parentOnly', 'parentOnly', 'request', 'suggest', 'supervised', 'independent'],
  buy_parts: ['hidden', 'parentOnly', 'request', 'suggest', 'supervised', 'independent'],
  browse_marketplace: ['hidden', 'parentOnly', 'supervised', 'supervised', 'supervised', 'independent'],
  sell_item: ['locked', 'locked', 'request', 'suggest', 'supervised', 'independent'],
  work_job: ['locked', 'locked', 'request', 'supervised', 'independent', 'independent'],
  plan_season: ['parentOnly', 'parentOnly', 'suggest', 'suggest', 'supervised', 'independent'],
  register_race: ['parentOnly', 'parentOnly', 'parentOnly', 'request', 'supervised', 'independent'],
  loretta_attempt: ['parentOnly', 'parentOnly', 'request', 'suggest', 'supervised', 'independent'],
  sponsor_contact: ['hidden', 'parentOnly', 'parentOnly', 'supervised', 'supervised', 'independent'],
  travel_far: ['parentOnly', 'parentOnly', 'parentOnly', 'request', 'supervised', 'independent'],
  sign_contract: ['locked', 'locked', 'locked', 'parentOnly', 'parentOnly', 'independent'],
  race_after_injury: ['parentOnly', 'parentOnly', 'parentOnly', 'request', 'supervised', 'independent'],
};

const BAND_INDEX = {
  tiny_wheels: 0,
  first_racer: 1,
  developing_amateur: 2,
  serious_amateur: 3,
  high_level_amateur: 4,
  adult_racer: 5,
};

export function ageBand(age) {
  return AGE_BANDS.find((b) => age >= b.min && age <= b.max) ?? AGE_BANDS[0];
}

export function trustScore({
  base = 50,
  gradesGood = true,
  helpedBike = false,
  earnedOwnMoney = false,
  irresponsibleSpending = false,
  injury = null,
  familyStress = 20,
  money = 0,
} = {}) {
  let score = base;
  if (gradesGood) score += 8;
  else score -= 12;
  if (helpedBike) score += 6;
  if (earnedOwnMoney) score += 8;
  if (irresponsibleSpending) score -= 15;
  if (injury && injury.weeksOut > 0) score -= injury.severity === 'severe' ? 18 : 10;
  if (familyStress >= 70) score -= 12;
  else if (familyStress <= 25) score += 4;
  if (money < 250) score -= 8;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function permissionFor(action, { age, trust = 50 } = {}) {
  const ladder = ACTIONS[action];
  if (!ladder) return { action, allowed: false, permission: PERMISSION.locked, reason: 'Unknown action.' };
  const band = ageBand(age);
  const baseIdx = BAND_INDEX[band.key];
  let idx = baseIdx;
  const base = ladder[baseIdx];
  if (!['hidden', 'locked'].includes(base) && trust >= 75) idx = Math.min(5, idx + 1);
  if (trust < 35) idx = Math.max(0, idx - 1);
  const permission = ladder[idx];
  return {
    action,
    age,
    ageBand: band.key,
    permission,
    allowed: permission === PERMISSION.independent || permission === PERMISSION.supervised,
    requiresParent: ['parent_only', 'request', 'suggest', 'supervised'].includes(permission),
    visible: permission !== PERMISSION.hidden,
  };
}

export function evaluateApproval(action, ctx = {}) {
  const trust = ctx.trust ?? trustScore(ctx);
  const p = permissionFor(action, { age: ctx.age, trust });
  const reasons = [];
  const conditions = [];

  if (p.permission === PERMISSION.hidden || p.permission === PERMISSION.locked) {
    reasons.push('Not age-appropriate yet.');
  }
  if (ctx.cost != null && ctx.money != null && ctx.cost > ctx.money) reasons.push('Not enough family money.');
  if (ctx.injury && ctx.injury.weeksOut > 0 && ['ask_race', 'travel_far', 'race_after_injury', 'loretta_attempt'].includes(action)) {
    reasons.push('Medical or recovery concern.');
  }
  if (ctx.gradesGood === false && ['ask_race', 'travel_far', 'loretta_attempt', 'work_job'].includes(action)) {
    conditions.push('Grades must recover first.');
  }
  if ((ctx.familyStress ?? 0) >= 75 && ['travel_far', 'buy_bike', 'loretta_attempt'].includes(action)) {
    conditions.push('Family stress is high; approval needs a calmer plan.');
  }

  if (reasons.length) return { ...p, trust, result: 'denied', reasons, conditions };
  if (p.permission === PERMISSION.independent) return { ...p, trust, result: 'approved', reasons, conditions };
  if (conditions.length) return { ...p, trust, result: 'approved_with_conditions', reasons, conditions };
  if (p.permission === PERMISSION.parentOnly) return { ...p, trust, result: 'parent_decides', reasons, conditions };
  return { ...p, trust, result: 'approved_with_parent', reasons, conditions };
}

export function visibilityFor(info, { age, campaign = 'rider' } = {}) {
  if (campaign === 'parent') return 'full';
  const band = ageBand(age).key;
  const adult = band === 'adult_racer';
  if (adult) return 'full';
  if (['contract_terms', 'family_debt'].includes(info)) return band === 'high_level_amateur' ? 'summary' : 'hidden';
  if (['entry_fee', 'travel_cost', 'parts_cost', 'job_income'].includes(info)) {
    if (band === 'tiny_wheels' || band === 'first_racer') return 'parent_framed';
    if (band === 'developing_amateur') return 'simple';
    return 'detailed';
  }
  return 'visible';
}
