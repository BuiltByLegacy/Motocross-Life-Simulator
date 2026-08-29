import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';
import { expandedLifeBetweenRacesChoices, takeExpandedLifeBetweenRacesDecision } from '../src/systems/lifeBetweenRacesExpandedGame.js';

test('expanded off-week choices surface training recovery maintenance responsibilities prep and relationships', () => {
  const g=new Game({riderName:'Life Rider',seed:123,birthdate:'2014-05-15'}); g.state.week=2; g.family.money=500; g.family.stress=45; g.trainBike().condition=52;
  const choices=expandedLifeBetweenRacesChoices(g); const families=new Set(choices.map(c=>c.family));
  for(const family of ['training','recovery','maintenance','responsibility','prep','relationship']) assert.ok(families.has(family));
});

test('maintenance and responsibility decisions mutate canonical game state and consume shared week time', () => {
  const g=new Game({riderName:'Prep Rider',seed:44,birthdate:'2014-05-15'}); g.state.week=2; g.family.money=500; g.trainBike().condition=50;
  let choices=expandedLifeBetweenRacesChoices(g); const maintenance=choices.find(c=>c.family==='maintenance'); const before=g.trainBike().condition;
  const m=takeExpandedLifeBetweenRacesDecision(g,maintenance); assert.equal(m.error,null); assert.ok(g.trainBike().condition>before);
  choices=expandedLifeBetweenRacesChoices(g); const responsibility=choices.find(c=>c.family==='responsibility'); const r=takeExpandedLifeBetweenRacesDecision(g,responsibility); assert.equal(r.error,null);
  assert.ok(g.state.lifeBetweenRaces.periods[0].timeUsed>=2);
});

test('expanded off-week history survives normal save load envelope', () => {
  const g=new Game({riderName:'Saved Life',seed:77,birthdate:'2014-05-15'}); g.state.week=2; g.family.money=500;
  const prep=expandedLifeBetweenRacesChoices(g).find(c=>c.family==='prep'); takeExpandedLifeBetweenRacesDecision(g,prep);
  const loaded=Game.load(structuredClone(g.toSave())); assert.ok(loaded.state.lifeBetweenRaces.expandedHistory?.length>=1);
});
