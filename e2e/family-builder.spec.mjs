import { test, expect } from '@playwright/test';

test('Build Your Family Life replaces archetype picker and survives reload on mobile',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('./');
  await page.waitForFunction(()=>!!window.__legacy);
  await page.evaluate(()=>localStorage.clear());
  await page.reload();
  await page.waitForFunction(()=>!!window.__legacy);

  // Keep the proven campaign/identity setup, then enter the new life builder.
  await page.getByRole('button',{name:/rider/i}).click();
  await page.getByRole('button',{name:'Next ›'}).click();
  await expect(page.getByTestId('family-builder-family-finance')).toBeVisible();
  await expect(page.getByText('Where does your family stand financially?')).toBeVisible();
  await expect(page.getByText('How do you start?')).toHaveCount(0);

  await page.getByTestId('family-choice-tight').click();
  await page.getByRole('button',{name:'Next ›'}).click();
  await page.getByTestId('family-choice-industry').click();
  await page.getByRole('button',{name:'Next ›'}).click();
  await page.getByTestId('family-choice-single_parent').click();
  await page.getByRole('button',{name:'Next ›'}).click();
  await page.getByTestId('family-choice-public').click();
  await page.getByRole('button',{name:'Next ›'}).click();
  await page.getByTestId('family-choice-guardian_mechanic').click();
  await page.getByRole('button',{name:'Next ›'}).click();
  await page.getByTestId('family-choice-minimal').click();
  await page.getByRole('button',{name:'Next ›'}).click();

  await expect(page.getByTestId('family-story-review')).toBeVisible();
  await expect(page.getByText(/Tight-budget industry-connected family/)).toBeVisible();
  await expect(page.getByTestId('family-story-pressures')).toContainText('money');
  const reviewWidth=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
  expect(reviewWidth.scroll).toBeLessThanOrEqual(reviewWidth.viewport+1);

  await page.getByTestId('family-story-continue').click();
  await page.getByTestId('family-builder-begin').click();
  await page.waitForFunction(()=>window.__legacy?.game?.state?.familyBuilder?.initialized===true);

  const before=await page.evaluate(()=>{const s=window.__legacy.game.state;return{family:s.familyBuilder,balance:s.family.money,school:s.familyLife.school.school,home:s.familyLife.home.homeId,support:s.familyLife.support.model,skills:{...s.rider.skills},people:Object.keys(s.relationships),garage:s.garage.familyBuilder};});
  expect(before.family.builder.financial).toBe('tight');
  expect(before.family.builder.motocrossKnowledge).toBe('industry');
  expect(before.family.builder.household).toBe('single_parent');
  expect(before.school).toBe('public');
  expect(before.home).toBe('minimal');
  expect(before.support).toBe('guardian_mechanic');
  expect(before.people).toContain('parent-1');
  expect(before.garage.storageConstraint).toBe('severe');

  await page.evaluate(()=>window.__legacy.saveGame());
  await page.reload();
  await page.waitForFunction(()=>!!window.__legacy);
  await page.getByRole('button',{name:/Continue Career/}).click();
  await page.waitForFunction(()=>window.__legacy?.game?.state?.familyBuilder?.initialized===true);
  const after=await page.evaluate(()=>{const s=window.__legacy.game.state;return{family:s.familyBuilder,balance:s.family.money,school:s.familyLife.school.school,home:s.familyLife.home.homeId,support:s.familyLife.support.model,skills:{...s.rider.skills},people:Object.keys(s.relationships),garage:s.garage.familyBuilder,viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth};});
  expect(after.family.builder).toEqual(before.family.builder);
  expect(after.family.support).toEqual(before.family.support);
  expect(after.balance).toBe(before.balance);
  expect(after.school).toBe(before.school);
  expect(after.home).toBe(before.home);
  expect(after.support).toBe(before.support);
  expect(after.skills).toEqual(before.skills);
  expect(after.people.filter(id=>id==='parent-1')).toHaveLength(1);
  expect(after.scroll).toBeLessThanOrEqual(after.viewport+1);
});
