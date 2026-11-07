import crypto from "crypto";
import { insertLead } from "@/lib/leads";
import { getBranches } from "@/lib/salon";

// Meta Lead Ads webhook. Leads submitted on Facebook/Instagram instant forms
// arrive here and are inserted as scored "Meta Ad" leads.
// Env: META_VERIFY_TOKEN (any string you choose), META_APP_SECRET, META_PAGE_TOKEN.

export const runtime = "nodejs";

const GRAPH = "https://graph.facebook.com/v21.0";

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const expected = process.env.META_VERIFY_TOKEN;
  if (expected && p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === expected) {
    return new Response(p.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

function validSignature(raw: string, header: string | null, secret: string) {
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const got = header ?? "";
  return got.length === expected.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

type LeadgenChange = { field?: string; value?: { leadgen_id?: string } };
type FieldData = { name: string; values?: string[] };

export async function POST(req: Request) {
  const secret = process.env.META_APP_SECRET;
  const token = process.env.META_PAGE_TOKEN;
  if (!secret || !token) return new Response("Meta webhook not configured", { status: 503 });

  const raw = await req.text();
  if (!validSignature(raw, req.headers.get("x-hub-signature-256"), secret)) {
    return new Response("Invalid signature", { status: 401 });
  }

  let body: { entry?: { changes?: LeadgenChange[] }[] };
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  let created = 0;
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const leadgenId = change.field === "leadgen" ? change.value?.leadgen_id : undefined;
      if (!leadgenId) continue;

      const res = await fetch(
        `${GRAPH}/${leadgenId}?fields=field_data,campaign_name&access_token=${encodeURIComponent(token)}`
      );
      if (!res.ok) {
        console.error(`Meta lead ${leadgenId} fetch failed: ${res.status} ${await res.text()}`);
        continue;
      }
      const lead = (await res.json()) as { field_data?: FieldData[]; campaign_name?: string };
      const f = Object.fromEntries((lead.field_data ?? []).map((d) => [d.name, d.values?.[0] ?? ""]));

      const name = f.full_name || [f.first_name, f.last_name].filter(Boolean).join(" ") || "Meta lead";
      const when = f.preferred_date || f.when || "";
      const branchAnswer = (f.branch || f.salon || "").toLowerCase().trim();
      const branch = branchAnswer
        ? getBranches().find((b) => b.name.toLowerCase() === branchAnswer || branchAnswer.includes(b.name.toLowerCase()))
        : undefined;
      const id = insertLead({
        name,
        phone: f.phone_number || f.phone || "",
        source: "Meta Ad",
        service_interest: f.service || f.which_service || "",
        asked_price: false,
        asked_date: Boolean(when) && !/price|explor/i.test(when),
        notes: when ? `Preferred: ${when}` : "",
        campaign: lead.campaign_name ?? "",
        external_id: `meta:${leadgenId}`,
        branch_id: branch?.id ?? null,
      });
      if (id) created++;
    }
  }
  return Response.json({ ok: true, created });
}
