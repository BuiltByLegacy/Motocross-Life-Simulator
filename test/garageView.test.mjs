import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGarageView, bikeViewModel, objectViewModel,
  makeListingDraft, editListingDraft, publishListing, completeSale, cancelListing,
} from '../src/systems/garageView.js';
import { AssetRegistry, makeProvenance, recordTransfer, isOwnedByMe } from '../src/systems/assetProvenance.js';

function fixture() {
  const reg = new AssetRegistry();
  reg.add(makeProvenance({ assetId: 'bk_race', kind: 'bike', name: 'KX85', serial: 'SN1', acquiredVia: 'purchase', year: 2026 }));
  const usedProv = makeProvenance({ assetId: 'bk_old', kind: 'bike', name: 'KX65', acquiredVia: 'purchase', from: 'seller', year: 2024 });
  recordTransfer(usedProv, { type: 'gift', from: 'seller', to: 'me', year: 2024 });
  reg.add(usedProv);
  reg.add(makeProvenance({ assetId: 'helmet1', kind: 'gear', name: 'Lucky Helmet', year: 2025 }));
  const memories = [
    { id: 'm1', entities: [{ kind: 'bike', id: 'bk_race' }] },
    { id: 'm2', entities: [{ kind: 'bike', id: 'bk_race' }] },
  ];
  return { reg, memories };
}

test('#75 bike view model exposes id, serial, provenance, state, memory count', () => {
  const { reg, memories } = fixture();
  const vm = bikeViewModel({ assetId: 'bk_race', name: 'KX85', klass: '85cc', condition: 82, reliability: 90 }, { registry: reg, memories, activeBikeId: 'bk_race' });
  assert.equal(vm.serial, 'SN1');
  assert.equal(vm.state, 'installed');
  assert.equal(vm.memoryCount, 2);
  assert.match(vm.provenance, /owner/);
});

test('#75 object/gear view model distinguishes stored/listed/ordered', () => {
  const { reg } = fixture();
  const stored = objectViewModel({ assetId: 'helmet1', name: 'Lucky Helmet', kind: 'gear' }, { registry: reg });
  assert.equal(stored.state, 'stored');
  const listed = objectViewModel({ assetId: 'helmet1', name: 'Lucky Helmet', kind: 'gear', forSale: true }, { registry: reg });
  assert.equal(listed.state, 'listed');
  const ordered = objectViewModel({ name: 'New tire', kind: 'part', ordered: true }, {});
  assert.equal(ordered.state, 'ordered');
});

test('#75 buildGarageView aggregates counts and marks installed/listed/withMemories', () => {
  const { reg, memories } = fixture();
  const view = buildGarageView({
    activeBike: { assetId: 'bk_race', name: 'KX85', klass: '85cc', condition: 82 },
    bikes: [{ assetId: 'bk_old', name: 'KX65', klass: '65cc', role: 'spare', forSale: true }],
    objects: [{ assetId: 'helmet1', name: 'Lucky Helmet', kind: 'gear' }],
    parts: [{ name: 'Spare tire', kind: 'part' }],
    registry: reg, memories,
  });
  assert.equal(view.counts.bikes, 2);
  assert.equal(view.counts.installed, 1);
  assert.equal(view.counts.listed, 1); // the old bike is for sale
  assert.equal(view.counts.withMemories, 1); // race bike has memories
});

test('#76 listing draft preserves provenance and memory references', () => {
  const reg = new AssetRegistry();
  const prov = makeProvenance({ assetId: 'bk_old', kind: 'bike', name: 'KX65', serial: 'SN9', acquiredVia: 'purchase', from: 'seller', year: 2024 });
  prov.memories.push('mem_win');
  reg.add(prov);
  const draft = makeListingDraft({ assetId: 'bk_old', name: 'KX65', klass: '65cc', condition: 70, kind: 'bike' }, { prov, askingPrice: 900, conditionNotes: 'Runs great, new tires.' });
  assert.equal(draft.state, 'draft');
  assert.equal(draft.serial, 'SN9');
  assert.deepEqual(draft.memoryRefs, ['mem_win']);
  assert.ok(draft.provenanceSummary);
  assert.equal(draft.askingPrice, 900);
});

test('#76 edit, publish, and complete-sale transitions + provenance transfer', () => {
  const prov = makeProvenance({ assetId: 'bk_old', kind: 'bike', name: 'KX65', acquiredVia: 'purchase', year: 2024 });
  const draft = makeListingDraft({ assetId: 'bk_old', name: 'KX65', kind: 'bike' }, { prov, askingPrice: 800 });
  editListingDraft(draft, { askingPrice: 750, conditionNotes: 'Firm.' });
  assert.equal(draft.askingPrice, 750);
  publishListing(draft);
  assert.equal(draft.state, 'listed');
  const sale = completeSale(draft, { buyerId: 'kid_next_town', price: 725, prov, year: 2027 });
  assert.equal(draft.state, 'sold');
  assert.equal(draft.soldPrice, 725);
  assert.equal(sale.price, 725);
  assert.equal(isOwnedByMe(prov), false); // ownership transferred away
});

test('#76 cancel keeps the asset and blocks further edits', () => {
  const draft = makeListingDraft({ assetId: 'x', name: 'Y', kind: 'bike' }, { askingPrice: 100 });
  cancelListing(draft);
  assert.equal(draft.state, 'cancelled');
  editListingDraft(draft, { askingPrice: 50 });
  assert.equal(draft.askingPrice, 100); // no edits after cancel
});
