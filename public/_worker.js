const API_HOST = 'https://api.maxxtopia.com';

function publicApiTtl(pathname, searchParams) {
  if (pathname === '/api/tournaments') {
    return /^(1|true|yes)$/i.test(searchParams.get('history') || '') ? 300 : 120;
  }
  if (pathname === '/api/cutoffs') return 180;
  if (pathname === '/api/standings') return 90;
  return 0;
}

function edgeCacheMarker(response, value) {
  const headers = new Headers(response.headers);
  headers.set('x-maxxtopia-edge-cache', value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      const ttl = request.method === 'GET' ? publicApiTtl(url.pathname, url.searchParams) : 0;
      if (ttl > 0) {
        const cache = globalThis.caches?.default;
        const cacheKey = new Request(url.toString(), { method: 'GET' });
        if (cache) {
          try {
            const cached = await cache.match(cacheKey);
            if (cached) return edgeCacheMarker(cached, 'HIT');
          } catch {
            // A cache miss or unavailable edge cache must not block the live API.
          }
        }

        const upstream = new URL(API_HOST);
        upstream.pathname = url.pathname.replace(/^\/api(?=\/|$)/, '') || '/';
        upstream.search = url.search;
        const response = await fetch(new Request(upstream, request));
        if (response.status === 200) {
          const headers = new Headers(response.headers);
          headers.set('cache-control', `public, max-age=${ttl}`);
          const cacheable = new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
          });
          if (cache) {
            try {
              const write = cache.put(cacheKey, cacheable.clone());
              if (ctx && ctx.waitUntil) ctx.waitUntil(write);
              else await write;
            } catch {
              // The live API response is still useful when this POP cannot cache it.
            }
          }
          return edgeCacheMarker(cacheable, cache ? 'MISS' : 'BYPASS');
        }
        return response;
      }

      const upstream = new URL(API_HOST);
      upstream.pathname = url.pathname.replace(/^\/api(?=\/|$)/, '') || '/';
      upstream.search = url.search;
      return fetch(new Request(upstream, request));
    }

    return env.ASSETS.fetch(request);
  },
};
