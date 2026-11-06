import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, "primp.db"));
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  category TEXT NOT NULL DEFAULT 'General'
);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  source TEXT NOT NULL DEFAULT 'Walk-in',      -- Meta Ad | Instagram | WhatsApp | Walk-in | Referral
  service_interest TEXT DEFAULT '',
  asked_price INTEGER NOT NULL DEFAULT 0,
  asked_date INTEGER NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'New',          -- New | Contacted | Booked | Completed | Invoiced | Lost
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  next_follow_up TEXT
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
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
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

// Seed Tropical Salon's service menu once
const count = (db.prepare("SELECT COUNT(*) AS c FROM services").get() as { c: number }).c;
if (count === 0) {
  const ins = db.prepare("INSERT INTO services (name, price, category) VALUES (?, ?, ?)");
  const seed: [string, number, string][] = [
    ["Haircut (Women)", 500, "Hair"],
    ["Haircut (Men)", 250, "Hair"],
    ["Hair Spa", 900, "Hair"],
    ["Hair Color (Global)", 2500, "Hair"],
    ["Classic Facial", 800, "Skin"],
    ["Gold Facial", 1500, "Skin"],
    ["Clean-up", 500, "Skin"],
    ["Threading (Eyebrows)", 60, "Skin"],
    ["Waxing (Full Arms + Legs)", 700, "Skin"],
    ["Manicure", 400, "Hands & Feet"],
    ["Pedicure", 500, "Hands & Feet"],
    ["Party Makeup", 2500, "Makeup"],
    ["Bridal Package", 15000, "Makeup"],
  ];
  const tx = db.transaction(() => seed.forEach((s) => ins.run(...s)));
  tx();
}

export default db;

export type Service = { id: number; name: string; price: number; category: string };
export type Lead = {
  id: number; name: string; phone: string; source: string; service_interest: string;
  asked_price: number; asked_date: number; notes: string; score: number; status: string;
  created_at: string; next_follow_up: string | null;
};
export type Booking = {
  id: number; lead_id: number; service_id: number; scheduled_at: string; status: string; created_at: string;
};
export type Invoice = {
  id: number; booking_id: number; lead_id: number; amount: number; status: string;
  created_at: string; paid_at: string | null;
};
export type Activity = { id: number; lead_id: number; kind: string; body: string; created_at: string };
