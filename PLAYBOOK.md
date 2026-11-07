# ProtoRun Win Playbook

What to do between now (Sat 7 Nov) and submission (Sun 8 Nov) to give Primp the best chance of winning, with **Florian Hurel Hair Couture & Spa** as the salon.

## What the judges score

1. **Real users and leads, verified in your erp.ai CRM.** Leads must be in erp.ai, not only in this repo's app.
2. **How well the app handles them, from enquiry to invoice.** At least a few leads should go all the way to a paid invoice.
3. **How much of the work Proto's agents do.** Show which steps Proto did by itself.

Real paid invoices count for more than lead volume. Five leads that reach a paid invoice beat fifty that go nowhere.

## The salon

| | |
|---|---|
| Salon | Florian Hurel Hair Couture & Spa (Florian Hurel Salons Pvt Ltd) |
| Mumbai branches | Bandra West, Waterfield Road (Bandra West), Walkeshwar |
| Head office | 602, 6th Floor, Sapphire Notandas, SV Road, Khar West, Mumbai 400052 |
| Phone | +91 91674 70414 |
| Marketing contact | marketing@florianhurelhaircouture.com |
| Instagram | @florianhurelhaircoutureandspa |
| Not public | Prices, branch addresses, branch WhatsApp numbers, opening hours |

Source: florianhurelhaircouture.com, checked 7 Nov 2026.

## Risks, and the fallback

This is a premium chain, not a single-owner salon. That changes three things:

1. **Permission comes from the company, not an owner.** You need written approval to run ads in their name, message their customers and show their data in a demo. Without it you can't run the contest with this salon. Using the brand without approval would misuse their trademark and their customers' trust.
2. **Ads run from their Facebook/Instagram page.** Their marketing team has to add you to their Meta Business account, or run the ads themselves using your links.
3. **The pitch is different.** They already have online booking. The story is "undecided enquiries that go quiet, and ad spend that can't be traced to revenue", not "paper register".

**Fallback rule:** if you don't have written approval by **Saturday 6pm**, switch to a neighbourhood salon whose owner you can reach directly. In the app this takes about 10 minutes: change the salon name and branches on `/settings` and the menu on `/services`. The rest of this playbook still applies.

## Plan to Sunday

| When | Task | Done when |
|---|---|---|
| Sat morning | Send the approval request (SUBMISSION.md, section 1). Call +91 91674 70414 too, since email alone is slow | Written approval, or a named contact working on it |
| Sat morning | Build Primp on erp.ai with Proto (prompts below) | Enquiry form link works |
| Sat, after approval | Get prices for 5-10 services you'll advertise, branch addresses and WhatsApp numbers. Enter them on `/settings` and `/services`, and in erp.ai | No "price on request" on advertised services |
| Sat, after approval | Launch ads, one ad set per branch (see below) | Ads approved and spending |
| Sat 6pm | **Decision point:** no approval, then switch to the fallback salon | Salon fixed for the rest of the contest |
| Sat-Sun | Follow up every Hot lead within 5 minutes, signed from the right branch | No overdue follow-ups |
| Sat evening to Sun | Book leads into open slots. Complete services, confirm the amount, collect invoices | At least one lead reaches a paid invoice |
| Sun afternoon | Record the 2-minute demo and collect the numbers | Submitted before the deadline |

With one day left, ads may not deliver in time. The salon's own Instagram DMs and walk-in enquiries from this weekend are the safest source of real leads, so ask the branch teams to log every one of them.

## Building on erp.ai with Proto

This repo is the reference build. Paste these prompts into Proto one at a time and check the result after each. I haven't used Proto's interface, so adjust the wording if it asks for something different.

**1. Data**

> Build a CRM for Florian Hurel Hair Couture & Spa, a premium salon with three Mumbai branches: Bandra West, Waterfield Road and Walkeshwar. Create these records: Branches (name, address, WhatsApp, opening hours), Services (name, category, duration, price in INR which may be blank for "price on request", high value yes/no), Leads (name, WhatsApp number, source, campaign, branch, service interest, asked about price yes/no, asked for a date yes/no, notes, score 0-100, status, next follow-up time), Bookings (lead, service, branch, date and time, status: Scheduled, Completed, Cancelled) and Invoices (booking, lead, amount, status: Unpaid, Paid, paid date). Lead source options: Meta Ad, Instagram, WhatsApp, Walk-in, Referral, Website. Lead status options: New, Contacted, Booked, Invoiced, Lost.

**2. Services**

> Add these services. Leave the price blank where I haven't given one. [Paste from lib/seed.ts, plus the prices the salon confirmed.]

**3. Public enquiry form**

> Create a public enquiry form for ads. Fields: name, WhatsApp number, which salon (Bandra West, Waterfield Road, Walkeshwar), which service (from the Services list), when they'd like to come (This week, Next week, Just exploring), and a checkbox for "please send me prices". Each submission creates a Lead with source Meta Ad, the campaign from the utm_campaign URL parameter, and the branch from the form.

**4. Lead scoring agent**

> When a lead is created, score it from 0 to 100. Source points: Walk-in 25, Referral 25, Meta Ad 20, WhatsApp 15, Instagram 10, other 10. Add 20 if they named a service, 20 if they asked about price, 25 if they asked for a date, 10 if they gave a phone number, and 15 if the service is marked high value. Cap at 100. Label 70 and above Hot, 40-69 Warm, below 40 Cold.

**5. Follow-up agent**

> When a lead is created, set the next follow-up time: now for Hot, 3 hours for Warm, next day for Cold. Draft a WhatsApp message from the lead's branch that greets them by first name, names the service they asked about (and its price, if set), and asks which day suits them. When a follow-up is done, set the next one 2 days later. Show overdue follow-ups at the top, highest score first. Stop following up once the lead is Booked or Lost.

**6. Booking to invoice**

> When a booking is marked Completed, ask for the final amount (starting from the menu price), create an Unpaid invoice for that amount with the branch's details, and set the lead to Invoiced. Draft a WhatsApp thank-you message with the invoice number and amount.

**7. Dashboard**

> Build a dashboard with: total leads, conversion rate (booked divided by total), revenue today and this month from paid invoices, unpaid amount, leads, bookings and revenue per branch, leads by source, and for Meta Ad leads: ad spend (entered by hand), cost per lead, cost per booking and return on ad spend per campaign.

Note every step Proto does by itself (scoring, scheduling, message drafting, invoice creation). That list is your answer to the third judging criterion.

## Meta ads

**Setup**

- Run from the salon's own Facebook/Instagram page, with their approval.
- Objective: **Leads**, sent to the erp.ai enquiry form, or a Meta instant form with a "Which salon?" question if Proto can't make a public form.
- **One ad set per branch**, each with its own link (`&branch=` in this repo's app) so leads arrive tagged:
  - Bandra West and Waterfield Road: pin on each salon, 3-4 km radius (Bandra, Khar, Santacruz).
  - Walkeshwar: pin on the salon, 3-4 km radius (Malabar Hill, Peddar Road, Breach Candy, Marine Drive).
- Audience: 25-50, interests in luxury beauty, hair colour, skincare, spas and weddings. Premium leads cost more than neighbourhood-salon leads, so start around ₹1,000 a day per ad set and watch cost per lead.
- UTM tags on every link, for example: `?utm_source=instagram&utm_campaign=balayage-nov&branch=1`.

**What to advertise**

Pick high-value services where one booking pays for the ads: balayage and colour transformation, Korean scalp treatment, AI-Enhanced HydraFacial, bridal hair. Use the salon's own photos and videos, and only prices or offers the salon has approved in writing.

**Copy to adapt (salon approves the final wording)**

> Balayage by Florian Hurel Hair Couture, Bandra West. Hand-painted colour, tailored to you. Tap to request a consultation slot this week.

> Hair fall or a dry, itchy scalp? Our 90-minute Korean Scalp Treatment, now at Bandra West, Waterfield Road and Walkeshwar. Tap to enquire.

> Wedding season is here. Bridal hair by Florian Hurel Hair Couture. Limited Dec-Feb dates. Request your trial.

## Lead handling rules

- **Hot leads: reply within 5 minutes.** Speed matters more than anything else in converting a lead.
- Send the drafted WhatsApp message from the lead's branch, then call if there's no reply within an hour.
- Offer two specific slots ("Saturday 11am or 4pm at Bandra West?") instead of asking when they're free.
- For "price on request" services, give a price range or offer a free consultation, rather than leaving the question open.
- When a lead books, send the confirmation right away and a reminder the evening before.
- Log every outcome, including "not interested", so the conversion numbers are honest.

## 2-minute demo script

| Time | Show |
|---|---|
| 0:00-0:15 | The problem: an Instagram enquiry ("how much is balayage?") that never got a follow-up |
| 0:15-0:35 | A real ad, then the enquiry form with a branch chosen. Submit it |
| 0:35-0:55 | The lead lands in the erp.ai CRM, scored Hot, follow-up due now, WhatsApp message drafted by Proto from the right branch |
| 0:55-1:20 | Follow-up sent, booking made, service completed, amount confirmed, invoice created, marked paid |
| 1:20-1:45 | Dashboard: leads and revenue per branch, cost per lead, return on ad spend |
| 1:45-2:00 | What Proto did automatically versus what staff did, and a short quote from the salon |

Use a real customer's journey (with their permission) instead of test data.

## Submission numbers

Fill this in from the dashboard and Meta Ads Manager.

| Metric | Value |
|---|---|
| Ad spend | ₹ |
| Impressions / clicks | |
| Leads (from ads / all sources) | |
| Leads per branch | |
| Cost per lead | ₹ |
| Bookings | |
| Paid invoices and revenue | ₹ |
| Return on ad spend | x |
| Steps done automatically by Proto | |

## Extra money: view payouts

Post the build story on X, Reels, Shorts and TikTok with #ProtoRun and tag @erpai. The payout is $1 per 1,000 views, up to $500 per video. Show the salon's brand only with their approval.
