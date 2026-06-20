# SyncUp Backend

Express server that handles real Google Calendar sync (OAuth2 + Calendar API)
and proxies Claude API calls so the Anthropic key never reaches the browser.

## Setup

1. **Create Google OAuth credentials**
   - Go to https://console.cloud.google.com/apis/credentials
   - Create an OAuth 2.0 Client ID, type "Web application"
   - Enable the **Google Calendar API** for the project (APIs & Services → Library)
   - Add an authorized redirect URI matching `GOOGLE_REDIRECT_URI` below,
     e.g. `http://localhost:4000/api/auth/google/callback`

2. **Configure environment**
   ```bash
   cd backend
   cp .env.example .env
   # fill in GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, ANTHROPIC_API_KEY, SESSION_SECRET
   ```

3. **Install & run**
   ```bash
   npm install
   npm run dev   # or: npm start
   ```
   Server listens on `http://localhost:4000` by default.

4. **Point the frontend at it.** The frontend's `public/index.html` sets
   `window.SYNCUP_API_BASE` — leave it as `http://localhost:4000` for local
   dev, or change it to your deployed backend URL.

## How the Google Calendar sync works

- The frontend's "Authorise & Connect" button sends the browser to
  `GET /api/auth/google`, which redirects to Google's real consent screen.
- Google redirects back to `GET /api/auth/google/callback` with a one-time
  code. The backend exchanges it for access/refresh tokens and stores them
  in a server-side session (httpOnly cookie — tokens never reach the browser).
- `GET /api/auth/status` lets the frontend know if the current browser
  session is connected, and to which email.
- `GET /api/calendar/events` pulls upcoming events from the user's primary
  Google Calendar.
- `POST /api/calendar/events` creates a new event on the user's primary
  Google Calendar (used when "Push to Google Calendar" is checked).

## API summary

| Method | Path                          | Purpose                                  |
|--------|-------------------------------|-------------------------------------------|
| GET    | /api/health                   | Liveness check                            |
| GET    | /api/auth/google               | Start Google OAuth flow                   |
| GET    | /api/auth/google/callback      | OAuth redirect target (Google calls this) |
| GET    | /api/auth/status               | Is this session connected to Google?      |
| POST   | /api/auth/logout               | Clear the Google session                  |
| GET    | /api/calendar/events           | List upcoming Google Calendar events      |
| POST   | /api/calendar/events           | Create an event on Google Calendar        |
| POST   | /api/claude/message             | Proxy a prompt to Claude                  |

## Notes on production hardening

This demo stores OAuth tokens in an in-memory `express-session` store, which
is fine for local development but resets on server restart and won't scale
across multiple server instances. For production:
- Use a persistent session store (e.g. Redis) or save tokens in your user DB.
- Serve over HTTPS and set `cookie.secure = true`.
- Add CSRF protection if you expose any session-mutating GET routes publicly.
