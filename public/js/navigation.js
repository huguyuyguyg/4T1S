function login(provider) {
  currentUser = { provider, name: 'Alex Tan' };
  document.getElementById('roleWelcome').textContent = `Signed in with ${provider}. Choose your account type.`;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-role').classList.add('active');
}

function chooseRole(role) {
  currentRole = role;
  document.getElementById('topbar').style.display = 'flex';
  document.getElementById('navbar-client').style.display = (role === 'client') ? 'flex' : 'none';
  document.getElementById('navbar-advisor').style.display = (role === 'advisor') ? 'flex' : 'none';
  document.getElementById('userChipLabel').textContent = (role === 'client') ? `${currentUser.name} · Client` : `Lex S. · Advisor`;
  if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") Notification.requestPermission();
  showScreen(role === 'client' ? 'partners' : 'dashboard');
  showNotification(`Continuing as ${role}.`);
}

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(`screen-${name}`).classList.add('active');
  document.querySelectorAll('.navbtn').forEach(b => b.classList.toggle('active', b.dataset.screen === name));
  if (name === 'partners') { renderPartnersList(); renderDailyBrief('dailyBriefClient', 'client'); }
  if (name === 'profile') renderUserProfile();
  if (name === 'dashboard') { renderAdvisorDashboard(); renderDailyBrief('dailyBriefAdvisor', 'advisor'); }
  if (name === 'matches') { renderAdvisorMatches(); renderFollowupSuggestions(); renderAnalytics(); }
  if (name === 'referrals') { renderReferrals(); renderReferralAiInsight(); }
  if (name === 'calendar') renderCalendarGrid();
  if (name === 'progress') renderProgressTab();
  if (name === 'expenses') renderExpenses();
  if (name === 'learning') renderLearning();
}

function switchRole() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-role').classList.add('active');
  document.getElementById('topbar').style.display = 'none';
  document.getElementById('navbar-client').style.display = 'none';
  document.getElementById('navbar-advisor').style.display = 'none';
}

function showNotification(message) {
  const n = document.createElement('div');
  n.className = 'notif'; n.textContent = message;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 4000);
}

function openSheet(id) { document.getElementById(id).classList.add('open'); }
function closeSheet(id) { document.getElementById(id).classList.remove('open'); }
