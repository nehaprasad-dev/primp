# Primp

Primp is an enquiry-to-invoice CRM for salons in Mumbai. It captures every enquiry, scores it, makes sure someone follows up on WhatsApp, and carries it through booking to a paid invoice, branch by branch.

It is being built for **ProtoRun**, a two-week builders hackathon run by erp.ai, where each team takes a real business, builds its app with Proto on erp.ai, and brings it real customers through Meta and Instagram ads.

For the contest, Primp is set up for **Florian Hurel Hair Couture & Spa** and its three Mumbai salons: Bandra West, Waterfield Road and Walkeshwar. The salon name, branches and menu are all editable in the app, so the same build works for any salon.

- Contest plan (Proto prompts, ads, follow-up rules, demo script): [PLAYBOOK.md](PLAYBOOK.md)
- Message to the salon, submission text and social posts: [SUBMISSION.md](SUBMISSION.md)

## The problem

A premium salon gets enquiries from many places: Instagram (its main channel), ads, WhatsApp, calls and walk-ins, spread across several branches. Online booking works for people who have already decided. It does nothing for the larger group who ask a question ("how much is balayage?", "do you have a slot Saturday?") and then go quiet.

The gap Primp targets:

- **Undecided enquiries aren't followed up.** Nobody owns the person who asked and didn't book.
- **No priority.** A bridal or colour enquiry asking for a date looks the same as someone browsing.
- **Ad spend can't be traced to revenue.** There's no line from a campaign to the bookings and invoices it produced, per branch.

This is our working hypothesis. Confirm it with the salon before the demo, and use their own words in the pitch.

## The solution

1. **Capture.** Every enquiry goes into one CRM, tagged with its source, campaign and branch. Ad leads arrive by themselves through the public enquiry page or the Meta Lead Ads webhook.
2. **Score.** Each lead gets a score from 0 to 100 on how likely it is to book.
3. **Follow up.** Hot leads are due straight away, warm leads within 3 hours, cold leads the next day. One tap opens WhatsApp with a personal message already written, signed from the right branch.
4. **Book.** The lead is booked for a service, branch, date and time, with a WhatsApp confirmation.
5. **Invoice.** At checkout, staff confirm the final amount and Primp creates the invoice.
6. **Collect.** Invoices are marked paid and sent on WhatsApp. The dashboard shows revenue, cost per lead and return on ad spend, per branch and per campaign.

This is the "enquiry to invoice" flow that ProtoRun's judging is based on.

## Features

| Area | What it does |
|---|---|
| Dashboard | Follow-ups due now, conversion, revenue today and this month, unpaid amount, results by branch and by source, setup reminders |
| Ad performance | Ad spend (entered from Meta Ads Manager), ad leads, cost per lead, cost per booking, return on ad spend, results per campaign |
| Automation metric | Share of logged steps Primp did by itself (capture, scoring, scheduling, invoicing), for the "how much do the agents do" criterion |
| Branches | Each branch has its own address, WhatsApp, Maps link and hours. Leads, bookings and invoices belong to a branch. Branches can be switched off |
| Public enquiry page | Landing page for ads. Customers choose a branch and service. Reads `utm_source`, `utm_campaign` and `branch` from the link |
| Meta Lead Ads webhook | Imports leads from Facebook and Instagram instant forms, with signature checks, no duplicates and branch matching |
| Lead capture | Form for staff to log Instagram, WhatsApp, walk-in and referral enquiries |
| Lead scoring | Rule-based score from 0 to 100, labelled Hot, Warm or Cold |
| Follow-ups | Due time set by score. "WhatsApp" opens a ready-written message and logs the follow-up. "Called" logs a phone follow-up. Each follow-up sets the next one 2 days later |
| WhatsApp messages | Follow-up, booking confirmation and invoice messages through wa.me links. No WhatsApp Business API needed |
| Services | The salon's menu, with optional prices, durations and a high-value flag. A blank price shows as "Price on request" |
| Checkout | The invoice amount is confirmed when a service is completed. It starts at the menu price and can be changed for stylist level or add-ons |
| Invoices | Mark paid, send on WhatsApp, print with the branch's details |
| CSV export | Download all leads with branch, score, status and paid amount, for import into the erp.ai CRM |
| Staff login | Set `PRIMP_PASSWORD` to password-protect staff pages. The enquiry page and webhook stay public |

## Lead journey

```
Enquiry (ad / Instagram / WhatsApp / walk-in / referral), tagged with branch and campaign
   │
   ▼
New ── scored 0-100; follow-up due now (Hot), in 3 hours (Warm) or tomorrow (Cold)
   │
   ▼
Contacted ── each WhatsApp or call follow-up sets the next one 2 days later
   │
   ├──► Lost
   ▼
Booked ── service, branch, date and time chosen; confirmation sent on WhatsApp
   │        (cancelled booking ──► back to Contacted)
   ▼
Invoiced ── final amount confirmed at checkout; invoice created
   │
   ▼
Paid ── counted in revenue, per branch and per campaign
```

## Lead scoring

Scores are rule-based so staff can see why a lead ranks where it does. The rules are in `lib/scoring.ts`.

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
| High-value service | +15 |

The total is capped at 100. **Hot** is 70 or more, **Warm** is 40 to 69, and **Cold** is below 40.

A service counts as high-value if it is ticked "High value" on the Services page. For free-text interests that don't match the menu, words such as bridal, colour, balayage, keratin, HydraFacial, scalp and extension are used instead.

## Salon data

On first run, the database is filled from `lib/seed.ts`:

- **Salon:** Florian Hurel Hair Couture & Spa
- **Branches:** Bandra West, Waterfield Road, Walkeshwar
- **Services:** 36 services in hair, hair colour, hair care, Korean scalp treatment, skin, spa and nails. Names and durations are taken from florianhurelhaircouture.com, and 19 are marked high-value

The website publishes **no prices and no branch addresses**. In the app, prices start as "Price on request", and the dashboard reminds staff to fill in prices, addresses and WhatsApp numbers once the salon confirms them. Nothing is invented.

To use Primp for a different salon, change the name, branches and services in the app, or edit `lib/seed.ts` before the first run.

## Getting started

Requires Node.js 18.18 or later (developed on Node 22).

```bash
npm install
npm run dev
```

Open http://localhost:3000. Fill in each branch's address and WhatsApp on **Salon setup** (`/settings`), then prices on **Services** (`/services`).

For production:

```bash
npm run build
npm start
```

Data is stored in a SQLite file at `data/primp.db`, which git ignores. To start fresh, stop the server and delete the file. Databases from earlier versions are upgraded automatically on start.

### Environment variables

All are optional. Without them the app runs open, with no Meta webhook.

| Variable | Purpose |
|---|---|
| `PRIMP_PASSWORD` | Password for staff pages (browser login, any username) |
| `META_VERIFY_TOKEN` | Any string. Enter the same value when adding the webhook in the Meta app dashboard |
| `META_APP_SECRET` | Meta app secret, used to check webhook signatures |
| `META_PAGE_TOKEN` | Page access token with `leads_retrieval`, used to fetch lead details |

### Linking ads

Give each branch's ads their own link, with UTM tags and the branch id (shown in the order of the branches on `/settings`, starting at 1):

```
https://<your-domain>/enquiry?utm_source=instagram&utm_campaign=balayage-nov&branch=1
```

`utm_source` of `facebook`, `fb`, `instagram`, `ig` or `meta` marks the lead as a Meta Ad. Anything else, or no tag, marks it as Website. `branch` preselects the salon on the form.

For Meta instant forms, subscribe the page to the `leadgen` webhook field at `https://<your-domain>/api/meta/webhook`. The importer reads the form fields `full_name`, `phone_number`, `service`, `preferred_date` and `branch` (matched to a branch name).

## Pages

| Route | Who uses it | Purpose |
|---|---|---|
| `/` | Staff | Dashboard, branch results, ad performance |
| `/leads` | Staff | Log a new enquiry and see all leads, highest score first |
| `/leads/[id]` | Staff | Lead details, timeline, WhatsApp follow-up, mark lost, create a booking |
| `/bookings` | Staff | Confirm, complete with final amount, or cancel bookings |
| `/invoices` | Staff | All invoices, collected and pending totals, mark paid, send on WhatsApp |
| `/invoices/[id]` | Staff | Printable invoice |
| `/settings` | Staff | Salon name and branches |
| `/services` | Staff | Services, prices, durations, high-value flag |
| `/enquiry` | Customers | Public enquiry form that ads link to |
| `/api/export/leads` | Staff | Download all leads as CSV |
| `/api/meta/webhook` | Meta | Lead Ads webhook |

## Project structure

```
app/
  layout.tsx                 Top navigation and page shell
  page.tsx                   Dashboard
  globals.css                Styles, dark mode, print layout for invoices
  leads/page.tsx             Lead capture form and lead list
  leads/[id]/page.tsx        Lead detail and booking form
  bookings/page.tsx          Bookings and checkout
  invoices/page.tsx          Invoice list
  invoices/[id]/page.tsx     Printable invoice
  settings/page.tsx          Salon name and branches
  services/page.tsx          Services and prices
  enquiry/page.tsx           Public ad landing page
  api/export/leads/route.ts  Leads CSV export
  api/meta/webhook/route.ts  Meta Lead Ads webhook
lib/
  db.ts                      SQLite schema, migrations, types, first-run seeding
  seed.ts                    Starting data: salon, branches, services
  salon.ts                   Salon name and branch lookups
  leads.ts                   Lead insert with scoring and follow-up timing
  scoring.ts                 Lead scoring rules
  whatsapp.ts                wa.me links and message templates
  actions.ts                 Server actions
middleware.ts                Staff password protection
```

## Data model

| Table | Key fields |
|---|---|
| `branches` | name, area, address, WhatsApp, Maps link, hours, active |
| `services` | name, price (blank = on request), category, duration, high value |
| `leads` | name, phone, source, campaign, branch, service interest, asked price, asked date, notes, score, status, next follow-up, external id (Meta lead id) |
| `activities` | lead, kind (system, follow-up, note, status), message, time |
| `bookings` | lead, service, branch, scheduled time, status (Scheduled, Completed, Cancelled) |
| `invoices` | booking, lead, amount, status (Unpaid, Paid), paid time |
| `settings` | salon name, ad spend |

## Tech stack

- Next.js 15 (App Router, React Server Components, server actions)
- React 19
- SQLite through better-sqlite3
- TypeScript

## How Primp maps to the judging criteria

| Criterion | How Primp addresses it |
|---|---|
| Real users and leads, verified in the erp.ai CRM | Real enquiries for a real Mumbai salon, tagged by branch and campaign |
| How well the app handles them, from enquiry to invoice | Capture, scoring, timed follow-up, booking, checkout and payment in one flow, with results per branch and per campaign |
| How much of the work the agents do | Scoring, follow-up scheduling, message drafting, invoice creation and activity logging are automatic, and the dashboard shows the share |

## Current status and limitations

This repository is a working reference build. ProtoRun judges leads verified **in the erp.ai CRM**, so the submitted version has to be built on erp.ai with Proto. This codebase sets out the data model, scoring rules and flows for that build, and works as a standalone demo.

Known gaps:

- **Salon permission is required.** Running ads in the salon's name or messaging its customers needs written approval from Florian Hurel Salons Pvt Ltd.
- **Prices and branch addresses are not filled in yet.** They aren't public and must come from the salon.
- **WhatsApp messages are sent by a person.** Primp writes the message and opens WhatsApp, and staff press send.
- **Instagram and WhatsApp DMs are entered by staff.** Only the enquiry page and Meta instant forms capture leads by themselves.
- **Ad spend is entered by hand** from Meta Ads Manager.
- **Basic login only.** One shared staff password, no per-branch accounts.
- **One service per invoice.** No GST, discounts or extra items on the invoice.
- **Local SQLite storage.** It needs a server with a persistent disk, and will not persist on serverless hosts.

## Roadmap

- WhatsApp Business API for incoming enquiries and fully automatic follow-ups
- Instagram DM capture
- Ad spend pulled from the Meta Marketing API
- Staff accounts with per-branch access
- Multiple services per invoice, GST and discounts
- UPI payment links on invoices
- Repeat-visit reminders, for example for colour touch-ups or scalp treatment courses
