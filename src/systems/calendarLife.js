// Calendar 2.0 life systems (#327–#332)
import { addDays, daysBetween, createCalendarEvent, conflictPairs } from './livingCalendar.js';

export const SCHOOLING_PATHS = {
  public: {
    id: 'public', label: 'Public School', weekdayTrainingHours: 1.5, travelFlexibility: 0.35,
    parentTimeCost: 0.2, academicLoad: 0.75, socialAccess: 0.9,
  },
  homeschool: {
    id: 'homeschool', label: 'Homeschool', weekdayTrainingHours: 4, travelFlexibility: 0.85,
    parentTimeCost: 0.8, academicLoad: 0.6, socialAccess: 0.6,
  },
};

export function createSchoolState(path = 'public', { academicStanding = 70, missedDays = 0 } = {}) {
  if (!SCHOOLING_PATHS[path]) throw new Error(`Unknown schooling path: ${path}`);
  return { path, academicStanding, missedDays };
}

export function schoolingConstraints(schoolState, { riderAge, date, parentAvailability = 1 } = {}) {
  const profile = SCHOOLING_PATHS[schoolState.path];
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  const weekday = day >= 1 && day <= 5;
  const inSchoolYear = ![6, 7].includes(new Date(`${date}T00:00:00Z`).getUTCMonth());
  const requiredSchool = schoolState.path === 'public' && weekday && inSchoolYear;
  const flexibleHours = profile.weekdayTrainingHours * Math.max(0.25, parentAvailability);
  return {
    requiredSchool,
    availableTrainingHours: requiredSchool ? Math.min(2, flexibleHours) : flexibleHours,
    canDepartForTravel: !requiredSchool || profile.travelFlexibility >= 0.75,
    parentTimeBurden: profile.parentTimeCost * (riderAge < 14 ? 1 : 0.65),
  };
}

export function changeSchoolingPath(schoolState, nextPath, { riderAge, guardianApproved = false } = {}) {
  if (!SCHOOLING_PATHS[nextPath]) return { ok: false, reason: 'unknown_path' };
  if (riderAge < 16 && !guardianApproved) return { ok: false, reason: 'guardian_required' };
  schoolState.path = nextPath;
  return { ok: true, path: nextPath };
}

export function availableLifeActivities({
  date, riderAge, schoolState, money = 0, fatigue = 0, bikeCondition = 100,
  weatherOpen = true, parentAvailability = 1, hasSponsorObligation = false,
} = {}) {
  const school = schoolingConstraints(schoolState, { riderAge, date, parentAvailability });
  const out = [];
  if (school.requiredSchool) out.push({ id: 'school', hours: 7, moneyDelta: 0, fatigueDelta: 2, development: 0 });
  if (weatherOpen && school.availableTrainingHours >= 1 && bikeCondition >= 25 && money >= 25) {
    out.push({ id: 'practice', hours: Math.min(4, school.availableTrainingHours), moneyDelta: -35, fatigueDelta: 8, bikeWear: 4, development: 3 });
  }
  if (money >= 0) out.push({ id: 'maintenance', hours: 2, moneyDelta: bikeCondition < 60 ? -45 : -15, fatigueDelta: 1, bikeConditionDelta: 12, development: 0 });
  out.push({ id: 'rest', hours: 4, moneyDelta: 0, fatigueDelta: -15, development: 0 });
  out.push({ id: 'family', hours: 5, moneyDelta: -10, fatigueDelta: -5, relationshipDelta: 4, development: 0 });
  if (riderAge >= 12) out.push({ id: 'work', hours: 4, moneyDelta: riderAge >= 16 ? 70 : 30, fatigueDelta: 8, development: -1 });
  if (hasSponsorObligation) out.push({ id: 'sponsor', hours: 2, moneyDelta: 0, fatigueDelta: 2, reputationDelta: 3, development: 0 });
  return out;
}

export function resolveLifeActivity(activity, state) {
  const next = { ...state };
  next.money = Math.max(0, (next.money ?? 0) + (activity.moneyDelta ?? 0));
  next.fatigue = Math.max(0, Math.min(100, (next.fatigue ?? 0) + (activity.fatigueDelta ?? 0)));
  next.bikeCondition = Math.max(0, Math.min(100, (next.bikeCondition ?? 100) + (activity.bikeConditionDelta ?? 0) - (activity.bikeWear ?? 0)));
  next.development = (next.development ?? 0) + (activity.development ?? 0);
  next.relationship = (next.relationship ?? 0) + (activity.relationshipDelta ?? 0);
  next.reputation = (next.reputation ?? 0) + (activity.reputationDelta ?? 0);
  return next;
}

export function regionalRidingAvailability(profile, date, { weatherSeverity = 0 } = {}) {
  const month = new Date(`${date}T00:00:00Z`).getUTCMonth() + 1;
  const season = profile?.ridingSeason ?? {};
  const openMonths = season.openMonths ?? season.primaryMonths ?? [];
  const shoulderMonths = season.shoulderMonths ?? [];
  const yearRound = season.yearRound === true;
  let status = yearRound || openMonths.includes(month) ? 'open' : shoulderMonths.includes(month) ? 'limited' : 'closed';
  if (weatherSeverity >= 0.8 && status === 'open') status = 'limited';
  if (weatherSeverity >= 0.95) status = 'closed';
  return { regionId: profile?.id ?? 'unknown', date, month, status, outdoorAvailable: status !== 'closed' };
}

export function estimateTrainingTrip({
  originRegion, destinationRegion, startDate, endDate, oneWayMiles,
  lodgingPerNight = 95, practicePerDay = 45, fuelPerMile = 0.22, foodPerDay = 45,
  riderAge = 10, schoolState = createSchoolState(), parentDailyLostIncome = 0,
} = {}) {
  const days = daysBetween(startDate, endDate) + 1;
  const travelMiles = Math.max(0, oneWayMiles) * 2;
  const lodging = Math.max(0, days - 1) * lodgingPerNight;
  const practice = days * practicePerDay;
  const fuel = Math.round(travelMiles * fuelPerMile);
  const food = days * foodPerDay;
  const lostIncome = days * parentDailyLostIncome;
  const totalCost = Math.round(lodging + practice + fuel + food + lostIncome);
  const schoolDays = schoolState.path === 'public' ? Math.max(0, Math.round(days * 5 / 7)) : 0;
  return {
    originRegion, destinationRegion, startDate, endDate, days, travelMiles,
    costs: { lodging, practice, fuel, food, lostIncome, total: totalCost },
    consequences: { fatigue: Math.min(35, 8 + Math.round(days / 2)), bikeWear: Math.min(35, days * 3), development: days * 2, missedSchoolDays: schoolDays },
    guardianRequired: riderAge < 16,
  };
}

export function canCommitTrainingTrip(trip, { money, guardianApproved = false, riderAge = 10, schoolState } = {}) {
  if (trip.costs.total > money) return { ok: false, reason: 'insufficient_budget' };
  if (riderAge < 16 && !guardianApproved) return { ok: false, reason: 'guardian_required' };
  if (schoolState?.path === 'public' && trip.consequences.missedSchoolDays > 5) return { ok: false, reason: 'school_conflict' };
  return { ok: true };
}

export function createTrainingTripEvents(trip) {
  return [
    createCalendarEvent({ startDate: trip.startDate, endDate: trip.endDate, type: 'travel', title: `${trip.destinationRegion} training trip`, meta: { trip } }),
  ];
}

export function makeAIFamilyProfile({ id, money = 5000, ambition = 0.5, parentAvailability = 0.6, schooling = 'public', travelTolerance = 0.5 } = {}) {
  return { id, money, ambition, parentAvailability, schooling, travelTolerance };
}

export function decideAIWinterTraining(family, { homeAvailability, trip = null } = {}) {
  if (homeAvailability.status === 'open') return { action: 'local_training', reason: 'home_open' };
  if (!trip) return { action: 'stay_home', reason: 'no_trip_option' };
  const affordability = family.money / Math.max(1, trip.costs.total);
  const score = family.ambition * 0.45 + family.travelTolerance * 0.25 + family.parentAvailability * 0.15 + Math.min(1.5, affordability) * 0.15;
  if (score >= 0.7 && affordability >= 1) return { action: 'travel_training', score };
  if (score >= 0.45) return { action: 'local_alternative', score };
  return { action: 'stay_home', score };
}

export function planRaceCommitment(calendar, {
  raceId, title, eventDate, location = null, championshipRound = null,
  travelDaysBefore = 0, travelDaysAfter = 0, totalCost = 0,
  money = Infinity, schoolState = null, riderAge = 10, guardianApproved = false,
} = {}) {
  if (totalCost > money) return { ok: false, reason: 'insufficient_budget' };
  if (riderAge < 16 && !guardianApproved) return { ok: false, reason: 'guardian_required' };
  const raceStart = addDays(eventDate, -travelDaysBefore);
  const raceEnd = addDays(eventDate, travelDaysAfter);
  if (schoolState?.path === 'public') {
    for (let d = 0; d <= travelDaysBefore; d++) {
      const date = addDays(eventDate, -d);
      if (schoolingConstraints(schoolState, { riderAge, date }).requiredSchool && d > 0) return { ok: false, reason: 'school_conflict' };
    }
  }
  const event = createCalendarEvent({ id: raceId, startDate: raceStart, endDate: raceEnd, type: 'race', title, location, championshipRound, meta: { eventDate, totalCost } });
  const probe = new calendar.constructor(calendar.toJSON());
  probe.add(event);
  const conflicts = conflictPairs(probe).filter((pair) => pair.includes(raceId));
  if (conflicts.length) return { ok: false, reason: 'date_conflict', conflicts };
  calendar.add(event);
  return { ok: true, event };
}

export function rescheduleCommitment(calendar, id, { eventDate, travelDaysBefore = 0, travelDaysAfter = 0 } = {}) {
  const prior = calendar.events.get(id);
  if (!prior) return { ok: false, reason: 'not_found' };
  calendar.remove(id);
  const next = { ...prior, startDate: addDays(eventDate, -travelDaysBefore), endDate: addDays(eventDate, travelDaysAfter), meta: { ...prior.meta, eventDate } };
  calendar.add(next);
  return { ok: true, event: next };
}
