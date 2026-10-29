const express = require('express');
const path = require('path');
const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const jobs = [
  { id: 1, title: 'Software Developer', company: 'TCS', location: 'Pune, India', type: 'Full Time', skills: ['javascript', 'java', 'sql', 'git'] },
  { id: 2, title: 'Data Analyst', company: 'Deloitte', location: 'Bangalore, India', type: 'Full Time', skills: ['python', 'sql', 'excel', 'statistics'] },
  { id: 3, title: 'Business Analyst Intern', company: 'EY', location: 'Hyderabad, India', type: 'Internship', skills: ['excel', 'communication', 'sql'] },
  { id: 4, title: 'Web Developer', company: 'Infosys', location: 'Mysore, India', type: 'Full Time', skills: ['html', 'css', 'javascript', 'react'] },
  { id: 5, title: 'Digital Marketing Executive', company: 'Wipro', location: 'Mumbai, India', type: 'Part Time', skills: ['seo', 'communication', 'marketing'] },
];
const courses = [
  { id: 1, title: 'Programming with Python', category: 'Programming', skills: ['python'] },
  { id: 2, title: 'Web Development Bootcamp', category: 'Programming', skills: ['html', 'css', 'javascript', 'react'] },
  { id: 3, title: 'Data Science Fundamentals', category: 'Data Science', skills: ['python', 'statistics', 'sql'] },
  { id: 4, title: 'Digital Marketing Basics', category: 'Digital Marketing', skills: ['seo', 'marketing'] },
  { id: 5, title: 'Effective Communication', category: 'Communication', skills: ['communication'] },
  { id: 6, title: 'Leadership Essentials', category: 'Leadership', skills: ['leadership'] },
];
const quiz = [
  { q: 'Which language runs in the browser?', options: ['Python', 'JavaScript', 'C', 'Go'], answer: 1 },
  { q: 'SQL is used to...', options: ['Style pages', 'Query databases', 'Train models', 'Draw charts'], answer: 1 },
  { q: 'HTML stands for?', options: ['HyperText Markup Language', 'High Tech Mode Language', 'Home Tool Markup', 'None'], answer: 0 },
  { q: 'Which is a version control tool?', options: ['Git', 'Excel', 'Figma', 'Slack'], answer: 0 },
  { q: 'Good teamwork needs...', options: ['Silence', 'Communication', 'Isolation', 'Delay'], answer: 1 },
];
let applications = [];

const parseSkills = s => (s || '').toLowerCase().split(',').map(x => x.trim()).filter(Boolean);
const matchPct = (js, us) => us.length ? Math.round(100 * js.filter(s => us.includes(s)).length / js.length) : 0;

app.get('/api/jobs', (req, res) => {
  const us = parseSkills(req.query.skills);
  let list = jobs.map(j => ({ ...j, match: matchPct(j.skills, us) }));
  if (req.query.type && req.query.type !== 'All') list = list.filter(j => j.type === req.query.type);
  res.json(list.sort((a, b) => b.match - a.match));
});
app.get('/api/courses', (req, res) => {
  const us = parseSkills(req.query.skills);
  // recommend courses covering skills the user does NOT have yet
  res.json(courses.map(c => ({ ...c, recommended: c.skills.some(s => !us.includes(s)) && us.length > 0 })));
});
app.get('/api/assessment', (req, res) => res.json(quiz.map(({ answer, ...q }) => q)));
app.post('/api/assessment', (req, res) => {
  const score = (req.body.answers || []).filter((a, i) => quiz[i] && a === quiz[i].answer).length;
  res.json({ score, total: quiz.length });
});
app.get('/api/applications', (req, res) => res.json(applications));
app.post('/api/apply', (req, res) => {
  const job = jobs.find(j => j.id === req.body.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (!applications.find(a => a.jobId === job.id))
    applications.push({ jobId: job.id, title: job.title, company: job.company, status: 'Applied' });
  res.json(applications);
});
app.post('/api/application-status', (req, res) => {
  const a = applications.find(x => x.jobId === req.body.jobId);
  if (a) a.status = req.body.status;
  res.json(applications);
});

// Simple rule-based "AI" CV rating (swap with a real NLP model later)
const KEYWORDS = ['python', 'java', 'javascript', 'react', 'node', 'sql', 'html', 'css', 'git', 'excel', 'communication', 'leadership', 'teamwork', 'analysis', 'machine learning', 'django', 'flutter', 'seo', 'marketing', 'problem solving'];
app.post('/api/cv-rate', (req, res) => {
  const text = (req.body.text || '').toLowerCase();
  const words = text.split(/\s+/).filter(Boolean).length;
  const has = r => r.test(text);
  const suggestions = [];

  let content = Math.min(60, Math.round(words / 4));
  ['summary|objective', 'education', 'projects?', 'skills'].forEach(s => { if (has(new RegExp(s))) content += 10; });
  if (!has(/\d+\s*%|\d+\+|\$\s*\d+|increased|reduced|improved/)) suggestions.push('Add more quantifiable achievements');

  const found = KEYWORDS.filter(k => text.includes(k));
  const skills = Math.min(100, found.length * 10);
  if (found.length < 6) suggestions.push('Include more relevant keywords');

  let experience = 20;
  if (has(/intern|experience|worked|developed|built|led/)) experience += 40;
  if (has(/project/)) experience += 20;
  if (has(/20\d\d/)) experience += 20;

  let formatting = 30;
  if (has(/[\w.]+@[\w.]+\.\w+/)) formatting += 25;
  if (has(/\+?\d[\d\s-]{8,}/)) formatting += 20;
  if (has(/linkedin|github/)) formatting += 15;
  if (words > 150 && words < 800) formatting += 10;
  if (!has(/summary|objective/)) suggestions.push('Improve your summary section');

  const clamp = n => Math.max(0, Math.min(100, Math.round(n)));
  const b = { content: clamp(content), skills: clamp(skills), experience: clamp(experience), formatting: clamp(formatting) };
  const total = clamp((b.content + b.skills + b.experience + b.formatting) / 4);
  res.json({ total, breakdown: b, suggestions, label: total >= 80 ? 'Excellent' : total >= 60 ? 'Good' : 'Needs work' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running at http://localhost:${PORT}`));
