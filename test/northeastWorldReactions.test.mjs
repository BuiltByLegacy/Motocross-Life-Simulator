import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createWorldReactionState,
  recordWorldEvent,
  latestRecognition,
  reactionOpportunityModifier,
  serializeWorldReactionState,
  restoreWorldReactionState,
} from '../src/systems/northeastWorldReactions.js';

test('#309 local recognition references real milestones and repeat history', () => {
  let state = createWorldReactionState();
  let out = recordWorldEvent(state, { type: 'win', eventId: 'r1', venueName: 'Riverbend MX', season: 1, hometown: true }, { localReputation: 60, age: 12 });
  state = out.state;
  assert.ok(out.reactions.length >= 2);
  out = recordWorldEvent(state, { type: 'championship', eventId: 'title-1', season: 1, hometown: true, prestige: 'regional' }, { localReputation: 75, age: 12 });
  assert.ok(out.reactions.some((r) => r.message.includes('Last time')));
});

test('#309 reactions scale with prestige and local reputation', () => {
  const low = recordWorldEvent(createWorldReactionState(), { type: 'win', eventId: 'low', season: 1, prestige: 'local' }, { localReputation: 10 });
  const high = recordWorldEvent(createWorldReactionState(), { type: 'loretta-qualified', eventId: 'high', season: 1, prestige: 'national' }, { localReputation: 85 });
  assert.ok(Math.max(...high.reactions.map((r) => r.intensity)) > Math.max(...low.reactions.map((r) => r.intensity)));
});

test('#310 duplicate reaction spam is prevented', () => {
  let state = createWorldReactionState();
  const event = { type: 'rivalry', eventId: 'rival-a', season: 1 };
  state = recordWorldEvent(state, event, { localReputation: 50 }).state;
  const count = state.reactions.length;
  state = recordWorldEvent(state, event, { localReputation: 50 }).state;
  assert.equal(state.reactions.length, count);
});

test('#310 reactions produce gameplay consequences beyond flavor text', () => {
  let state = createWorldReactionState();
  state = recordWorldEvent(state, { type: 'championship', eventId: 'champ', season: 1, prestige: 'regional', hometown: true }, { localReputation: 90 }).state;
  const mods = reactionOpportunityModifier(state);
  assert.ok(mods.sponsorInterest > 0);
  assert.ok(mods.teamVisibility > 0);
});

test('#310 reaction history persists across save/reload and seasons', () => {
  let state = createWorldReactionState();
  state = recordWorldEvent(state, { type: 'win', eventId: 's1', season: 1, hometown: true }, { localReputation: 70 }).state;
  state = restoreWorldReactionState(serializeWorldReactionState(state));
  state = recordWorldEvent(state, { type: 'poor-conduct', eventId: 's2', season: 2 }, { localReputation: 70 }).state;
  assert.ok(latestRecognition(state, { limit: 10 }).some((r) => r.season === 1));
  assert.ok(latestRecognition(state, { limit: 10 }).some((r) => r.season === 2));
  assert.ok(reactionOpportunityModifier(state).dealerTrust < reactionOpportunityModifier(recordWorldEvent(createWorldReactionState(), { type: 'win', eventId: 'clean', season: 1 }, { localReputation: 70 }).state).dealerTrust);
});
