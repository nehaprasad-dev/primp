import Link from "next/link";
import type { Branch } from "@/lib/db";
import { getBranches, salonName } from "@/lib/salon";
import { saveBranch, saveSalonName } from "@/lib/actions";

export const dynamic = "force-dynamic";

function BranchForm({ b }: { b?: Branch }) {
  return (
    <form className="panel" action={saveBranch} style={{ marginBottom: 12 }}>
      {b && <input type="hidden" name="branch_id" value={b.id} />}
      <strong>{b ? b.name : "+ Add a branch"}</strong>
      <div className="row">
        <label className="field">Branch name<input type="text" name="name" required defaultValue={b?.name} placeholder="e.g. Bandra West" /></label>
        <label className="field">Area<input type="text" name="area" defaultValue={b?.area} placeholder="e.g. Bandra West, Mumbai" /></label>
      </div>
      <label className="field">Full address (shown on invoices and the enquiry page)
        <input type="text" name="address" defaultValue={b?.address} placeholder="Shop / floor, building, road, landmark, Mumbai 4000xx" />
      </label>
      <div className="row">
        <label className="field">Branch WhatsApp<input type="tel" name="whatsapp" defaultValue={b?.whatsapp} placeholder="98xxxxxxxx" /></label>
        <label className="field">Opening hours<input type="text" name="hours" defaultValue={b?.hours} placeholder="e.g. 10am-8pm, all days" /></label>
      </div>
      <label className="field">Google Maps link (https only)
        <input type="text" name="maps" defaultValue={b?.maps} placeholder="https://maps.app.goo.gl/..." />
      </label>
      {b && (
        <label className="check"><input type="checkbox" name="active" defaultChecked={b.active === 1} /> Active (shown on the enquiry form)</label>
      )}
      <div><button className={b ? "" : "primary"}>{b ? "Save branch" : "Add branch"}</button></div>
    </form>
  );
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const branches = getBranches(true);
  const missing = branches.filter((b) => b.active && (!b.address || !b.whatsapp));

  return (
    <main>
      <h1>Salon setup</h1>
      <p className="sub">
        Ye details enquiry page, WhatsApp messages aur invoices pe apne aap dikhti hain.
        Prices <Link href="/services" style={{ textDecoration: "underline" }}>Services</Link> page pe hain.
      </p>

      {saved === "1" && <div className="success">Saved.</div>}
      {missing.length > 0 && (
        <div className="alert">
          {missing.map((b) => b.name).join(", ")}: address ya WhatsApp abhi khaali hai. Salon se confirm karke bharo.
        </div>
      )}

      <form className="panel" action={saveSalonName}>
        <div className="row">
          <label className="field">Salon / brand name
            <input type="text" name="salon_name" required defaultValue={salonName()} />
          </label>
          <div style={{ alignSelf: "end" }}><button>Save name</button></div>
        </div>
      </form>

      <h2>Branches</h2>
      {branches.map((b) => <BranchForm key={b.id} b={b} />)}
      <BranchForm />
    </main>
  );
}
