/**
 * GoogleNewsService.js — Free news fetcher via Google News RSS
 * No API key required. No npm packages needed.
 * Uses built-in Node.js fetch to grab Google News RSS for a stock ticker.
 */

/**
 * Fetch recent news for a stock symbol from Google News RSS
 * @param {string} symbol Stock ticker (e.g. "AMZN", "AAPL")
 * @param {number} maxArticles Max articles to return
 * @returns {Promise<Object[]>} Array of news articles in standard format
 */
async function getCompanyNews(symbol, maxArticles = 10) {
  try {
    // Google News RSS for stock-related news
    const query = encodeURIComponent(`${symbol} stock`);
    const url = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;

    const res = await fetch(url, {
      headers: { 'User-Agent': 'StockQuest/1.0' },
    });

    if (!res.ok) throw new Error(`Google News RSS failed: ${res.status}`);

    const xml = await res.text();

    // Simple XML parsing — extract <item> blocks
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null && items.length < maxArticles) {
      const block = match[1];

      const title   = extractTag(block, 'title');
      const link    = extractTag(block, 'link');
      const pubDate = extractTag(block, 'pubDate');
      const source  = extractTag(block, 'source');

      if (title) {
        items.push({
          id: link || String(items.length),
          category: 'news',
          datetime: pubDate ? Math.floor(new Date(pubDate).getTime() / 1000) : Math.floor(Date.now() / 1000),
          headline: cleanHtml(title),
          summary: cleanHtml(title),
          source: source || 'Google News',
          url: link || '',
          image: '',
          related: symbol,
        });
      }
    }

    return items;
  } catch (error) {
    console.error(`GoogleNewsService Error for ${symbol}:`, error.message);
    return [];
  }
}

/** Extract text content of an XML tag */
function extractTag(xml, tag) {
  const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\\/${tag}>`, 's');
  const m = xml.match(regex);
  return m ? m[1].trim() : '';
}

/** Strip any remaining HTML tags */
function cleanHtml(str) {
  return str.replace(/<[^>]+>/g, '').trim();
}

module.exports = { getCompanyNews };
