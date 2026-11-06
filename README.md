# Primp

Enquiry-to-invoice CRM for Tropical Salon (Pant Nagar, Ghatkopar East, Mumbai). Built for the ProtoRun hackathon.

Every enquiry — from a Meta ad, Instagram, WhatsApp, or a walk-in — lands in one CRM, gets scored by booking intent, gets follow-up reminders, and moves through booking to an auto-generated invoice.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
```

Production: `npm run build && npm start`.

Data is stored in a local SQLite file at `data/primp.db`, created and seeded with the salon's service menu on first run.

## Pages

| Route | Purpose |
|---|---|
| `/` | Dashboard: due follow-ups, conversion rate, revenue (today and month), leads by source |
| `/leads` | Capture and list enquiries; each lead is scored 0-100 |
| `/leads/[id]` | Lead timeline, notes, follow-up actions, convert to booking |
| `/bookings` | Mark a service complete; the invoice is generated automatically |
| `/invoices` | Collect payments; printable invoice at `/invoices/[id]` |
| `/enquiry` | Public landing page for ads; submissions enter the CRM as scored leads |

## Lead scoring

Rule-based and transparent. Points for source (walk-in and referral 25, Meta ad 20, WhatsApp 15, Instagram 10), naming a service (+20), asking price (+20), asking for a date (+25), a reachable phone (+10), and a high-value service such as bridal, colour, or spa (+15). Capped at 100. Hot >= 70, Warm >= 40, Cold below 40. See `lib/scoring.ts`.

## Follow-ups

Each new lead gets a follow-up due the next day. "Followed up" snoozes it two days. Overdue follow-ups appear at the top of the dashboard, so no enquiry is dropped.

## Stack

Next.js 15 (App Router, server actions), better-sqlite3. No external services required.
