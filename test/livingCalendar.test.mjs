import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LivingCareerCalendar, createCalendarEvent, buildAgendaView, buildMonthView,
  addDays, daysBetween, dateRangeLabel, conflictPairs,
} from '../src/systems/livingCalendar.js';

test('full calendar year exposes every date with no hidden gaps', () => {
  const cal = new LivingCareerCalendar({ startDate: '2026-01-01', endDate: '2026-12-31' });
  const dates = cal.everyDate();
  assert.equal(dates.length, 365);
  assert.equal(dates[0], '2026-01-01');
  assert.equal(dates.at(-1), '2026-12-31');
  for (let i = 1; i < dates.length; i++) assert.equal(daysBetween(dates[i - 1], dates[i]), 1);
});

test('events attach to real dates and can span travel/race blocks', () => {
  const cal = new LivingCareerCalendar({ startDate: '2026-01-01', endDate: '2026-12-31' });
  cal.add(createCalendarEvent({ id: 'southwick', startDate: '2026-05-15', endDate: '2026-05-17', type: 'race', title: 'Southwick Regional', championshipRound: 3 }));
  assert.equal(cal.onDate('2026-05-16')[0].title, 'Southwick Regional');
  assert.equal(cal.range('2026-05-01', '2026-05-31').length, 1);
});

test('month view uses true Gregorian month lengths and real weekdays', () => {
  const cal = new LivingCareerCalendar({ startDate: '2026-01-01', endDate: '2026-12-31', currentDate: '2026-04-07' });
  cal.add({ startDate: '2026-04-11', type: 'practice', title: 'Open practice' });
  const april = buildMonthView(cal, 2026, 3);
  assert.equal(april.label, 'April 2026');
  assert.equal(april.cells.length, 30);
  assert.equal(april.cells.find((c) => c.date === '2026-04-11').events[0].title, 'Open practice');
  assert.equal(april.cells.find((c) => c.date === '2026-04-07').isCurrent, true);
});

test('agenda view can explicitly represent open dates instead of skipping them', () => {
  const cal = new LivingCareerCalendar({ startDate: '2026-04-01', endDate: '2026-04-30', currentDate: '2026-04-07' });
  cal.add({ startDate: '2026-04-11', type: 'race', title: 'Rocky Ridge MX' });
  const agenda = buildAgendaView(cal, { fromDate: '2026-04-07', days: 8, includeEmpty: true });
  assert.equal(agenda.rows.length, 8);
  assert.equal(agenda.rows[0].date, '2026-04-07');
  assert.equal(agenda.rows[1].events.length, 0);
  assert.equal(agenda.rows.find((r) => r.date === '2026-04-11').events[0].title, 'Rocky Ridge MX');
});

test('date labels and leap-year date math are calendar-correct', () => {
  assert.equal(addDays('2028-02-28', 1), '2028-02-29');
  assert.equal(addDays('2028-02-29', 1), '2028-03-01');
  assert.match(dateRangeLabel('2026-04-07', '2026-04-14'), /Apr/);
});

test('overlap conflicts work on real date ranges', () => {
  const cal = new LivingCareerCalendar({ startDate: '2026-01-01', endDate: '2026-12-31' });
  cal.add({ id: 'school', startDate: '2026-05-15', endDate: '2026-05-15', type: 'school', title: 'School' });
  cal.add({ id: 'travel', startDate: '2026-05-15', endDate: '2026-05-16', type: 'travel', title: 'Travel to race' });
  assert.deepEqual(conflictPairs(cal), [['school', 'travel']]);
});

test('calendar serializes and restores current date and events', () => {
  const cal = new LivingCareerCalendar({ startDate: '2026-01-01', endDate: '2027-01-31', currentDate: '2026-12-31' });
  cal.add({ startDate: '2027-01-02', type: 'training', title: 'Winter training' });
  const restored = LivingCareerCalendar.fromJSON(JSON.parse(JSON.stringify(cal.toJSON())));
  restored.advanceTo('2027-01-01');
  assert.equal(restored.currentDate, '2027-01-01');
  assert.equal(restored.onDate('2027-01-02')[0].title, 'Winter training');
});
