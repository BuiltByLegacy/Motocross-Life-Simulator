import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMonthCalendar, adjacentMonth, monthByIndex, MONTH_NAMES,
} from '../src/systems/monthCalendar.js';

// A representative 12-week season: races at 3/5/7/9/11, a camp at 4/8.
function season() {
  const cal = [];
  for (let w = 1; w <= 12; w++) {
    const entry = { week: w, title: `Week ${w}` };
    if ([3, 5, 7, 9, 11].includes(w)) {
      entry.race = { name: `Race ${w}`, kind: w === 7 ? 'national' : 'local', category: w === 11 ? 'qualifier' : 'race', lorettaStage: w === 11 ? 'area' : undefined };
    } else if ([4, 8].includes(w)) entry.camp = true;
    cal.push(entry);
  }
  return cal;
}

test('#224 groups 12 weeks into calendar months with real month names', () => {
  const mc = buildMonthCalendar(season(), { startMonthIndex: 3, year: 2026, currentWeek: 1 });
  assert.equal(mc.months.length, 3);
  assert.equal(mc.months[0].name, 'April');
  assert.equal(mc.months[1].name, 'May');
  assert.equal(mc.months[2].name, 'June');
  assert.equal(mc.months[0].label, 'April 2026');
  assert.equal(mc.months[0].weeks.length, 4);
});

test('#224 maps internal weeks onto real calendar dates instead of four-week pseudo-months', () => {
  const mc = buildMonthCalendar(season(), { seasonStartDate: '2026-04-04', year: 2026, currentWeek: 1 });
  const wk = (n) => mc.months.flatMap((m) => m.weeks).find((w) => w.week === n);
  assert.equal(mc.seasonStartDate, '2026-04-04');
  assert.equal(wk(1).date, '2026-04-04');
  assert.equal(wk(4).date, '2026-04-25');
  assert.equal(wk(5).date, '2026-05-02');
  assert.equal(wk(9).date, '2026-05-30');
  assert.equal(wk(10).date, '2026-06-06');
});

test('#224 tags weeks with race / qualifier / camp / off markers', () => {
  const mc = buildMonthCalendar(season(), { currentWeek: 1 });
  const wk = (n) => mc.months.flatMap((m) => m.weeks).find((w) => w.week === n);
  assert.equal(wk(3).kind, 'race');
  assert.equal(wk(7).kind, 'national');
  assert.equal(wk(11).kind, 'qualifier'); // area qualifier
  assert.equal(wk(4).kind, 'camp');
  assert.equal(wk(2).kind, 'off');
});

test('#224 registration deadlines land two weeks before each race', () => {
  const mc = buildMonthCalendar(season(), { currentWeek: 1 });
  const wk = (n) => mc.months.flatMap((m) => m.weeks).find((w) => w.week === n);
  // Race at week 3 → deadline marked on week 1
  assert.ok(wk(1).deadline);
  assert.equal(wk(1).deadline.forWeek, 3);
  assert.ok(wk(1).markers.includes('deadline'));
  // Race at week 5 → deadline on week 3 (which is also a race day)
  assert.ok(wk(3).deadline);
});

test('#224 summary counts races, qualifiers, camps, off weekends, upcoming deadlines', () => {
  const mc = buildMonthCalendar(season(), { currentWeek: 6 });
  assert.equal(mc.summary.totalRaces, 5);
  assert.equal(mc.summary.qualifiers, 2); // week 7 national + week 11 qualifier
  assert.equal(mc.summary.camps, 2);
  assert.ok(mc.summary.offWeekends > 0);
  // Only deadlines at/after the current week are "upcoming"
  assert.ok(mc.summary.upcomingDeadlines.every((d) => d.week >= 6));
  assert.ok(mc.summary.upcomingDeadlines.every((d) => /^\d{4}-\d{2}-\d{2}$/.test(d.date)));
});

test('#224 current month tracks the current week', () => {
  const mc = buildMonthCalendar(season(), { startMonthIndex: 3, currentWeek: 6 });
  assert.equal(mc.currentMonthIndex, 4);
  const now = mc.months.flatMap((m) => m.weeks).find((w) => w.week === 6);
  assert.equal(now.isNow, true);
  assert.equal(mc.months.flatMap((m) => m.weeks).find((w) => w.week === 3).isPast, true);
});

test('#224 month navigation clamps at the ends and preserves numeric UI compatibility', () => {
  const mc = buildMonthCalendar(season(), { startMonthIndex: 3 });
  assert.equal(adjacentMonth(mc, 3, +1), 4); // April → May
  assert.equal(adjacentMonth(mc, 5, +1), 5); // June is last → clamp
  assert.equal(adjacentMonth(mc, 3, -1), 3); // April is first → clamp
  assert.equal(monthByIndex(mc, 4).name, 'May');
});

test('#224 keyed navigation stays unambiguous across year rollover', () => {
  const mc = buildMonthCalendar(season(), { startMonthIndex: 10, year: 2026 });
  assert.equal(mc.months[0].name, 'November');
  assert.equal(mc.months[2].label, 'January 2027');
  assert.ok(MONTH_NAMES.includes(mc.months[0].name));
  assert.equal(adjacentMonth(mc, mc.months[1].key, +1), mc.months[2].key);
  assert.equal(monthByIndex(mc, mc.months[2].key).label, 'January 2027');
});
