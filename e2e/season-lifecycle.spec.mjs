import { test, expect } from '@playwright/test';

test('Season Lifecycle 2.0 proves brief → family plan → season → sponsor opportunity → midseason review → season review', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.waitForFunction(() => !!window.__legacy);

  await page.evaluate(() => {
    localStorage.clear();
    window.__legacy.startGame({ name: 'Lifecycle Rider', depth: 'detailed', birthdate: '2014-05-15', campaign: 'rider', avatar: '🧒', background: null });
  });

  await expect(page.getByTestId('season-lifecycle-brief')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'THE SEASON BRIEF' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

  const recommended = await page.evaluate(() => window.__legacy.game.state.seasonLifecycle.recommendedPosture);
  await page.locator(`[data-posture="${recommended}"]`).click();

  await expect(page.getByTestId('season-lifecycle-family-plan')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'THE FAMILY PLAN' })).toBeVisible();
  await page.getByTestId('family-plan-continue').click();

  await expect(page.getByTestId('ui2-calendar-board')).toBeVisible();
  expect(await page.evaluate(() => window.__legacy.game.state.seasonLifecycle.openingComplete)).toBe(true);

  // Create a deterministic breakout run through the real persisted season state,
  // then let the live finishWeek integration evaluate the in-season sponsor market.
  await page.evaluate(() => {
    const app = window.__legacy;
    const g = app.game;
    g.state.programSet = true;
    g.state.season.results = [1, 2, 3, 4].map((week) => ({ week, race: `Breakout ${week}`, overall: 1, points: 25, dnf: false }));
    g.state.season.bestFinish = 1;
    g.state.season.points = 100;
    app.digest = [];
    app.finishWeek();
  });

  await expect(page.getByTestId('season-lifecycle-sponsor-opportunity')).toBeVisible();
  await expect(page.locator('[data-sponsor-decision="accept"]')).toBeVisible();
  await page.locator('[data-sponsor-decision="accept"]').click();

  await expect(page.getByTestId('season-lifecycle-midseason-review')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'THE SEASON CHANGED' })).toBeVisible();
  await page.getByTestId('midseason-continue').click();

  // Save/reload in the middle of the lifecycle and verify lifecycle decisions persist.
  await page.evaluate(() => window.__legacy.saveGame());
  await page.reload();
  await page.waitForFunction(() => !!window.__legacy);
  await page.evaluate(() => window.__legacy.continueGame());
  await page.waitForFunction(() => !!window.__legacy.game);
  expect(await page.evaluate(() => window.__legacy.game.state.seasonLifecycle.sponsorMarket.offers.length)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.__legacy.game.state.seasonLifecycle.midseason.handledKeys.length)).toBeGreaterThan(0);

  await page.evaluate(() => {
    const app = window.__legacy;
    app.game.state.week = 13;
    app.renderRecap();
  });

  await expect(page.getByTestId('season-lifecycle-season-review')).toBeVisible();
  await expect(page.getByRole('heading', { name: /SEASON REVIEW/ })).toBeVisible();
  await page.getByTestId('season-review-continue').click();

  await expect(page.getByRole('button', { name: /Ride .* — Lifecycle Rider/ })).toBeVisible();
  expect(await page.evaluate(() => !!window.__legacy.game.state.seasonLifecycle.carryover)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
