// Season Flow Safety (issues #225, #226)
// --------------------------------------------------------------------------
// Guarantees the player can never get stuck. Editing the schedule mid-season,
// emptying it, missing a deadline, or having an un-ready bike must always leave
// a valid, playable next action ("Go Racing" never silently disappears).
// Pure and deterministic so it can be regression-tested.

export const SEASON_FLOW_STATES = [
  'setup',            // program not yet built
  'active',           // season running, has upcoming events
  'event_ready',      // an event this week, bike/rider ready to go race
  'event_blocked',    // an event this week but something blocks racing (repair/approval)
  'between_events',   // no event this week, future events remain
  'empty_schedule',   // no upcoming events at all — must recover
  'season_over',      // past the final week
];

// Edit outcomes for a mid-season schedule change (#225).
export const EDIT_RESULTS = ['applied', 'blocked_past', 'blocked_current', 'blocked_deadline', 'needs_approval', 'conflict'];

// Decide the flow state and the always-non-empty action list for a season.
//   ctx: { week, totalWeeks, programSet, events, currentEventInProgress,
//          raceReady, needsApproval }
//   events: upcoming committed events as [{ week, name, id, deadlineWeek }]
export function seasonFlowState(ctx = {}) {
  const {
    week = 1, totalWeeks = 12, programSet = false, events = [],
    currentEventInProgress = false, raceReady = true, needsApproval = false,
  } = ctx;

  if (week > totalWeeks) return finalize('season_over', [action('recap', 'See season recap')]);
  if (!programSet) return finalize('setup', [action('build_program', 'Build your race program'), restAction(), advanceAction()]);

  const upcoming = events.filter((e) => e.week >= week).sort((a, b) => a.week - b.week);
  const thisWeekEvent = upcoming.find((e) => e.week === week) ?? null;

  if (thisWeekEvent) {
    if (currentEventInProgress) {
      return finalize('event_ready', [action('continue_event', `Continue ${thisWeekEvent.name}`)]);
    }
    if (needsApproval) {
      return finalize('event_blocked', [
        action('request_approval', 'Ask a parent to approve racing'),
        action('practice', 'Practice instead'), restAction(),
      ], thisWeekEvent);
    }
    if (!raceReady) {
      return finalize('event_blocked', [
        action('repair_bike', 'Repair the bike before racing'),
        action('race_anyway', 'Race anyway (risky)'),
        action('skip_event', 'Skip this event'),
        action('practice', 'Practice instead'),
      ], thisWeekEvent);
    }
    return finalize('event_ready', [
      action('go_racing', `Go racing: ${thisWeekEvent.name}`),
      action('skip_event', 'Skip this event'),
    ], thisWeekEvent);
  }

  // No event this week.
  if (upcoming.length === 0) {
    // The critical anti-stuck case: nothing left on the calendar.
    return finalize('empty_schedule', recoveryActions());
  }
  const next = upcoming[0];
  return finalize('between_events', [
    action('advance_to_next', `Go to next event: ${next.name} (wk ${next.week})`),
    action('practice', 'Practice this week'),
    restAction(), advanceAction(),
    action('add_event', 'Add an event'),
  ], next);
}

// The player is never stuck: recovery always offers add / practice / rest / advance.
export function recoveryActions() {
  return [
    action('add_event', 'Add an event to your season'),
    action('practice', 'Practice this week'),
    restAction(),
    action('advance_time', 'Advance time'),
    action('end_season', 'End the season early'),
  ];
}

function action(id, label) { return { id, label }; }
function restAction() { return action('rest', 'Rest and recover'); }
function advanceAction() { return action('advance', 'Advance to next week'); }

// Always guarantee at least one valid action (defensive backstop for #225).
function finalize(state, actions, focusEvent = null) {
  const safe = Array.isArray(actions) && actions.length ? actions : recoveryActions();
  return { state, actions: safe, focusEvent, canRace: safe.some((a) => a.id === 'go_racing' || a.id === 'continue_event') };
}

// ---- #225 mid-season edit guard -----------------------------------------
// Validate a single schedule edit against the current week and event states.
//   edit: { type: 'add'|'remove'|'change', event: { week, id, name, deadlineWeek } }
//   ctx:  { week, currentEventWeek, currentInProgress, needsApproval }
export function guardEdit(edit, ctx = {}) {
  const { week = 1, currentInProgress = false, needsApproval = false } = ctx;
  const ev = edit.event ?? {};
  const targetWeek = ev.week ?? week;

  // Past events are locked.
  if (targetWeek < week) return { result: 'blocked_past', message: 'That event is in the past and is locked.' };
  // The current event cannot be invalidated while in progress.
  if (targetWeek === week && currentInProgress && (edit.type === 'remove' || edit.type === 'change')) {
    return { result: 'blocked_current', message: 'You can’t change an event that’s already underway.' };
  }
  // Adding/keeping a future event past its registration deadline is not allowed.
  if (edit.type === 'add' && ev.deadlineWeek != null && week > ev.deadlineWeek) {
    return { result: 'blocked_deadline', message: 'Registration for that event has closed.' };
  }
  // Youth riders need parent approval to commit changes.
  if (needsApproval) return { result: 'needs_approval', message: 'A parent needs to approve this change.' };
  return { result: 'applied', message: 'Change applied.' };
}

// After edits, recompute the flow so "Go to next event" / "Go Racing" is always
// correct and present. Never returns an empty action set (#225).
export function recomputeAfterEdit(ctx = {}) {
  const flow = seasonFlowState(ctx);
  return { ...flow, recomputed: true };
}

// Mark events whose registration deadline has passed as unavailable (#225).
export function pruneExpiredEvents(events = [], week = 1) {
  const kept = [];
  const expired = [];
  for (const e of events) {
    if (e.week < week) { kept.push(e); continue; } // past events stay as history
    if (e.deadlineWeek != null && week > e.deadlineWeek) expired.push({ ...e, unavailable: true });
    else kept.push(e);
  }
  return { kept, expired };
}
