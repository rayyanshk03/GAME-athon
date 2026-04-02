/**
 * FinnhubService.js — Backend Finnhub API Service
 * Keeps the Finnhub API key securely on the server.
 * Frontend never touches this file or the API key.
 */

const API_KEY = process.env.FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

async function fetchWithThrottle(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Finnhub Error HTTP ${res.status}`);
  return res.json();
}

/**
 * Fetch current quote for a ticker
 * Returns: { c: current, d: change, dp: percent, h: high, l: low, o: open }
 */
async function getQuote(symbol) {
  if (!API_KEY) throw new Error('Missing Finnhub API Key');
  return fetchWithThrottle(`${BASE_URL}/quote?symbol=${symbol}&token=${API_KEY}`);
}

/**
 * Fetch OHLCV history (candles)
 * resolution: 1, 5, 15, 30, 60, D, W, M
 */
async function getHistory(symbol, resolution = 'D', days = 30) {
  if (!API_KEY) throw new Error('Missing Finnhub API Key');
  const to   = Math.floor(Date.now() / 1000);
  const from = to - (days * 24 * 60 * 60);
  return fetchWithThrottle(`${BASE_URL}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${API_KEY}`);
}

/**
 * Fetch recent company news
 */
async function getCompanyNews(symbol, days = 7) {
  if (!API_KEY) throw new Error('Missing Finnhub API Key');
  const to   = new Date().toISOString().split('T')[0];
  const from = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
  return fetchWithThrottle(`${BASE_URL}/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${API_KEY}`);
}

module.exports = { getQuote, getHistory, getCompanyNews };
