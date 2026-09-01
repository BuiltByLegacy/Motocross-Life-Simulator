import { test, expect } from '@playwright/test';

test('builds a family life, begins career, and survives reload at 390x844',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.getByRole('button',{name:/Rider/}).click();
  await page.getByRole('button',{name:/Next/}).click();

  await expect(page.getByTestId('family-life-builder')).toBeVisible();
  await page.getByRole('button',{name:/Tight/}).click();
  await page.getByRole('button',{name:/Motocross family/}).click();
  await page.getByRole('button',{name:/Single-parent household/}).click();
  await page.getByRole('button',{name:/Next/}).click();
  await page.getByRole('button',{name:/Homeschool/}).click();
  await page.getByRole('button',{name:/Parent.*guardian is the mechanic/}).click();
  await page.getByRole('button',{name:/Rural property/}).click();

  const story=page.getByTestId('family-story');
  await expect(story).toContainText('Tight');
  await expect(story).toContainText('Homeschool');
  await expect(story).toContainText('Rural property');
  await expect(story).toContainText('Starting strengths');
  await expect(story).toContainText('Starting pressures');
  await page.getByRole('button',{name:/Looks Good/}).click();
  await page.getByRole('button',{name:/Detailed/}).click();
  await page.getByTestId('family-begin-career').click();

  const state=await page.evaluate(()=>({family:window.__legacy.game.state.familyLife,cash:window.__legacy.game.family.money,skills:{...window.__legacy.game.rider.skills},school:window.__legacy.game.state.schoolMode}));
  expect(state.family.builder.financial).toBe('tight');
  expect(state.family.builder.motocrossKnowledge).toBe('motocross_family');
  expect(state.family.builder.household).toBe('single_parent');
  expect(state.family.builder.school).toBe('homeschool');
  expect(state.family.supportHome.home).toBe('rural');
  expect(state.family.compoundSeed.ridingSpaceEligibility).toBe(true);
  expect(state.family.riderPerformanceModifiers).toEqual({});
  expect(state.school).toBe('homeschool');

  await page.evaluate(()=>window.__legacy.saveGame());
  await page.reload();
  await page.getByRole('button',{name:/Continue Career/}).click();
  const reloaded=await page.evaluate(()=>({family:window.__legacy.game.state.familyLife,cash:window.__legacy.game.family.money,skills:{...window.__legacy.game.rider.skills}}));
  expect(reloaded.family.builder.financial).toBe('tight');
  expect(reloaded.family.raceSupport.assignments.wrenching).toBeTruthy();
  expect(reloaded.cash).toBe(state.cash);
  expect(reloaded.skills).toEqual(state.skills);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});
