// Bike Builder & Class Transition
// -------------------------------
// A bike is more than loose upgrades. This module validates class-fit,
// recommends required class moves, and applies build parts as structured
// changes with compatibility and budget checks.

import { BIKE_FOR_CLASS, ELIGIBLE_CLASSES } from '../data/content.js';
import { checkFit } from './compatibility.js';

export const BUILD_SLOTS = ['engine', 'suspension', 'wheels', 'controls', 'protection', 'cosmetic'];

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
  };
}

export function createBikeForClass(klass, year) {
  return BIKE_FOR_CLASS(klass, year);
}

export function buildPlan(bike, installed = []) {
  const slots = Object.fromEntries(BUILD_SLOTS.map((s) => [s, null]));
  for (const part of installed) {
    const slot = part.slot ?? slotForCategory(part.category);
    if (slots[slot] !== undefined) slots[slot] = part;
  }
  const score = Object.values(slots).reduce((sum, part) => {
    if (!part) return sum;
    return sum + (part.performance ?? 0) + (part.reliability ?? 0) + (part.handling ?? 0);
  }, Math.round((bike.performance + bike.handling + bike.reliability) / 10));
  return { bikeId: bike.assetId, klass: bike.klass, slots, score };
}

export function canInstallPart(bike, part, opts = {}) {
  const fit = checkFit(bike, part, opts);
  const slot = part.slot ?? slotForCategory(part.category);
  const allowed = fit.status === 'direct' || fit.status === 'modify';
  return { allowed, slot, fitment: fit.status, note: fit.note };
}

export function installPart(bike, part, opts = {}) {
  const verdict = canInstallPart(bike, part, opts);
  if (!verdict.allowed) return { ok: false, reason: verdict.note, verdict };
  if (!bike.build) bike.build = {};
  bike.build[verdict.slot] = { ...part, fitment: verdict.fitment };
  if (part.performance) bike.performance = Math.max(0, Math.min(100, bike.performance + part.performance));
  if (part.handling) bike.handling = Math.max(0, Math.min(100, bike.handling + part.handling));
  if (part.reliability) bike.reliability = Math.max(0, Math.min(100, bike.reliability + part.reliability));
  if (!bike.installed) bike.installed = [];
  bike.installed.push(part.label ?? part.name ?? part.id);
  return { ok: true, slot: verdict.slot, bike };
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

function slotForCategory(category) {
  if (['topEnd', 'piston', 'exhaust', 'carb'].includes(category)) return 'engine';
  if (['fork', 'shock', 'linkage', 'suspension'].includes(category)) return 'suspension';
  if (['tires', 'rims', 'hubs'].includes(category)) return 'wheels';
  if (['brakes', 'levers', 'bars', 'chain', 'sprocket'].includes(category)) return 'controls';
  if (['helmet', 'boots', 'goggles', 'chest'].includes(category)) return 'protection';
  return 'cosmetic';
}
