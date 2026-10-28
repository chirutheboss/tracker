// Cloudflare Pages Function: shared store for the tracker. Needs a KV binding named MISSION_KV.
const SUBJ = ['Adv Accounts','Audit','FM','SM','DT','IDT','Costing','Law'];
const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

function clean(s) {
  const out = { entries: {}, times: {} };
  if (!s || typeof s !== 'object') return out;
  let n = 0;
  for (const [id, e] of Object.entries(s.entries || {})) {
    if (n >= 3000 || !e || typeof e !== 'object') continue;
    if (!/^[\w-]{1,40}$/.test(id) || !/^\d{4}-\d{2}-\d{2}$/.test(e.date) || !SUBJ.includes(e.subject)) continue;
    out.entries[id] = { id, date: e.date, subject: e.subject, topic: String(e.topic || '').slice(0, 200), done: !!e.done, c: +e.c || 0, u: +e.u || 0, ...(e.del ? { del: 1 } : {}) };
    n++;
  }
  for (const [d, t] of Object.entries(s.times || {})) if (/^\d{4}-\d{2}-\d{2}$/.test(d)) out.times[d] = Math.min(86400, Math.max(0, +t | 0));
  return out;
}

function merge(a, b) {
  const o = { entries: {}, times: {} };
  for (const s of [a, b]) {
    for (const [id, e] of Object.entries(s.entries)) if (!o.entries[id] || e.u > o.entries[id].u) o.entries[id] = e;
    for (const [d, t] of Object.entries(s.times)) o.times[d] = Math.max(o.times[d] || 0, t);
  }
  return o;
}

export async function onRequest({ request, env }) {
  const kv = env.MISSION_KV;
  if (!kv) return J({ error: 'KV binding MISSION_KV missing' }, 501);
  const raw = await kv.get('state');
  let cur = clean(raw ? JSON.parse(raw) : null);
  if (request.method === 'POST') {
    let inc;
    try { inc = clean(await request.json()); } catch (e) { return J({ error: 'bad json' }, 400); }
    const next = merge(cur, inc);
    const str = JSON.stringify(next);
    if (str !== JSON.stringify(cur)) await kv.put('state', str); // skip no-op writes (KV free tier = 1000 writes/day)
    cur = next;
  }
  return J(cur);
}
