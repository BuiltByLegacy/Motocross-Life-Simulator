// Season Lifecycle 2.0 presentation contract (#372)
// Converts lifecycle domain state into focused, mobile-first view models without
// re-implementing simulation rules. The live UI can render these as workbench/
// season-board/record-book scenes instead of dashboard card walls.

import { SEASON_POSTURES } from './seasonLifecycle.js';

const clone = (value) => JSON.parse(JSON.stringify(value));

export function seasonBriefView(lifecycleState = {}) {
  const brief = lifecycleState.brief ?? {};
  const posture = lifecycleState.chosenPosture ?? lifecycleState.recommendedPosture ?? null;
  return {
    scene: 'season-brief',
    title: `Season ${brief.seasonNumber ?? lifecycleState.seasonNumber ?? ''}`.trim(),
    subtitle: `${brief.rider?.className ?? 'Class TBD'} · ${brief.region ?? 'home region'}`,
    hero: {
      posture: posture ? clone(SEASON_POSTURES[posture]) : null,
      projectedSeasonCost: Number(brief.projectedSeasonCost ?? 0),
      fundingGap: Number(brief.fundingGap ?? 0),
    },
    risks: clone(brief.risks ?? []),
    goals: clone(lifecycleState.goals ?? []),
    primaryAction: lifecycleState.chosenPosture ? 'review-family-plan' : 'choose-season-posture',
  };
}

export function familyPlanView(lifecycleState = {}, guardrails = null) {
  const plan = lifecycleState.familyPlan ?? {};
  return {
    scene: 'family-plan',
    title: 'Family Race Plan',
    summary: {
      maxBudget: Number(plan.maxRaceTravelBudget ?? 0),
      longDistanceWeekends: Number(plan.longDistanceWeekends ?? 0),
      schoolFamilyPriority: Number(plan.schoolFamilyPriority ?? 0),
      debtWillingness: Number(plan.debtWillingness ?? 0),
      equipmentUpgradeStance: plan.equipmentUpgradeStance ?? 'only-if-needed',
      parentSacrificeStance: plan.parentSacrificeStance ?? 'balanced',
      lorettaIntent: plan.lorettaIntent ?? 'try-if-ready',
    },
    warnings: clone(guardrails?.warnings ?? []),
    withinGuardrails: guardrails ? !!guardrails.withinGuardrails : null,
    primaryAction: 'review-tentative-season',
  };
}

export function sponsorOpportunityView(lead = {}) {
  return {
    scene: 'sponsor-opportunity',
    title: lead.sponsorName ?? 'New support opportunity',
    trigger: lead.trigger ?? 'performance',
    supportPreview: clone(lead.supportPreview ?? {}),
    choices: ['accept', 'counter', 'reject'],
    primaryAction: 'review-offer',
  };
}

export function midseasonReviewView(review = {}) {
  return {
    scene: 'midseason-review',
    title: 'The Season Changed',
    trigger: review.change?.type ?? null,
    openingPosture: review.opening?.posture ?? null,
    current: clone(review.current ?? {}),
    recommendations: clone(review.recommendations ?? []),
    primaryAction: 'revise-future-calendar',
  };
}

export function seasonReviewView(review = {}) {
  return {
    scene: 'season-review',
    title: `${review.seasonYear ?? ''} Season Review`.trim(),
    openingPosture: review.plan?.posture ?? null,
    goals: clone(review.plan?.goals ?? []),
    reality: clone(review.reality ?? {}),
    comparison: clone(review.comparison ?? {}),
    highlights: clone(review.highlights ?? []),
    misses: clone(review.misses ?? []),
    memories: clone(review.memories ?? []),
    relationshipChanges: clone(review.relationshipChanges ?? []),
    primaryAction: 'carry-forward',
  };
}

export function lifecycleRoute(stage, payload = {}) {
  switch (stage) {
    case 'brief': return seasonBriefView(payload.lifecycle ?? payload);
    case 'family-plan': return familyPlanView(payload.lifecycle ?? {}, payload.guardrails ?? null);
    case 'sponsor-opportunity': return sponsorOpportunityView(payload.lead ?? payload);
    case 'midseason-review': return midseasonReviewView(payload.review ?? payload);
    case 'season-review': return seasonReviewView(payload.review ?? payload);
    default: return { scene: 'season-lifecycle', title: 'Season', primaryAction: null };
  }
}
