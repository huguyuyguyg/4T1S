/* ============================================================
   GOOGLE CALENDAR INTEGRATION — real OAuth via backend
   ============================================================ */
function connectGoogleCalendar() { openSheet('gcalOverlay'); }

// "Authorise & Connect" now sends the browser to our backend, which
// redirects to Google's real consent screen. Google redirects back to
// our backend callback, which stores tokens server-side and bounces the
// user back here with ?gcal=connected.
function confirmGcalConnect() {
  window.location.href = `${API_BASE}/api/auth/google`;
}

// Called once on page load to pick up ?gcal=connected|error from the
// OAuth redirect, and to restore connection state on refresh.
async function initGcalStatus() {
  const params = new URLSearchParams(window.location.search);
  const gcalParam = params.get('gcal');
  if (gcalParam) {
    // Clean the query string so refreshing doesn't re-trigger the toast.
    window.history.replaceState({}, '', window.location.pathname);
  }

  try {
    const status = await apiGet('/api/auth/status');
    if (status.connected) {
      applyGcalConnectedUi(status.email);
      if (gcalParam === 'connected') showNotification('✅ Google Calendar connected!');
      await syncEventsFromGoogle();
    } else if (gcalParam === 'error') {
      showNotification('Google Calendar connection failed. Please try again.');
    }
  } catch (e) {
    // Backend not reachable yet (e.g. not started) — fail silently in the UI.
    console.warn('Could not reach SyncUp backend for Google Calendar status:', e.message);
  }
}

function applyGcalConnectedUi(email) {
  gcalConnected = true;
  gcalEmail = email || gcalEmail;
  closeSheet('gcalOverlay');

  const chip = document.getElementById('gcalStatusChip');
  if (chip) {
    chip.style.display = 'flex';
    chip.innerHTML = `<span class="gcal-connected"><svg width="14" height="14" viewBox="0 0 24 24" fill="#5fd98a"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Google Calendar connected · ${gcalEmail || ''}</span>`;
  }

  const gcalBtn = document.getElementById('gcalSyncBtn');
  if (gcalBtn) {
    gcalBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Synced`;
    gcalBtn.style.background = '#2d7d3a';
  }
}

// Pulls real upcoming events from the user's primary Google Calendar and
// merges any not already present (matched by gcalId) into calendarEvents.
async function syncEventsFromGoogle() {
  try {
    const { events } = await apiGet('/api/calendar/events');
    const existingGcalIds = new Set(calendarEvents.filter(e => e.gcalId).map(e => e.gcalId));
    let importedCount = 0;

    events.forEach(e => {
      if (existingGcalIds.has(e.gcalId)) return;
      calendarEvents.push({ id: nextEventId++, ...e });
      importedCount++;
    });

    const banner = document.getElementById('gcalImportedEvents');
    if (banner) {
      banner.innerHTML = `
        <div class="ai-card" style="margin-bottom:16px;">
          <div class="ai-label">🗓️ Google Calendar — ${events.length} event(s) synced</div>
          <div style="font-size:13px;color:var(--muted);">Your Google Calendar events have been added to your schedule. New events you create here can be pushed back to Google Calendar.</div>
        </div>`;
    }

    if (importedCount > 0) {
      renderCalendarGrid();
      if (typeof renderProgressTab === 'function') renderProgressTab();
      showNotification(`📥 ${importedCount} event(s) imported from Google Calendar.`);
    }
  } catch (e) {
    console.warn('Google Calendar sync failed:', e.message);
  }
}

// Pushes a SyncUp event to the user's primary Google Calendar.
async function pushEventToGcal(event) {
  if (!gcalConnected) return;
  try {
    const { event: created } = await apiPost('/api/calendar/events', {
      name: event.name,
      date: event.date,
      time: event.time,
      notes: event.notes,
    });
    event.gcalId = created.gcalId;
    showNotification(`📅 Event pushed to Google Calendar (${gcalEmail})`);
  } catch (e) {
    showNotification('Could not push event to Google Calendar.');
  }
}
