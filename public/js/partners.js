function renderDailyBrief(targetId, role) {
  const target = document.getElementById(targetId); if (!target) return;
  const todaysEvents = calendarEvents.filter(e => e.date === getTodayString());
  let items = [];
  if (role === 'client') {
    const accepted = submissions.filter(s => s.status === 'accepted').length;
    const pending = submissions.filter(s => s.status === 'pending').length;
    items.push(`📅 ${todaysEvents.length} item(s) on your calendar today`);
    if (pending) items.push(`📨 ${pending} request(s) awaiting reply`);
    if (accepted) items.push(`🎉 ${accepted} active match(es)`);
    items.push(`🤖 ${partners[5].name} is your top AI match this week (${partners[5].match}%)`);
  } else {
    const pending = submissions.filter(s => s.status === 'pending').length;
    const overdue = Object.entries(lastContactDays).filter(([,d]) => d > 14);
    items.push(`📅 ${todaysEvents.length} meeting(s) today`);
    if (pending) items.push(`📥 ${pending} new request(s) waiting for review`);
    if (referrals.length) items.push(`🔗 ${referrals.length} referral(s) tracked in your ecosystem`);
    overdue.forEach(([id, d]) => {
      const p = partners.find(x => x.id == id);
      if (p) items.push(`⚠️ No contact with ${p.name} for ${d} days <button class="mini-link" onclick="sendFollowup(${p.id})">Send follow-up</button>`);
    });
  }
  target.innerHTML = `<div class="ai-card"><div class="ai-label">🤖 AI Daily Brief</div>${items.map(i => `<div class="brief-item">${i}</div>`).join('')}</div>`;
}

function renderFilters() {
  const fc = document.getElementById('filterRow'); fc.innerHTML = '';
  fieldFilters.forEach(f => {
    const chip = document.createElement('div'); chip.className = `filter-chip ${f === activeFilter ? 'active' : ''}`;
    chip.textContent = f; chip.onclick = () => { activeFilter = f; renderPartnersList(); }; fc.appendChild(chip);
  });
}

function renderPartnersList() {
  renderFilters();
  const q = (document.getElementById('partnerSearch').value || '').toLowerCase();
  const customQuery = (document.getElementById('customNicheFilter').value || '').toLowerCase();
  const lc = document.getElementById('partnerList'); lc.innerHTML = '';
  const filtered = partners.filter(p => {
    const mf = activeFilter === 'All' || p.field === activeFilter;
    const mq = !q || (p.name + p.role + p.field + p.location + p.tags.join(' ')).toLowerCase().includes(q);
    const mc = !customQuery || p.tags.some(t => t.toLowerCase().includes(customQuery)) || p.role.toLowerCase().includes(customQuery);
    return mf && mq && mc;
  }).sort((a, b) => b.match - a.match);
  if (filtered.length === 0) return lc.innerHTML = '<div class="empty-state">No partners match your criteria.</div>';
  filtered.forEach((p, idx) => {
    const sub = submissions.find(s => s.partnerId === p.id);
    const card = document.createElement('div'); card.className = 'card partner-card';
    card.innerHTML = `
      <div style="display:flex; gap:12px; width:100%;">
        <div class="avatar">${p.name.split(' ').map(w => w[0]).join('')}</div>
        <div style="flex:1;">
          <div style="display:flex;justify-content:space-between;">
            <div class="partner-name">${p.name}</div>
            ${sub ? `<span class="status-pill status-${sub.status}">${sub.status}</span>` : ''}
          </div>
          <div class="partner-meta">${p.role} · ${p.location}</div>
        </div>
      </div>
      <div style="margin-top:12px;">
        <span class="match-badge ${idx === 0 ? 'top' : ''}">🤖 ${p.match}% Match</span>
        <span class="mini-link" style="margin-left:8px;" onclick="document.getElementById('reasons-${p.id}').style.display='block'">Why?</span>
        <div class="match-reasons" id="reasons-${p.id}" style="display:none;">${p.reasons.map(r => '• ' + r).join('<br>')}</div>
      </div>
      <div class="tag-row">${p.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>
      <div class="partner-actions">
        ${sub && sub.status === 'accepted' ? `<button class="btn secondary block" onclick="viewContactDetails(${p.id})">View Contact</button>` : sub ? `<button class="btn secondary block" disabled>Request sent</button>` : `<button class="btn block" onclick="openSendApplicationSheet(${p.id})">Send My Details</button>`}
      </div>`;
    lc.appendChild(card);
  });
}
document.getElementById('partnerSearch').addEventListener('input', renderPartnersList);
document.getElementById('customNicheFilter').addEventListener('input', renderPartnersList);

function openSendApplicationSheet(id) {
  const p = partners.find(p => p.id === id); pendingPartnerSubmission = p;
  document.getElementById('sendPartnerName').textContent = `Send to ${p.name}`;
  document.getElementById('sendPartnerMeta').textContent = `${p.role} · ${p.field}`;
  document.getElementById('reviewName').textContent = resume.name;
  document.getElementById('reviewEmail').textContent = resume.email;
  document.getElementById('reviewPhone').textContent = resume.phone;
  document.getElementById('reviewExp').textContent = resume.exp;
  document.getElementById('confirmSendBtn').onclick = confirmSubmission; openSheet('sendOverlay');
}
function confirmSubmission() {
  if (!pendingPartnerSubmission) return;
  submissions.push({ id: submissionCounter++, partnerId: pendingPartnerSubmission.id, resume: { ...resume, evidence: [...resume.evidence] }, status: 'pending' });
  closeSheet('sendOverlay'); showNotification(`Sent to ${pendingPartnerSubmission.name}.`); renderPartnersList();
}
function viewContactDetails(id) {
  const p = partners.find(p => p.id === id);
  document.getElementById('contactCardBody').innerHTML = `<div style="font-weight:700;font-size:16px;">${p.name}</div><div style="font-size:13px;color:var(--muted);margin-top:2px;">${p.role} · ${p.field}</div><div style="margin-top:16px;font-size:14px;">📧 ${p.name.split(' ')[0].toLowerCase()}@syncup.com</div><div style="font-size:14px;margin-top:8px;">📱 +60 1${p.id}2-345 678${p.id}</div>`;
  openSheet('contactOverlay');
}
