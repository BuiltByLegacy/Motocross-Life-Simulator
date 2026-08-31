import { test, expect } from '@playwright/test';
async function noOverflow(page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);}

test('Race Intelligence practice and Moto 1 debrief loop persists weekend learning',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await page.waitForFunction(()=>!!window.__legacy);
 await page.evaluate(()=>{localStorage.clear();const a=window.__legacy;a.startGame({name:'Riley',depth:'detailed',birthdate:'2014-05-15',campaign:'rider',avatar:'🧒',background:'working_class'});a.game.state.week=3;a.game.week=3;a.weekContent=()=>a.viewRaceIntro();a.render();});
 await expect(page.getByTestId('race-weekend-arrival')).toBeVisible();await expect(page.getByText('TRACK INTELLIGENCE')).toBeVisible();await noOverflow(page);
 await page.getByRole('button',{name:/ENTER THE PADDOCK/i}).click();await expect(page.getByTestId('race-intel-practice-debrief')).toBeVisible();await expect(page.getByText(/WHAT YOU LEARNED/i)).toBeVisible();await noOverflow(page);
 await page.getByTestId('race-intel-choice-balanced').click();await expect(page.getByTestId('race-weekend-live')).toBeVisible();
 await page.evaluate(()=>{const a=window.__legacy;while(!a.race.motoOver)a.race.stepLap('steady');a.render();});await expect(page.getByRole('button',{name:/REVIEW MOTO 1/i})).toBeVisible();
 await page.getByRole('button',{name:/REVIEW MOTO 1/i}).click();await expect(page.getByTestId('race-intel-moto1-debrief')).toBeVisible();await expect(page.getByText(/MOTO 1 DEBRIEF/i)).toBeVisible();await noOverflow(page);
 await page.getByTestId('race-intel-choice-balanced').click();await expect(page.getByTestId('race-weekend-live')).toBeVisible();
 const record=await page.evaluate(()=>window.__legacy.game.state.raceWeekendIntelligence);expect(record.debriefs.length).toBe(2);expect(record.venueKnowledge.history.length).toBeGreaterThanOrEqual(2);
 await page.evaluate(()=>window.__legacy.saveGame());await page.reload();await page.waitForFunction(()=>!!window.__legacy);await page.evaluate(()=>window.__legacy.continueGame());await page.waitForFunction(()=>!!window.__legacy.game);
 expect(await page.evaluate(()=>window.__legacy.game.state.raceWeekendIntelligence.debriefs.length)).toBe(2);await noOverflow(page);await page.setViewportSize({width:1280,height:900});await noOverflow(page);
});
