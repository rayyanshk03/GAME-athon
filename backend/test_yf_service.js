const yf = require('./src/services/YahooFinanceService');
async function test() {
  try {
    const q = await yf.getQuote('AAPL');
    console.log('Result:', q);
  } catch (err) {
    console.error('Thrown Error:', err);
  }
}
test();
