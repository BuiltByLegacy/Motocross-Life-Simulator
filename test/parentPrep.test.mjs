import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  assessReadiness, estimateRepairCost, parentRepairDecision, applyRepair, REPAIR_CHANNELS,
} from '../src/systems/parentPrep.js';

const freshBike = { condition: 90, parts: { tires: 100, topEnd: 100, chain: 100, brakes: 100 } };
const wornBike = { condition: 60, parts: { tires: 15, topEnd: 70, chain: 30, brakes: 80 } };

test('#222 readiness: fresh bike is ready; worn parts are flagged by severity', () => {
  assert.equal(assessReadiness(freshBike).ready, true);
  const r = assessReadiness(wornBike, { eventImportance: 0.5 });
  assert.equal(r.ready, false);
  const parts = r.issues.map((i) => i.part);
  assert.ok(parts.includes('tires')); // 15 < threshold
  assert.ok(parts.includes('chain')); // 30 < threshold
  assert.equal(r.issues.find((i) => i.part === 'tires').severity, 'critical'); // <20
  assert.equal(r.worstLife, 15);
});

test('#222 an important event raises the readiness bar', () => {
  const local = assessReadiness({ condition: 100, parts: { tires: 50 } }, { eventImportance: 0.2 });
  const national = assessReadiness({ condition: 100, parts: { tires: 50 } }, { eventImportance: 1.0 });
  assert.equal(local.ready, true);      // 50 ok for a low-key event
  assert.equal(national.ready, false);  // 50 below the raised bar
});

test('#222 repair cost sums per-part costs', () => {
  const r = assessReadiness(wornBike, { eventImportance: 0.5 });
  assert.equal(estimateRepairCost(r.issues) > 0, true);
});

test('#222 parent approves when affordable and event matters; picks dealer with a mechanic', () => {
  const r = assessReadiness(wornBike, { eventImportance: 0.8 });
  const d = parentRepairDecision({ budget: 2000, stress: 20, trust: 70, eventImportance: 0.8, readiness: r, mechanicSkill: 70 });
  assert.equal(d.approve, true);
  assert.equal(d.channel, 'dealer');
  assert.ok(REPAIR_CHANNELS.includes(d.channel));
});

test('#222 no home mechanic routes to the shop (with a labor premium)', () => {
  const r = assessReadiness(wornBike, { eventImportance: 0.8 });
  const base = estimateRepairCost(r.issues);
  const d = parentRepairDecision({ budget: 2000, eventImportance: 0.8, readiness: r, mechanicSkill: 10 });
  assert.equal(d.channel, 'shop');
  assert.ok(d.cost > base); // shop labor premium
});

test('#222 tight budget prefers used parts', () => {
  const r = assessReadiness(wornBike, { eventImportance: 0.5 });
  const cost = estimateRepairCost(r.issues);
  const d = parentRepairDecision({ budget: cost + 20, stress: 40, eventImportance: 0.5, readiness: r, mechanicSkill: 60 });
  assert.equal(d.approve, true);
  assert.equal(d.channel, 'used');
});

test('#222 unaffordable repair is skipped with a warning', () => {
  const r = assessReadiness(wornBike, { eventImportance: 0.5 });
  const cost = estimateRepairCost(r.issues);
  const d = parentRepairDecision({ budget: cost - 50, eventImportance: 0.5, readiness: r, mechanicSkill: 60 });
  assert.equal(d.approve, false);
  assert.equal(d.channel, 'skip');
  const applied = applyRepair(r, d);
  assert.equal(applied.spent, 0);
  assert.ok(applied.warning);
});

test('#222 low-importance repair that eats the budget is deferred to save money', () => {
  // A worn (not critical) top-end is pricey; for a small event on a thin budget
  // the parent chooses to repair later rather than spend most of the money.
  const mild = { condition: 100, parts: { tires: 100, topEnd: 35, chain: 100, brakes: 100 } };
  const r = assessReadiness(mild, { eventImportance: 0.2 });
  assert.equal(r.ready, false);
  const d = parentRepairDecision({ budget: 300, stress: 40, eventImportance: 0.2, readiness: r, mechanicSkill: 60 });
  assert.equal(d.approve, false); // affordable in theory, but not worth it here
  assert.equal(d.channel, 'skip');
});

test('#222 approved repair refreshes exactly the worn parts', () => {
  const r = assessReadiness(wornBike, { eventImportance: 0.8 });
  const d = parentRepairDecision({ budget: 3000, eventImportance: 0.8, readiness: r, mechanicSkill: 70 });
  const applied = applyRepair(r, d);
  assert.deepEqual(applied.repaired.sort(), r.issues.map((i) => i.part).sort());
  assert.ok(applied.spent > 0);
});
