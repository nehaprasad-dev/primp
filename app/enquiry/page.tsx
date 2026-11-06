import db, { type Service } from "@/lib/db";
import { createLead } from "@/lib/actions";

export const dynamic = "force-dynamic";

// Public-facing enquiry form — the landing page Meta/Instagram ads point to.
// Every submission lands straight in the Primp CRM as a scored lead.
export default async function EnquiryPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;
  const services = db.prepare("SELECT * FROM services ORDER BY category, price").all() as Service[];

  return (
    <main>
      <h1>Book your look at Tropical Salon 💇‍♀️</h1>
      <p className="sub">Pant Nagar, Ghatkopar East · Tell us what you want, we&apos;ll WhatsApp you a slot.</p>

      {sent === "1" && (
        <div className="success">✅ Thanks! Humein aapki enquiry mil gayi — we&apos;ll reach out on WhatsApp shortly.</div>
      )}

      <form className="panel" action={createLead}>
        <input type="hidden" name="from_public" value="1" />
        <input type="hidden" name="source" value="Meta Ad" />
        <input type="hidden" name="asked_date" value="on" />
        <div className="row">
          <label className="field">Your name<input type="text" name="name" required placeholder="Your name" /></label>
          <label className="field">WhatsApp number<input type="tel" name="phone" required placeholder="98xxxxxxxx" /></label>
        </div>
        <label className="field">Which service?
          <select name="service_interest">
            <option value="">Not sure yet</option>
            {services.map((s) => (
              <option key={s.id} value={s.name}>{s.name} — ₹{s.price.toLocaleString("en-IN")}</option>
            ))}
          </select>
        </label>
        <label className="check"><input type="checkbox" name="asked_price" /> Send me the full price list</label>
        <label className="field">Anything else?<textarea name="notes" rows={2} placeholder="Preferred day/time, occasion…" /></label>
        <div><button className="primary">Get my slot →</button></div>
      </form>
    </main>
  );
}
