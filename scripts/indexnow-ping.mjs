#!/usr/bin/env node
/**
 * IndexNow ping — instantly notifies Bing, Yandex, Seznam, Naver, and
 * (in the future) Brave that our URLs changed. Cuts indexing latency
 * from weeks to hours.
 *
 * Run after every deploy that touches user-visible pages:
 *   node scripts/indexnow-ping.mjs
 *
 * Endpoint accepts up to 10,000 URLs per request. We're nowhere near
 * that, so one POST covers the whole site.
 *
 * Key file MUST be served at https://maxxtopia.com/<KEY>.txt with the
 * KEY as the entire body — public/<KEY>.txt is committed for this.
 */

const KEY = 'b810ea0eafe507e8742ec215b679aa76';
const HOST = 'maxxtopia.com';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

const SLUGS = [
  '',
  'why',
  'updates',
  'optimizationmaxxing',
  'discordmaxxer',
  'clipmaxxer',
  'dropmaxxer',
  'aimmaxxer',
  'viewmaxxing',
  'extensionmaxxing',
];

const urlList = SLUGS.map((s) => `https://${HOST}/${s}`);

const body = {
  host: HOST,
  key: KEY,
  keyLocation: KEY_LOCATION,
  urlList,
};

const endpoints = [
  'https://api.indexnow.org/IndexNow',
  'https://www.bing.com/indexnow',
  'https://yandex.com/indexnow',
];

for (const endpoint of endpoints) {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    });
    console.log(`${endpoint} -> ${res.status} ${res.statusText}`);
  } catch (err) {
    console.error(`${endpoint} -> error`, err.message);
  }
}
