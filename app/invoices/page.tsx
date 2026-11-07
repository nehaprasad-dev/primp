import Link from "next/link";
import db, { priceLabel } from "@/lib/db";
import { markPaid } from "@/lib/actions";
import { invoiceMessage, waLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

type Row = {
  id: number; amount: number; status: string; created_at: string; paid_at: string | null;
  lead_id: number; lead_name: string; phone: string; service_name: string;
  branch_id: number | null; branch_name: string | null;
};

const invoiceNo = (id: number) => `INV-${String(id).padStart(4, "0")}`;

export default function InvoicesPage() {
  const rows = db
    .prepare(
      `SELECT i.id, i.amount, i.status, i.created_at, i.paid_at,
              l.id AS lead_id, l.name AS lead_name, l.phone, s.name AS service_name,
              b.branch_id, br.name AS branch_name
       FROM invoices i
       JOIN leads l ON l.id = i.lead_id
       JOIN bookings b ON b.id = i.booking_id
       JOIN services s ON s.id = b.service_id
       LEFT JOIN branches br ON br.id = b.branch_id
       ORDER BY i.status = 'Unpaid' DESC, i.id DESC`
    )
    .all() as Row[];

  const collected = rows.filter((r) => r.status === "Paid").reduce((a, r) => a + r.amount, 0);
  const pending = rows.filter((r) => r.status === "Unpaid").reduce((a, r) => a + r.amount, 0);

  return (
    <main>
      <h1>Invoices</h1>
      <p className="sub">Collected {priceLabel(collected)} · Pending {priceLabel(pending)}</p>
      {rows.length === 0 ? (
        <p className="sub">Koi invoice nahi abhi. Booking complete karne par invoice banta hai.</p>
      ) : (
        <table>
          <thead><tr><th>Invoice</th><th>Customer</th><th>Service</th><th>Branch</th><th>Amount</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map((i) => {
              const link = waLink(
                i.phone,
                invoiceMessage(i.lead_name, invoiceNo(i.id), i.service_name, i.amount, i.status === "Paid", i.branch_id)
              );
              return (
                <tr key={i.id}>
                  <td><Link href={`/invoices/${i.id}`}><strong>{invoiceNo(i.id)}</strong></Link><div className="sub-line">{i.created_at}</div></td>
                  <td><Link href={`/leads/${i.lead_id}`}>{i.lead_name}</Link></td>
                  <td>{i.service_name}</td>
                  <td>{i.branch_name ?? "—"}</td>
                  <td>{priceLabel(i.amount)}</td>
                  <td><span className={`badge ${i.status === "Paid" ? "green" : "warm"}`}>{i.status}{i.paid_at ? ` · ${i.paid_at}` : ""}</span></td>
                  <td>
                    {i.status === "Unpaid" && (
                      <form className="inline" action={markPaid}>
                        <input type="hidden" name="invoice_id" value={i.id} />
                        <button className="primary">Mark paid</button>
                      </form>
                    )}{" "}
                    {link && <a className="btn" href={link} target="_blank" rel="noopener noreferrer">Send on WhatsApp</a>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}
