// Bike Builder & Class Transition
// --------------------------------
// A bike is a structured assembly of mutually-exclusive component slots. New
// parts replace the previous component in that slot; removed parts can return to
// garage inventory. Bike stats are always derived from the base bike plus the
// currently-installed components so repeatedly swapping parts never stacks
// permanent bonuses.

import { BIKE_FOR_CLASS, ELIGIBLE_CLASSES } from '../data/content.js';
import { checkFit } from './compatibility.js';

export const BUILD_SLOTS = [
  'topEnd', 'exhaust', 'fueling', 'forks', 'shock', 'frontWheel', 'rearWheel',
  'frontTire', 'rearTire', 'handlebars', 'controls', 'brakes', 'clutch',
  'chainSprockets', 'protection', 'cosmetic',
];

export function needsClassBike({ age, currentClass, ownedBikes = [] } = {}) {
  const eligible = ELIGIBLE_CLASSES(age);
  const targetClass = eligible.includes(currentClass) ? currentClass : eligible[0] ?? currentClass;
  const hasBike = ownedBikes.some((b) => b.klass === targetClass && b.role !== 'sold');
  return {
    age,
    eligibleClasses: eligible,
    currentClass,
    targetClass,
    mustMove: targetClass !== currentClass,
    hasBike,
    requiresPurchase: !hasBike,
    acquisitionOptions: hasBike ? [] : ['new', 'used', 'borrowed', 'team_supplied'],
  };
}

export function createBikeForClass(klass, year) {
  const bike = BIKE_FOR_CLASS(klass, year);
  ensureBuildState(bike);
  return bike;
}

export function buildPlan(bike, installed = []) {
  const slots = Object.fromEntries(BUILD_SLOTS.map((s) => [s, null]));
  const source = installed.length ? installed : Object.values(bike?.build ?? {}).filter(Boolean);
  for (const part of source) {
    const slot = part.slot ?? slotForCategory(part.category);
    if (slot && slots[slot] !== undefined) slots[slot] = part;
  }
  return {
    bikeId: bike.assetId,
    klass: bike.klass,
    slots,
    score: Object.values(slots).reduce((sum, part) => sum + partScore(part), Math.round((baseOf(bike, 'performance') + baseOf(bike, 'handling') + baseOf(bike, 'reliability')) / 10)),
  };
}

export function canInstallPart(bike, part, opts = {}) {
  const fit = checkFit(bike, part, opts);
  const slot = part.slot ?? slotForCategory(part.category);
  const allowed = !!slot && BUILD_SLOTS.includes(slot) && (fit.status === 'direct' || fit.status === 'modify');
  return { allowed, slot, fitment: fit.status, note: slot ? fit.note : 'Unknown component slot.' };
}

export function installPart(bike, part, opts = {}) {
  const verdict = canInstallPart(bike, part, opts);
  if (!verdict.allowed) return { ok: false, reason: verdict.note, verdict, bike };

  ensureBuildState(bike);
  const removedPart = bike.build[verdict.slot] ?? null;
  bike.build[verdict.slot] = { ...part, slot: verdict.slot, fitment: verdict.fitment, installed: true };
  recomputeBikeBuild(bike);

  return {
    ok: true,
    slot: verdict.slot,
    bike,
    installedPart: bike.build[verdict.slot],
    removedPart: removedPart ? { ...removedPart, installed: false } : null,
  };
}

export function removePart(bike, slotOrCategory) {
  ensureBuildState(bike);
  const slot = BUILD_SLOTS.includes(slotOrCategory) ? slotOrCategory : slotForCategory(slotOrCategory);
  if (!slot || !bike.build[slot]) return { ok: false, slot, bike, removedPart: null };
  const removedPart = { ...bike.build[slot], installed: false };
  bike.build[slot] = null;
  recomputeBikeBuild(bike);
  return { ok: true, slot, bike, removedPart };
}

export function installFromGarage({ bike, inventory = [], assetId, opts = {} } = {}) {
  const index = inventory.findIndex((p) => p.assetId === assetId || p.id === assetId);
  if (index < 0) return { ok: false, reason: 'Part is not in the garage.', bike, inventory };
  const part = inventory[index];
  const result = installPart(bike, part, opts);
  if (!result.ok) return { ...result, inventory };

  const nextInventory = inventory.slice();
  nextInventory.splice(index, 1);
  if (result.removedPart) nextInventory.push({ ...result.removedPart, location: 'shelf', installed: false });
  return { ...result, inventory: nextInventory };
}

export function removeToGarage({ bike, inventory = [], slot } = {}) {
  const result = removePart(bike, slot);
  if (!result.ok) return { ...result, inventory };
  return { ...result, inventory: [...inventory, { ...result.removedPart, location: 'shelf' }] };
}

export function recomputeBikeBuild(bike) {
  ensureBuildState(bike);
  let performance = bike.baseStats.performance;
  let handling = bike.baseStats.handling;
  let reliability = bike.baseStats.reliability;
  for (const part of Object.values(bike.build)) {
    if (!part) continue;
    performance += Number(part.performance ?? 0);
    handling += Number(part.handling ?? 0);
    reliability += Number(part.reliability ?? 0);
  }
  bike.performance = clamp100(performance);
  bike.handling = clamp100(handling);
  bike.reliability = clamp100(reliability);
  bike.installed = Object.values(bike.build).filter(Boolean).map((p) => p.label ?? p.name ?? p.id);
  return bike;
}

export function classTransitionMemory({ fromClass, toClass, boughtBike }) {
  return {
    type: 'object',
    title: `Moved Up to ${toClass}`,
    summary: boughtBike
      ? `The old ${fromClass} went into the garage and a ${toClass} bike became the next chapter.`
      : `The rider moved from ${fromClass} to ${toClass}, but still needs the right bike to race it.`,
    emotion: boughtBike ? ['nerves', 'pride'] : ['pressure', 'uncertainty'],
    tags: ['milestone', 'bike_builder', 'class_transition'],
    importance: boughtBike ? 72 : 62,
    force: true,
  };
}

function ensureBuildState(bike) {
  if (!bike.baseStats) {
    bike.baseStats = {
      performance: Number(bike.performance ?? 0),
      handling: Number(bike.handling ?? 0),
      reliability: Number(bike.reliability ?? 0),
    };
  }
  if (!bike.build) bike.build = Object.fromEntries(BUILD_SLOTS.map((s) => [s, null]));
  else for (const slot of BUILD_SLOTS) if (!(slot in bike.build)) bike.build[slot] = null;
  if (!Array.isArray(bike.installed)) bike.installed = [];
}

function baseOf(bike, key) {
  return bike.baseStats?.[key] ?? bike[key] ?? 0;
}

function partScore(part) {
  if (!part) return 0;
  return Number(part.performance ?? 0) + Number(part.reliability ?? 0) + Number(part.handling ?? 0);
}

function clamp100(n) { return Math.max(0, Math.min(100, Math.round(n))); }

function slotForCategory(category) {
  if (['topEnd', 'piston', 'engine'].includes(category)) return 'topEnd';
  if (category === 'exhaust') return 'exhaust';
  if (['carb', 'ecu', 'intake', 'fueling'].includes(category)) return 'fueling';
  if (['fork', 'forks'].includes(category)) return 'forks';
  if (['shock', 'linkage'].includes(category)) return 'shock';
  if (['frontWheel', 'frontRim', 'frontHub'].includes(category)) return 'frontWheel';
  if (['rearWheel', 'rearRim', 'rearHub'].includes(category)) return 'rearWheel';
  if (['frontTire'].includes(category)) return 'frontTire';
  if (['rearTire'].includes(category)) return 'rearTire';
  if (category === 'tires') return 'rearTire'; // legacy catalog compatibility
  if (['bars', 'handlebars'].includes(category)) return 'handlebars';
  if (['levers', 'controls'].includes(category)) return 'controls';
  if (['brakes', 'brakePads'].includes(category)) return 'brakes';
  if (category === 'clutch') return 'clutch';
  if (['chain', 'sprocket', 'sprockets', 'chainSprockets'].includes(category)) return 'chainSprockets';
  if (['helmet', 'boots', 'goggles', 'chest', 'protection'].includes(category)) return 'protection';
  if (['graphics', 'plastics', 'seat', 'cosmetic'].includes(category)) return 'cosmetic';
  return null;
}
