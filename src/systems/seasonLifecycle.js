// Season Lifecycle 2.0 (#366-#371)
// Pure deterministic helpers for season brief, family plan, dynamic sponsorship,
// midseason pivots, review and carryover. Presentation should consume these
// summaries rather than duplicating simulation math.

const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, Number(n) || 0));
const copy = (v) => JSON.parse(JSON.stringify(v ?? null));

export const SEASON_POSTURES = {
  build: { id: 'build', label: 'Build Year', risk: 25, intent: 'Develop skills and keep the family healthy financially.' },
  push: { id: 'push', label: 'Push Year', risk: 55, intent: 'Chase qualifiers, visibility and stronger competition.' },
  breakout: { id: 'breakout', label: 'Breakout Year', risk: 75, intent: 'Invest while momentum and support are strong.' },
  recovery: { id: 'recovery', label: 'Recovery Year', risk: 15, intent: 'Protect body, family and budget while rebuilding.' },
  privateer: { id: 'privateer', label: 'Privateer Grind', risk: 85, intent: 'Race an ambitious schedule despite limited support.' },
};

export function createFamilyPlan(input = {}) {
  return {
    maxSeasonSpend: Math.max(0, Number(input.maxSeasonSpend ?? 5000)),
    maxLongTravelWeekends: Math.max(0, Number(input.maxLongTravelWeekends ?? 4)),
    schoolPriority: input.schoolPriority ?? 'balanced',
    familyPriority: input.familyPriority ?? 'balanced',
    debtPolicy: input.debtPolicy ?? 'avoid',
    equipmentPolicy: input.equipmentPolicy ?? 'repair-first',
    parentSacrifice: input.parentSacrifice ?? 'normal-work',
    lorettaIntent: input.lorettaIntent ?? 'if-earned',
    guardianOwned: input.guardianOwned !== false,
  };
}

export function restoreLifecycleState(raw = {}) {
  return {
    version: 2,
    seasonYear: raw.seasonYear ?? null,
    openingBrief: copy(raw.openingBrief),
    posture: raw.posture ?? null,
    familyPlan: createFamilyPlan(raw.familyPlan ?? {}),
    openingSnapshot: copy(raw.openingSnapshot),
    sponsorMarket: copy(raw.sponsorMarket ?? { seen: [], offers: [], history: [] }),
    pivots: copy(raw.pivots ?? []),
    review: copy(raw.review),
    carryover: copy(raw.carryover),
    history: copy(raw.history ?? []),
  };
}

export function recommendPosture(ctx = {}) {
  const money = Number(ctx.money ?? 0);
  const projected = Math.max(1, Number(ctx.projectedSeasonCost ?? 1));
  const fundingRatio = money / projected;
  const results = clamp(ctx.results ?? 0);
  const reputation = clamp(ctx.reputation ?? 0);
  const support = clamp(ctx.support ?? 0);
  const bike = clamp(ctx.bikeCondition ?? 100);
  const fatigue = clamp(ctx.fatigue ?? 0);
  const injury = !!ctx.injury;

  if (injury || fatigue >= 70 || bike < 35) return 'recovery';
  if (results >= 75 && reputation >= 60 && support >= 55 && fundingRatio >= 0.65) return 'breakout';
  if (results >= 55 && fundingRatio >= 0.55) return 'push';
  if (fundingRatio < 0.35 && (results >= 55 || reputation >= 45)) return 'privateer';
  return 'build';
}

export function buildSeasonBrief(ctx = {}) {
  const projectedSeasonCost = Math.max(0, Number(ctx.projectedSeasonCost ?? 0));
  const money = Math.max(0, Number(ctx.money ?? 0));
  const supportValue = Math.max(0, Number(ctx.supportValue ?? 0));
  const fundingGap = Math.max(0, projectedSeasonCost - money - supportValue);
  const posture = recommendPosture({ ...ctx, projectedSeasonCost });
  const risks = [];
  if (fundingGap > 0) risks.push({ id: 'money', severity: fundingGap > projectedSeasonCost * .45 ? 'high' : 'medium', text: `Opening plan is short about $${Math.round(fundingGap).toLocaleString()}.` });
  if (Number(ctx.bikeCondition ?? 100) < 55) risks.push({ id: 'bike', severity: 'medium', text: 'Race bike needs attention before a heavy schedule.' });
  if (ctx.injury) risks.push({ id: 'injury', severity: 'high', text: 'The rider enters the season carrying an injury.' });
  if (Number(ctx.fatigue ?? 0) > 55) risks.push({ id: 'fatigue', severity: 'medium', text: 'The rider is not entering the year fully fresh.' });
  if (Number(ctx.longTravelWeekends ?? 0) > Number(ctx.familyPlan?.maxLongTravelWeekends ?? 99)) risks.push({ id: 'family-travel', severity: 'medium', text: 'Travel plan exceeds the family’s stated tolerance.' });
  if (Number(ctx.activeSponsors ?? 0) === 0 && projectedSeasonCost > money) risks.push({ id: 'support', severity: 'medium', text: 'The season depends heavily on family money until support is earned.' });

  return {
    seasonYear: ctx.seasonYear,
    rider: { name: ctx.riderName, age: ctx.age, klass: ctx.klass, number: ctx.number },
    priorSeason: copy(ctx.priorSeason ?? null),
    homeRegion: ctx.homeRegion ?? null,
    money,
    projectedSeasonCost,
    supportValue,
    fundingGap,
    activeSponsors: Number(ctx.activeSponsors ?? 0),
    bike: { name: ctx.bikeName ?? null, condition: clamp(ctx.bikeCondition ?? 100), reliability: clamp(ctx.bikeReliability ?? 100) },
    reputation: clamp(ctx.reputation ?? 0),
    results: clamp(ctx.results ?? 0),
    risks,
    recommendedPosture: posture,
    recommendation: SEASON_POSTURES[posture],
  };
}

export function evaluateFamilyPlan(planInput, season = {}) {
  const plan = createFamilyPlan(planInput);
  const spend = Math.max(0, Number(season.projectedSpend ?? 0));
  const longTrips = Math.max(0, Number(season.longTravelWeekends ?? 0));
  const warnings = [];
  if (spend > plan.maxSeasonSpend) warnings.push({ id: 'budget', amount: spend - plan.maxSeasonSpend, text: `Plan exceeds the family season cap by $${Math.round(spend - plan.maxSeasonSpend).toLocaleString()}.` });
  if (longTrips > plan.maxLongTravelWeekends) warnings.push({ id: 'travel', amount: longTrips - plan.maxLongTravelWeekends, text: `${longTrips - plan.maxLongTravelWeekends} long travel weekend(s) beyond the family limit.` });
  if (plan.debtPolicy === 'never' && Number(season.fundingGap ?? 0) > 0) warnings.push({ id: 'debt', text: 'The plan has a funding gap but this family will not borrow for racing.' });
  return { plan, warnings, withinGuardrails: warnings.length === 0 };
}

export function marketValue(ctx = {}) {
  const results = clamp(ctx.results ?? 0);
  const reputation = clamp(ctx.reputation ?? 0);
  const visibility = clamp(ctx.visibility ?? 0);
  const professionalism = clamp(ctx.professionalism ?? 50);
  const compliance = clamp(ctx.compliance ?? 60);
  const qualification = ctx.majorQualification ? 12 : 0;
  const winMomentum = Math.min(12, Math.max(0, Number(ctx.recentWins ?? 0)) * 4);
  const conductPenalty = Math.min(30, Math.max(0, Number(ctx.conductIncidents ?? 0)) * 10);
  return Math.round(clamp(results * .32 + reputation * .23 + visibility * .17 + professionalism * .13 + compliance * .15 + qualification + winMomentum - conductPenalty));
}

export function inSeasonSponsorOpportunity(ctx = {}, prior = {}) {
  const value = marketValue(ctx);
  const seen = new Set(prior.seen ?? []);
  let tier = null;
  if (value >= 82) tier = 'manufacturer-amateur';
  else if (value >= 68) tier = 'regional-team';
  else if (value >= 54) tier = 'dealer-support';
  else if (value >= 42) tier = 'local-shop';
  if (!tier) return { marketValue: value, offer: null, reason: 'not-yet-visible' };
  const milestone = ctx.majorQualification ? 'qualification' : Number(ctx.recentWins ?? 0) >= 2 ? 'win-streak' : 'rising-value';
  const key = `${ctx.seasonYear}:${tier}:${milestone}`;
  if (seen.has(key)) return { marketValue: value, offer: null, reason: 'already-seen' };
  const support = tier === 'manufacturer-amateur'
    ? { type: 'mixed', cash: 1200, product: 1800, travel: 600, discount: 30 }
    : tier === 'regional-team'
      ? { type: 'mixed', cash: 700, product: 900, travel: 350, discount: 20 }
      : tier === 'dealer-support'
        ? { type: 'discount+entries', cash: 250, product: 450, travel: 0, discount: 20 }
        : { type: 'product', cash: 100, product: 250, travel: 0, discount: 10 };
  return {
    marketValue: value,
    offer: {
      id: `midseason-${key}`,
      key,
      tier,
      source: milestone,
      guardianRequired: Number(ctx.age ?? 18) < 18,
      support,
      obligations: tier === 'manufacturer-amateur' ? ['product-use', 'graphics', 'major-event-attendance', 'conduct'] : ['graphics', 'product-use', 'conduct'],
      status: 'offered',
    },
    reason: milestone,
  };
}

export function recordSponsorDecision(stateInput, offer, decision) {
  const state = restoreLifecycleState(stateInput);
  if (!offer) return state;
  state.sponsorMarket.seen = [...new Set([...(state.sponsorMarket.seen ?? []), offer.key])];
  state.sponsorMarket.history.push({ offerId: offer.id, tier: offer.tier, decision, support: copy(offer.support) });
  if (decision === 'accept') state.sponsorMarket.offers.push({ ...copy(offer), status: 'accepted' });
  return state;
}

export function evaluatePivot(ctx = {}, stateInput = {}) {
  const state = restoreLifecycleState(stateInput);
  const triggers = [];
  if (ctx.majorQualification) triggers.push('major-qualification');
  if (Number(ctx.recentWins ?? 0) >= 2) triggers.push('breakout-results');
  if (ctx.injury) triggers.push('injury');
  if (Number(ctx.money ?? Infinity) < Number(ctx.projectedRemainingCost ?? 0) * .35) triggers.push('financial-pressure');
  if (Number(ctx.bikeCondition ?? 100) < 30) triggers.push('bike-crisis');
  if (ctx.newMajorSupport) triggers.push('support-escalation');
  const priorKeys = new Set((state.pivots ?? []).flatMap((p) => p.triggers ?? []));
  const fresh = triggers.filter((t) => !priorKeys.has(t));
  if (!fresh.length) return { shouldReview: false, triggers: [], recommendation: null };
  const retreat = fresh.some((t) => ['injury', 'financial-pressure', 'bike-crisis'].includes(t));
  const expand = fresh.some((t) => ['major-qualification', 'breakout-results', 'support-escalation'].includes(t));
  return { shouldReview: true, triggers: fresh, recommendation: retreat ? 'protect-and-revise' : expand ? 'consider-expansion' : 'review-plan' };
}

export function recordPivot(stateInput, pivot) {
  const state = restoreLifecycleState(stateInput);
  if (pivot?.shouldReview) state.pivots.push({ ...copy(pivot), recordedAtWeek: pivot.week ?? null });
  return state;
}

export function buildSeasonReview(opening = {}, actual = {}) {
  const races = Number(actual.races ?? 0);
  const wins = Number(actual.wins ?? 0);
  const podiums = Number(actual.podiums ?? 0);
  const dnfs = Number(actual.dnfs ?? 0);
  const startMoney = Number(opening.money ?? 0);
  const endMoney = Number(actual.money ?? 0);
  const plannedSpend = Number(opening.projectedSeasonCost ?? 0);
  const actualSpend = Math.max(0, Number(actual.actualSpend ?? (startMoney - endMoney)));
  const sponsorChanges = copy(actual.sponsorChanges ?? []);
  const summary = wins > 0 ? 'A season with wins to remember.' : podiums > 0 ? 'Progress became visible on race day.' : dnfs > Math.max(1, races / 3) ? 'A hard season that tested the program.' : 'A season of building the life and the rider.';
  return {
    seasonYear: opening.seasonYear ?? actual.seasonYear,
    posture: actual.posture ?? opening.recommendedPosture ?? null,
    summary,
    plan: { projectedSpend: plannedSpend, openingMoney: startMoney, risks: copy(opening.risks ?? []) },
    actual: { races, wins, podiums, dnfs, points: Number(actual.points ?? 0), majorQualification: !!actual.majorQualification, actualSpend, endingMoney: endMoney },
    delta: { money: endMoney - startMoney, spendVsPlan: actualSpend - plannedSpend },
    sponsorChanges,
    rivalry: copy(actual.rivalry ?? null),
    family: copy(actual.family ?? null),
    memories: copy(actual.memories ?? []),
    carryover: {
      money: endMoney,
      reputation: clamp(actual.reputation ?? 0),
      injury: copy(actual.injury ?? null),
      bikeCondition: clamp(actual.bikeCondition ?? 100),
      sponsorRenewalInterest: clamp(actual.sponsorRenewalInterest ?? 50),
      unresolvedObligations: copy(actual.unresolvedObligations ?? []),
      majorOpportunity: copy(actual.majorOpportunity ?? null),
    },
  };
}

export function closeSeason(stateInput, review) {
  const state = restoreLifecycleState(stateInput);
  state.review = copy(review);
  state.carryover = copy(review?.carryover ?? null);
  if (review) state.history.push(copy(review));
  return state;
}

export function startNextSeason(stateInput, seasonYear) {
  const previous = restoreLifecycleState(stateInput);
  return restoreLifecycleState({ seasonYear, carryover: previous.carryover, history: previous.history });
}