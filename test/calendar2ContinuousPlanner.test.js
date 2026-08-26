import test from 'node:test';
import assert from 'node:assert/strict';
import { continuousPlannerPeriods } from '../src/calendar2PlannerPatch.js';

function fakeGame() {
  return {
    seasonYear: 2026,
    week: 1,
    eventPool() {
      return {
        3: [{ id: 'rocky', name: 'Rocky Ridge MX', entry: 35 }],
        5: [{ id: 'pine', name: 'Pine Hollow', entry: 35 }],
        7: [{ id: 'sandy', name: 'Sandy Creek', entry: 35 }],
      };
    },
  };
}

test('Calendar 2.0 planner never skips non-race periods', () => {
  const periods = continuousPlannerPeriods(fakeGame());
  assert.deepEqual(periods.map((p) => p.week), [1,2,3,4,5,6,7,8,9,10,11,12]);
  assert.equal(periods.length, 12);
  assert.equal(periods[1].isOpen, true);
  assert.equal(periods[2].isOpen, false);
  assert.equal(periods[3].isOpen, true);
});

test('Calendar 2.0 planner uses consecutive real date ranges', () => {
  const periods = continuousPlannerPeriods(fakeGame());
  assert.equal(periods[0].range, 'Apr 4–10, 2026');
  assert.equal(periods[1].range, 'Apr 11–17, 2026');
  assert.equal(periods[2].range, 'Apr 18–24, 2026');
  assert.equal(periods[3].range, 'Apr 25–May 1, 2026');
});
