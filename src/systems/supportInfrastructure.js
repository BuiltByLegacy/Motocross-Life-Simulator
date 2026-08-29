// Career support infrastructure ladder (#437)
// Infrastructure changes preparation capacity, not rider base speed.

const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Number(v) || 0));

export const SUPPORT_TIERS = Object.freeze({
  family: {
    id: 'family', label: 'Family / Self Supported', rank: 0,
    mechanic: 18, logistics: 10, testing: 5, trainingBase: 10, parts: 18,
    timeRelief: 0, prepConsistency: 0,
  },
  privateer: {
    id: 'privateer', label: 'Small Privateer Crew', rank: 1,
    mechanic: 38, logistics: 30, testing: 18, trainingBase: 25, parts: 35,
    timeRelief: 1, prepConsistency: 6,
  },
  satellite: {
    id: 'satellite', label: 'Shop / Satellite Program', rank: 2,
    mechanic: 62, logistics: 58, testing: 45, trainingBase: 48, parts: 62,
    timeRelief: 2, prepConsistency: 12,
  },
  development: {
    id: 'development', label: 'Structured Development Team', rank: 3,
    mechanic: 78, logistics: 74, testing: 70, trainingBase: 76, parts: 78,
    timeRelief: 3, prepConsistency: 18,
  },
  factory: {
    id: 'factory', label: 'Factory Infrastructure', rank: 4,
    mechanic: 96, logistics: 94, testing: 95, trainingBase: 90, parts: 96,
    timeRelief: 4, prepConsistency: 24,
  },
});

export function createSupportInfrastructure(tierId = 'family', overrides = {}) {
  const tier = SUPPORT_TIERS[tierId] ?? SUPPORT_TIERS.family;
  return {
    version: 1, tier: tier.id, source: overrides.source ?? (tier.id === 'family' ? 'family' : 'team'),
    mechanic: clamp(overrides.mechanic ?? tier.mechanic),
    logistics: clamp(overrides.logistics ?? tier.logistics),
    testing: clamp(overrides.testing ?? tier.testing),
    trainingBase: clamp(overrides.trainingBase ?? tier.trainingBase),
    parts: clamp(overrides.parts ?? tier.parts),
    timeRelief: Math.max(0, Number(overrides.timeRelief ?? tier.timeRelief)),
    prepConsistency: clamp(overrides.prepConsistency ?? tier.prepConsistency),
    active: overrides.active !== false,
  };
}

export function restoreSupportInfrastructure(raw) {
  if (!raw || typeof raw !== 'object') return createSupportInfrastructure();
  return createSupportInfrastructure(raw.tier, raw);
}

export function supportEffects(raw) {
  const s = restoreSupportInfrastructure(raw);
  if (!s.active) return { timeRelief: 0, maintenanceTimeRelief: 0, logisticsTimeRelief: 0, prepConsistency: 0, setupSupport: 0, trainingQuality: 0, speedBonus: 0 };
  return {
    timeRelief: s.timeRelief,
    maintenanceTimeRelief: Math.floor(s.mechanic / 35),
    logisticsTimeRelief: Math.floor(s.logistics / 40),
    prepConsistency: s.prepConsistency,
    setupSupport: Math.round((s.testing * 0.55 + s.mechanic * 0.45) / 5),
    trainingQuality: Math.round(s.trainingBase / 6),
    speedBonus: 0,
  };
}

export function supportAdjustedMaintenance(action, raw) {
  const effects = supportEffects(raw);
  return { ...action, time: Math.max(0, Number(action.time ?? 0) - effects.maintenanceTimeRelief), supportEffect: effects.maintenanceTimeRelief };
}

export function supportAdjustedTravelPrep(action, raw) {
  const effects = supportEffects(raw);
  return { ...action, time: Math.max(0, Number(action.time ?? 0) - effects.logisticsTimeRelief), supportEffect: effects.logisticsTimeRelief };
}

export function supportAdjustedTrainingQuality(baseQuality = 1, raw) {
  const s = restoreSupportInfrastructure(raw);
  return Number(baseQuality) * (1 + (s.active ? s.trainingBase : 0) / 500);
}

export function opportunitySupportValue(raw, { riderNeeds = {} } = {}) {
  const s = restoreSupportInfrastructure(raw);
  const weights = {
    mechanic: Number(riderNeeds.mechanic ?? 1), logistics: Number(riderNeeds.logistics ?? 1),
    testing: Number(riderNeeds.testing ?? 1), trainingBase: Number(riderNeeds.trainingBase ?? 1), parts: Number(riderNeeds.parts ?? 1),
  };
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  const score = (s.mechanic * weights.mechanic + s.logistics * weights.logistics + s.testing * weights.testing + s.trainingBase * weights.trainingBase + s.parts * weights.parts) / totalWeight;
  return { score: Math.round(score), tier: s.tier, label: SUPPORT_TIERS[s.tier]?.label ?? s.tier };
}

export function transitionSupport(currentRaw, nextTierId, { source = 'team', gapWeeks = 0 } = {}) {
  const previous = restoreSupportInfrastructure(currentRaw);
  const next = createSupportInfrastructure(nextTierId, { source });
  return {
    previous,
    next,
    transition: {
      from: previous.tier, to: next.tier, gapWeeks: Math.max(0, Number(gapWeeks)),
      temporaryLoss: Number(gapWeeks) > 0,
      gapState: Number(gapWeeks) > 0 ? { ...createSupportInfrastructure('family'), active: true, source: 'transition-gap' } : null,
    },
  };
}

export function familyLaborSupport({ guardianMechanical = 0, familyTravelCapacity = 0, homeTrackAccess = false } = {}) {
  return createSupportInfrastructure('family', {
    source: 'family',
    mechanic: 18 + clamp(guardianMechanical) * 0.45,
    logistics: 10 + clamp(familyTravelCapacity) * 0.45,
    trainingBase: homeTrackAccess ? 38 : 10,
    timeRelief: clamp(guardianMechanical) >= 65 ? 1 : 0,
  });
}
