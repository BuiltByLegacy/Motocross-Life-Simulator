// First-Time Onboarding Tutorial (issue #243)
// --------------------------------------------------------------------------
// A lightweight, skippable coach that teaches the one thing the setup wizard
// can't: the *loop*. Plan a season, lock it in, launch a race weekend, mind
// the garage, and trust the autosave. Steps are either `info` (advance when the
// player acknowledges) or `milestone` (advance automatically once the game
// reaches the state the step describes). Progress is plain data so it rides
// along in the save file — a player who skips or half-finishes onboarding keeps
// that exactly across restarts (#242). Pure, deterministic, serializable.

export const TUTORIAL_STEPS = [
  {
    id: 'welcome', kind: 'info', icon: '🏁',
    title: 'Welcome to the season',
    body: 'This is your week hub — planning, prepping, racing, and living all flow from here. Take it one week at a time.',
    cta: 'Let’s go',
  },
  {
    id: 'plan', kind: 'milestone', icon: '📅',
    title: 'Build your race program',
    body: 'Pick which events to race this season, then lock it in. Nothing counts until the season is committed — plan freely first.',
    done: (c) => !!c.programSet,
  },
  {
    id: 'launch', kind: 'milestone', icon: '🏍️',
    title: 'Go Racing',
    body: 'On a race weekend, open Go Racing. Clear the checklist — bike ready, fees covered, rider healthy — then drop the gate.',
    done: (c) => !!c.hasRaced,
  },
  {
    id: 'garage', kind: 'info', icon: '🔧',
    title: 'Mind the garage',
    body: 'Racing wears the bike. Between rounds, prep it, order parts, and grow the shop from the Garage tab.',
    cta: 'Got it',
  },
  {
    id: 'save', kind: 'info', icon: '💾',
    title: 'Your story is saved',
    body: 'Progress autosaves as the weeks roll by. Leave whenever — pick your career back up with Continue.',
    cta: 'Finish',
  },
];

export function makeTutorial(step = 0, skipped = false) {
  return { step: Math.max(0, step | 0), skipped: !!skipped };
}

// The step the player should see right now, or null when onboarding is done or
// skipped. Milestone steps that are already satisfied are transparently skipped
// over so a returning/expert player is never nagged about what they've done.
//   ctx: { programSet, hasRaced }
export function activeTutorialStep(progress = makeTutorial(), ctx = {}) {
  if (!progress || progress.skipped) return null;
  let i = Math.max(0, progress.step | 0);
  while (i < TUTORIAL_STEPS.length) {
    const s = TUTORIAL_STEPS[i];
    if (s.kind === 'milestone' && s.done && s.done(ctx)) { i += 1; continue; }
    break;
  }
  if (i >= TUTORIAL_STEPS.length) return null;
  const s = TUTORIAL_STEPS[i];
  return { id: s.id, kind: s.kind, icon: s.icon, title: s.title, body: s.body, cta: s.cta ?? 'Next', index: i, total: TUTORIAL_STEPS.length };
}

// Acknowledge the current step and move past it. Milestone steps are normally
// advanced by reaching their condition, but this also works as a manual nudge.
export function advanceTutorial(progress = makeTutorial(), ctx = {}) {
  const active = activeTutorialStep(progress, ctx);
  if (!active) return { ...progress, step: TUTORIAL_STEPS.length };
  return { ...progress, step: active.index + 1 };
}

export function skipTutorial(progress = makeTutorial()) {
  return { ...progress, skipped: true };
}

export function replayTutorial() {
  return makeTutorial(0, false);
}

export function isTutorialComplete(progress = makeTutorial(), ctx = {}) {
  return activeTutorialStep(progress, ctx) === null;
}
