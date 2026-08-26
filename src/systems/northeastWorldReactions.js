// Northeast media, announcer, community, and persistent world reactions.

const clamp = (v, min = 0, max = 100) => Math.max(min, Math.min(max, Number(v) || 0));

export const NORTHEAST_OBSERVERS = [
  { id: 'ne-announcer-local', type: 'announcer', name: 'Local Track Announcer', scope: 'local' },
  { id: 'ne-media-regional', type: 'media', name: 'Northeast Moto Report', scope: 'regional' },
  { id: 'ne-community-home', type: 'community', name: 'Hometown MX Community', scope: 'hometown' },
];

export function createWorldReactionState() {
  return { version: 1, reactions: [], seenKeys: [], influence: { recognition: 0, opportunity: 0, concern: 0 } };
}

export function restoreWorldReactionState(raw = {}) {
  const state = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return {
    version: 1,
    reactions: [...(state?.reactions ?? [])],
    seenKeys: [...(state?.seenKeys ?? [])],
    influence: { recognition: 0, opportunity: 0, concern: 0, ...(state?.influence ?? {}) },
  };
}

export function serializeWorldReactionState(state) { return JSON.stringify(restoreWorldReactionState(state)); }

function reactionKey(observerId, event) {
  return `${observerId}:${event.type}:${event.season ?? 'x'}:${event.eventId ?? event.venueId ?? event.class ?? 'general'}`;
}

function intensityFor(observer, event, localReputation) {
  let intensity = observer.scope === 'regional' ? 35 : 28;
  if (event.prestige === 'regional') intensity += 12;
  if (event.prestige === 'national') intensity += 24;
  if (event.type === 'championship' || event.type === 'loretta-qualified') intensity += 18;
  if (event.type === 'win' || event.type === 'comeback') intensity += 10;
  intensity += Math.round(clamp(localReputation) * 0.25);
  return clamp(intensity);
}

function messageFor(observer, event, history = []) {
  const previous = history.filter((r) => r.observerId === observer.id).at(-1);
  const priorReference = previous ? ` Last time, they were talking about ${previous.eventType}.` : '';
  if (event.type === 'win') return `${observer.name}: another result people will remember at ${event.venueName ?? 'the track'}.${priorReference}`;
  if (event.type === 'championship') return `${observer.name}: the championship changes how this rider is viewed in the Northeast.${priorReference}`;
  if (event.type === 'loretta-qualified') return `${observer.name}: a Northeast rider is headed to the Ranch.${priorReference}`;
  if (event.type === 'poor-conduct') return `${observer.name}: the result is being overshadowed by conduct concerns.${priorReference}`;
  if (event.type === 'crash') return `${observer.name}: people are watching the recovery after a hard weekend.${priorReference}`;
  if (event.type === 'rivalry') return `${observer.name}: this rivalry keeps following both riders from weekend to weekend.${priorReference}`;
  if (event.type === 'comeback') return `${observer.name}: the comeback is becoming part of the rider's local story.${priorReference}`;
  return `${observer.name}: the paddock noticed what happened this weekend.${priorReference}`;
}

export function recordWorldEvent(state, event, { localReputation = 0, age = 12 } = {}) {
  const next = restoreWorldReactionState(state);
  const created = [];
  for (const observer of NORTHEAST_OBSERVERS) {
    if (observer.scope === 'hometown' && !event.hometown && event.type !== 'loretta-qualified' && event.type !== 'championship') continue;
    const key = reactionKey(observer.id, event);
    if (next.seenKeys.includes(key)) continue;
    const intensity = intensityFor(observer, event, localReputation);
    if (intensity < 30) continue;
    const reaction = {
      key,
      observerId: observer.id,
      observerType: observer.type,
      eventType: event.type,
      eventId: event.eventId ?? null,
      season: event.season ?? null,
      intensity,
      ageAppropriate: age < 16,
      message: messageFor(observer, event, next.reactions),
      consequence: null,
    };
    if (['win', 'championship', 'loretta-qualified', 'comeback'].includes(event.type)) {
      reaction.consequence = intensity >= 70 ? 'opportunity-boost' : 'recognition-boost';
      next.influence.recognition = clamp(next.influence.recognition + Math.round(intensity / 10));
      if (intensity >= 70) next.influence.opportunity = clamp(next.influence.opportunity + 6);
    } else if (['poor-conduct', 'crash'].includes(event.type)) {
      reaction.consequence = event.type === 'poor-conduct' ? 'trust-risk' : 'concern';
      next.influence.concern = clamp(next.influence.concern + Math.round(intensity / 12));
    } else if (event.type === 'rivalry') {
      reaction.consequence = 'rivalry-visibility';
      next.influence.recognition = clamp(next.influence.recognition + 3);
    }
    next.reactions.push(reaction);
    next.seenKeys.push(key);
    created.push(reaction);
  }
  return { state: next, reactions: created };
}

export function latestRecognition(state, { observerType = null, limit = 5 } = {}) {
  return restoreWorldReactionState(state).reactions
    .filter((r) => !observerType || r.observerType === observerType)
    .slice(-limit)
    .reverse();
}

export function reactionOpportunityModifier(state) {
  const s = restoreWorldReactionState(state);
  return {
    sponsorInterest: Math.round(s.influence.opportunity * 0.8 + s.influence.recognition * 0.25 - s.influence.concern * 0.4),
    dealerTrust: Math.round(s.influence.recognition * 0.2 - s.influence.concern * 0.5),
    teamVisibility: Math.round(s.influence.opportunity * 0.6 + s.influence.recognition * 0.2),
  };
}
