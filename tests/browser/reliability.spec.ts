import {test,expect} from '@playwright/test';
test('each generated reader route serves its own indexable HTML',async({request})=>{
 const response=await request.get('/read/3');expect(response.status()).toBe(200);
 const html=await response.text();expect(html).toContain('data-prerender-path="/read/3"');expect(html).toContain('Page 3 — Al-Baqara');expect(html).toContain('mushaf-lines');expect(html).toContain('اُولٰ');expect(html).toContain('rel="canonical"');expect(html).toContain('/read/3/');
 const sitemap=await request.get('/sitemap.xml');expect(sitemap.status()).toBe(200);expect(await sitemap.text()).toContain('/read/610/');
 expect((await request.get('/not-a-real-route')).status()).toBe(404);
});
test('native recitation playback uses real verse audio',async({page})=>{
 await page.goto('/read/1/');await page.getByRole('button',{name:'Play recitation',exact:true}).click();
 await expect.poll(()=>page.locator('audio').evaluate((a:HTMLAudioElement)=>a.duration),{timeout:20000}).toBeGreaterThan(0);
 await page.getByRole('button',{name:'Pause recitation',exact:true}).click();
 await page.locator('#speed').selectOption('1.25');expect(await page.locator('audio').evaluate((a:HTMLAudioElement)=>a.playbackRate)).toBe(1.25);
 await page.getByRole('button',{name:'Next ayah',exact:true}).click();await expect(page.locator('.audio-heading')).toContainText('1:2');
});
test('all Mushaf pages can be deliberately cached and read offline',async({page,context},info)=>{
 test.skip(info.project.name==='mobile','The complete download is checked once on desktop.');test.setTimeout(60000);
 await page.goto('/settings/');await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));
 await page.getByRole('button',{name:'Download Quran pages',exact:true}).click();
 await expect(page.getByText('All Mushaf pages and font saved.',{exact:false})).toBeVisible({timeout:45000});
 expect(await page.evaluate(async()=>{const cache=await caches.open('hafezi-data-v1');return (await cache.keys()).filter(k=>k.url.includes('/data/pages/')).length;})).toBe(610);
 await context.setOffline(true);await page.goto('/read/610/');
 await expect(page.locator('.mushaf-page')).toHaveAttribute('aria-label','DigitalKhatt Indo-Pak Quran page 610');
 await page.waitForFunction(()=>document.documentElement.classList.contains('quran-font-ready'));
 await expect(page.locator('.notice')).toContainText('offline');await context.setOffline(false);
});
test('Surah playback continues across a Mushaf page boundary',async({page})=>{
 await page.goto('/read/3/?ayah=2:15');await expect(page.locator('.audio-heading')).toContainText('2:15');
 await page.getByRole('button',{name:'Play recitation',exact:true}).click();await expect.poll(()=>page.locator('audio').evaluate((a:HTMLAudioElement)=>a.paused),{timeout:20000}).toBe(false);
 await page.locator('audio').evaluate(a=>a.dispatchEvent(new Event('ended')));
 await expect(page.locator('.mushaf-page')).toHaveAttribute('aria-label','DigitalKhatt Indo-Pak Quran page 4');
 await expect(page.locator('.audio-heading')).toContainText('2:16');await expect.poll(()=>page.locator('audio').evaluate((a:HTMLAudioElement)=>a.paused),{timeout:20000}).toBe(false);
});
test('missing compatible font blocks Quran text instead of substituting it',async({page})=>{
 await page.route('**/fonts/*',route=>route.abort());await page.goto('/read/1/');
 await expect(page.getByRole('alert')).toContainText('compatible Indo-Pak Quran font could not load');await expect(page.locator('.mushaf-page')).toHaveCount(0);
});
test('invalid saved ayah references are discarded safely',async({page})=>{
 await page.goto('/');await page.evaluate(()=>localStorage.setItem('hafezi-quran-v1',JSON.stringify({version:1,bookmarks:[{id:'ayah-999:999',key:'999:999',page:1,createdAt:new Date().toISOString()}],progress:{page:1,key:'999:999'}})));
 await page.goto('/bookmarks/');await expect(page.locator('.bookmark-row')).toHaveCount(0);await expect(page.getByRole('heading',{name:'Your collection is waiting'})).toBeVisible();
});
