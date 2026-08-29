import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const js = fs.readFileSync(new URL('../src/ui2CalendarPatch.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../ui2Calendar.css', import.meta.url), 'utf8');

test('UI 2.0 calendar is a season board rather than legacy dashboard copy', () => {
  assert.match(js, /THE SEASON BOARD/);
  assert.match(js, /Life between the races/);
  assert.match(js, /HOME \/ OPEN CAREER TIME/);
  assert.doesNotMatch(js, /Build your schedule/);
});

test('UI 2.0 calendar preserves Calendar 2.0 periods and existing commit path', () => {
  assert.match(js, /continuousPlannerPeriods\(g\)/);
  assert.match(js, /app\.confirmProgram\(edit\)/);
  assert.match(js, /app\._programSel\[period\.week\]/);
});

test('calendar provides mobile and larger-screen responsive composition', () => {
  assert.match(css, /@media\(max-width:520px\)/);
  assert.match(css, /@media\(min-width:800px\)/);
  assert.match(css, /calendar2-month-strip/);
});