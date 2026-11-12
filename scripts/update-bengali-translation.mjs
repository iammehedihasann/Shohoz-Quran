import fs from 'node:fs';
import assert from 'node:assert/strict';

// Refresh only Bengali snapshots and Bengali search text from the publisher.
// An optional saved API response permits the same validation without network.
const url='https://api.alquran.cloud/v1/quran/bn.bengali';
const response=process.argv[2]
 ? JSON.parse(fs.readFileSync(process.argv[2],'utf8'))
 : await fetch(url,{signal:AbortSignal.timeout(60000)}).then(r=>{if(!r.ok)throw new Error(`Bengali API returned ${r.status}`);return r.json();});
assert.equal(response.code,200);assert.equal(response.status,'OK');
const {edition,surahs}=response.data;
assert.equal(edition.identifier,'bn.bengali');assert.equal(edition.language,'bn');
assert.equal(edition.englishName,'Muhiuddin Khan');assert.equal(edition.type,'translation');assert.equal(edition.format,'text');
const metadata=JSON.parse(fs.readFileSync('src/constants/navigation.json','utf8'));
assert.equal(surahs.length,114);
const translations=new Map();let globalAyah=0;
const snapshots=surahs.map((surah,index)=>{
 assert.equal(surah.number,index+1);
 assert.equal(surah.ayahs.length,metadata.surahs[index].total_verses);
 return {edition:'মাওলানা মুহিউদ্দীন খান',surah:surah.number,verses:surah.ayahs.map((ayah,i)=>{
  assert.equal(ayah.numberInSurah,i+1);assert.equal(ayah.number,++globalAyah);
  assert.equal(typeof ayah.text,'string');assert.ok(ayah.text.trim());
  translations.set(`${surah.number}:${ayah.numberInSurah}`,ayah.text);
  return {id:ayah.numberInSurah,translation:ayah.text};
 })};
});
assert.equal(globalAyah,6236);
const search=JSON.parse(fs.readFileSync('public/data/search.json','utf8'));
assert.equal(search.length,6236);assert.equal(new Set(search.map(row=>row.key)).size,6236);
for(const row of search){assert.equal(row.key,`${row.surah}:${row.ayah}`);assert.ok(translations.has(row.key));row.bn=translations.get(row.key);}
// All resources are validated before replacing any files. Text is never edited.
function writeSnapshot(path,value){
 const previous=fs.readFileSync(path,'utf8');
 const indent=previous.includes('\n')?2:undefined;
 fs.writeFileSync(path,JSON.stringify(value,null,indent)+(previous.endsWith('\n')?'\n':''));
}
for(const snapshot of snapshots)writeSnapshot(`public/data/translations/bn/${snapshot.surah}.json`,snapshot);
writeSnapshot('public/data/search.json',search);
console.log('Updated 114 Bengali Surahs and 6,236 Bengali search entries from bn.bengali.');
