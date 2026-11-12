import fs from 'node:fs/promises';
import path from 'node:path';
import {createServer,loadEnv} from 'vite';
import crypto from 'node:crypto';
const metadata=JSON.parse(await fs.readFile('src/constants/metadata.json','utf8'));
const template=await fs.readFile('dist/index.html','utf8');
const env=loadEnv('production',process.cwd(),'');
let origin=env.VITE_SITE_URL?.trim();
if(origin){const u=new URL(origin);if(u.protocol!=='https:'||u.pathname!=='/'||/localhost|example\.(com|org|net)$/.test(u.hostname))throw new Error('VITE_SITE_URL must be your actual production HTTPS origin.');origin=u.origin;}
const server=await createServer({server:{middlewareMode:true,hmr:false,ws:false},appType:'custom'});
const {render}=await server.ssrLoadModule('/src/entry-server.tsx');
const escape=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const routes=[{url:'/',title:'Read, reflect & reconnect',description:'Read the complete Quran in the DigitalKhatt 610-page Indo-Pak 15-line edition. Explore 114 Surahs, Bengali and English translations, bookmarks and recitation.'},{url:'/surahs',title:'All 114 Surahs',description:'Browse all 114 Quran Surahs by English, Bengali and Arabic name. Open each Surah at its first ayah in the DigitalKhatt Indo-Pak Quran.'},{url:'/juz',title:'All 30 Paras / Juz',description:'Explore all 30 Quran Paras with verified starting Surah and ayah references and page numbers for the 610-page DigitalKhatt Indo-Pak edition.'},{url:'/about',title:'Sources, accuracy & privacy',description:'Quran text, layout, font, translation and audio sources for Hafezi Quran. Learn about the DigitalKhatt edition, numbering, licenses and local browser privacy.'},...['bookmarks','settings','search'].map(v=>({url:`/${v}`,title:v[0].toUpperCase()+v.slice(1),description:`${v==='bookmarks'?'Locally saved Quran bookmarks':v==='settings'?'Quran reading preferences':'Search Quran text, translations, Surahs and references'}.`,noindex:true}))];
for(let p=1;p<=610;p++)routes.push({url:`/read/${p}`,page:p,title:`Page ${p} — ${metadata.surahs.filter(s=>s.page<=p).at(-1).transliteration}`,description:`Read Quran page ${p} of 610 in the DigitalKhatt Indo-Pak 15-line edition, with original line boundaries, translations and recitation.`});
for(const s of metadata.surahs)routes.push({url:`/surah/${s.id}`,page:s.page,title:`${s.transliteration} (${s.id}) — ${s.translation}`,description:`Read Surah ${s.transliteration} (${s.name}), ${s.translation}, ${s.total_verses} ayahs. Opens on page ${s.page} of the DigitalKhatt Indo-Pak Quran with translations and audio.`,canonical:`/read/${s.page}`});
for(const j of metadata.juz)routes.push({url:`/juz/${j.number}`,page:j.page,title:`Para ${j.number} / Juz ${j.number}`,description:`Read Para ${j.number}, starting at ${metadata.surahs[j.surah-1].transliteration} ${j.surah}:${j.ayah}, on DigitalKhatt Indo-Pak page ${j.page}.`,canonical:`/read/${j.page}`});
try{
 await fs.writeFile('dist/offline-shell.html',template);
 for(const route of routes){
  const page=route.page?JSON.parse(await fs.readFile(`public/data/pages/${route.page}.json`,'utf8')):undefined;
  const html=await render(route.url,page);
  let output=template.replace(/<title>.*?<\/title>/,`<title>${escape(route.title)} | Hafezi Quran</title>`).replace(/<meta name="description"[^>]*>/,`<meta name="description" content="${escape(route.description)}"/>`).replace(/<meta property="og:title"[^>]*>/,`<meta property="og:title" content="${escape(route.title)} | Hafezi Quran"/>`).replace(/<meta property="og:description"[^>]*>/,`<meta property="og:description" content="${escape(route.description)}"/>`).replace('<div id="root"></div>',`<div id="root" data-prerender-path="${route.url}">${html}</div>`);
  if(route.noindex)output=output.replace('content="index, follow"','content="noindex, follow"');
  if(page){const json=JSON.stringify(page).replaceAll('<','\\u003c').replaceAll('\u2028','\\u2028').replaceAll('\u2029','\\u2029');output=output.replace('</head>',`<link rel="preload" href="/fonts/DigitalKhattIndoPak.woff2" as="font" type="font/woff2" crossorigin/><script>window.__QURAN_PAGE__=${json}</script></head>`);}
  if(origin){const url=new URL((route.canonical??route.url).replace(/\/?$/, '/'),origin).href;output=output.replace('</head>',`<link rel="canonical" href="${url}"/><meta property="og:url" content="${url}"/></head>`);if(route.url==='/'){const ld={'@context':'https://schema.org','@type':'WebSite',name:'Hafezi Quran',url:origin,inLanguage:['en','bn','ar'],description:route.description};output=output.replace('</head>',`<script type="application/ld+json">${JSON.stringify(ld)}</script></head>`);}}
  const target=route.url==='/'?'dist/index.html':`dist${route.url}/index.html`;await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,output);
 }
 const notFound=await render('/not-found');await fs.writeFile('dist/404.html',template.replace('<div id="root"></div>',`<div id="root">${notFound}</div>`).replace(/<title>.*?<\/title>/,'<title>Page not found | Hafezi Quran</title>').replace('content="index, follow"','content="noindex, follow"'));
 if(origin){const urls=routes.filter(r=>!r.noindex&&!r.canonical).map(r=>`<url><loc>${new URL(r.url.replace(/\/?$/, '/'),origin).href}</loc></url>`).join('');await fs.writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);}
 await fs.writeFile('dist/robots.txt',`User-agent: *\nAllow: /\n${origin?`Sitemap: ${origin}/sitemap.xml\n`:''}`);
 const assets=(await fs.readdir('dist/assets')).filter(f=>/\.(js|css)$/.test(f)).map(f=>`/assets/${f}`);
 const build=crypto.createHash('sha256').update(assets.join()).digest('hex').slice(0,10);
 const sw=await fs.readFile('scripts/sw-template.js','utf8');await fs.writeFile('dist/sw.js',sw.replace('__BUILD_ID__',build).replace('__SHELL_ASSETS__',JSON.stringify(['/offline-shell.html','/manifest.webmanifest','/favicon.svg','/icon-192.png','/icon-512.png',...assets])));
 console.log(`Pre-rendered ${routes.length} routes. ${origin?`Canonical origin: ${origin}`:'No domain configured: canonicals and sitemap intentionally omitted.'}`);
}finally{await server.close();}
