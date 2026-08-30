import { migrateBikeOwnership, setBikeRole } from './equipmentOwnership.js';
import { equipmentValuation } from './equipmentValuation.js';

function clone(v){return JSON.parse(JSON.stringify(v));}
function id(prefix,assetId,seq=0){return `${prefix}_${String(assetId||'asset')}_${seq}`;}

export function createMarketplaceState(raw={}){
  return {version:2,listings:Array.isArray(raw.listings)?clone(raw.listings):[],circulation:Array.isArray(raw.circulation)?clone(raw.circulation):[],history:Array.isArray(raw.history)?clone(raw.history):[]};
}

export function canListAsset(asset,{installed=false,required=false,contractRestricted=false}={}){
  const reasons=[];
  if(installed)reasons.push('installed');
  if(required)reasons.push('required');
  if(contractRestricted||asset?.ownershipRestricted)reasons.push('contract-restricted');
  return {allowed:reasons.length===0,reasons};
}

export function createPlayerListing(marketRaw,asset,{askingPrice=null,kind='bike',restrictions={},seller='me'}={}){
  const market=createMarketplaceState(marketRaw),check=canListAsset(asset,restrictions);if(!check.allowed)throw new Error(`asset-not-listable:${check.reasons.join(',')}`);
  const valuation=equipmentValuation(asset),listingId=id('listing',asset.assetId??asset.id,market.listings.length);
  const listing={listingId,assetId:asset.assetId??asset.id,kind,seller,askingPrice:Math.max(1,Math.round(askingPrice??valuation.privateAsk)),status:'listed',offers:[],valuation,createdSeq:market.history.length};
  market.listings.push(listing);market.history.push({type:'listed',listingId,assetId:listing.assetId,askingPrice:listing.askingPrice});
  return {market,listing};
}

export function makeOffer(marketRaw,listingId,{buyer='buyer',amount}){
  const market=createMarketplaceState(marketRaw),listing=market.listings.find(x=>x.listingId===listingId);if(!listing||listing.status!=='listed')throw new Error('listing-not-active');
  const offer={offerId:id('offer',listingId,listing.offers.length),buyer,amount:Math.max(1,Math.round(amount)),status:'pending'};listing.offers.push(offer);market.history.push({type:'offer',listingId,...offer});return{market,offer};
}

export function counterOffer(marketRaw,listingId,offerId,amount){
  const market=createMarketplaceState(marketRaw),listing=market.listings.find(x=>x.listingId===listingId),offer=listing?.offers.find(x=>x.offerId===offerId);if(!offer||listing.status!=='listed')throw new Error('offer-not-active');
  offer.status='countered';offer.counterAmount=Math.max(1,Math.round(amount));market.history.push({type:'counter',listingId,offerId,amount:offer.counterAmount});return{market,offer};
}

export function cancelListing(marketRaw,listingId){const market=createMarketplaceState(marketRaw),listing=market.listings.find(x=>x.listingId===listingId);if(!listing)throw new Error('unknown-listing');listing.status='canceled';market.history.push({type:'canceled',listingId});return market;}

export function completePrivateSale({market:marketRaw,ownership:ownershipRaw,listingId,buyer='private-buyer',price=null,provenance=null,cash=0}={}){
  const market=createMarketplaceState(marketRaw),ownership=migrateBikeOwnership(ownershipRaw),listing=market.listings.find(x=>x.listingId===listingId);if(!listing||listing.status!=='listed')throw new Error('listing-not-active');
  const bike=ownership.bikes.find(x=>x.assetId===listing.assetId);if(!bike)throw new Error('asset-not-owned');
  const amount=Math.max(1,Math.round(price??listing.valuation.privateExpected));listing.status='sold';listing.salePrice=amount;listing.buyer=buyer;
  const sold=clone(bike);sold.ownershipStatus='sold';sold.role='for-sale';
  ownership.bikes=ownership.bikes.filter(x=>x.assetId!==listing.assetId);for(const k of Object.keys(ownership.active))if(ownership.active[k]===listing.assetId)ownership.active[k]=null;
  ownership.history.push({type:'bike-sold',bikeId:listing.assetId,buyer,price:amount});
  if(provenance?.ownership)provenance.ownership.push({type:'sale',from:'me',to:buyer,year:null,price:amount,note:'Player marketplace sale'});
  market.circulation.push({asset:clone(sold),assetId:sold.assetId,lastOwner:buyer,lastPrice:amount,source:'player-sale',provenance:provenance?clone(provenance):null});market.history.push({type:'sold',listingId,assetId:sold.assetId,buyer,price:amount});
  return {market,ownership,cash:Math.round(Number(cash)||0)+amount,soldAsset:sold,provenance};
}

export function dealerTradeIn({ownership:ownershipRaw,bikeId,cash=0,context={},provenance=null,dealer='dealer'}={}){
  const ownership=migrateBikeOwnership(ownershipRaw),bike=ownership.bikes.find(x=>x.assetId===bikeId);if(!bike)throw new Error('asset-not-owned');
  const valuation=equipmentValuation(bike,context);if(!valuation.sellable)throw new Error('asset-not-sellable');
  const amount=valuation.tradeIn;ownership.bikes=ownership.bikes.filter(x=>x.assetId!==bikeId);for(const k of Object.keys(ownership.active))if(ownership.active[k]===bikeId)ownership.active[k]=null;
  ownership.history.push({type:'trade-in',bikeId,dealer,price:amount});if(provenance?.ownership)provenance.ownership.push({type:'trade',from:'me',to:dealer,year:null,price:amount,note:'Dealer trade-in'});
  return {ownership,cash:Math.round(Number(cash)||0)+amount,tradeInValue:amount,asset:{...clone(bike),ownershipStatus:'dealer-owned'},provenance};
}
