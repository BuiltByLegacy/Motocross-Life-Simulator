import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BIKE_FOR_CLASS } from '../src/data/content.js';
import { buildPlan, canInstallPart, installPart, needsClassBike } from '../src/systems/bikeBuilder.js';

test('#98 bike builder produces slotted build plan', () => {
  const bike = BIKE_FOR_CLASS('85cc', 2026);
  const plan = buildPlan(bike, [{ id: 'pipe', label: 'Pipe', category: 'exhaust', performance: 5 }]);
  assert.equal(plan.klass, '85cc');
  assert.equal(plan.slots.engine.id, 'pipe');
  assert.ok(plan.score > 0);
});

test('#98 install validates fitment and applies structured changes', () => {
  const bike = BIKE_FOR_CLASS('85cc', 2026);
  const part = { id: 'forks', label: 'Factory forks', category: 'fork', fitsClasses: ['85cc'], handling: 8 };
  const verdict = canInstallPart(bike, part);
  assert.equal(verdict.allowed, true);
  const before = bike.handling;
  const result = installPart(bike, part);
  assert.equal(result.ok, true);
  assert.equal(bike.build.suspension.id, 'forks');
  assert.equal(bike.handling, before + 8);
});

test('#100 class transition requires the correct class bike', () => {
  const oldBike = BIKE_FOR_CLASS('65cc', 2024);
  const status = needsClassBike({ age: 12, currentClass: '65cc', ownedBikes: [oldBike] });
  assert.equal(status.targetClass, '85cc');
  assert.equal(status.mustMove, true);
  assert.equal(status.requiresPurchase, true);
  const nextBike = BIKE_FOR_CLASS('85cc', 2025);
  const withBike = needsClassBike({ age: 12, currentClass: '65cc', ownedBikes: [oldBike, nextBike] });
  assert.equal(withBike.requiresPurchase, false);
});
