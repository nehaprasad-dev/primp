# Primp 💅

Enquiry-to-invoice CRM for **Tropical Salon** (Pant Nagar, Ghatkopar East, Mumbai) — built for the **ProtoRun** hackathon.

Every customer enquiry — Meta ad, Instagram, WhatsApp, or walk-in — lands in one CRM, gets auto-scored by booking intent, gets follow-up reminders, and flows through booking to an auto-generated invoice. The exact *enquiry → invoice* loop ProtoRun judges on.

## Run it

```bash
npm install
npm run dev     # http://localhost:3000
```

Production: `npm run build && npm start`. Data lives in a local SQLite file at `data/primp.db` (auto-created and seeded with Tropical Salon's service menu on first run).

## Pages

| Page | What it does |
|---|---|
| `/` | Dashboard — follow-ups due now, conversion %, revenue today / this month, leads by source |
| `/leads` | Capture + list enquiries; every lead is auto-scored 0–100 (Hot/Warm/Cold) |
| `/leads/[id]` | Lead timeline, notes, follow-up snooze, convert to booking |
| `/bookings` | Mark a service completed — the invoice is generated automatically |
| `/invoices` | Collect payments; printable invoice at `/invoices/[id]` |
| `/enquiry` | **Public landing page for Meta/Instagram ads** — submissions land straight in the CRM as scored leads |

## Lead scoring

Rule-based, transparent: source (walk-in/referral 25, Meta ad 20, WhatsApp 15, Instagram 10) + named a service (+20) + asked price (+20) + asked for a date (+25) + reachable phone (+10) + high-value service like bridal/color/spa (+15), capped at 100. Hot ≥ 70, Warm ≥ 40.

## Follow-ups

Every new lead gets a follow-up due the next day. "Followed up ✓" snoozes it 2 days. Overdue follow-ups surface at the top of the dashboard — so no enquiry is ever silently dropped, which is the problem this app exists to fix.

## Stack

Next.js 15 (App Router, server actions) · better-sqlite3 · no external services required.
