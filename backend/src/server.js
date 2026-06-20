require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');

const authRoutes = require('./routes/auth');
const calendarRoutes = require('./routes/calendar');
const claudeRoutes = require('./routes/claude');

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:5173'],
    credentials: true,
  })
);
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/claude', claudeRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`SyncUp backend listening on http://localhost:${PORT}`);
});
