function renderExpenses() {
  const lc = document.getElementById('expenseList');
  const total = expenses.reduce((s,e) => s+e.amount, 0);
  document.getElementById('expenseTotal').textContent = `$${total.toFixed(2)}`;
  if (expenses.length === 0) return lc.innerHTML = '<div class="empty-state">No expenses tracked yet.</div>';
  const catClass = { 'Software & Tools':'cat-software', 'Meetings':'cat-meetings', 'Operations':'cat-operations', 'Other':'cat-other' };
  lc.innerHTML = expenses.map(e => `<div style="display:flex; justify-content:space-between; padding:12px 0; border-bottom:1px solid var(--line); align-items:center;"><div><div style="font-weight:600;font-size:15px;">${e.desc}</div><div style="font-size:12px;color:var(--muted);margin-top:4px;">${e.date} <span class="exp-cat-badge ${catClass[e.cat]||'cat-other'}">${e.cat}</span></div>${e.aiNote?`<div class="exp-ai-insight">💡 ${e.aiNote}</div>`:''}</div><div style="text-align:right;"><div style="font-family:'Space Grotesk',monospace;font-weight:700;color:var(--pending);font-size:16px;">$${e.amount.toFixed(2)}</div><button style="background:none;border:none;color:var(--decline);font-size:12px;cursor:pointer;margin-top:6px;padding:0;" onclick="delExpense(${e.id})">Remove</button></div></div>`).join('');
}

function addExpense() {
  const d=document.getElementById('exp-desc').value;
  const a=parseFloat(document.getElementById('exp-amount').value);
  if (!d||isNaN(a)) return;
  expenses.push({id:expenseIdCounter++,desc:d,amount:a,cat:document.getElementById('exp-cat').value,date:getTodayString()});
  document.getElementById('exp-desc').value=''; document.getElementById('exp-amount').value='';
  renderExpenses(); showNotification('Expense logged.');
}
function delExpense(id) { expenses=expenses.filter(e=>e.id!==id); renderExpenses(); }

async function runAiExpenseAnalysis() {
  if (expenses.length === 0) return showNotification('Add some expenses first.');
  const panel = document.getElementById('expenseAiPanel');
  panel.innerHTML = `<div class="ai-card"><div class="ai-label">🤖 AI Expense Analysis</div><div class="ai-thinking"><div class="spinner"></div> Claude is analysing your spending patterns...</div></div>`;

  const expSummary = expenses.map(e => `${e.desc} ($${e.amount.toFixed(2)}, ${e.cat})`).join('; ');
  const total = expenses.reduce((s,e) => s+e.amount, 0);

  const result = await callClaude(
    `Analyse these business expenses for an advisor: ${expSummary}. Total: $${total.toFixed(2)}.
    
    Provide: 1) A 1-sentence spending pattern observation, 2) The top category by spend, 3) One specific cost-saving recommendation, 4) A budget health rating (Healthy / Watch Out / Over Budget) with brief reasoning.
    
    Format as JSON: {"pattern": "...", "topCategory": "...", "recommendation": "...", "healthRating": "...", "healthReason": "..."}`,
    'You are a financial advisor for small businesses. Be concise, specific, and actionable. Return only valid JSON.'
  );

  let parsed;
  try {
    const clean = result.replace(/```json|```/g,'').trim();
    parsed = JSON.parse(clean);
  } catch(e) {
    parsed = { pattern: result.slice(0,200), topCategory:'Unknown', recommendation:'Review your expense categories.', healthRating:'Unknown', healthReason:'' };
  }

  const healthColor = parsed.healthRating === 'Healthy' ? 'var(--done)' : parsed.healthRating === 'Watch Out' ? 'var(--pending)' : 'var(--decline)';
  panel.innerHTML = `
    <div class="ai-card" style="margin-bottom:16px;">
      <div class="ai-label">🤖 AI Expense Intelligence</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
        <div class="stat-card" style="text-align:left;padding:12px;">
          <div style="font-size:11px;color:var(--muted);text-transform:uppercase;margin-bottom:4px;">Spending Pattern</div>
          <div style="font-size:13px;">${parsed.pattern}</div>
        </div>
        <div class="stat-card" style="text-align:left;padding:12px;">
          <div style="font-size:11px;color:var(--muted);text-transform:uppercase;margin-bottom:4px;">Budget Health</div>
          <div style="font-size:18px;font-weight:700;color:${healthColor};">${parsed.healthRating}</div>
          <div style="font-size:11px;color:var(--muted);">${parsed.healthReason}</div>
        </div>
      </div>
      <div style="padding:12px;background:rgba(69,232,212,0.06);border-radius:8px;border-left:3px solid var(--accent);">
        <div style="font-size:11px;color:var(--accent);font-weight:700;text-transform:uppercase;margin-bottom:4px;">💡 Recommendation</div>
        <div style="font-size:13px;">${parsed.recommendation}</div>
      </div>
      <div style="margin-top:10px;font-size:12px;color:var(--muted);">Top category: <strong style="color:var(--ink);">${parsed.topCategory}</strong> · Total tracked: <strong style="color:var(--pending);">$${total.toFixed(2)}</strong></div>
    </div>`;
}
