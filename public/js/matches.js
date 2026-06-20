function switchMatchTab(tab) {
  document.getElementById('subtab-matches').classList.toggle('active', tab === 'matches');
  document.getElementById('subtab-analytics').classList.toggle('active', tab === 'analytics');
  document.getElementById('sub-matches').classList.toggle('active', tab === 'matches');
  document.getElementById('sub-analytics').classList.toggle('active', tab === 'analytics');
}

function renderAdvisorMatches() {
  const c = document.getElementById('matchesList'); const ms = submissions.filter(s => s.status === 'accepted');
  if (ms.length === 0) return c.innerHTML = '<div class="empty-state" style="grid-column:1/-1;">No matches yet.</div>';
  c.innerHTML = ms.map(m => {
    const days = lastContactDays[m.partnerId] ?? 0;
    const h = days <= 7 ? 'health-green' : (days <= 21 ? 'health-yellow' : 'health-red');
    return `<div class="card"><div style="display:flex;justify-content:space-between;"><div style="font-weight:700;font-size:16px;">${m.resume.name}</div><div style="font-size:12px;"><span class="health-dot ${h}"></span>${days}d ago</div></div><div style="font-size:14px;margin-top:8px;">📧 ${m.resume.email}<br>📱 ${m.resume.phone}</div><span class="status-pill status-accepted" style="margin-top:12px;display:inline-block;">matched</span></div>`;
  }).join('');
}

function renderFollowupSuggestions() {
  const wrap = document.getElementById('followupSuggestions'); if (!wrap) return;
  const needsFollowup = submissions.filter(s => s.status === 'accepted').map(s => ({ s, p: partners.find(x => x.id === s.partnerId), days: lastContactDays[s.partnerId] ?? 0 })).filter(x => x.p && x.days > 7);
  if (needsFollowup.length === 0) { wrap.innerHTML = ''; return; }
  wrap.innerHTML = `<div class="ai-card followup-card"><div class="ai-label">🤖 Suggested Follow-Ups</div>${needsFollowup.map(x => `<div style="margin-bottom:12px;"><div style="font-weight:700;font-size:14px;">${x.s.resume.name} <span style="font-weight:400;color:var(--muted);">· ${x.days} days quiet</span></div><div class="followup-msg">"Hi! It's been ${x.days} days since we last connected — wanted to check in and see how things are progressing."</div><button class="ai-btn small" onclick="sendFollowup(${x.p.id})">Send Follow-up</button></div>`).join('')}</div>`;
}
function sendFollowup(id) { lastContactDays[id] = 0; showNotification('AI follow-up sent.'); renderAdvisorMatches(); renderFollowupSuggestions(); renderAnalytics(); }

function renderAnalytics() {
  const wrap = document.getElementById('analyticsContent'); if (!wrap) return;
  const overdue = Object.values(lastContactDays).filter(d => d > 14).length;
  wrap.innerHTML = `<div class="ai-card"><div class="ai-label">📊 Analytics Snapshot</div></div><div class="stat-grid"><div class="stat-card"><div class="stat-num">${submissions.filter(s => s.status === 'accepted').length}</div><div class="stat-label">Active Matches</div></div><div class="stat-card ${overdue > 0 ? 'warn' : ''}"><div class="stat-num">${overdue}</div><div class="stat-label">Overdue Follow-ups</div></div><div class="stat-card"><div class="stat-num">${referrals.length}</div><div class="stat-label">Referrals Made</div></div><div class="stat-card" style="grid-column:1/-1;"><div class="stat-num">${learningLogs.reduce((s, l) => s + l.hours, 0)}h</div><div class="stat-label">Learning Hours</div></div></div>`;
}
