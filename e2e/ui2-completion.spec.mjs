import { test, expect } from '@playwright/test';

async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
}

test('new career onboarding enters the Season Brief on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.waitForFunction(() => !!window.__legacy);
  await page.evaluate(() => { localStorage.clear(); window.__legacy.onboard = null; window.__legacy.renderTitle(); });

  await expect(page.getByTestId('ui2-onboarding')).toBeVisible();
  await page.getByTestId('ui2-start-rider').click();
  await page.getByTestId('ui2-rider-name').fill('Avery');
  await page.getByTestId('ui2-onboard-next-background').click();
  await page.getByTestId('ui2-onboard-next-depth').click();
  await page.getByTestId('ui2-begin-career').click();

  await expect(page.getByTestId('season-lifecycle-brief')).toBeVisible();
  await noOverflow(page);
});

test('Career is a record book and World is a coherent ecosystem', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.waitForFunction(() => !!window.__legacy);
  await page.evaluate(() => {
    localStorage.clear();
    window.__legacy.startGame({ name: 'Casey', depth: 'detailed', birthdate: '2010-05-15', campaign: 'parent', avatar: '🧒', background: 'working_class' });
    window.__legacy.tab = 'stats';
    window.__legacy.render();
  });

  await expect(page.getByTestId('ui2-career')).toBeVisible();
  await expect(page.getByTestId('ui2-career-season')).toBeVisible();
  await expect(page.getByTestId('ui2-career-support')).toBeVisible();
  await expect(page.getByTestId('ui2-career-history')).toBeVisible();
  await noOverflow(page);

  await page.getByTestId('ui2-career-sponsors').click();
  await expect(page.getByTestId('ui2-nav-career')).toHaveAttribute('aria-current', 'page');

  await page.getByTestId('ui2-nav-world').click();
  await expect(page.getByTestId('ui2-world')).toBeVisible();
  await page.getByTestId('ui2-world-open-people').click();
  await expect(page.getByTestId('ui2-world-people')).toBeVisible();
  await expect(page.getByTestId('ui2-nav-world')).toHaveAttribute('aria-current', 'page');
  await noOverflow(page);

  await page.getByRole('button', { name: '‹ World' }).click();
  await page.getByTestId('ui2-world-open-history').click();
  await expect(page.getByTestId('ui2-world-history')).toBeVisible();

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole('button', { name: '‹ World' }).click();
  const columns = await page.getByTestId('ui2-world').locator('.ui2-world-grid').evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(' ').length);
  expect(columns).toBeGreaterThanOrEqual(2);
  await noOverflow(page);
});
