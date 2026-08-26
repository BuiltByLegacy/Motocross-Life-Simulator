import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMonthCalendar } from '../src/systems/monthCalendar.js';
import { dateRangeForWeek, calendarAgenda, calendarMonthRows } from '../src/systems/calendarPresentation.js';

const calendar = [
  { week: 1, title: 'Season opener', race: { name: 'Opener', kind: 'local' } },
  { week: 2, title: 'Open weekend' },
  { week: 3, title: 'Training camp', camp: true },
  { week: 4, title: 'Round 2', race: { name: 'Round 2', kind: 'regional' } },
  { week: 5, title: 'Family weekend' },
];

test('player-facing ranges use Gregorian dates instead of Week X labels', () => {
  const model = buildMonthCalendar(calendar, { year: 2026, seasonStartDate: '2026-04-07', currentWeek: 2 });
  assert.equal(dateRangeForWeek(model, 1).label, 'Apr 7–13, 2026');
  assert.equal(dateRangeForWeek(model, 2).label, 'Apr 14–20, 2026');
  assert.equal(dateRangeForWeek(model, 4).label, 'Apr 28–May 4, 2026');
});

test('agenda preserves open time and event status with real date ranges', () => {
  const model = buildMonthCalendar(calendar, { year: 2026, seasonStartDate: '2026-04-07', currentWeek: 2 });
  const agenda = calendarAgenda(model);
  assert.equal(agenda.length, 5);
  assert.equal(agenda[0].status, 'past');
  assert.equal(agenda[1].status, 'current');
  assert.equal(agenda[1].eventLabel, 'Open weekend');
  assert.equal(agenda[3].eventLabel, 'Round 2');
  assert.ok(agenda.every((entry) => entry.range?.start && entry.range?.end));
});

test('month rows can cross a month boundary without losing dates', () => {
  const model = buildMonthCalendar(calendar, { year: 2026, seasonStartDate: '2026-04-07', currentWeek: 4 });
  const april = calendarMonthRows(model, '2026-3');
  const may = calendarMonthRows(model, '2026-4');
  assert.equal(april.month.label, 'April 2026');
  assert.equal(may.month.label, 'May 2026');
  assert.equal(april.rows.at(-1).range.label, 'Apr 28–May 4, 2026');
  assert.equal(may.rows[0].range.label, 'May 5–11, 2026');
});
