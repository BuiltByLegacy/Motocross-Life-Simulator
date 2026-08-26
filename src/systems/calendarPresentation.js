// Calendar 2.0 player-facing presentation helpers (issue #326).
// Keep simulation week indices internal while presenting real Gregorian dates.

const DAY_MS = 24 * 60 * 60 * 1000;

function parseIso(iso) {
  return new Date(`${iso}T00:00:00Z`);
}

function fmtDate(d, { year = false } = {}) {
  return d.toLocaleDateString('en-US', {
    timeZone: 'UTC', month: 'short', day: 'numeric', ...(year ? { year: 'numeric' } : {}),
  });
}

export function dateRangeForWeek(monthCal, week) {
  const entry = monthCal?.months?.flatMap((m) => m.weeks).find((w) => w.week === week);
  if (!entry) return null;
  const start = parseIso(entry.date);
  const end = new Date(start.getTime() + 6 * DAY_MS);
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  const sameMonth = sameYear && start.getUTCMonth() === end.getUTCMonth();
  const startLabel = sameMonth
    ? start.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' })
    : fmtDate(start, { year: !sameYear });
  const endLabel = sameMonth
    ? String(end.getUTCDate())
    : fmtDate(end, { year: !sameYear });
  return {
    start: entry.date,
    end: `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, '0')}-${String(end.getUTCDate()).padStart(2, '0')}`,
    label: `${startLabel}–${endLabel}${sameYear ? `, ${start.getUTCFullYear()}` : ''}`,
  };
}

export function calendarAgenda(monthCal) {
  if (!monthCal) return [];
  return monthCal.months.flatMap((month) => month.weeks.map((entry) => ({
    ...entry,
    range: dateRangeForWeek(monthCal, entry.week),
    status: entry.isPast ? 'past' : entry.isNow ? 'current' : 'upcoming',
    eventLabel: entry.race?.name ?? (entry.camp ? entry.title ?? 'Training camp' : entry.title ?? 'Open / life week'),
  })));
}

export function calendarMonthRows(monthCal, monthKey = null) {
  const month = monthKey ? monthCal?.months?.find((m) => m.key === monthKey) : monthCal?.months?.find((m) => m.key === monthCal.currentMonthKey);
  if (!month) return { month: null, rows: [] };
  return {
    month,
    rows: month.weeks.map((entry) => ({ ...entry, range: dateRangeForWeek(monthCal, entry.week) })),
  };
}
