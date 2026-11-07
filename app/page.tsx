import Link from "next/link";
import db, { getSetting, type Lead } from "@/lib/db";
import { tier } from "@/lib/scoring";
import { markContacted, setAdSpend, whatsappFollowUp } from "@/lib/actions";

export const dynamic = "force-dynamic";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const num = (sql: string) => (db.prepare(sql).get() as { n: number | null }).n ?? 0;

export default function Dashboard() {
  const totalLeads = num("SELECT COUNT(*) n FROM leads");
  const booked = num("SELECT COUNT(*) n FROM leads WHERE status IN ('Booked','Completed','Invoiced')");
  const revenueToday = num("SELECT SUM(amount) n FROM invoices WHERE status='Paid' AND date(paid_at)=date('now','localtime')");
  const revenueMonth = num("SELECT SUM(amount) n FROM invoices WHERE status='Paid' AND strftime('%Y-%m', paid_at)=strftime('%Y-%m','now','localtime')");
  const unpaid = num("SELECT SUM(amount) n FROM invoices WHERE status='Unpaid'");
  const conversion = totalLeads ? Math.round((booked / totalLeads) * 100) : 0;

  // Ad performance: Meta leads only
  const adSpend = Number(getSetting("ad_spend", "0"));
  const adLeads = num("SELECT COUNT(*) n FROM leads WHERE source='Meta Ad'");
  const adBooked = num("SELECT COUNT(*) n FROM leads WHERE source='Meta Ad' AND status IN ('Booked','Completed','Invoiced')");
  const adRevenue = num("SELECT SUM(i.amount) n FROM invoices i JOIN leads l ON l.id=i.lead_id WHERE l.source='Meta Ad' AND i.status='Paid'");
  const campaigns = db
    .prepare(
      `SELECT CASE WHEN campaign='' THEN '(no campaign tag)' ELSE campaign END AS name, COUNT(*) leads,
              SUM(status IN ('Booked','Completed','Invoiced')) booked
       FROM leads WHERE source='Meta Ad' GROUP BY name ORDER BY leads DESC`
    )
    .all() as { name: string; leads: number; booked: number }[];

  // Share of logged steps Primp did by itself (capture, scoring, scheduling, invoicing)
  const autoSteps = num("SELECT COUNT(*) n FROM activities WHERE kind='system'");
  const allSteps = num("SELECT COUNT(*) n FROM activities");
  const autoShare = allSteps ? Math.round((autoSteps / allSteps) * 100) : 0;

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
          {dueFollowUps.length} follow-up{dueFollowUps.length > 1 ? "s" : ""} due. Hot leads pehle contact karo.
        </div>
      )}

      <div className="grid stats">
        <div className="card"><div className="label">Total leads</div><div className="value">{totalLeads}</div></div>
        <div className="card"><div className="label">Conversion</div><div className="value">{conversion}%</div><div className="hint">{booked} booked of {totalLeads}</div></div>
        <div className="card"><div className="label">Revenue today</div><div className="value">{inr(revenueToday)}</div></div>
        <div className="card"><div className="label">Revenue this month</div><div className="value">{inr(revenueMonth)}</div><div className="hint">{inr(unpaid)} pending collection</div></div>
        <div className="card"><div className="label">Automated steps</div><div className="value">{autoShare}%</div><div className="hint">{autoSteps} of {allSteps} logged steps done by Primp</div></div>
      </div>

      <h2>Follow-ups due now</h2>
      {dueFollowUps.length === 0 ? (
        <p className="sub">Koi pending follow-up nahi.</p>
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
                  {l.phone && (
                    <form className="inline" action={whatsappFollowUp}>
                      <input type="hidden" name="lead_id" value={l.id} />
                      <button className="primary">WhatsApp</button>
                    </form>
                  )}{" "}
                  <form className="inline" action={markContacted}>
                    <input type="hidden" name="lead_id" value={l.id} />
                    <button>Called ✓</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Meta ad performance</h2>
      <div className="grid stats">
        <div className="card"><div className="label">Ad spend</div><div className="value">{inr(adSpend)}</div></div>
        <div className="card"><div className="label">Ad leads</div><div className="value">{adLeads}</div></div>
        <div className="card"><div className="label">Cost per lead</div><div className="value">{adLeads && adSpend ? inr(adSpend / adLeads) : "—"}</div></div>
        <div className="card"><div className="label">Cost per booking</div><div className="value">{adBooked && adSpend ? inr(adSpend / adBooked) : "—"}</div><div className="hint">{adBooked} booked from ads</div></div>
        <div className="card"><div className="label">Return on ad spend</div><div className="value">{adSpend ? `${(adRevenue / adSpend).toFixed(1)}x` : "—"}</div><div className="hint">{inr(adRevenue)} paid revenue from ads</div></div>
      </div>
      <form className="panel" action={setAdSpend} style={{ marginTop: 12 }}>
        <div className="row">
          <label className="field">Total ad spend so far (₹, from Meta Ads Manager)
            <input type="text" inputMode="numeric" name="ad_spend" defaultValue={adSpend || ""} placeholder="e.g. 2500" />
          </label>
          <div style={{ alignSelf: "end" }}><button>Update spend</button></div>
        </div>
      </form>
      {campaigns.length > 0 && (
        <table style={{ marginTop: 12 }}>
          <thead><tr><th>Campaign</th><th>Leads</th><th>Booked</th></tr></thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.name}><td>{c.name}</td><td>{c.leads}</td><td>{c.booked}</td></tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Leads by source</h2>
      <div className="grid stats">
        {bySource.length === 0 && <p className="sub">Abhi koi lead nahi. Pehli enquiry add karo.</p>}
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
