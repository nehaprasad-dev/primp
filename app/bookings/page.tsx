import Link from "next/link";
import db, { priceLabel } from "@/lib/db";
import { cancelBooking, completeBooking } from "@/lib/actions";
import { bookingMessage, waLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

type Row = {
  id: number; scheduled_at: string; status: string; branch_id: number | null; branch_name: string | null;
  lead_id: number; lead_name: string; phone: string;
  service_name: string; price: number | null; invoice_amount: number | null;
};

export default function BookingsPage() {
  const rows = db
    .prepare(
      `SELECT b.id, b.scheduled_at, b.status, b.branch_id, br.name AS branch_name,
              l.id AS lead_id, l.name AS lead_name, l.phone, s.name AS service_name, s.price,
              (SELECT amount FROM invoices i WHERE i.booking_id = b.id) AS invoice_amount
       FROM bookings b
       JOIN leads l ON l.id = b.lead_id
       JOIN services s ON s.id = b.service_id
       LEFT JOIN branches br ON br.id = b.branch_id
       ORDER BY b.status = 'Scheduled' DESC, b.scheduled_at ASC`
    )
    .all() as Row[];

  return (
    <main>
      <h1>Bookings</h1>
      <p className="sub">Service ke baad final amount confirm karo. Invoice apne aap ban jaata hai.</p>
      {rows.length === 0 ? (
        <p className="sub">Koi booking nahi. Lead page se booking create karo.</p>
      ) : (
        <table>
          <thead><tr><th>Customer</th><th>Service</th><th>Branch</th><th>When</th><th>Status</th><th>Checkout</th></tr></thead>
          <tbody>
            {rows.map((b) => {
              const confirm = b.status === "Scheduled"
                ? waLink(b.phone, bookingMessage(b.lead_name, b.service_name, b.scheduled_at, b.branch_id))
                : null;
              return (
                <tr key={b.id}>
                  <td><Link href={`/leads/${b.lead_id}`}><strong>{b.lead_name}</strong></Link><div className="sub-line">{b.phone || "no phone"}</div></td>
                  <td>{b.service_name}<div className="sub-line">Menu: {priceLabel(b.price)}</div></td>
                  <td>{b.branch_name ?? "—"}</td>
                  <td>{b.scheduled_at}</td>
                  <td><span className={`badge ${b.status === "Completed" ? "green" : b.status === "Cancelled" ? "grey" : "warm"}`}>{b.status}</span></td>
                  <td>
                    {b.status === "Scheduled" ? (
                      <>
                        <form className="inline" action={completeBooking} style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                          <input type="hidden" name="booking_id" value={b.id} />
                          <input type="text" inputMode="numeric" name="amount" required defaultValue={b.price ?? ""} placeholder="₹ amount" style={{ width: 100 }} aria-label="Final amount in rupees" />
                          <button className="primary">Complete → invoice</button>
                        </form>{" "}
                        {confirm && <a className="btn" href={confirm} target="_blank" rel="noopener noreferrer">Confirm on WhatsApp</a>}{" "}
                        <form className="inline" action={cancelBooking}>
                          <input type="hidden" name="booking_id" value={b.id} />
                          <button>Cancel</button>
                        </form>
                      </>
                    ) : b.invoice_amount != null ? (
                      <span>{priceLabel(b.invoice_amount)}</span>
                    ) : null}
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
