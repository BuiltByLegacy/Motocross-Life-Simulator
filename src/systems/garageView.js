// Garage & Phone UI — inventory view models + listing flow (issues #75, #76)
// --------------------------------------------------------------------------
// The garage is where history becomes visible. These pure functions aggregate
// asset records, provenance, install state, compatibility, and linked memories
// into concise UI-facing view models (#75), and turn owned assets into
// marketplace listing drafts that preserve provenance (#76).

import { provenanceSummary, ownerHistory, recordTransfer } from './assetProvenance.js';

export const INVENTORY_STATES = ['installed', 'stored', 'listed', 'ordered', 'sold'];
export const LISTING_STATES = ['draft', 'listed', 'sold', 'cancelled'];

// Count memories that reference an asset (via entity links or provenance).
function memoryCountFor(assetId, prov, memories) {
  const linked = new Set(prov?.memories ?? []);
  for (const m of memories) {
    if ((m.entities ?? []).some((e) => e.id === assetId)) linked.add(m.id);
  }
  return linked.size;
}

// One bike view model (#75).
export function bikeViewModel(bike, { registry, memories = [], activeBikeId = null } = {}) {
  const prov = registry?.get(bike.assetId) ?? null;
  return {
    assetId: bike.assetId,
    kind: 'bike',
    name: bike.name ?? bike.klass,
    klass: bike.klass,
    serial: prov?.serial ?? bike.serial ?? null,
    condition: bike.condition ?? null,
    reliability: bike.reliability ?? null,
    state: bike.assetId === activeBikeId ? 'installed' : (bike.forSale ? 'listed' : 'stored'),
    role: bike.role ?? null,
    provenance: prov ? provenanceSummary(prov) : null,
    owners: prov ? ownerHistory(prov).length : 1,
    memoryCount: memoryCountFor(bike.assetId, prov, memories),
    // A bike's compatible part families, for parts fitment (#35 groundwork).
    compatible: bike.compatible ?? { klass: bike.klass, year: bike.year ?? null },
  };
}

// One object/part/gear view model (#75).
export function objectViewModel(obj, { registry, memories = [], kind = 'object' } = {}) {
  const prov = obj.assetId ? registry?.get(obj.assetId) ?? null : null;
  return {
    assetId: obj.assetId ?? null,
    kind: obj.kind ?? kind,
    name: obj.name,
    serial: prov?.serial ?? obj.serial ?? null,
    condition: obj.condition ?? null,
    state: obj.installed ? 'installed' : obj.forSale ? 'listed' : obj.ordered ? 'ordered' : 'stored',
    note: obj.memory ?? obj.note ?? null,
    fits: obj.fits ?? null, // compatibility target, if a part
    provenance: prov ? provenanceSummary(prov) : null,
    memoryCount: obj.assetId ? memoryCountFor(obj.assetId, prov, memories) : 0,
  };
}

// The whole garage as UI-ready view models (#75).
export function buildGarageView({ bikes = [], objects = [], parts = [], activeBike = null, registry = null, memories = [] } = {}) {
  const allBikes = activeBike ? [activeBike, ...bikes] : bikes;
  const activeBikeId = activeBike?.assetId ?? null;
  const bikeVMs = allBikes.map((b) => bikeViewModel(b, { registry, memories, activeBikeId }));
  const objectVMs = objects.map((o) => objectViewModel(o, { registry, memories, kind: 'object' }));
  const partVMs = parts.map((p) => objectViewModel(p, { registry, memories, kind: 'part' }));
  return {
    bikes: bikeVMs,
    objects: objectVMs,
    parts: partVMs,
    counts: {
      bikes: bikeVMs.length,
      objects: objectVMs.length,
      parts: partVMs.length,
      installed: bikeVMs.filter((b) => b.state === 'installed').length,
      listed: [...bikeVMs, ...objectVMs, ...partVMs].filter((v) => v.state === 'listed').length,
      withMemories: [...bikeVMs, ...objectVMs, ...partVMs].filter((v) => v.memoryCount > 0).length,
    },
  };
}

// ---- #76 garage → marketplace listing flow -------------------------------
let _lseq = 0;
function listingId() { return `list_${Date.now().toString(36)}_${(_lseq++).toString(36)}`; }

// Turn an owned asset into a listing draft, preserving provenance + memory
// references. `asset` is the garage object; `prov` its provenance record.
export function makeListingDraft(asset, { prov = null, askingPrice = 0, conditionNotes = '', sellerId = 'me' } = {}) {
  return {
    id: listingId(),
    assetId: asset.assetId ?? null,
    serial: prov?.serial ?? asset.serial ?? null,
    name: asset.name ?? asset.klass ?? 'Item',
    kind: asset.kind ?? (asset.klass ? 'bike' : 'object'),
    klass: asset.klass ?? null,
    condition: asset.condition ?? null,
    askingPrice: Math.max(0, Math.round(askingPrice)),
    conditionNotes,
    sellerId,
    // Provenance disclosure carried into the listing (#76).
    provenanceSummary: prov ? provenanceSummary(prov) : null,
    ownerHistory: prov ? ownerHistory(prov) : ['me'],
    memoryRefs: [...(prov?.memories ?? [])],
    state: 'draft',
    soldPrice: null,
    buyerId: null,
  };
}

export function editListingDraft(draft, patch = {}) {
  if (draft.state !== 'draft' && draft.state !== 'listed') return draft;
  if (patch.askingPrice != null) draft.askingPrice = Math.max(0, Math.round(patch.askingPrice));
  if (patch.conditionNotes != null) draft.conditionNotes = patch.conditionNotes;
  return draft;
}

export function publishListing(draft) {
  if (draft.state === 'draft') draft.state = 'listed';
  return draft;
}

export function cancelListing(draft) {
  if (draft.state === 'draft' || draft.state === 'listed') draft.state = 'cancelled';
  return draft;
}

// Complete a sale: mark sold, record the ownership transfer on the asset's
// provenance, and return the money earned (#76).
export function completeSale(draft, { buyerId = 'buyer', price = null, prov = null, year = null } = {}) {
  if (draft.state !== 'listed' && draft.state !== 'draft') return null;
  const finalPrice = price == null ? draft.askingPrice : Math.max(0, Math.round(price));
  draft.state = 'sold';
  draft.soldPrice = finalPrice;
  draft.buyerId = buyerId;
  if (prov) recordTransfer(prov, { type: 'sale', from: 'me', to: buyerId, price: finalPrice, year });
  return { assetId: draft.assetId, price: finalPrice, buyerId };
}
