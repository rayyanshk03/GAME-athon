const yahooFinance = require('yahoo-finance2').default;
async function test() {
  try {
    const quote = await yahooFinance.quote('AAPL');
    console.log('Quote:', quote);
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
