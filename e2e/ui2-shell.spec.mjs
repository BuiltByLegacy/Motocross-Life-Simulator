import { test, expect } from '@playwright/test';

test('UI 2.0 shell provides focused mobile navigation and responsive width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.waitForFunction(() => !!window.__legacy);
  await page.evaluate(() => {
    localStorage.clear();
    window.__legacy.startGame({ name: 'UI2 Rider', depth: 'detailed', birthdate: '2014-05-15', campaign: 'rider', avatar: '🧒', background: null });
    window.__legacy.tab = 'garage';
    window.__legacy.render();
  });

  const nav = page.getByTestId('ui2-primary-nav');
  await expect(nav).toBeVisible();
  for (const label of ['Home', 'Calendar', 'Career', 'World', 'More']) {
    await expect(nav.getByRole('button', { name: label })).toBeVisible();
  }

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

  await page.getByTestId('ui2-nav-home').click();
  expect(await page.evaluate(() => window.__legacy.tab)).toBe('garage');

  await page.getByTestId('ui2-nav-calendar').click();
  expect(await page.evaluate(() => window.__legacy.tab)).toBe('week');

  await page.getByTestId('ui2-nav-career').click();
  expect(await page.evaluate(() => window.__legacy.tab)).toBe('stats');

  await page.getByTestId('ui2-nav-world').click();
  expect(await page.evaluate(() => window.__legacy.tab)).toBe('phone');

  await page.getByTestId('ui2-nav-more').click();
  await expect(page.getByTestId('ui2-more-sheet')).toBeVisible();
  await page.getByTestId('ui2-more-journal').click();
  expect(await page.evaluate(() => window.__legacy.tab)).toBe('journal');

  await page.setViewportSize({ width: 1280, height: 900 });
  const width = await page.locator('#app').evaluate((node) => node.getBoundingClientRect().width);
  expect(width).toBeGreaterThan(900);
});
