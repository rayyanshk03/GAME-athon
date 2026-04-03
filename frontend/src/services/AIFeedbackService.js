export const getFallback = () => {
  return "💡 Great question! Combine the chart, RSI/trend signals, and Crowd+AI score before placing a bet. Check the Learning Hub for deeper lessons.";
};

export const callGroq = async (prompt) => {
  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY?.trim();
  if (!GROQ_API_KEY) return getFallback();

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: 'You are FINBOT, a helpful and friendly stock market tutor for beginner traders. Keep answers concise, educational, and encouraging. Respond in 2-4 sentences max.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq API returned ${response.status}. Details: ${errorBody}`);
  }

  const data = await response.json();
  try {
    return data.choices[0].message.content;
  } catch {
    throw new Error('Received an unexpected response format from Groq API.');
  }
};

export const answerTradingQuestion = async (question) => {
  try {
    return await callGroq(question);
  } catch (e) {
    console.error('[AIFeedbackService] Error:', e.message);
    throw e;
  }
};
