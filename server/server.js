/**
 * Spendly backend – proxies Gemini API so the API key never goes to the browser.
 * Run: npm install && node server.js
 * Set GEMINI_API_KEY in .env or environment.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve the expense tracker and other static files from project root
app.use(express.static(path.join(__dirname, '..')));

// Proxy: POST /api/gemini – body { summary, message } → Gemini → { reply }
app.post('/api/gemini', async (req, res) => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not set on server' });
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
    console.error('Gemini proxy error:', e.message);
    res.status(500).json({ error: 'AI unavailable right now. Your expense data is saved and working fine!' });
  }
});

app.listen(PORT, () => {
  console.log(`Spendly server running at http://localhost:${PORT}`);
  console.log(`Open: http://localhost:${PORT}/expense-tracker.html`);
  if (!process.env.GEMINI_API_KEY) {
    console.warn('Warning: GEMINI_API_KEY not set. Set it in .env or environment for SpendlyBot to work.');
  }
});
