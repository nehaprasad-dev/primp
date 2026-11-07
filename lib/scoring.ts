// Rule-based lead scoring: how likely is this enquiry to become a booking?
// Hot >= 70, Warm 40-69, Cold < 40.

// Fallback for free-text interests that don't match a service on the menu
// (e.g. typed by staff or sent by a Meta form). Menu services use their own high_value flag.
const HIGH_VALUE_WORDS = [
  "bridal", "makeup", "make-up", "color", "colour", "balayage", "highlights", "keratin",
  "smoothening", "botox", "hydrafacial", "scalp", "peptide", "extension",
];

export function isHighValueText(text: string): boolean {
  const t = text.toLowerCase();
  return HIGH_VALUE_WORDS.some((k) => t.includes(k));
}

export function scoreLead(input: {
  source: string;
  service_interest: string;
  asked_price: boolean;
  asked_date: boolean;
  phone: string;
  high_value: boolean;
}): number {
  let s = 0;
  const bySource: Record<string, number> = {
    "Walk-in": 25,
    Referral: 25,
    "Meta Ad": 20,
    WhatsApp: 15,
    Instagram: 10,
  };
  s += bySource[input.source] ?? 10;
  if (input.service_interest.trim()) s += 20; // knows what they want
  if (input.asked_price) s += 20;             // price question = purchase intent
  if (input.asked_date) s += 25;              // asking availability = ready to book
  if (input.phone.trim()) s += 10;            // reachable
  if (input.high_value) s += 15;
  return Math.min(s, 100);
}

export function tier(score: number): "Hot" | "Warm" | "Cold" {
  return score >= 70 ? "Hot" : score >= 40 ? "Warm" : "Cold";
}
