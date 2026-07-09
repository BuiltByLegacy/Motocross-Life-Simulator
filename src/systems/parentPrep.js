// Parent-Managed Bike Prep for Young Riders (issue #222)
// --------------------------------------------------------------------------
// A young rider can't manage marketplace/dealer purchases or repairs — but the
// bike still has to be race-ready. When the rider is too young to handle money,
// the parent checks the bike before events, decides how to fix it (dealer, used
// marketplace, or shop repair) within budget/stress/trust, and either gets it
// done or leaves a readiness warning. Pure and deterministic.

export const REPAIR_CHANNELS = ['dealer', 'used', 'shop', 'skip'];

// Per-part repair/replacement cost (deterministic model values).
const PART_COST = { tires: 60, topEnd: 240, chain: 45, brakes: 55, condition: 120 };
// A part needs attention below this life; an important event raises the bar.
const BASE_THRESHOLD = 40;

// Which parts need attention before an event. `eventImportance` 0..1 raises the
// standard (a national gets fresher parts than a local).
export function assessReadiness(bike = {}, { eventImportance = 0.5 } = {}) {
  const parts = bike.parts ?? {};
  const threshold = Math.round(BASE_THRESHOLD + eventImportance * 25);
  const issues = [];
  for (const [part, life] of Object.entries(parts)) {
    if (life < threshold) issues.push({ part, life, severity: life < 20 ? 'critical' : 'worn' });
  }
  // Overall bike condition counts too.
  if ((bike.condition ?? 100) < threshold) {
    issues.push({ part: 'condition', life: bike.condition ?? 0, severity: (bike.condition ?? 0) < 20 ? 'critical' : 'worn' });
  }
  issues.sort((a, b) => a.life - b.life);
  return {
    ready: issues.length === 0,
    issues,
    worstLife: issues.length ? issues[0].life : 100,
    threshold,
  };
}

export function estimateRepairCost(issues = []) {
  return issues.reduce((sum, i) => sum + (PART_COST[i.part] ?? 50), 0);
}

// The parent's decision, given the household context.
//   budget, stress (0-100), trust (0-100), eventImportance (0-1),
//   readiness (from assessReadiness), mechanicSkill (0-100)
// Returns { approve, channel, reason, cost }.
export function parentRepairDecision({
  budget = 0, stress = 20, trust = 50, eventImportance = 0.5,
  readiness = { ready: true, issues: [] }, mechanicSkill = 0,
} = {}) {
  if (readiness.ready) return { approve: false, channel: 'skip', reason: 'Bike is race-ready.', cost: 0 };

  const cost = estimateRepairCost(readiness.issues);
  const hasCritical = readiness.issues.some((i) => i.severity === 'critical');

  // How much of the budget the parent is willing to commit scales with the
  // event's importance and inversely with household stress.
  const willingness = Math.min(1, 0.35 + eventImportance * 0.5 - (stress / 100) * 0.2 + (trust / 100) * 0.15);
  const affordableCap = Math.round(budget * willingness);

  // Can't afford it (and it's not a safety-critical must-fix) → skip with warning.
  if (cost > budget) {
    return { approve: false, channel: 'skip', reason: `Can’t afford the $${cost} in repairs right now.`, cost };
  }
  if (cost > affordableCap && !hasCritical && eventImportance < 0.6) {
    return { approve: false, channel: 'skip', reason: 'Not worth the money for this event — repair later.', cost };
  }

  // Choose a channel. A big/important event and healthy budget → new OEM (dealer,
  // reliable). Tight budget → cheaper used parts (riskier). No mechanic → pay a
  // shop to do the work.
  let channel;
  if (mechanicSkill < 35) channel = 'shop';
  else if (eventImportance >= 0.6 && cost <= affordableCap) channel = 'dealer';
  else channel = 'used';

  const chanReason = {
    dealer: 'Ordering new OEM parts — reliable for a big weekend.',
    used: 'Grabbing used parts to keep it affordable.',
    shop: 'Booking the shop to do the work (no home mechanic).',
  }[channel];
  return { approve: true, channel, reason: chanReason, cost: channel === 'shop' ? Math.round(cost * 1.3) : cost };
}

// Resolve a parent repair: which parts get refreshed and the money spent.
// The caller applies the effects to the live bike/economy.
export function applyRepair(readiness, decision) {
  if (!decision.approve) return { repaired: [], spent: 0, warning: readiness.ready ? null : 'Bike not fully race-ready.' };
  const repaired = readiness.issues.map((i) => i.part);
  return { repaired, spent: decision.cost, warning: null };
}
