const C='misflyers-v22';
self.addEventListener('install',e=>{self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==C).map(n=>caches.delete(n)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);const fresh=u.origin===location.origin&&!/\.(jpg|png)$/i.test(u.pathname);
  const req=fresh?new Request(e.request,{cache:'no-cache'}):e.request;
  e.respondWith(fetch(req).then(r=>{const c=r.clone();caches.open(C).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request)))});
