function renderCpdBadges() {
  const totalHours = learningLogs.reduce((s, l) => s + l.hours, 0);
  const cpdTarget = 20; // hours per CPD cycle
  const earned = cpdBadgeDefinitions.filter(b => b.req(learningLogs));

  return `
    <div class="card">
      <div style="font-weight:700;font-size:16px;margin-bottom:4px;">🏅 CPD Recognition</div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:12px;">Earn badges as you learn. ${earned.length}/${cpdBadgeDefinitions.length} unlocked.</div>
      <div class="cpd-bar-wrap">
        <div class="cpd-bar-label"><span>CPD Progress</span><span>${totalHours}h / ${cpdTarget}h target</span></div>
        <div class="cpd-bar"><div class="cpd-bar-fill" style="width:${Math.min(100, (totalHours/cpdTarget)*100)}%;"></div></div>
      </div>
      <div class="badge-row">
        ${cpdBadgeDefinitions.map(b => {
          const isEarned = b.req(learningLogs);
          return `<div class="badge ${isEarned ? 'earned' : 'locked'}" title="${b.desc}">
            <div class="badge-icon">${b.icon}</div>
            <div class="badge-name">${b.name}</div>
            <div class="badge-desc">${b.desc}</div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

function renderLearning() {
  const wrap = document.getElementById('learningCoach');
  const covered = new Set(learningLogs.flatMap(l => l.tags));
  const gaps = learningSkillTargets.filter(s => !covered.has(s)).slice(0, 2);

  wrap.innerHTML = gaps.length === 0
    ? `<div class="ai-card"><div class="ai-label">🤖 AI Learning Coach</div><div style="font-size:14px;">You're covering every core skill area! Consider deepening expertise.</div></div>`
    : `<div class="ai-card"><div class="ai-label">🤖 AI Learning Coach</div><div style="font-size:13px;color:var(--muted);">Recommended paths based on skill gaps:</div>${gaps.map(g => `<div class="skill-gap"><div class="sg-title">${g}</div><div class="sg-path">${(learningPathBank[g]||[]).map((step,i) => `${i+1}. ${step}`).join('<br>')}</div></div>`).join('')}</div>`;

  document.getElementById('cpdBadges').innerHTML = renderCpdBadges();

  document.getElementById('learningStats').innerHTML = `<div class="stat-card"><div class="stat-num">${learningLogs.reduce((s,l) => s+l.hours, 0)}h</div><div class="stat-label">Total Hours</div></div><div class="stat-card"><div class="stat-num">${learningLogs.length}</div><div class="stat-label">Logs Completed</div></div>`;

  document.getElementById('learningList').innerHTML = learningLogs.map(l => `<div class="card learning-card"><div style="flex:1;"><div style="font-weight:700;font-size:15px;">${l.title}</div><div style="font-size:12px;color:var(--muted);margin-top:4px;">${l.date} · ${l.hours}h</div><div class="tag-row">${l.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div></div><span class="learning-type">${l.type}</span></div>`).join('');

  document.getElementById('skillTagOptions').innerHTML = learningSkillTargets.map(s => `<option value="${s}">`).join('');
}

function openLearningLogSheet() { document.getElementById('lg-title').value = ''; document.getElementById('lg-date').value = getTodayString(); openSheet('learningLogOverlay'); }
function saveLearningLog() {
  const title = document.getElementById('lg-title').value; if (!title) return showNotification('Add a title.');
  const prevBadges = cpdBadgeDefinitions.filter(b => b.req(learningLogs)).length;
  learningLogs.push({ id: nextLearningId++, title, type: document.getElementById('lg-type').value, hours: Number(document.getElementById('lg-hours').value)||0, tags: document.getElementById('lg-tags').value.split(',').map(t=>t.trim()).filter(Boolean), date: document.getElementById('lg-date').value||getTodayString() });
  const newBadges = cpdBadgeDefinitions.filter(b => b.req(learningLogs)).length;
  closeSheet('learningLogOverlay');
  renderLearning();
  if (newBadges > prevBadges) showNotification(`🏅 New CPD badge unlocked! You earned ${newBadges - prevBadges} new badge(s).`);
  else showNotification('Learning logged.');
}

