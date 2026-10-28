const C='mission-v6';
const A=['./','tw.css','fonts.css','manifest.json','icons/icon-192.png','icons/icon-512.png','fonts/space-grotesk-latin-500-normal.woff2','fonts/space-grotesk-latin-700-normal.woff2','fonts/jetbrains-mono-latin-600-normal.woff2','fonts/jetbrains-mono-latin-800-normal.woff2'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>Promise.all(A.map(u=>c.add(u).catch(()=>{})))));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||new URL(r.url).pathname.includes('/api/'))return; // never cache API calls
  if(r.mode==='navigate'){e.respondWith(fetch(r).catch(()=>caches.match('./')));return;}
  e.respondWith(caches.match(r).then(m=>m||fetch(r)));
});
