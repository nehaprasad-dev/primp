# Primp

Primp is an enquiry-to-invoice CRM for **Tropical Salon**, a working beauty salon in Pant Nagar, Ghatkopar East, Mumbai. It is being built for **ProtoRun**, a two-week builders hackathon run by erp.ai, where each team takes a real business, builds its app with Proto on erp.ai, and brings it real customers through Meta and Instagram ads.

The step-by-step plan for the contest (Proto prompts, ads, follow-up rules, demo script) is in [PLAYBOOK.md](PLAYBOOK.md).

## The problem

Tropical Salon, like most neighbourhood salons, runs on WhatsApp messages, phone calls and a paper register. That causes three problems:

- **Lost enquiries.** Nothing records who asked about a service, so people who ask and never come back are never followed up.
- **No view of conversion.** There is no way to tell which enquiries became paying customers, or which channel (Instagram, WhatsApp, walk-in) brings them.
- **No revenue picture.** Daily or monthly revenue means going through handwritten invoices by hand.

Small service businesses across India have the same problem. Customers are lost because nobody is tracking them, not because the business doesn't want them.

## The solution

Primp puts the whole customer journey in one place:

1. **Capture.** Every enquiry, whether from a Meta ad, Instagram, WhatsApp, a referral or a walk-in, goes into one CRM. Ad leads arrive by themselves through the public enquiry page or the Meta Lead Ads webhook, tagged with their campaign.
2. **Score.** Each lead is scored from 0 to 100 on how likely it is to book. Someone asking the price and a date for a bridal package ranks above someone just browsing.
3. **Follow up.** Hot leads are due for follow-up straight away, warm leads within 3 hours, cold leads the next day. One tap opens WhatsApp with a personalised message already written.
4. **Book.** A lead becomes a booking for a specific service, date and time, with a WhatsApp confirmation.
5. **Invoice.** When the service is marked complete, Primp creates the invoice automatically at the menu price.
6. **Collect.** Invoices are marked paid and can be sent on WhatsApp. The dashboard shows revenue, cost per lead and return on ad spend.

This is the "enquiry to invoice" flow that ProtoRun's judging is based on.

## Features

| Area | What it does |
|---|---|
| Dashboard | Follow-ups due now, total leads, conversion rate, revenue today and this month, unpaid amount, leads by source, recent leads |
| Ad performance | Ad spend (entered from Meta Ads Manager), ad leads, cost per lead, cost per booking, return on ad spend, leads and bookings per campaign |
| Automation metric | Share of logged steps Primp did by itself (capture, scoring, scheduling, invoicing). Supports the "how much do the agents do" judging criterion |
| Lead capture | Form for staff to log WhatsApp, Instagram, walk-in and referral enquiries, including whether the customer asked about price or a date |
| Public enquiry page | Landing page for ads. Reads `utm_source` and `utm_campaign` so every lead is linked to its campaign |
| Meta Lead Ads webhook | Imports leads from Facebook and Instagram instant forms, with signature checks and no duplicates |
| Lead scoring | Rule-based score from 0 to 100, labelled Hot, Warm or Cold |
| Follow-ups | Due time set by score. "WhatsApp" opens a ready-written message and logs the follow-up. "Called" logs a phone follow-up. Each follow-up sets the next one 2 days later |
| WhatsApp messages | Pre-written follow-up, booking confirmation and invoice messages through wa.me links. No WhatsApp Business API account needed |
| Lead timeline | Every capture, note, follow-up, booking and invoice is logged on the lead's page |
| Bookings | Book any service for a date and time. Confirm, complete or cancel it. Cancelling sends the lead back into follow-up |
| Invoices | Created automatically when a booking is completed. Mark paid, send on WhatsApp, see collected and pending totals, print |
| Staff login | Set `PRIMP_PASSWORD` to password-protect every staff page. The enquiry page and webhook stay public |

## Lead journey

```
Enquiry (ad / Instagram / WhatsApp / walk-in / referral)
   │
   ▼
New ── scored 0-100; follow-up due now (Hot), in 3 hours (Warm) or tomorrow (Cold)
   │
   ▼
Contacted ── each WhatsApp or call follow-up sets the next one 2 days later
   │
   ├──► Lost
   ▼
Booked ── service, date and time chosen; confirmation sent on WhatsApp
   │        (cancelled booking ──► back to Contacted)
   ▼
Invoiced ── invoice created automatically on completion
   │
   ▼
Paid ── counted in dashboard revenue and return on ad spend
```

## Lead scoring

Scores are rule-based so the salon can see why a lead ranks where it does. The rules are in `lib/scoring.ts`.

| Signal | Points |
|---|---|
| Source: walk-in or referral | 25 |
| Source: Meta ad | 20 |
| Source: WhatsApp | 15 |
| Source: Instagram, website or other | 10 |
| Named a specific service | +20 |
| Asked about price | +20 |
| Asked for a date (this week or next week) | +25 |
| Gave a reachable phone number | +10 |
| High-value service (bridal, makeup, colour, spa) | +15 |

The total is capped at 100. **Hot** is 70 or more, **Warm** is 40 to 69, and **Cold** is below 40. The follow-up list on the dashboard is sorted by score, so the hottest leads come first.

## Service menu

Seeded on first run. **These prices are placeholders.** Replace them with Tropical Salon's real menu in `lib/db.ts` before the first run, or edit the `services` table afterwards.

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

### Environment variables

All are optional. Without them the app runs open, with no Meta webhook.

| Variable | Purpose |
|---|---|
| `PRIMP_PASSWORD` | Password for staff pages (browser login, any username) |
| `SALON_WHATSAPP` | Salon's WhatsApp number. Shows a "Chat with us now" button after an enquiry |
| `META_VERIFY_TOKEN` | Any string. Enter the same value when adding the webhook in the Meta app dashboard |
| `META_APP_SECRET` | Meta app secret, used to check webhook signatures |
| `META_PAGE_TOKEN` | Page access token with `leads_retrieval`, used to fetch lead details |

### Linking ads

Point ads to the enquiry page with UTM tags:

```
https://<your-domain>/enquiry?utm_source=instagram&utm_campaign=gold-facial-nov
```

`utm_source` of `facebook`, `fb`, `instagram`, `ig` or `meta` marks the lead as a Meta Ad. Anything else, or no tag, marks it as Website.

For Meta instant forms, subscribe the page to the `leadgen` webhook field at `https://<your-domain>/api/meta/webhook`. The importer reads the form fields `full_name`, `phone_number`, `service` and `preferred_date`.

## Pages

| Route | Who uses it | Purpose |
|---|---|---|
| `/` | Salon staff | Dashboard and ad performance |
| `/leads` | Salon staff | Log a new enquiry and see all leads, highest score first |
| `/leads/[id]` | Salon staff | Lead details, timeline, WhatsApp follow-up, mark lost, create a booking |
| `/bookings` | Salon staff | Upcoming and past bookings; confirm, complete (creates the invoice) or cancel |
| `/invoices` | Salon staff | All invoices, collected and pending totals, mark paid, send on WhatsApp |
| `/invoices/[id]` | Salon staff | Printable invoice |
| `/enquiry` | Customers | Public enquiry form that ads link to |
| `/api/meta/webhook` | Meta | Lead Ads webhook |

## Project structure

```
app/
  layout.tsx                 Top navigation and page shell
  page.tsx                   Dashboard, ad performance, automation metric
  globals.css                Styles, dark mode, print layout for invoices
  leads/page.tsx             Lead capture form and lead list
  leads/[id]/page.tsx        Lead detail and booking form
  bookings/page.tsx          Booking list, confirm, complete and cancel
  invoices/page.tsx          Invoice list, mark paid, send on WhatsApp
  invoices/[id]/page.tsx     Printable invoice
  enquiry/page.tsx           Public ad landing page with UTM tracking
  api/meta/webhook/route.ts  Meta Lead Ads webhook
lib/
  db.ts                      SQLite schema, types, settings and service menu seed
  leads.ts                   Lead insert with scoring and follow-up timing
  scoring.ts                 Lead scoring rules
  whatsapp.ts                wa.me links and message templates
  actions.ts                 Server actions for leads, follow-ups, bookings, invoices, ad spend
middleware.ts                Staff password protection
```

## Data model

| Table | Key fields |
|---|---|
| `services` | name, price (INR), category |
| `leads` | name, phone, source, campaign, service interest, asked price, asked date, notes, score, status, next follow-up, external id (Meta lead id) |
| `activities` | lead, kind (system, follow-up, note, status), message, time |
| `bookings` | lead, service, scheduled time, status (Scheduled, Completed, Cancelled) |
| `invoices` | booking, lead, amount, status (Unpaid, Paid), paid time |
| `settings` | key, value (ad spend) |

## Tech stack

- Next.js 15 (App Router, React Server Components, server actions)
- React 19
- SQLite through better-sqlite3
- TypeScript

## How Primp maps to the judging criteria

| Criterion | How Primp addresses it |
|---|---|
| Real users and leads, verified in the erp.ai CRM | Real enquiries from ads for a real salon, tagged by campaign, not test data |
| How well the app handles them, from enquiry to invoice | Capture, scoring, timed follow-up, booking, invoicing and payment in one flow, with cost per lead and return on ad spend |
| How much of the work the agents do | Scoring, follow-up scheduling, message drafting, invoice creation and activity logging are automatic, and the dashboard shows the share |

## Current status and limitations

This repository is a working reference build of Primp. ProtoRun judges leads verified **in the erp.ai CRM**, so the submitted version has to be built on erp.ai with Proto. This codebase sets out the data model, scoring rules and flows for that build, and works as a standalone demo. See [PLAYBOOK.md](PLAYBOOK.md).

Known gaps:

- **WhatsApp messages are sent by a person.** Primp writes the message and opens WhatsApp. Staff press send. Fully automatic sending needs the WhatsApp Business API.
- **Incoming WhatsApp and Instagram DMs are entered by staff.** Only the enquiry page and Meta instant forms capture leads by themselves.
- **Ad spend is entered by hand** from Meta Ads Manager.
- **Basic login only.** One shared staff password, no separate accounts or roles.
- **Single-service invoices.** Each booking is for one service, with no GST, discounts or extra items on the invoice.
- **Local SQLite storage.** Fine for one salon on one server with a persistent disk. It will not persist on serverless hosts with temporary file systems.

## Roadmap

- WhatsApp Business API for incoming enquiries and fully automatic follow-ups and reminders
- Ad spend pulled from the Meta Marketing API
- Staff accounts and roles
- Multiple services per invoice, GST and discounts
- UPI payment links on invoices
- Repeat-customer reminders (for example, "time for your next facial")
