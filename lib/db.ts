import { createClient, type Client } from "@libsql/client";

let _client: Client | null = null;
let _schema: Promise<void> | null = null;

function makeClient(): Client {
  const url = process.env.TURSO_DATABASE_URL ?? "file:local.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;
  return authToken ? createClient({ url, authToken }) : createClient({ url });
}

export function db(): Client {
  if (!_client) _client = makeClient();
  return _client;
}

const STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    tdee REAL,
    goal TEXT DEFAULT 'maintain',
    weight_kg REAL,
    height_cm REAL,
    age INTEGER,
    sex TEXT,
    activity TEXT DEFAULT 'moderate',
    preferences TEXT DEFAULT '',
    target_calories REAL,
    protein_g REAL,
    carb_g REAL,
    fat_g REAL,
    rationale TEXT,
    add_exercise_back INTEGER DEFAULT 0,
    updated_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS food_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL,
    source TEXT NOT NULL,
    raw_input TEXT,
    note TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS food_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    amount_g REAL,
    kcal REAL NOT NULL,
    protein_g REAL NOT NULL,
    carb_g REAL NOT NULL,
    fat_g REAL NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS exercise_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL,
    type TEXT NOT NULL,
    when_text TEXT,
    calories_burned REAL NOT NULL DEFAULT 0,
    note TEXT
  )`,
  // Favorites are snapshots, deliberately decoupled from food_items /
  // exercise_entries (no FK): editing or deleting a logged row never touches
  // a favorite created from it, and vice versa.
  `CREATE TABLE IF NOT EXISTS food_favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    amount_g REAL,
    kcal REAL NOT NULL,
    protein_g REAL NOT NULL,
    carb_g REAL NOT NULL,
    fat_g REAL NOT NULL,
    created_at TEXT NOT NULL,
    use_count INTEGER NOT NULL DEFAULT 0,
    last_used_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS exercise_favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    calories_burned REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    use_count INTEGER NOT NULL DEFAULT 0,
    last_used_at TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_food_entries_date ON food_entries(date)`,
  `CREATE INDEX IF NOT EXISTS idx_food_items_entry ON food_items(entry_id)`,
  `CREATE INDEX IF NOT EXISTS idx_exercise_date ON exercise_entries(date)`,
  `INSERT OR IGNORE INTO profile (id) VALUES (1)`,
];

// Additive migrations for tables that may pre-date these columns.
// SQLite raises "duplicate column name" when the column already exists —
// that error is expected and swallowed; anything else still throws.
const MIGRATIONS: string[] = [
  `ALTER TABLE food_favorites ADD COLUMN use_count INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE food_favorites ADD COLUMN last_used_at TEXT`,
  `ALTER TABLE exercise_favorites ADD COLUMN use_count INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE exercise_favorites ADD COLUMN last_used_at TEXT`,
];

/** Create tables (idempotent) and seed the single profile row. */
export async function ensureSchema(): Promise<void> {
  if (!_schema) {
    _schema = (async () => {
      const c = db();
      for (const sql of STATEMENTS) {
        await c.execute(sql);
      }
      for (const sql of MIGRATIONS) {
        try {
          await c.execute(sql);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (!/duplicate column/i.test(msg)) throw err;
        }
      }
    })().catch((err) => {
      _schema = null; // allow a retry on next request
      throw err;
    });
  }
  return _schema;
}
