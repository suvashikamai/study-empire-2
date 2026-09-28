-- Study Empire schema (SQLite).
--
-- Ported from the original Prisma-style design (see docs/architecture.md)
-- to plain SQL because this sandbox's network policy blocks
-- binaries.prisma.sh, which `prisma generate` needs. The schema itself is
-- unchanged; only the access layer differs (src/lib/db/repo/*.ts instead of
-- a generated client). Moving to Postgres later means changing the
-- CREATE TABLE dialect here and swapping client.ts's driver — the repo
-- functions' SQL is close enough to portable that most survive unchanged.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  profile_image_url TEXT,
  friend_code TEXT NOT NULL UNIQUE,

  total_xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  total_study_minutes INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_study_date TEXT,
  completed_sessions INTEGER NOT NULL DEFAULT 0,
  completed_tasks INTEGER NOT NULL DEFAULT 0,

  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#22e07a',
  icon TEXT NOT NULL DEFAULT 'book',
  description TEXT,
  target_hours REAL NOT NULL DEFAULT 0,
  archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_subjects_user ON subjects(user_id);

CREATE TABLE IF NOT EXISTS topics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_minutes INTEGER NOT NULL DEFAULT 60,
  completed_minutes INTEGER NOT NULL DEFAULT 0,
  priority TEXT NOT NULL DEFAULT 'MEDIUM',
  difficulty TEXT NOT NULL DEFAULT 'MEDIUM',
  completed INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_topics_subject ON topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_user ON topics(user_id);

CREATE TABLE IF NOT EXISTS schedule_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  date TEXT,
  days_of_week TEXT,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  recurring INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_schedule_user ON schedule_entries(user_id);

CREATE TABLE IF NOT EXISTS study_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  schedule_entry_id TEXT REFERENCES schedule_entries(id),

  planned_minutes INTEGER NOT NULL,
  actual_minutes INTEGER NOT NULL DEFAULT 0,
  breaks_taken INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'IN_PROGRESS',

  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at TEXT,

  xp_awarded INTEGER NOT NULL DEFAULT 0,
  construction_points_awarded INTEGER NOT NULL DEFAULT 0,

  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_topic ON study_sessions(topic_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_started ON study_sessions(user_id, started_at);

CREATE TABLE IF NOT EXISTS daily_goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  target_minutes INTEGER NOT NULL DEFAULT 0,
  completed_minutes INTEGER NOT NULL DEFAULT 0,
  completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS exam_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  exam_date TEXT NOT NULL,
  topic_ids TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_exam_plans_user ON exam_plans(user_id);

CREATE TABLE IF NOT EXISTS empires (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  town_hall_level INTEGER NOT NULL DEFAULT 1,
  empire_xp INTEGER NOT NULL DEFAULT 0,
  population INTEGER NOT NULL DEFAULT 100,
  condition_pct REAL NOT NULL DEFAULT 100,
  last_study_activity_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_decay_check_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS building_instances (
  id TEXT PRIMARY KEY,
  empire_id TEXT NOT NULL REFERENCES empires(id) ON DELETE CASCADE,
  building_type TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'CONSTRUCTING',
  construction_points INTEGER NOT NULL DEFAULT 0,
  construction_points_required INTEGER NOT NULL,
  condition_pct REAL NOT NULL DEFAULT 100,
  position_x INTEGER NOT NULL DEFAULT 0,
  position_y INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_buildings_empire ON building_instances(empire_id);

CREATE TABLE IF NOT EXISTS user_achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, achievement_key)
);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON user_achievements(user_id);

CREATE TABLE IF NOT EXISTS quest_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  quest_key TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  target INTEGER NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  reward_claimed INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, date, quest_key)
);
CREATE INDEX IF NOT EXISTS idx_quests_user_date ON quest_progress(user_id, date);

CREATE TABLE IF NOT EXISTS friend_requests (
  id TEXT PRIMARY KEY,
  from_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(from_user_id, to_user_id)
);

CREATE TABLE IF NOT EXISTS friendships (
  id TEXT PRIMARY KEY,
  user_a_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_a_id, user_b_id)
);

CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id, created_at);
