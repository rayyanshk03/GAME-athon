/**
 * YahooFinanceService.js
 * Fetches live NSE (Indian market) stock data via yahoo-finance2 v3.
 * NSE symbols use the ".NS" suffix (e.g. RELIANCE.NS, TCS.NS)
 */

const YahooFinanceClass = require('yahoo-finance2').default;
const yf = new YahooFinanceClass({ suppressNotices: ['yahooSurvey'] });

const YahooFinanceService = {
  /**
   * Fetch a live quote for a single NSE symbol.
   */
  async getQuote(symbol) {
    try {
      const result = await yf.quote(symbol);
      if (!result || !result.regularMarketPrice) return null;
      return {
        price:         result.regularMarketPrice,
        change:        result.regularMarketChange        ?? 0,
        changePercent: result.regularMarketChangePercent ?? 0,
        open:          result.regularMarketOpen          ?? result.regularMarketPrice,
        high:          result.regularMarketDayHigh       ?? result.regularMarketPrice,
        low:           result.regularMarketDayLow        ?? result.regularMarketPrice,
        volume:        result.regularMarketVolume        ?? 0,
        previousClose: result.regularMarketPreviousClose ?? result.regularMarketPrice,
      };
    } catch (err) {
      console.warn(`[Yahoo] getQuote(${symbol}) failed:`, err.message);
      return null;
    }
  },

  /**
   * Fetch historical OHLCV data for charting.
   */
  async getHistory(symbol, days = 90) {
    try {
      const endDate   = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const result = await yf.historical(symbol, {
        period1:  startDate.toISOString().split('T')[0],
        period2:  endDate.toISOString().split('T')[0],
        interval: '1d',
      });

      if (!result || result.length === 0) return null;

      return result.map(d => ({
        time:      new Date(d.date).getTime(),
        dateLabel: new Date(d.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        price:     d.close,
        open:      d.open,
        high:      d.high,
        low:       d.low,
        volume:    d.volume,
      }));
    } catch (err) {
      console.warn(`[Yahoo] getHistory(${symbol}) failed:`, err.message);
      return null;
    }
  },
};

module.exports = YahooFinanceService;
