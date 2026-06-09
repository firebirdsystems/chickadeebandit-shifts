-- Recurring duty definitions (e.g. "Cook Night", "Front Desk", "Security")
CREATE TABLE IF NOT EXISTS shift_types (
  household_id UUID NOT NULL DEFAULT current_setting('app.household_id', true)::uuid,
  id           TEXT NOT NULL,
  name         TEXT NOT NULL,
  emoji        TEXT NOT NULL DEFAULT '🔄',
  color        TEXT NOT NULL DEFAULT '#6366f1',
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL,
  PRIMARY KEY (household_id, id)
);

-- Concrete shift instances — one row per duty-day assignment
CREATE TABLE IF NOT EXISTS shifts (
  household_id  UUID NOT NULL DEFAULT current_setting('app.household_id', true)::uuid,
  id            TEXT NOT NULL,
  shift_type_id TEXT NOT NULL,
  date          TEXT NOT NULL,
  member_id     TEXT,
  note          TEXT NOT NULL DEFAULT '',
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  PRIMARY KEY (household_id, id)
);

CREATE INDEX IF NOT EXISTS shifts_date_idx ON shifts (household_id, date);
CREATE INDEX IF NOT EXISTS shifts_member_idx ON shifts (household_id, member_id, date);

CREATE TABLE IF NOT EXISTS activity (
  household_id UUID NOT NULL DEFAULT current_setting('app.household_id', true)::uuid,
  id           TEXT NOT NULL,
  shift_id     TEXT NOT NULL,
  actor_id     TEXT NOT NULL,
  action       TEXT NOT NULL,
  detail       TEXT NOT NULL DEFAULT '',
  created_at   TEXT NOT NULL,
  PRIMARY KEY (household_id, id)
);

CREATE INDEX IF NOT EXISTS activity_shift_idx ON activity (household_id, shift_id);
