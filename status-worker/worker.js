/*
 * maxxtopia-status -- the KILL SWITCH / maintenance toggle for the flagship site.
 *
 * WHY: maxxtopia is a static site, so normally pulling a product or marking it
 * "down" means editing code + redeploying. This worker lets Diggy flip a product
 * into MAINTENANCE mode himself, instantly, with zero code and no rebuild -- just
 * click a link in the control panel. Every visitor to that product's page then
 * sees a red "temporarily under maintenance" banner within ~20s. Flip it back to
 * clear it. The site reads this fail-open: if this worker is ever unreachable, the
 * site simply shows no banner (never breaks).
 *
 * KV key "maint" = { "<slug>": { "msg": "optional custom text" }, ... }
 */

const SLUGS = ["optimizationmaxxing", "discordmaxxer", "clipmaxxer", "dropmaxxer", "aimmaxxer", "viewmaxxing", "extensionmaxxing", "streammaxxing", "snipemaxxer", "playlistmaxxing"];
const CORS = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET,OPTIONS", "access-control-allow-headers": "*" };

function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
async function readMap(env) { const raw = await env.SITE_STATUS.get("maint"); return raw ? JSON.parse(raw) : {}; }
async function writeMap(env, m) { await env.SITE_STATUS.put("maint", JSON.stringify(m)); }

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    const url = new URL(req.url);
    const key = (url.searchParams.get("key") || "").trim();
    const expected = (env.STATUS_KEY || "").trim();
    const authed = expected && key === expected;

    // PUBLIC: the site's banner script reads this (fail-open on the client).
    if (url.pathname === "/s.json") {
      const m = await readMap(env);
      return new Response(JSON.stringify({ m }), { headers: { "content-type": "application/json", ...CORS, "cache-control": "max-age=20" } });
    }

    // everything else is the private control surface
    if (!authed) return new Response("forbidden", { status: 403 });

    if (url.pathname === "/set") {
      const p = (url.searchParams.get("p") || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);
      const on = url.searchParams.get("on") === "1";
      if (!p) return new Response("missing p", { status: 400 });
      const m = await readMap(env);
      if (on) m[p] = { msg: (url.searchParams.get("msg") || "").slice(0, 200) };
      else delete m[p];
      await writeMap(env, m);
      return panel(env, m, `${p} is now ${on ? "UNDER MAINTENANCE" : "LIVE"}.`, key);
    }

    const m = await readMap(env);
    return panel(env, m, "", key);
  }
};

function panel(env, m, note, key) {
  const k = encodeURIComponent(key);
  const rows = SLUGS.map(s => {
    const down = !!m[s];
    const to = down ? `/set?key=${k}&p=${s}&on=0` : `/set?key=${k}&p=${s}&on=1`;
    return `<tr><td>${esc(s)}</td><td>${down ? '<b style="color:#e0415a">UNDER MAINTENANCE</b>' : '<span style="color:#39d98a">live</span>'}</td><td><a class="btn ${down ? "live" : "down"}" href="${to}">${down ? "Set LIVE" : "Set MAINTENANCE"}</a></td></tr>`;
  }).join("");
  const html = `<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><title>maxxtopia kill switch</title>
<style>body{background:#0d1117;color:#e6edf3;font:15px/1.5 system-ui,sans-serif;max-width:620px;margin:0 auto;padding:24px}
h1{font-size:19px;margin:0 0 4px}table{width:100%;border-collapse:collapse;margin-top:8px}td{padding:9px 6px;border-bottom:1px solid #232b36}
.btn{display:inline-block;padding:6px 12px;border-radius:7px;text-decoration:none;font-weight:700;font-size:13px}
.btn.down{background:#b3203a;color:#fff}.btn.live{background:#1f6f3f;color:#fff}
.note{background:#182634;border:1px solid #2b9be0;border-radius:8px;padding:10px 12px;margin:12px 0;font-weight:600}
.hint{color:#8b949e;font-size:13px;margin:14px 0 0}</style>
<h1>maxxtopia kill switch</h1>
<div class="hint">Flip a product to MAINTENANCE and everyone on its page sees a red "temporarily under maintenance" banner within ~20s. No code, no rebuild. Flip back to LIVE to clear it. <b>Bookmark this page.</b></div>
${note ? `<div class="note">${esc(note)}</div>` : ""}
<table>${rows}</table>
<p class="hint">This only flips a banner on/off -- it never touches your site's code. If this panel is ever unreachable, the site shows no banner (fails safe).</p>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
