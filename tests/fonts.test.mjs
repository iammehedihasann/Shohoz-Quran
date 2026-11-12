import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createServer } from 'vite';

const vite=await createServer({server:{middlewareMode:true,hmr:false,ws:false},appType:'custom'});
after(()=>vite.close());
const fonts=await vite.ssrLoadModule('/src/constants/arabicFonts.ts');
const storage=await vite.ssrLoadModule('/src/utils/storage.ts');

test('only licensed and compatible fonts can be selected or loaded',()=>{
 assert.equal(fonts.DEFAULT_ARABIC_FONT,'indopak');
 assert.equal(fonts.isAvailableArabicFont('indopak'),true);
 for(const id of ['kolkata','obsolete-font',null,undefined]){
  assert.equal(fonts.isAvailableArabicFont(id),false);
  assert.throws(()=>fonts.requireArabicFont(id),/licensing and Quran text compatibility/);
 }
 const candidate=fonts.ARABIC_FONTS.find(font=>font.id==='kolkata');
 assert.equal(candidate.status,'unavailable');assert.equal(candidate.file,undefined);assert.equal(candidate.family,undefined);
 const verified=fonts.requireArabicFont('indopak');
 assert.ok(fs.existsSync(`public${verified.file}`));
 assert.match(fs.readFileSync('src/styles.css','utf8'),/@font-face\{font-family:Indopak;src:url\('\/fonts\/DigitalKhattIndoPak.woff2'\)/);
 assert.match(fs.readFileSync(`public${verified.licenseUrl}`,'utf8'),/SIL OPEN FONT LICENSE Version 1.1/);
});

test('saved Arabic font preferences are normalized without changing unrelated preferences or records',()=>{
 const original=globalThis.localStorage;
 try{
  for(const arabicFont of [undefined,'kolkata','invalid','indopak']){
   const saved={version:1,preferences:{arabicFont,bengaliTranslation:'bn.bengali',translation:'both',mode:'continuous',zoom:125,audio:false},bookmarks:[{id:'page-3',page:3,createdAt:'2026-11-12T00:00:00Z'}],progress:{page:3,key:'2:5'},recent:[2]};
   globalThis.localStorage={getItem:()=>JSON.stringify(saved),setItem:()=>{throw new Error('Unexpected mutation');}};
   const result=storage.readState();assert.equal(result.preferences.arabicFont,'indopak');
   for(const key of ['translation','bengaliTranslation','mode','zoom','audio'])assert.equal(result.preferences[key],saved.preferences[key]);
   assert.deepEqual(result.bookmarks,saved.bookmarks);assert.deepEqual(result.progress,saved.progress);assert.deepEqual(result.recent,saved.recent);
  }
 }finally{if(original===undefined)delete globalThis.localStorage;else globalThis.localStorage=original;}
});

// Read the bundled font's Unicode cmap directly; no extra font parser dependency.
test('the verified font covers every displayed character on all 610 source pages',()=>{
 const file=fs.readFileSync('public/fonts/DigitalKhattIndoPak.ttf'),tables=new Map();
 for(let i=0;i<file.readUInt16BE(4);i++){
  const offset=12+i*16;tables.set(file.toString('ascii',offset,offset+4),file.readUInt32BE(offset+8));
 }
 assert.ok(tables.has('GSUB'));assert.ok(tables.has('GPOS'));
 const cmap=tables.get('cmap');let format4;
 for(let i=0;i<file.readUInt16BE(cmap+2);i++){
  const record=cmap+4+i*8,platform=file.readUInt16BE(record),encoding=file.readUInt16BE(record+2);
  const offset=cmap+file.readUInt32BE(record+4);
  if((platform===0||(platform===3&&encoding===1))&&file.readUInt16BE(offset)===4)format4=offset;
 }
 assert.notEqual(format4,undefined);
 const count=file.readUInt16BE(format4+6)/2,end=format4+14,start=end+count*2+2,delta=start+count*2,range=delta+count*2;
 function glyph(codepoint){
  for(let i=0;i<count;i++){
   if(codepoint>file.readUInt16BE(end+i*2))continue;
   const first=file.readUInt16BE(start+i*2);if(codepoint<first)return 0;
   const change=file.readInt16BE(delta+i*2),offset=file.readUInt16BE(range+i*2);
   if(!offset)return(codepoint+change)&0xffff;
   const id=file.readUInt16BE(range+i*2+offset+(codepoint-first)*2);return id?(id+change)&0xffff:0;
  }
  return 0;
 }
 const text=[];
 for(let page=1;page<=610;page++)text.push(...JSON.parse(fs.readFileSync(`public/data/pages/${page}.json`)).lines.map(line=>line.text));
 text.push(...JSON.parse(fs.readFileSync('src/constants/navigation.json')).surahs.map(surah=>surah.name),'٠١٢٣٤٥٦٧٨٩');
 const used=new Set(text.join(''));
 for(const char of used){
  const point=char.codePointAt(0);
  // Bidi override and CGJ are invisible text controls, not printable glyphs.
  if(point===0x202e||point===0x034f)continue;
  assert.ok(glyph(point),`Missing U+${point.toString(16).toUpperCase()}`);
 }
 for(const point of [0x617,0x660,0x669,0x6d8,0x6da,0x89c,0x8d5,0x8db,0x8dd,0x8de,0x8df])assert.ok(used.has(String.fromCodePoint(point)));
});
