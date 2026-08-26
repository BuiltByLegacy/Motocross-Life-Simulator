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

export function assessReadiness(bike = {}, { eventImportance = 0.5 } = {}) {
  const parts = bike.parts ?? {};
  const threshold = Math.round(BASE_THRESHOLD + eventImportance * 25);
  const issues = [];
  for (const [part, life] of Object.entries(parts)) {
    if (life < threshold) issues.push({ part, life, severity: life < 20 ? 'critical' : 'worn' });
  }
  if ((bike.condition ?? 100) < threshold) {
    issues.push({ part: 'condition', life: bike.condition ?? 0, severity: (bike.condition ?? 0) < 20 ? 'critical' : 'worn' });
  }
  issues.sort((a, b) => a.life - b.life);
  return { ready: issues.length === 0, issues, worstLife: issues.length ? issues[0].life : 100, threshold };
}

export function estimateRepairCost(issues = []) {
  return issues.reduce((sum, i) => sum + (PART_COST[i.part] ?? 50), 0);
}

export function parentRepairDecision({
  budget = 0, stress = 20, trust = 50, eventImportance = 0.5,
  readiness = { ready: true, issues: [] }, mechanicSkill = 0,
} = {}) {
  if (readiness.ready) return { approve: false, channel: 'skip', reason: 'Bike is race-ready.', cost: 0 };

  const cost = estimateRepairCost(readiness.issues);
  const hasCritical = readiness.issues.some((i) => i.severity === 'critical');
  const willingness = Math.min(1, 0.35 + eventImportance * 0.5 - (stress / 100) * 0.2 + (trust / 100) * 0.15);
  const affordableCap = Math.round(budget * willingness);

  if (cost > budget) return { approve: false, channel: 'skip', reason: `Can’t afford the $${cost} in repairs right now.`, cost };
  if (cost > affordableCap && !hasCritical && eventImportance < 0.6) {
    return { approve: false, channel: 'skip', reason: 'Not worth the money for this event — repair later.', cost };
  }

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

// Converts the parent's repair decision into concrete procurement actions. This
// is the missing bridge between "Dad handles the marketplace" and an actual
// part arriving in the garage. Catalog rows may come from dealer or used-market
// search results and should expose category/part, price, condition and fitment.
export function parentProcurementPlan({
  readiness = { ready: true, issues: [] }, decision = { approve: false, channel: 'skip' },
  dealerListings = [], usedListings = [], bike = null,
} = {}) {
  if (!decision.approve || readiness.ready) return { orders: [], unresolved: readiness.issues ?? [], channel: decision.channel ?? 'skip' };
  if (decision.channel === 'shop') {
    return {
      orders: [{ type: 'service', channel: 'shop', issues: readiness.issues.map((i) => i.part), estimatedCost: decision.cost }],
      unresolved: [], channel: 'shop',
    };
  }

  const source = decision.channel === 'dealer' ? dealerListings : usedListings;
  const orders = [];
  const unresolved = [];
  for (const issue of readiness.issues) {
    if (issue.part === 'condition') {
      orders.push({ type: 'service', channel: decision.channel, part: 'condition', estimatedCost: PART_COST.condition });
      continue;
    }
    const compatible = source
      .filter((x) => (x.part ?? x.category) === issue.part)
      .filter((x) => !bike?.klass || !x.fitsClasses || x.fitsClasses.includes(bike.klass))
      .sort((a, b) => Number(a.price ?? Infinity) - Number(b.price ?? Infinity));
    const listing = compatible[0];
    if (!listing) { unresolved.push(issue); continue; }
    orders.push({
      type: 'part', channel: decision.channel, listingId: listing.id ?? listing.assetId,
      assetId: listing.assetId ?? null, part: issue.part, label: listing.label ?? listing.name ?? issue.part,
      price: Number(listing.price ?? 0), destination: 'garage',
    });
  }
  return { orders, unresolved, channel: decision.channel };
}

// Resolve delivered procurement into garage inventory/service intent. Parts are
// not silently installed; the caller/mechanic runs the normal bike-builder flow
// so compatibility, removed components and provenance remain consistent.
export function receiveParentProcurement(plan = {}) {
  const garageParts = [];
  const services = [];
  for (const order of plan.orders ?? []) {
    if (order.type === 'part') garageParts.push({
      assetId: order.assetId ?? order.listingId, name: order.label, category: order.part,
      location: 'shelf', installed: false, acquiredVia: order.channel,
    });
    else if (order.type === 'service') services.push(order);
  }
  return { garageParts, services, unresolved: plan.unresolved ?? [] };
}

export function applyRepair(readiness, decision) {
  if (!decision.approve) return { repaired: [], spent: 0, warning: readiness.ready ? null : 'Bike not fully race-ready.' };
  const repaired = readiness.issues.map((i) => i.part);
  return { repaired, spent: decision.cost, warning: null };
}
