import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const js = fs.readFileSync(new URL('../src/ui2RaceWeekendPatch.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../ui2RaceWeekend.css', import.meta.url), 'utf8');

test('race weekend presents explicit event phases', () => {
  assert.match(js, /ARRIVE/);
  assert.match(js, /PREP/);
  assert.match(js, /MOTO/);
  assert.match(js, /RESULTS/);
  assert.match(js, /HOME/);
});

test('race UI delegates race behavior to existing engine methods', () => {
  assert.match(js, /this\.startInteractiveRace\(\)/);
  assert.match(js, /this\.quickSimRace\(\)/);
  assert.match(js, /this\.doLap\(key\)/);
  assert.match(js, /this\.onMotoContinue\(\)/);
  assert.match(js, /this\.finishWeek\(\)/);
  assert.doesNotMatch(js, /Math\.random/);
});

test('results communicate consequences beyond finishing position', () => {
  assert.match(js, /CHAMPIONSHIP/);
  assert.match(js, /RIVALRY/);
  assert.match(js, /BIKE \/ BODY/);
});

test('race presentation is responsive', () => {
  assert.match(css, /@media\(max-width:600px\)/);
  assert.match(css, /@media\(min-width:900px\)/);
});