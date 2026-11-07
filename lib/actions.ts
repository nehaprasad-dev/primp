"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import db from "./db";
import type { Lead } from "./db";
import { insertLead } from "./leads";
import { getBranch } from "./salon";
import { followUpMessage, waLink } from "./whatsapp";

function revalidateAll() {
  revalidatePath("/", "layout");
}

const text = (formData: FormData, key: string, max = 300) => String(formData.get(key) ?? "").trim().slice(0, max);

/** Blank = no price (on request). Returns undefined for invalid input. */
function parsePrice(raw: string): number | null | undefined {
  if (raw === "") return null;
  const n = Math.round(Number(raw.replace(/[₹,\s]/g, "")));
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/** Only https links are stored, so a Maps field can't hold javascript: or similar. */
const safeUrl = (raw: string) => (/^https:\/\//i.test(raw) ? raw : "");

/** A branch id from a form, or null if missing or unknown. */
const branchFrom = (formData: FormData) => getBranch(Number(formData.get("branch_id")))?.id ?? null;

// ---------- Leads ----------

export async function createLead(formData: FormData) {
  const name = text(formData, "name", 100);
  if (!name) return;
  const when = text(formData, "when");
  const asked_date = formData.get("asked_date") === "on" || when === "This week" || when === "Next week";
  const notes = [when && `Preferred: ${when}`, text(formData, "notes", 1000)].filter(Boolean).join(". ");

  insertLead({
    name,
    phone: text(formData, "phone", 20),
    source: text(formData, "source", 30) || "Walk-in",
    service_interest: text(formData, "service_interest", 150),
    asked_price: formData.get("asked_price") === "on",
    asked_date,
    notes,
    campaign: text(formData, "campaign", 100),
    branch_id: branchFrom(formData),
  });
  revalidateAll();
  if (formData.get("from_public") === "1") redirect("/enquiry?sent=1");
}

export async function whatsappFollowUp(formData: FormData) {
  const leadId = Number(formData.get("lead_id"));
  const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(leadId) as Lead | undefined;
  if (!lead) return;
  const svc = db.prepare("SELECT price FROM services WHERE name = ?").get(lead.service_interest) as
    | { price: number | null }
    | undefined;
  const link = waLink(lead.phone, followUpMessage(lead, svc?.price));
  if (!link) return;
  db.prepare(
    `UPDATE leads SET status = CASE WHEN status = 'New' THEN 'Contacted' ELSE status END,
     next_follow_up = datetime('now','localtime','+2 day') WHERE id = ?`
  ).run(leadId);
  db.prepare("INSERT INTO activities (lead_id, kind, body) VALUES (?, 'follow_up', ?)").run(
    leadId,
    "WhatsApp follow-up sent (message auto-written by Primp). Next follow-up in 2 days."
  );
  revalidateAll();
  redirect(link);
}

export async function addNote(formData: FormData) {
  const leadId = Number(formData.get("lead_id"));
  const body = text(formData, "body", 1000);
  if (!leadId || !body) return;
  db.prepare("INSERT INTO activities (lead_id, kind, body) VALUES (?, 'note', ?)").run(leadId, body);
  revalidatePath(`/leads/${leadId}`);
}

export async function markContacted(formData: FormData) {
  const leadId = Number(formData.get("lead_id"));
  db.prepare(
    `UPDATE leads SET status = CASE WHEN status = 'New' THEN 'Contacted' ELSE status END,
     next_follow_up = datetime('now','localtime','+2 day') WHERE id = ?`
  ).run(leadId);
  db.prepare("INSERT INTO activities (lead_id, kind, body) VALUES (?, 'follow_up', ?)").run(
    leadId,
    "Followed up with the customer. Next follow-up in 2 days."
  );
  revalidateAll();
}

export async function markLost(formData: FormData) {
  const leadId = Number(formData.get("lead_id"));
  db.prepare("UPDATE leads SET status = 'Lost', next_follow_up = NULL WHERE id = ?").run(leadId);
  db.prepare("INSERT INTO activities (lead_id, kind, body) VALUES (?, 'status', 'Marked as lost.')").run(leadId);
  revalidateAll();
}

// ---------- Bookings and invoices ----------

export async function createBooking(formData: FormData) {
  const leadId = Number(formData.get("lead_id"));
  const serviceId = Number(formData.get("service_id"));
  const scheduledAt = text(formData, "scheduled_at").replace("T", " ");
  const lead = db.prepare("SELECT branch_id FROM leads WHERE id = ?").get(leadId) as { branch_id: number | null } | undefined;
  const svc = db.prepare("SELECT name FROM services WHERE id = ?").get(serviceId) as { name: string } | undefined;
  if (!lead || !svc || !scheduledAt) return;
  const branchId = branchFrom(formData) ?? lead.branch_id;
  const branch = getBranch(branchId);

  db.transaction(() => {
    db.prepare("INSERT INTO bookings (lead_id, service_id, scheduled_at, branch_id) VALUES (?, ?, ?, ?)").run(
      leadId, serviceId, scheduledAt, branchId
    );
    // Booking at a branch also settles which branch the lead belongs to.
    db.prepare("UPDATE leads SET status = 'Booked', next_follow_up = NULL, branch_id = ? WHERE id = ?").run(branchId, leadId);
    db.prepare("INSERT INTO activities (lead_id, kind, body) VALUES (?, 'status', ?)").run(
      leadId,
      `Booked: ${svc.name} on ${scheduledAt}${branch ? ` at ${branch.name}` : ""}.`
    );
  })();
  revalidateAll();
}

export async function completeBooking(formData: FormData) {
  const bookingId = Number(formData.get("booking_id"));
  const amount = parsePrice(text(formData, "amount"));
  const booking = db
    .prepare("SELECT b.lead_id, b.status, s.name FROM bookings b JOIN services s ON s.id = b.service_id WHERE b.id = ?")
    .get(bookingId) as { lead_id: number; status: string; name: string } | undefined;
  // The amount is confirmed at checkout: menu price by default, editable for stylist level, add-ons, etc.
  if (!booking || booking.status !== "Scheduled" || amount == null || amount <= 0) return;

  db.transaction(() => {
    db.prepare("UPDATE bookings SET status = 'Completed' WHERE id = ?").run(bookingId);
    db.prepare("INSERT INTO invoices (booking_id, lead_id, amount) VALUES (?, ?, ?)").run(bookingId, booking.lead_id, amount);
    db.prepare("UPDATE leads SET status = 'Invoiced' WHERE id = ?").run(booking.lead_id);
    db.prepare("INSERT INTO activities (lead_id, kind, body) VALUES (?, 'system', ?)").run(
      booking.lead_id,
      `Service completed. Invoice auto-generated for ₹${amount.toLocaleString("en-IN")} (${booking.name}).`
    );
  })();
  revalidateAll();
}

export async function cancelBooking(formData: FormData) {
  const bookingId = Number(formData.get("booking_id"));
  const booking = db.prepare("SELECT lead_id, status FROM bookings WHERE id = ?").get(bookingId) as
    | { lead_id: number; status: string }
    | undefined;
  if (!booking || booking.status !== "Scheduled") return;
  db.transaction(() => {
    db.prepare("UPDATE bookings SET status = 'Cancelled' WHERE id = ?").run(bookingId);
    db.prepare(
      "UPDATE leads SET status = 'Contacted', next_follow_up = datetime('now','localtime','+1 day') WHERE id = ?"
    ).run(booking.lead_id);
    db.prepare("INSERT INTO activities (lead_id, kind, body) VALUES (?, 'status', 'Booking cancelled. Follow-up due tomorrow.')").run(
      booking.lead_id
    );
  })();
  revalidateAll();
}

export async function markPaid(formData: FormData) {
  const invoiceId = Number(formData.get("invoice_id"));
  db.prepare(
    "UPDATE invoices SET status = 'Paid', paid_at = datetime('now','localtime') WHERE id = ? AND status = 'Unpaid'"
  ).run(invoiceId);
  revalidateAll();
}

// ---------- Services ----------

export async function updateService(formData: FormData) {
  const id = Number(formData.get("service_id"));
  const name = text(formData, "name", 150);
  const price = parsePrice(text(formData, "price"));
  if (!id || !name || price === undefined) return;
  db.prepare("UPDATE services SET name = ?, price = ?, duration = ?, high_value = ? WHERE id = ?").run(
    name, price, text(formData, "duration", 30), formData.get("high_value") === "on" ? 1 : 0, id
  );
  revalidateAll();
}

export async function addService(formData: FormData) {
  const name = text(formData, "name", 150);
  const price = parsePrice(text(formData, "price"));
  if (!name || price === undefined) return;
  db.prepare("INSERT INTO services (name, price, category, duration, high_value) VALUES (?, ?, ?, ?, ?)").run(
    name, price, text(formData, "category", 50) || "General", text(formData, "duration", 30),
    formData.get("high_value") === "on" ? 1 : 0
  );
  revalidateAll();
}

// ---------- Salon and branches ----------

export async function saveSalonName(formData: FormData) {
  const name = text(formData, "salon_name", 100);
  if (!name) return;
  db.prepare(
    "INSERT INTO settings (key, value) VALUES ('salon_name', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run(name);
  revalidateAll();
  redirect("/settings?saved=1");
}

function branchFields(formData: FormData) {
  return {
    name: text(formData, "name", 80),
    area: text(formData, "area", 120),
    address: text(formData, "address"),
    whatsapp: text(formData, "whatsapp", 20),
    maps: safeUrl(text(formData, "maps")),
    hours: text(formData, "hours", 120),
  };
}

export async function saveBranch(formData: FormData) {
  const id = Number(formData.get("branch_id"));
  const f = branchFields(formData);
  if (!f.name) return;
  const active = formData.get("active") === "on" ? 1 : 0;
  if (id) {
    db.prepare(
      "UPDATE branches SET name = ?, area = ?, address = ?, whatsapp = ?, maps = ?, hours = ?, active = ? WHERE id = ?"
    ).run(f.name, f.area, f.address, f.whatsapp, f.maps, f.hours, active, id);
  } else {
    db.prepare("INSERT INTO branches (name, area, address, whatsapp, maps, hours) VALUES (?, ?, ?, ?, ?, ?)").run(
      f.name, f.area, f.address, f.whatsapp, f.maps, f.hours
    );
  }
  revalidateAll();
  redirect("/settings?saved=1");
}

// ---------- Ads ----------

export async function setAdSpend(formData: FormData) {
  const spend = Math.max(0, Math.round(Number(formData.get("ad_spend")) || 0));
  db.prepare(
    "INSERT INTO settings (key, value) VALUES ('ad_spend', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run(String(spend));
  revalidateAll();
}
