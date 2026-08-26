import test from 'node:test';
import assert from 'node:assert/strict';
import { LivingCareerCalendar } from '../src/systems/livingCalendar.js';
import {
  createSchoolState, schoolingConstraints, changeSchoolingPath, availableLifeActivities,
  resolveLifeActivity, regionalRidingAvailability, estimateTrainingTrip, canCommitTrainingTrip,
  makeAIFamilyProfile, decideAIWinterTraining, planRaceCommitment, rescheduleCommitment,
} from '../src/systems/calendarLife.js';

test('public school and homeschool create different weekday flexibility', () => {
  const publicSchool = createSchoolState('public');
  const homeschool = createSchoolState('homeschool');
  const pub = schoolingConstraints(publicSchool, { riderAge: 10, date: '2026-04-08', parentAvailability: 1 });
  const home = schoolingConstraints(homeschool, { riderAge: 10, date: '2026-04-08', parentAvailability: 1 });
  assert.equal(pub.requiredSchool, true);
  assert.equal(home.requiredSchool, false);
  assert.ok(home.availableTrainingHours > pub.availableTrainingHours);
});

test('young riders need guardian approval to change schooling path', () => {
  const school = createSchoolState('public');
  assert.equal(changeSchoolingPath(school, 'homeschool', { riderAge: 10 }).ok, false);
  assert.equal(changeSchoolingPath(school, 'homeschool', { riderAge: 10, guardianApproved: true }).ok, true);
});

test('off-week activities make open time playable and consequential', () => {
  const activities = availableLifeActivities({ date: '2026-04-08', riderAge: 12, schoolState: createSchoolState('public'), money: 500, fatigue: 20, bikeCondition: 80, weatherOpen: true });
  assert.ok(activities.some((a) => a.id === 'school'));
  assert.ok(activities.some((a) => a.id === 'practice'));
  assert.ok(activities.some((a) => a.id === 'maintenance'));
  assert.ok(activities.some((a) => a.id === 'rest'));
  const practice = activities.find((a) => a.id === 'practice');
  const next = resolveLifeActivity(practice, { money: 500, fatigue: 20, bikeCondition: 80, development: 0 });
  assert.ok(next.money < 500);
  assert.ok(next.development > 0);
  assert.ok(next.bikeCondition < 80);
});

test('regional seasonality can close Northeast while Southeast stays open', () => {
  const northeast = { id: 'northeast', ridingSeason: { openMonths: [4,5,6,7,8,9,10], shoulderMonths: [3,11] } };
  const southeast = { id: 'southeast', ridingSeason: { yearRound: true } };
  assert.equal(regionalRidingAvailability(northeast, '2026-01-15').status, 'closed');
  assert.equal(regionalRidingAvailability(southeast, '2026-01-15').status, 'open');
});

test('CT-style winter training trip has realistic calendar and financial pressure', () => {
  const trip = estimateTrainingTrip({ originRegion: 'northeast', destinationRegion: 'southeast', startDate: '2026-01-10', endDate: '2026-01-17', oneWayMiles: 1200, riderAge: 10, schoolState: createSchoolState('public'), parentDailyLostIncome: 80 });
  assert.equal(trip.days, 8);
  assert.ok(trip.costs.total > 1500);
  assert.ok(trip.consequences.missedSchoolDays > 0);
  assert.equal(canCommitTrainingTrip(trip, { money: 1000, riderAge: 10, guardianApproved: true, schoolState: createSchoolState('public') }).reason, 'insufficient_budget');
});

test('AI family travel choices differ by money, ambition and support', () => {
  const home = { status: 'closed' };
  const trip = estimateTrainingTrip({ originRegion: 'northeast', destinationRegion: 'southeast', startDate: '2026-01-10', endDate: '2026-01-14', oneWayMiles: 1000 });
  const committed = makeAIFamilyProfile({ id: 'a', money: 20000, ambition: 0.95, parentAvailability: 0.95, travelTolerance: 0.9, schooling: 'homeschool' });
  const local = makeAIFamilyProfile({ id: 'b', money: 2000, ambition: 0.3, parentAvailability: 0.4, travelTolerance: 0.2 });
  assert.equal(decideAIWinterTraining(committed, { homeAvailability: home, trip }).action, 'travel_training');
  assert.notEqual(decideAIWinterTraining(local, { homeAvailability: home, trip }).action, 'travel_training');
});

test('race commitments occupy real multi-day dates and can be safely rescheduled', () => {
  const cal = new LivingCareerCalendar({ startDate: '2026-01-01', endDate: '2026-12-31' });
  const result = planRaceCommitment(cal, { raceId: 'r1', title: 'Regional', eventDate: '2026-06-14', travelDaysBefore: 1, travelDaysAfter: 1, totalCost: 500, money: 2000, riderAge: 16 });
  assert.equal(result.ok, true);
  assert.equal(result.event.startDate, '2026-06-13');
  assert.equal(result.event.endDate, '2026-06-15');
  const moved = rescheduleCommitment(cal, 'r1', { eventDate: '2026-06-21', travelDaysBefore: 1, travelDaysAfter: 1 });
  assert.equal(moved.ok, true);
  assert.equal(cal.events.get('r1').startDate, '2026-06-20');
});
