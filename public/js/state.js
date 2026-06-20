let currentUser = null;
let currentRole = null;
let gcalConnected = false;
let gcalEmail = '';

const partners = [
  { id: 1, name: 'Maria Lopez', role: 'Growth Advisor', field: 'Marketing', location: 'Kuala Lumpur', responseTime: '< 2 hrs', tags: ['Marketing', 'Strategy'], match: 97, reasons: ['Same city — 5km away','Replies in under 2 hours','Worked with 12 advisors before'] },
  { id: 2, name: 'James Chen', role: 'Tech Partner', field: 'Engineering', location: 'Singapore', responseTime: '< 1 day', tags: ['Engineering', 'Product'], match: 81, reasons: ['Strong product overlap','Active in similar industries'] },
  { id: 3, name: 'Priya Nair', role: 'Finance Advisor', field: 'Finance', location: 'Petaling Jaya', responseTime: '< 4 hrs', tags: ['Finance', 'Legal'], match: 88, reasons: ['Same region','Fast response time'] },
  { id: 4, name: 'David Wong', role: 'Ops Consultant', field: 'Operations', location: 'Kuala Lumpur', responseTime: '< 1 day', tags: ['Operations', 'Supply Chain'], match: 74, reasons: ['Nearby location','Decent field match'] },
  { id: 5, name: 'Aisha Rahman', role: 'HR Partner', field: 'People', location: 'Shah Alam', responseTime: '< 3 hrs', tags: ['HR', 'Culture'], match: 90, reasons: ['Strong culture-fit signals','Active referral history'] },
  { id: 6, name: 'Lex S.', role: 'AI Architect', field: 'Engineering', location: 'Subang Jaya', responseTime: '< 1 hr', tags: ['AI Agents', 'n8n', 'Automation'], match: 99, reasons: ['Direct niche match (n8n/AI)','Instant responder'] }
];

const lastContactDays = { 1: 2, 2: 9, 3: 41, 4: 18, 5: 5, 6: 1 };
const fieldFilters = ['All', 'Marketing', 'Engineering', 'Finance', 'Operations', 'People'];
let activeFilter = 'All';

let submissions = [];
let submissionCounter = 1;
let resume = { name: 'Alex Tan', email: 'alex.tan@email.com', phone: '+60 12-345 6789', exp: '3 years in partnership coordination and stakeholder outreach.', evidence: [] };
let pendingPartnerSubmission = null;
let expenses = [];
let expenseIdCounter = 1;

let referrals = [];
let referralIdCounter = 1;

let calendarEvents = [];
let nextEventId = 1;
let currentCalendarView = new Date();
let currentlySelectedDate = null;
let pendingNotesEventId = null;

// CPD Badges Definition
const cpdBadgeDefinitions = [
  { id: 'starter', icon: '🌱', name: 'Learner', desc: 'Log your first entry', req: l => l.length >= 1 },
  { id: 'five_hours', icon: '⏱️', name: '5h Club', desc: 'Accumulate 5 learning hours', req: l => l.reduce((s,x) => s+x.hours, 0) >= 5 },
  { id: 'ten_hours', icon: '🏆', name: '10h Pro', desc: 'Accumulate 10 learning hours', req: l => l.reduce((s,x) => s+x.hours, 0) >= 10 },
  { id: 'multi_skill', icon: '🧩', name: 'Multi-Skill', desc: 'Cover 3 different skill areas', req: l => new Set(l.flatMap(x => x.tags)).size >= 3 },
  { id: 'consistent', icon: '🔥', name: 'Consistent', desc: 'Log 5 separate sessions', req: l => l.length >= 5 },
  { id: 'full_spectrum', icon: '🌈', name: 'Full Spectrum', desc: 'Try all 4 learning types', req: l => new Set(l.map(x => x.type)).size >= 4 },
];

// Learning Data
const learningSkillTargets = ['AI Agents', 'System Design', 'Client Communication', 'Digital Tools', 'Automation Pipelines'];
const learningPathBank = {
  'AI Agents': ['Intro to Agents (module)', 'Agent Orchestration (webinar)'],
  'System Design': ['Architecture Fundamentals (module)', 'Scaling Backends (article)'],
  'Client Communication': ['Active Listening (webinar)', 'Email Templates (article)'],
  'Digital Tools': ['CRM Essentials (module)', 'Workflow Automation (webinar)'],
  'Automation Pipelines': ['n8n Basics (module)', 'Advanced Webhooks (webinar)']
};
let learningLogs = [
  { id: 1, title: 'Intro to n8n Workflows', type: 'Course', tags: ['Automation Pipelines'], hours: 2, date: fmtDateOnly(-2) },
  { id: 2, title: 'Client Pitching 101', type: 'Webinar', tags: ['Client Communication'], hours: 1, date: fmtDateOnly(-5) },
];
let nextLearningId = 3;

// Utils
function fmtDateOnly(offsetDays) { const d = new Date(); d.setDate(d.getDate() + offsetDays); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function formatDate(dateObj) { return `${dateObj.getFullYear()}-${String(dateObj.getMonth()+1).padStart(2,'0')}-${String(dateObj.getDate()).padStart(2,'0')}`; }
function getTodayString() { return formatDate(new Date()); }

// Seed
(function seedData() {
  const t = new Date();
  calendarEvents.push({ id: nextEventId++, name: 'Review partner pipeline', date: formatDate(t), time: '09:00', notes: 'Check dashboard', alarm: true, done: false });
  const tmrw = new Date(t); tmrw.setDate(tmrw.getDate()+1);
  calendarEvents.push({ id: nextEventId++, name: 'Call with Lex S.', date: formatDate(tmrw), time: '14:00', notes: 'Discuss n8n automation build.', alarm: false, done: false });
})();
