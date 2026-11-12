import fs from 'node:fs';
import {test,expect,type Page} from '@playwright/test';
import {bengaliApiResponse,bengaliSnapshot,mockBengaliApi,translator} from './translation-fixtures';

async function savedBengali(page:Page,mode='page'){
 await page.addInitScript(({mode})=>localStorage.setItem('hafezi-quran-v1',JSON.stringify({version:1,preferences:{translation:'bn',bengaliTranslation:'bn.bengali',audio:false,mode}})),{mode});
}
async function expectPageTranslation(page:Page,number:number){
 const source=JSON.parse(fs.readFileSync(`public/data/pages/${number}.json`,'utf8'));
 await expect(page.locator('.mushaf-page')).toHaveAttribute('aria-label',`DigitalKhatt Indo-Pak Quran page ${number}`);
 const expected=source.keys.map((key:string)=>{const [s,a]=key.split(':').map(Number);return {key:`Ayah ${key}`,edition:translator,text:bengaliSnapshot(s).verses[a-1].translation};});
 await expect.poll(()=>page.locator('.translated-ayah').evaluateAll(articles=>articles.map(article=>({key:article.querySelector('.verse-card-head > button')?.textContent,edition:article.querySelector('.translation-edition')?.textContent,text:article.querySelector('.translation-copy > p')?.textContent})))).toEqual(expected);
}

test('Muhiuddin Khan is the default, persisted and shared by settings and reader',async({page})=>{
 await mockBengaliApi(page);
 await page.goto('/settings/');const select=page.getByLabel('Bengali translation edition',{exact:true});
 await expect(select).toHaveValue('bn.bengali');await expect(select.locator('option:not([disabled])')).toHaveCount(1);
 await expect(select.locator('option[value="bn.bengali"]')).toHaveText(translator);
 await expect(select.locator('option[value="bn-zakaria"]')).toHaveCount(0);
 await expect(select.locator('option[value="bn-islamic-foundation"]')).toBeDisabled();await expect(select.locator('option[value="bn-taqi-usmani-bashar"]')).toBeDisabled();
 await page.locator('#setting-translation').selectOption('bn');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('hafezi-quran-v1')!).preferences.bengaliTranslation)).toBe('bn.bengali');
 await page.goto('/read/1/');await page.getByRole('button',{name:'Reading display settings'}).click();await expect(page.locator('#reader-bengali-edition')).toHaveValue('bn.bengali');
 await expectPageTranslation(page,1);await page.reload();await expectPageTranslation(page,1);
});

test('legacy translator preference migrates while retaining bookmarks and display settings',async({page})=>{
 await mockBengaliApi(page);await page.goto('/');
 await page.evaluate(()=>localStorage.setItem('hafezi-quran-v1',JSON.stringify({version:1,preferences:{translation:'bn',bengaliTranslation:'bn-zakaria',theme:'dark',zoom:125,audio:false},bookmarks:[{id:'page-3',page:3,createdAt:'2026-11-12T00:00:00Z'}]})));
 await page.goto('/settings/');await expect(page.locator('#setting-bengali-edition')).toHaveValue('bn.bengali');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('hafezi-quran-v1')!));
 expect(saved.preferences).toMatchObject({translation:'bn',bengaliTranslation:'bn.bengali',theme:'dark',zoom:125,audio:false});expect(saved.bookmarks[0].id).toBe('page-3');
 await page.goto('/read/1/');await expectPageTranslation(page,1);await expect(page.locator('body')).not.toContainText('Abu Bakr Zakaria');
});

test('mixed-Surah pages and consecutive pages use local ayah IDs and reuse Surah requests',async({page})=>{
 const requests=await mockBengaliApi(page);await savedBengali(page);await page.goto('/read/609/');await expectPageTranslation(page,609);
 await page.getByRole('button',{name:'Next page',exact:true}).click();await expectPageTranslation(page,610);
 await page.getByRole('button',{name:'Previous page',exact:true}).click();await expectPageTranslation(page,609);
 expect(requests.sort((a,b)=>a-b)).toEqual([109,110,111,112,113,114]);
 await page.locator('#page-input').fill('2');await page.getByRole('button',{name:'Go to page'}).click();await expectPageTranslation(page,2);
 await page.getByRole('button',{name:'Next page',exact:true}).click();await expectPageTranslation(page,3);expect(requests.filter(s=>s===2)).toHaveLength(1);
});

test('loading, failed API responses and retry leave the Arabic Mushaf intact',async({page})=>{
 await savedBengali(page);let release=()=>{};const gate=new Promise<void>(resolve=>{release=resolve;});let attempts=0;
 await page.route('https://api.alquran.cloud/v1/surah/1/bn.bengali',async route=>{
  attempts++;if(attempts===1){await gate;await route.fulfill({status:503,body:'Unavailable'});}else await route.fulfill({json:bengaliApiResponse(1)});
 });
 try{
  await page.goto('/read/1/');await expect(page.locator('.translation-panel')).toContainText('Loading translation…');await expect(page.locator('.mushaf-page')).toBeVisible();release();
  await expect(page.locator('.translation-panel [role="alert"]')).toContainText('Check your connection');await expect(page.locator('.mushaf-page')).toBeVisible();
  await page.getByRole('button',{name:'Try again',exact:true}).click();await expectPageTranslation(page,1);expect(attempts).toBe(2);
 }finally{release();}
});

test('late responses cannot replace translations after navigation or disabling',async({page})=>{
 await savedBengali(page);await mockBengaliApi(page);let release=()=>{};const gate=new Promise<void>(resolve=>{release=resolve;});let pending=false;
 await page.route('https://api.alquran.cloud/v1/surah/1/bn.bengali',async route=>{pending=true;await gate;await route.fulfill({json:bengaliApiResponse(1)});});
 try{
  await page.goto('/read/1/');await expect.poll(()=>pending).toBe(true);
  await page.locator('#page-input').fill('610');await page.getByRole('button',{name:'Go to page'}).click();await expectPageTranslation(page,610);
  release();await expectPageTranslation(page,610);await expect(page.locator('.translation-panel')).not.toContainText(bengaliSnapshot(1).verses[0].translation);
  await page.getByRole('button',{name:'Reading display settings'}).click();await page.locator('.reader-settings select').first().selectOption('none');await expect(page.locator('.translation-panel')).toHaveCount(0);
  await page.locator('.reader-settings select').first().selectOption('bn');await expectPageTranslation(page,610);
 }finally{release();}
});

test('disabling Bengali while a request is pending ignores its eventual response',async({page})=>{
 await savedBengali(page);let release=()=>{};const gate=new Promise<void>(resolve=>{release=resolve;});
 await page.route('https://api.alquran.cloud/v1/surah/1/bn.bengali',async route=>{await gate;await route.fulfill({json:bengaliApiResponse(1)});});
 try{
  await page.goto('/read/1/');await expect(page.locator('.translation-panel')).toContainText('Loading translation…');
  await page.getByRole('button',{name:'Reading display settings'}).click();await page.locator('.reader-settings select').first().selectOption('none');release();
  await expect(page.locator('.translation-panel')).toHaveCount(0);await expect(page.locator('.mushaf-page')).toBeVisible();
  await page.locator('.reader-settings select').first().selectOption('bn');await expectPageTranslation(page,1);
 }finally{release();}
});

test('continuous reading keeps Arabic visible through Bengali failures and disabling',async({page})=>{
 await savedBengali(page,'continuous');let fail=true;
 await page.route('https://api.alquran.cloud/v1/surah/1/bn.bengali',async route=>{if(fail)await route.abort('failed');else await route.fulfill({json:bengaliApiResponse(1)});});
 await page.goto('/read/1/');await expect(page.locator('.continuous-verses [role="alert"]')).toBeVisible();await expect(page.locator('.continuous-arabic')).toHaveCount(7);
 await page.getByRole('button',{name:'Reading display settings'}).click();await page.locator('.reader-settings select').first().selectOption('none');await expect(page.locator('.continuous-verses [role="alert"]')).toHaveCount(0);await expect(page.locator('.continuous-arabic')).toHaveCount(7);
 fail=false;await page.locator('.reader-settings select').first().selectOption('bn');
 await expect(page.locator('.verse-card .translation-copy > p').first()).toHaveText(bengaliSnapshot(1).verses[0].translation);await expect(page.locator('.verse-card .translation-edition').first()).toHaveText(translator);
});

test('every Quran page displays the exact Bengali snapshot for all its ayah references',async({page},info)=>{
 test.skip(info.project.name==='mobile','Exhaustive coverage runs once; representative pages run on both viewports.');test.setTimeout(240000);
 await savedBengali(page);const requests=await mockBengaliApi(page);await page.goto('/read/1/');await expectPageTranslation(page,1);
 for(let number=2;number<=610;number++){
  await page.locator('#page-input').fill(String(number));await page.getByRole('button',{name:'Go to page'}).click();await expectPageTranslation(page,number);
 }
 expect(requests.length).toBe(114);expect(new Set(requests).size).toBe(114);
});
