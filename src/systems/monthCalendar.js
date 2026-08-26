// Month-Based Season Calendar (issue #224)
// --------------------------------------------------------------------------
// Motocross planning is seasonal and month-based. The game still uses week
// indices internally for deterministic simulation, but UI dates are mapped onto
// real calendar dates so month boundaries, year rollover, and event timing are
// represented honestly instead of assuming every month is four weeks long.

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DEFAULT_START_MONTH = 3; // April
const REGISTRATION_LEAD = 2;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function markersFor(entry) {
  const race = entry.race ?? null;
  const markers = [];
  let kind = 'off';
  if (race) {
    kind = (race.lorettaStage === 'area' || race.category === 'qualifier') ? 'qualifier'
      : race.lorettaStage === 'regional' ? 'regional'
      : race.lorettaStage === 'national' ? 'national'
      : race.kind === 'national' ? 'national'
      : race.kind === 'regional' ? 'regional' : 'race';
    markers.push(kind);
  } else if (entry.camp) {
    kind = 'camp';
    markers.push('camp');
  } else {
    markers.push('off');
  }
  return { kind, markers };
}

function isoDate(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function firstSaturdayOnOrAfter(year, monthIndex, day = 1) {
  const d = new Date(Date.UTC(year, monthIndex, day));
  const delta = (6 - d.getUTCDay() + 7) % 7;
  return new Date(d.getTime() + delta * MS_PER_DAY);
}

function parseSeasonStart({ seasonStartDate, year, startMonthIndex }) {
  if (seasonStartDate) {
    const d = new Date(`${seasonStartDate}T00:00:00Z`);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const y = year ?? new Date().getUTCFullYear();
  return firstSaturdayOnOrAfter(y, startMonthIndex, 1);
}

export function buildMonthCalendar(calendar = [], {
  startMonthIndex = DEFAULT_START_MONTH,
  currentWeek = 1,
  year = null,
  seasonStartDate = null,
} = {}) {
  const byWeek = new Map(calendar.map((c) => [c.week, c]));
  const seasonStart = parseSeasonStart({ seasonStartDate, year, startMonthIndex });

  const weeks = calendar
    .slice()
    .sort((a, b) => a.week - b.week)
    .map((c) => {
      const { kind, markers } = markersFor(c);
      const date = new Date(seasonStart.getTime() + Math.max(0, c.week - 1) * 7 * MS_PER_DAY);
      const upcoming = byWeek.get(c.week + REGISTRATION_LEAD);
      const deadline = upcoming && upcoming.race
        ? { forWeek: upcoming.week, forRace: upcoming.race.name, label: `Registration closes: ${upcoming.race.name}` }
        : null;
      if (deadline) markers.push('deadline');
      return {
        week: c.week,
        date: isoDate(date),
        dayOfMonth: date.getUTCDate(),
        monthIndex: date.getUTCMonth(),
        year: date.getUTCFullYear(),
        title: c.title,
        note: c.note ?? null,
        race: c.race ?? null,
        camp: !!c.camp,
        kind,
        markers,
        deadline,
        isNow: c.week === currentWeek,
        isPast: c.week < currentWeek,
      };
    });

  const months = [];
  for (const wk of weeks) {
    const key = `${wk.year}-${wk.monthIndex}`;
    let m = months.find((x) => x.key === key);
    if (!m) {
      m = {
        key,
        monthIndex: wk.monthIndex,
        year: wk.year,
        name: MONTH_NAMES[wk.monthIndex],
        label: `${MONTH_NAMES[wk.monthIndex]} ${wk.year}`,
        weeks: [],
      };
      months.push(m);
    }
    m.weeks.push(wk);
  }
  months.sort((a, b) => (a.year - b.year) || (a.monthIndex - b.monthIndex));

  const currentMonth = months.find((m) => m.weeks.some((w) => w.week === currentWeek)) ?? months[0] ?? null;
  const races = weeks.filter((w) => w.race);
  const deadlines = weeks.filter((w) => w.deadline).map((w) => ({ week: w.week, date: w.date, ...w.deadline }));

  return {
    seasonStartDate: isoDate(seasonStart),
    months,
    currentMonthIndex: currentMonth ? currentMonth.monthIndex : startMonthIndex,
    currentMonthKey: currentMonth?.key ?? null,
    summary: {
      totalRaces: races.length,
      qualifiers: races.filter((w) => w.kind === 'qualifier' || w.kind === 'regional' || w.kind === 'national').length,
      camps: weeks.filter((w) => w.camp).length,
      offWeekends: weeks.filter((w) => w.kind === 'off').length,
      upcomingDeadlines: deadlines.filter((d) => d.week >= currentWeek),
    },
  };
}

// Numeric input/output remains compatible with the existing UI. A string key
// ("YYYY-monthIndex") is also supported so year-spanning calendars can navigate
// without ambiguity when the UI adopts the stronger key.
export function adjacentMonth(monthCal, monthIndexOrKey, dir) {
  if (!monthCal?.months?.length) return monthIndexOrKey;
  const wantsKey = typeof monthIndexOrKey === 'string';
  const currentPos = monthCal.months.findIndex((m) => m.key === monthIndexOrKey || m.monthIndex === monthIndexOrKey);
  if (currentPos < 0) return wantsKey ? (monthCal.currentMonthKey ?? null) : monthCal.currentMonthIndex;
  const nextPos = currentPos + (dir >= 0 ? 1 : -1);
  const next = nextPos >= 0 && nextPos < monthCal.months.length ? monthCal.months[nextPos] : monthCal.months[currentPos];
  return wantsKey ? next.key : next.monthIndex;
}

export function monthByIndex(monthCal, monthIndexOrKey) {
  return monthCal.months.find((m) => m.key === monthIndexOrKey || m.monthIndex === monthIndexOrKey) ?? monthCal.months[0] ?? null;
}
