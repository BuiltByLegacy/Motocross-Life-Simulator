import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NORTHEAST_PROFILE, createRegionalRuntime, validateRegionalProfile } from '../src/systems/regionalProfiles.js';
import {
  createSupportState,
  applyRelationshipEvent,
  supportBenefits,
  evaluateSponsorOffers,
  acceptSponsorOffer,
  resolveSponsorSeason,
  serializeSupportState,
  restoreSupportState,
} from '../src/systems/northeastSupportNetwork.js';
import {
  createWorldReactionState,
  recordWorldEvent,
  reactionOpportunityModifier,
  serializeWorldReactionState,
  restoreWorldReactionState,
} from '../src/systems/northeastWorldReactions.js';

test('#312 Northeast Depth Wave II persists relationships, sponsorship, recognition, and regional identity across seasons', () => {
  const profileCheck = validateRegionalProfile(NORTHEAST_PROFILE);
  assert.equal(profileCheck.ok, true, profileCheck.errors.join(', '));
  const runtime = createRegionalRuntime(NORTHEAST_PROFILE);
  assert.equal(runtime.isOpenMonth(1), false);
  assert.equal(runtime.isOpenMonth(6), true);

  let support = createSupportState();
  let world = createWorldReactionState();

  // Season 1: local results build dealer/team relationships and recognition.
  support = applyRelationshipEvent(support, { entityId: 'ne-dealer-riverbend', type: 'purchase', season: 1 }).state;
  support = applyRelationshipEvent(support, { entityId: 'ne-dealer-riverbend', type: 'win', season: 1 }).state;
  support = applyRelationshipEvent(support, { entityId: 'ne-team-granite', type: 'sportsmanship', season: 1 }).state;
  for (let i = 0; i < 6; i++) support = applyRelationshipEvent(support, { entityId: 'ne-team-granite', type: 'win', season: 1 }).state;
  assert.equal(supportBenefits(support, 'ne-team-granite').teamInviteEligible, true);

  world = recordWorldEvent(world, { type: 'win', eventId: 's1-riverbend', venueName: 'Riverbend MX', season: 1, hometown: true }, { localReputation: 68, age: 12 }).state;
  world = recordWorldEvent(world, { type: 'championship', eventId: 's1-title', season: 1, prestige: 'regional', hometown: true }, { localReputation: 78, age: 12 }).state;
  assert.ok(reactionOpportunityModifier(world).sponsorInterest > 0);

  // Sponsor becomes available because of real career history, not XP alone.
  const offers = evaluateSponsorOffers(support, { localReputation: 78, notableResults: 6, sportsmanship: 65, age: 12 });
  assert.ok(offers.length >= 2);
  support = acceptSponsorOffer(support, offers[0].id, { age: 12, guardianApproved: true, season: 1 }).state;

  // Save/reload between seasons.
  support = restoreSupportState(serializeSupportState(support));
  world = restoreWorldReactionState(serializeWorldReactionState(world));

  // Season 2: sponsor renewal and Loretta milestone create lasting reactions.
  let sponsor = resolveSponsorSeason(support, offers[0].id, { attendanceRate: 0.95, sportsmanship: 60, reputation: 82, season: 2 });
  assert.equal(sponsor.outcome, 'renewed');
  support = sponsor.state;
  world = recordWorldEvent(world, { type: 'loretta-qualified', eventId: 's2-loretta', season: 2, prestige: 'national', hometown: true }, { localReputation: 82, age: 13 }).state;
  const beforeConcern = reactionOpportunityModifier(world);
  assert.ok(beforeConcern.teamVisibility > 0);

  // Negative history changes later-world perception rather than being flavor-only.
  world = recordWorldEvent(world, { type: 'poor-conduct', eventId: 's2-conduct', season: 2, prestige: 'regional' }, { localReputation: 82, age: 13 }).state;
  const afterConcern = reactionOpportunityModifier(world);
  assert.ok(afterConcern.dealerTrust < beforeConcern.dealerTrust);

  // Multi-season history survives another reload.
  const restoredSupport = restoreSupportState(serializeSupportState(support));
  const restoredWorld = restoreWorldReactionState(serializeWorldReactionState(world));
  assert.ok(restoredSupport.relationships['ne-dealer-riverbend'].history.some((h) => h.season === 1));
  assert.ok(restoredSupport.sponsorships[offers[0].id].renewals >= 1);
  assert.ok(restoredWorld.reactions.some((r) => r.season === 1));
  assert.ok(restoredWorld.reactions.some((r) => r.season === 2));

  // Regional identity remains Northeast-specific instead of globalized.
  assert.equal(NORTHEAST_PROFILE.climate.type, 'four-season');
  assert.equal(NORTHEAST_PROFILE.eventCulture.cadence, 'weekend-club-and-regional');
  assert.equal(NORTHEAST_PROFILE.lorettaRouting.regionName, 'Northeast');
});
