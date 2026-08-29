import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const js = fs.readFileSync(new URL('../src/seasonLifecycleUiPatch.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../seasonLifecycle.css', import.meta.url), 'utf8');

test('Season Lifecycle UI frames opening, breakthrough and closing moments', () => {
  assert.match(js, /SEASON BRIEF/);
  assert.match(js, /SOMEONE NOTICED/);
  assert.match(js, /SEASON CHECK-IN/);
  assert.match(js, /SEASON REVIEW/);
  assert.match(js, /WHAT WE CARRY INTO NEXT YEAR/);
});

test('Season Brief gates the final season board without replacing its implementation', () => {
  assert.match(js, /const originalBuilder = App\.prototype\.viewProgramBuilder/);
  assert.match(js, /if \(!edit && !state\.posture\) return briefScreen\(this\)/);
  assert.match(js, /return originalBuilder\.call\(this, edit\)/);
});

test('in-season sponsor opportunities bridge into Sponsorship 2.0 contracts and obligations', () => {
  assert.match(js, /s2\.contracts\.push\(contract\)/);
  assert.match(js, /s2\.obligations\.push/);
  assert.match(js, /guardianRequired/);
  assert.match(js, /PARENT APPROVES/);
});

test('lifecycle presentation has phone and larger-screen layout rules', () => {
  assert.match(css, /@media\(max-width:650px\)/);
  assert.match(css, /@media\(min-width:850px\)/);
  assert.match(css, /season-kitchen-table/);
  assert.match(css, /season-review-ledger/);
});