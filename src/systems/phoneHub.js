// Phone / Internet Hub — information architecture + access (issues #73, #34, #40)
// --------------------------------------------------------------------------
// The phone is the rider's connection to the motocross world, not a generic
// menu. This defines the app catalog and its data responsibilities (#73/#34)
// and the age/role access model that gates what a young rider can reach (#40).
//
// Pure and data-driven: the UI reads `phoneApps(ctx)` to lay out the home
// screen and `canAccess(app, ctx)` to gate taps.

// Every app in the hub, with the sections/data it is responsible for and the
// systems it cross-links to (#73). `min` is the youngest age (rider mode) that
// gets any access; `approval` marks flows that still need a parent's yes.
export const PHONE_APPS = [
  { id: 'calendar', name: 'Calendar', icon: '📅', min: 0, sections: ['upcoming', 'deadlines', 'season plan'], links: ['season_planner', 'lorettas'], desc: 'Events, registration deadlines, and your season plan.' },
  { id: 'messages', name: 'Messages', icon: '💬', min: 8, sections: ['family', 'coach', 'sponsor', 'sellers', 'rivals'], links: ['relationships', 'marketplace', 'sponsors'], desc: 'Threads with the people in your world.' },
  { id: 'marketplace', name: 'Marketplace', icon: '🛒', min: 11, approval: true, sections: ['browse', 'search', 'saved', 'watching', 'offers'], links: ['garage', 'assets'], desc: 'Used bikes, parts, and gear from private sellers.' },
  { id: 'dealer', name: 'Dealer', icon: '🏪', min: 11, approval: true, sections: ['oem parts', 'gear', 'orders'], links: ['garage', 'sponsors'], desc: 'New OEM parts and gear, ordered to the garage.' },
  { id: 'garage', name: 'Garage', icon: '🔧', min: 6, sections: ['bikes', 'parts', 'maintenance', 'inventory'], links: ['assets', 'memory'], desc: 'Your bikes, parts, hours, and what needs attention.' },
  { id: 'results', name: 'Results', icon: '🏁', min: 0, sections: ['latest', 'standings', 'season'], links: ['competition'], desc: 'Finishes, points, and championship standings.' },
  { id: 'memories', name: 'Memories', icon: '💭', min: 0, sections: ['career', 'family', 'bikes'], links: ['memory'], desc: 'The story you are building, moment by moment.' },
  { id: 'news', name: 'MotoNews', icon: '🗞️', min: 0, sections: ['results', 'signings', 'weather', 'trends'], links: ['world'], desc: 'What is happening around the sport.' },
  { id: 'social', name: 'Social', icon: '📱', min: 13, sections: ['feed', 'post', 'followers'], links: ['sponsors', 'relationships'], desc: 'Post, follow riders, build sponsor value — and drama.' },
];

// Access tiers by age (#40). Parent mode gets full adult access from the start.
export const ACCESS_TIERS = [
  { id: 'none', label: 'No phone', maxAge: 5 },
  { id: 'supervised', label: 'Parent shows you things', maxAge: 7 },
  { id: 'basic', label: 'Family tablet', maxAge: 10 },
  { id: 'limited', label: 'Basic phone', maxAge: 12 },
  { id: 'full', label: 'Full phone', maxAge: Infinity },
];

// Resolve the access tier for a context { age, campaign }.
export function accessTier({ age = 10, campaign = 'rider' } = {}) {
  if (campaign === 'parent') return ACCESS_TIERS[ACCESS_TIERS.length - 1]; // full adult access
  return ACCESS_TIERS.find((t) => age <= t.maxAge) ?? ACCESS_TIERS[ACCESS_TIERS.length - 1];
}

// Can this context open an app? Returns { ok, reason, needsApproval }.
export function canAccess(app, ctx = {}) {
  const a = typeof app === 'string' ? PHONE_APPS.find((x) => x.id === app) : app;
  if (!a) return { ok: false, reason: 'Unknown app.', needsApproval: false };
  if (ctx.campaign === 'parent') return { ok: true, reason: null, needsApproval: false };
  const age = ctx.age ?? 10;
  if (age < a.min) {
    return { ok: false, reason: `${a.name} unlocks at age ${a.min}. For now, a parent handles this.`, needsApproval: false };
  }
  // Teens can browse but big purchases still need a parent's yes.
  const needsApproval = !!a.approval && age < 18;
  return { ok: true, reason: null, needsApproval };
}

// The apps available on the home screen for a context, each annotated with
// access + unread badge (badges supplied by the caller from the queue).
export function phoneApps(ctx = {}, badges = {}) {
  const tier = accessTier(ctx);
  return PHONE_APPS.map((app) => {
    const access = canAccess(app, ctx);
    return {
      ...app,
      accessible: access.ok,
      needsApproval: access.needsApproval,
      lockReason: access.ok ? null : access.reason,
      unread: badges[app.id] ?? 0,
      tier: tier.id,
    };
  });
}

// Whether a purchase in `app` requires parent approval before it commits (#40).
export function requiresApproval(app, ctx = {}) {
  return canAccess(app, ctx).needsApproval;
}
