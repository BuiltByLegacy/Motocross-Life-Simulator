import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PHONE_APPS, phoneApps, canAccess, accessTier, requiresApproval,
} from '../src/systems/phoneHub.js';

test('#73/#34 the app catalog documents sections and cross-links', () => {
  const market = PHONE_APPS.find((a) => a.id === 'marketplace');
  assert.ok(market.sections.includes('search'));
  assert.ok(market.links.includes('garage'));
  const calendar = PHONE_APPS.find((a) => a.id === 'calendar');
  assert.ok(calendar.links.includes('season_planner'));
});

test('#40 access tiers scale with age', () => {
  assert.equal(accessTier({ age: 4 }).id, 'none');
  assert.equal(accessTier({ age: 7 }).id, 'supervised');
  assert.equal(accessTier({ age: 10 }).id, 'basic');
  assert.equal(accessTier({ age: 12 }).id, 'limited');
  assert.equal(accessTier({ age: 16 }).id, 'full');
});

test('#40 parent campaign gets full adult access regardless of kid age', () => {
  assert.equal(accessTier({ age: 6, campaign: 'parent' }).id, 'full');
  assert.equal(canAccess('marketplace', { age: 6, campaign: 'parent' }).ok, true);
});

test('#40 young rider is gated out of marketplace/social; results always open', () => {
  const young = { age: 7, campaign: 'rider' };
  assert.equal(canAccess('marketplace', young).ok, false);
  assert.equal(canAccess('social', young).ok, false);
  assert.equal(canAccess('results', young).ok, true);
  assert.equal(canAccess('memories', young).ok, true);
});

test('#40 teen can browse marketplace but purchases need approval', () => {
  const teen = { age: 14, campaign: 'rider' };
  const acc = canAccess('marketplace', teen);
  assert.equal(acc.ok, true);
  assert.equal(acc.needsApproval, true);
  assert.equal(requiresApproval('marketplace', teen), true);
  // Adult rider: no approval needed
  assert.equal(requiresApproval('marketplace', { age: 19, campaign: 'rider' }), false);
});

test('#73 phoneApps annotates accessibility, lock reasons, and unread badges', () => {
  const apps = phoneApps({ age: 9, campaign: 'rider' }, { news: 3, results: 1 });
  const market = apps.find((a) => a.id === 'marketplace');
  assert.equal(market.accessible, false);
  assert.match(market.lockReason, /age 11/);
  const news = apps.find((a) => a.id === 'news');
  assert.equal(news.accessible, true);
  assert.equal(news.unread, 3);
});

test('unknown app is not accessible', () => {
  assert.equal(canAccess('teleporter', { age: 30 }).ok, false);
});
