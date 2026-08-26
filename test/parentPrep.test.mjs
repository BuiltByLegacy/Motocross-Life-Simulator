import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  assessReadiness, estimateRepairCost, parentRepairDecision, applyRepair, REPAIR_CHANNELS,
  parentProcurementPlan, receiveParentProcurement,
} from '../src/systems/parentPrep.js';

const freshBike = { condition: 90, parts: { tires: 100, topEnd: 100, chain: 100, brakes: 100 } };
const wornBike = { klass: '85cc', condition: 60, parts: { tires: 15, topEnd: 70, chain: 30, brakes: 80 } };

test('#222 readiness: fresh bike is ready; worn parts are flagged by severity', () => {
  assert.equal(assessReadiness(freshBike).ready, true);
  const r = assessReadiness(wornBike, { eventImportance: 0.5 });
  assert.equal(r.ready, false);
  const parts = r.issues.map((i) => i.part);
  assert.ok(parts.includes('tires'));
  assert.ok(parts.includes('chain'));
  assert.equal(r.issues.find((i) => i.part === 'tires').severity, 'critical');
  assert.equal(r.worstLife, 15);
});

test('#222 an important event raises the readiness bar', () => {
  const local = assessReadiness({ condition: 100, parts: { tires: 50 } }, { eventImportance: 0.2 });
  const national = assessReadiness({ condition: 100, parts: { tires: 50 } }, { eventImportance: 1.0 });
  assert.equal(local.ready, true);
  assert.equal(national.ready, false);
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
  assert.ok(d.cost > base);
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
  const mild = { condition: 100, parts: { tires: 100, topEnd: 35, chain: 100, brakes: 100 } };
  const r = assessReadiness(mild, { eventImportance: 0.2 });
  assert.equal(r.ready, false);
  const d = parentRepairDecision({ budget: 300, stress: 40, eventImportance: 0.2, readiness: r, mechanicSkill: 60 });
  assert.equal(d.approve, false);
  assert.equal(d.channel, 'skip');
});

test('#222 approved repair refreshes exactly the worn parts', () => {
  const r = assessReadiness(wornBike, { eventImportance: 0.8 });
  const d = parentRepairDecision({ budget: 3000, eventImportance: 0.8, readiness: r, mechanicSkill: 70 });
  const applied = applyRepair(r, d);
  assert.deepEqual(applied.repaired.sort(), r.issues.map((i) => i.part).sort());
  assert.ok(applied.spent > 0);
});

test('#285 dealer procurement creates compatible part orders and returns deliveries to the garage shelf', () => {
  const readiness = assessReadiness(wornBike, { eventImportance: 0.8 });
  const decision = { approve: true, channel: 'dealer', cost: 105 };
  const plan = parentProcurementPlan({
    readiness,
    decision,
    bike: wornBike,
    dealerListings: [
      { id: 'tire-expensive', part: 'tires', price: 90, name: 'OEM tire set', fitsClasses: ['85cc'] },
      { id: 'tire-cheap', assetId: 'dealer-tires-1', part: 'tires', price: 70, name: 'OEM tire set sale', fitsClasses: ['85cc'] },
      { id: 'chain-1', assetId: 'dealer-chain-1', part: 'chain', price: 45, name: 'OEM chain', fitsClasses: ['85cc'] },
      { id: 'wrong-class', part: 'chain', price: 1, name: 'Wrong chain', fitsClasses: ['250cc'] },
    ],
  });
  assert.equal(plan.unresolved.length, 0);
  assert.equal(plan.orders.length, 2);
  assert.equal(plan.orders.find((o) => o.part === 'tires').listingId, 'tire-cheap');
  const received = receiveParentProcurement(plan);
  assert.equal(received.garageParts.length, 2);
  assert.ok(received.garageParts.every((p) => p.location === 'shelf' && p.installed === false));
  assert.ok(received.garageParts.every((p) => p.acquiredVia === 'dealer'));
});

test('#285 used procurement leaves unavailable issues unresolved instead of inventing a part', () => {
  const readiness = { ready: false, issues: [
    { part: 'tires', life: 10, severity: 'critical' },
    { part: 'chain', life: 20, severity: 'worn' },
  ] };
  const plan = parentProcurementPlan({
    readiness,
    decision: { approve: true, channel: 'used', cost: 105 },
    bike: wornBike,
    usedListings: [{ id: 'used-tires', part: 'tires', price: 35, name: 'Used tire set', fitsClasses: ['85cc'] }],
  });
  assert.equal(plan.orders.length, 1);
  assert.equal(plan.orders[0].channel, 'used');
  assert.deepEqual(plan.unresolved.map((i) => i.part), ['chain']);
});

test('#285 shop procurement creates a service order, while skipped prep creates none', () => {
  const readiness = { ready: false, issues: [{ part: 'topEnd', life: 12, severity: 'critical' }] };
  const shop = parentProcurementPlan({ readiness, decision: { approve: true, channel: 'shop', cost: 312 } });
  assert.equal(shop.orders.length, 1);
  assert.equal(shop.orders[0].type, 'service');
  assert.deepEqual(shop.orders[0].issues, ['topEnd']);
  assert.equal(receiveParentProcurement(shop).services.length, 1);

  const skipped = parentProcurementPlan({ readiness, decision: { approve: false, channel: 'skip', cost: 240 } });
  assert.equal(skipped.orders.length, 0);
  assert.equal(skipped.unresolved.length, 1);
});
