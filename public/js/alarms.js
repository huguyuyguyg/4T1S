function triggerFunctionalAlarm(eventName) {
  showNotification(`⏰ ALARM: Time for "${eventName}"`);
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'square'; osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start(); setTimeout(() => osc.stop(), 800);
    }
  } catch(e) {}
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("SyncUp Alarm", { body: `It's time for: ${eventName}` });
  }
  setTimeout(() => { alert(`⏰ ALARM: It's time for "${eventName}"!`); }, 50);
}

setInterval(() => {
  const t = new Date().toTimeString().slice(0,5);
  const d = getTodayString();
  calendarEvents.forEach(e => {
    if (e.alarm && !e.done && e.date === d && e.time === t && !e._fired) {
      e._fired = true;
      triggerFunctionalAlarm(e.name);
    }
  });
}, 30000);
