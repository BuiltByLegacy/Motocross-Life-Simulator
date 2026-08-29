import { test, expect } from '@playwright/test';

async function noOverflow(page){ expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true); }

test('Life Between Races UI surfaces meaningful off-week choices and survives reload', async({page})=>{
  await page.setViewportSize({width:390,height:844}); await page.goto('/'); await page.waitForFunction(()=>!!window.__legacy);
  await page.evaluate(()=>{ localStorage.clear(); window.__legacy.startGame({name:'Jordan',depth:'detailed',birthdate:'2014-05-15',campaign:'parent',avatar:'🧒',background:'working_class'}); window.__legacy.game.state.week=2; window.__legacy.game.family.money=500; window.__legacy.game.trainBike().condition=52; window.__legacy.tab='garage'; window.__legacy.render(); });
  await expect(page.getByTestId('life-between-races-scene')).toBeVisible();
  await expect(page.getByTestId('lbr-choice-training')).toBeVisible();
  await expect(page.getByTestId('lbr-choice-maintenance')).toBeVisible();
  await expect(page.getByTestId('lbr-choice-responsibility')).toBeVisible();
  await expect(page.getByTestId('lbr-choice-prep')).toBeVisible();
  await noOverflow(page);
  await page.getByTestId('lbr-choice-maintenance').click();
  expect(await page.evaluate(()=>window.__legacy.game.state.lifeBetweenRaces.expandedHistory?.length??0)).toBeGreaterThan(0);
  await page.evaluate(()=>window.__legacy.save?.()); await page.reload(); await page.waitForFunction(()=>!!window.__legacy); await noOverflow(page);
  await page.setViewportSize({width:1280,height:900}); await noOverflow(page);
});
