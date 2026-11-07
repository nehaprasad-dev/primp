import db, { type Service } from "@/lib/db";
import { addService, updateService } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default function ServicesPage() {
  const services = db.prepare("SELECT * FROM services ORDER BY category, id").all() as Service[];
  const unpriced = services.filter((s) => s.price === null).length;

  return (
    <main>
      <h1>Services &amp; prices</h1>
      <p className="sub">
        Price khaali chhodne pe enquiry page pe &quot;Price on request&quot; dikhega, aur booking complete karte waqt
        amount bharna hoga. High-value services ko lead score mein +15 milte hain. Price badalne se purane invoices nahi badalte.
      </p>
      {unpriced > 0 && (
        <div className="alert">{unpriced} services ka price abhi set nahi hai. Salon se confirm karke bharo.</div>
      )}

      <table>
        <thead><tr><th>Category</th><th>Service · Price (₹) · Duration · High value</th></tr></thead>
        <tbody>
          {services.map((s) => (
            <tr key={s.id}>
              <td>{s.category}</td>
              <td>
                <form action={updateService} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <input type="hidden" name="service_id" value={s.id} />
                  <input type="text" name="name" defaultValue={s.name} required style={{ flex: "3 1 200px" }} aria-label="Service name" />
                  <input type="text" inputMode="numeric" name="price" defaultValue={s.price ?? ""} placeholder="on request" style={{ flex: "1 1 90px" }} aria-label="Price in rupees" />
                  <input type="text" name="duration" defaultValue={s.duration} placeholder="duration" style={{ flex: "1 1 80px" }} aria-label="Duration" />
                  <label className="check"><input type="checkbox" name="high_value" defaultChecked={s.high_value === 1} /> High value</label>
                  <button>Save</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Add a service</h2>
      <form className="panel" action={addService}>
        <div className="row">
          <label className="field">Service name<input type="text" name="name" required placeholder="e.g. Keratin Treatment" /></label>
          <label className="field">Category<input type="text" name="category" placeholder="Hair, Skin, Spa, Nails…" /></label>
          <label className="field">Price (₹, blank = on request)<input type="text" inputMode="numeric" name="price" placeholder="e.g. 3500" /></label>
          <label className="field">Duration<input type="text" name="duration" placeholder="e.g. 60 min" /></label>
        </div>
        <label className="check"><input type="checkbox" name="high_value" /> High value</label>
        <div><button className="primary">Add service</button></div>
      </form>
    </main>
  );
}
