const SHELL='hafezi-shell-__BUILD_ID__';
const DATA='hafezi-data-v1';
const ASSETS=__SHELL_ASSETS__;
self.addEventListener('install',event=>{event.waitUntil(caches.open(SHELL).then(cache=>cache.addAll(ASSETS)));});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{
 await Promise.all((await caches.keys()).filter(k=>k.startsWith('hafezi-shell-')&&k!==SHELL).map(k=>caches.delete(k)));
 // Remove the previous Bengali edition and its search snapshot without
 // evicting downloaded Arabic pages, English translations or fonts.
 const cache=await caches.open(DATA);
 await Promise.all((await cache.keys()).filter(request=>{const path=new URL(request.url).pathname;return path==='/data/search.json'||path.startsWith('/data/translations/bn/');}).map(request=>cache.delete(request)));
 await self.clients.claim();
})());});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 if(request.mode==='navigate'){
  event.respondWith((async()=>{const cache=await caches.open(SHELL);try{const response=await fetch(request,{signal:AbortSignal.timeout(5000)});if(response.ok)await cache.put(request,response.clone());return response;}catch{return await cache.match(request,{ignoreVary:true})||await cache.match('/offline-shell.html',{ignoreVary:true})||Response.error();}})());return;
 }
 if(url.pathname.startsWith('/data/')||url.pathname.startsWith('/fonts/')){
  event.respondWith((async()=>{const cache=await caches.open(DATA),cached=await cache.match(request,{ignoreVary:true});if(cached)return cached;const response=await fetch(request);if(response.ok&&(response.headers.get('content-type')?.includes('json')||url.pathname.startsWith('/fonts/')))await cache.put(request,response.clone());return response;})());return;
 }
 if(url.pathname.startsWith('/assets/')||ASSETS.includes(url.pathname))event.respondWith(caches.match(request,{ignoreVary:true}).then(cached=>cached||fetch(request)));
});
