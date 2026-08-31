import { test, expect } from '@playwright/test';

test('Career Opportunities 2.0 presents, accepts and persists a major career fork', async ({ page }) => {
  await page.setViewportSize({ width:390, height:844 });
  await page.goto('/'); await page.waitForFunction(()=>!!window.__legacy); await page.evaluate(()=>localStorage.clear());
  await page.evaluate(async()=>{
    const app=window.__legacy;
    app.startGame({name:'Opportunity Rider',depth:'detailed',birthdate:'2006-05-15',campaign:'rider',avatar:'🏍️',background:null});
    const mod=await import(new URL('src/systems/careerOpportunities2.js',document.baseURI).href);
    const ctx={week:8,seasonNumber:1,rider:{...app.game.rider,age:20,klass:'250'},family:{...app.game.family,money:9000},form:82,reputation:78,professionalism:80,visibility:70,support:60,relationship:70,readiness:78,development:68,region:'home',momentum:76};
    app.game.rider.age=20;app.game.rider.klass='250';app.game.family.money=9000;
    app.game.state.careerOpportunities2=mod.discoverCareerOpportunities({},ctx);
    app.tab='stats';app.render();
  });
  const scene=page.locator('[data-testid="career-opportunity-scene"]');
  await expect(scene).toBeVisible(); await expect(scene.getByText('A DOOR OPENED')).toBeVisible();
  await expect(scene.getByText(/What you get/)).toBeVisible(); await expect(scene.getByText(/What they expect/)).toBeVisible();
  const box=await scene.boundingBox(); expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x+box.width).toBeLessThanOrEqual(391);
  const title=await scene.locator('h2').textContent();
  await scene.getByRole('button',{name:'Accept Opportunity'}).click();
  await page.evaluate(()=>window.__legacy.saveGame());
  const accepted=await page.evaluate(()=>window.__legacy.game.state.careerOpportunities2.history.filter(x=>x.status==='accepted').length);
  expect(accepted).toBe(1);
  await page.reload();await page.waitForFunction(()=>!!window.__legacy);await page.evaluate(()=>window.__legacy.continueGame());await page.waitForFunction(()=>!!window.__legacy?.game?.state?.careerOpportunities2);
  const persisted=await page.evaluate(()=>({accepted:window.__legacy.game.state.careerOpportunities2.history.filter(x=>x.status==='accepted').length,title:window.__legacy.game.state.careerOpportunities2.history.find(x=>x.status==='accepted')?.title}));
  expect(persisted.accepted).toBe(1);expect(persisted.title).toBe(title);
});
