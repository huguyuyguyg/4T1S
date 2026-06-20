function renderCalendarGrid() {
  const hr = document.getElementById('calDowRow');
  if (!hr.children.length) ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => { const e = document.createElement('div'); e.className='cal-dow'; e.textContent=d; hr.appendChild(e); });
  document.getElementById('calMonthLabel').textContent = currentCalendarView.toLocaleString('default', { month:'long', year:'numeric' });
  const gc = document.getElementById('calGrid'); gc.innerHTML = '';
  const y = currentCalendarView.getFullYear(), m = currentCalendarView.getMonth();
  const fdm = new Date(y,m,1).getDay(), dim = new Date(y,m+1,0).getDate();
  for (let i=0;i<fdm;i++) gc.appendChild(Object.assign(document.createElement('div'), {className:'cal-day empty'}));
  for (let day=1;day<=dim;day++) {
    const fds = `${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const c = document.createElement('div'); c.className = `cal-day ${fds===getTodayString()?'today':''}`;
    const evs = calendarEvents.filter(e=>e.date===fds);
    c.innerHTML = `<div class="num">${day}</div><div class="cal-dot-row">${evs.slice(0,4).map(e=>`<span class="cal-dot ${e.done?'done':''} ${e.fromGcal?'gcal-dot':''}"></span>`).join('')}</div>`;
    c.onclick = () => openDayDetails(fds); gc.appendChild(c);
  }
}
function calMove(d) { currentCalendarView.setMonth(currentCalendarView.getMonth()+d); renderCalendarGrid(); }

function openDayDetails(ds) {
  currentlySelectedDate = ds;
  document.getElementById('dayTitle').textContent = new Date(`${ds}T00:00:00`).toLocaleDateString('default',{weekday:'long',month:'long',day:'numeric'});
  renderDayEventList();
  document.getElementById('addFromDayBtn').onclick = () => { closeSheet('dayOverlay'); openNewEvent(ds); };
  openSheet('dayOverlay');
}

function renderDayEventList() {
  const lc = document.getElementById('dayList');
  const evs = calendarEvents.filter(e=>e.date===currentlySelectedDate).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
  if (evs.length === 0) return lc.innerHTML = '<div class="empty-state">Nothing scheduled.</div>';
  lc.innerHTML = evs.map(ev => {
    const p = partners.find(p=>ev.name.includes(p.name));
    const prep = p ? `<div class="ai-card" style="margin:12px 0 0 0; padding:12px;"><div class="ai-label">🤖 AI Meeting Prep</div><div class="match-reasons">${p.reasons.map(r=>'• '+r).join('<br>')}</div></div>` : '';
    const notes = ev.meetingNotes ? `<div class="ai-card" style="margin:12px 0 0 0; padding:12px;"><div class="ai-label">📝 AI Summary</div><div style="font-size:13px;margin-bottom:8px;">${ev.meetingNotes.summary}</div>${ev.meetingNotes.actionItems.map(a=>`<div class="action-item"><span>• ${a}</span><button class="mini-link" onclick="addActionAsEvent('${a.replace(/'/g,"\\'")}')">+ Add Task</button></div>`).join('')}</div>` : '';
    const gcalBadge = ev.fromGcal ? `<span style="font-size:10px;background:#4285F4;color:#fff;border-radius:4px;padding:2px 6px;font-weight:700;margin-left:6px;">GCal</span>` : '';
    return `<div class="event-card ${ev.done?'done':''}">
      <div class="check ${ev.done?'checked':''}" onclick="toggleEventCompletion(${ev.id})"></div>
      <div style="flex:1;">
        <div class="ev-title ${ev.done?'done':''}">${ev.name}${gcalBadge}</div>
        <div class="ev-meta">${ev.time||'All Day'} ${ev.notes?`· ${ev.notes}`:''} ${ev.alarm?'· ⏰':''}</div>
        ${prep}${notes}
        <button class="btn secondary block" style="margin-top:12px; font-size:12px; padding:6px;" onclick="openMeetingNotes(${ev.id})">🎤 ${ev.meetingNotes?'Edit Notes':'Add AI Meeting Notes'}</button>
      </div>
      <button class="ev-del" onclick="deleteCalendarEvent(${ev.id})">✕</button>
    </div>`;
  }).join('');
}

function toggleEventCompletion(id) { const e=calendarEvents.find(x=>x.id===id); e.done=!e.done; renderDayEventList(); renderCalendarGrid(); renderProgressTab(); }
function deleteCalendarEvent(id) { calendarEvents=calendarEvents.filter(x=>x.id!==id); renderDayEventList(); renderCalendarGrid(); renderProgressTab(); }

function openNewEvent(pd) { document.getElementById('ev-name').value=''; document.getElementById('ev-date').value=pd||currentlySelectedDate||getTodayString(); document.getElementById('ev-alarm').checked=false; document.getElementById('ev-gcal-push').checked=gcalConnected; openSheet('newEventOverlay'); }
function saveNewEvent() {
  const name=document.getElementById('ev-name').value; const date=document.getElementById('ev-date').value;
  if (!name||!date) return showNotification('Add name and date.');
  const wantsAlarm=document.getElementById('ev-alarm').checked;
  const pushToGcal=document.getElementById('ev-gcal-push').checked;
  if (wantsAlarm && "Notification" in window && Notification.permission!=="granted") Notification.requestPermission();
  const newEvent = { id:nextEventId++, name, date, time:document.getElementById('ev-time').value, notes:document.getElementById('ev-notes').value, alarm:wantsAlarm, done:false };
  calendarEvents.push(newEvent);
  if (pushToGcal && gcalConnected) pushEventToGcal(newEvent);
  closeSheet('newEventOverlay'); renderCalendarGrid(); renderProgressTab();
  if (currentlySelectedDate===date) renderDayEventList();
  showNotification(wantsAlarm?'Event saved with functional alarm.':`Event saved.${pushToGcal&&gcalConnected?' Pushed to Google Calendar.':''}`);
}
function openQuickEvent() { document.getElementById('q-name').value=''; document.getElementById('q-date').value=currentlySelectedDate||getTodayString(); openSheet('quickEventOverlay'); }
function saveQuickEvent() { const n=document.getElementById('q-name').value; if(!n) return; calendarEvents.push({id:nextEventId++,name:n,date:document.getElementById('q-date').value||getTodayString(),time:document.getElementById('q-time').value,alarm:false,done:false}); closeSheet('quickEventOverlay'); renderCalendarGrid(); renderProgressTab(); if(currentlySelectedDate===document.getElementById('q-date').value) renderDayEventList(); }

/* Meeting Notes with REAL AI */
function openMeetingNotes(id) {
  const ev=calendarEvents.find(e=>e.id===id); pendingNotesEventId=id;
  document.getElementById('notesEventName').textContent=ev.name;
  document.getElementById('notes-raw').value=ev.meetingNotes?ev.meetingNotes.raw:'';
  document.getElementById('meetingSummaryPreview').innerHTML=ev.meetingNotes?renderSummaryPreviewHtml(ev.meetingNotes):'';
  openSheet('meetingNotesOverlay');
}
async function generateMeetingSummary() {
  const t=document.getElementById('notes-raw').value; if(!t) return;
  document.getElementById('meetingSummaryPreview').innerHTML=`<div class="ai-card" style="margin-top:16px;"><div class="ai-label">✨ AI Processing...</div><div class="ai-thinking"><div class="spinner"></div> Claude is summarising your notes...</div></div>`;
  
  const result = await callClaude(
    `Analyse these meeting notes and return a JSON object with exactly this structure (no markdown, raw JSON only):
{"summary": "2-sentence summary", "actionItems": ["action 1", "action 2", "action 3"]}

Meeting notes: "${t}"`,
    'You are a meeting notes assistant. Extract key points and concrete action items. Return only valid JSON.'
  );
  
  let parsed;
  try {
    const clean = result.replace(/```json|```/g,'').trim();
    parsed = JSON.parse(clean);
  } catch(e) {
    parsed = { raw: t, summary: result.slice(0, 200), actionItems: [] };
  }
  parsed.raw = t;
  window._tempNotes = parsed;
  document.getElementById('meetingSummaryPreview').innerHTML = renderSummaryPreviewHtml(parsed);
}
function renderSummaryPreviewHtml(n) { return `<div class="ai-card" style="margin-top:16px;"><div class="ai-label">✨ AI Summary Preview</div><div style="font-size:13px;margin-bottom:8px;">${n.summary}</div>${(n.actionItems||[]).map(a=>`<div class="action-item"><span>• ${a}</span></div>`).join('')}</div>`; }
function saveMeetingNotes() {
  const ev=calendarEvents.find(e=>e.id===pendingNotesEventId); if(!ev) return;
  const t=document.getElementById('notes-raw').value; if(!t) return;
  ev.meetingNotes = (window._tempNotes&&window._tempNotes.raw===t) ? window._tempNotes : { raw:t, summary:t.slice(0,150)+'...', actionItems:[] };
  closeSheet('meetingNotesOverlay'); renderDayEventList(); showNotification('Notes saved.');
}
function addActionAsEvent(text) { calendarEvents.push({id:nextEventId++,name:text.replace(/^(I |We )?will /i,''),date:currentlySelectedDate||getTodayString(),time:'',alarm:false,done:false}); renderDayEventList(); renderCalendarGrid(); showNotification('Task added to schedule.'); }

/* ============================================================
   PROGRESS
   ============================================================ */
function renderProgressTab() {
  const c = document.getElementById('progressContainer'); if (!c) return;
  const t=calendarEvents.length; const d=calendarEvents.filter(e=>e.done).length; const pct=t?Math.round((d/t)*100):0;
  const gcalCount = calendarEvents.filter(e=>e.fromGcal).length;
  c.innerHTML = `<div class="card" style="padding:30px;"><div class="stat-grid" style="grid-template-columns:1fr 1fr 1fr; margin-bottom:24px;"><div class="stat-card" style="border:none;box-shadow:none;"><div class="stat-num">${t}</div><div class="stat-label">Total Tasks</div></div><div class="stat-card" style="border:none;box-shadow:none;"><div class="stat-num">${d}</div><div class="stat-label">Completed</div></div><div class="stat-card" style="border:none;box-shadow:none;"><div class="stat-num" style="color:var(--accent);">${pct}%</div><div class="stat-label">Success Rate</div></div></div><div style="width:100%; height:16px; border-radius:8px; background:rgba(255,255,255,0.05); overflow:hidden;"><div style="height:100%; border-radius:8px; background:linear-gradient(90deg, var(--accent), var(--done)); transition:width .5s ease; width:${pct}%;"></div></div>${gcalConnected?`<div style="margin-top:16px;font-size:13px;color:var(--muted);">📅 ${gcalCount} event(s) synced from Google Calendar</div>`:''}</div>`;
}

