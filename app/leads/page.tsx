import Link from "next/link";
import db, { type Lead } from "@/lib/db";
import { tier } from "@/lib/scoring";
import { createLead } from "@/lib/actions";

export const dynamic = "force-dynamic";

const SOURCES = ["Meta Ad", "Instagram", "WhatsApp", "Walk-in", "Referral"];

export default function LeadsPage() {
  const leads = db.prepare("SELECT * FROM leads ORDER BY score DESC, id DESC").all() as Lead[];

  return (
    <main>
      <h1>Leads</h1>
      <p className="sub">Har enquiry yahan capture hoti hai — Instagram, WhatsApp, walk-in, ads. Score automatic lagta hai.</p>

      <form className="panel" action={createLead}>
        <strong>+ New enquiry</strong>
        <div className="row">
          <label className="field">Name<input type="text" name="name" required placeholder="e.g. Priya Sharma" /></label>
          <label className="field">Phone / WhatsApp<input type="tel" name="phone" placeholder="98xxxxxxxx" /></label>
          <label className="field">Source
            <select name="source" defaultValue="WhatsApp">
              {SOURCES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label className="field">Service interest<input type="text" name="service_interest" placeholder="e.g. Gold Facial, Bridal" /></label>
        </div>
        <div className="row">
          <label className="check"><input type="checkbox" name="asked_price" /> Asked about price</label>
          <label className="check"><input type="checkbox" name="asked_date" /> Asked for date / availability</label>
        </div>
        <label className="field">Notes<textarea name="notes" rows={2} placeholder="Anything the customer said…" /></label>
        <div><button className="primary">Capture lead</button></div>
      </form>

      <h2>All leads ({leads.length})</h2>
      {leads.length === 0 ? (
        <p className="sub">Koi lead nahi abhi.</p>
      ) : (
        <table>
          <thead><tr><th>Lead</th><th>Source</th><th>Interest</th><th>Score</th><th>Status</th><th>Next follow-up</th></tr></thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id}>
                <td><Link href={`/leads/${l.id}`}><strong>{l.name}</strong></Link><div className="sub-line">{l.phone || "no phone"}</div></td>
                <td>{l.source}</td>
                <td>{l.service_interest || "—"}</td>
                <td><span className={`badge ${tier(l.score).toLowerCase()}`}>{tier(l.score)} · {l.score}</span></td>
                <td><span className={`badge ${l.status === "Lost" ? "grey" : l.status === "New" ? "cold" : "green"}`}>{l.status}</span></td>
                <td>{l.next_follow_up ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
