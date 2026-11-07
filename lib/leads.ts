import db from "./db";
import { getBranch } from "./salon";
import { isHighValueText, scoreLead, tier } from "./scoring";

export type NewLead = {
  name: string;
  phone: string;
  source: string;
  service_interest: string;
  asked_price: boolean;
  asked_date: boolean;
  notes: string;
  campaign?: string;
  external_id?: string;
  branch_id?: number | null;
};

// Speed to lead: hot enquiries are due immediately, warm within 3 hours, cold next day.
const FOLLOW_UP_DELAY = { Hot: "+0 minutes", Warm: "+3 hours", Cold: "+1 day" } as const;
const FOLLOW_UP_LABEL = { Hot: "now", Warm: "in 3 hours", Cold: "tomorrow" } as const;

function isHighValue(serviceInterest: string): boolean {
  if (!serviceInterest.trim()) return false;
  const svc = db.prepare("SELECT high_value FROM services WHERE name = ?").get(serviceInterest) as
    | { high_value: number }
    | undefined;
  return svc ? svc.high_value === 1 : isHighValueText(serviceInterest);
}

/** Inserts a scored lead. Returns the new id, or null if external_id was already imported. */
export function insertLead(l: NewLead): number | null {
  if (l.external_id && db.prepare("SELECT 1 FROM leads WHERE external_id = ?").get(l.external_id)) {
    return null;
  }
  const branch = getBranch(l.branch_id);
  const score = scoreLead({ ...l, high_value: isHighValue(l.service_interest) });
  const t = tier(score);
  const info = db
    .prepare(
      `INSERT INTO leads (name, phone, source, service_interest, asked_price, asked_date, notes, score,
                          campaign, external_id, branch_id, next_follow_up)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now','localtime', ?))`
    )
    .run(
      l.name, l.phone, l.source, l.service_interest, l.asked_price ? 1 : 0, l.asked_date ? 1 : 0,
      l.notes, score, l.campaign ?? "", l.external_id ?? null, branch?.id ?? null, FOLLOW_UP_DELAY[t]
    );
  const id = Number(info.lastInsertRowid);
  db.prepare("INSERT INTO activities (lead_id, kind, body) VALUES (?, 'system', ?)").run(
    id,
    `Lead captured from ${l.source}${l.campaign ? ` (campaign: ${l.campaign})` : ""}` +
      `${branch ? ` for ${branch.name}` : ""}. Auto-scored ${score}/100 (${t}). Follow-up due ${FOLLOW_UP_LABEL[t]}.`
  );
  return id;
}
