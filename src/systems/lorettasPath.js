// Road to Loretta's — the amateur motocross dream.
// --------------------------------------------------
// Authentic 2026 path:
//   Area Qualifier -> Regional Championship -> Loretta Lynn's National
//
// Riders may attempt as many Area Qualifiers, in as many regions, as they
// choose. Regional eligibility is earned in the SAME region as the Area
// advancement. National qualification is resolved from Regional results using
// the rider's home region first, then best finish, then first qualification.

import {
  LORETTA_REGIONS,
  advancementSlots,
  regionalMotoCount,
  basicAgeEligibility,
  isKnownLorettaRegion,
  selectNationalSourceRegion,
} from './lorettasRules2026.js';

export { LORETTA_REGIONS } from './lorettasRules2026.js';

export const LORETTA_STAGES = ['area', 'regional', 'national'];

// `advanceSlots` remains as a compatibility default for older callers; domain
// logic uses the region-specific 2026 rules module instead.
export const STAGE_INFO = {
  area: { key: 'area', label: 'Area Qualifier', short: 'Area', order: 0, next: 'regional', advanceSlots: 9, motos: 2, regionSpecific: true },
  regional: { key: 'regional', label: 'Regional Championship', short: 'Regional', order: 1, next: 'national', advanceSlots: 6, motos: 3, regionSpecific: true },
  national: { key: 'national', label: "Loretta Lynn's National", short: "Loretta's", order: 2, next: null, advanceSlots: 0, motos: 3 },
};

// The current game only exposes these simplified class names. The complete AMA
// class matrix belongs in event data; event.classes remains authoritative.
export const LORETTA_CLASSES = ['50cc', '65cc', '85cc', 'Supermini', '250B'];
export const DREAM_STATES = ['dormant', 'chasing', 'area_qualified', 'regional_qualified', 'national_qualified', 'eliminated'];

const STAGE_ORDER = { none: -1, area: 0, regional: 1, national: 2 };

export function classifyEvent(event) {
  if (!event) return null;
  if (event.lorettaStage && LORETTA_STAGES.includes(event.lorettaStage)) return event.lorettaStage;
  if (event.category === 'qualifier') return 'area';
  return null;
}

function blankClassRecord() {
  return {
    reached: 'none',
    region: null, // legacy/display compatibility: first successful Area region
    homeRegion: null,
    attempts: [],
    eliminated: false,
    dreamState: 'dormant',
    areaQualifiedRegions: [],
    regionalQualifications: [],
    selectedNationalRegion: null,
    bestNational: null,
  };
}

function uniquePush(list, value) {
  if (value != null && !list.includes(value)) list.push(value);
}

function hydrateRecord(rec = {}) {
  const out = { ...blankClassRecord(), ...rec };
  out.attempts = Array.isArray(out.attempts) ? out.attempts : [];
  out.areaQualifiedRegions = Array.isArray(out.areaQualifiedRegions) ? [...out.areaQualifiedRegions] : [];
  out.regionalQualifications = Array.isArray(out.regionalQualifications) ? [...out.regionalQualifications] : [];

  // Migrate saves created before multi-region qualifying was modeled.
  for (const a of out.attempts) {
    if (a.stage === 'area' && a.advanced && a.region) uniquePush(out.areaQualifiedRegions, a.region);
    if (a.stage === 'regional' && a.advanced && a.region && !out.regionalQualifications.some((q) => q.region === a.region && q.finish === a.finish)) {
      out.regionalQualifications.push({ region: a.region, finish: a.finish, day: a.day ?? null, qualified: true });
    }
  }
  if (!out.areaQualifiedRegions.length && out.region && STAGE_ORDER[out.reached] >= STAGE_ORDER.area) uniquePush(out.areaQualifiedRegions, out.region);
  if (!out.regionalQualifications.length && out.region && STAGE_ORDER[out.reached] >= STAGE_ORDER.regional) {
    out.regionalQualifications.push({ region: out.region, finish: null, day: null, qualified: true, migrated: true });
  }
  out.selectedNationalRegion = out.selectedNationalRegion
    ?? selectNationalSourceRegion(out.regionalQualifications, out.homeRegion);
  return out;
}

export class LorettasPath {
  constructor({ homeRegion = null } = {}) {
    this.homeRegion = homeRegion;
    this.byClass = {};
    this.milestones = [];
    this._seen = new Set();
  }

  _class(klass) {
    if (!this.byClass[klass]) this.byClass[klass] = blankClassRecord();
    this.byClass[klass] = hydrateRecord(this.byClass[klass]);
    if (!this.byClass[klass].homeRegion && this.homeRegion) this.byClass[klass].homeRegion = this.homeRegion;
    return this.byClass[klass];
  }

  eligibleToEnter(event, { klass, region, age, homeRegion } = {}) {
    const stage = classifyEvent(event);
    const reasons = [];
    if (!stage) return { ok: false, stage: null, reasons: ['Not a Loretta’s qualifying event.'] };

    if (klass && !LORETTA_CLASSES.includes(klass)) reasons.push(`${klass} isn’t an eligible Loretta’s class in the current game data.`);
    if (event.classes && klass && !event.classes.includes(klass)) reasons.push(`This ${STAGE_INFO[stage].label} doesn’t run a ${klass} class.`);

    const ageCheck = basicAgeEligibility({ klass, age });
    reasons.push(...ageCheck.reasons);

    const rec = klass ? this._class(klass) : null;
    if (rec && homeRegion && !rec.homeRegion) rec.homeRegion = homeRegion;
    const evRegion = event.region ?? region ?? null;

    if (stage !== 'national') {
      if (!evRegion) reasons.push(`${STAGE_INFO[stage].label} needs a region.`);
      else if (!isKnownLorettaRegion(evRegion)) reasons.push(`${evRegion} is not a recognized Loretta’s qualifying region.`);
    }

    // Area Qualifiers are intentionally NOT region-locked. Riders may chase as
    // many Area Qualifiers in as many regions as budget/calendar allow.
    if (stage === 'regional' && rec && evRegion && !rec.areaQualifiedRegions.includes(evRegion)) {
      reasons.push(`You must advance from an Area Qualifier in the ${evRegion} region before entering that Regional.`);
    }
    if (stage === 'national' && rec && rec.regionalQualifications.filter((q) => q.qualified).length === 0) {
      reasons.push('Loretta’s is invite-only — qualify through a Regional Championship first.');
    }

    return {
      ok: reasons.length === 0,
      stage,
      region: evRegion,
      reasons,
      transferSpots: stage === 'national' ? 0 : advancementSlots(stage, evRegion),
      motos: stage === 'regional' ? regionalMotoCount(evRegion) : STAGE_INFO[stage].motos,
    };
  }

  recordAttempt(event, { klass, region, finish, fieldSize = 30, day = null, eventName, homeRegion = null, numericFinish = true } = {}) {
    const stage = classifyEvent(event);
    if (!stage) return null;
    const rec = this._class(klass);
    if (homeRegion && !rec.homeRegion) rec.homeRegion = homeRegion;
    const evRegion = event.region ?? region ?? null;
    if (rec.dreamState === 'dormant') rec.dreamState = 'chasing';

    const slots = stage === 'national' ? 0 : advancementSlots(stage, evRegion);
    const advanced = stage !== 'national'
      && numericFinish !== false
      && finish != null
      && slots != null
      && finish <= slots;
    const name = eventName ?? event.name ?? STAGE_INFO[stage].label;
    const attempt = {
      stage, region: evRegion, klass, finish, fieldSize, day, eventName: name,
      advanced, numericFinish: numericFinish !== false, transferSpots: slots, season: null,
    };
    rec.attempts.push(attempt);

    const emitted = [];
    const fire = (key, once, descriptor) => {
      if (once && this._seen.has(key)) return;
      if (once) this._seen.add(key);
      const m = { key, stage, klass, region: evRegion, ...descriptor };
      this.milestones.push(m);
      emitted.push(m);
    };

    if (stage === 'area' && rec.attempts.filter((a) => a.stage === 'area').length === 1) {
      fire('first_area_attempt', true, {
        title: 'First Shot at the Dream', importance: 68,
        emotion: ['nerves', 'hope'], tags: ['first_time', 'lorettas', 'milestone'],
        summary: `Your first Area Qualifier — the first real step on the Road to Loretta’s at ${name}.`,
      });
    }

    if (advanced && stage === 'area') {
      uniquePush(rec.areaQualifiedRegions, evRegion);
      rec.reached = STAGE_ORDER[rec.reached] < STAGE_ORDER.area ? 'area' : rec.reached;
      rec.region ??= evRegion;
      rec.eliminated = false;
      rec.dreamState = 'area_qualified';
      fire('first_regional_qual', true, {
        title: 'Punched a Regional Ticket', importance: 80,
        emotion: ['pride', 'relief', 'joy'], tags: ['first_time', 'lorettas', 'regional', 'milestone'],
        summary: `You advanced from an Area Qualifier in the ${evRegion} region. That region’s Regional Championship is now available.`,
      });
    } else if (advanced && stage === 'regional') {
      const existing = rec.regionalQualifications.find((q) => q.region === evRegion);
      const qualification = { region: evRegion, finish, day, qualified: true };
      if (!existing) rec.regionalQualifications.push(qualification);
      else Object.assign(existing, qualification);
      rec.reached = 'regional';
      rec.eliminated = false;
      rec.dreamState = 'regional_qualified';
      rec.selectedNationalRegion = selectNationalSourceRegion(rec.regionalQualifications, rec.homeRegion);
      fire('first_national_qual', true, {
        title: "You're Going to the Ranch", importance: 94,
        emotion: ['joy', 'disbelief', 'pride'], tags: ['first_time', 'lorettas', 'national', 'championship', 'milestone'],
        summary: `You qualified for Loretta Lynn’s through the ${evRegion} Regional.`,
      });
    } else if (stage !== 'national') {
      rec.eliminated = true;
      if (finish === slots + 1) {
        fire(`missed_by_one_${stage}`, false, {
          title: 'One Spot Short', importance: 76,
          emotion: ['heartbreak', 'anger', 'resolve'], tags: ['lorettas', 'heartbreak', 'near_miss'],
          summary: `${ordinalish(finish)} at the ${STAGE_INFO[stage].label}. The guaranteed transfer ended at ${ordinalish(slots)}.`,
        });
      }
      if (rec.reached === 'none') rec.dreamState = 'eliminated';
    }

    if (stage === 'national') {
      rec.reached = 'national';
      rec.eliminated = false;
      rec.dreamState = 'national_qualified';
      fire('first_national_moto', true, {
        title: 'A Loretta’s Moto', importance: 88,
        emotion: ['awe', 'nerves', 'pride'], tags: ['first_time', 'lorettas', 'national', 'milestone'],
        summary: `You dropped the gate at Loretta Lynn’s${finish != null ? ` and finished ${ordinalish(finish)}` : ''}.`,
      });
      const prevBest = rec.bestNational ?? Infinity;
      if (finish != null && finish < prevBest) {
        rec.bestNational = finish;
        if (finish === 1) {
          fire('national_championship', true, {
            title: 'Loretta Lynn’s Champion', importance: 100,
            emotion: ['euphoria', 'tears', 'legacy'], tags: ['lorettas', 'national', 'championship', 'milestone', 'legacy'],
            summary: 'A National Championship at Loretta Lynn’s — a life-defining motocross memory.',
          });
        } else if (finish <= 5) {
          fire('national_top5', false, {
            title: 'Top Five at the Ranch', importance: 90,
            emotion: ['pride', 'joy'], tags: ['lorettas', 'national', 'milestone'],
            summary: `${ordinalish(finish)} at Loretta Lynn’s — top five against the best amateurs in the country.`,
          });
        }
      }
      if (finish === 4) {
        fire('national_heartbreak', false, {
          title: 'Fourth at the Ranch', importance: 82,
          emotion: ['heartbreak', 'pride'], tags: ['lorettas', 'national', 'heartbreak'],
          summary: 'Fourth at Loretta Lynn’s — off the podium by one spot.',
        });
      }
    }

    return {
      stage, advanced, finish, region: evRegion, nextStage: STAGE_INFO[stage].next,
      transferSpots: slots, milestones: emitted, eliminated: rec.eliminated,
      selectedNationalRegion: rec.selectedNationalRegion,
    };
  }

  advancementStatus(klass) {
    const rec = this._class(klass);
    const nationalQualified = rec.regionalQualifications.some((q) => q.qualified);
    return {
      klass,
      reached: rec.reached,
      region: rec.selectedNationalRegion ?? rec.region,
      homeRegion: rec.homeRegion,
      dreamState: rec.dreamState,
      eliminated: rec.eliminated,
      areaCleared: rec.areaQualifiedRegions.length > 0,
      regionalCleared: nationalQualified,
      qualifiedForNational: nationalQualified,
      areaQualifiedRegions: [...rec.areaQualifiedRegions],
      regionalQualifiedRegions: rec.regionalQualifications.filter((q) => q.qualified).map((q) => q.region),
      regionalQualifications: rec.regionalQualifications.map((q) => ({ ...q })),
      selectedNationalRegion: rec.selectedNationalRegion,
      bestNational: rec.bestNational ?? null,
      attempts: rec.attempts.length,
    };
  }

  pathWarnings(selectedEvents = [], { klass, hasLorettaGoal = false } = {}) {
    const warnings = [];
    const staged = selectedEvents.map((e) => ({ e, stage: classifyEvent(e) })).filter((x) => x.stage);
    const rec = klass ? this._class(klass) : null;
    const areas = staged.filter((x) => x.stage === 'area');
    const regionals = staged.filter((x) => x.stage === 'regional');
    const nationals = staged.filter((x) => x.stage === 'national');

    if (hasLorettaGoal && !areas.length && !(rec?.areaQualifiedRegions?.length)) {
      warnings.push({ severity: 'high', code: 'no_area_qualifier', message: 'Your Loretta’s goal has no Area Qualifier on the schedule.', action: 'Add at least one Area Qualifier.' });
    }
    if (hasLorettaGoal && klass && !LORETTA_CLASSES.includes(klass)) {
      warnings.push({ severity: 'high', code: 'class_ineligible', message: `${klass} isn’t supported as a Loretta’s class in current game data.`, action: 'Choose an eligible class.' });
    }

    // A Regional must be fed by an Area advancement in that same region. A
    // planned Area in that region is enough for planner validation because the
    // player may not have raced it yet.
    for (const { e: reg } of regionals) {
      const sameRegionAreaPlanned = areas.some(({ e }) => e.region === reg.region && eventTime(e) < eventTime(reg));
      const sameRegionAreaCleared = rec?.areaQualifiedRegions?.includes(reg.region);
      if (!sameRegionAreaPlanned && !sameRegionAreaCleared) {
        warnings.push({
          severity: 'high', code: 'regional_unqualified', region: reg.region,
          message: `${reg.region} Regional has no earlier Area Qualifier path in that region.`,
          action: `Add an earlier ${reg.region} Area Qualifier or remove the Regional.`,
        });
      }
    }

    if (nationals.length && !regionals.length && !(rec?.regionalQualifications?.some((q) => q.qualified))) {
      warnings.push({ severity: 'high', code: 'national_unqualified', message: 'Loretta’s National is on the plan without a Regional qualification path.', action: 'Qualify through a Regional first.' });
    }

    // Multiple Area regions are valid and intentionally generate NO warning.
    return warnings;
  }

  followUpChoices(klass) {
    const rec = this._class(klass);
    if (!rec.eliminated) return [];
    const choices = [
      { id: 'retry_area', label: 'Try another Area Qualifier', blurb: 'Another Area — even in another region — is allowed if budget, timing, and class eligibility work.' },
      { id: 'focus_local', label: 'Focus on local racing', blurb: 'Build speed, confidence, and reputation close to home.' },
      { id: 'save_money', label: 'Save for next season', blurb: 'Stop the travel spend and come back stronger.' },
      { id: 'train_harder', label: 'Train harder', blurb: 'Turn the disappointment into a focused training block.' },
      { id: 'change_class', label: 'Change bike / class strategy', blurb: 'Re-evaluate the bike and class without assuming automatic upward progression.' },
    ];
    if (rec.areaQualifiedRegions.length > rec.regionalQualifications.filter((q) => q.qualified).length) {
      choices.unshift({ id: 'try_other_regional', label: 'Race another qualified Regional', blurb: 'If you advanced from an Area in another region, that Regional path may still be alive.' });
    }
    return choices;
  }

  dreamSummary() {
    const classes = Object.entries(this.byClass).map(([klass]) => this.advancementStatus(klass));
    const furthest = classes.reduce((best, c) => STAGE_ORDER[c.reached] > STAGE_ORDER[best?.reached ?? 'none'] ? c : best, null);
    return {
      active: classes.some((c) => c.dreamState !== 'dormant'),
      furthestStage: furthest?.reached ?? 'none',
      furthestClass: furthest?.klass ?? null,
      region: furthest?.selectedNationalRegion ?? furthest?.region ?? null,
      qualifiedForNational: classes.some((c) => c.qualifiedForNational),
      totalAttempts: classes.reduce((sum, c) => sum + c.attempts, 0),
      classes,
      milestoneCount: this.milestones.length,
      headline: this._headline(furthest),
    };
  }

  _headline(furthest) {
    if (!furthest || furthest.reached === 'none') {
      const chasing = Object.values(this.byClass).some((r) => r.dreamState === 'chasing' || r.eliminated);
      return chasing ? 'Still chasing that first Area transfer.' : 'The Road to Loretta’s hasn’t started yet.';
    }
    if (furthest.qualifiedForNational) return `Qualified for Loretta Lynn’s in ${furthest.klass}. See you at the Ranch.`;
    if (furthest.areaCleared) return `Area transfer earned in ${furthest.klass} — Regional next.`;
    return 'On the Road to Loretta’s.';
  }

  toJSON() {
    return { homeRegion: this.homeRegion, byClass: this.byClass, milestones: this.milestones, seen: [...this._seen] };
  }

  static fromJSON(data) {
    const p = new LorettasPath({ homeRegion: data?.homeRegion ?? null });
    if (!data) return p;
    p.byClass = Object.fromEntries(Object.entries(data.byClass ?? {}).map(([klass, rec]) => [klass, hydrateRecord(rec)]));
    p.milestones = data.milestones ?? [];
    p._seen = new Set(data.seen ?? []);
    return p;
  }
}

function eventTime(event) {
  if (event?.date) {
    const t = Date.parse(event.date);
    if (!Number.isNaN(t)) return t;
  }
  if (event?.day != null) return Number(event.day);
  if (event?.week != null) return Number(event.week) * 7;
  return 0;
}

function ordinalish(n) {
  if (n == null) return '';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}
