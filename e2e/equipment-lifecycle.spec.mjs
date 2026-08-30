import { test, expect } from '@playwright/test';

async function noOverflow(page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);}

test('Equipment 2.0 survives ownership, wear, sale, replacement and reload',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await page.waitForFunction(()=>!!window.__legacy);
 await page.evaluate(async()=>{
  localStorage.clear();window.__legacy.startGame({name:'Casey',depth:'detailed',birthdate:'2012-05-15',campaign:'parent',avatar:'🧒',background:'working_class'});
  const eq=await import('/src/systems/equipmentCareer.js');
  let s=eq.createEquipmentCareerState({cash:9000,ownership:{bike:{assetId:'used125',year:2022,make:'Yamaha',model:'YZ125',condition:84,originalMSRP:6999,mechanical:{engineHours:20,suspensionHours:23,condition:84,reliability:90}}},gear:[{id:'filter',category:'filter',quantity:1,condition:100,retailPrice:18}]});
  s=eq.useBike(s,'used125',{hours:6,kind:'practice'});s=eq.consumeGear(s,'filter',{sessions:1,kind:'race'});s=eq.replaceGear(s,'filter',{retailPrice:18});s=eq.serviceBike(s,'used125',{kind:'top-end',cost:550});
  const listed=eq.listBikeForSale(s,'used125',{askingPrice:4000});s=eq.completeBikeSale(listed.state,listed.listing.listingId,{buyer:'local-racer',price:3900});
  s=eq.buyUsedBike(s,{assetId:'next250',kind:'bike',category:'bike',seller:'dealer-used',year:2025,make:'Honda',model:'CRF250R',price:6500,condition:90,hiddenWear:5,sellerReputation:92,compatible:true},{inspectionLevel:'mechanic',packages:[{id:'dealer',bikeDiscountPct:10}]});
  s=eq.nextEquipmentSeason(s);window.__legacy.game.state.equipmentLifecycle=s;window.__legacy.tab='garage';window.__legacy.render();window.__legacy.save?.();
 });
 const equipmentScene=page.getByTestId('ui2-equipment-scene');await expect(equipmentScene).toBeVisible();await expect(equipmentScene.getByRole('heading',{name:/CRF250R/})).toBeVisible();await noOverflow(page);
 const before=await page.evaluate(()=>({cash:window.__legacy.game.state.equipmentLifecycle.cash,season:window.__legacy.game.state.equipmentLifecycle.season,bikes:window.__legacy.game.state.equipmentLifecycle.ownership.bikes.map(b=>b.assetId),sold:window.__legacy.game.state.equipmentLifecycle.market.circulation.map(x=>x.assetId)}));
 expect(before.season).toBe(2);expect(before.bikes).toEqual(['next250']);expect(before.sold).toContain('used125');
 await page.reload();await page.waitForFunction(()=>!!window.__legacy);await page.evaluate(()=>{window.__legacy.tab='garage';window.__legacy.render();});
 const after=await page.evaluate(()=>({cash:window.__legacy.game.state.equipmentLifecycle?.cash,season:window.__legacy.game.state.equipmentLifecycle?.season,bikes:window.__legacy.game.state.equipmentLifecycle?.ownership?.bikes?.map(b=>b.assetId),sold:window.__legacy.game.state.equipmentLifecycle?.market?.circulation?.map(x=>x.assetId)}));
 expect(after).toEqual(before);await expect(page.getByTestId('ui2-equipment-scene')).toBeVisible();await noOverflow(page);await page.setViewportSize({width:1280,height:900});await noOverflow(page);
});
