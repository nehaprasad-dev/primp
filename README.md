# Primp

Primp is an enquiry-to-invoice CRM for **Tropical Salon**, a working beauty salon in Pant Nagar, Ghatkopar East, Mumbai. It is being built for **ProtoRun**, a two-week builders hackathon run by erp.ai, where each team takes a real business, builds its app with Proto on erp.ai, and brings it real customers through Meta and Instagram ads.

## The problem

Tropical Salon, like most neighbourhood salons, runs on WhatsApp messages, phone calls and a paper register. That causes three problems:

- **Lost enquiries.** Nothing records who asked about a service, so people who ask and never come back are never followed up.
- **No view of conversion.** There is no way to tell which enquiries became paying customers, or which channel (Instagram, WhatsApp, walk-in) brings them.
- **No revenue picture.** Daily or monthly revenue means going through handwritten invoices by hand.

Small service businesses across India have the same problem. Customers are lost because nobody is tracking them, not because the business doesn't want them.

## The solution

Primp puts the whole customer journey in one place:

1. **Capture.** Every enquiry, whether from a Meta ad, Instagram, WhatsApp, a referral or a walk-in, goes into one CRM. Ads point to a public enquiry page, so those leads arrive without anyone typing them in.
2. **Score.** Each lead is scored from 0 to 100 on how likely it is to book. Someone asking the price and a date for a bridal package ranks above someone just browsing.
3. **Follow up.** Every new lead gets a follow-up due the next day. Overdue follow-ups appear at the top of the dashboard until someone acts on them.
4. **Book.** A lead becomes a booking for a specific service, date and time.
5. **Invoice.** When the service is marked complete, Primp creates the invoice automatically at the menu price.
6. **Collect.** Invoices are marked paid, and the dashboard shows revenue for today and for the month.

This is the "enquiry to invoice" flow that ProtoRun's judging is based on.

## Features

| Area | What it does |
|---|---|
| Dashboard | Follow-ups due now, total leads, conversion rate, revenue today and this month, unpaid amount, leads by source, recent leads |
| Lead capture | Form for staff to log WhatsApp, Instagram, walk-in and referral enquiries, including whether the customer asked about price or a date |
| Public enquiry page | Landing page for Meta and Instagram ads. Customers pick a service from the live price list and leave their WhatsApp number. The lead is tagged as "Meta Ad" and scored automatically |
| Lead scoring | Rule-based score from 0 to 100, labelled Hot, Warm or Cold |
| Follow-ups | Automatic next-day reminder. "Followed up" sets the next one two days later. Leads can be marked lost |
| Lead timeline | Every capture, note, follow-up, booking and invoice is logged on the lead's page |
| Bookings | Book any service for a date and time. Complete or cancel it. Cancelling sends the lead back into follow-up |
| Invoices | Created automatically when a booking is completed. Mark paid, see collected and pending totals, and print a Tropical Salon invoice |
| Service menu | Tropical Salon's services and prices in INR, seeded on first run |

## Lead journey

```
Enquiry (ad / Instagram / WhatsApp / walk-in / referral)
   │
   ▼
New ── scored 0-100, follow-up due tomorrow
   │
   ▼
Contacted ── each follow-up sets the next one 2 days later
   │
   ├──► Lost
   ▼
Booked ── service, date and time chosen
   │        (cancelled booking ──► back to Contacted)
   ▼
Invoiced ── invoice created automatically on completion
   │
   ▼
Paid ── counted in dashboard revenue
```

## Lead scoring

Scores are rule-based so the salon can see why a lead ranks where it does. The rules are in `lib/scoring.ts`.

| Signal | Points |
|---|---|
| Source: walk-in or referral | 25 |
| Source: Meta ad | 20 |
| Source: WhatsApp | 15 |
| Source: Instagram (or other) | 10 |
| Named a specific service | +20 |
| Asked about price | +20 |
| Asked for a date or availability | +25 |
| Gave a reachable phone number | +10 |
| High-value service (bridal, makeup, colour, spa) | +15 |

The total is capped at 100. **Hot** is 70 or more, **Warm** is 40 to 69, and **Cold** is below 40. The follow-up list on the dashboard is sorted by score, so the hottest leads come first.

## Service menu

Seeded from Tropical Salon's menu. Edit `lib/db.ts` to change it before the first run, or edit the `services` table afterwards.

| Category | Services |
|---|---|
| Hair | Haircut (Women) ₹500, Haircut (Men) ₹250, Hair Spa ₹900, Hair Color (Global) ₹2,500 |
| Skin | Classic Facial ₹800, Gold Facial ₹1,500, Clean-up ₹500, Threading ₹60, Waxing ₹700 |
| Hands & Feet | Manicure ₹400, Pedicure ₹500 |
| Makeup | Party Makeup ₹2,500, Bridal Package ₹15,000 |

## Getting started

Requires Node.js 18.18 or later (developed on Node 22).

```bash
npm install
npm run dev
```

Open http://localhost:3000.

For production:

```bash
npm run build
npm start
```

Data is stored in a SQLite file at `data/primp.db`. It is created on first run and is ignored by git. To start fresh, stop the server and delete the file.

## Pages

| Route | Who uses it | Purpose |
|---|---|---|
| `/` | Salon staff | Dashboard |
| `/leads` | Salon staff | Log a new enquiry and see all leads, highest score first |
| `/leads/[id]` | Salon staff | Lead details, timeline, notes, follow-up, mark lost, create a booking |
| `/bookings` | Salon staff | Upcoming and past bookings; complete (creates the invoice) or cancel |
| `/invoices` | Salon staff | All invoices, collected and pending totals, mark paid |
| `/invoices/[id]` | Salon staff and customer | Printable invoice |
| `/enquiry` | Customers | Public enquiry form that ads link to |

## Project structure

```
app/
  layout.tsx              Top navigation and page shell
  page.tsx                Dashboard
  globals.css             Styles, dark mode, print layout for invoices
  leads/page.tsx          Lead capture form and lead list
  leads/[id]/page.tsx     Lead detail and booking form
  bookings/page.tsx       Booking list, complete and cancel
  invoices/page.tsx       Invoice list, mark paid
  invoices/[id]/page.tsx  Printable invoice
  enquiry/page.tsx        Public ad landing page
lib/
  db.ts                   SQLite schema, types and service menu seed
  scoring.ts              Lead scoring rules
  actions.ts              Server actions for leads, follow-ups, bookings, invoices
```

## Data model

| Table | Key fields |
|---|---|
| `services` | name, price (INR), category |
| `leads` | name, phone, source, service interest, asked price, asked date, notes, score, status, next follow-up |
| `activities` | lead, kind (note, follow-up, status, system), message, time |
| `bookings` | lead, service, scheduled time, status (Scheduled, Completed, Cancelled) |
| `invoices` | booking, lead, amount, status (Unpaid, Paid), paid time |

## Tech stack

- Next.js 15 (App Router, React Server Components, server actions)
- React 19
- SQLite through better-sqlite3
- TypeScript
- No external services or API keys

## ProtoRun plan

### Timeline

| When | What |
|---|---|
| Week 1 | Build the app on erp.ai with Proto, set up around Tropical Salon's real services and prices |
| Fri 30 Oct | Deadline for a working app to qualify for the $100 ad budget (first 50 teams) |
| Weeks 1-2 | Run geo-targeted Meta and Instagram ads for Pant Nagar and Ghatkopar East, sending leads into the CRM |
| Sun 8 Nov | Submission |

### Ads

- Target people near the salon in Pant Nagar and Ghatkopar East.
- Use before-and-after photos and limited-time offers, which tend to work well for salons.
- Point ads at the enquiry form so every lead is captured, scored and followed up.
- Track clicks, leads and cost per lead.

### How Primp maps to the judging criteria

| Criterion | How Primp addresses it |
|---|---|
| Real users and leads, verified in the erp.ai CRM | Real enquiries from ads for a real salon, not test data |
| How well the app handles them, from enquiry to invoice | Capture, scoring, follow-up, booking and invoicing in one flow |
| How much of the work Proto's agents do | Scoring, follow-up scheduling, invoice creation and activity logging are automatic. The submission will show which steps were automatic and which were manual |

### Submission checklist

- [ ] Working app link
- [ ] Ad results: clicks, leads, cost per lead
- [ ] 2-minute demo following one real enquiry from the CRM to a paid invoice
- [ ] Note on which steps Proto handled and which needed a person
- [ ] Optional: demo video on X, TikTok, Reels or Shorts with #ProtoRun, tagging @erpai

## Current status and limitations

This repository is a working reference build of Primp. ProtoRun judges leads verified **in the erp.ai CRM**, so the submitted version has to be built on erp.ai with Proto. This codebase sets out the data model, scoring rules and flows for that build, and works as a standalone demo.

Known gaps:

- **No WhatsApp or Instagram integration.** Enquiries from these channels are entered by staff. Only the public enquiry page captures leads by itself.
- **No Meta Lead Ads webhook.** Ads must link to `/enquiry`. Native Meta lead forms are not imported.
- **Reminders appear only in the app.** Due follow-ups show on the dashboard. No WhatsApp message or SMS is sent.
- **No login.** Every staff page is open to anyone with the link. Add authentication before deploying publicly.
- **Single location, single-service invoices.** Each booking is for one service, with no GST, discounts or extra items on the invoice.
- **Local SQLite storage.** Fine for one salon on one server. It will not persist on serverless hosts with temporary file systems.

## Roadmap

- WhatsApp Business API for incoming enquiries and automatic follow-up messages
- Meta Lead Ads webhook to bring leads straight into the CRM
- Staff login and roles
- Multiple services per invoice, GST and discounts
- UPI payment links on invoices
- Reports by source, cost per lead and repeat customers
