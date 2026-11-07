import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { BRANCHES, SALON_NAME, SERVICES } from "./seed";

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, "primp.db"));
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS branches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  area TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  whatsapp TEXT NOT NULL DEFAULT '',
  maps TEXT NOT NULL DEFAULT '',
  hours TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price INTEGER,                               -- NULL = price on request
  category TEXT NOT NULL DEFAULT 'General',
  duration TEXT NOT NULL DEFAULT '',
  high_value INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  source TEXT NOT NULL DEFAULT 'Walk-in',      -- Meta Ad | Instagram | WhatsApp | Walk-in | Referral | Website
  service_interest TEXT DEFAULT '',
  asked_price INTEGER NOT NULL DEFAULT 0,
  asked_date INTEGER NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'New',          -- New | Contacted | Booked | Invoiced | Lost
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  next_follow_up TEXT,
  campaign TEXT NOT NULL DEFAULT '',
  external_id TEXT,
  branch_id INTEGER REFERENCES branches(id)
);

CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL REFERENCES leads(id),
  kind TEXT NOT NULL,                          -- note | follow_up | status | system
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL REFERENCES leads(id),
  service_id INTEGER NOT NULL REFERENCES services(id),
  scheduled_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Scheduled',    -- Scheduled | Completed | Cancelled
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  branch_id INTEGER REFERENCES branches(id)
);

CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL REFERENCES bookings(id),
  lead_id INTEGER NOT NULL REFERENCES leads(id),
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Unpaid',       -- Unpaid | Paid
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  paid_at TEXT
);
`);

// ---- Migrations for databases created by earlier versions ----
type Col = { name: string; notnull: number };
const cols = (table: string) => db.prepare(`PRAGMA table_info(${table})`).all() as Col[];
const addCol = (table: string, col: string, ddl: string) => {
  if (!cols(table).some((c) => c.name === col)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${ddl}`);
};

addCol("leads", "campaign", "TEXT NOT NULL DEFAULT ''");
addCol("leads", "external_id", "TEXT");
addCol("leads", "branch_id", "INTEGER REFERENCES branches(id)");
addCol("bookings", "branch_id", "INTEGER REFERENCES branches(id)");
addCol("services", "duration", "TEXT NOT NULL DEFAULT ''");
addCol("services", "high_value", "INTEGER NOT NULL DEFAULT 0");

// v1 had services.price NOT NULL; SQLite can't drop a constraint, so rebuild the table (ids kept).
if (cols("services").find((c) => c.name === "price")?.notnull) {
  db.transaction(() => {
    db.exec(`
      CREATE TABLE services_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, price INTEGER,
        category TEXT NOT NULL DEFAULT 'General', duration TEXT NOT NULL DEFAULT '',
        high_value INTEGER NOT NULL DEFAULT 0);
      INSERT INTO services_new (id, name, price, category, duration, high_value)
        SELECT id, name, price, category, duration, high_value FROM services;
      DROP TABLE services;
      ALTER TABLE services_new RENAME TO services;
    `);
  })();
}

export function getSetting(key: string, fallback = ""): string {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
  return row?.value ?? fallback;
}

// ---- Seed a fresh database (see lib/seed.ts) ----
const isEmpty = (table: string) => (db.prepare(`SELECT COUNT(*) c FROM ${table}`).get() as { c: number }).c === 0;

db.transaction(() => {
  if (!getSetting("salon_name")) {
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('salon_name', ?)").run(SALON_NAME);
  }
  if (isEmpty("branches")) {
    const ins = db.prepare("INSERT INTO branches (name, area) VALUES (?, ?)");
    BRANCHES.forEach((b) => ins.run(b.name, b.area));
  }
  if (isEmpty("services")) {
    const ins = db.prepare("INSERT INTO services (name, category, duration, high_value) VALUES (?, ?, ?, ?)");
    SERVICES.forEach(([name, category, duration, high]) => ins.run(name, category, duration, high ? 1 : 0));
  }
})();

export default db;

export type Branch = {
  id: number; name: string; area: string; address: string; whatsapp: string; maps: string; hours: string; active: number;
};
export type Service = {
  id: number; name: string; price: number | null; category: string; duration: string; high_value: number;
};
export type Lead = {
  id: number; name: string; phone: string; source: string; service_interest: string;
  asked_price: number; asked_date: number; notes: string; score: number; status: string;
  created_at: string; next_follow_up: string | null; campaign: string; external_id: string | null;
  branch_id: number | null;
};
export type Booking = {
  id: number; lead_id: number; service_id: number; scheduled_at: string; status: string; created_at: string;
  branch_id: number | null;
};
export type Invoice = {
  id: number; booking_id: number; lead_id: number; amount: number; status: string;
  created_at: string; paid_at: string | null;
};
export type Activity = { id: number; lead_id: number; kind: string; body: string; created_at: string };

/** "₹1,500", or "Price on request" when the salon hasn't set a price. */
export const priceLabel = (price: number | null) =>
  price === null ? "Price on request" : `₹${price.toLocaleString("en-IN")}`;
