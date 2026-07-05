-- Recurring duty definitions (e.g. "Cook Night", "Front Desk", "Security")
CREATE TABLE IF NOT EXISTS app_shifts__shift_types (
  id           TEXT NOT NULL,
  name         TEXT NOT NULL,
  emoji        TEXT NOT NULL DEFAULT '🔄',
  color        TEXT NOT NULL DEFAULT '#6366f1',
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL,
  PRIMARY KEY (id)
);

-- Concrete shift instances — one row per duty-day, claimable up to capacity
CREATE TABLE IF NOT EXISTS app_shifts__shifts (
  id            TEXT NOT NULL,
  shift_type_id TEXT NOT NULL,
  date          TEXT NOT NULL,
  capacity      INTEGER NOT NULL DEFAULT 1,
  note          TEXT NOT NULL DEFAULT '',
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS shifts_date_idx ON app_shifts__shifts (date);

-- Who holds each shift — written only by the hub's slot-claims endpoints
-- (claim/release for self-signup, assign/unassign for leadership)
CREATE TABLE IF NOT EXISTS app_shifts__shift_claims (
  id         TEXT NOT NULL,
  shift_id   TEXT NOT NULL,
  member_id  TEXT NOT NULL,
  claimed_at TEXT NOT NULL,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS shift_claims_shift_idx ON app_shifts__shift_claims (shift_id);
CREATE INDEX IF NOT EXISTS shift_claims_member_idx ON app_shifts__shift_claims (member_id, shift_id);

CREATE TABLE IF NOT EXISTS app_shifts__activity (
  id           TEXT NOT NULL,
  shift_id     TEXT NOT NULL,
  actor_id     TEXT NOT NULL,
  action       TEXT NOT NULL,
  detail       TEXT NOT NULL DEFAULT '',
  created_at   TEXT NOT NULL,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS activity_shift_idx ON app_shifts__activity (shift_id);
