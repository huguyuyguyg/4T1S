const { google } = require('googleapis');

function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

// Calendar scopes: read/write access to the user's events, plus basic profile
// so we can show which Google account is connected.
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'openid',
];

function getAuthUrl() {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline', // request a refresh token
    prompt: 'consent', // force refresh_token on every connect
    scope: SCOPES,
  });
}

async function exchangeCodeForTokens(code) {
  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  return { client, tokens };
}

function clientFromTokens(tokens) {
  const client = createOAuthClient();
  client.setCredentials(tokens);
  return client;
}

async function fetchProfileEmail(client) {
  const oauth2 = google.oauth2({ version: 'v2', auth: client });
  const { data } = await oauth2.userinfo.get();
  return data.email;
}

module.exports = { createOAuthClient, getAuthUrl, exchangeCodeForTokens, clientFromTokens, fetchProfileEmail, SCOPES };
