import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BIKE_FOR_CLASS } from '../src/data/content.js';
import {
  buildPlan, canInstallPart, installPart, installFromGarage, removePart, removeToGarage,
  needsClassBike, recomputeBikeBuild,
} from '../src/systems/bikeBuilder.js';

test('#98 bike builder uses real mutually-exclusive component slots', () => {
  const bike = BIKE_FOR_CLASS('85cc', 2026);
  const plan = buildPlan(bike, [
    { id: 'pipe', label: 'Pipe', category: 'exhaust', performance: 5 },
    { id: 'piston', label: 'Piston', category: 'topEnd', reliability: 2 },
  ]);
  assert.equal(plan.klass, '85cc');
  assert.equal(plan.slots.exhaust.id, 'pipe');
  assert.equal(plan.slots.topEnd.id, 'piston');
  assert.ok(plan.score > 0);
});

test('#98 install validates fitment and applies derived structured changes', () => {
  const bike = BIKE_FOR_CLASS('85cc', 2026);
  const part = { id: 'forks', label: 'Factory forks', category: 'fork', fitsClasses: ['85cc'], handling: 8 };
  const verdict = canInstallPart(bike, part);
  assert.equal(verdict.allowed, true);
  const before = bike.handling;
  const result = installPart(bike, part);
  assert.equal(result.ok, true);
  assert.equal(bike.build.forks.id, 'forks');
  assert.equal(bike.handling, before + 8);
  assert.equal(result.removedPart, null);
});

test('installing a second exhaust replaces the first instead of stacking both', () => {
  const bike = BIKE_FOR_CLASS('85cc', 2026);
  const base = bike.performance;
  const first = { id: 'pipe-a', label: 'Pipe A', category: 'exhaust', fitsClasses: ['85cc'], performance: 4 };
  const second = { id: 'pipe-b', label: 'Pipe B', category: 'exhaust', fitsClasses: ['85cc'], performance: 7 };
  installPart(bike, first);
  assert.equal(bike.performance, base + 4);
  const replaced = installPart(bike, second);
  assert.equal(replaced.removedPart.id, 'pipe-a');
  assert.equal(bike.build.exhaust.id, 'pipe-b');
  assert.equal(bike.performance, base + 7);
  assert.equal(bike.installed.filter((x) => /Pipe/.test(x)).length, 1);
});

test('garage install swaps the old component back onto the shelf', () => {
  const bike = BIKE_FOR_CLASS('85cc', 2026);
  installPart(bike, { assetId: 'old', id: 'old', label: 'Old pipe', category: 'exhaust', fitsClasses: ['85cc'], performance: 2 });
  const inventory = [{ assetId: 'new', id: 'new', label: 'New pipe', category: 'exhaust', fitsClasses: ['85cc'], performance: 6, location: 'shelf' }];
  const result = installFromGarage({ bike, inventory, assetId: 'new' });
  assert.equal(result.ok, true);
  assert.equal(result.bike.build.exhaust.assetId, 'new');
  assert.equal(result.inventory.length, 1);
  assert.equal(result.inventory[0].assetId, 'old');
  assert.equal(result.inventory[0].location, 'shelf');
});

test('removing a part restores bike stats and returns it to garage inventory', () => {
  const bike = BIKE_FOR_CLASS('85cc', 2026);
  const base = bike.handling;
  installPart(bike, { assetId: 'shock1', id: 'shock1', label: 'Shock', category: 'shock', fitsClasses: ['85cc'], handling: 5 });
  assert.equal(bike.handling, base + 5);
  const removed = removeToGarage({ bike, inventory: [], slot: 'shock' });
  assert.equal(removed.ok, true);
  assert.equal(bike.handling, base);
  assert.equal(removed.inventory[0].assetId, 'shock1');
  assert.equal(bike.build.shock, null);
});

test('recompute never permanently stacks already-installed bonuses', () => {
  const bike = BIKE_FOR_CLASS('85cc', 2026);
  installPart(bike, { id: 'pipe', label: 'Pipe', category: 'exhaust', fitsClasses: ['85cc'], performance: 5 });
  const once = bike.performance;
  recomputeBikeBuild(bike);
  recomputeBikeBuild(bike);
  assert.equal(bike.performance, once);
});

test('#100 class transition requires the correct class bike', () => {
  const oldBike = BIKE_FOR_CLASS('65cc', 2024);
  const status = needsClassBike({ age: 12, currentClass: '65cc', ownedBikes: [oldBike] });
  assert.equal(status.targetClass, '85cc');
  assert.equal(status.mustMove, true);
  assert.equal(status.requiresPurchase, true);
  assert.ok(status.acquisitionOptions.includes('new'));
  assert.ok(status.acquisitionOptions.includes('used'));
  const nextBike = BIKE_FOR_CLASS('85cc', 2025);
  const withBike = needsClassBike({ age: 12, currentClass: '65cc', ownedBikes: [oldBike, nextBike] });
  assert.equal(withBike.requiresPurchase, false);
  assert.deepEqual(withBike.acquisitionOptions, []);
});

test('removePart safely rejects an empty component slot', () => {
  const bike = BIKE_FOR_CLASS('85cc', 2026);
  assert.equal(removePart(bike, 'exhaust').ok, false);
});
