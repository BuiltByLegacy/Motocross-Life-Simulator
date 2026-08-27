import { test, expect } from '@playwright/test';

test('Sponsorship 2.0 survives preseason, calendar, garage, save/reload and renewal branches', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  await page.waitForFunction(() => !!window.__legacy);

  await page.evaluate(() => {
    const app = window.__legacy;
    app.startGame({
      name: 'E2E Rider', depth: 'detailed', birthdate: '2014-05-15',
      campaign: 'rider', avatar: '🧒', background: null,
    });
    app.game.family.money = 50;
    app._programSel = { ...(app.game.state.program ?? {}) };
    app.confirmProgram(false);
  });

  await expect(page.getByText('Fund the season before you commit')).toBeVisible();
  const initial = await page.evaluate(() => ({
    phase: window.__legacy.game.state.sponsorship2.preseason.phase,
    gap: window.__legacy.game.state.sponsorship2.preseason.lastBudget?.fundingGap ?? 0,
  }));
  expect(initial.phase).toBe('funding');
  expect(initial.gap).toBeGreaterThan(0);

  await page.evaluate(async () => {
    const app = window.__legacy;
    const s2 = await import('/src/systems/sponsorship2.js');
    let state = app.game.state.sponsorship2;
    state.pursuit.responses.push({
      sponsorId: 'declined-local', sponsorName: 'Declined Local Shop', seasonYear: app.game.seasonYear,
      type: 'decline', fitScore: 22, support: { cash: 0, productValue: 0, contingency: 0 },
    });

    const base = {
      id: 'offer-e2e-counter', sponsorId: 'e2e-graphics-counter', sponsorName: 'Counter Graphics',
      category: 'graphics', tier: 2, seasonYear: app.game.seasonYear, status: 'draft', leverage: 72,
      guardianRequired: true, guardianApproved: false,
      package: { cashRetainer: 350, productCredit: 250, discountPercent: 10, entryFeeSupport: 75, travelSupport: 25, contingency: 100, performanceBonuses: {} },
      obligations: [
        { type: 'graphics-placement', label: 'Run Counter graphics', required: true, slot: 'rear-fender' },
        { type: 'content', label: 'Post Counter reveal', required: true },
      ],
      exclusivity: [], negotiationRound: 0, sourceResponseType: 'mixed-support',
    };
    const countered = s2.counterOffer(state, base, { cashRetainer: 425, discountPercent: 15 }, {
      rider: { age: app.game.rider.age, results: 75, reputation: 70, professionalism: 90, visibility: 60 },
      relationship: 65, careerSeed: '349-browser-counter',
    });
    state = countered.state;
    state.pursuit.responses.push({
      sponsorId: base.sponsorId, sponsorName: base.sponsorName, seasonYear: app.game.seasonYear,
      type: 'mixed-support', fitScore: 82, support: { cash: 350, productValue: 250, contingency: 100 },
    });

    const signable = {
      id: 'offer-e2e-sign', sponsorId: 'e2e-graphics', sponsorName: 'E2E Graphics',
      category: 'graphics', tier: 3, seasonYear: app.game.seasonYear, status: 'draft', leverage: 88,
      guardianRequired: true, guardianApproved: false,
      package: { cashRetainer: 900, productCredit: 500, discountPercent: 20, entryFeeSupport: 200, travelSupport: 150, contingency: 250, performanceBonuses: {} },
      obligations: [
        { type: 'minimum-races', label: 'Attend four race weekends', required: true, target: 4 },
        { type: 'graphics-placement', label: 'Run E2E Graphics on shrouds', required: true, slot: 'bike-shrouds' },
        { type: 'content', label: 'Post season graphics reveal', required: true },
        { type: 'appearance', label: 'Dealer autograph session', required: true },
        { type: 'product-use', label: 'Use E2E graphics kit', required: true, productCategory: 'graphics' },
      ],
      exclusivity: ['graphics'], negotiationRound: 0, sourceResponseType: 'mixed-support',
    };
    state.uiOffers = [countered.offer, signable];
    app.game.state.sponsorship2 = state;
    app.saveGame();
    app.render();
  });

  await expect(page.getByText('Declined Local Shop: decline')).toBeVisible();
  await expect(page.getByText('Counter Graphics')).toBeVisible();
  await expect(page.getByText('E2E Graphics')).toBeVisible();

  const signCard = page.locator('.card').filter({ hasText: 'E2E Graphics' }).last();
  await signCard.getByRole('button', { name: /Parent approves & sign/ }).click();
  await expect(signCard.getByText('Contract signed')).toBeVisible();

  const signed = await page.evaluate(() => ({
    contracts: window.__legacy.game.state.sponsorship2.contracts.length,
    obligations: window.__legacy.game.state.sponsorship2.obligations.length,
    guardian: window.__legacy.game.state.sponsorship2.contracts.at(-1)?.guardianApproved,
    offers: window.__legacy.game.state.sponsorship2.uiOffers.length,
  }));
  expect(signed.contracts).toBeGreaterThan(0);
  expect(signed.obligations).toBeGreaterThan(0);
  expect(signed.guardian).toBe(true);

  await page.getByRole('button', { name: /Revise race schedule/ }).click();
  await page.evaluate(() => window.__legacy.confirmProgram(false));
  await expect(page.getByText('Fund the season before you commit')).toBeVisible();
  const revised = await page.evaluate(() => ({
    phase: window.__legacy.game.state.sponsorship2.preseason.phase,
    contracts: window.__legacy.game.state.sponsorship2.contracts.length,
    offers: window.__legacy.game.state.sponsorship2.uiOffers.length,
    tab: window.__legacy.tab,
  }));
  expect(revised.phase).toBe('funding');
  expect(revised.contracts).toBe(signed.contracts);
  expect(revised.offers).toBe(signed.offers);
  expect(revised.tab).toBe('sponsors');

  await page.getByRole('button', { name: /Lock season/ }).click();
  const lockedPhase = await page.evaluate(() => window.__legacy.game.state.sponsorship2.preseason.phase);
  expect(lockedPhase).toBe('locked');

  await page.evaluate(() => {
    const app = window.__legacy;
    app.tab = 'week'; app._seasonView = true; app.render();
  });
  await expect(page.locator('[data-s2-calendar="agenda"]')).toBeVisible();
  await expect(page.locator('[data-s2-obligation-id]').first()).toContainText('E2E Graphics');

  const pending = page.locator('[data-s2-obligation-id]').filter({ has: page.locator('[data-s2-action="fulfill"]') });
  expect(await pending.count()).toBeGreaterThanOrEqual(2);
  await pending.nth(0).locator('[data-s2-action="fulfill"]').click();
  const remaining = page.locator('[data-s2-obligation-id]').filter({ has: page.locator('[data-s2-action="miss"]') });
  await remaining.nth(0).locator('[data-s2-action="miss"]').click();
  const outcomes = await page.evaluate(() => window.__legacy.game.state.sponsorship2.obligations.map((o) => o.status));
  expect(outcomes).toContain('fulfilled');
  expect(outcomes).toContain('missed');

  await page.evaluate(() => { window.__legacy.tab = 'garage'; window.__legacy.render(); });
  const garage = page.locator('[data-s2-garage="brand-compliance"]');
  await expect(garage).toBeVisible();
  await expect(garage).toContainText('Sponsor setup needs attention');
  await garage.locator('[data-s2-action="apply-brand"]').first().click();
  await page.locator('[data-s2-action="use-product"]').first().click();
  await expect(page.locator('[data-s2-garage="brand-compliance"]')).toContainText('Bike & gear are sponsor-ready');

  await page.evaluate(() => {
    const s = window.__legacy.game.state.sponsorship2;
    s.installedSponsorProducts = [{ id: 'rival-kit', category: 'graphics', brandId: 'rival-brand' }];
    window.__legacy.saveGame(); window.__legacy.render();
  });
  await expect(page.locator('[data-s2-brand-violation]')).toBeVisible();
  await page.locator('[data-s2-brand-violation]').getByRole('button', { name: 'Fix conflict' }).click();
  await expect(page.locator('[data-s2-brand-violation]')).toHaveCount(0);

  const beforeReload = await page.evaluate(() => {
    window.__legacy.saveGame();
    const s = window.__legacy.game.state.sponsorship2;
    return { contractId: s.contracts[0].id, obligationCount: s.obligations.length, historyCount: s.offerHistory.length };
  });
  await page.reload();
  await page.waitForFunction(() => !!window.__legacy?.game?.state?.sponsorship2);
  const afterReload = await page.evaluate(() => {
    const s = window.__legacy.game.state.sponsorship2;
    return { contractId: s.contracts[0].id, obligationCount: s.obligations.length, historyCount: s.offerHistory.length };
  });
  expect(afterReload).toEqual(beforeReload);

  const decisions = await page.evaluate(async () => {
    const mod = await import('/src/systems/sponsorship2.js');
    const source = window.__legacy.game.state.sponsorship2;
    const contractId = source.contracts[0].id;

    let positive = structuredClone(source);
    positive.obligations = positive.obligations.map((o) => o.contractId === contractId && o.required ? { ...o, status: 'fulfilled' } : o);
    const good = mod.evaluateSponsorRelationship(positive, contractId, { performance: 95, professionalism: 96, visibility: 92, installedProducts: [] });
    const goodDecision = mod.endSeasonSponsorDecision(good.state, contractId, { nextSeasonYear: source.seasonYear + 1 }).decision;

    let negative = structuredClone(source);
    negative.obligations = negative.obligations.map((o) => o.contractId === contractId && o.required ? { ...o, status: 'violated' } : o);
    const bad = mod.evaluateSponsorRelationship(negative, contractId, { performance: 18, professionalism: 15, visibility: 20, severeConductBreach: true, conductViolations: 4 });
    const badDecision = mod.endSeasonSponsorDecision(bad.state, contractId, { nextSeasonYear: source.seasonYear + 1 }).decision;
    return { goodDecision, badDecision };
  });
  expect(['upgrade', 'renew-plus-referral', 'renew']).toContain(decisions.goodDecision);
  expect(decisions.badDecision).toBe('lost');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => { window.__legacy.tab = 'week'; window.__legacy._seasonView = true; window.__legacy.render(); });
  const calendarBox = await page.locator('[data-s2-calendar="agenda"]').boundingBox();
  expect(calendarBox).not.toBeNull();
  expect(calendarBox.x).toBeGreaterThanOrEqual(0);
  expect(calendarBox.x + calendarBox.width).toBeLessThanOrEqual(391);

  await page.evaluate(() => { window.__legacy.tab = 'garage'; window.__legacy._seasonView = false; window.__legacy.render(); });
  const garageBox = await page.locator('[data-s2-garage="brand-compliance"]').boundingBox();
  expect(garageBox).not.toBeNull();
  expect(garageBox.x).toBeGreaterThanOrEqual(0);
  expect(garageBox.x + garageBox.width).toBeLessThanOrEqual(391);
});
