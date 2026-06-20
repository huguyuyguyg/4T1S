/* ============================================================
   APP BOOTSTRAP
   ============================================================ */
window.addEventListener('DOMContentLoaded', () => {
  // Restores Google Calendar connection state (and pulls fresh events)
  // if this browser session already authorised access on the backend.
  initGcalStatus();
});
