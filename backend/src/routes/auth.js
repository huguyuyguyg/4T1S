const express = require('express');
const { getAuthUrl, exchangeCodeForTokens, fetchProfileEmail } = require('../services/googleAuth');

const router = express.Router();

// Step 1: kick off the OAuth flow — redirect the browser to Google's consent screen.
router.get('/google', (req, res) => {
  const url = getAuthUrl();
  res.redirect(url);
});

// Step 2: Google redirects back here with a one-time `code`.
// We exchange it for tokens, store the tokens on the server-side session
// (never sent to the browser), and bounce the user back to the frontend.
router.get('/google/callback', async (req, res) => {
  const { code, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (error) {
    return res.redirect(`${frontendUrl}?gcal=error&reason=${encodeURIComponent(error)}`);
  }

  try {
    const { client, tokens } = await exchangeCodeForTokens(code);
    const email = await fetchProfileEmail(client);

    req.session.googleTokens = tokens;
    req.session.googleEmail = email;

    res.redirect(`${frontendUrl}?gcal=connected`);
  } catch (err) {
    console.error('Google OAuth callback failed:', err.message);
    res.redirect(`${frontendUrl}?gcal=error&reason=token_exchange_failed`);
  }
});

// Lets the frontend check whether this browser session is already linked
// to a Google account, and which one, without exposing tokens.
router.get('/status', (req, res) => {
  if (req.session.googleTokens) {
    return res.json({ connected: true, email: req.session.googleEmail || null });
  }
  res.json({ connected: false, email: null });
});

router.post('/logout', (req, res) => {
  req.session.googleTokens = null;
  req.session.googleEmail = null;
  res.json({ ok: true });
});

module.exports = router;
