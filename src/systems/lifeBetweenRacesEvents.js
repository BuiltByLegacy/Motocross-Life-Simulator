// Life Between Races 2.0 — contextual relationship/life events (#393)
// Deterministic, consequence-bearing moments. This module never bypasses existing
// family/sponsor/calendar/opportunity rules; it only produces state deltas/hooks.

const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Number(v) || 0));
const hash = (text) => {
  let h = 2166136261;
  for (const ch of String(text)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
};

export const LIFE_EVENT_TYPES = Object.freeze([
  'family_check_in', 'rival_message', 'coach_invite', 'shop_help', 'sponsor_request', 'community_moment',
]);

export function createLifeEventState(raw = {}) {
  return {
    version: 1,
    seenKeys: Array.isArray(raw.seenKeys) ? [...new Set(raw.seenKeys)] : [],
    history: Array.isArray(raw.history) ? raw.history.map((x) => ({ ...x })) : [],
  };
}

function candidates(ctx = {}) {
  const out = [];
  const season = Number(ctx.seasonNumber ?? 1);
  const week = Number(ctx.week ?? 1);
  const base = { season, week, source: 'life-between-races' };
  if (ctx.family || Number(ctx.familyStress ?? 0) >= 35) out.push({ ...base, type: 'family_check_in', actor: 'family', weight: 18 + Number(ctx.familyStress ?? 0) * 0.2 });
  if (ctx.rivalId || Number(ctx.recentFinish ?? 99) <= 8) out.push({ ...base, type: 'rival_message', actor: ctx.rivalId ?? 'rival', weight: 14 + Math.max(0, 10 - Number(ctx.recentFinish ?? 10)) });
  if (ctx.coachId || Number(ctx.trainingLoad ?? 0) >= 12) out.push({ ...base, type: 'coach_invite', actor: ctx.coachId ?? 'coach', weight: 12 + Number(ctx.trainingLoad ?? 0) * 0.5 });
  if (ctx.shopId || Number(ctx.bikeCondition ?? 100) < 60) out.push({ ...base, type: 'shop_help', actor: ctx.shopId ?? 'shop', weight: 12 + Math.max(0, 60 - Number(ctx.bikeCondition ?? 60)) * 0.4 });
  if (ctx.sponsorId || Number(ctx.sponsorSatisfaction ?? 100) < 70) out.push({ ...base, type: 'sponsor_request', actor: ctx.sponsorId ?? 'sponsor', weight: 10 + Math.max(0, 70 - Number(ctx.sponsorSatisfaction ?? 70)) * 0.35 });
  if (Number(ctx.reputation ?? 0) >= 35 || ctx.communityId) out.push({ ...base, type: 'community_moment', actor: ctx.communityId ?? 'local-community', weight: 8 + Number(ctx.reputation ?? 0) * 0.15 });
  return out;
}

export function generateLifeEvent(stateRaw, ctx = {}, { seed = 1 } = {}) {
  const state = createLifeEventState(stateRaw);
  const pool = candidates(ctx).filter((c) => !state.seenKeys.includes(eventKey(c, ctx)));
  if (!pool.length) return { state, event: null };
  const total = pool.reduce((n, c) => n + c.weight, 0);
  const roll = hash(`${seed}:${ctx.seasonNumber}:${ctx.week}:${ctx.region ?? ''}:${ctx.recentFinish ?? ''}`) % Math.max(1, Math.round(total));
  let cursor = roll;
  let pick = pool[0];
  for (const c of pool) { cursor -= c.weight; if (cursor <= 0) { pick = c; break; } }
  const key = eventKey(pick, ctx);
  return { state, event: buildEvent(pick, ctx, key) };
}

function eventKey(c, ctx) {
  // One actor/type event per season-quarter prevents repetitive spam while still
  // allowing relationships to evolve across a long career.
  const quarter = Math.floor((Number(ctx.week ?? c.week ?? 1) - 1) / 13) + 1;
  return `s${Number(ctx.seasonNumber ?? c.season ?? 1)}:q${quarter}:${c.type}:${c.actor}`;
}

function buildEvent(c, ctx, key) {
  const defs = {
    family_check_in: { title: 'Family Check-In', body: 'The people making this possible want to know how hard this season should be pushed.', choices: [
      choice('listen', 'Make time for them', { relationship: 6, stress: -7, reputation: 0, money: 0 }),
      choice('balance', 'Set a practical plan', { relationship: 3, stress: -3, reputation: 0, money: 0 }),
      choice('push', 'Ask them to keep pushing', { relationship: -3, stress: 6, reputation: 0, money: 0 }),
    ]},
    rival_message: { title: 'Rival Checks In', body: 'A rider you keep seeing at the gate reaches out between rounds.', choices: [
      choice('respect', 'Keep it respectful', { relationship: 5, stress: -2, reputation: 2, money: 0 }),
      choice('challenge', 'Turn up the rivalry', { relationship: -2, stress: 3, reputation: 3, money: 0, opportunity: 1 }),
    ]},
    coach_invite: { title: 'Coach Has an Opening', body: 'A coach offers focused time around what your recent riding exposed.', choices: [
      choice('accept', 'Take the session', { relationship: 4, stress: -2, reputation: 1, money: -65, opportunity: 2, trainingFocus: 1 }),
      choice('decline', 'Protect the week', { relationship: 0, stress: -1, reputation: 0, money: 0 }),
    ]},
    shop_help: { title: 'Shop Offers a Hand', body: 'A local shop notices the workload around the bike and offers some help.', choices: [
      choice('accept', 'Use the help', { relationship: 5, stress: -4, reputation: 1, money: -35, bikeReadiness: 8 }),
      choice('self', 'Handle it yourself', { relationship: 1, stress: 2, reputation: 0, money: 0 }),
    ]},
    sponsor_request: { title: 'Sponsor Needs Something', body: 'A sponsor asks for time off the bike to support the relationship.', choices: [
      choice('deliver', 'Show up professionally', { relationship: 4, stress: 2, reputation: 2, money: 0, sponsorSatisfaction: 8 }),
      choice('reschedule', 'Ask to move it', { relationship: 0, stress: 1, reputation: 0, money: 0, sponsorSatisfaction: 1 }),
    ]},
    community_moment: { title: 'Local Track Moment', body: 'Your name is starting to mean something around the local motocross scene.', choices: [
      choice('engage', 'Stay and be part of it', { relationship: 3, stress: -2, reputation: 5, money: 0, opportunity: 1 }),
      choice('focus', 'Keep the week focused', { relationship: 0, stress: -1, reputation: 1, money: 0 }),
    ]},
  };
  return { key, type: c.type, actor: c.actor, season: c.season, week: c.week, region: ctx.region ?? null, ...defs[c.type] };
}

const choice = (id, label, effects) => ({ id, label, effects });

export function resolveLifeEvent(stateRaw, event, choiceId) {
  const state = createLifeEventState(stateRaw);
  if (!event || state.seenKeys.includes(event.key)) return { state, error: 'already-resolved', outcome: null };
  const selected = event.choices?.find((c) => c.id === choiceId);
  if (!selected) return { state, error: 'invalid-choice', outcome: null };
  const outcome = {
    eventKey: event.key, type: event.type, actor: event.actor, choiceId,
    effects: { ...selected.effects },
    memory: {
      kind: 'life-between-races', title: event.title, tone: Number(selected.effects.relationship ?? 0) >= 0 ? 'warm' : 'tense',
      tags: ['life-between-races', event.type], season: event.season, week: event.week,
    },
  };
  state.seenKeys.push(event.key);
  state.history.push(outcome);
  return { state, error: null, outcome };
}

export function applyLifeEventEffects(target = {}, outcome) {
  const e = outcome?.effects ?? {};
  return {
    ...target,
    relationship: clamp(Number(target.relationship ?? 50) + Number(e.relationship ?? 0)),
    stress: clamp(Number(target.stress ?? 0) + Number(e.stress ?? 0)),
    reputation: clamp(Number(target.reputation ?? 0) + Number(e.reputation ?? 0)),
    money: Number(target.money ?? 0) + Number(e.money ?? 0),
    opportunitySignal: Math.max(0, Number(target.opportunitySignal ?? 0) + Number(e.opportunity ?? 0)),
    sponsorSatisfaction: clamp(Number(target.sponsorSatisfaction ?? 50) + Number(e.sponsorSatisfaction ?? 0)),
    bikeReadiness: clamp(Number(target.bikeReadiness ?? 50) + Number(e.bikeReadiness ?? 0)),
  };
}
