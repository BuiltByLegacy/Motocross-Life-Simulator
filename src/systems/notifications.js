// Phone / Internet Hub — notification queue (issue #74)
// --------------------------------------------------------------------------
// The phone should make the world feel alive. A notification is a timely nudge
// from a source system (calendar deadline, marketplace message, dealer order,
// memory moment, result, family note) that can link back to the record that
// created it. Pure, serializable, UI-ready.

export const NOTIFICATION_PRIORITIES = ['low', 'normal', 'high', 'urgent'];
const PRIORITY_RANK = { urgent: 3, high: 2, normal: 1, low: 0 };

export const NOTIFICATION_SOURCES = [
  'calendar', 'marketplace', 'dealer', 'memory', 'competition', 'family', 'sponsor', 'news', 'garage',
];

let _nseq = 0;
export function newNotificationId() {
  return `ntf_${Date.now().toString(36)}_${(_nseq++).toString(36)}`;
}

// Build a normalized notification record. `day` is the game day-index it was
// raised; `expiresDay` (optional) is when it stops being active.
export function makeNotification({
  id, source = 'news', priority = 'normal', title, body = '',
  actionTarget = null, day = 0, expiresDay = null, icon = null, meta = {},
} = {}) {
  return {
    id: id ?? newNotificationId(),
    source: NOTIFICATION_SOURCES.includes(source) ? source : 'news',
    priority: NOTIFICATION_PRIORITIES.includes(priority) ? priority : 'normal',
    title: title ?? 'Notification',
    body,
    icon,
    actionTarget, // { screen, id } — where tapping the notification goes
    day,
    expiresDay,
    read: false,
    archived: false,
    meta,
  };
}

export class NotificationQueue {
  constructor() {
    this.items = [];
  }

  add(input) {
    const n = input.id && input.source ? input : makeNotification(input);
    this.items.push(n);
    return n;
  }

  // Add only if no unread notification with the same dedupe key exists.
  addOnce(key, input) {
    if (key != null && this.items.some((n) => n.meta?.key === key && !n.archived)) return null;
    return this.add(makeNotification({ ...input, meta: { ...(input.meta ?? {}), key } }));
  }

  get(id) { return this.items.find((n) => n.id === id) ?? null; }

  markRead(id) { const n = this.get(id); if (n) n.read = true; return !!n; }
  markAllRead(source = null) {
    let n = 0;
    for (const it of this.items) if (!it.read && (!source || it.source === source)) { it.read = true; n++; }
    return n;
  }
  archive(id) { const n = this.get(id); if (n) n.archived = true; return !!n; }

  // Drop expired notifications to the archive at a given day.
  expire(atDay) {
    let n = 0;
    for (const it of this.items) {
      if (!it.archived && it.expiresDay != null && it.expiresDay < atDay) { it.archived = true; n++; }
    }
    return n;
  }

  // Active (non-archived, non-expired) notifications, newest+highest first.
  active(atDay = Infinity) {
    return this._sort(this.items.filter((n) => !n.archived && (n.expiresDay == null || n.expiresDay >= atDay)));
  }
  archivedItems() { return this._sort(this.items.filter((n) => n.archived)); }
  bySource(source, atDay = Infinity) { return this.active(atDay).filter((n) => n.source === source); }

  unreadCount(atDay = Infinity) { return this.active(atDay).filter((n) => !n.read).length; }
  unreadBySource(atDay = Infinity) {
    const m = {};
    for (const n of this.active(atDay)) if (!n.read) m[n.source] = (m[n.source] ?? 0) + 1;
    return m;
  }

  // Priority first (urgent→low), then most recent, then id for stability.
  _sort(list) {
    return [...list].sort((a, b) =>
      PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority] ||
      (b.day ?? 0) - (a.day ?? 0) ||
      String(b.id).localeCompare(String(a.id)),
    );
  }

  toJSON() { return { items: this.items }; }
  static fromJSON(data) { const q = new NotificationQueue(); q.items = data?.items ?? []; return q; }
}
