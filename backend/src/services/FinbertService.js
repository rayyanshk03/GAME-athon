/**
 * FinbertService.js — Backend FinBERT Sentiment Service
 * Uses Hugging Face Inference API when key is available.
 * Falls back to a curated financial keyword analyzer when no key is set.
 */
const { HfInference } = require('@huggingface/inference');

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// ── Curated financial keyword sentiment (used when no API key) ────────
const BULLISH_WORDS = {
  strong: ['surges','soars','skyrockets','rally','boom','breakout','record high','all-time high','blowout'],
  moderate: ['rises','gains','beats','upgrade','buy','outperform','growth','profit','revenue up',
             'earnings beat','strong quarter','dividend','bullish','optimistic','expansion',
             'deal','partnership','innovation','launch','approved','recovery','rebound'],
  mild: ['up','higher','positive','stable','steady','holds','maintains','improves','advances']
};

const BEARISH_WORDS = {
  strong: ['crashes','plunges','collapses','plummets','freefall','bankruptcy','fraud','scandal'],
  moderate: ['falls','drops','misses','downgrade','sell','underperform','decline','loss','revenue down',
             'earnings miss','weak quarter','layoffs','bearish','pessimistic','contraction',
             'lawsuit','investigation','recall','warning','cuts','slump','tumbles'],
  mild: ['down','lower','negative','pressure','concern','risk','volatility','uncertain','slips']
};

/**
 * Local keyword-based financial sentiment analyzer (no API key needed)
 */
function localSentiment(text) {
  const t = text.toLowerCase();
  let score = 0;

  // Check bullish words (weighted)
  for (const word of BULLISH_WORDS.strong)   { if (t.includes(word)) score += 0.85; }
  for (const word of BULLISH_WORDS.moderate) { if (t.includes(word)) score += 0.55; }
  for (const word of BULLISH_WORDS.mild)     { if (t.includes(word)) score += 0.25; }

  // Check bearish words (weighted)
  for (const word of BEARISH_WORDS.strong)   { if (t.includes(word)) score -= 0.85; }
  for (const word of BEARISH_WORDS.moderate) { if (t.includes(word)) score -= 0.55; }
  for (const word of BEARISH_WORDS.mild)     { if (t.includes(word)) score -= 0.25; }

  // Clamp to [-1, 1]
  score = Math.max(-1, Math.min(1, score));

  // Determine sentiment label
  let sentiment = 'neutral';
  if (score > 0.15)  sentiment = 'positive';
  if (score < -0.15) sentiment = 'negative';

  // Add a tiny bit of noise to avoid all-identical scores
  const noise = (Math.random() * 0.06) - 0.03;
  const impact = Math.max(-1, Math.min(1, score + noise));

  return { sentiment, impact: Math.round(impact * 100) / 100 };
}

/**
 * Analyze financial sentiment using ProsusAI/finbert (Hugging Face)
 * Falls back to local keyword analyzer if no API key is set.
 * @param {string[]} transcripts Array of strings to analyze
 * @returns {Promise<Object[]>} Array of { sentiment, impact }
 */
async function analyzeSentiment(transcripts) {
  // If no API key, use local keyword analyzer
  if (!process.env.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_KEY === 'your_huggingface_token_here') {
    console.warn('FinbertService: No HUGGINGFACE_API_KEY — using local keyword sentiment.');
    return transcripts.map(text => localSentiment(text));
  }

  try {
    const results = await Promise.all(transcripts.map(async (text) => {
      const out = await hf.textClassification({
        model: 'ProsusAI/finbert',
        inputs: text,
      });

      const top = out[0]; 
      const sentiment = top.label.toLowerCase();
      
      let impact = top.score;
      if (sentiment === 'negative') impact = -impact;
      if (sentiment === 'neutral')  impact = (Math.random() * 0.2) - 0.1;

      return { sentiment, impact: Math.round(impact * 100) / 100 };
    }));

    return results;
  } catch (error) {
    console.error('FinbertService API Error, falling back to local:', error.message);
    // Fall back to local analyzer on API error too
    return transcripts.map(text => localSentiment(text));
  }
}

module.exports = { analyzeSentiment };
