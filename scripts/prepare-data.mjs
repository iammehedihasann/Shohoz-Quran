import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>{fs.mkdirSync(p.slice(0,p.lastIndexOf('/')),{recursive:true});fs.writeFileSync(p,JSON.stringify(v));};
const source=fs.readFileSync('.source-data/quran_text_indopak_15.ts','utf8');
fs.writeFileSync('.source-data/indopak.mjs',source.replace('let quranText =','export const quranText =').replace('export { quranText };',''));
const {quranText:raw}=await import('../.source-data/indopak.mjs');
const chapters=read('.source-data/chapters.json'),bnNames=read('.source-data/surah-bn.json');
const meta=read('.source-data/meta.json').data;
const bn=chapters.map(c=>({id:c.id,...read(`public/data/translations/bn/${c.id}.json`)})),en=read('.source-data/en.json');
const verses={},pages=[];let surah=0,ayah=1;
const widths=new Map([[255*15+4,.9],[312*15+4,.6],[331*15+12,.7],[349*15+15,.9],[396*15+8,.7],[417*15+15,.8],[440*15+7,.5],[452*15+11,.8],[495*15+11,.8],[498*15+7,.7],[510*15+15,.6],[523*15+8,.8],[528*15+11,.7],[531*15+7,.7],[548*15+15,.5],[554*15+9,.7],[569*15+10,.8],[573*15+12,.3],[576*15+2,.5],[577*15+15,.5],[580*15+5,.7],[581*15+15,.5],[584*15+2,.3],[590*15+10,.8],[591*15+11,.5],[592*15+8,.7],[594*15+2,.8],[595*15+3,.6],[596*15+4,.7],[596*15+15,.6],[598*15+9,.8],[599*15+15,.5],[602*15+2,.5],[602*15+15,.5],[605*15+10,.5],[606*15+2,.5],[606*15+9,.8],[606*15+15,.7],[609*15+11,.7],[609*15+15,.7],[610*15+5,.5],[610*15+10,.7]]);
const digits=s=>Number([...s].map(c=>'٠١٢٣٤٥٦٧٨٩'.indexOf(c)).join(''));
function add(key,text,page){if(!text)return;verses[key]??={key,surah,ayah,page,text:''};verses[key].text+=(verses[key].text?' ':'')+text;}
for(const [pi,lines] of raw.entries()){
 const page=pi+1,keys=new Set();
 const mapped=lines.map((text,li)=>{
  if(text.startsWith('سُورَةُ')){if(surah)assert.equal(ayah,chapters[surah-1].total_verses+1,`Surah ${surah} verse coverage`);surah++;ayah=1;return {number:li+1,type:'surah',text,surah,segments:[],width:1};}
  const basm=text==='بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ ۝';
  if(basm&&surah!==1)return {number:li+1,type:'basmallah',text,surah,segments:[],width:1};
  let cursor=0;const segments=[];
  const push=(t)=>{if(!t)return;const key=`${surah}:${ayah}`;segments.push({key,text:t});keys.add(key);add(key,t,page);};
  if(basm){push(text);ayah++;}
  else {
   for(const match of text.matchAll(/۝([٠-٩]+)[\p{M}\u06D6-\u06ED]*/gu)){
    const printed=digits(match[1]);
    assert.equal(printed,surah===1?(ayah===7?7:ayah-1):ayah,`Marker on ${page}:${li+1}`);
    push(text.slice(cursor,match.index+match[0].length));cursor=match.index+match[0].length;ayah++;
   }
   push(text.slice(cursor));
  }
  return {number:li+1,type:'ayah',text,surah,segments,width:widths.get(page*15+li+1)??1};
 });
 const pageData={number:page,lines:mapped,keys:[...keys].filter(k=>verses[k]?.text.trim()),surahs:[...new Set(mapped.map(l=>l.surah))]};
 pages.push(pageData);
}
assert.equal(surah,114);assert.equal(ayah,7);
// Whitespace immediately following a marker is part of the original line, not a new verse.
for(const [key,v] of Object.entries(verses))if(!v.text.trim())delete verses[key];
for(const p of pages){for(const l of p.lines){l.segments=l.segments.filter(s=>s.text.trim());}p.keys=[...new Set(p.lines.flatMap(l=>l.segments.map(s=>s.key)))];}
assert.equal(Object.keys(verses).length,6236);
for(const c of chapters)assert.equal(Object.values(verses).filter(v=>v.surah===c.id).length,c.total_verses);
const surahs=chapters.map(c=>({...c,bengali:bnNames[c.id],page:verses[`${c.id}:1`].page}));
const juz=meta.juzs.references.map((j,i)=>({number:i+1,...j,page:verses[`${j.surah}:${j.ayah}`].page,name:verses[`${j.surah}:${j.ayah}`].text.replace(/۝.*/u,'').trim().split(' ').slice(0,3).join(' ')}));
for(const p of pages){const first=verses[p.keys[0]];p.juz=juz.filter(j=>j.surah<first.surah||(j.surah===first.surah&&j.ayah<=first.ayah)).at(-1)?.number??1;write(`public/data/pages/${p.number}.json`,p);write(`public/data/verses/${p.number}.json`,p.keys.map(k=>verses[k]));}
write('src/constants/metadata.json',{edition:'DigitalKhatt Indo-Pak 15-line',pages:610,surahs,juz,versePages:Object.fromEntries(Object.entries(verses).map(([k,v])=>[k,v.page]))});
for(const [lang,edition,data]of [['en','Marmaduke Pickthall (1930)',en],['bn','মাওলানা মুহিউদ্দীন খান',bn]]){
 for(const c of data){assert.equal(c.verses.length,surahs[c.id-1].total_verses);write(`public/data/translations/${lang}/${c.id}.json`,{edition,surah:c.id,verses:c.verses});}
}
const search=Object.values(verses).map(v=>({...v,en:en[v.surah-1].verses[v.ayah-1].translation,bn:bn[v.surah-1].verses[v.ayah-1].translation}));
write('public/data/search.json',search);
write('public/data/verses.json',Object.values(verses));
write('src/constants/navigation.json',{edition:'DigitalKhatt Indo-Pak 15-line',pages:610,surahs,juz});
write('src/constants/verse-index.json',Object.values(verses).map(v=>v.page));
write('public/data/provenance.json',{edition:'DigitalKhatt Indo-Pak 15-line',source:'https://github.com/DigitalKhatt/digitalkhatt-js',file:'apps/site-angular/src/app/services/quran_text_indopak_15.ts',license:'MIT',fontLicense:'OFL-1.1',sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),retrieved:'2026-11-12',pages:610,verses:6236,note:'Original line strings are unchanged. Source Al-Fatiha printed numbering differs from standard Hafs; navigation, translations and audio use Hafs references. The final two printed segments map together to 1:7. This is not the QUL Qudratullah edition.'});
console.log(`Prepared ${pages.length} pages, ${surahs.length} surahs, ${Object.keys(verses).length} verses, ${juz.length} juz. Original line strings preserved.`);
