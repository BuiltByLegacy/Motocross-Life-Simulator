// Season Lifecycle 2.0 — midseason opportunity review and end-of-season review
// Issues #370 and #371. Keeps completed history immutable while allowing future
// commitments to be revised after material life/career changes.

import { restoreSeasonLifecycleState, evaluateFamilyGuardrails } from './seasonLifecycle.js';

const clone = (value) => JSON.parse(JSON.stringify(value));
const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, Number(n) || 0));

export const MATERIAL_CHANGE_TYPES = Object.freeze([
  'breakout-result', 'major-qualification', 'injury', 'major-sponsor-offer',
  'financial-stress', 'bike-failure', 'family-strain', 'support-escalation',
]);

export function materialChangeKey(change = {}) {
  return `${change.seasonYear ?? 'season'}:${change.type ?? 'change'}:${change.eventId ?? change.date ?? 'period'}`;
}

export function shouldTriggerMidseasonReview(lifecycleState, change = {}) {
  if (!MATERIAL_CHANGE_TYPES.includes(change.type)) return { trigger: false, reason: 'not-material' };
  const key = materialChangeKey(change);
  const seen = lifecycleState?.midseason?.handledKeys ?? [];
  if (seen.includes(key)) return { trigger: false, reason: 'duplicate', key };
  return { trigger: true, reason: change.type, key };
}

export function buildMidseasonReview(lifecycleState, change = {}, current = {}) {
  const gate = shouldTriggerMidseasonReview(lifecycleState, change);
  if (!gate.trigger) return { review: null, gate };
  const opening = lifecycleState?.openingSnapshot ?? {};
  const brief = opening.brief ?? lifecycleState?.brief ?? {};
  const review = {
    id: `midseason-${gate.key}`,
    key: gate.key,
    change: clone(change),
    opening: {
      posture: opening.posture ?? lifecycleState?.chosenPosture ?? null,
      projectedSeasonCost: brief.projectedSeasonCost ?? 0,
      openingFundingGap: brief.fundingGap ?? 0,
      familyPlan: clone(opening.familyPlan ?? lifecycleState?.familyPlan ?? {}),
    },
    current: {
      wins: Number(current.wins ?? 0),
      podiums: Number(current.podiums ?? 0),
      races: Number(current.races ?? 0),
      familyMoney: Number(current.familyMoney ?? 0),
      familyStress: Number(current.familyStress ?? 0),
      bikeCondition: Number(current.bikeCondition ?? 100),
      supportValue: Number(current.supportValue ?? 0),
      injury: current.injury ? clone(current.injury) : null,
    },
    recommendations: [],
  };

  if (['breakout-result', 'major-qualification', 'major-sponsor-offer', 'support-escalation'].includes(change.type)) {
    review.recommendations.push('consider-expanding-future-calendar');
  }
  if (['injury', 'financial-stress', 'bike-failure', 'family-strain'].includes(change.type)) {
    review.recommendations.push('protect-future-calendar');
  }
  if (change.type === 'major-sponsor-offer') review.recommendations.push('re-evaluate-sponsor-obligations');
  if (change.type === 'injury') review.recommendations.push('prioritize-recovery');
  return { review, gate };
}

export function applyMidseasonPivot(lifecycleState, review, { calendar = [], addEventIds = [], dropEventIds = [], reprioritize = [], projectedSeasonCost, projectedDebt = 0 } = {}) {
  if (!review) return { state: restoreSeasonLifecycleState(lifecycleState), calendar: clone(calendar), error: 'review-required' };
  const next = restoreSeasonLifecycleState(lifecycleState);
  next.midseason ??= { handledKeys: [], reviews: [] };
  if (!next.midseason.handledKeys.includes(review.key)) next.midseason.handledKeys.push(review.key);

  const today = review.change?.date ?? null;
  const past = calendar.filter((e) => e.completed || (today && (e.endDate ?? e.date ?? e.startDate) < today));
  const future = calendar.filter((e) => !past.includes(e));
  const drop = new Set(dropEventIds);
  const additions = new Set(addEventIds);
  const priorityMap = new Map(reprioritize.map((r) => [r.eventId, r.priority]));

  const revisedFuture = future
    .filter((e) => !drop.has(e.id))
    .map((e) => priorityMap.has(e.id) ? { ...clone(e), priority: priorityMap.get(e.id) } : clone(e));

  for (const id of additions) {
    if (!revisedFuture.some((e) => e.id === id)) revisedFuture.push({ id, tentative: true, source: 'midseason-pivot' });
  }

  const revisedCalendar = [...clone(past), ...revisedFuture];
  const guardrails = evaluateFamilyGuardrails(next, { events: revisedFuture, projectedSeasonCost, projectedDebt });
  const record = {
    id: review.id,
    key: review.key,
    change: clone(review.change),
    added: [...additions],
    dropped: [...drop],
    reprioritized: clone(reprioritize),
    guardrails: clone(guardrails),
  };
  next.midseason.reviews.push(record);
  return { state: next, calendar: revisedCalendar, guardrails, error: null };
}

export function buildSeasonReview(lifecycleState, actual = {}) {
  const state = restoreSeasonLifecycleState(lifecycleState);
  const opening = state.openingSnapshot ?? {};
  const brief = opening.brief ?? state.brief ?? {};
  const plan = opening.familyPlan ?? state.familyPlan ?? {};
  const races = Number(actual.races ?? 0);
  const wins = Number(actual.wins ?? 0);
  const podiums = Number(actual.podiums ?? 0);
  const spent = Number(actual.seasonSpend ?? actual.totalSpend ?? 0);
  const plannedCost = Number(brief.projectedSeasonCost ?? 0);
  const budget = Number(plan.maxRaceTravelBudget ?? plannedCost ?? 0);
  const sponsorDelta = Number(actual.endingSupportValue ?? 0) - Number(brief.currentSupportValue ?? 0);

  const highlights = [];
  if (wins > 0) highlights.push({ type: 'wins', value: wins });
  if (actual.majorQualification) highlights.push({ type: 'major-qualification', value: actual.majorQualification });
  if (actual.championship) highlights.push({ type: 'championship', value: actual.championship });
  if (actual.bestFinish != null) highlights.push({ type: 'best-finish', value: actual.bestFinish });
  if (actual.rivalOutcome) highlights.push({ type: 'rivalry', value: clone(actual.rivalOutcome) });

  const misses = [];
  if (state.goals?.length) {
    const completed = new Set(actual.completedGoals ?? []);
    for (const goal of state.goals) if (!completed.has(goal)) misses.push({ type: 'goal', value: goal });
  }
  if (spent > budget && budget > 0) misses.push({ type: 'budget-overrun', value: spent - budget });
  if (actual.injury) misses.push({ type: 'injury', value: clone(actual.injury) });

  const review = {
    seasonNumber: state.seasonNumber,
    seasonYear: state.seasonYear,
    plan: {
      posture: opening.posture ?? state.chosenPosture,
      goals: clone(state.goals ?? []),
      projectedSeasonCost: plannedCost,
      familyPlan: clone(plan),
    },
    reality: {
      races, wins, podiums,
      bestFinish: actual.bestFinish ?? null,
      seasonSpend: spent,
      endingMoney: Number(actual.endingMoney ?? 0),
      endingSupportValue: Number(actual.endingSupportValue ?? 0),
      familyStress: Number(actual.familyStress ?? 0),
      injury: actual.injury ? clone(actual.injury) : null,
      championship: actual.championship ?? null,
      majorQualification: actual.majorQualification ?? null,
    },
    comparison: {
      costVariance: spent - plannedCost,
      budgetVariance: spent - budget,
      sponsorSupportDelta: sponsorDelta,
      goalCompletionRate: state.goals?.length ? clamp(((actual.completedGoals ?? []).length / state.goals.length) * 100) : 100,
    },
    highlights,
    misses,
    memories: clone(actual.memories ?? []),
    relationshipChanges: clone(actual.relationshipChanges ?? []),
  };
  return review;
}

export function buildSeasonCarryover(review, actual = {}) {
  return {
    fromSeason: review.seasonNumber,
    fromYear: review.seasonYear,
    reputation: clone(actual.reputation ?? {}),
    sponsorRenewalInterest: clone(actual.sponsorRenewalInterest ?? []),
    unresolvedObligations: clone(actual.unresolvedObligations ?? []),
    bikes: clone(actual.bikes ?? []),
    family: {
      stress: Number(review.reality.familyStress ?? 0),
      support: Number(actual.familySupport ?? 0),
    },
    injuries: actual.injury ? [clone(actual.injury)] : clone(actual.injuries ?? []),
    goals: clone(actual.nextGoals ?? []),
    finances: {
      endingMoney: Number(review.reality.endingMoney ?? 0),
      debt: Number(actual.debt ?? 0),
      priorSeasonSpend: Number(review.reality.seasonSpend ?? 0),
    },
    careerOpportunities: clone(actual.careerOpportunities ?? []),
    historySummary: {
      posture: review.plan.posture,
      wins: review.reality.wins,
      podiums: review.reality.podiums,
      races: review.reality.races,
      championship: review.reality.championship,
      majorQualification: review.reality.majorQualification,
      highlights: clone(review.highlights),
    },
  };
}

export function finalizeSeasonLifecycle(lifecycleState, actual = {}) {
  const next = restoreSeasonLifecycleState(lifecycleState);
  const review = buildSeasonReview(next, actual);
  const carryover = buildSeasonCarryover(review, actual);
  next.review = clone(review);
  next.carryover = clone(carryover);
  return { state: next, review, carryover };
}
