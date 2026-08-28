import { test, expect } from '@playwright/test';

test('deployed GitHub Pages build boots Sponsorship 2.0 on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  // Use a relative navigation so GitHub Pages keeps the repository subpath.
  await page.goto('./');
  await page.waitForFunction(() => !!window.__legacy);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => !!window.__legacy);

  await page.evaluate(() => {
    const app = window.__legacy;
    app.startGame({
      name: 'Pages Smoke Rider',
      depth: 'detailed',
      birthdate: '2014-05-15',
      campaign: 'rider',
      avatar: '🧒',
      background: null,
    });
    app.game.family.money = 50;
    app._programSel = { ...(app.game.state.program ?? {}) };
    app.confirmProgram(false);
  });

  await expect(page.getByText('Fund the season before you commit')).toBeVisible();
  const state = await page.evaluate(() => ({
    phase: window.__legacy.game.state.sponsorship2.preseason.phase,
    hasGap: (window.__legacy.game.state.sponsorship2.preseason.lastBudget?.fundingGap ?? 0) > 0,
    viewport: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(state.phase).toBe('funding');
  expect(state.hasGap).toBe(true);
  expect(state.scrollWidth).toBeLessThanOrEqual(state.viewport + 1);
});
