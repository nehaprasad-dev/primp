import Link from "next/link";
import db from "@/lib/db";
import { cancelBooking, completeBooking } from "@/lib/actions";

export const dynamic = "force-dynamic";

type Row = {
  id: number; scheduled_at: string; status: string;
  lead_id: number; lead_name: string; phone: string;
  service_name: string; price: number;
};

export default function BookingsPage() {
  const rows = db
    .prepare(
      `SELECT b.id, b.scheduled_at, b.status, l.id AS lead_id, l.name AS lead_name, l.phone,
              s.name AS service_name, s.price
       FROM bookings b JOIN leads l ON l.id = b.lead_id JOIN services s ON s.id = b.service_id
       ORDER BY b.status = 'Scheduled' DESC, b.scheduled_at ASC`
    )
    .all() as Row[];

  return (
    <main>
      <h1>Bookings</h1>
      <p className="sub">Service complete karte hi invoice apne aap ban jaata hai.</p>
      {rows.length === 0 ? (
        <p className="sub">Koi booking nahi. Lead page se booking create karo.</p>
      ) : (
        <table>
          <thead><tr><th>Customer</th><th>Service</th><th>When</th><th>Amount</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id}>
                <td><Link href={`/leads/${b.lead_id}`}><strong>{b.lead_name}</strong></Link><div className="sub-line">{b.phone || "no phone"}</div></td>
                <td>{b.service_name}</td>
                <td>{b.scheduled_at}</td>
                <td>₹{b.price.toLocaleString("en-IN")}</td>
                <td><span className={`badge ${b.status === "Completed" ? "green" : b.status === "Cancelled" ? "grey" : "warm"}`}>{b.status}</span></td>
                <td>
                  {b.status === "Scheduled" && (
                    <>
                      <form className="inline" action={completeBooking}>
                        <input type="hidden" name="booking_id" value={b.id} />
                        <button className="primary">Complete → invoice</button>
                      </form>{" "}
                      <form className="inline" action={cancelBooking}>
                        <input type="hidden" name="booking_id" value={b.id} />
                        <button>Cancel</button>
                      </form>
                    </>
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
