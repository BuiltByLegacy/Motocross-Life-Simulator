// Calendar 2.0 — date-first living career timeline (#325, #326)
// Player-facing time uses real dates. Integer day offsets remain available only
// as deterministic implementation details for simulation and persistence.

const DAY_MS = 24 * 60 * 60 * 1000;

export const CALENDAR_EVENT_TYPES = [
  'race', 'qualifier', 'practice', 'training', 'travel', 'maintenance', 'rest',
  'family', 'school', 'work', 'sponsor', 'media', 'weather', 'open',
];

function asDate(value) {
  const d = value instanceof Date ? new Date(value.getTime()) : new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid calendar date: ${value}`);
  return d;
}

export function isoDate(value) {
  const d = asDate(value);
  return d.toISOString().slice(0, 10);
}

export function addDays(value, days) {
  const d = asDate(value);
  return isoDate(new Date(d.getTime() + days * DAY_MS));
}

export function daysBetween(a, b) {
  return Math.round((asDate(b).getTime() - asDate(a).getTime()) / DAY_MS);
}

export function dateRangeLabel(start, end = start, locale = 'en-US') {
  const a = asDate(start);
  const b = asDate(end);
  const sameMonth = a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth();
  const fmt = (d, opts) => new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...opts }).format(d);
  if (isoDate(a) === isoDate(b)) return fmt(a, { month: 'short', day: 'numeric', year: 'numeric' });
  if (sameMonth) return `${fmt(a, { month: 'short', day: 'numeric' })}–${fmt(b, { day: 'numeric', year: 'numeric' })}`;
  return `${fmt(a, { month: 'short', day: 'numeric' })}–${fmt(b, { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

let sequence = 0;
export function createCalendarEvent({
  id = null,
  startDate,
  endDate = startDate,
  type = 'open',
  title = '',
  status = 'available',
  location = null,
  championshipRound = null,
  meta = {},
} = {}) {
  if (!CALENDAR_EVENT_TYPES.includes(type)) throw new Error(`Unknown calendar event type: ${type}`);
  const start = isoDate(startDate);
  const end = isoDate(endDate);
  if (daysBetween(start, end) < 0) throw new Error('Calendar event endDate cannot precede startDate');
  return {
    id: id ?? `date_evt_${++sequence}`,
    startDate: start,
    endDate: end,
    type,
    title,
    status,
    location,
    championshipRound,
    meta: { ...meta },
  };
}

export class LivingCareerCalendar {
  constructor({ startDate = '2026-01-01', endDate = '2026-12-31', currentDate = startDate, events = [] } = {}) {
    this.startDate = isoDate(startDate);
    this.endDate = isoDate(endDate);
    this.currentDate = isoDate(currentDate);
    if (daysBetween(this.startDate, this.endDate) < 0) throw new Error('Calendar endDate must follow startDate');
    if (this.currentDate < this.startDate || this.currentDate > this.endDate) throw new Error('currentDate must be inside calendar range');
    this.events = new Map();
    events.forEach((event) => this.add(event));
  }

  add(eventOrProps) {
    const event = eventOrProps?.startDate && eventOrProps?.id ? { ...eventOrProps, meta: { ...(eventOrProps.meta ?? {}) } } : createCalendarEvent(eventOrProps);
    if (event.startDate < this.startDate || event.endDate > this.endDate) throw new Error('Calendar event falls outside timeline');
    this.events.set(event.id, event);
    return event;
  }

  remove(id) { return this.events.delete(id); }
  all() { return [...this.events.values()].sort((a, b) => a.startDate.localeCompare(b.startDate) || a.endDate.localeCompare(b.endDate)); }

  onDate(date) {
    const d = isoDate(date);
    return this.all().filter((event) => event.startDate <= d && event.endDate >= d);
  }

  range(startDate, endDate = startDate) {
    const start = isoDate(startDate);
    const end = isoDate(endDate);
    return this.all().filter((event) => event.startDate <= end && event.endDate >= start);
  }

  advanceTo(date) {
    const next = isoDate(date);
    if (next < this.currentDate) throw new Error('Calendar cannot advance backward');
    if (next > this.endDate) throw new Error('Calendar cannot advance past endDate');
    this.currentDate = next;
    return this.currentDate;
  }

  everyDate() {
    const count = daysBetween(this.startDate, this.endDate);
    return Array.from({ length: count + 1 }, (_, i) => addDays(this.startDate, i));
  }

  toJSON() {
    return { startDate: this.startDate, endDate: this.endDate, currentDate: this.currentDate, events: this.all() };
  }

  static fromJSON(data) { return new LivingCareerCalendar(data); }
}

export function buildAgendaView(calendar, { fromDate = calendar.currentDate, days = 42, includeEmpty = true } = {}) {
  const endDate = addDays(fromDate, Math.max(0, days - 1));
  const rows = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(fromDate, i);
    if (date > calendar.endDate) break;
    const events = calendar.onDate(date);
    if (includeEmpty || events.length) rows.push({ date, label: dateRangeLabel(date), events });
  }
  return { fromDate: isoDate(fromDate), endDate: endDate > calendar.endDate ? calendar.endDate : endDate, rows };
}

export function buildMonthView(calendar, year, monthIndex) {
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const last = new Date(Date.UTC(year, monthIndex + 1, 0));
  const firstIso = isoDate(first);
  const lastIso = isoDate(last);
  const cells = [];
  for (let d = first.getUTCDate(); d <= last.getUTCDate(); d++) {
    const date = isoDate(new Date(Date.UTC(year, monthIndex, d)));
    cells.push({
      date,
      day: d,
      weekday: new Date(`${date}T00:00:00Z`).getUTCDay(),
      isCurrent: date === calendar.currentDate,
      events: date < calendar.startDate || date > calendar.endDate ? [] : calendar.onDate(date),
    });
  }
  const label = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(first);
  return { key: `${year}-${String(monthIndex + 1).padStart(2, '0')}`, label, firstDate: firstIso, lastDate: lastIso, cells };
}

export function conflictPairs(calendar) {
  const events = calendar.all();
  const conflicts = [];
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i]; const b = events[j];
      if (a.startDate <= b.endDate && b.startDate <= a.endDate) conflicts.push([a.id, b.id]);
    }
  }
  return conflicts;
}
