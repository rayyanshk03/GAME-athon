/**
 * NewsApiService.js — Backend NewsAPI Service
 * Requires NEWS_API_KEY in .env
 */
const NewsAPI = require('newsapi');
const newsapi = new NewsAPI(process.env.NEWS_API_KEY);

/**
 * Fetch top headlines or "everything" for a query
 * Map to common format: { id, headline, summary, source, url, datetime, image }
 */
async function getEverything(query, days = 7) {
  const fromDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
  
  try {
    const response = await newsapi.v2.everything({
      q: query,
      from: fromDate,
      sortBy: 'relevancy',
      language: 'en',
      pageSize: 10
    });

    if (response.status !== 'ok') {
      throw new Error(`NewsAPI error: ${response.message || 'Unknown error'}`);
    }

    return response.articles.map((a, i) => ({
      id: a.url || String(i),
      category: 'news',
      datetime: Math.floor(new Date(a.publishedAt).getTime() / 1000),
      headline: a.title,
      summary: a.description || a.title,
      source: a.source?.name || 'NewsAPI',
      url: a.url,
      image: a.urlToImage || '',
      related: query
    }));
  } catch (error) {
    console.error(`NewsApiService.getEverything Error for ${query}:`, error);
    return [];
  }
}

module.exports = { getEverything };
