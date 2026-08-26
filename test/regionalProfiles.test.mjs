import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  NORTHEAST_PROFILE,
  SYNTHETIC_WARM_YEAR_ROUND_PROFILE,
  createRegionalRuntime,
  validateRegionalProfile,
} from '../src/systems/regionalProfiles.js';

test('#311 Northeast regional profile satisfies the research contract', () => {
  const result = validateRegionalProfile(NORTHEAST_PROFILE);
  assert.equal(result.ok, true, result.errors.join(', '));
  assert.ok(NORTHEAST_PROFILE.research.sources.length >= 1);
  assert.ok(NORTHEAST_PROFILE.geography.states.includes('CT'));
  assert.ok(NORTHEAST_PROFILE.lorettaRouting.regionName);
});

test('#311 incomplete future regions are rejected before implementation', () => {
  const result = validateRegionalProfile({ id: 'copy', name: 'Copy Region' });
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes('missing:climate'));
  assert.ok(result.errors.includes('missing:research.sources'));
});

test('#311 synthetic profiles can behave materially differently without cloning the engine', () => {
  const northeast = createRegionalRuntime(NORTHEAST_PROFILE);
  const warm = createRegionalRuntime(SYNTHETIC_WARM_YEAR_ROUND_PROFILE);

  assert.equal(northeast.isOpenMonth(1), false);
  assert.equal(warm.isOpenMonth(1), true);
  assert.notEqual(northeast.eventCadence(), warm.eventCadence());
  assert.notEqual(northeast.travelBandForMiles(100), warm.travelBandForMiles(100));
  assert.notEqual(northeast.estimateEntryFee(40), warm.estimateEntryFee(40));
  assert.equal(northeast.supportsSurface('hardpack'), true);
  assert.equal(warm.supportsSurface('hardpack'), false);
});
