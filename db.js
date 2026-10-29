// SQLite database: creates tables and seeds jobs/courses on first run
const Database = require('better-sqlite3');
const db = new Database(__dirname + '/jobplatform.db');
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT DEFAULT '', education TEXT DEFAULT '', skills TEXT DEFAULT '', interests TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY, title TEXT, company TEXT, location TEXT, type TEXT, skills TEXT
);
CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY, title TEXT, category TEXT, skills TEXT
);
CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id INTEGER NOT NULL REFERENCES jobs(id),
  status TEXT DEFAULT 'Applied',
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, job_id)
);
CREATE TABLE IF NOT EXISTS assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER, total INTEGER, taken_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS cv_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total INTEGER, details TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

if (db.prepare('SELECT COUNT(*) c FROM jobs').get().c === 0) {
  const ij = db.prepare('INSERT INTO jobs VALUES (?,?,?,?,?,?)');
  [
    [1, 'Software Developer', 'TCS', 'Pune, India', 'Full Time', 'javascript,java,sql,git'],
    [2, 'Data Analyst', 'Deloitte', 'Bangalore, India', 'Full Time', 'python,sql,excel,statistics'],
    [3, 'Business Analyst Intern', 'EY', 'Hyderabad, India', 'Internship', 'excel,communication,sql'],
    [4, 'Web Developer', 'Infosys', 'Mysore, India', 'Full Time', 'html,css,javascript,react'],
    [5, 'Digital Marketing Executive', 'Wipro', 'Mumbai, India', 'Part Time', 'seo,communication,marketing'],
  ].forEach(r => ij.run(...r));
  const ic = db.prepare('INSERT INTO courses VALUES (?,?,?,?)');
  [
    [1, 'Programming with Python', 'Programming', 'python'],
    [2, 'Web Development Bootcamp', 'Programming', 'html,css,javascript,react'],
    [3, 'Data Science Fundamentals', 'Data Science', 'python,statistics,sql'],
    [4, 'Digital Marketing Basics', 'Digital Marketing', 'seo,marketing'],
    [5, 'Effective Communication', 'Communication', 'communication'],
    [6, 'Leadership Essentials', 'Leadership', 'leadership'],
  ].forEach(r => ic.run(...r));
}
module.exports = db;
