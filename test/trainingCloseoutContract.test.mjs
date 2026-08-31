import test from 'node:test';
import assert from 'node:assert/strict';
import { trainingHistorySummary } from '../src/systems/trainingHistory.js';

test('Training 2.0 closeout history is safe for empty legacy saves',()=>{
 const s=trainingHistorySummary(null,{seasonNumber:1});
 assert.equal(s.seasonCount,0);assert.equal(s.careerCount,0);assert.deepEqual(s.bySession,{});assert.equal(s.spend.outOfPocket,0);
});
