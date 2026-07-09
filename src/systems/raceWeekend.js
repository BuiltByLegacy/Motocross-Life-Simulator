// Race Weekend Lifecycle
// ----------------------
// Converts a committed calendar race into a checked, explicit state machine.
// It keeps "Go Racing" from being an ambiguous calendar click.

export const RACE_WEEKEND_STATES = [
  'scheduled',
  'registration_pending',
  'registered',
  'travel_planned',
  'traveling',
  'arrived',
  'practice',
  'qualifying',
  'moto_1',
  'between_motos',
  'moto_2',
  'results',
  'post_race',
  'travel_home',
  'complete',
  'withdrawn',
  'dns',
  'medical_hold',
  'bike_not_cleared',
];

const NEXT = {
  scheduled: 'registration_pending',
  registration_pending: 'registered',
  registered: 'travel_planned',
  travel_planned: 'traveling',
  traveling: 'arrived',
  arrived: 'practice',
  practice: 'qualifying',
  qualifying: 'moto_1',
  moto_1: 'between_motos',
  between_motos: 'moto_2',
  moto_2: 'results',
  results: 'post_race',
  post_race: 'travel_home',
  travel_home: 'complete',
};

export function createRaceWeekend(event, { classes = [], state = 'scheduled' } = {}) {
  return {
    eventId: event.id ?? event.name,
    eventName: event.name ?? event.title,
    state,
    classes,
    registered: false,
    travelPlanned: false,
    entryPaid: false,
    history: [{ state, at: 0 }],
    warnings: [],
    blockers: [],
  };
}

export function readinessChecklist({
  event,
  rider,
  bike,
  family,
  classes = [],
  approval = null,
  currentDay = 0,
} = {}) {
  const blockers = [];
  const warnings = [];
  const fee = Math.round(35 * (event?.entryMult ?? 1));

  if (!event) blockers.push({ code: 'no_event', message: 'No race event selected.' });
  if (!classes.length) blockers.push({ code: 'no_class', message: 'No eligible class entered.' });
  if (!bike) blockers.push({ code: 'no_bike', message: 'No bike selected.' });
  if (bike && classes.length && !classes.includes(bike.klass)) {
    blockers.push({ code: 'bike_not_eligible', message: `${bike.klass} bike is not eligible for the entered class.` });
  }
  if (bike && bike.condition < 25) blockers.push({ code: 'bike_broken', message: 'Bike condition is too low to clear race tech.' });
  if (rider?.injury && rider.injury.weeksOut > 0 && rider.injury.severity !== 'minor') {
    blockers.push({ code: 'medical_hold', message: 'Rider is not medically cleared.' });
  }
  if (family && family.money < fee) blockers.push({ code: 'not_enough_money', message: `Need $${fee} entry fee.` });
  if (approval && ['denied', 'parent_decides'].includes(approval.result)) {
    blockers.push({ code: 'parent_approval', message: 'Parent approval is not complete.' });
  }

  if (bike && bike.condition < 55) warnings.push({ code: 'bike_worn', message: 'Bike maintenance is overdue.' });
  if (bike?.parts?.tires != null && bike.parts.tires < 45) warnings.push({ code: 'tires_worn', message: 'Tires are worn.' });
  if (rider?.fatigue > 65) warnings.push({ code: 'fatigue', message: 'Rider is carrying heavy fatigue.' });
  if (family?.stress > 70) warnings.push({ code: 'family_stress', message: 'Family stress is high.' });
  if (event?.deadlineDay != null && event.deadlineDay - currentDay <= 3) {
    warnings.push({ code: 'deadline_close', message: 'Registration deadline is close.' });
  }

  return { ok: blockers.length === 0, blockers, warnings, fee };
}

export function registerWeekend(weekend, readiness) {
  const next = { ...weekend, blockers: readiness.blockers, warnings: readiness.warnings };
  if (!readiness.ok) {
    next.state = readiness.blockers.some((b) => b.code === 'medical_hold') ? 'medical_hold'
      : readiness.blockers.some((b) => b.code === 'bike_broken' || b.code === 'bike_not_eligible') ? 'bike_not_cleared'
      : 'registration_pending';
    next.history = [...weekend.history, { state: next.state, at: weekend.history.length }];
    return next;
  }
  next.registered = true;
  next.entryPaid = true;
  next.state = 'registered';
  next.history = [...weekend.history, { state: 'registered', at: weekend.history.length }];
  return next;
}

export function advanceWeekend(weekend, event = {}) {
  const target = event.to ?? NEXT[weekend.state] ?? weekend.state;
  if (!RACE_WEEKEND_STATES.includes(target)) return weekend;
  return {
    ...weekend,
    state: target,
    history: [...weekend.history, { state: target, at: weekend.history.length, reason: event.reason ?? null }],
  };
}

export function withdrawalState(reason) {
  if (reason === 'injury') return 'medical_hold';
  if (reason === 'bike') return 'bike_not_cleared';
  if (reason === 'missed_start') return 'dns';
  return 'withdrawn';
}
