import Link from "next/link";
import db, { type Lead } from "@/lib/db";
import { tier } from "@/lib/scoring";
import { markContacted } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default function Dashboard() {
  const totalLeads = (db.prepare("SELECT COUNT(*) c FROM leads").get() as { c: number }).c;
  const booked = (db.prepare("SELECT COUNT(*) c FROM leads WHERE status IN ('Booked','Completed','Invoiced')").get() as { c: number }).c;
  const revenueToday = (db.prepare("SELECT COALESCE(SUM(amount),0) s FROM invoices WHERE status='Paid' AND date(paid_at)=date('now','localtime')").get() as { s: number }).s;
  const revenueMonth = (db.prepare("SELECT COALESCE(SUM(amount),0) s FROM invoices WHERE status='Paid' AND strftime('%Y-%m', paid_at)=strftime('%Y-%m','now','localtime')").get() as { s: number }).s;
  const unpaid = (db.prepare("SELECT COALESCE(SUM(amount),0) s FROM invoices WHERE status='Unpaid'").get() as { s: number }).s;
  const conversion = totalLeads ? Math.round((booked / totalLeads) * 100) : 0;

  const dueFollowUps = db
    .prepare(
      `SELECT * FROM leads WHERE next_follow_up IS NOT NULL AND next_follow_up <= datetime('now','localtime')
       AND status NOT IN ('Lost','Booked','Completed','Invoiced') ORDER BY score DESC`
    )
    .all() as Lead[];

  const recent = db.prepare("SELECT * FROM leads ORDER BY id DESC LIMIT 6").all() as Lead[];

  const bySource = db
    .prepare("SELECT source, COUNT(*) c FROM leads GROUP BY source ORDER BY c DESC")
    .all() as { source: string; c: number }[];

  return (
    <main>
      <h1>Dashboard</h1>
      <p className="sub">Enquiry → follow-up → booking → invoice, sab ek jagah.</p>

      {dueFollowUps.length > 0 && (
        <div className="alert">
          ⏰ {dueFollowUps.length} follow-up{dueFollowUps.length > 1 ? "s" : ""} due — in leads ko aaj contact karna hai.
        </div>
      )}

      <div className="grid stats">
        <div className="card"><div className="label">Total leads</div><div className="value">{totalLeads}</div></div>
        <div className="card"><div className="label">Conversion</div><div className="value">{conversion}%</div><div className="hint">{booked} booked of {totalLeads}</div></div>
        <div className="card"><div className="label">Revenue today</div><div className="value">₹{revenueToday.toLocaleString("en-IN")}</div></div>
        <div className="card"><div className="label">Revenue this month</div><div className="value">₹{revenueMonth.toLocaleString("en-IN")}</div><div className="hint">₹{unpaid.toLocaleString("en-IN")} pending collection</div></div>
      </div>

      <h2>Follow-ups due now</h2>
      {dueFollowUps.length === 0 ? (
        <p className="sub">Koi pending follow-up nahi. 🎉</p>
      ) : (
        <table>
          <thead><tr><th>Lead</th><th>Interested in</th><th>Score</th><th>Due since</th><th></th></tr></thead>
          <tbody>
            {dueFollowUps.map((l) => (
              <tr key={l.id}>
                <td><Link href={`/leads/${l.id}`}><strong>{l.name}</strong></Link><div className="sub-line">{l.phone || "no phone"} · {l.source}</div></td>
                <td>{l.service_interest || "—"}</td>
                <td><span className={`badge ${tier(l.score).toLowerCase()}`}>{tier(l.score)} · {l.score}</span></td>
                <td>{l.next_follow_up}</td>
                <td>
                  <form className="inline" action={markContacted}>
                    <input type="hidden" name="lead_id" value={l.id} />
                    <button>Followed up ✓</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Leads by source</h2>
      <div className="grid stats">
        {bySource.length === 0 && <p className="sub">Abhi koi lead nahi — pehli enquiry add karo.</p>}
        {bySource.map((s) => (
          <div className="card" key={s.source}><div className="label">{s.source}</div><div className="value">{s.c}</div></div>
        ))}
      </div>

      <h2>Recent leads</h2>
      {recent.length === 0 ? (
        <p className="sub"><Link className="btn primary" href="/leads">+ Add first lead</Link></p>
      ) : (
        <table>
          <thead><tr><th>Lead</th><th>Source</th><th>Status</th><th>Score</th><th>Created</th></tr></thead>
          <tbody>
            {recent.map((l) => (
              <tr key={l.id}>
                <td><Link href={`/leads/${l.id}`}><strong>{l.name}</strong></Link></td>
                <td>{l.source}</td>
                <td><span className={`badge ${l.status === "Lost" ? "grey" : l.status === "New" ? "cold" : "green"}`}>{l.status}</span></td>
                <td><span className={`badge ${tier(l.score).toLowerCase()}`}>{l.score}</span></td>
                <td>{l.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
