// Race Simulation Engine
// ----------------------
// "Simulate races lap-by-lap, not simply an entire race day at once." Stats set
// the expectation; random events (starts, crashes, mistakes, mechanicals,
// late-race fatigue) create the believable stories.
//
// A RaceSession is steppable so the UI can present it lap-by-lap with a
// mid-race decision each lap, and it can also be run straight through for
// simulated / auto play (DD-0020).

const STRATEGIES = {
  push: { label: 'Push harder', pace: 6, risk: 0.05, fatigue: 8 },
  steady: { label: 'Ride steady', pace: 0, risk: 0.012, fatigue: 4 },
  attack: { label: 'Attack the rider ahead', pace: 9, risk: 0.085, fatigue: 10 },
  conserve: { label: 'Conserve energy', pace: -4, risk: 0.0, fatigue: 1 },
};

export const RACE_STRATEGIES = STRATEGIES;

const FILLER_FIRST = ['Cody', 'Blake', 'Hunter', 'Ryder', 'Chase', 'Drew', 'Colt', 'Zane', 'Beau', 'Gage', 'Trey', 'Kade', 'Luke', 'Wyatt'];
const FILLER_LAST = ['Barnes', 'Ford', 'Quinn', 'Sharp', 'Doyle', 'Frost', 'Lane', 'Marsh', 'Pruett', 'Case', 'Hale', 'Dunn'];
function FILLER_NAME(g) {
  return `${g.rng.pick(FILLER_FIRST)} ${g.rng.pick(FILLER_LAST)}`;
}

function playerBaseRating(g, overrideBike) {
  const s = g.rider.skills;
  const rider =
    s.starts * 0.14 + s.cornering * 0.2 + s.jumping * 0.14 + s.whoops * 0.1 +
    s.raceIQ * 0.16 + s.consistency * 0.16 + s.fitness * 0.1;
  const b = overrideBike ?? g.bike;
  const bikeScore = b.performance * 0.35 + b.handling * 0.35 + b.starts * 0.15 + b.condition * 0.15;
  let rating = rider * 0.62 + bikeScore * 0.23 + g.rider.confidence * 0.15;
  if (g.rider.injury && g.rider.injury.weeksOut > 0) rating -= 8;
  if (g.flag('mud_ready')) rating += 4; // prepped for the conditions
  if (g.flag('pit_help')) rating += 4; // paid pit support (Parent mode)
  const tw = b.tireWear ?? 0;
  if (tw > 50) rating -= Math.min(6, (tw - 50) * 0.12); // worn tires hurt grip (issue #3)
  return rating;
}

// Rough pre-race "form" read for the UI preview (0-100).
export function estimateForm(g, bike) {
  return Math.round(playerBaseRating(g, bike));
}

export class RaceSession {
  constructor(game, race, bike) {
    this.game = game;
    this.race = race;
    this.bike = bike ?? game.bike; // which bike the player races (issue #4)
    this.lapsPerMoto = race.laps;
    this.motoCount = race.motos;
    this.motoIndex = 0;
    this.results = {}; // riderId -> [motoPos, ...]
    this.finished = false;
    this._buildField();
    this._setupMoto();
  }

  _buildField() {
    const g = this.game;
    const fieldShift = (this.race.field - 0.45) * 30;
    // You race your peers. Center the field on an age-appropriate baseline that
    // sits near the player's own ability, so racing is competitive at every age.
    const ageBaseline = 32 + (g.rider.age - 4) * 1.6;
    const scale = (rating) => Math.max(12, Math.min(96, ageBaseline + (rating - 50) * 0.7 + fieldShift));

    const opponents = g.world.field().map((r) => ({
      id: r.id, name: r.name, isRival: r.isRival, isRegular: true,
      base: scale(r.rating), aggression: r.aggression,
    }));

    // Fill to the series field size with event-only regional riders (issue #9):
    // riders you only see at this event, so field size varies by series.
    const target = (this.race.riders ?? opponents.length + 1) - 1;
    let fi = 0;
    while (opponents.length < target) {
      opponents.push({
        id: 'fill_' + fi, name: FILLER_NAME(g), isRegular: false,
        base: scale(g.rng.range(36, 64)), aggression: g.rng.range(0.35, 0.8),
      });
      fi++;
    }
    // If a series is smaller than the regular roster, trim.
    opponents.length = Math.min(opponents.length, Math.max(1, target));

    this.riders = [
      { id: 'player', name: g.rider.name, isPlayer: true, base: playerBaseRating(g, this.bike), aggression: 0.6 },
      ...opponents,
    ];
  }

  // Reset per-moto racing state and roll the start (holeshot matters).
  _setupMoto() {
    const g = this.game;
    this.lapDone = 0;
    this.motoEvents = [];
    this.motoOver = false;
    for (const r of this.riders) {
      let startScore;
      if (r.isPlayer) {
        startScore = this.bike.starts * 0.5 + g.rider.skills.starts * 0.5 + g.rng.noise(1) * 22;
      } else {
        startScore = r.base * 0.5 + r.aggression * 28 + g.rng.noise(1) * 22;
      }
      r.progress = startScore; // seed order off the gate
      r.raceFatigue = r.isPlayer ? g.rider.fatigue : g.rng.range(0, 20);
      r.out = false;
      r.dnf = false;
      r.crashedThisLap = false;
    }
    // Holeshot callout.
    const leader = this._order()[0];
    this.motoEvents.push({
      kind: 'start',
      text: `Gate drops! ${leader.isPlayer ? 'YOU grab' : leader.name + ' grabs'} the holeshot into turn one.`,
    });
  }

  _order() {
    const live = this.riders.filter((r) => !r.out);
    const dead = this.riders.filter((r) => r.out);
    live.sort((a, b) => b.progress - a.progress);
    // Out riders sit at the back in the order they exited.
    return [...live, ...dead];
  }

  standings() {
    const order = this._order();
    return order.map((r, i) => ({
      pos: i + 1,
      name: r.name,
      isPlayer: r.isPlayer,
      isRival: r.isRival,
      out: r.out,
      dnf: r.dnf,
    }));
  }

  playerPos() {
    return this._order().findIndex((r) => r.isPlayer) + 1;
  }

  get lapsRemaining() {
    return this.lapsPerMoto - this.lapDone;
  }

  // Advance one lap for the whole field. `strategy` applies to the player.
  stepLap(strategy = 'steady') {
    if (this.motoOver) return { done: true, events: [], standings: this.standings() };
    const g = this.game;
    const strat = STRATEGIES[strategy] ?? STRATEGIES.steady;
    this.lapDone++;
    const lapNum = this.lapDone;
    const isLastLap = this.lapDone >= this.lapsPerMoto;
    const events = [];

    for (const r of this.riders) {
      if (r.out) continue;

      let pace = r.base + g.rng.noise(1) * 10;
      let risk = 0.012 + (1 - this._reliabilityFor(r) / 100) * 0.02;
      let fatigueGain = 4;

      if (r.isPlayer) {
        pace += strat.pace;
        risk = 0.02 + strat.risk + (1 - this.bike.reliability / 100) * 0.03;
        fatigueGain = strat.fatigue;
      } else {
        // Sim riders ride to their aggression.
        pace += (r.aggression - 0.5) * 6;
        risk += r.aggression * 0.02;
        fatigueGain = 4 + r.aggression * 4;
      }

      // Late-race fatigue fade; fitness softens it.
      r.raceFatigue = Math.min(100, r.raceFatigue + fatigueGain);
      if (r.raceFatigue > 60) {
        const fitness = r.isPlayer ? g.rider.skills.fitness : 55;
        pace -= (r.raceFatigue - 60) * 0.14 * (1 - fitness / 160);
        risk += (r.raceFatigue - 60) * 0.0015;
      }

      // Mechanical DNF — condition & reliability matter (bike prep pays off).
      const rel = this._reliabilityFor(r);
      const cond = r.isPlayer ? this.bike.condition : 70;
      const dnfChance = (1 - rel / 100) * 0.008 * (cond < 50 ? 1.6 : 1);
      if (g.rng.chance(dnfChance)) {
        r.out = true;
        r.dnf = true;
        if (r.isPlayer) {
          events.push({ kind: 'dnf', text: `Disaster — your bike lets go on lap ${lapNum}. Your race is over.` });
        } else if (r.isRival || g.rng.chance(0.4)) {
          events.push({ kind: 'note', text: `${r.name} coasts off the track — mechanical trouble.` });
        }
        continue;
      }

      // Crash / mistake.
      if (g.rng.chance(risk)) {
        r.crashedThisLap = true;
        const severe = g.rng.chance(0.14);
        pace -= severe ? 55 : 28; // lose big ground; maybe DNF if severe & unlucky
        if (r.isPlayer) {
          if (severe && g.rng.chance(0.3)) {
            r.out = true;
            events.push({ kind: 'crash', text: `You crash HARD on lap ${lapNum} and can't restart. Heartbreak.` });
            this._maybeInjury(true);
          } else {
            events.push({
              kind: 'crash',
              text: `You go down on lap ${lapNum}! Scramble to remount and rejoin.`,
            });
            g.rider.confidence = Math.max(0, g.rider.confidence - 3);
            if (severe) this._maybeInjury(false);
          }
        } else if (r.isRival) {
          events.push({ kind: 'note', text: `${r.name} tips over in the ruts — he's up but he lost ground.` });
        } else if (g.rng.chance(0.35)) {
          events.push({ kind: 'note', text: `${r.name} washes the front end and drops back.` });
        }
      }

      r.progress += Math.max(-60, pace);
    }

    // Position-change color commentary around the player.
    const order = this._order();
    const pIdx = order.findIndex((r) => r.isPlayer);
    const player = order[pIdx];
    if (player && !player.out) {
      if (strategy === 'attack' && pIdx > 0) {
        const ahead = order[pIdx - 1];
        events.push({ kind: 'battle', text: `You throw it inside on ${ahead.name} — bars nearly touching!` });
      }
      if (isLastLap) events.push({ kind: 'note', text: 'White flag — last lap!' });
    }

    // Record positions of any leaders for flavor.
    for (const e of events) this.motoEvents.push(e);

    if (this.lapDone >= this.lapsPerMoto) this.motoOver = true;

    return {
      done: this.motoOver,
      lap: lapNum,
      isLastLap,
      events,
      standings: this.standings(),
      playerPos: this.playerPos(),
      playerOut: player ? player.out : true,
    };
  }

  _reliabilityFor(r) {
    return r.isPlayer ? this.bike.reliability : 72;
  }

  _maybeInjury(severe) {
    const g = this.game;
    if (g.flag('has_chest_protector') && !severe && g.rng.chance(0.6)) return;
    if (g.rng.chance(severe ? 0.7 : 0.25)) {
      g.rider.injury = {
        name: severe ? 'Bruised ribs' : 'Banged-up shoulder',
        weeksOut: severe ? 2 : 1,
        severity: severe ? 'moderate' : 'minor',
      };
      g.memory.record({
        type: 'personal',
        title: 'Went Down at ' + this.race.name.split('—')[0].trim(),
        summary: `You crashed racing and ${severe ? 'bruised your ribs' : 'banged up a shoulder'}. It cost you.`,
        emotion: ['pain', 'frustration'],
        tags: ['injury', severe ? 'first_time' : 'racing'],
        importance: severe ? 70 : 55,
        force: true,
      });
    }
  }

  // Close the current moto, banking finishing positions for every rider.
  finishMoto() {
    const order = this._order();
    order.forEach((r, i) => {
      if (!this.results[r.id]) this.results[r.id] = [];
      this.results[r.id].push(r.dnf || r.out ? this.riders.length + 1 : i + 1);
    });
    const playerPos = order.findIndex((r) => r.isPlayer) + 1;
    const player = order.find((r) => r.isPlayer);
    return { motoIndex: this.motoIndex, playerPos, dnf: player.dnf, out: player.out };
  }

  hasNextMoto() {
    return this.motoIndex + 1 < this.motoCount;
  }

  startNextMoto() {
    this.motoIndex++;
    this._setupMoto();
  }

  // Compute overall standings from combined moto scores and emit the result.
  finalize() {
    const g = this.game;
    const scored = this.riders.map((r) => {
      const motos = this.results[r.id] ?? [];
      const total = motos.reduce((a, b) => a + b, 0);
      return { r, motos, total, second: motos[1] ?? 99 };
    });
    scored.sort((a, b) => a.total - b.total || a.second - b.second);
    const overall = scored.findIndex((s) => s.r.isPlayer) + 1;

    // Championship: accumulate season points for the persistent regulars so a
    // title can be contested (issue #9). Fillers are event-only and don't count.
    const pTable = [0, 25, 22, 20, 18, 16, 15, 14, 13, 12, 11];
    if (!g.state.season.riderPoints) g.state.season.riderPoints = {};
    scored.forEach((s, i) => {
      if (s.r.isRegular) {
        const pts = pTable[i + 1] ?? Math.max(1, 11 - (i + 1 - 10));
        g.state.season.riderPoints[s.r.id] = (g.state.season.riderPoints[s.r.id] ?? 0) + pts;
      }
    });
    const playerScore = scored.find((s) => s.r.isPlayer);
    const rivalScore = scored.find((s) => s.r.isRival);

    const pointsTable = [0, 25, 22, 20, 18, 16, 15, 14, 13, 12, 11];
    const points = pointsTable[overall] ?? Math.max(1, 11 - (overall - 10));

    const result = {
      race: this.race,
      klass: this.bike.klass,
      bikeId: this.bike.assetId,
      overall,
      points,
      motos: playerScore.motos,
      dnf: playerScore.motos.some((m) => m > this.riders.length),
      rivalOverall: rivalScore ? scored.findIndex((s) => s.r.isRival) + 1 : null,
      podium: scored.slice(0, 3).map((s, i) => ({ pos: i + 1, name: s.r.name, isPlayer: s.r.isPlayer })),
      fieldSize: this.riders.length,
    };
    this.finished = true;
    g.bus.emit('race:finished', { overall, points, race: this.race, result, week: g.week });
    return result;
  }

  // Run any remaining laps/motos straight through (auto / sim play).
  simulateRemaining(strategy = 'steady') {
    while (true) {
      while (!this.motoOver) this.stepLap(strategy);
      this.finishMoto();
      if (this.hasNextMoto()) this.startNextMoto();
      else break;
    }
    return this.finalize();
  }
}
