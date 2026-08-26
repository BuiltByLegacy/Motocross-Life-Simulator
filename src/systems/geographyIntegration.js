// Geography integration layer — calendar, economy, UX, and E2E support
import { calendarLocation, homeRegionSummary, migrateHomeGeography, rankEventsForHome, recordVenueVisit, travelQuote, venueById } from './geography.js';

export function classifyOpportunity(event, home) {
  const venue = venueById(event.venueId);
  const travel = travelQuote(home, venue);
  if (!travel.valid) return { ...event, venue, travel, scope: 'unknown' };
  let scope = 'local';
  if (event.level === 'national' || travel.band === 'long-haul') scope = 'long-haul';
  else if (event.level === 'regional' || travel.band === 'regional-haul' || travel.band === 'overnight') scope = 'regional';
  if (event.type === 'area-qualifier') scope = travel.band === 'day-trip' ? 'qualifier-local' : 'qualifier-travel';
  if (event.type === 'regional-championship') scope = 'regional-championship';
  return { ...event, venue, travel, scope };
}

export function discoverRegionAwareEvents(home, events = []) {
  return rankEventsForHome(home, events).map((event) => classifyOpportunity(event, home));
}

export function geographyCommitPreview({ home, event, budget = Infinity, currentFatigue = 0 } = {}) {
  const opportunity = classifyOpportunity(event, home);
  const warnings = [];
  if (!opportunity.travel.valid) warnings.push({ severity: 'hard', code: 'missing-geography', message: opportunity.travel.reason });
  if (opportunity.travel.valid && opportunity.travel.cost > budget) warnings.push({ severity: 'hard', code: 'over-budget', message: `Trip costs $${opportunity.travel.cost}, above available budget.` });
  if (opportunity.travel.valid && opportunity.travel.fatigue + currentFatigue >= 85) warnings.push({ severity: 'soft', code: 'travel-fatigue', message: 'Travel creates a high fatigue load before race day.' });
  if (opportunity.travel.valid && ['regional-haul', 'long-haul'].includes(opportunity.travel.band)) warnings.push({ severity: 'soft', code: 'long-travel', message: `${opportunity.travel.travelHours}h each way with ${opportunity.travel.lodgingNights} lodging night(s).` });
  return {
    opportunity,
    location: opportunity.venue ? calendarLocation(home, opportunity.venue.id) : null,
    canCommit: !warnings.some((w) => w.severity === 'hard'),
    warnings,
    projectedBudget: Number.isFinite(budget) && opportunity.travel.valid ? Math.max(0, budget - opportunity.travel.cost) : budget,
    projectedFatigue: opportunity.travel.valid ? Math.min(100, currentFatigue + opportunity.travel.fatigue) : currentFatigue,
  };
}

export function applyTravelCommit({ home, event, budget = 0, fatigue = 0 } = {}) {
  const preview = geographyCommitPreview({ home, event, budget, currentFatigue: fatigue });
  if (!preview.canCommit) return { ok: false, ...preview, budget, fatigue };
  return {
    ok: true,
    ...preview,
    budget: preview.projectedBudget,
    fatigue: preview.projectedFatigue,
    calendarLocation: preview.location,
  };
}

export function resolveVenueWeekend({ home, event, result = null, fatigue = 0 } = {}) {
  const venue = venueById(event.venueId);
  const travel = travelQuote(home, venue);
  const nextHome = venue ? recordVenueVisit(home, venue.id, { result }) : migrateHomeGeography(home);
  return {
    home: nextHome,
    fatigueAfterReturn: travel.valid ? Math.min(100, fatigue + Math.round(travel.fatigue * 0.35)) : fatigue,
    familiarity: venue ? nextHome.familiarity[venue.id] ?? 0 : 0,
    visits: venue ? nextHome.visits[venue.id] ?? 0 : 0,
  };
}

export function geographyDashboard(home, events = []) {
  const summary = homeRegionSummary(home);
  const opportunities = discoverRegionAwareEvents(home, events);
  return {
    home: summary,
    nearbyOpportunities: opportunities.filter((e) => e.scope === 'local' || e.scope === 'qualifier-local').slice(0, 5),
    regionalOpportunities: opportunities.filter((e) => e.scope === 'regional' || e.scope === 'regional-championship').slice(0, 5),
    travelOpportunities: opportunities.filter((e) => e.scope === 'long-haul' || e.scope === 'qualifier-travel').slice(0, 5),
  };
}

export function serializeGeographyIntegration(state = {}) {
  return JSON.stringify({ version: 1, home: migrateHomeGeography(state.home), budget: state.budget ?? 0, fatigue: state.fatigue ?? 0 });
}

export function restoreGeographyIntegration(serialized) {
  const raw = typeof serialized === 'string' ? JSON.parse(serialized) : (serialized ?? {});
  return { version: 1, home: migrateHomeGeography(raw.home), budget: raw.budget ?? 0, fatigue: raw.fatigue ?? 0 };
}
