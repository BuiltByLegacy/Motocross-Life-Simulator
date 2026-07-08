// Memory Engine — asset provenance & ownership history (issue #69)
// --------------------------------------------------------------------------
// Everything has history. A used bike, a cracked number plate, a hand-me-down
// part — each carries a story that can follow a rider for years. This models a
// stable Asset ID, optional serial number, an immutable-ish ownership chain
// (purchase, sale, gift, trade, inheritance), acquisition source, and links to
// memory records.

export const TRANSFER_TYPES = ['purchase', 'sale', 'gift', 'trade', 'inheritance', 'found', 'manufactured'];

let _assetSeq = 0;
export function newAssetId(prefix = 'asset') {
  return `${prefix}_${Date.now().toString(36)}_${(_assetSeq++).toString(36)}`;
}

// Create a provenance record for an object. `assetId` is stable and should not
// change once assigned; everything else accretes over the object's life.
export function makeProvenance({
  assetId = newAssetId(), kind = 'object', name = '', serial = null,
  acquiredVia = 'purchase', from = null, year = null, price = null,
} = {}) {
  return {
    assetId,
    kind, // bike | part | trophy | gear | object
    name,
    serial,
    createdYear: year,
    ownership: [
      // The first link: how it entered this rider's world.
      { type: normalizeType(acquiredVia), from, to: 'me', year, price, note: '' },
    ],
    memories: [], // linked memory ids (#69 -> memory records)
  };
}

function normalizeType(t) {
  return TRANSFER_TYPES.includes(t) ? t : 'purchase';
}

// Record an ownership transfer (in or out). Returns the appended entry.
export function recordTransfer(prov, { type, from = null, to = null, year = null, price = null, note = '' } = {}) {
  const entry = { type: normalizeType(type), from, to, year, price, note };
  prov.ownership.push(entry);
  return entry;
}

// Link a memory record to an asset (both directions are the caller's job).
export function linkMemory(prov, memoryId) {
  if (memoryId && !prov.memories.includes(memoryId)) prov.memories.push(memoryId);
  return prov;
}

// Provenance queries (#69).
export function currentOwner(prov) {
  // The most recent transfer's `to` is the current holder.
  for (let i = prov.ownership.length - 1; i >= 0; i--) {
    if (prov.ownership[i].to) return prov.ownership[i].to;
  }
  return null;
}

export function ownerHistory(prov) {
  // Ordered list of everyone who has held the asset.
  const chain = [];
  for (const t of prov.ownership) {
    if (t.from && !chain.includes(t.from)) chain.push(t.from);
    if (t.to && !chain.includes(t.to)) chain.push(t.to);
  }
  return chain;
}

export function isOwnedByMe(prov) {
  return currentOwner(prov) === 'me';
}

// A short, human-readable provenance line for UI ("2nd owner · bought used 2026").
export function provenanceSummary(prov) {
  const acquire = prov.ownership[0];
  const owners = ownerHistory(prov).filter((o) => o !== 'me').length;
  const label = {
    purchase: 'bought', sale: 'sold', gift: 'gifted', trade: 'traded for',
    inheritance: 'inherited', found: 'found', manufactured: 'bought new',
  }[acquire?.type] ?? 'acquired';
  const hand = owners >= 1 ? `${ordinal(owners + 1)} owner` : 'first owner';
  const yr = acquire?.year ? ` · ${label} ${acquire.year}` : ` · ${label}`;
  return `${hand}${yr}`;
}

// Registry of provenance records keyed by Asset ID (serializable).
export class AssetRegistry {
  constructor() { this.byId = {}; }

  add(prov) { this.byId[prov.assetId] = prov; return prov; }
  get(assetId) { return this.byId[assetId] ?? null; }
  // Ensure a provenance record exists for an asset-bearing object.
  ensure(obj, { kind = 'object' } = {}) {
    if (!obj.assetId) obj.assetId = newAssetId(kind);
    if (!this.byId[obj.assetId]) {
      this.add(makeProvenance({ assetId: obj.assetId, kind, name: obj.name ?? obj.klass ?? '', serial: obj.serial ?? null, year: obj.year ?? null }));
    }
    return this.byId[obj.assetId];
  }
  all() { return Object.values(this.byId); }

  toJSON() { return { byId: this.byId }; }
  static fromJSON(data) { const r = new AssetRegistry(); r.byId = data?.byId ?? {}; return r; }
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}
