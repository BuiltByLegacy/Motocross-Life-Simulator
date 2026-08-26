import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  NORTHEAST_PROFILE,
  SOUTHEAST_PROFILE,
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

test('#318 Southeast regional profile passes the research gate', () => {
  const result = validateRegionalProfile(SOUTHEAST_PROFILE);
  assert.equal(result.ok, true, result.errors.join(', '));
  assert.deepEqual(SOUTHEAST_PROFILE.geography.states, ['NC', 'SC', 'GA', 'FL', 'AL', 'TN']);
  assert.ok(SOUTHEAST_PROFILE.research.sources.length >= 5);
  assert.equal(SOUTHEAST_PROFILE.lorettaRouting.regionName, 'Southeast');
  assert.equal(SOUTHEAST_PROFILE.lorettaRouting.reference2026.areaAdvanceGuaranteed, 9);
  assert.equal(SOUTHEAST_PROFILE.lorettaRouting.reference2026.regionalAdvanceGuaranteed, 6);
});

test('#318 Southeast behaves materially differently from Northeast', () => {
  const northeast = createRegionalRuntime(NORTHEAST_PROFILE);
  const southeast = createRegionalRuntime(SOUTHEAST_PROFILE);

  assert.equal(northeast.isOpenMonth(1), false);
  assert.equal(southeast.isOpenMonth(1), true);
  assert.notEqual(northeast.eventCadence(), southeast.eventCadence());
  assert.equal(northeast.travelBandForMiles(250), 'regional');
  assert.equal(southeast.travelBandForMiles(250), 'overnight');
  assert.equal(northeast.supportsSurface('red-clay'), false);
  assert.equal(southeast.supportsSurface('red-clay'), true);
  assert.notEqual(northeast.estimateEntryFee(40), southeast.estimateEntryFee(40));
});
