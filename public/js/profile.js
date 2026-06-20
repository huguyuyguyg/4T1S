function renderUserProfile() {
  document.getElementById('p-name').value = resume.name;
  document.getElementById('p-email').value = resume.email;
  document.getElementById('p-phone').value = resume.phone;
  document.getElementById('p-exp').value = resume.exp;
  renderEvidenceList(); renderSubmissionHistory();
}
function renderEvidenceList() { document.getElementById('evidenceList').innerHTML = resume.evidence.map((f, i) => `<span class="file-pill">📎 ${f} <span style="cursor:pointer;margin-left:6px;" onclick="removeEvidenceFile(${i})">✕</span></span>`).join(''); }
function addEvidence(files) { Array.from(files).forEach(f => resume.evidence.push(f.name)); renderEvidenceList(); }
function removeEvidenceFile(i) { resume.evidence.splice(i, 1); renderEvidenceList(); }
function saveProfile() { resume.name = document.getElementById('p-name').value; resume.email = document.getElementById('p-email').value; resume.phone = document.getElementById('p-phone').value; resume.exp = document.getElementById('p-exp').value; showNotification('Resume saved.'); }

async function improveResume() {
  const text = document.getElementById('p-exp').value.trim();
  if (!text) return showNotification('Add some experience text first.');
  document.getElementById('aiResumeSuggestion').innerHTML = `<div class="ai-card" style="margin-top:12px;"><div class="ai-label">✨ AI Improving...</div><div class="ai-thinking"><div class="spinner"></div> Claude is rewriting your experience...</div></div>`;
  
  const result = await callClaude(
    `Rewrite this professional experience summary to be more impactful and results-oriented for a business advisory context. Keep it under 3 sentences. Return ONLY the improved text, nothing else.\n\nOriginal: "${text}"`,
    'You are a professional resume coach. Improve experience summaries to be punchy, specific, and results-driven. Return only the improved text.'
  );

  document.getElementById('aiResumeSuggestion').innerHTML = `
    <div class="ai-card" style="margin-top:12px;">
      <div class="ai-label">✨ AI Suggestion</div>
      <div style="font-size:13px; margin-bottom:8px;">${result}</div>
      <button class="ai-btn small" onclick="applyImprovedResume(this)">Use this version</button>
    </div>`;
  document.getElementById('aiResumeSuggestion').querySelector('.ai-btn').dataset.text = result;
}
function applyImprovedResume(btn) {
  const text = btn.closest('.ai-card').querySelector('div[style]').textContent;
  document.getElementById('p-exp').value = text; resume.exp = text;
  document.getElementById('aiResumeSuggestion').innerHTML = ''; showNotification('Resume updated with AI suggestion.');
}

function renderSubmissionHistory() {
  const c = document.getElementById('mySubmissions');
  if (submissions.length === 0) return c.innerHTML = '<div class="empty-state">No submissions yet.</div>';
  c.innerHTML = submissions.map(s => `<div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--line);font-size:14px;"><span>${partners.find(p => p.id === s.partnerId).name}</span><span class="status-pill status-${s.status}">${s.status}</span></div>`).join('');
}

function renderAdvisorDashboard() {
  const c = document.getElementById('dashboardList');
  const reqs = submissions.filter(s => s.status === 'pending');
  if (reqs.length === 0) return c.innerHTML = '<div class="empty-state" style="grid-column:1/-1;">No pending requests right now.</div>';
  c.innerHTML = reqs.map(req => `
    <div class="card">
      <div style="font-weight:700;font-size:16px;">${req.resume.name}</div>
      <div style="font-size:13px;color:var(--muted);">Applying to ${partners.find(p => p.id === req.partnerId).name}</div>
      <div style="font-size:14px;margin-top:12px;">📧 ${req.resume.email}<br>📱 ${req.resume.phone}</div>
      <div style="font-size:14px;margin-top:8px;">${req.resume.exp}</div>
      <div style="display:flex; gap:8px; margin-top:16px;">
        <button class="btn block" onclick="processApplicationDecision(${req.id}, true)">Accept</button>
        <button class="btn secondary block" onclick="processApplicationDecision(${req.id}, false)">Decline</button>
      </div>
    </div>`).join('');
}
function processApplicationDecision(id, acc) {
  const s = submissions.find(s => s.id === id); if (!s) return;
  if (acc) { s.status = 'accepted'; showNotification('Match accepted.'); } else { submissions = submissions.filter(s => s.id !== id); showNotification('Declined. Data wiped.'); }
  renderAdvisorDashboard();
}
