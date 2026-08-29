import {
  restoreLifeBetweenRacesState,
  openBetweenRacesPeriod,
  buildOffWeekDecisionSet,
  resolveTrainingDecision,
  resolveRecoveryDecision,
} from './lifeBetweenRaces.js';

export function lifeBetweenRacesContextFromGame(game) {
  const nextRace = (game.state.calendar ?? []).find((c) => c.week > game.week && c.race);
  return {
    week: game.week,
    seasonNumber: game.state.seasonNumber,
    isRaceWeek: game.isRaceWeek(),
    nextRaceWeek: nextRace?.week ?? null,
    availableSlots: game.weekSlots().length,
    rider: game.rider,
    family: game.family,
    bike: game.bike,
    schoolMode: game.state.schoolMode,
  };
}

export function ensureLifeBetweenRaces(game) {
  game.state.lifeBetweenRaces = restoreLifeBetweenRacesState(game.state.lifeBetweenRaces);
  return game.state.lifeBetweenRaces;
}

export function openLifeBetweenRaces(game) {
  const state = ensureLifeBetweenRaces(game);
  const opened = openBetweenRacesPeriod(state, lifeBetweenRacesContextFromGame(game));
  game.state.lifeBetweenRaces = opened.state;
  return opened;
}

export function availableLifeBetweenRacesChoices(game) {
  openLifeBetweenRaces(game);
  return buildOffWeekDecisionSet(game.state.lifeBetweenRaces, lifeBetweenRacesContextFromGame(game));
}

function applyTraining(game, decision) {
  if (decision.cost > 0 && !game.spend(decision.cost)) return { error: 'not-enough-money' };
  for (const [skill, gain] of Object.entries(decision.gains ?? {})) {
    if (gain) game.skill(skill, gain);
  }
  game.fatigue(decision.fatigueDelta ?? 0);
  game.confidence(decision.confidenceDelta ?? 0);

  // Riding load should still age the canonical bike system. Keep the wear light
  // here: dedicated garage/maintenance depth lands in #390.
  if (['motos', 'coaching', 'technique', 'light_ride'].includes(decision.trainingId)) {
    const bike = game.trainBike();
    const wear = decision.trainingId === 'motos'
      ? { condition: -7, parts: { tires: -5, chain: -3, brakes: -2 } }
      : decision.trainingId === 'light_ride'
        ? { condition: -2, parts: { tires: -1, chain: -1 } }
        : { condition: -4, parts: { tires: -3, chain: -2, brakes: -1 } };
    game.wearBike(bike, wear);
  }
  game.log(`🏋️ ${decision.trainingId.replaceAll('_', ' ')}: load ${decision.load}, risk ${decision.risk.band}.`);
  return { ok: true };
}

function applyRecovery(game, decision) {
  if (decision.cost > 0 && !game.spend(decision.cost)) return { error: 'not-enough-money' };
  game.fatigue(decision.fatigueDelta ?? 0);
  game.stress(decision.stressDelta ?? 0);
  game.confidence(decision.confidenceDelta ?? 0);
  if (decision.injuryRecovery > 0 && game.rider.injury?.weeksOut > 0) {
    game.rider.injury.weeksOut = Math.max(0, game.rider.injury.weeksOut - decision.injuryRecovery);
    if (game.rider.injury.weeksOut === 0) game.rider.injury = null;
  }
  game.log(`🧊 ${decision.recoveryId.replaceAll('_', ' ')}: recovery quality ${decision.recoveryQuality}.`);
  return { ok: true };
}

export function takeLifeBetweenRacesDecision(game, family, id) {
  openLifeBetweenRaces(game);
  const ctx = lifeBetweenRacesContextFromGame(game);
  const seed = game.state.seed ?? game.rng?.seed ?? 1;
  const resolved = family === 'training'
    ? resolveTrainingDecision(game.state.lifeBetweenRaces, id, ctx, { seed })
    : family === 'recovery'
      ? resolveRecoveryDecision(game.state.lifeBetweenRaces, id, ctx)
      : { state: game.state.lifeBetweenRaces, decision: null, error: 'unknown-family' };
  if (resolved.error || !resolved.decision) return resolved;

  // Apply first to the canonical Game state; only persist the lifecycle mutation
  // once the game-side transaction succeeds.
  const applied = family === 'training'
    ? applyTraining(game, resolved.decision)
    : applyRecovery(game, resolved.decision);
  if (applied.error) return { ...resolved, error: applied.error };

  game.state.lifeBetweenRaces = resolved.state;
  return { ...resolved, applied };
}
