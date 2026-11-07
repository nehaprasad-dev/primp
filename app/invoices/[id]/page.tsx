import { notFound } from "next/navigation";
import Link from "next/link";
import db, { priceLabel } from "@/lib/db";
import { getBranch, salonName } from "@/lib/salon";

export const dynamic = "force-dynamic";

type Row = {
  id: number; amount: number; status: string; created_at: string; paid_at: string | null;
  lead_name: string; phone: string; service_name: string; scheduled_at: string; branch_id: number | null;
};

export default async function InvoiceSheet({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inv = db
    .prepare(
      `SELECT i.id, i.amount, i.status, i.created_at, i.paid_at,
              l.name AS lead_name, l.phone, s.name AS service_name, b.scheduled_at, b.branch_id
       FROM invoices i
       JOIN leads l ON l.id = i.lead_id
       JOIN bookings b ON b.id = i.booking_id
       JOIN services s ON s.id = b.service_id
       WHERE i.id = ?`
    )
    .get(Number(id)) as Row | undefined;
  if (!inv) notFound();
  const branch = getBranch(inv.branch_id);

  return (
    <main>
      <p className="sub no-print"><Link href="/invoices">← All invoices</Link> · Print with Ctrl+P</p>
      <div className="invoice-sheet">
        <div className="head">
          <div>
            <strong style={{ fontSize: 20 }}>{salonName()}</strong>
            {branch && <div className="sub-line">{branch.name}</div>}
            {branch && (branch.address || branch.area) && <div className="sub-line">{branch.address || branch.area}</div>}
            {branch?.whatsapp && <div className="sub-line">WhatsApp: {branch.whatsapp}</div>}
          </div>
          <div style={{ textAlign: "right" }}>
            <strong>INV-{String(inv.id).padStart(4, "0")}</strong>
            <div className="sub-line">{inv.created_at}</div>
            <span className={`badge ${inv.status === "Paid" ? "green" : "warm"}`}>{inv.status}</span>
          </div>
        </div>
        <p><strong>Billed to:</strong> {inv.lead_name}{inv.phone ? ` · ${inv.phone}` : ""}</p>
        <table>
          <thead><tr><th>Service</th><th>Date</th><th style={{ textAlign: "right" }}>Amount</th></tr></thead>
          <tbody>
            <tr>
              <td>{inv.service_name}</td>
              <td>{inv.scheduled_at}</td>
              <td style={{ textAlign: "right" }}>{priceLabel(inv.amount)}</td>
            </tr>
            <tr>
              <td colSpan={2}><strong>Total</strong></td>
              <td style={{ textAlign: "right" }}><strong>{priceLabel(inv.amount)}</strong></td>
            </tr>
          </tbody>
        </table>
        {inv.paid_at && <p className="sub-line">Paid on {inv.paid_at}. Thank you!</p>}
      </div>
    </main>
  );
}
