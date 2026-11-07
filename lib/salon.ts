import db, { getSetting, type Branch } from "./db";

export function salonName(): string {
  return getSetting("salon_name") || "Your Salon";
}

export function getBranches(includeInactive = false): Branch[] {
  return db
    .prepare(`SELECT * FROM branches ${includeInactive ? "" : "WHERE active = 1"} ORDER BY id`)
    .all() as Branch[];
}

export function getBranch(id: number | null | undefined): Branch | undefined {
  if (!id) return undefined;
  return db.prepare("SELECT * FROM branches WHERE id = ?").get(id) as Branch | undefined;
}

/** How the salon introduces itself, e.g. "Florian Hurel Hair Couture & Spa, Bandra West". */
export function salonLabel(branchId?: number | null): string {
  const b = getBranch(branchId);
  return b ? `${salonName()}, ${b.name}` : salonName();
}
