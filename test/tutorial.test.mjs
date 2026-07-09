import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  TUTORIAL_STEPS, makeTutorial, activeTutorialStep, advanceTutorial,
  skipTutorial, replayTutorial, isTutorialComplete,
} from '../src/systems/tutorial.js';

test('#243 a fresh career starts on the welcome step', () => {
  const p = makeTutorial();
  const s = activeTutorialStep(p, {});
  assert.equal(s.id, 'welcome');
  assert.equal(s.index, 0);
  assert.equal(s.total, TUTORIAL_STEPS.length);
});

test('#243 acknowledging an info step advances to the next milestone', () => {
  let p = makeTutorial();
  p = advanceTutorial(p, {}); // ack welcome
  const s = activeTutorialStep(p, {});
  assert.equal(s.id, 'plan');
});

test('#243 milestone steps auto-advance once the game reaches that state', () => {
  let p = makeTutorial();
  p = advanceTutorial(p, {}); // past welcome, now on plan
  assert.equal(activeTutorialStep(p, { programSet: false }).id, 'plan');
  // Committing the season satisfies the plan milestone without an extra tap.
  assert.equal(activeTutorialStep(p, { programSet: true }).id, 'launch');
  // Racing satisfies the launch milestone → next info step.
  assert.equal(activeTutorialStep(p, { programSet: true, hasRaced: true }).id, 'garage');
});

test('#243 the full flow completes after the last info step', () => {
  let p = makeTutorial();
  const ctx = { programSet: true, hasRaced: true };
  p = advanceTutorial(p, ctx); // welcome -> (plan & launch already satisfied) -> garage
  assert.equal(activeTutorialStep(p, ctx).id, 'garage');
  p = advanceTutorial(p, ctx); // garage -> save
  assert.equal(activeTutorialStep(p, ctx).id, 'save');
  p = advanceTutorial(p, ctx); // save -> done
  assert.equal(activeTutorialStep(p, ctx), null);
  assert.equal(isTutorialComplete(p, ctx), true);
});

test('#243 skip ends the tutorial immediately and is recoverable via replay', () => {
  let p = skipTutorial(makeTutorial());
  assert.equal(activeTutorialStep(p, {}), null);
  assert.equal(isTutorialComplete(p, {}), true);
  // Replay brings it back from the top (recover-if-you-skip requirement).
  p = replayTutorial();
  assert.equal(p.skipped, false);
  assert.equal(activeTutorialStep(p, {}).id, 'welcome');
});

test('#243 progress round-trips as plain data (persists in the save)', () => {
  let p = makeTutorial();
  p = advanceTutorial(p, {}); // on plan
  const clone = JSON.parse(JSON.stringify(p));
  assert.deepEqual(clone, p);
  assert.equal(activeTutorialStep(clone, { programSet: false }).id, 'plan');
});
