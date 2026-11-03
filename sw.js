const CACHE='rondas-v0.3';
const SHELL=['./','index.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
function timeout(ms){return new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),ms))}
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(req.mode==='navigate'){
    // red primero (para recibir versiones nuevas), con tope de 2,5 s; sin señal usa la copia guardada
    e.respondWith(Promise.race([fetch(req),timeout(2500)]).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put('index.html',cp));return r})
      .catch(()=>caches.match('index.html')));
    return;
  }
  if(url.hostname.endsWith('fonts.googleapis.com')||url.hostname.endsWith('fonts.gstatic.com')){
    e.respondWith(caches.open(CACHE).then(c=>c.match(req).then(hit=>{const net=fetch(req).then(r=>{c.put(req,r.clone());return r}).catch(()=>hit);return hit||net})));
    return;
  }
  e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{if(url.origin===location.origin){const cp=r.clone();caches.open(CACHE).then(c=>c.put(req,cp))}return r})));
});
