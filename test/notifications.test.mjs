import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NotificationQueue, makeNotification, NOTIFICATION_PRIORITIES } from '../src/systems/notifications.js';

test('#74 notification has source, priority, timestamp, read state, action target', () => {
  const n = makeNotification({ source: 'calendar', priority: 'high', title: 'Registration closes', body: 'Southwick in 3 days', actionTarget: { screen: 'calendar', id: 'e1' }, day: 20, expiresDay: 26 });
  assert.equal(n.source, 'calendar');
  assert.equal(n.priority, 'high');
  assert.equal(n.read, false);
  assert.equal(n.archived, false);
  assert.deepEqual(n.actionTarget, { screen: 'calendar', id: 'e1' });
  assert.equal(n.day, 20);
});

test('#74 invalid source/priority fall back to defaults', () => {
  const n = makeNotification({ source: 'aliens', priority: 'cosmic', title: 'x' });
  assert.equal(n.source, 'news');
  assert.equal(n.priority, 'normal');
});

test('#74 queue sorts by priority then recency', () => {
  const q = new NotificationQueue();
  q.add({ source: 'news', priority: 'low', title: 'A', day: 5 });
  q.add({ source: 'marketplace', priority: 'urgent', title: 'B', day: 1 });
  q.add({ source: 'calendar', priority: 'high', title: 'C', day: 10 });
  q.add({ source: 'family', priority: 'high', title: 'D', day: 12 });
  const order = q.active().map((n) => n.title);
  assert.deepEqual(order, ['B', 'D', 'C', 'A']); // urgent, then high(newest first), then low
});

test('#74 read state + unread counts by source', () => {
  const q = new NotificationQueue();
  const a = q.add({ source: 'marketplace', title: 'offer', day: 1 });
  q.add({ source: 'marketplace', title: 'price drop', day: 2 });
  q.add({ source: 'calendar', title: 'deadline', day: 3 });
  assert.equal(q.unreadCount(), 3);
  q.markRead(a.id);
  assert.equal(q.unreadCount(), 2);
  assert.deepEqual(q.unreadBySource(), { marketplace: 1, calendar: 1 });
  assert.equal(q.markAllRead('marketplace'), 1);
  assert.equal(q.unreadCount(), 1);
});

test('#74 expiration archives stale notifications', () => {
  const q = new NotificationQueue();
  q.add({ source: 'calendar', title: 'past', day: 1, expiresDay: 5 });
  q.add({ source: 'calendar', title: 'future', day: 1, expiresDay: 30 });
  assert.equal(q.active(10).length, 1); // one already past its expiry
  assert.equal(q.expire(10), 1);
  assert.equal(q.archivedItems().length, 1);
});

test('#74 addOnce dedupes by key while unread', () => {
  const q = new NotificationQueue();
  assert.ok(q.addOnce('deadline_e1', { source: 'calendar', title: 'closes' }));
  assert.equal(q.addOnce('deadline_e1', { source: 'calendar', title: 'closes' }), null);
  assert.equal(q.active().length, 1);
});

test('#74 queue serializes', () => {
  const q = new NotificationQueue();
  q.add({ source: 'memory', title: 'First Win', day: 7 });
  const restored = NotificationQueue.fromJSON(JSON.parse(JSON.stringify(q.toJSON())));
  assert.equal(restored.active().length, 1);
  assert.equal(restored.unreadCount(), 1);
});

test('priorities are the documented set', () => {
  assert.deepEqual(NOTIFICATION_PRIORITIES, ['low', 'normal', 'high', 'urgent']);
});
