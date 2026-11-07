# ProtoRun Win Playbook

What to do between now (Fri 6 Nov) and submission (Sun 8 Nov) to give Primp the best chance of winning.

## What the judges score

1. **Real users and leads, verified in your erp.ai CRM.** Leads must be in erp.ai, not only in this repo's app.
2. **How well the app handles them, from enquiry to invoice.** At least a few leads should go all the way to a paid invoice.
3. **How much of the work Proto's agents do.** Show which steps Proto did by itself.

Real paid invoices count for more than lead volume. Five leads that reach a paid invoice beat fifty that go nowhere.

## 48-hour plan

| When | Task | Done when |
|---|---|---|
| Fri morning | Confirm with the Tropical Salon owner: real prices, one offer, permission to run ads and message customers, 5-10 before/after photos | Owner has said yes on WhatsApp (screenshot it) |
| Fri morning | Build Primp on erp.ai with Proto (prompts below) | Enquiry form link works |
| Fri afternoon | Launch Meta ads pointing to the erp.ai enquiry form | Ads approved and spending |
| Fri afternoon | Log the salon's existing WhatsApp and walk-in enquiries from this week | Real leads in the CRM before ads deliver |
| Fri-Sun | Follow up every Hot lead within 5 minutes, using the rules below | No overdue follow-ups |
| Sat | Book leads into weekend slots. Complete services, generate and collect invoices | At least one lead reaches a paid invoice |
| Sat night | Post a build video with #ProtoRun and tag @erpai | Posted |
| Sun morning | Record the 2-minute demo and collect the numbers | Submitted before the deadline |

If ad approval is slow, keep going with the salon's real WhatsApp and walk-in enquiries. Those still count as real leads.

## Building on erp.ai with Proto

This repo is the reference build. Paste these prompts into Proto one at a time, checking the result after each. I haven't used Proto's interface, so adjust the wording if it asks for something different.

**1. Data**

> Build a CRM for Tropical Salon, a beauty salon in Pant Nagar, Ghatkopar East, Mumbai. Create these records: Services (name, price in INR, category), Leads (name, WhatsApp number, source, campaign, service interest, asked about price yes/no, asked for a date yes/no, notes, score 0-100, status, next follow-up time), Bookings (lead, service, date and time, status: Scheduled, Completed, Cancelled) and Invoices (booking, lead, amount, status: Unpaid, Paid, paid date). Lead source options: Meta Ad, Instagram, WhatsApp, Walk-in, Referral, Website. Lead status options: New, Contacted, Booked, Invoiced, Lost.

**2. Services**

> Add these services: [paste the salon's real menu and prices].

**3. Public enquiry form**

> Create a public enquiry form for ads. Fields: name, WhatsApp number, which service (from the Services list), when they'd like to come (This week, Next week, Just checking prices), and a checkbox for "send me the price list". Each submission creates a Lead with source Meta Ad and the campaign taken from the utm_campaign URL parameter.

**4. Lead scoring agent**

> When a lead is created, score it from 0 to 100. Source points: Walk-in 25, Referral 25, Meta Ad 20, WhatsApp 15, Instagram 10, other 10. Add 20 if they named a service, 20 if they asked about price, 25 if they asked for a date, 10 if they gave a phone number, and 15 if the service is bridal, makeup, colour or spa. Cap at 100. Label 70 and above Hot, 40-69 Warm, below 40 Cold.

**5. Follow-up agent**

> When a lead is created, set the next follow-up time: now for Hot, 3 hours for Warm, next day for Cold. Draft a WhatsApp message that greets them by first name, names the service and price they asked about, and asks which day suits them. When a follow-up is done, set the next one 2 days later. Show overdue follow-ups at the top, highest score first. Stop following up once the lead is Booked or Lost.

**6. Booking to invoice**

> When a booking is marked Completed, automatically create an Unpaid invoice for the service price and set the lead to Invoiced. Draft a WhatsApp thank-you message with the invoice number and amount.

**7. Dashboard**

> Build a dashboard with: total leads, conversion rate (booked divided by total), revenue today and this month from paid invoices, unpaid amount, leads by source, and for Meta Ad leads: ad spend (entered by hand), cost per lead, cost per booking and return on ad spend.

Note every step Proto does by itself (scoring, scheduling, message drafting, invoice creation). That list is your answer to the third judging criterion.

## Meta ads

**Setup**

- Objective: **Leads**, sent to the erp.ai enquiry form as a website, or a Meta instant form if Proto can't make a public form. Click-to-WhatsApp works well for salons, but those chats have to be entered into the CRM by hand.
- Location: 2-3 km radius around Pant Nagar, Ghatkopar East.
- Audience: women 18-45, interests in beauty, hair care, skincare and weddings. Make a separate ad set for bridal.
- Budget: ₹500-700 a day per ad set. Two days of a small budget is enough for real leads, not for optimisation.
- Link every ad with UTM tags, for example: `?utm_source=instagram&utm_campaign=facial-offer`.

**Creative (three ads, test all of them)**

1. Before/after carousel of real salon work. Offer in the first line.
2. A 10-second video of the salon with the price on screen.
3. A bridal ad: "Bridal booking open for Dec-Feb weddings".

**Copy to adapt (get the owner to approve the offer)**

> Ghatkopar East, glow-up time! Gold Facial at Tropical Salon, Pant Nagar, only ₹1,500. This week only: free threading with any facial. Tap to book your slot.

> Shaadi season aa gaya. Bridal makeup trials now open at Tropical Salon, Pant Nagar. Limited dates for Dec-Feb. Book your trial.

## Lead handling rules

- **Hot leads: reply within 5 minutes.** Speed matters more than anything else in converting a lead.
- Send the drafted WhatsApp message, then call if there's no reply within an hour.
- Offer two specific slots ("Saturday 11am or 4pm?") instead of asking when they're free.
- When a lead books, send the confirmation right away and a reminder the evening before.
- Log every outcome, including "not interested", so the conversion numbers are honest.

## 2-minute demo script

| Time | Show |
|---|---|
| 0:00-0:15 | The problem: a paper register and WhatsApp chats at Tropical Salon (real photo) |
| 0:15-0:35 | A real ad, then the enquiry form. Submit it. |
| 0:35-0:55 | The lead lands in the erp.ai CRM, already scored Hot, with a follow-up due now and a WhatsApp message drafted by Proto |
| 0:55-1:20 | Follow-up sent, booking made, service completed, invoice created automatically, marked paid |
| 1:20-1:45 | Dashboard: real leads, conversion, revenue, cost per lead, return on ad spend |
| 1:45-2:00 | What Proto did automatically versus what staff did, and a short quote from the salon owner |

Use a real customer's journey (with their permission) instead of test data.

## Submission numbers

Fill this in from the dashboard and Meta Ads Manager.

| Metric | Value |
|---|---|
| Ad spend | ₹ |
| Impressions / clicks | |
| Leads (from ads / all sources) | |
| Cost per lead | ₹ |
| Bookings | |
| Paid invoices and revenue | ₹ |
| Return on ad spend | x |
| Steps done automatically by Proto | |

## Extra money: view payouts

Post the build story on X, Reels, Shorts and TikTok with #ProtoRun and tag @erpai. The payout is $1 per 1,000 views, up to $500 per video. Good angles: "I built my local salon's CRM in a weekend", and the before/after of the paper register next to the dashboard.
