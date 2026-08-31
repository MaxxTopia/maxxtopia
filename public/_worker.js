const API_HOST = 'https://api.maxxtopia.com';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      const upstream = new URL(API_HOST);
      upstream.pathname = url.pathname.replace(/^\/api(?=\/|$)/, '') || '/';
      upstream.search = url.search;
      return fetch(new Request(upstream, request));
    }

    return env.ASSETS.fetch(request);
  },
};
