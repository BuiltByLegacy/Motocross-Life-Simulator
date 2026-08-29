import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SUPPORT_TIERS, createSupportInfrastructure, restoreSupportInfrastructure, supportEffects,
  supportAdjustedMaintenance, supportAdjustedTravelPrep, supportAdjustedTrainingQuality,
  opportunitySupportValue, transitionSupport, familyLaborSupport,
} from '../src/systems/supportInfrastructure.js';

test('support ladder spans family through factory with increasing infrastructure', () => {
  const ids = ['family', 'privateer', 'satellite', 'development', 'factory'];
  assert.deepEqual(Object.keys(SUPPORT_TIERS), ids);
  const scores = ids.map((id) => opportunitySupportValue(createSupportInfrastructure(id)).score);
  for (let i = 1; i < scores.length; i += 1) assert.ok(scores[i] > scores[i - 1]);
});

test('infrastructure creates preparation capacity but never a flat speed bonus', () => {
  const factory = supportEffects(createSupportInfrastructure('factory'));
  const family = supportEffects(createSupportInfrastructure('family'));
  assert.ok(factory.maintenanceTimeRelief > family.maintenanceTimeRelief);
  assert.ok(factory.logisticsTimeRelief > family.logisticsTimeRelief);
  assert.ok(factory.setupSupport > family.setupSupport);
  assert.equal(factory.speedBonus, 0);
});

test('mechanic and logistics support reduce between-races time burden', () => {
  const service = { time: 2, cost: 65 };
  const booking = { time: 2, cost: 80 };
  assert.ok(supportAdjustedMaintenance(service, createSupportInfrastructure('factory')).time < supportAdjustedMaintenance(service, createSupportInfrastructure('family')).time);
  assert.ok(supportAdjustedTravelPrep(booking, createSupportInfrastructure('factory')).time < supportAdjustedTravelPrep(booking, createSupportInfrastructure('family')).time);
});

test('training-base support improves session quality rather than base rider speed', () => {
  const base = supportAdjustedTrainingQuality(1, createSupportInfrastructure('family'));
  const development = supportAdjustedTrainingQuality(1, createSupportInfrastructure('development'));
  assert.ok(development > base);
  assert.ok(development < 1.3);
});

test('opportunity value can weight the support a rider actually needs', () => {
  const logisticsHeavy = createSupportInfrastructure('satellite', { logistics: 90, testing: 20 });
  const testHeavy = createSupportInfrastructure('satellite', { logistics: 20, testing: 90 });
  const needs = { logistics: 4, testing: 0.5 };
  assert.ok(opportunitySupportValue(logisticsHeavy, { riderNeeds: needs }).score > opportunitySupportValue(testHeavy, { riderNeeds: needs }).score);
});

test('team changes can create a temporary infrastructure gap without changing talent', () => {
  const move = transitionSupport(createSupportInfrastructure('factory'), 'development', { gapWeeks: 2 });
  assert.equal(move.previous.tier, 'factory');
  assert.equal(move.next.tier, 'development');
  assert.equal(move.transition.temporaryLoss, true);
  assert.equal(move.transition.gapState.tier, 'family');
});

test('family labor remains a meaningful youth support model and state restores safely', () => {
  const family = familyLaborSupport({ guardianMechanical: 90, familyTravelCapacity: 80, homeTrackAccess: true });
  assert.equal(family.tier, 'family');
  assert.ok(family.mechanic > SUPPORT_TIERS.family.mechanic);
  assert.ok(family.trainingBase > SUPPORT_TIERS.family.trainingBase);
  assert.deepEqual(restoreSupportInfrastructure(JSON.parse(JSON.stringify(family))), family);
});
