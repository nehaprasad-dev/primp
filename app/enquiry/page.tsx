import db, { priceLabel, type Service } from "@/lib/db";
import { createLead } from "@/lib/actions";
import { waNumber } from "@/lib/whatsapp";
import { getBranch, getBranches, salonName } from "@/lib/salon";

export const dynamic = "force-dynamic";

const AD_SOURCES = ["facebook", "fb", "instagram", "ig", "meta"];

// Public landing page that Meta/Instagram ads link to, e.g.
//   /enquiry?utm_source=instagram&utm_campaign=hydrafacial-nov&branch=1
// Every submission lands in the CRM as a scored lead tagged with its campaign and branch.
export default async function EnquiryPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; utm_source?: string; utm_campaign?: string; branch?: string }>;
}) {
  const { sent, utm_source = "", utm_campaign = "", branch = "" } = await searchParams;
  const source = AD_SOURCES.includes(utm_source.toLowerCase()) ? "Meta Ad" : "Website";
  const services = db.prepare("SELECT * FROM services ORDER BY category, id").all() as Service[];
  const branches = getBranches();
  const preselected = getBranch(Number(branch));
  const name = salonName();

  return (
    <main>
      <h1>Book at {name}</h1>
      <p className="sub">Tell us what you&apos;d like and your nearest salon. We&apos;ll message you on WhatsApp with open slots.</p>

      {sent === "1" ? (
        <div className="success">
          Thank you! We have your enquiry and will message you on WhatsApp shortly.
          {branches.some((b) => waNumber(b.whatsapp)) && (
            <p style={{ marginBottom: 0 }}>
              {branches.filter((b) => waNumber(b.whatsapp)).map((b) => (
                <a key={b.id} className="btn primary" style={{ marginRight: 8 }} href={`https://wa.me/${waNumber(b.whatsapp)}`} target="_blank" rel="noopener noreferrer">
                  WhatsApp {b.name}
                </a>
              ))}
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
            {branches.length > 1 ? (
              <label className="field">Which salon?
                <select name="branch_id" defaultValue={preselected?.id ?? ""} required>
                  <option value="" disabled>Choose a salon</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </label>
            ) : (
              branches[0] && <input type="hidden" name="branch_id" value={branches[0].id} />
            )}
            <label className="field">Which service?
              <select name="service_interest">
                <option value="">Not sure yet</option>
                {services.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}{s.price !== null ? ` — ${priceLabel(s.price)}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">When would you like to come?
              <select name="when" defaultValue="This week">
                <option>This week</option>
                <option>Next week</option>
                <option>Just exploring</option>
              </select>
            </label>
          </div>
          <label className="check"><input type="checkbox" name="asked_price" /> Please send me prices</label>
          <label className="field">Anything else?<textarea name="notes" rows={2} placeholder="Occasion, preferred time, stylist…" /></label>
          <div><button className="primary">Get my slot</button></div>
        </form>
      )}

      {branches.some((b) => b.address || b.hours || b.maps) && (
        <>
          <h2>Our salons</h2>
          <div className="grid stats">
            {branches.map((b) => (
              <div className="card" key={b.id}>
                <div className="label">{b.name}</div>
                {b.address && <div style={{ marginTop: 4 }}>{b.address}</div>}
                {b.hours && <div className="hint">{b.hours}</div>}
                {b.maps && (
                  <a href={b.maps} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline", fontSize: 13 }}>Directions</a>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
