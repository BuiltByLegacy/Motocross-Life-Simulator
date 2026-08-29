import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';
import {
  openLifeBetweenRaces,
  availableLifeBetweenRacesChoices,
  takeLifeBetweenRacesDecision,
} from '../src/systems/lifeBetweenRacesGame.js';

test('Game opens persistent off-week lifecycle from real calendar/slots', () => {
  const g = new Game({ riderName: 'Off Week Rider', seed: 77, birthdate: '2014-05-15' });
  g.state.week = 2;
  const opened = openLifeBetweenRaces(g);
  assert.ok(opened.period);
  assert.equal(g.state.lifeBetweenRaces.periods.length, 1);
  assert.equal(opened.period.timeBudget, g.weekSlots().length);
  const reopened = openLifeBetweenRaces(g);
  assert.equal(reopened.state.periods.length, 1);
});

test('training decision mutates canonical skills, fatigue, money and bike wear', () => {
  const g = new Game({ riderName: 'Training Rider', seed: 88, birthdate: '2014-05-15' });
  g.state.week = 2;
  g.state.family.money = 500;
  const start = {
    starts: g.rider.skills.starts,
    fatigue: g.rider.fatigue,
    money: g.family.money,
    condition: g.trainBike().condition,
  };
  const result = takeLifeBetweenRacesDecision(g, 'training', 'starts');
  assert.equal(result.error, null);
  assert.ok(g.rider.skills.starts >= start.starts);
  assert.ok(g.rider.fatigue > start.fatigue);
  assert.equal(g.family.money, start.money - 15);
  assert.equal(g.state.lifeBetweenRaces.trainingHistory.length, 1);

  const motos = takeLifeBetweenRacesDecision(g, 'training', 'motos');
  assert.equal(motos.error, null);
  assert.ok(g.trainBike().condition < start.condition);
});

test('recovery decision lowers fatigue and therapy advances an active injury', () => {
  const g = new Game({ riderName: 'Recovery Rider', seed: 99, birthdate: '2014-05-15' });
  g.state.week = 2;
  g.rider.fatigue = 70;
  g.rider.injury = { name: 'Ankle', weeksOut: 3, severity: 2 };
  g.family.money = 500;
  const choices = availableLifeBetweenRacesChoices(g);
  assert.equal(choices.find((c) => c.recommended)?.family, 'recovery');

  const result = takeLifeBetweenRacesDecision(g, 'recovery', 'therapy');
  assert.equal(result.error, null);
  assert.ok(g.rider.fatigue < 70);
  assert.equal(g.rider.injury.weeksOut, 2);
  assert.equal(g.family.money, 445);
});

test('Life Between Races survives normal Game save/load', () => {
  const g = new Game({ riderName: 'Saved Rider', seed: 111, birthdate: '2014-05-15' });
  g.state.week = 2;
  takeLifeBetweenRacesDecision(g, 'training', 'technique');
  const saved = g.toSave();
  const loaded = Game.load(structuredClone(saved));
  assert.equal(loaded.state.lifeBetweenRaces.periods.length, 1);
  assert.equal(loaded.state.lifeBetweenRaces.trainingHistory[0].trainingId, 'technique');
});
