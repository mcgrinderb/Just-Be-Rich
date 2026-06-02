import quote from './quote.js';
import news from './news.js';
import sectors from './sectors.js';
import watchlist from './watchlist.js';

export default {
  fetch: async (request, env, ctx) => {
    const { pathname } = new URL(request.url);

    if (pathname.startsWith('/api/quote')) {
      return quote.onRequestGet({ request, env });
    }
    if (pathname.startsWith('/api/news')) {
      return news.onRequestGet({ request, env });
    }
    if (pathname.startsWith('/api/sectors')) {
      return sectors.onRequestGet({ request, env });
    }
    if (pathname.startsWith('/api/watchlist')) {
      if (request.method === 'POST') {
        return watchlist.onRequestPost({ request, env });
      }
      return watchlist.onRequestGet({ request, env });
    }

    return new Response('Not Found', { status: 404 });
  },
};
