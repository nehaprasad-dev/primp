import Link from "next/link";
import db from "@/lib/db";
import { markPaid } from "@/lib/actions";

export const dynamic = "force-dynamic";

type Row = {
  id: number; amount: number; status: string; created_at: string; paid_at: string | null;
  lead_id: number; lead_name: string; service_name: string;
};

export default function InvoicesPage() {
  const rows = db
    .prepare(
      `SELECT i.id, i.amount, i.status, i.created_at, i.paid_at,
              l.id AS lead_id, l.name AS lead_name, s.name AS service_name
       FROM invoices i
       JOIN leads l ON l.id = i.lead_id
       JOIN bookings b ON b.id = i.booking_id
       JOIN services s ON s.id = b.service_id
       ORDER BY i.status = 'Unpaid' DESC, i.id DESC`
    )
    .all() as Row[];

  const collected = rows.filter((r) => r.status === "Paid").reduce((a, r) => a + r.amount, 0);
  const pending = rows.filter((r) => r.status === "Unpaid").reduce((a, r) => a + r.amount, 0);

  return (
    <main>
      <h1>Invoices</h1>
      <p className="sub">Collected ₹{collected.toLocaleString("en-IN")} · Pending ₹{pending.toLocaleString("en-IN")}</p>
      {rows.length === 0 ? (
        <p className="sub">Koi invoice nahi abhi — booking complete karne par invoice banta hai.</p>
      ) : (
        <table>
          <thead><tr><th>Invoice</th><th>Customer</th><th>Service</th><th>Amount</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map((i) => (
              <tr key={i.id}>
                <td><Link href={`/invoices/${i.id}`}><strong>INV-{String(i.id).padStart(4, "0")}</strong></Link><div className="sub-line">{i.created_at}</div></td>
                <td><Link href={`/leads/${i.lead_id}`}>{i.lead_name}</Link></td>
                <td>{i.service_name}</td>
                <td>₹{i.amount.toLocaleString("en-IN")}</td>
                <td><span className={`badge ${i.status === "Paid" ? "green" : "warm"}`}>{i.status}{i.paid_at ? ` · ${i.paid_at}` : ""}</span></td>
                <td>
                  {i.status === "Unpaid" && (
                    <form className="inline" action={markPaid}>
                      <input type="hidden" name="invoice_id" value={i.id} />
                      <button className="primary">Mark paid</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
