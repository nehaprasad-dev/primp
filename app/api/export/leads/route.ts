import db from "@/lib/db";
import { tier } from "@/lib/scoring";

// CSV of all leads, for importing into the erp.ai CRM or sharing numbers.
// Protected by the staff password (middleware) when PRIMP_PASSWORD is set.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = {
  id: number; name: string; phone: string; source: string; campaign: string; service_interest: string;
  asked_price: number; asked_date: number; score: number; status: string; created_at: string;
  next_follow_up: string | null; notes: string; paid_amount: number; branch_name: string | null;
};

function cell(v: string | number | null): string {
  const s = v === null ? "" : String(v);
  // Quote everything; neutralise spreadsheet formulas from customer-typed text.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function GET() {
  const rows = db
    .prepare(
      `SELECT l.*, b.name AS branch_name,
              COALESCE((SELECT SUM(amount) FROM invoices i WHERE i.lead_id = l.id AND i.status = 'Paid'), 0) AS paid_amount
       FROM leads l LEFT JOIN branches b ON b.id = l.branch_id ORDER BY l.id`
    )
    .all() as Row[];

  const header = [
    "id", "name", "phone", "source", "campaign", "branch", "service_interest", "asked_price", "asked_date",
    "score", "tier", "status", "created_at", "next_follow_up", "paid_amount_inr", "notes",
  ];
  const lines = rows.map((r) =>
    [
      r.id, r.name, r.phone, r.source, r.campaign, r.branch_name, r.service_interest, r.asked_price ? "yes" : "no",
      r.asked_date ? "yes" : "no", r.score, tier(r.score), r.status, r.created_at, r.next_follow_up,
      r.paid_amount, r.notes,
    ].map(cell).join(",")
  );
  const csv = "﻿" + [header.join(","), ...lines].join("\r\n") + "\r\n";
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="primp-leads-${date}.csv"`,
    },
  });
}
