const { google } = require('googleapis');

/**
 * List upcoming events from the user's primary Google Calendar.
 */
async function listUpcomingEvents(authClient, { maxResults = 20 } = {}) {
  const calendar = google.calendar({ version: 'v3', auth: authClient });
  const { data } = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  });
  return (data.items || []).map(toSyncUpEvent);
}

/**
 * Create an event on the user's primary Google Calendar and return it
 * translated into SyncUp's event shape.
 */
async function createEvent(authClient, { name, date, time, notes }) {
  const calendar = google.calendar({ version: 'v3', auth: authClient });

  const start = time ? toRfc3339(date, time) : { date }; // all-day if no time
  const end = time ? toRfc3339(date, addOneHour(time)) : { date };

  const { data } = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: name,
      description: notes || '',
      start: time ? { dateTime: start } : start,
      end: time ? { dateTime: end } : end,
    },
  });

  return toSyncUpEvent(data);
}

function toRfc3339(date, time) {
  return `${date}T${time}:00`;
}

function addOneHour(time) {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(2000, 0, 1, h, m);
  d.setHours(d.getHours() + 1);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function toSyncUpEvent(gEvent) {
  const startDateTime = gEvent.start?.dateTime || gEvent.start?.date;
  const date = startDateTime ? startDateTime.slice(0, 10) : '';
  const time = gEvent.start?.dateTime ? startDateTime.slice(11, 16) : '';
  return {
    gcalId: gEvent.id,
    name: gEvent.summary || '(No title)',
    date,
    time,
    notes: gEvent.description || '',
    alarm: false,
    done: false,
    fromGcal: true,
  };
}

module.exports = { listUpcomingEvents, createEvent };
