import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';

test('#104/#110 Game exposes responsibility approvals from live state', () => {
  const g = new Game({ riderName: 'Test', seed: 1, birthdate: `${new Date().getFullYear() - 14}-05-15` });
  g.family.money = 1200;
  const approval = g.approvalFor('loretta_attempt', { cost: 150 });
  assert.ok(['approved_with_parent', 'approved_with_conditions', 'approved'].includes(approval.result));
  assert.equal(typeof g.trustScore(), 'number');
});

test('#161/#162 Game starts race weekend with readiness state', () => {
  const g = new Game({ riderName: 'Test', seed: 2, birthdate: `${new Date().getFullYear() - 10}-05-15` });
  g.state.week = 3;
  g.rebuildCalendar();
  const weekend = g.startRaceWeekend();
  assert.ok(weekend);
  assert.ok(['registered', 'registration_pending'].includes(weekend.state));
  assert.equal(g.state.raceWeekend.eventName, g.meta().race.name);
});

test('#100 class transition flags required bike when family cannot afford it', () => {
  const year = new Date().getFullYear();
  const g = new Game({ riderName: 'Test', seed: 3, birthdate: `${year - 11}-05-15` });
  g.family.money = 0;
  g.state.week = 13;
  g.startNextSeason();
  assert.equal(g.rider.klass, '85cc');
  assert.equal(g.state.flags.needs_class_bike, '85cc');
});
