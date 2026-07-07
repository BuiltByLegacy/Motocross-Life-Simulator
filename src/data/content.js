// Content
// -------
// The authored data the prototype simulates over: the People, the season
// calendar, the weekly activities, the marketplace pool, and the Story Engine
// scenario cards. Systems live in /engines; this file is the "sourcebook".
//
// Design note: characters are People, not NPCs (DD-0016). Relationship values
// are hidden and expressed through behavior (Relationship Engine).

import { uid } from '../core/state.js';

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------
export const PEOPLE = [
  {
    id: 'dad',
    name: 'Dad',
    role: 'Parent',
    startValues: { trust: 55, pride: 50, pressure: 30, support: 70 },
    arcStages: ['Helper', 'Mentor', 'Partner'],
  },
  {
    id: 'mom',
    name: 'Mom',
    role: 'Parent',
    startValues: { trust: 60, pride: 50, fear: 35, support: 65 },
  },
  {
    id: 'coach_mike',
    name: 'Coach Mike',
    role: 'Coach',
    startValues: { trust: 40, belief: 35, frustration: 15 },
    arcStages: ['Instructor', 'Believer', 'Advocate'],
  },
  {
    id: 'rival_ethan',
    name: 'Ethan Cole',
    role: 'Rival',
    startValues: { respect: 30, rivalry: 45, friendship: 15 },
    arcStages: ['Stranger', 'Enemy', 'Respectful Rival'],
  },
  {
    id: 'friend_jesse',
    name: 'Jesse',
    role: 'Friend',
    startValues: { loyalty: 55, jealousy: 20 },
  },
  {
    id: 'shop_rocky',
    name: "Rocky's Cycle",
    role: 'Local Shop',
    startValues: { reputation: 25, loyalty: 30 },
  },
];

// ---------------------------------------------------------------------------
// Youth class progression by age. Kids start on 50cc as young as 4, move up as
// they grow (DD-0013: childhood is emotionally important, not a short tutorial).
// ---------------------------------------------------------------------------
export function CLASS_FOR_AGE(age) {
  if (age <= 6) return '50cc';
  if (age <= 11) return '65cc';
  if (age <= 13) return '85cc';
  return 'Supermini';
}

const BIKE_BY_CLASS = {
  '50cc': { name: 'KTM 50 SX', manufacturer: 'KTM', serialPrefix: 'KTM50' },
  '65cc': { name: 'Kawasaki KX65', manufacturer: 'Kawasaki', serialPrefix: 'KX065' },
  '85cc': { name: 'Yamaha YZ85', manufacturer: 'Yamaha', serialPrefix: 'YZ085' },
  Supermini: { name: 'Cobra CX-Supermini', manufacturer: 'Cobra', serialPrefix: 'CXSM' },
};

// The starting/each-class bike — an Asset with identity, history, wear (DD-0011).
export function BIKE_FOR_CLASS(klass = '50cc', year = 2019) {
  const spec = BIKE_BY_CLASS[klass] ?? BIKE_BY_CLASS['65cc'];
  return {
    assetId: uid('bike'),
    serial: spec.serialPrefix + '-' + Math.floor(1000 + Math.random() * 9000),
    name: `${year} ${spec.name}`,
    manufacturer: spec.manufacturer,
    year,
    klass,
    type: 'race_bike',
    role: 'race', // 'race' | 'practice' | 'spare'
    condition: 72, // 0-100, wears with use
    reliability: 58, // 0-100, chance of a mechanical DNF/mistake
    performance: 40, // 0-100, raw speed potential from setup/parts
    handling: 42, // cornering/suspension quality
    starts: 40, // gate/holeshot hardware
    tireWear: 0, // 0-100, consumable wear (issue #3); high wear hurts handling
    installed: [], // installed parts by name
    ownership: ['Bought used from a family two towns over'],
    maintenance: [],
    memories: [], // object memories
    sentimental: 60, // first real race bike
  };
}

// Back-compat alias.
export function STARTING_BIKE() {
  return BIKE_FOR_CLASS('50cc');
}

// ---------------------------------------------------------------------------
// Season calendar — a 12-week youth season: 4 local races + 1 regional.
// ---------------------------------------------------------------------------
export const CALENDAR = [
  { week: 1, title: 'Preseason', note: 'A new season. Get the bike and the body ready.' },
  { week: 2, title: 'Build Week', note: 'No race this weekend. Time to prepare.' },
  {
    week: 3,
    title: 'Local Round 1',
    race: { name: 'Rocky Ridge MX — Round 1', kind: 'local', laps: 5, motos: 2, field: 0.42 },
  },
  { week: 4, title: 'Midweek', note: 'Recover, wrench, live a little.' },
  {
    week: 5,
    title: 'Local Round 2',
    race: { name: 'Pine Hollow — Round 2', kind: 'local', laps: 5, motos: 2, field: 0.46 },
  },
  { week: 6, title: 'Midweek', note: 'The season is finding its rhythm.' },
  {
    week: 7,
    title: 'Local Round 3',
    race: { name: 'Sandy Creek — Round 3', kind: 'local', laps: 6, motos: 2, field: 0.5 },
  },
  { week: 8, title: 'Midweek', note: 'One local round left before the regional.' },
  {
    week: 9,
    title: 'Local Round 4',
    race: { name: 'Rocky Ridge MX — Round 4', kind: 'local', laps: 6, motos: 2, field: 0.54 },
  },
  { week: 10, title: 'Regional Prep', note: 'The qualifier is next weekend. Everything matters now.' },
  {
    week: 11,
    title: 'Regional Qualifier',
    race: { name: 'Southwick Regional Qualifier', kind: 'regional', laps: 7, motos: 2, field: 0.66 },
  },
  { week: 12, title: 'Season Finale', note: 'The season is over. Time to look back.' },
];

// ---------------------------------------------------------------------------
// Weekly activities (Rider mode). Each is tagged with a `block`:
//   'full'  — takes a whole day (only weekends, or homeschool weekdays)
//   'light' — an after-school / evening slot
// The 7-day week board (issue #5) places these into days based on the kid's age
// and schooling. Age-based income (issue #7) and training (issue #8) live here.
// ---------------------------------------------------------------------------

// How a young rider earns money, scaling with age (issue #7).
export function INCOME_FOR_AGE(age) {
  if (age <= 7) return { label: 'Do chores for allowance', icon: '🧹', min: 5, max: 15, note: 'Chores around the house for a few dollars.' };
  if (age <= 11) return { label: 'Mow lawns / paper route', icon: '📰', min: 20, max: 45, note: 'A paper route and a push mower. Real work, real money.' };
  if (age <= 15) return { label: 'Odd jobs for cash', icon: '💵', min: 45, max: 80, note: 'Detailing trucks, washing bikes at the track.' };
  return { label: 'Work your part-time job', icon: '🛠️', min: 90, max: 150, note: 'A real paycheck now — and a parts-counter discount.' };
}

export const ACTIVITIES = [
  {
    id: 'practice',
    name: 'Track day (practice)',
    icon: '🏍️',
    block: 'full',
    desc: 'A full day of motos. Builds cornering, jumping and confidence — wears the bike and legs.',
    cost: 40,
    run(g) {
      g.skill('cornering', g.rng.int(1, 3));
      g.skill('jumping', g.rng.int(1, 3));
      g.skill('whoops', g.rng.int(0, 2));
      g.confidence(3);
      g.fatigue(12);
      // A track day wears whichever bike you practice on (the beater if you own
      // one) — protecting the race bike (issue #3).
      const tb = g.trainBike();
      g.wearBike(tb, { condition: -9, tire: 2 });
      if (g.rng.chance(0.35)) g.skill('raceIQ', 1);
      const on = tb.role === 'practice' ? ' (on the practice bike)' : '';
      return `You put in motos until the light went flat${on}. Tired, but faster.`;
    },
  },
  {
    id: 'fitness',
    name: 'Train fitness',
    icon: '💪',
    block: 'light',
    desc: 'Cardio and strength. Fitness fades late-race fatigue.',
    run(g) {
      g.skill('fitness', g.rng.int(2, 4));
      g.fatigue(6);
      g.confidence(1);
      return 'Bike sprints and the gym. Your legs will thank you on lap five.';
    },
  },
  {
    id: 'general_training',
    name: 'General training',
    icon: '🎯',
    block: 'light',
    desc: 'A balanced session — a little of everything across your riding skills.',
    run(g) {
      for (const s of ['starts', 'cornering', 'jumping', 'whoops', 'consistency']) {
        if (g.rng.chance(0.6)) g.skill(s, 1);
      }
      g.fatigue(5);
      return 'A bit of starts, a bit of corners, a bit of everything. Steady gains.';
    },
  },
  {
    id: 'focused_training',
    name: 'Focused training',
    icon: '🔬',
    block: 'light',
    needsStat: true,
    desc: 'Drill one specific skill hard. You choose which.',
    run(g, opts = {}) {
      const stat = opts.stat && g.rider.skills[opts.stat] !== undefined ? opts.stat : 'starts';
      g.skill(stat, g.rng.int(2, 4));
      g.fatigue(6);
      const names = { starts: 'starts off the gate', cornering: 'cornering and ruts', jumping: 'jumps and doubles', whoops: 'the whoops section', raceIQ: 'race craft and lines', consistency: 'lap-to-lap consistency', fitness: 'fitness' };
      return `You drilled ${names[stat] ?? stat} until it clicked.`;
    },
  },
  {
    id: 'wrench',
    name: 'Wrench on the bike',
    icon: '🔧',
    block: 'light',
    desc: 'Fresh oil, clean filter, checked bolts. Restores condition & reliability.',
    cost: 30,
    run(g) {
      g.bikeCondition(g.rng.int(16, 24));
      g.bikeReliability(g.rng.int(3, 6));
      g.rel('dad').change('trust', 1);
      if (g.rng.chance(0.35)) {
        g.skill('raceIQ', 1);
        g.rel('dad').change('pride', 1);
      }
      g.bikeMemoryMaybe('Another night in the garage with a wrench in hand.');
      return 'The bike is clean, tight, and ready. Dad nodded at the work.';
    },
  },
  {
    id: 'schoolwork',
    name: 'Schoolwork',
    icon: '📚',
    block: 'light',
    desc: "Homework and study. Keeps the grades up — and Mom off the racing.",
    run(g) {
      g.rel('mom').change('trust', 3);
      g.rel('mom').change('fear', -2);
      g.setFlag('grades_good', true);
      g.setFlag('did_schoolwork', true);
      return 'Homework done, teacher happy. Mom relaxed about the racing.';
    },
  },
  {
    id: 'family',
    name: 'Family time',
    icon: '🏡',
    block: 'light',
    desc: 'A normal evening off. Lowers stress, builds trust.',
    run(g) {
      g.stress(-8);
      g.confidence(1);
      g.rel('mom').change('trust', 2);
      g.rel('mom').change('fear', -1);
      g.rel('dad').change('support', 1);
      return 'Burgers, a movie, no bikes. Everyone breathed a little easier.';
    },
  },
  {
    id: 'rest',
    name: 'Rest & recover',
    icon: '😴',
    block: 'light',
    desc: 'Do nothing on purpose. Sheds fatigue, steadies confidence.',
    run(g) {
      g.fatigue(-16);
      g.confidence(1);
      if (g.rider.injury) g.rider.injury.weeksOut = Math.max(0, g.rider.injury.weeksOut - 1);
      return 'A quiet evening. Bodies heal in the boring hours.';
    },
  },
  {
    id: 'earn',
    name: 'Earn money',
    icon: '💵',
    block: 'light',
    desc: 'Earn your own money — how depends on your age.',
    dynamicLabel: (g) => INCOME_FOR_AGE(g.rider.age).label,
    dynamicIcon: (g) => INCOME_FOR_AGE(g.rider.age).icon,
    run(g) {
      const inc = INCOME_FOR_AGE(g.rider.age);
      const earned = g.rng.int(inc.min, inc.max);
      g.addMoney(earned);
      g.fatigue(4);
      g.setFlag('earned_own_money', true);
      if (g.rider.age >= 16) g.setFlag('parts_discount', true);
      return `${inc.note} You earned $${earned} of your own.`;
    },
  },
  {
    id: 'market',
    name: 'Browse the marketplace',
    icon: '📱',
    block: 'light',
    desc: 'See what the local motocross community is selling this week.',
    run(g) {
      g.market.refresh(true);
      return 'You scrolled the classifieds and pit bulletin boards.';
    },
  },
];

// ---------------------------------------------------------------------------
// Marketplace pool. Items are Assets with tradeoffs, not levels (Asset Engine).
// `install(g)` applies the item to the player's world when bought.
// ---------------------------------------------------------------------------
export const MARKET_POOL = [
  {
    key: 'mx33',
    name: 'Fresh Dunlop MX33 tires',
    type: 'tires',
    ask: 90,
    floor: 65,
    seller: 'Honest racing dad',
    blurb: 'Barely a moto on them. Kid moved up a class.',
    effect: 'Fresh tires: handling +6, wear reset',
    install(g) {
      g.bike.handling += 6;
      g.bike.tireWear = 0; // brand-new rubber (issue #3)
      g.bikeCondition(4);
      g.bike.installed = g.bike.installed.filter((n) => n !== 'Dunlop MX33 tires');
      g.bike.installed.push('Dunlop MX33 tires');
    },
  },
  {
    key: 'holeshot',
    name: 'Holeshot launch device',
    type: 'part',
    ask: 75,
    floor: 55,
    seller: 'Dealer',
    blurb: 'Bolt-on starts. Every position off the gate counts.',
    effect: 'Bike starts +8',
    install(g) {
      g.bike.starts += 8;
      g.bike.installed.push('Holeshot device');
    },
  },
  {
    key: 'pipe',
    name: 'Aftermarket exhaust pipe',
    type: 'part',
    ask: 240,
    floor: 190,
    seller: 'Local pro',
    blurb: 'More snap out of corners. Needs a jetting tweak to shine.',
    effect: 'Performance +10, reliability -2',
    install(g) {
      g.bike.performance += 10;
      g.bike.reliability = Math.max(0, g.bike.reliability - 2);
      g.bike.installed.push('Aftermarket exhaust');
    },
  },
  {
    key: 'topend',
    name: 'Top-end rebuild kit',
    type: 'part',
    ask: 160,
    floor: 130,
    seller: 'Dealer',
    blurb: 'New piston, rings, gaskets. Peace of mind in a box.',
    effect: 'Reliability +14, condition +10',
    install(g) {
      g.bike.reliability += 14;
      g.bikeCondition(10);
      g.bike.installed.push('Fresh top-end');
      g.bike.maintenance.push('Top-end rebuilt');
    },
  },
  {
    key: 'chest',
    name: 'Lightly used chest protector',
    type: 'gear',
    ask: 55,
    floor: 40,
    seller: 'Kid selling emotional bike',
    blurb: 'Outgrown, hardly scuffed. Mom will sleep better.',
    effect: 'Lowers injury risk; Mom fear -6',
    install(g) {
      g.setFlag('has_chest_protector', true);
      g.rel('mom').change('fear', -6);
      g.garage.objects.push({ name: 'Chest protector', memory: 'Bought used from a kid who quit.' });
    },
  },
  {
    key: 'susp',
    name: 'Suspension revalve service',
    type: 'service',
    ask: 200,
    floor: 170,
    seller: 'Local pro',
    blurb: 'Sprung and valved for your weight. Night-and-day in the ruts.',
    effect: 'Handling +9, consistency +2',
    install(g) {
      g.bike.handling += 9;
      g.skill('consistency', 2);
      g.bike.installed.push('Revalved suspension');
    },
  },
  {
    key: 'practicebike',
    name: 'Hand-me-down 65cc practice bike',
    type: 'bike',
    ask: 650,
    floor: 520,
    seller: 'Team liquidation',
    blurb: 'Rough but runs. Save your race bike for race day.',
    effect: 'A beater to practice on — saves your race bike',
    install(g) {
      g.setFlag('has_practice_bike', true);
      const pb = BIKE_FOR_CLASS(g.bike.klass, g.bike.year - 1);
      pb.name = pb.name + ' (practice)';
      pb.role = 'practice';
      pb.condition = 55;
      pb.reliability = 50;
      pb.ownership = ['The rough beater bought to save the good bike.'];
      g.addBike(pb);
    },
  },
  {
    key: 'plate',
    name: "Regional champ's old number plate",
    type: 'collectible',
    ask: 60,
    floor: 45,
    seller: 'Kid selling emotional bike',
    blurb: 'Signed. No performance value. Pure history.',
    effect: 'Sentimental only — a collectible with a story',
    rare: true,
    install(g) {
      g.confidence(4);
      g.garage.objects.push({
        name: "Signed regional champ's number plate",
        memory: 'A collectible bought because of its history, not its use.',
      });
      g.memory.record({
        type: 'object',
        title: 'A Champion’s Number Plate',
        summary: 'You bought a former regional champion’s signed number plate. Someday it hangs in your museum.',
        emotion: ['inspiration'],
        tags: ['collectible', 'history'],
        force: true,
      });
    },
  },
];

// ---------------------------------------------------------------------------
// Story Engine scenario cards. The engine asks: "Given everything so far, what
// is the most believable thing that could happen next?" — so each card exposes
// a `weight(g)` that reads the world. Quiet weeks are allowed and intended
// (Story Rhythm). Choices return an outcome string.
// ---------------------------------------------------------------------------
export const SCENARIOS = [
  {
    id: 'dad_engine',
    category: 'Family',
    title: 'The 2 A.M. Engine',
    once: true,
    careerOnce: true,
    weight: (g) => (g.bike.condition < 70 ? 3 : 1.2),
    text: (g) =>
      `It's late. ${g.rel('dad').name} has the KX65 up on the stand, parts spread across a towel. "Top-end's tired," he says. "We could knock it out tonight — together — if you're up for it."`,
    choices: [
      {
        label: 'Stay up and help',
        tip: 'Bike + reliability, Dad trust, a memory — but you lose sleep',
        effect(g) {
          g.bikeCondition(20);
          g.bikeReliability(10);
          g.fatigue(14);
          g.skill('raceIQ', 2);
          g.rel('dad').change('trust', 6);
          g.rel('dad').change('pride', 4);
          g.rel('mom').change('fear', 1);
          g.memory.record({
            type: 'relationship',
            title: 'Dad Rebuilt the Engine',
            summary: 'You and Dad rebuilt the top-end until 2 A.M., laughing over a smoking soldering iron.',
            emotion: ['warmth', 'pride'],
            people: ['dad'],
            tags: ['garage', 'family_sacrifice', 'late_night'],
            importance: 78,
            force: true,
          });
          g.bikeMemoryMaybe('Dad and the kid rebuilt this engine together, past midnight.', true);
          g.scheduleChain('dad_toolbox', 3);
          return 'You handed him wrenches and learned where every bolt goes. The bike runs like new. You will not forget this one.';
        },
      },
      {
        label: 'Let Dad handle it, get some sleep',
        tip: 'Bike still gets fixed; you stay rested',
        effect(g) {
          g.bikeCondition(16);
          g.bikeReliability(8);
          g.rel('dad').change('support', 2);
          g.rel('dad').change('pride', -1);
          return 'You slept. In the morning the bike was done and Dad was quiet, coffee in hand.';
        },
      },
    ],
  },
  {
    id: 'rival_trash',
    category: 'Social',
    title: 'Words in the Pits',
    once: false,
    weight: (g) => (g.rel('rival_ethan').get('rivalry') > 40 ? 2.5 : 1),
    text: (g) =>
      `${g.rel('rival_ethan').name} rolls past your pit and eyes your bike. "That old thing? My dad says you'll be a backmarker by regionals." A few kids laugh.`,
    choices: [
      {
        label: 'Fire back',
        tip: 'Confidence + rivalry heat up',
        effect(g) {
          g.confidence(4);
          g.rel('rival_ethan').change('rivalry', 6);
          g.rel('rival_ethan').change('respect', -1);
          return 'You gave it right back. The rivalry has teeth now — and you feel oddly fired up.';
        },
      },
      {
        label: 'Let your riding answer',
        tip: 'Quiet confidence; earns respect over time',
        effect(g) {
          g.confidence(2);
          g.rel('rival_ethan').change('respect', 3);
          g.setFlag('will_prove_ethan', true);
          return 'You just nodded and walked to the line. Some answers are given on the track.';
        },
      },
    ],
  },
  {
    id: 'mom_school',
    category: 'School',
    title: "Mom's Worry",
    once: false,
    weight: (g) => (g.flag('grades_good') ? 0.4 : 1.8),
    text: (g) =>
      `${g.rel('mom').name} sets down a progress report. "I love that you love this. But you're a kid first, and school comes with the deal. Okay?"`,
    choices: [
      {
        label: 'Promise to keep grades up',
        tip: 'Mom trust up; commit a future week to school',
        effect(g) {
          g.rel('mom').change('trust', 5);
          g.rel('mom').change('fear', -3);
          g.setFlag('promised_school', true);
          return 'You promised. She hugged you. A promise like that is worth keeping.';
        },
      },
      {
        label: 'Insist racing comes first',
        tip: 'Dad pride, but Mom worries more',
        effect(g) {
          g.rel('dad').change('pride', 2);
          g.rel('mom').change('fear', 5);
          g.rel('mom').change('trust', -3);
          g.stress(6);
          return 'Dad half-smiled. Mom went quiet. The house felt a little tighter that night.';
        },
      },
    ],
  },
  {
    id: 'shop_deal',
    category: 'Sponsor',
    title: "Rocky's Offer",
    once: true,
    careerOnce: true,
    weight: (g) =>
      g.family.support_level === 0 && (g.season.points > 5 || g.rel('shop_rocky').get('reputation') > 35) ? 4 : 0,
    text: (g) =>
      `The owner of Rocky's Cycle leans on the counter. "You've been turning heads. Tell you what — wear our logo, and you get oil, filters and jerseys at cost. Little help for a fast kid."`,
    choices: [
      {
        label: 'Shake on it (Local Shop Rider)',
        tip: 'Reach Support Level 1; small ongoing help',
        effect(g) {
          g.setSupportLevel(1);
          g.rel('shop_rocky').change('loyalty', 8);
          g.rel('shop_rocky').change('reputation', 5);
          g.rel('dad').change('pride', 5);
          g.addMoney(60);
          g.memory.record({
            type: 'world',
            title: 'First Support Deal',
            summary: "Rocky's Cycle put you on their board of supported local riders. Your first rung up the ladder.",
            emotion: ['pride'],
            tags: ['sponsor', 'milestone', 'support_ladder'],
            importance: 70,
            force: true,
          });
          g.scheduleChain('shop_expectations', 2);
          return "You're a Local Shop Rider now. It's oil and jerseys, not a factory ride — but it's real, and it's yours.";
        },
      },
      {
        label: 'Not yet — stay independent',
        tip: 'Keep full independence for now',
        effect(g) {
          g.rel('shop_rocky').change('reputation', 1);
          return 'You thanked him and said maybe later. The offer will likely still be there.';
        },
      },
    ],
  },
  {
    id: 'jesse_track',
    category: 'Social',
    title: "Jesse's Backyard",
    once: false,
    weight: (g) => (g.rel('friend_jesse').get('loyalty') > 45 ? 2 : 1),
    text: (g) =>
      `${g.rel('friend_jesse').name} texts: "Dad cut a new sand section out back. Come ride Saturday? No pressure, just laps and grilling."`,
    choices: [
      {
        label: 'Go ride with Jesse',
        tip: 'Free practice + friendship, no bike wear',
        effect(g) {
          g.skill('cornering', 2);
          g.skill('whoops', 2);
          g.confidence(3);
          g.rel('friend_jesse').change('loyalty', 5);
          g.stress(-5);
          g.memory.record({
            type: 'relationship',
            title: 'Sand and Smoke',
            summary: "A Saturday at Jesse's private track — sand laps, a grill going, no clocks.",
            emotion: ['joy'],
            people: ['friend_jesse'],
            tags: ['friendship', 'practice', 'quiet_joy'],
            importance: 55,
          });
          return 'You rode until dark and ate too much. The best kind of training doesn\'t feel like training.';
        },
      },
      {
        label: 'Stay home and prep',
        tip: 'Focus on your own program',
        effect(g) {
          g.rel('friend_jesse').change('loyalty', -2);
          g.rel('friend_jesse').change('jealousy', 2);
          g.confidence(1);
          return 'You stayed home to work. Jesse said no worries — but sounded a little let down.';
        },
      },
    ],
  },
  {
    id: 'injury_scare',
    category: 'Injury',
    title: 'The Cased Jump',
    once: false,
    weight: (g) => (g.rider.fatigue > 45 ? 2.6 : 0.8),
    text: (g) =>
      `You came up short on the big double and cased it hard. Your wrist is throbbing. Nothing's broken — but it hurts.`,
    choices: [
      {
        label: 'Rest it this week',
        tip: 'Smart and safe; lose some sharpness',
        effect(g) {
          g.fatigue(-15);
          g.confidence(-2);
          g.rel('mom').change('trust', 2);
          return 'You iced it and stayed off the bike. Boring, but the wrist settled down.';
        },
      },
      {
        label: 'Tough it out',
        tip: 'Dad pride, Mom fear — and a real injury risk',
        effect(g) {
          g.rel('dad').change('pride', 3);
          g.rel('mom').change('fear', 6);
          if (g.rng.chance(0.4)) {
            g.rider.injury = { name: 'Sprained wrist', weeksOut: 1, severity: 'minor' };
            g.confidence(-4);
            g.memory.record({
              type: 'personal',
              title: 'First Real Injury',
              summary: 'You rode hurt and paid for it — a sprained wrist that cost you time on the bike.',
              emotion: ['pain', 'stubbornness'],
              tags: ['injury', 'first_time'],
              importance: 65,
              force: true,
            });
            return 'You gritted through it — and it got worse. The wrist is sprained. Lesson learned the hard way.';
          }
          g.confidence(3);
          return 'You shook it off and kept riding. This time, it held up. Tough kid.';
        },
      },
    ],
  },
  {
    id: 'money_tight',
    category: 'Money',
    title: 'Gas Money',
    once: false,
    weight: (g) => (g.family.money < 500 ? 3 : 0.6),
    text: (g) =>
      `Fuel's up again and the entry fees add up. At dinner, the numbers come up. "We'll make it work," Dad says, "but it's tight."`,
    choices: [
      {
        label: 'Dad picks up overtime',
        tip: 'More money, more household stress',
        effect(g) {
          g.addMoney(220);
          g.stress(12);
          g.rel('dad').change('support', 3);
          g.rel('dad').change('pride', 1);
          g.memory.record({
            type: 'relationship',
            title: 'Dad Worked Overtime',
            summary: 'Dad picked up extra shifts so the season could keep going. You noticed.',
            emotion: ['gratitude', 'guilt'],
            people: ['dad'],
            tags: ['family_sacrifice', 'money'],
            importance: 68,
            force: true,
          });
          g.scheduleChain('dad_tired', 2);
          return 'Dad took the extra shifts. The season is safe — but he looks tired, and you carry that with you.';
        },
      },
      {
        label: 'You chip in your own money',
        tip: 'Spend your savings; earn family respect',
        effect(g) {
          const give = Math.min(g.family.money, 120);
          g.rel('dad').change('pride', 6);
          g.rel('mom').change('trust', 4);
          g.setFlag('chipped_in', true);
          g.confidence(3);
          return `You handed over your odd-job money without being asked. Dad just looked at you for a second. That look meant everything.`;
        },
      },
    ],
  },
  {
    id: 'coach_belief',
    category: 'Coach',
    title: 'Coach Pulls You Aside',
    once: true,
    careerOnce: true,
    weight: (g) =>
      g.rel('coach_mike').get('belief') < 55 && (g.season.points > 8 || g.rider.confidence > 60) ? 3 : 0.5,
    text: (g) =>
      `After practice, ${g.rel('coach_mike').name} crouches to your level. "I coach a lot of kids. Most want to win. You want to get better. That's rarer. Keep listening to me and we'll go somewhere."`,
    choices: [
      {
        label: '"Yes, coach."',
        tip: 'Belief and trust grow; confidence up',
        effect(g) {
          g.rel('coach_mike').change('belief', 8);
          g.rel('coach_mike').change('trust', 5);
          g.confidence(6);
          g.skill('raceIQ', 2);
          g.memory.record({
            type: 'relationship',
            title: 'Coach Believed First',
            summary: 'Coach Mike said you had something before anyone else did.',
            emotion: ['pride', 'belonging'],
            people: ['coach_mike'],
            tags: ['belief', 'mentor'],
            importance: 72,
            force: true,
          });
          return 'Somebody who knows the sport believes in you. You rode home ten feet tall.';
        },
      },
    ],
  },
  {
    id: 'bike_wont_start',
    category: 'Equipment',
    title: "It Won't Start",
    once: false,
    weight: (g) => (g.bike.reliability < 55 ? 2.4 : 0.5),
    text: () =>
      `Practice morning. You kick it, and kick it, and kick it. Nothing. A wisp of fuel smell, a dead engine, and a truck already loaded.`,
    choices: [
      {
        label: 'Diagnose it yourself',
        tip: 'Learn + fix; risk missing the session',
        effect(g) {
          g.skill('raceIQ', 2);
          if (g.rng.chance(0.7)) {
            g.bikeReliability(6);
            g.bikeCondition(6);
            return 'Fouled plug. You swapped it, it fired, and you made the second session. You fixed your own bike.';
          }
          g.confidence(-2);
          return "You couldn't crack it in time and missed the session — but you learned three things it wasn't.";
        },
      },
      {
        label: 'Load up and take it to Rocky',
        tip: 'Costs money; builds shop relationship',
        effect(g) {
          if (g.spend(50)) {
            g.bikeReliability(10);
            g.bikeCondition(8);
            g.rel('shop_rocky').change('loyalty', 4);
            return 'Rocky found it in five minutes, charged you for twenty, and told you how to spot it next time.';
          }
          return "You couldn't cover the shop bill. It waits for the garage tonight instead.";
        },
      },
    ],
  },
  {
    id: 'scout_rumor',
    category: 'World',
    title: 'Word Around the Pits',
    once: true,
    weight: (g) => (g.week >= 8 && g.week <= 10 ? 3 : 0),
    text: () =>
      `Gossip travels fast at the track: a regional support-team scout is supposedly coming to watch the Southwick qualifier. Nobody knows who they're there for.`,
    choices: [
      {
        label: 'Let it light a fire',
        tip: 'Motivation up; pressure up',
        effect(g) {
          g.confidence(4);
          g.stress(4);
          g.setFlag('scout_watching', true);
          g.addNews('Rumor: a regional support-team scout will be at Southwick.', 'world');
          return 'You can\'t un-hear it. The qualifier just got bigger in your mind.';
        },
      },
      {
        label: 'Ignore the noise',
        tip: 'Stay level-headed',
        effect(g) {
          g.setFlag('scout_watching', true);
          g.confidence(1);
          return 'You told yourself it\'s just a race like any other. Mostly, you believed it.';
        },
      },
    ],
  },
  // --- Chain follow-ups (only surface when scheduled by an earlier choice) ---
  {
    id: 'dad_toolbox',
    category: 'Family',
    title: "Dad's Toolbox",
    chainOnly: true,
    weight: () => 0,
    text: (g) =>
      `A few weeks after the rebuild, ${g.rel('dad').name} slides his old toolbox across the bench. "You know where everything goes now. Keep it organized and it's yours to run."`,
    choices: [
      {
        label: 'Take the responsibility',
        tip: 'A milestone — and a lasting object',
        effect(g) {
          g.skill('raceIQ', 2);
          g.rel('dad').change('trust', 6);
          g.rel('dad').change('pride', 3);
          g.garage.objects.push({ name: "Dad's toolbox", memory: 'Handed down after the night you rebuilt the engine together.' });
          g.memory.record({
            type: 'object',
            title: "Dad's Toolbox",
            summary: "Dad handed you his toolbox — a quiet promotion from helper to mechanic.",
            emotion: ['pride', 'responsibility'],
            people: ['dad'],
            tags: ['garage', 'milestone', 'heirloom'],
            importance: 74,
            force: true,
          });
          return "It's just a beat-up toolbox. It's also the most important thing anyone's ever handed you.";
        },
      },
    ],
  },
  {
    id: 'shop_expectations',
    category: 'Sponsor',
    title: "Rocky's Expectations",
    chainOnly: true,
    weight: () => 0,
    text: () =>
      `Rocky corners you at the counter, friendly but pointed. "Got your name on our board now. Folks'll be watching how the shop's kid finishes. No pressure — but, you know. A little pressure."`,
    choices: [
      {
        label: 'Embrace it',
        tip: 'Confidence + shop loyalty, a little pressure',
        effect(g) {
          g.confidence(4);
          g.stress(4);
          g.rel('shop_rocky').change('loyalty', 5);
          return 'You told him you\'d make the board look good. Now you have to.';
        },
      },
      {
        label: 'Keep it low-key',
        tip: 'Less pressure, steady relationship',
        effect(g) {
          g.stress(-2);
          g.rel('shop_rocky').change('loyalty', 1);
          return 'You just want to ride. Rocky respects that, mostly.';
        },
      },
    ],
  },
  {
    id: 'dad_tired',
    category: 'Family',
    title: 'The Cost of Overtime',
    chainOnly: true,
    weight: () => 0,
    text: (g) =>
      `${g.rel('dad').name} fell asleep in his chair before dinner again. The overtime is paying for your season — and it's wearing him down.`,
    choices: [
      {
        label: 'Give him the weekend off racing',
        tip: 'Family over results; Dad recovers, you miss track time',
        effect(g) {
          g.stress(-12);
          g.rel('dad').change('support', 4);
          g.rel('dad').change('trust', 4);
          g.rel('mom').change('trust', 4);
          g.confidence(-1);
          g.memory.record({
            type: 'relationship',
            title: 'You Gave Dad a Weekend',
            summary: "You told Dad to skip the track and rest. He argued, then hugged you.",
            emotion: ['love', 'maturity'],
            people: ['dad'],
            tags: ['family_sacrifice', 'milestone'],
            importance: 70,
            force: true,
          });
          return "The bike sat in the garage all weekend. It was the right call, and you both knew it.";
        },
      },
      {
        label: 'Push on — the season waits for no one',
        tip: 'More prep, more strain on the family',
        effect(g) {
          g.skill('cornering', 1);
          g.stress(8);
          g.rel('dad').change('support', 2);
          g.rel('mom').change('fear', 3);
          return "You kept the program rolling. Dad never complained. That almost made it worse.";
        },
      },
    ],
  },
  // --- More standalone believable beats ---
  {
    id: 'weather_mud',
    category: 'Weather',
    title: 'Rain in the Forecast',
    once: false,
    weight: (g) => (g.isRaceWeek && g.isRaceWeek() ? 1.6 : 0.2),
    text: () =>
      `The forecast for the weekend just turned ugly — heavy rain, a mud race almost certain. Some kids are already talking about staying home.`,
    choices: [
      {
        label: 'Prep for the mud',
        tip: 'Better in bad conditions this weekend',
        effect(g) {
          g.skill('whoops', 2);
          g.setFlag('mud_ready', true);
          g.bikeReliability(-1);
          return 'You cut the fenders, aired down, and mudded up the airbox. Bring it on.';
        },
      },
      {
        label: 'Hope it dries out',
        tip: 'Do nothing special',
        effect(g) {
          return 'You crossed your fingers and left the setup alone.';
        },
      },
    ],
  },
  {
    id: 'new_fast_kid',
    category: 'World',
    title: 'The New Kid',
    once: true,
    weight: (g) => (g.week >= 4 && g.week <= 9 ? 1.4 : 0),
    text: () =>
      `There's a new kid showing up to the local track with a full factory-support setup and a trainer. Word is the family moved here just for the racing.`,
    choices: [
      {
        label: 'Study how they ride',
        tip: 'Learn from the fast kid; a little intimidation',
        effect(g) {
          g.skill('raceIQ', 2);
          g.confidence(-2);
          g.world.rival().rating = Math.min(94, g.world.rival().rating + 2);
          return "You watched their lines all afternoon. Humbling — and useful.";
        },
      },
      {
        label: 'Trust your own program',
        tip: 'Stay confident in your path',
        effect(g) {
          g.confidence(3);
          return "Nice bike. You'll race the rider, not the budget.";
        },
      },
    ],
  },
  {
    id: 'grades_slip',
    category: 'School',
    title: 'A Slipping Grade',
    once: false,
    weight: (g) => (!g.flag('grades_good') && g.week >= 5 ? 1.3 : 0),
    text: () =>
      `A test came back rough. Nothing disastrous, but if it keeps sliding, the racing conversation at home is going to get harder.`,
    choices: [
      {
        label: 'Buckle down on schoolwork',
        tip: 'Fixes it; Mom trust up; costs some focus',
        effect(g) {
          g.setFlag('grades_good', true);
          g.rel('mom').change('trust', 4);
          g.rel('mom').change('fear', -2);
          g.fatigue(4);
          return 'You put in the hours and pulled it back up. Mom exhaled.';
        },
      },
      {
        label: 'Let it ride for now',
        tip: 'Risk it; Mom worries',
        effect(g) {
          g.rel('mom').change('fear', 4);
          g.rel('mom').change('trust', -3);
          g.stress(4);
          return 'You told yourself you\'d fix it later. Mom noticed you didn\'t.';
        },
      },
    ],
  },
  // Quiet weeks — Story Rhythm. Low drama on purpose, so big moments land.
  {
    id: 'quiet_dinner',
    category: 'Family',
    title: 'An Ordinary Wednesday',
    once: false,
    weight: () => 0.9,
    text: () =>
      `No drama this week. Just school, dinner, and the bike waiting patiently in the garage. The calm before the gate drops again.`,
    choices: [
      {
        label: 'Enjoy the quiet',
        tip: 'A calm week; stress down',
        effect(g) {
          g.stress(-6);
          g.confidence(1);
          g.rel('mom').change('trust', 1);
          return 'Nothing happened, and that was fine. The quiet weeks are what make the loud ones matter.';
        },
      },
    ],
  },
  {
    id: 'garage_moment',
    category: 'Family',
    title: 'Sitting in the Garage',
    once: false,
    weight: () => 0.8,
    text: (g) =>
      `You end up in the garage after dark, just sitting on the ${g.bike.name}, imagining Saturday. Dad wanders in, doesn't say much, just tightens a bolt that was already tight.`,
    choices: [
      {
        label: 'Sit with it',
        tip: 'A small, warm memory',
        effect(g) {
          g.confidence(2);
          g.rel('dad').change('trust', 2);
          g.stress(-3);
          if (g.rng.chance(0.5)) {
            g.memory.record({
              type: 'place',
              title: 'The Home Garage',
              summary: 'A quiet night in the garage with Dad, both of you pretending to fix something already fixed.',
              emotion: ['peace', 'belonging'],
              people: ['dad'],
              tags: ['garage', 'quiet_joy'],
              importance: 52,
            });
          }
          return 'Neither of you said anything important. You\'ll remember it anyway.';
        },
      },
    ],
  },
];

// ===========================================================================
// PARENT CAMPAIGN (DD-0012)
// ---------------------------------------------------------------------------
// A separate lens on the same season. You are the parent: you don't ride, you
// provide. The focus is money, work, safety, family stress, the marriage, and
// support decisions — and how the kid comes to feel about you.
// ===========================================================================

export const PEOPLE_PARENT = [
  {
    id: 'child',
    name: 'your kid', // replaced with the rider's name at init
    role: 'Child',
    startValues: { love: 60, trust: 55, pride: 45, pressure: 25 },
    arcStages: ['Your Little Shadow', 'Your Racer', 'Their Own Rider'],
  },
  {
    id: 'spouse',
    name: 'your partner',
    role: 'Spouse',
    startValues: { agreement: 55, communication: 55, strain: 20 },
  },
  {
    id: 'coach_mike',
    name: 'Coach Mike',
    role: 'Coach',
    startValues: { trust: 35, belief: 35, frustration: 15 },
  },
  {
    id: 'rival_ethan',
    name: 'the Cole kid',
    role: 'Rival',
    startValues: { respect: 30, rivalry: 40, friendship: 10 },
  },
  {
    id: 'shop_rocky',
    name: "Rocky's Cycle",
    role: 'Local Shop',
    startValues: { reputation: 25, loyalty: 30 },
  },
];

export const ACTIVITIES_PARENT = [
  {
    id: 'work',
    name: 'Work your shift',
    icon: '💼',
    desc: 'The paycheck that funds the whole dream.',
    run(g) {
      const earned = g.rng.int(120, 160);
      g.addMoney(earned);
      g.stress(5);
      return `A normal week on the job. $${earned} toward the season.`;
    },
  },
  {
    id: 'overtime',
    name: 'Pick up overtime',
    icon: '🕗',
    desc: 'More money for racing — at a cost to you and the marriage.',
    run(g) {
      const earned = g.rng.int(230, 290);
      g.addMoney(earned);
      g.stress(14);
      g.rel('spouse').change('strain', 4);
      return `Long hours, tired eyes. $${earned} earned — the family felt the absence.`;
    },
  },
  {
    id: 'family_time',
    name: 'Family day (no bikes)',
    icon: '🏡',
    desc: 'Just be a family. Heals stress, the kid, and the marriage.',
    run(g) {
      g.stress(-12);
      g.burnout(-10);
      g.confidence(2);
      g.rel('child').change('love', 3);
      g.rel('spouse').change('communication', 3);
      g.rel('spouse').change('strain', -3);
      return 'A day that had nothing to do with results. Everyone needed it.';
    },
  },
  {
    id: 'practice',
    name: 'Take them to the track',
    icon: '🏍️',
    desc: 'Load up and put in laps. The kid gets faster; the bike gets used.',
    cost: 40,
    run(g) {
      g.skill('cornering', g.rng.int(1, 3));
      g.skill('jumping', g.rng.int(1, 3));
      g.skill('whoops', g.rng.int(0, 2));
      g.confidence(3);
      g.burnout(6);
      g.bikeCondition(-9);
      g.stress(4);
      return 'A long day in a folding chair, stopwatch in hand. They looked good out there.';
    },
  },
  {
    id: 'wrench',
    name: 'Wrench on it together',
    icon: '🔧',
    desc: 'Fix the bike side by side. Teaches the kid and builds trust.',
    cost: 30,
    run(g) {
      g.bikeCondition(g.rng.int(16, 26));
      g.bikeReliability(g.rng.int(3, 7));
      g.skill('raceIQ', 1);
      g.rel('child').change('trust', 3);
      g.rel('child').change('pride', 1);
      g.bikeMemoryMaybe('A parent and a kid, side by side under the work light.');
      return 'You handed them the wrench and let them turn it. That matters more than the bolt.';
    },
  },
  {
    id: 'coaching',
    name: 'Pay for coaching',
    icon: '🧢',
    desc: 'A real session with Coach Mike. Costs money; sharpens the kid.',
    cost: 90,
    run(g) {
      g.skill('raceIQ', g.rng.int(1, 3));
      g.skill('consistency', g.rng.int(1, 2));
      g.confidence(3);
      g.rel('coach_mike').change('belief', 4);
      g.rel('coach_mike').change('trust', 3);
      return 'Money well spent — the kid came off the track with a new line and a grin.';
    },
  },
  {
    id: 'rest',
    name: 'Rest & regroup',
    icon: '😌',
    desc: 'Catch your breath. Lowers your stress and the kid\'s burnout.',
    run(g) {
      g.stress(-14);
      g.burnout(-8);
      g.rel('spouse').change('strain', -2);
      if (g.rider.injury) g.rider.injury.weeksOut = Math.max(0, g.rider.injury.weeksOut - 1);
      return 'A slow weekend. The engine — and the family — cooled down.';
    },
  },
  {
    id: 'side_gig',
    name: 'Side gig for cash',
    icon: '💵',
    desc: 'Sell parts, detail trucks, whatever it takes. Extra money, extra tired.',
    run(g) {
      const earned = g.rng.int(90, 140);
      g.addMoney(earned);
      g.stress(6);
      return `You hustled up $${earned} on the side. Every dollar buys another moto.`;
    },
  },
];

export const SCENARIOS_PARENT = [
  {
    id: 'p_kid_wants_part',
    category: 'Money',
    title: 'The Wish List',
    once: false,
    weight: (g) => (g.family.money > 300 ? 1.4 : 0.6),
    text: (g) =>
      `${g.rel('child').name} found a part online and has been talking about it for days. "Everyone fast runs one, Mom/Dad. Please?" Their eyes are doing the thing.`,
    choices: [
      {
        label: 'Find the money for it',
        tip: 'Kid love + confidence, but it costs',
        effect(g) {
          if (g.spend(150)) {
            g.bike.performance += 6;
            g.confidence(4);
            g.rel('child').change('love', 5);
            g.rel('spouse').change('strain', 2);
            return 'You made it work. The way they hugged you made the empty wallet worth it.';
          }
          g.rel('child').change('love', -1);
          return "You checked the account and it just wasn't there this week. They understood. Mostly.";
        },
      },
      {
        label: 'Teach them to wait',
        tip: 'Save money; a lesson in patience',
        effect(g) {
          g.rel('child').change('pride', 1);
          g.rel('child').change('love', -1);
          g.rel('spouse').change('agreement', 2);
          return '"We earn things in this family," you said. They didn\'t love it. They\'ll get it someday.';
        },
      },
    ],
  },
  {
    id: 'p_spouse_money',
    category: 'Family',
    title: 'The Kitchen Table',
    once: false,
    weight: (g) => (g.family.money < 500 || g.rel('spouse').get('strain') > 40 ? 2.4 : 0.7),
    text: (g) =>
      `After the kid's in bed, your partner spreads the bills on the table. "I love this for them. I do. But look at these numbers. We have to talk about it."`,
    choices: [
      {
        label: 'Agree to scale back',
        tip: 'Marriage + money, less for the kid',
        effect(g) {
          g.rel('spouse').change('strain', -8);
          g.rel('spouse').change('communication', 5);
          g.rel('child').change('pressure', -3);
          g.setFlag('scaled_back', true);
          g.addMoney(150);
          return 'You agreed to a budget. It stung to say out loud, but the marriage exhaled.';
        },
      },
      {
        label: 'Push to keep going all-in',
        tip: 'Kid keeps everything; marriage strains',
        effect(g) {
          g.rel('spouse').change('strain', 8);
          g.rel('spouse').change('agreement', -5);
          g.confidence(2);
          g.stress(6);
          return "You made the case to keep pushing. Your partner went quiet. The season rolls on — with a crack in it.";
        },
      },
    ],
  },
  {
    id: 'p_kid_burnout',
    category: 'Health',
    title: 'The Spark Dims',
    once: false,
    weight: (g) => (g.rider.burnout > 55 ? 3 : 0.3),
    text: (g) =>
      `${g.rel('child').name} dragged their gear bag to the truck without a word this morning. The kid who used to sleep in their boots doesn't seem to be having fun anymore.`,
    choices: [
      {
        label: 'Ease off — let them be a kid',
        tip: 'Burnout heals; progress pauses',
        effect(g) {
          g.burnout(-25);
          g.rel('child').change('love', 5);
          g.rel('child').change('pressure', -6);
          g.confidence(4);
          g.memory.record({
            type: 'relationship',
            title: 'You Listened',
            summary: 'You saw the spark dimming and chose your kid over the stopwatch. They came back to it on their own.',
            emotion: ['love', 'relief'],
            people: ['child'],
            tags: ['family_sacrifice', 'milestone'],
            importance: 76,
            force: true,
          });
          return 'You told them it was okay to take a breath. The relief on their face said everything.';
        },
      },
      {
        label: 'Push through it — champions are made here',
        tip: 'Risk it; pressure and burnout climb',
        effect(g) {
          g.burnout(10);
          g.rel('child').change('pressure', 8);
          g.rel('child').change('love', -4);
          g.rel('spouse').change('strain', 4);
          g.setFlag('pushed_through', true);
          return 'You told them to dig deep. They nodded and went back out. You hope you read that right.';
        },
      },
    ],
  },
  {
    id: 'p_safety_scare',
    category: 'Injury',
    title: 'The Big Crash',
    once: false,
    weight: (g) => (g.rider.fatigue > 45 || g.rng ? 1.3 : 1),
    text: (g) =>
      `${g.rel('child').name} looped out over the big tabletop at practice. They're okay — shaken, scraped, staring at the bike like it betrayed them. Your heart is still in your throat.`,
    choices: [
      {
        label: 'Comfort them, call it a day',
        tip: 'Morale recovers; safety first',
        effect(g) {
          g.confidence(-1);
          g.burnout(-6);
          g.rel('child').change('love', 4);
          g.rel('child').change('trust', 3);
          g.rel('spouse').change('agreement', 2);
          return 'You held them in the pits until the shaking stopped. The lap times can wait.';
        },
      },
      {
        label: 'Get them back on before fear sets in',
        tip: 'Old-school toughness — and a real risk',
        effect(g) {
          g.rel('spouse').change('strain', 5);
          if (g.rng.chance(0.5)) {
            g.confidence(5);
            g.skill('jumping', 2);
            return 'They rolled it, then jumped it, then cleared it. Fear beaten in real time. Good call — this time.';
          }
          g.rider.injury = { name: 'Bruised tailbone', weeksOut: 1, severity: 'minor' };
          g.confidence(-5);
          g.burnout(8);
          return "They tried again, cased it, and limped off. Now they're hurt and rattled. That one's on you.";
        },
      },
    ],
  },
  {
    id: 'p_coach_offer',
    category: 'Career',
    title: "Coach Mike's Program",
    once: true,
    weight: (g) => (g.rel('coach_mike').get('belief') > 40 || g.family.money > 700 ? 2 : 0.5),
    text: (g) =>
      `Coach Mike pulls you aside. "Your kid's got something. I'm starting a small weekday group — serious kids only. It's an investment, but I think they're worth it."`,
    choices: [
      {
        label: 'Enroll them (worth it)',
        tip: 'Big skill boost; ongoing cost',
        effect(g) {
          if (g.spend(200)) {
            g.skill('raceIQ', 4);
            g.skill('consistency', 3);
            g.skill('cornering', 2);
            g.rel('coach_mike').change('belief', 8);
            g.rel('coach_mike').change('trust', 6);
            g.confidence(4);
            g.setFlag('in_coaching_program', true);
            return 'You wrote the check. It\'s real money — and the first time someone outside the family believed.';
          }
          return "You wanted to say yes. The account said no. Coach said the door stays open.";
        },
      },
      {
        label: 'Not right now',
        tip: 'Protect the budget',
        effect(g) {
          g.rel('coach_mike').change('frustration', 3);
          return 'You thanked him and said maybe down the road. He nodded, a little disappointed.';
        },
      },
    ],
  },
  {
    id: 'p_sibling',
    category: 'Family',
    title: 'The Other One',
    once: true,
    weight: () => 1.1,
    text: (g) =>
      `Your younger one asked, quietly, why every weekend is about ${g.rel('child').name}'s racing. It landed harder than they meant it to.`,
    choices: [
      {
        label: 'Carve out time for them too',
        tip: 'Family balance; a little less racing focus',
        effect(g) {
          g.stress(-6);
          g.rel('spouse').change('communication', 4);
          g.setFlag('balanced_siblings', true);
          return 'You made the next weekend theirs. The racer even helped plan it. Good parenting is a juggling act.';
        },
      },
      {
        label: 'Keep the focus on the racer',
        tip: 'Racing progresses; guilt lingers',
        effect(g) {
          g.rel('spouse').change('strain', 4);
          g.stress(5);
          return 'The season demanded it, so you chose it. That look on your younger one\'s face stayed with you.';
        },
      },
    ],
  },
  {
    id: 'p_shop_offer',
    category: 'Sponsor',
    title: "Rocky's Board",
    once: true,
    weight: (g) =>
      g.family.support_level === 0 && (g.season.points > 5 || g.rel('shop_rocky').get('reputation') > 35) ? 4 : 0,
    text: (g) =>
      `Rocky waves you over. "Your kid's turning heads. Put 'em on our support board — oil, filters, jerseys at cost. Good for them, good for the shop."`,
    choices: [
      {
        label: 'Shake on it',
        tip: 'Support Level 1; ongoing help',
        effect(g) {
          g.setSupportLevel(1);
          g.rel('shop_rocky').change('loyalty', 8);
          g.rel('child').change('pride', 5);
          g.addMoney(60);
          g.memory.record({
            type: 'world',
            title: 'First Support Deal',
            summary: "You got your kid on Rocky's board of supported riders — the first rung up the ladder.",
            emotion: ['pride'],
            tags: ['sponsor', 'milestone', 'support_ladder'],
            importance: 70,
            force: true,
          });
          return "Their name's on the board now. It's oil and jerseys, not a factory ride — but you earned it for them.";
        },
      },
      {
        label: 'Keep it in the family for now',
        tip: 'Stay independent',
        effect(g) {
          g.rel('shop_rocky').change('reputation', 1);
          return 'You thanked him and said maybe later. No strings, for now.';
        },
      },
    ],
  },
  {
    id: 'p_travel_far',
    category: 'Travel',
    title: 'The Away Race',
    once: false,
    weight: (g) => (g.week >= 5 && g.week <= 9 ? 1.5 : 0.3),
    text: () =>
      `There's a bigger race three hours away this month — tougher field, better exposure. Hotel, fuel, entries... it adds up fast.`,
    choices: [
      {
        label: 'Load the truck and go',
        tip: 'Kid grows from tough competition; costs money + you',
        effect(g) {
          if (g.spend(180)) {
            g.skill('raceIQ', 3);
            g.skill('consistency', 2);
            g.confidence(3);
            g.stress(8);
            g.burnout(4);
            return 'You drove through the night and slept in the truck. The kid raced up a level. Worth it.';
          }
          return "The budget said no this time. You told the kid there'd be other races. There will.";
        },
      },
      {
        label: 'Stay local, save the money',
        tip: 'Protect the budget and the family',
        effect(g) {
          g.addMoney(40);
          g.stress(-3);
          return 'You kept it local this weekend. Sometimes the smart call is the boring one.';
        },
      },
    ],
  },
  // Quiet weeks
  {
    id: 'p_quiet',
    category: 'Family',
    title: 'An Ordinary Week',
    once: false,
    weight: () => 0.9,
    text: (g) =>
      `No drama this week. Homework, dinner, the bike waiting in the garage. ${g.rel('child').name} seems happy. So do you.`,
    choices: [
      {
        label: 'Just breathe',
        tip: 'A calm week',
        effect(g) {
          g.stress(-6);
          g.burnout(-4);
          g.rel('spouse').change('communication', 2);
          return 'Nothing happened, and it was wonderful. These are the weeks you\'ll miss.';
        },
      },
    ],
  },
];

// ===========================================================================
// SPONSORS (Sponsors tab / issue: sponsorship system)
// ---------------------------------------------------------------------------
// Fictional brands only. Three tiers — Local, Regional, National — gated by
// results/reputation. Each sponsor pays a signing bonus on the deal and a
// per-race contingency when the rider finishes at or better than `payThru`.
// ===========================================================================
export const SPONSORS = [
  // --- Local: low bar, small money, the first logos on the bike ---
  { id: 'sunrise_coffee', name: 'Sunrise Coffee', logo: '☕', tier: 'local', bonus: 60, stipend: 15, contingency: 25, payThru: 5,
    pitch: 'The coffee shop by the track will slap a sticker on for gas money.', req: (g) => true },
  { id: 'bear_claw', name: 'Bear Claw Diner', logo: '🐻', tier: 'local', bonus: 80, stipend: 15, contingency: 30, payThru: 5,
    pitch: 'The diner sponsors a couple local kids every year. Pancakes optional.', req: (g) => g.season.results.length >= 1 || g.rel('shop_rocky').get('reputation') > 30 },
  { id: 'main_street_auto', name: 'Main Street Auto', logo: '🔩', tier: 'local', bonus: 100, stipend: 20, contingency: 30, payThru: 4,
    pitch: 'The auto shop likes a fast kid representing the town.', req: (g) => g.rel('shop_rocky').get('reputation') > 35 },
  { id: 'corner_scoop', name: 'Corner Scoop', logo: '🍦', tier: 'local', bonus: 70, stipend: 10, contingency: 20, payThru: 6,
    pitch: 'The ice cream stand wants their cone on your number plate.', req: (g) => true },

  // --- Regional: needs some results; real per-race money ---
  { id: 'buckley_burger', name: 'Buckley Burger', logo: '🍔', tier: 'regional', bonus: 250, stipend: 40, contingency: 75, payThru: 5,
    pitch: 'The regional burger chain runs a real amateur support program.', req: (g) => g.season.points > 20 || g.state.season.bestFinish <= 3 },
  { id: 'grind_house', name: 'Grind House Coffee', logo: '☕', tier: 'regional', bonus: 300, stipend: 50, contingency: 80, payThru: 3,
    pitch: 'The coffee chain wants a young face for its weekend-warrior brand.', req: (g) => (g.state.season.bestFinish ?? 99) <= 3 },
  { id: 'tristate_powersports', name: 'Tri-State Powersports', logo: '🏍️', tier: 'regional', bonus: 350, stipend: 60, contingency: 90, payThru: 3,
    pitch: 'The regional dealer network backs riders who win motos.', req: (g) => g.family.support_level >= 1 && g.season.points > 30 },
  { id: 'velocity_energy', name: 'Velocity Energy', logo: '⚡', tier: 'regional', bonus: 300, stipend: 40, contingency: 100, payThru: 2,
    pitch: 'An up-and-coming energy drink wants a rising star. Podiums only.', req: (g) => (g.state.season.bestFinish ?? 99) <= 2 },

  // --- National: high bar, big money, prestige ---
  { id: 'nitro_cola', name: 'Nitro Cola', logo: '🥤', tier: 'national', bonus: 1200, stipend: 150, contingency: 300, payThru: 3,
    pitch: 'A national soft-drink giant scouting the next amateur phenom.', req: (g) => g.family.support_level >= 1 && (g.state.season.bestFinish ?? 99) <= 2 },
  { id: 'apex_gear', name: 'Apex Moto Gear', logo: '🥇', tier: 'national', bonus: 900, stipend: 120, contingency: 250, payThru: 3,
    pitch: 'A national gear brand — free kit and real contingency money.', req: (g) => g.careerPodiums && g.careerPodiums() >= 3 },
  { id: 'titan_tires', name: 'Titan Tires', logo: '🛞', tier: 'national', bonus: 800, stipend: 100, contingency: 220, payThru: 2,
    pitch: 'The tire brand backs riders who can win on their rubber.', req: (g) => (g.state.season.bestFinish ?? 99) <= 1 },
  { id: 'voltage_energy', name: 'Voltage Energy', logo: '🔋', tier: 'national', bonus: 1500, stipend: 200, contingency: 350, payThru: 2,
    pitch: 'The biggest energy-drink program in the sport. They only sign winners.', req: (g) => g.family.support_level >= 2 || (g.careerWins && g.careerWins() >= 2) },
];
