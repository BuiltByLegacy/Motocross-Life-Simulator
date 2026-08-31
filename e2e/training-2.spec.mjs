import { test, expect } from '@playwright/test';
async function noOverflow(page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);}
test('Training 2.0 browse confirm receipt history and reload',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await page.waitForFunction(()=>!!window.__legacy);
 await page.evaluate(()=>{localStorage.clear();window.__legacy.startGame({name:'Taylor',depth:'detailed',birthdate:'2014-05-15',campaign:'parent',avatar:'🧒',background:'working_class'});window.__legacy.game.state.week=2;window.__legacy.game.family.money=500;window.__legacy.tab='garage';window.__legacy.render();});
 await page.getByTestId('lbr-choice-training').click();await expect(page.getByTestId('training-scene')).toBeVisible();await expect(page.getByTestId('training-session-starts')).toContainText('$15');await expect(page.getByTestId('training-session-coaching')).toContainText('$90');await noOverflow(page);
 const before=await page.evaluate(()=>({money:window.__legacy.game.family.money,count:window.__legacy.game.state.lifeBetweenRaces.trainingHistory.length}));await page.getByTestId('training-session-starts').click();expect(await page.evaluate(()=>window.__legacy.game.family.money)).toBe(before.money);expect(await page.evaluate(()=>window.__legacy.game.state.lifeBetweenRaces.trainingHistory.length)).toBe(before.count);
 await page.getByTestId('training-confirm').click();await expect(page.getByTestId('training-receipt')).toBeVisible();await expect(page.getByTestId('training-receipt')).toContainText('$15');expect(await page.evaluate(()=>window.__legacy.game.state.lifeBetweenRaces.trainingHistory.length)).toBe(before.count+1);await noOverflow(page);
 await page.getByTestId('training-receipt-done').click();await expect(page.getByTestId('training-scene')).toBeVisible();await expect(page.getByTestId('training-scene')).toContainText('1 career');await expect(page.getByTestId('training-scene')).toContainText('$15 spent');
 await page.evaluate(()=>window.__legacy.saveGame());
 expect(await page.evaluate(()=>!!localStorage.getItem('legacy_mx_save_v2'))).toBe(true);
 await page.reload();await page.waitForFunction(()=>!!window.__legacy);
 expect(await page.evaluate(()=>window.__legacy.game===null)).toBe(true);
 await page.evaluate(()=>window.__legacy.continueGame());
 await page.waitForFunction(()=>!!window.__legacy?.game?.state?.lifeBetweenRaces);
 expect(await page.evaluate(()=>window.__legacy.game.state.lifeBetweenRaces.trainingHistory.length)).toBe(before.count+1);expect(await page.evaluate(()=>window.__legacy.game.state.lifeBetweenRaces.latestTrainingReceipt.trainingId)).toBe('starts');await noOverflow(page);
 await page.setViewportSize({width:1280,height:900});await noOverflow(page);
});
