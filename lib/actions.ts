"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import db from "./db";
import type { Service } from "./db";
import { scoreLead } from "./scoring";

function revalidateAll() {
  ["/", "/leads", "/bookings", "/invoices"].forEach((p) => revalidatePath(p));
}

export async function createLead(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const phone = String(formData.get("phone") ?? "").trim();
  const source = String(formData.get("source") ?? "Walk-in");
  const service_interest = String(formData.get("service_interest") ?? "").trim();
  const asked_price = formData.get("asked_price") === "on";
  const asked_date = formData.get("asked_date") === "on";
  const notes = String(formData.get("notes") ?? "").trim();
  const fromPublic = formData.get("from_public") === "1";

  const score = scoreLead({ source, service_interest, asked_price, asked_date, phone });
  const info = db
    .prepare(
      `INSERT INTO leads (name, phone, source, service_interest, asked_price, asked_date, notes, score, next_follow_up)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now','localtime','+1 day'))`
    )
    .run(name, phone, source, service_interest, asked_price ? 1 : 0, asked_date ? 1 : 0, notes, score);
  db.prepare("INSERT INTO activities (lead_id, kind, body) VALUES (?, 'system', ?)").run(
    info.lastInsertRowid,
    `Lead captured from ${source}. Auto-scored ${score}/100. Follow-up scheduled for tomorrow.`
  );
  revalidateAll();
  if (fromPublic) redirect("/enquiry?sent=1");
}

export async function addNote(formData: FormData) {
  const leadId = Number(formData.get("lead_id"));
  const body = String(formData.get("body") ?? "").trim();
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
  revalidatePath(`/leads/${leadId}`);
}

export async function markLost(formData: FormData) {
  const leadId = Number(formData.get("lead_id"));
  db.prepare("UPDATE leads SET status = 'Lost', next_follow_up = NULL WHERE id = ?").run(leadId);
  db.prepare("INSERT INTO activities (lead_id, kind, body) VALUES (?, 'status', 'Marked as lost.')").run(leadId);
  revalidateAll();
  revalidatePath(`/leads/${leadId}`);
}

export async function createBooking(formData: FormData) {
  const leadId = Number(formData.get("lead_id"));
  const serviceId = Number(formData.get("service_id"));
  const scheduledAt = String(formData.get("scheduled_at") ?? "");
  if (!leadId || !serviceId || !scheduledAt) return;
  db.prepare("INSERT INTO bookings (lead_id, service_id, scheduled_at) VALUES (?, ?, ?)").run(
    leadId,
    serviceId,
    scheduledAt.replace("T", " ")
  );
  db.prepare("UPDATE leads SET status = 'Booked', next_follow_up = NULL WHERE id = ?").run(leadId);
  const svc = db.prepare("SELECT name FROM services WHERE id = ?").get(serviceId) as { name: string };
  db.prepare("INSERT INTO activities (lead_id, kind, body) VALUES (?, 'status', ?)").run(
    leadId,
    `Booked: ${svc.name} on ${scheduledAt.replace("T", " ")}.`
  );
  revalidateAll();
  revalidatePath(`/leads/${leadId}`);
}

export async function completeBooking(formData: FormData) {
  const bookingId = Number(formData.get("booking_id"));
  const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId) as
    | { id: number; lead_id: number; service_id: number; status: string }
    | undefined;
  if (!booking || booking.status !== "Scheduled") return;
  const svc = db.prepare("SELECT * FROM services WHERE id = ?").get(booking.service_id) as Service;
  const tx = db.transaction(() => {
    db.prepare("UPDATE bookings SET status = 'Completed' WHERE id = ?").run(bookingId);
    db.prepare("INSERT INTO invoices (booking_id, lead_id, amount) VALUES (?, ?, ?)").run(
      bookingId,
      booking.lead_id,
      svc.price
    );
    db.prepare("UPDATE leads SET status = 'Invoiced' WHERE id = ?").run(booking.lead_id);
    db.prepare("INSERT INTO activities (lead_id, kind, body) VALUES (?, 'system', ?)").run(
      booking.lead_id,
      `Service completed. Invoice auto-generated for ₹${svc.price} (${svc.name}).`
    );
  });
  tx();
  revalidateAll();
}

export async function cancelBooking(formData: FormData) {
  const bookingId = Number(formData.get("booking_id"));
  const booking = db.prepare("SELECT lead_id, status FROM bookings WHERE id = ?").get(bookingId) as
    | { lead_id: number; status: string }
    | undefined;
  if (!booking || booking.status !== "Scheduled") return;
  db.prepare("UPDATE bookings SET status = 'Cancelled' WHERE id = ?").run(bookingId);
  db.prepare(
    "UPDATE leads SET status = 'Contacted', next_follow_up = datetime('now','localtime','+1 day') WHERE id = ?"
  ).run(booking.lead_id);
  revalidateAll();
}

export async function markPaid(formData: FormData) {
  const invoiceId = Number(formData.get("invoice_id"));
  db.prepare(
    "UPDATE invoices SET status = 'Paid', paid_at = datetime('now','localtime') WHERE id = ? AND status = 'Unpaid'"
  ).run(invoiceId);
  revalidateAll();
}
