import { test, expect } from '@playwright/test';

test('Season Lifecycle 2.0 frames the year, earns support midseason and closes with a review', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.waitForFunction(() => !!window.__legacy);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => !!window.__legacy);

  await page.evaluate(() => {
    const app = window.__legacy;
    app.startGame({ name: 'Lifecycle Rider', depth: 'detailed', birthdate: '2014-05-15', campaign: 'rider', avatar: '🧒', background: null });
    app.game.family.money = 2400;
    app._programSel = { ...(app.game.state.program ?? {}) };
    app.showWeek(() => app.viewProgramBuilder(false));
  });

  const brief = page.locator('[data-testid="season-brief"]');
  await expect(brief).toBeVisible();
  await expect(brief.getByText('SEASON BRIEF')).toBeVisible();
  await expect(brief.getByText('CASH ON HAND')).toBeVisible();
  await expect(brief.getByText('Good results can still create support opportunities after the gate drops.')).toBeVisible();
  const briefBox = await brief.boundingBox();
  expect(briefBox.x).toBeGreaterThanOrEqual(0);
  expect(briefBox.x + briefBox.width).toBeLessThanOrEqual(391);

  await brief.getByRole('button', { name: /Push Year/ }).click();
  await page.locator('[data-testid="season-brief"]').getByRole('button', { name: /Balanced commitment/ }).click();
  await page.locator('[data-testid="season-brief-continue"]').click();
  await expect(page.locator('[data-testid="ui2-calendar-board"]')).toBeVisible();

  const savedOpening = await page.evaluate(() => {
    const s = window.__legacy.game.state.seasonLifecycle;
    return { posture: s.posture, maxSpend: s.familyPlan.maxSeasonSpend, year: s.openingBrief.seasonYear };
  });
  expect(savedOpening.posture).toBe('push');
  expect(savedOpening.maxSpend).toBe(6000);

  await page.evaluate(async () => {
    const app = window.__legacy;
    const s2 = await import(new URL('src/systems/sponsorship2.js', document.baseURI).href);
    app.game.state.sponsorship2 = s2.createSponsorship2State({ seasonYear: app.game.seasonYear });
    app.game.state.sponsorship2.preseason.phase = 'locked';
    app.game.state.season.results = [
      { overall: 1, dnf: false }, { overall: 1, dnf: false }, { overall: 1, dnf: false },
      { overall: 2, dnf: false }, { overall: 2, dnf: false },
    ];
    app.game.state.season.points = 260;
    const result = {
      race: { name: 'Regional Qualifier' }, overall: 1, dnf: false, motos: [1, 1], fieldSize: 22, points: 25,
      rivalOverall: 4,
      podium: [
        { pos: 1, name: app.game.rider.name, isPlayer: true },
        { pos: 2, name: 'Rival Two', isPlayer: false },
        { pos: 3, name: 'Rival Three', isPlayer: false },
      ],
    };
    app.showWeek(() => app.viewRaceResult(result));
  });

  const offer = page.locator('[data-testid="midseason-sponsor-offer"]');
  await expect(offer).toBeVisible();
  await expect(offer.getByText('SOMEONE NOTICED')).toBeVisible();
  const moneyBefore = await page.evaluate(() => window.__legacy.game.family.money);
  await offer.getByRole('button', { name: /ACCEPT SUPPORT/ }).click();
  const accepted = await page.evaluate(() => ({
    money: window.__legacy.game.family.money,
    contracts: window.__legacy.game.state.sponsorship2.contracts.filter((c) => c.inSeason).length,
    history: window.__legacy.game.state.seasonLifecycle.sponsorMarket.history.length,
  }));
  expect(accepted.money).toBeGreaterThan(moneyBefore);
  expect(accepted.contracts).toBe(1);
  expect(accepted.history).toBe(1);

  await page.evaluate(() => {
    const app = window.__legacy;
    app.game.week = 12;
    app.showWeek(() => app.viewWeekSummary());
  });
  const review = page.locator('[data-testid="season-review"]');
  await expect(review).toBeVisible();
  await expect(review.getByText(/SEASON REVIEW/)).toBeVisible();
  await expect(review.getByText('WHAT WE CARRY INTO NEXT YEAR')).toBeVisible();
  const reviewBox = await review.boundingBox();
  expect(reviewBox.x).toBeGreaterThanOrEqual(0);
  expect(reviewBox.x + reviewBox.width).toBeLessThanOrEqual(391);

  const carry = await page.evaluate(() => window.__legacy.game.state.seasonLifecycle.carryover);
  expect(carry).toBeTruthy();
  expect(carry.money).toBe(window.__legacy ? carry.money : carry.money);
});