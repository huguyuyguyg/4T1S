const express = require('express');
const { clientFromTokens } = require('../services/googleAuth');
const { listUpcomingEvents, createEvent } = require('../services/googleCalendar');

const router = express.Router();

// Require an active Google session for every route in this file.
router.use((req, res, next) => {
  if (!req.session.googleTokens) {
    return res.status(401).json({ error: 'not_connected', message: 'Connect Google Calendar first.' });
  }
  next();
});

router.get('/events', async (req, res) => {
  try {
    const client = clientFromTokens(req.session.googleTokens);
    const events = await listUpcomingEvents(client);
    res.json({ events });
  } catch (err) {
    console.error('Failed to list Google Calendar events:', err.message);
    res.status(502).json({ error: 'gcal_fetch_failed', message: err.message });
  }
});

router.post('/events', async (req, res) => {
  const { name, date, time, notes } = req.body || {};
  if (!name || !date) {
    return res.status(400).json({ error: 'invalid_event', message: 'name and date are required.' });
  }
  try {
    const client = clientFromTokens(req.session.googleTokens);
    const event = await createEvent(client, { name, date, time, notes });
    res.status(201).json({ event });
  } catch (err) {
    console.error('Failed to push event to Google Calendar:', err.message);
    res.status(502).json({ error: 'gcal_push_failed', message: err.message });
  }
});

module.exports = router;
