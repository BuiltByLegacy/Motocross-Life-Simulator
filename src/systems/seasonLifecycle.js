// Season Lifecycle 2.0 — opening brief, family plan, and in-season sponsor market
// Issues #367, #368, #369. Pure deterministic domain logic: presentation reads
// these view models; it does not own lifecycle decisions or simulation math.

import { SPONSOR_CATALOG } from './sponsorshipPreseason.js';

const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, Number(n) || 0));
const money = (n) => Math.max(0, Math.round(Number(n) || 0));
const clone = (value) => JSON.parse(JSON.stringify(value));

function hash(input) {
  let h = 2166136261;
  for (const ch of String(input)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function unit(input) { return hash(input) / 0xffffffff; }

export const SEASON_POSTURES = Object.freeze({
  build: { id: 'build', label: 'Build Year', risk: 'low', description: 'Develop the rider, protect the family budget, and stack experience.' },
  push: { id: 'push', label: 'Push Year', risk: 'medium', description: 'Race a stronger program and accept measured financial and travel pressure.' },
  breakout: { id: 'breakout', label: 'Breakout Year', risk: 'high', description: 'Chase major results and visibility while the opportunity window is open.' },
  recovery: { id: 'recovery', label: 'Recovery Year', risk: 'low', description: 'Protect health, confidence, family stability, and long-term progression.' },
  privateer: { id: 'privateer', label: 'Privateer Grind', risk: 'high', description: 'Keep racing despite thin support; every dollar and relationship matters.' },
});

export function createFamilyPlan(overrides = {}) {
  return {
    maxRaceTravelBudget: money(overrides.maxRaceTravelBudget ?? 6000),
    longDistanceWeekends: clamp(overrides.longDistanceWeekends ?? 4, 0, 30),
    schoolFamilyPriority: clamp(overrides.schoolFamilyPriority ?? 70),
    debtWillingness: clamp(overrides.debtWillingness ?? 10),
    equipmentUpgradeStance: overrides.equipmentUpgradeStance ?? 'only-if-needed',
    parentSacrificeStance: overrides.parentSacrificeStance ?? 'balanced',
    lorettaIntent: overrides.lorettaIntent ?? 'try-if-ready',
    notes: overrides.notes ?? null,
  };
}

export function createSeasonLifecycleState({ seasonNumber = 1, seasonYear, familyPlan, carryover = null } = {}) {
  return {
    version: 1,
    seasonNumber,
    seasonYear: seasonYear ?? new Date().getUTCFullYear(),
    brief: null,
    recommendedPosture: null,
    chosenPosture: null,
    goals: [],
    familyPlan: createFamilyPlan(familyPlan),
    openingSnapshot: null,
    sponsorMarket: {
      evaluations: 0,
      milestoneKeys: [],
      leads: [],
      offers: [],
      declined: [],
    },
    carryover: carryover ? clone(carryover) : null,
  };
}

export function restoreSeasonLifecycleState(raw = {}) {
  const base = createSeasonLifecycleState(raw);
  return {
    ...base,
    ...clone(raw),
    familyPlan: createFamilyPlan(raw.familyPlan ?? {}),
    sponsorMarket: {
      ...base.sponsorMarket,
      ...(clone(raw.sponsorMarket ?? {})),
      milestoneKeys: [...(raw.sponsorMarket?.milestoneKeys ?? [])],
      leads: clone(raw.sponsorMarket?.leads ?? []),
      offers: clone(raw.sponsorMarket?.offers ?? []),
      declined: clone(raw.sponsorMarket?.declined ?? []),
    },
  };
}

export function estimateSeasonCost({ events = [], defaultRaceCost = 225, defaultTravelCost = 110 } = {}) {
  return money(events.reduce((sum, e) => {
    const entry = Number(e.entryFee ?? e.cost ?? defaultRaceCost);
    const travel = Number(e.travelCost ?? (e.travelBand === 'local' ? 35 : e.travelBand === 'long-haul' ? 650 : defaultTravelCost));
    const lodging = Number(e.lodgingCost ?? 0);
    return sum + entry + travel + lodging;
  }, 0));
}

export function buildSeasonBrief(input = {}) {
  const results = input.priorSeason ?? {};
  const moneyAvailable = money(input.familyMoney);
  const projectedSeasonCost = money(input.projectedSeasonCost ?? estimateSeasonCost({ events: input.events ?? [] }));
  const supportValue = money(input.supportValue);
  const fundingGap = Math.max(0, projectedSeasonCost - moneyAvailable - supportValue);
  const risks = [];
  if (fundingGap > 0) risks.push({ type: 'money', severity: fundingGap > projectedSeasonCost * 0.35 ? 'high' : 'medium', value: fundingGap });
  if (Number(input.bikeCondition ?? 100) < 55) risks.push({ type: 'bike', severity: Number(input.bikeCondition) < 35 ? 'high' : 'medium' });
  if (input.injury || Number(input.fatigue ?? 0) > 55) risks.push({ type: 'body', severity: input.injury ? 'high' : 'medium' });
  if (Number(input.familyStress ?? 0) > 55) risks.push({ type: 'family', severity: Number(input.familyStress) > 75 ? 'high' : 'medium' });
  if (supportValue === 0 && projectedSeasonCost > moneyAvailable) risks.push({ type: 'support', severity: 'medium' });

  return {
    seasonNumber: Number(input.seasonNumber ?? 1),
    seasonYear: Number(input.seasonYear ?? new Date().getUTCFullYear()),
    rider: {
      age: Number(input.age ?? 0),
      className: input.className ?? input.klass ?? 'unknown',
      priorWins: Number(results.wins ?? 0),
      priorPodiums: Number(results.podiums ?? 0),
      priorRaces: Number(results.races ?? 0),
    },
    reputation: clamp(input.reputation ?? input.localReputation ?? 0),
    bikes: clone(input.bikes ?? []),
    familyMoney: moneyAvailable,
    currentSupportValue: supportValue,
    region: input.region ?? 'northeast',
    projectedSeasonCost,
    fundingGap,
    risks,
  };
}

export function recommendSeasonPosture(brief, context = {}) {
  const highRisks = (brief?.risks ?? []).filter((r) => r.severity === 'high').length;
  const priorWins = Number(brief?.rider?.priorWins ?? 0);
  const priorPodiums = Number(brief?.rider?.priorPodiums ?? 0);
  const reputation = Number(brief?.reputation ?? 0);
  const fundedRatio = brief?.projectedSeasonCost > 0
    ? (brief.familyMoney + brief.currentSupportValue) / brief.projectedSeasonCost
    : 1;

  if (context.injury || (brief?.risks ?? []).some((r) => r.type === 'body' && r.severity === 'high')) return 'recovery';
  if (fundedRatio < 0.62 && (priorWins > 0 || priorPodiums >= 3)) return 'privateer';
  if (highRisks >= 2) return 'build';
  if (priorWins >= 3 && reputation >= 55 && fundedRatio >= 0.9) return 'breakout';
  if ((priorWins >= 1 || priorPodiums >= 3) && fundedRatio >= 0.75) return 'push';
  return 'build';
}

export function openSeasonLifecycle(state, input = {}) {
  const next = restoreSeasonLifecycleState(state);
  const brief = buildSeasonBrief(input);
  const recommendedPosture = recommendSeasonPosture(brief, input);
  next.seasonNumber = brief.seasonNumber;
  next.seasonYear = brief.seasonYear;
  next.brief = brief;
  next.recommendedPosture = recommendedPosture;
  next.openingSnapshot = {
    posture: next.chosenPosture,
    familyPlan: clone(next.familyPlan),
    brief: clone(brief),
  };
  return next;
}

export function chooseSeasonPosture(state, postureId, goals = []) {
  if (!SEASON_POSTURES[postureId]) throw new Error(`Unknown season posture: ${postureId}`);
  const next = restoreSeasonLifecycleState(state);
  next.chosenPosture = postureId;
  next.goals = [...new Set(goals.map(String))];
  next.openingSnapshot = {
    ...(next.openingSnapshot ?? {}),
    posture: postureId,
    familyPlan: clone(next.familyPlan),
    brief: clone(next.brief),
  };
  return next;
}

export function updateFamilyPlan(state, patch = {}) {
  const next = restoreSeasonLifecycleState(state);
  next.familyPlan = createFamilyPlan({ ...next.familyPlan, ...patch });
  return next;
}

export function evaluateFamilyGuardrails(state, { events = [], projectedSeasonCost, projectedDebt = 0 } = {}) {
  const plan = state?.familyPlan ?? createFamilyPlan();
  const seasonCost = money(projectedSeasonCost ?? estimateSeasonCost({ events }));
  const longDistance = events.filter((e) => ['long-haul', 'national', 'cross-region'].includes(e.travelBand) || Number(e.travelMiles ?? 0) >= 350).length;
  const schoolConflicts = events.filter((e) => e.schoolConflict || e.familyConflict).length;
  const warnings = [];
  if (seasonCost > plan.maxRaceTravelBudget) warnings.push({ type: 'budget', overBy: seasonCost - plan.maxRaceTravelBudget });
  if (longDistance > plan.longDistanceWeekends) warnings.push({ type: 'travel', overBy: longDistance - plan.longDistanceWeekends });
  if (schoolConflicts > 0 && plan.schoolFamilyPriority >= 60) warnings.push({ type: 'school-family', count: schoolConflicts });
  if (Number(projectedDebt) > 0 && plan.debtWillingness < 50) warnings.push({ type: 'debt', amount: money(projectedDebt) });
  return { seasonCost, longDistanceWeekends: longDistance, schoolFamilyConflicts: schoolConflicts, withinGuardrails: warnings.length === 0, warnings };
}

function sponsorMarketValue(context = {}) {
  const performance = clamp(context.performance ?? 0);
  const reputation = clamp(context.reputation ?? context.localReputation ?? 0);
  const visibility = clamp(context.visibility ?? 0);
  const professionalism = clamp(context.professionalism ?? 50);
  const compliance = clamp(context.compliance ?? 70);
  const qualification = context.majorQualification ? 12 : 0;
  const rivalry = clamp(context.rivalryMomentum ?? 0) * 0.06;
  const conductPenalty = clamp(context.conductConcern ?? 0) * 0.18;
  return Math.round(clamp(performance * 0.34 + reputation * 0.22 + visibility * 0.16 + professionalism * 0.12 + compliance * 0.10 + qualification + rivalry - conductPenalty));
}

export function evaluateInSeasonSponsorMarket(state, context = {}) {
  const next = restoreSeasonLifecycleState(state);
  const market = next.sponsorMarket;
  const value = sponsorMarketValue(context);
  const milestoneKey = context.milestoneKey ?? `${context.seasonYear ?? next.seasonYear}:${context.eventId ?? 'period'}:${value}:${!!context.majorQualification}`;
  if (market.milestoneKeys.includes(milestoneKey)) return { state: next, value, generated: [], duplicate: true };
  market.milestoneKeys.push(milestoneKey);
  market.evaluations += 1;

  const activeSponsorIds = new Set(context.activeSponsorIds ?? []);
  const activeCategories = new Set(context.activeCategories ?? []);
  const generated = [];
  for (const sponsor of SPONSOR_CATALOG) {
    if (activeSponsorIds.has(sponsor.id)) continue;
    if (activeCategories.has(sponsor.category)) continue;
    const threshold = sponsor.minProfile + Math.max(0, sponsor.tier - 1) * 4;
    if (value < threshold) continue;
    const roll = unit(`${context.careerSeed ?? 'career'}:${next.seasonYear}:${milestoneKey}:${sponsor.id}`);
    const strength = value - threshold + (roll - 0.5) * 22;
    if (strength < -4) continue;
    const type = strength >= 24 ? 'strong-interest' : strength >= 10 ? 'offer' : 'lead';
    const offer = {
      id: `inseason-${next.seasonYear}-${sponsor.id}-${hash(milestoneKey)}`,
      sponsorId: sponsor.id,
      sponsorName: sponsor.name,
      category: sponsor.category,
      tier: sponsor.tier,
      source: 'in-season',
      status: 'pending',
      type,
      marketValue: value,
      trigger: context.trigger ?? (context.majorQualification ? 'major-qualification' : 'performance'),
      supportPreview: {
        cash: money(sponsor.cashBase * (0.45 + value / 180)),
        productValue: money(sponsor.productBase * (0.5 + value / 200)),
      },
    };
    market.leads.push(offer);
    generated.push(offer);
  }

  return { state: next, value, generated, duplicate: false };
}

export function recordInSeasonSponsorDecision(state, leadId, decision, { counter = null } = {}) {
  const next = restoreSeasonLifecycleState(state);
  const lead = next.sponsorMarket.leads.find((l) => l.id === leadId);
  if (!lead) return { state: next, error: 'lead-not-found' };
  if (!['accept', 'reject', 'counter'].includes(decision)) return { state: next, error: 'invalid-decision' };
  lead.status = decision === 'accept' ? 'accepted' : decision === 'reject' ? 'rejected' : 'countered';
  lead.counter = decision === 'counter' ? clone(counter ?? {}) : null;
  if (decision === 'reject') next.sponsorMarket.declined.push(clone(lead));
  else next.sponsorMarket.offers.push(clone(lead));
  return { state: next, lead: clone(lead), error: null };
}

export function serializeSeasonLifecycleState(state) { return clone(restoreSeasonLifecycleState(state)); }
