import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createServer } from 'vite';

const vite = await createServer({server:{middlewareMode:true,hmr:false,ws:false},appType:'custom'});
after(()=>vite.close());
const service = await vite.ssrLoadModule('/src/services/translationService.ts');
const catalog = await vite.ssrLoadModule('/src/constants/translations.ts');
const storage = await vite.ssrLoadModule('/src/utils/storage.ts');
const read=(lang,surah)=>JSON.parse(fs.readFileSync(`public/data/translations/${lang}/${surah}.json`,'utf8'));

test('requested unverified editions never request or return another translator’s text',async()=>{
 const original=globalThis.fetch;let requests=0;globalThis.fetch=async()=>{requests++;throw new Error('Unexpected request');};
 try {
  for(const id of ['bn-islamic-foundation','bn-taqi-usmani-bashar','unverified-edition'])await assert.rejects(service.getTranslation('bn',1,id),/unavailable/);
  assert.equal(requests,0);
  const blocked=catalog.BENGALI_TRANSLATIONS.filter(e=>e.status==='unavailable');assert.equal(blocked.length,2);for(const e of blocked)assert.equal(e.directory,undefined);
  assert.equal(blocked.find(e=>e.id==='bn-taqi-usmani-bashar').translator,'Maulana Abul Bashar Muhammad Saiful Islam');
 }finally{globalThis.fetch=original;}
});

test('existing Bengali and English resources retain exact verse text, footnotes and independent caches',async()=>{
 const original=globalThis.fetch,requests=[];globalThis.fetch=async url=>{requests.push(url);return new Response(fs.readFileSync(`public${url}`),{headers:{'Content-Type':'application/json'}});};
 try{
  const [bn,en]=await Promise.all([service.getTranslation('bn',1,'bn-zakaria'),service.getTranslation('en',1)]);
  assert.deepEqual(bn,read('bn',1));assert.deepEqual(en,read('en',1));assert.ok(bn.verses[0].footnotes);
  assert.equal(await service.getTranslation('bn',1,'bn-zakaria'),bn);assert.equal(requests.length,2);
  assert.notEqual(service.translationCacheKey('bn',1,'bn-zakaria'),service.translationCacheKey('en',1));
  assert.equal(service.translationSourceUrl('bn',1,7,'bn-zakaria'),'https://quranenc.com/en/browse/bengali_zakaria/1/7');
 }finally{globalThis.fetch=original;}
});

test('wrong edition, wrong Surah and missing ayahs fail safely and permit retry',async()=>{
 const original=globalThis.fetch;
 try{
  for(const [surah,change]of [[112,d=>({...d,edition:'Different translator'})],[113,d=>({...d,surah:114})],[114,d=>({...d,verses:d.verses.slice(1)})]]){
   globalThis.fetch=async()=>new Response(JSON.stringify(change(read('bn',surah))));
   await assert.rejects(service.getTranslation('bn',surah,'bn-zakaria'),/match|missing/);
   globalThis.fetch=async()=>new Response(JSON.stringify(read('bn',surah)));
   assert.deepEqual(await service.getTranslation('bn',surah,'bn-zakaria'),read('bn',surah));
  }
  await assert.rejects(service.getTranslation('bn',0),/Surah/);
 }finally{globalThis.fetch=original;}
});

test('legacy local preferences migrate without losing bookmarks or reading settings',()=>{
 const original=globalThis.localStorage;
 try{
  const saved={version:1,preferences:{translation:'both',theme:'dark',zoom:125},bookmarks:[{id:'page-1',page:1,createdAt:'2026-11-12T00:00:00Z'}],progress:{page:1,key:'1:1'},recent:[1]};
  globalThis.localStorage={getItem:()=>JSON.stringify(saved)};
  const state=storage.readState();assert.equal(state.preferences.bengaliTranslation,'bn-zakaria');assert.equal(state.preferences.translation,'both');assert.equal(state.preferences.theme,'dark');assert.equal(state.preferences.zoom,125);assert.deepEqual(state.bookmarks,saved.bookmarks);assert.deepEqual(state.progress,saved.progress);
  for(const id of ['bn-zakaria','bn-islamic-foundation','bn-taqi-usmani-bashar','invalid']){
   saved.preferences.bengaliTranslation=id;assert.equal(storage.readState().preferences.bengaliTranslation,'bn-zakaria');
  }
 }finally{if(original===undefined)delete globalThis.localStorage;else globalThis.localStorage=original;}
});
