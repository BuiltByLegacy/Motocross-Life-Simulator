import test from 'node:test';
import assert from 'node:assert/strict';
import { createLifeEventState, generateLifeEvent, resolveLifeEvent, applyLifeEventEffects } from '../src/systems/lifeBetweenRacesEvents.js';

const ctx = { seasonNumber: 2, week: 18, family: true, familyStress: 52, rivalId: 'rival-7', recentFinish: 4, coachId: 'coach-1', bikeCondition: 48, shopId: 'shop-2', sponsorId: 's-1', sponsorSatisfaction: 55, reputation: 44, region: 'northeast', trainingLoad: 14 };

test('life events are deterministic from career context and seed', () => {
  const a = generateLifeEvent(createLifeEventState(), ctx, { seed: 991 });
  const b = generateLifeEvent(createLifeEventState(), ctx, { seed: 991 });
  assert.deepEqual(a.event, b.event);
  assert.ok(a.event?.choices?.length >= 2);
});

test('resolved events carry gameplay consequences and a memory hook', () => {
  const generated = generateLifeEvent(createLifeEventState(), ctx, { seed: 991 });
  const resolved = resolveLifeEvent(generated.state, generated.event, generated.event.choices[0].id);
  assert.equal(resolved.error, null);
  assert.equal(resolved.state.history.length, 1);
  assert.equal(resolved.outcome.memory.kind, 'life-between-races');
  assert.ok(Object.keys(resolved.outcome.effects).length > 0);
});

test('duplicate event spam is prevented within a season-quarter actor/type key', () => {
  const first = generateLifeEvent(createLifeEventState(), ctx, { seed: 991 });
  const done = resolveLifeEvent(first.state, first.event, first.event.choices[0].id);
  const again = generateLifeEvent(done.state, ctx, { seed: 991 });
  assert.notEqual(again.event?.key, first.event.key);
  const duplicate = resolveLifeEvent(done.state, first.event, first.event.choices[0].id);
  assert.equal(duplicate.error, 'already-resolved');
});

test('effect application changes relationships/stress/money/reputation without bypassing rules', () => {
  const target = { relationship: 50, stress: 50, reputation: 20, money: 200, sponsorSatisfaction: 50, bikeReadiness: 50 };
  const outcome = { effects: { relationship: 5, stress: -4, reputation: 3, money: -35, opportunity: 2, sponsorSatisfaction: 4, bikeReadiness: 8 } };
  const next = applyLifeEventEffects(target, outcome);
  assert.equal(next.relationship, 55);
  assert.equal(next.stress, 46);
  assert.equal(next.money, 165);
  assert.equal(next.reputation, 23);
  assert.equal(next.opportunitySignal, 2);
});
