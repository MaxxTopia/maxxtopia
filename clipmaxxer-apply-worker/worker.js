// clipmaxxer-apply worker - intake for the done-for-you clipmaxxer service.
//
// Streamers APPLY from maxxtopia.com/clipmaxxer (channel + audience + which
// socials to auto-post to). Diggy reviews, approves the ones he can automate,
// and bills them. No accounts, no payments here - just a robust intake inbox.
//
//   POST /apply   body { name, channel, audience, platforms, contact, notes }
//                 -> stores apply:<ts>-<rand> in KV, returns { ok:true }
//   GET  /admin?key=ADMIN_KEY   -> simple HTML list of applications (newest first)
//   GET  /                      -> health
//
// KV binding: APPLIES   ·   Secret: ADMIN_KEY
// Free tier: KV writes/reads are trivially within limits at this volume.

const CORS = {
  'Access-Control-Allow-Origin': 'https://maxxtopia.com',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS, ...extra },
  });
}

function clean(s, max = 300) {
  // strip control chars only (keep dashes, slashes, @ for handles/URLs)
  return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, max);
}

async function handleApply(request, env) {
  let b;
  try { b = await request.json(); } catch { return json({ ok: false, error: 'bad json' }, 400); }

  const channel = clean(b.channel, 200);
  const contact = clean(b.contact, 200);
  if (!channel || !contact) {
    return json({ ok: false, error: 'channel and contact are required' }, 400);
  }
  const rec = {
    name: clean(b.name, 120),
    channel,                                  // twitch/youtube handle or URL
    audience: clean(b.audience, 120),         // rough follower / avg-viewer count
    platforms: clean(b.platforms, 200),       // where to auto-post (tiktok/shorts/reels)
    contact,                                  // discord/email to reach them
    notes: clean(b.notes, 1000),
    at: new Date().toISOString(),
    ua: clean(request.headers.get('user-agent') || '', 200),
  };
  const id = `apply:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await env.APPLIES.put(id, JSON.stringify(rec));
  return json({ ok: true });
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
  ));
}

async function handleAdmin(url, env) {
  if (url.searchParams.get('key') !== env.ADMIN_KEY) {
    return new Response('forbidden', { status: 403 });
  }
  const list = await env.APPLIES.list({ prefix: 'apply:' });
  const recs = [];
  for (const k of list.keys) {
    const raw = await env.APPLIES.get(k.name);
    if (raw) { try { recs.push(JSON.parse(raw)); } catch {} }
  }
  recs.sort((a, b) => (b.at || '').localeCompare(a.at || ''));
  const rows = recs.map((r) => `
    <tr>
      <td>${esc(r.at)}</td>
      <td><b>${esc(r.channel)}</b><br><span class=m>${esc(r.name)}</span></td>
      <td>${esc(r.audience)}</td>
      <td>${esc(r.platforms)}</td>
      <td>${esc(r.contact)}</td>
      <td>${esc(r.notes)}</td>
    </tr>`).join('');
  const html = `<!doctype html><meta charset=utf-8><title>clipmaxxer applications</title>
    <style>body{font:14px system-ui;background:#0a0612;color:#eee;padding:20px}
    h1{font-size:18px}table{border-collapse:collapse;width:100%}
    td,th{border:1px solid #333;padding:8px;vertical-align:top;text-align:left}
    th{color:#e25bff}.m{color:#888;font-size:12px}</style>
    <h1>clipmaxxer applications (${recs.length})</h1>
    <table><tr><th>When</th><th>Channel</th><th>Audience</th><th>Post to</th><th>Contact</th><th>Notes</th></tr>${rows}</table>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (url.pathname === '/apply' && request.method === 'POST') return handleApply(request, env);
    if (url.pathname === '/admin' && request.method === 'GET') return handleAdmin(url, env);
    if (url.pathname === '/') return json({ ok: true, service: 'clipmaxxer-apply' });
    return json({ ok: false, error: 'not found' }, 404);
  },
};
