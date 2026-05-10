/*
 * Discordmaxxer plugin-votes worker
 * Copyright (c) 2026 Diggy
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Backs the DiscordmaxxerVotes panel — MAXXER++ subscribers submit a
 * vote anchored to their HWID; aggregate counts come back via /tally.
 *
 * Routes:
 *   GET  /tally       → { ok: true, counts: { [feature_id]: number, ... } }
 *   POST /vote        → { ok: true, alreadyVoted?: boolean, count: number }
 *                        body: { feature_id, hwid }
 *
 * Tier gate is enforced client-side (panel only mounts the vote button
 * for MAXXER++). This worker validates payload shape + dedups by HWID.
 *
 * KV layout:
 *   count:<feature_id>           → string-encoded integer
 *   voted:<hwid>:<feature_id>    → "1"
 *
 * Voting concurrency: KV is eventually consistent and lacks atomic
 * increment. Two concurrent votes for the same feature could lose 1
 * count in the worst case. Acceptable for MVP-scale polls.
 */

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
};

function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json", ...corsHeaders },
    });
}

function badRequest(reason) {
    return jsonResponse({ ok: false, error: reason }, 400);
}

const FEATURE_ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

export default {
    async fetch(request, env) {
        if (request.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        const url = new URL(request.url);

        if (request.method === "GET" && url.pathname === "/tally") {
            return handleTally(env);
        }

        if (request.method === "POST" && url.pathname === "/vote") {
            return handleVote(request, env);
        }

        if (url.pathname === "/" || url.pathname === "/health") {
            return jsonResponse({ ok: true, service: "discordmaxxer-votes" });
        }

        return jsonResponse({ ok: false, error: "not-found" }, 404);
    },
};

async function handleTally(env) {
    const counts = {};
    let cursor = undefined;
    // KV list pagination — cap at a few pages so a runaway dataset can't
    // burn through CPU. ~10-50 candidate features expected, so 1 page is
    // plenty in practice.
    for (let page = 0; page < 5; page++) {
        const res = await env.VOTES.list({ prefix: "count:", cursor });
        for (const k of res.keys) {
            const featureId = k.name.slice("count:".length);
            const v = await env.VOTES.get(k.name);
            counts[featureId] = parseInt(v ?? "0", 10) || 0;
        }
        if (res.list_complete) break;
        cursor = res.cursor;
    }
    return jsonResponse({ ok: true, counts });
}

async function handleVote(request, env) {
    let body;
    try {
        body = await request.json();
    } catch {
        return badRequest("invalid-json");
    }

    const featureId = String(body?.feature_id ?? "").trim();
    const hwid = String(body?.hwid ?? "").trim();

    const maxFeatureLen = parseInt(env.MAX_FEATURE_LEN ?? "64", 10);
    const maxHwidLen = parseInt(env.MAX_HWID_LEN ?? "128", 10);

    if (!FEATURE_ID_RE.test(featureId) || featureId.length > maxFeatureLen) {
        return badRequest("invalid-feature-id");
    }
    if (!hwid || hwid.length > maxHwidLen) {
        return badRequest("invalid-hwid");
    }

    const dedupKey = `voted:${hwid}:${featureId}`;
    const countKey = `count:${featureId}`;

    const already = await env.VOTES.get(dedupKey);
    if (already) {
        const current = parseInt((await env.VOTES.get(countKey)) ?? "0", 10) || 0;
        return jsonResponse({ ok: true, alreadyVoted: true, count: current });
    }

    // Mark dedup first — if the count update races and we double-mark
    // dedup, the worst case is we under-count; better than over-counting.
    await env.VOTES.put(dedupKey, "1");

    const prev = parseInt((await env.VOTES.get(countKey)) ?? "0", 10) || 0;
    const next = prev + 1;
    await env.VOTES.put(countKey, String(next));

    return jsonResponse({ ok: true, alreadyVoted: false, count: next });
}
