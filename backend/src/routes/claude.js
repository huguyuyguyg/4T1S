const express = require('express');

const router = express.Router();

router.post('/message', async (req, res) => {
  const { prompt, system } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(501).json({ error: 'ANTHROPIC_API_KEY not configured on server' });
  }

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
        ...(system ? { system } : {}),
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      console.error('Anthropic API error:', data);
      return res.status(502).json({ error: data.error?.message || 'claude_request_failed' });
    }

    const text = data.content?.map((c) => c.text || '').join('') || '';
    res.json({ text });
  } catch (err) {
    console.error('Claude proxy failed:', err.message);
    res.status(502).json({ error: 'claude_request_failed' });
  }
});

module.exports = router;