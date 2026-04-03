/**
 * FinnhubService.js — Backend Finnhub API Service
 * Requires FINNHUB_API_KEY in .env
 */
const finnhub = require('finnhub');

const api_key = finnhub.ApiClient.instance.authentications['api_key'];
api_key.apiKey = process.env.FINNHUB_API_KEY;

const finnhubClient = new finnhub.DefaultApi();

/**
 * Fetch current quote for a ticker
 * Returns Finnhub native format: { c: current, d: change, dp: percent, h: high, l: low, o: open }
 */
async function getQuote(symbol) {
  return new Promise((resolve, reject) => {
    finnhubClient.quote(symbol, (error, data, response) => {
      if (error) {
        console.error(`FinnhubService.getQuote Error for ${symbol}:`, error);
        return reject(error);
      }
      resolve(data);
    });
  });
}

/**
 * Fetch OHLCV history (candles)
 */
async function getHistory(symbol, resolution = 'D', days = 30) {
  const to = Math.floor(Date.now() / 1000);
  const from = to - (days * 24 * 60 * 60);

  return new Promise((resolve, reject) => {
    finnhubClient.stockCandles(symbol, resolution, from, to, (error, data, response) => {
      if (error) {
        console.error(`FinnhubService.getHistory Error for ${symbol}:`, error);
        return reject(error);
      }
      resolve(data);
    });
  });
}

/**
 * Fetch recent company news
 */
async function getCompanyNews(symbol, days = 7) {
  const today = new Date().toISOString().split('T')[0];
  const lastWeek = new Date(Date.now() - (days * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

  return new Promise((resolve, reject) => {
    finnhubClient.companyNews(symbol, lastWeek, today, (error, data, response) => {
      if (error) {
        console.error(`FinnhubService.getCompanyNews Error for ${symbol}:`, error);
        return reject(error);
      }
      resolve(data);
    });
  });
}

module.exports = { getQuote, getHistory, getCompanyNews };
