import db, { type Service } from "@/lib/db";
import { createLead } from "@/lib/actions";
import { waNumber } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

const AD_SOURCES = ["facebook", "fb", "instagram", "ig", "meta"];

// Public landing page that Meta/Instagram ads link to, e.g.
//   /enquiry?utm_source=instagram&utm_campaign=diwali-facial
// Every submission lands in the CRM as a scored lead tagged with its campaign.
export default async function EnquiryPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; utm_source?: string; utm_campaign?: string }>;
}) {
  const { sent, utm_source = "", utm_campaign = "" } = await searchParams;
  const source = AD_SOURCES.includes(utm_source.toLowerCase()) ? "Meta Ad" : "Website";
  const services = db.prepare("SELECT * FROM services ORDER BY category, price").all() as Service[];
  const salonWa = waNumber(process.env.SALON_WHATSAPP ?? "");

  return (
    <main>
      <h1>Book your look at Tropical Salon</h1>
      <p className="sub">Pant Nagar, Ghatkopar East. Tell us what you want and we&apos;ll WhatsApp you a slot.</p>

      {sent === "1" ? (
        <div className="success">
          Thanks! We got your enquiry and will message you on WhatsApp shortly.
          {salonWa && (
            <p style={{ marginBottom: 0 }}>
              <a className="btn primary" href={`https://wa.me/${salonWa}`} target="_blank" rel="noopener noreferrer">
                Chat with us now on WhatsApp
              </a>
            </p>
          )}
        </div>
      ) : (
        <form className="panel" action={createLead}>
          <input type="hidden" name="from_public" value="1" />
          <input type="hidden" name="source" value={source} />
          <input type="hidden" name="campaign" value={utm_campaign} />
          <div className="row">
            <label className="field">Your name<input type="text" name="name" required placeholder="Your name" /></label>
            <label className="field">WhatsApp number<input type="tel" name="phone" required placeholder="98xxxxxxxx" /></label>
          </div>
          <div className="row">
            <label className="field">Which service?
              <select name="service_interest">
                <option value="">Not sure yet</option>
                {services.map((s) => (
                  <option key={s.id} value={s.name}>{s.name} — ₹{s.price.toLocaleString("en-IN")}</option>
                ))}
              </select>
            </label>
            <label className="field">When would you like to come?
              <select name="when" defaultValue="This week">
                <option>This week</option>
                <option>Next week</option>
                <option>Just checking prices</option>
              </select>
            </label>
          </div>
          <label className="check"><input type="checkbox" name="asked_price" /> Send me the full price list</label>
          <label className="field">Anything else?<textarea name="notes" rows={2} placeholder="Occasion, preferred time…" /></label>
          <div><button className="primary">Get my slot</button></div>
        </form>
      )}
    </main>
  );
}
