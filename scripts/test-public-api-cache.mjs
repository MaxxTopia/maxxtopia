import assert from 'node:assert/strict';
import test from 'node:test';
import pageWorker from '../public/_worker.js';

async function withRuntime({ cacheEnabled = true, respond } = {}, run) {
  const fetchDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'fetch');
  const cacheDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'caches');
  const entries = new Map();
  const upstreamCalls = [];
  const pending = [];
  const cache = {
    async match(request) {
      return entries.get(request.url)?.clone();
    },
    async put(request, response) {
      entries.set(request.url, response.clone());
    },
  };

  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    value: async (request) => {
      upstreamCalls.push(new URL(request.url));
      return respond ? respond(request) : new Response('ok', { status: 200 });
    },
  });
  Object.defineProperty(globalThis, 'caches', {
    configurable: true,
    value: cacheEnabled ? { default: cache } : undefined,
  });

  try {
    await run({ entries, upstreamCalls, pending });
  } finally {
    if (fetchDescriptor) Object.defineProperty(globalThis, 'fetch', fetchDescriptor);
    else delete globalThis.fetch;
    if (cacheDescriptor) Object.defineProperty(globalThis, 'caches', cacheDescriptor);
    else delete globalThis.caches;
  }
}

async function request(path, pending) {
  const ctx = { waitUntil: (promise) => pending.push(Promise.resolve(promise)) };
  const response = await pageWorker.fetch(
    new Request(`https://leaderboard.maxxtopia.com${path}`),
    { ASSETS: { fetch: async () => new Response('asset') } },
    ctx,
  );
  await Promise.all(pending.splice(0));
  return response;
}

test('shares a successful standings response for its edge TTL', async () => {
  await withRuntime({}, async ({ upstreamCalls, pending }) => {
    const first = await request('/api/standings?eventId=event&windowId=round', pending);
    assert.equal(first.status, 200);
    assert.equal(first.headers.get('x-maxxtopia-edge-cache'), 'MISS');
    assert.equal(first.headers.get('cache-control'), 'public, max-age=90');
    assert.equal(upstreamCalls[0].origin, 'https://api.maxxtopia.com');
    assert.equal(upstreamCalls[0].pathname, '/standings');

    const second = await request('/api/standings?eventId=event&windowId=round', pending);
    assert.equal(second.headers.get('x-maxxtopia-edge-cache'), 'HIT');
    assert.equal(await second.text(), 'ok');
    assert.equal(upstreamCalls.length, 1);
  });
});

test('uses longer catalog TTLs for history and bypasses caching for failures', async () => {
  await withRuntime({
    respond: (request) => new Response(new URL(request.url).search, { status: 200 }),
  }, async ({ upstreamCalls, pending }) => {
    const active = await request('/api/tournaments?region=ALL', pending);
    const history = await request('/api/tournaments?region=ALL&history=1', pending);
    assert.equal(active.headers.get('cache-control'), 'public, max-age=120');
    assert.equal(history.headers.get('cache-control'), 'public, max-age=300');
    assert.equal(upstreamCalls.length, 2);
  });

  await withRuntime({ respond: () => new Response('quota exhausted', { status: 502 }) }, async ({ upstreamCalls, pending }) => {
    const first = await request('/api/standings?eventId=event&windowId=round', pending);
    const second = await request('/api/standings?eventId=event&windowId=round', pending);
    assert.equal(first.status, 502);
    assert.equal(second.status, 502);
    assert.equal(first.headers.get('x-maxxtopia-edge-cache'), null);
    assert.equal(upstreamCalls.length, 2);
  });
});

test('passes through safely when the Cache API is unavailable', async () => {
  await withRuntime({ cacheEnabled: false }, async ({ upstreamCalls, pending }) => {
    const response = await request('/api/standings?eventId=event&windowId=round', pending);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-maxxtopia-edge-cache'), 'BYPASS');
    assert.equal(upstreamCalls.length, 1);
  });
});
