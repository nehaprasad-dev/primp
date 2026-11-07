// Starting data for a fresh database: Florian Hurel Hair Couture & Spa, Mumbai.
// Service names and durations are from florianhurelhaircouture.com (Nov 2026), a curated subset.
// The website publishes no prices or branch addresses, so those start empty:
// enter them on /services and /settings once the salon confirms them.

export const SALON_NAME = "Florian Hurel Hair Couture & Spa";

export const BRANCHES: { name: string; area: string }[] = [
  { name: "Bandra West", area: "Bandra West, Mumbai" },
  { name: "Waterfield Road", area: "Waterfield Road, Bandra West, Mumbai" },
  { name: "Walkeshwar", area: "Walkeshwar, Mumbai" },
];

// [name, category, duration, high value]
export const SERVICES: [string, string, string, boolean][] = [
  ["Women's Cut and Styling", "Hair", "", false],
  ["Men's Cut and Styling", "Hair", "", false],
  ["Blast Dry", "Hair", "", false],
  ["Party Hair Do", "Hair", "", false],
  ["Evening Hair Do", "Hair", "", false],
  ["Bridal Hair Do", "Hair", "", true],
  ["Global Hair Colour", "Hair Colour", "", true],
  ["Root Colour", "Hair Colour", "", false],
  ["Balayage", "Hair Colour", "", true],
  ["Highlights", "Hair Colour", "", true],
  ["Hair Colour Transformation", "Hair Colour", "", true],
  ["Advanced Nano Hydration Treatment", "Hair Care", "45 min", false],
  ["Signature Revive & Restore Hair Spa", "Hair Care", "45 min", false],
  ["VIP Advanced Repair & Strength Ritual", "Hair Care", "60 min", true],
  ["Peptide Hair Repair Treatment", "Hair Care", "60 min", true],
  ["Korean Scalp Treatment: Hair Fall", "Korean Scalp", "90 min", true],
  ["Korean Scalp Treatment: Dandruff", "Korean Scalp", "90 min", true],
  ["Korean Scalp Treatment: Dry Scalp", "Korean Scalp", "90 min", true],
  ["Korean Scalp Treatment: Oily Scalp", "Korean Scalp", "90 min", true],
  ["AI-Enhanced Purity Ritual", "Skin", "30 min", false],
  ["AI-Enhanced HydraFacial", "Skin", "45-50 min", true],
  ["AI-Enhanced Radiance Antiox Treatment", "Skin", "75 min", true],
  ["AI-Enhanced Multi Peptide Better Ageing Treatment", "Skin", "75 min", true],
  ["Face Gym: Sculpting", "Skin", "45 min", false],
  ["Swedish Massage", "Spa", "60 min", false],
  ["Deep Tissue Massage", "Spa", "60 min", false],
  ["Lymphatic Drainage Massage", "Spa", "90 min", true],
  ["Hot Stone Massage", "Spa", "90 min", true],
  ["Couple Body Therapy", "Spa", "60 min", true],
  ["Classic Manicure", "Nails", "", false],
  ["Spa Manicure", "Nails", "", false],
  ["Classic Pedicure", "Nails", "", false],
  ["Spa Pedicure", "Nails", "", false],
  ["Gel Polish Application", "Nails", "", false],
  ["Gel Nails Extension", "Nails", "", true],
  ["Acrylic Nails Extension", "Nails", "", true],
];
