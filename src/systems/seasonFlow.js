// Season Flow Safety (issues #225, #226)
// --------------------------------------------------------------------------
// Guarantees the player can never get stuck. Editing the schedule mid-season,
// emptying it, missing a deadline, or having an un-ready bike must always leave
// a valid, playable next action ("Go Racing" never silently disappears).
// Pure and deterministic so it can be regression-tested.

export const SEASON_FLOW_STATES = [
  'setup',
  'active',
  'event_ready',
  'event_blocked',
  'between_events',
  'empty_schedule',
  'season_over',
];

export const EDIT_RESULTS = ['applied', 'blocked_past', 'blocked_current', 'blocked_deadline', 'needs_approval', 'conflict'];

// `needsApproval` means the rider is age-gated. `approvalGranted` means the
// current committed plan has actually been approved. If approvalGranted is
// omitted, this helper assumes approval is handled by the season commitment
// layer; the final Go Racing checklist remains the authoritative hard gate.
export function seasonFlowState(ctx = {}) {
  const {
    week = 1, totalWeeks = 12, programSet = false, events = [],
    currentEventInProgress = false, raceReady = true, needsApproval = false,
    approvalGranted = null,
  } = ctx;

  if (week > totalWeeks) return finalize('season_over', [action('recap', 'See season recap')]);
  if (!programSet) return finalize('setup', [action('build_program', 'Build your race program'), restAction(), advanceAction()]);

  const upcoming = events.filter((e) => e.week >= week && !e.unavailable).sort((a, b) => a.week - b.week);
  const thisWeekEvent = upcoming.find((e) => e.week === week) ?? null;

  if (thisWeekEvent) {
    if (currentEventInProgress) {
      return finalize('event_ready', [action('continue_event', `Continue ${thisWeekEvent.name}`)], thisWeekEvent);
    }
    // Age alone is not an outstanding approval request. The commitment layer
    // grants approval when the plan is locked. Only an explicit false blocks.
    if (needsApproval && approvalGranted === false) {
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

  if (upcoming.length === 0) return finalize('empty_schedule', recoveryActions());

  const next = upcoming[0];
  return finalize('between_events', [
    action('advance_to_next', `Go to next event: ${next.name} (wk ${next.week})`),
    action('practice', 'Practice this week'),
    restAction(), advanceAction(),
    action('add_event', 'Add an event'),
  ], next);
}

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

function finalize(state, actions, focusEvent = null) {
  const safe = Array.isArray(actions) && actions.length ? actions : recoveryActions();
  return { state, actions: safe, focusEvent, canRace: safe.some((a) => a.id === 'go_racing' || a.id === 'continue_event') };
}

export function guardEdit(edit, ctx = {}) {
  const { week = 1, currentInProgress = false, needsApproval = false } = ctx;
  const ev = edit.event ?? {};
  const targetWeek = ev.week ?? week;

  if (targetWeek < week) return { result: 'blocked_past', message: 'That event is in the past and is locked.' };
  if (targetWeek === week && currentInProgress && (edit.type === 'remove' || edit.type === 'change')) {
    return { result: 'blocked_current', message: 'You can’t change an event that’s already underway.' };
  }
  if (edit.type === 'add' && ev.deadlineWeek != null && week > ev.deadlineWeek) {
    return { result: 'blocked_deadline', message: 'Registration for that event has closed.' };
  }
  if (needsApproval) return { result: 'needs_approval', message: 'A parent needs to approve this change.' };
  return { result: 'applied', message: 'Change applied.' };
}

export function recomputeAfterEdit(ctx = {}) {
  const flow = seasonFlowState(ctx);
  return { ...flow, recomputed: true };
}

export function pruneExpiredEvents(events = [], week = 1) {
  const kept = [];
  const expired = [];
  for (const e of events) {
    if (e.week < week) { kept.push(e); continue; }
    if (e.deadlineWeek != null && week > e.deadlineWeek) expired.push({ ...e, unavailable: true });
    else kept.push(e);
  }
  return { kept, expired };
}
