import { notFound } from "next/navigation";
import Link from "next/link";
import db, { type Activity, type Lead, type Service } from "@/lib/db";
import { tier } from "@/lib/scoring";
import { addNote, createBooking, markContacted, markLost, whatsappFollowUp } from "@/lib/actions";
import { bookingMessage, waLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export default async function LeadDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(Number(id)) as Lead | undefined;
  if (!lead) notFound();

  const activities = db
    .prepare("SELECT * FROM activities WHERE lead_id = ? ORDER BY id DESC")
    .all(lead.id) as Activity[];
  const services = db.prepare("SELECT * FROM services ORDER BY category, price").all() as Service[];
  const bookings = db
    .prepare("SELECT b.*, s.name AS service_name, s.price FROM bookings b JOIN services s ON s.id = b.service_id WHERE b.lead_id = ? ORDER BY b.id DESC")
    .all(lead.id) as { id: number; scheduled_at: string; status: string; service_name: string; price: number }[];

  const t = tier(lead.score);
  const canBook = !["Lost"].includes(lead.status);

  return (
    <main>
      <p className="sub"><Link href="/leads">← All leads</Link></p>
      <h1>{lead.name} <span className={`badge ${t.toLowerCase()}`}>{t} · {lead.score}/100</span></h1>
      <p className="sub">
        {lead.phone || "No phone"} · via {lead.source} · status <strong>{lead.status}</strong>
        {lead.service_interest ? <> · interested in <strong>{lead.service_interest}</strong></> : null}
        {lead.next_follow_up ? <> · next follow-up {lead.next_follow_up}</> : null}
      </p>

      {lead.status !== "Lost" && lead.status !== "Invoiced" && (
        <p>
          {lead.phone && (
            <form className="inline" action={whatsappFollowUp}>
              <input type="hidden" name="lead_id" value={lead.id} />
              <button className="primary">Follow up on WhatsApp</button>
            </form>
          )}{" "}
          <form className="inline" action={markContacted}>
            <input type="hidden" name="lead_id" value={lead.id} />
            <button>Called ✓ (snooze 2 days)</button>
          </form>{" "}
          <form className="inline" action={markLost}>
            <input type="hidden" name="lead_id" value={lead.id} />
            <button>Mark lost</button>
          </form>
        </p>
      )}

      {canBook && (
        <>
          <h2>Book a service</h2>
          <form className="panel" action={createBooking}>
            <input type="hidden" name="lead_id" value={lead.id} />
            <div className="row">
              <label className="field">Service
                <select name="service_id" required>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} — ₹{s.price.toLocaleString("en-IN")}</option>
                  ))}
                </select>
              </label>
              <label className="field">Date &amp; time<input type="datetime-local" name="scheduled_at" required /></label>
            </div>
            <div><button className="primary">Create booking</button></div>
          </form>
        </>
      )}

      {bookings.length > 0 && (
        <>
          <h2>Bookings</h2>
          <table>
            <thead><tr><th>Service</th><th>When</th><th>Amount</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {bookings.map((b) => {
                const confirm = b.status === "Scheduled" ? waLink(lead.phone, bookingMessage(lead.name, b.service_name, b.scheduled_at)) : null;
                return (
                  <tr key={b.id}>
                    <td>{b.service_name}</td>
                    <td>{b.scheduled_at}</td>
                    <td>₹{b.price.toLocaleString("en-IN")}</td>
                    <td><span className={`badge ${b.status === "Completed" ? "green" : b.status === "Cancelled" ? "grey" : "warm"}`}>{b.status}</span></td>
                    <td>{confirm && <a className="btn" href={confirm} target="_blank" rel="noopener noreferrer">Send confirmation</a>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}

      <h2>Activity</h2>
      <form className="panel" action={addNote}>
        <input type="hidden" name="lead_id" value={lead.id} />
        <div className="row">
          <input type="text" name="body" required placeholder="Add a note… (what the customer said, next step)" />
          <div><button>Add note</button></div>
        </div>
      </form>
      <div className="timeline">
        {lead.notes && (
          <div className="item"><time>At capture</time>{lead.notes}</div>
        )}
        {activities.map((a) => (
          <div className="item" key={a.id}><time>{a.created_at} · {a.kind.replace("_", " ")}</time>{a.body}</div>
        ))}
      </div>
    </main>
  );
}
