import test from 'node:test';
import assert from 'node:assert/strict';
import { LivingCareerCalendar, buildAgendaView } from '../src/systems/livingCalendar.js';
import {
  createSchoolState, regionalRidingAvailability, estimateTrainingTrip,
  canCommitTrainingTrip, makeAIFamilyProfile, decideAIWinterTraining,
  planRaceCommitment, availableLifeActivities, resolveLifeActivity,
} from '../src/systems/calendarLife.js';

const northeast = { id: 'northeast', ridingSeason: { openMonths: [4,5,6,7,8,9,10], shoulderMonths: [3,11] } };
const southeast = { id: 'southeast', ridingSeason: { yearRound: true } };

test('full-year youth career has no invisible time and supports winter regional mobility', () => {
  const cal = new LivingCareerCalendar({ startDate: '2026-01-01', endDate: '2027-01-31', currentDate: '2026-01-01' });
  const publicSchool = createSchoolState('public');
  const home = regionalRidingAvailability(northeast, '2026-01-10');
  const away = regionalRidingAvailability(southeast, '2026-01-10');
  assert.equal(home.status, 'closed');
  assert.equal(away.status, 'open');

  const floridaTrip = estimateTrainingTrip({
    originRegion: 'northeast', destinationRegion: 'southeast',
    startDate: '2026-01-10', endDate: '2026-01-14', oneWayMiles: 1200,
    riderAge: 10, schoolState: publicSchool,
  });
  assert.equal(canCommitTrainingTrip(floridaTrip, { money: 9000, riderAge: 10, guardianApproved: true, schoolState: publicSchool }).ok, true);
  cal.add({ startDate: floridaTrip.startDate, endDate: floridaTrip.endDate, type: 'travel', title: 'Winter training trip', meta: { trip: floridaTrip } });

  const wealthyAI = makeAIFamilyProfile({ id: 'rival_a', money: 15000, ambition: 0.95, parentAvailability: 0.9, travelTolerance: 0.9, schooling: 'homeschool' });
  const modestAI = makeAIFamilyProfile({ id: 'rival_b', money: 1800, ambition: 0.45, parentAvailability: 0.5, travelTolerance: 0.3 });
  assert.equal(decideAIWinterTraining(wealthyAI, { homeAvailability: home, trip: floridaTrip }).action, 'travel_training');
  assert.notEqual(decideAIWinterTraining(modestAI, { homeAvailability: home, trip: floridaTrip }).action, 'travel_training');

  let state = { money: 9000, fatigue: 0, bikeCondition: 90, development: 0 };
  const aprilActivities = availableLifeActivities({ date: '2026-04-08', riderAge: 10, schoolState: publicSchool, money: state.money, fatigue: state.fatigue, bikeCondition: state.bikeCondition, weatherOpen: true });
  state = resolveLifeActivity(aprilActivities.find((a) => a.id === 'practice'), state);
  assert.ok(state.development > 0);

  const race = planRaceCommitment(cal, {
    raceId: 'aq1', title: 'Area Qualifier', eventDate: '2026-05-17', location: 'Northeast',
    championshipRound: 1, travelDaysBefore: 1, travelDaysAfter: 0,
    totalCost: 450, money: state.money, riderAge: 10, guardianApproved: true,
    schoolState: createSchoolState('homeschool'),
  });
  assert.equal(race.ok, true);

  cal.advanceTo('2026-12-31');
  const saved = JSON.parse(JSON.stringify(cal.toJSON()));
  const restored = LivingCareerCalendar.fromJSON(saved);
  restored.advanceTo('2027-01-01');
  assert.equal(restored.currentDate, '2027-01-01');
  assert.equal(restored.events.get('aq1').title, 'Area Qualifier');

  const fullYear = new LivingCareerCalendar({ startDate: '2026-01-01', endDate: '2026-12-31' });
  assert.equal(buildAgendaView(fullYear, { fromDate: '2026-01-01', days: 365, includeEmpty: true }).rows.length, 365);
});
