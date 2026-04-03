const { getQuote, getHistory } = require('./src/services/YahooFinanceService');

(async () => {
    try {
        console.log('Testing getQuote...');
        const quote = await getQuote('AAPL');
        console.log('Quote:', quote);
        
        console.log('Testing getHistory...');
        const history = await getHistory('AAPL');
        console.log('History:', history?.c?.slice(-2));
    } catch(e) {
        console.error('Fatal Test Error:', e.message || e);
    }
})();
