function openNewReferralSheet() {
  document.getElementById('ref-date').value = getTodayString();
  openSheet('referralOverlay');
}

function saveReferral() {
  const a = document.getElementById('ref-a').value;
  const b = document.getElementById('ref-b').value;
  if (!a || !b) return showNotification('Fill in both parties.');
  referrals.push({
    id: referralIdCounter++,
    partyA: a, partyB: b,
    type: document.getElementById('ref-type').value,
    notes: document.getElementById('ref-notes').value,
    date: document.getElementById('ref-date').value || getTodayString(),
    status: 'Active'
  });
  document.getElementById('ref-a').value = '';
  document.getElementById('ref-b').value = '';
  document.getElementById('ref-notes').value = '';
  closeSheet('referralOverlay');
  renderReferrals();
  renderReferralAiInsight();
  showNotification('Referral logged.');
}

function renderReferrals() {
  const c = document.getElementById('referralList');
  if (referrals.length === 0) return c.innerHTML = '<div class="empty-state">No referrals logged yet. Start tracking your ecosystem connections!</div>';
  c.innerHTML = referrals.map(r => `
    <div class="referral-item">
      <div>
        <div style="font-weight:700;font-size:14px;">${r.partyA} → ${r.partyB}</div>
        <div style="font-size:12px;color:var(--muted);margin-top:3px;">${r.type} · ${r.date}${r.notes ? ` · "${r.notes.slice(0,60)}..."` : ''}</div>
      </div>
      <span class="referral-status ${r.status === 'Active' ? 'ref-active' : r.status === 'Pending' ? 'ref-pending' : 'ref-intro'}">${r.status}</span>
    </div>`).join('');

  // Ecosystem summary
  const nodes = new Set();
  referrals.forEach(r => { nodes.add(r.partyA); nodes.add(r.partyB); });
  document.getElementById('ecosystemSummary').innerHTML = `
    <div style="color:var(--ink);margin-bottom:12px;">Your ecosystem currently spans <strong style="color:var(--accent);">${nodes.size} people</strong> across <strong style="color:var(--accent);">${referrals.length} connections</strong>.</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;">${Array.from(nodes).map(n => `<span class="tag">👤 ${n}</span>`).join('')}</div>`;
}

async function renderReferralAiInsight() {
  if (referrals.length === 0) {
    document.getElementById('referralAiInsight').innerHTML = '';
    return;
  }
  document.getElementById('referralAiInsight').innerHTML = `<div class="ai-card"><div class="ai-label">🤖 AI Ecosystem Insight</div><div class="ai-thinking"><div class="spinner"></div> Analysing your referral network...</div></div>`;

  const summary = referrals.map(r => `${r.partyA} → ${r.partyB} (${r.type})`).join('; ');
  const insight = await callClaude(
    `I have these referral/introduction records: ${summary}. In 2-3 sentences, give me a strategic insight about my referral network — who I should follow up with, any patterns you notice, or what type of connection to make next. Be specific and actionable.`,
    'You are a strategic advisor helping someone grow their professional ecosystem. Give crisp, actionable advice.'
  );
  document.getElementById('referralAiInsight').innerHTML = `<div class="ai-card"><div class="ai-label">🤖 AI Ecosystem Insight</div><div style="font-size:13px;line-height:1.6;">${insight}</div></div>`;
}
