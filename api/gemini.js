/**
 * Vercel serverless proxy for Gemini (optional).
 * Deploy to Vercel, set GEMINI_API_KEY in project Environment Variables.
 * Then the front end uses the same origin (/api/gemini) when hosted on Vercel.
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not set' });
  }

  const { summary, message } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "message" in body' });
  }

  const systemText = `You are a friendly, sharp personal finance assistant embedded in an expense tracking app called Spendly. The user's current expense data is: ${summary || '{}'}. Give concise, actionable insights. Use AUD ($). Be direct, conversational, not overly formal. Max 3-4 sentences unless a breakdown is asked for.`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemText }] },
          contents: [{ role: 'user', parts: [{ text: message }] }],
          generationConfig: { maxOutputTokens: 1000 },
        }),
      }
    );
    const data = await geminiRes.json();
    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      data.error?.message ||
      'Sorry, I had trouble processing that. Try again!';
    res.json({ reply });
  } catch (e) {
    res.status(500).json({ error: 'AI unavailable right now. Your expense data is saved and working fine!' });
  }
};
