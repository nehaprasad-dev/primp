// Click-to-chat links (wa.me) with pre-written messages. No WhatsApp Business API needed:
// staff tap the button, WhatsApp opens with the message ready, they press send.

const SALON = "Tropical Salon, Pant Nagar (Ghatkopar East)";

/** Normalises Indian numbers to the international format wa.me expects. */
export function waNumber(phone: string): string | null {
  const d = phone.replace(/\D/g, "");
  if (d.length === 10) return "91" + d;
  if (d.length === 11 && d.startsWith("0")) return "91" + d.slice(1);
  if (d.length >= 11) return d;
  return null;
}

export function waLink(phone: string, text: string): string | null {
  const n = waNumber(phone);
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : null;
}

const firstName = (name: string) => name.trim().split(/\s+/)[0] || "there";
const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export function followUpMessage(lead: { name: string; service_interest: string; status: string }, price?: number) {
  const hi = `Hi ${firstName(lead.name)}, this is ${SALON}.`;
  if (lead.status !== "New") {
    return `${hi} Just checking in. Are you still interested in ${lead.service_interest || "a visit"}? We can hold a slot for you this week.`;
  }
  if (lead.service_interest) {
    return `${hi} Thanks for asking about ${lead.service_interest}${price ? ` (${rupees(price)})` : ""}. We have slots open this week. Which day and time suit you? Reply and we'll book it.`;
  }
  return `${hi} Thanks for your enquiry! What would you like to book: hair, facial, makeup or something else? We'll send prices and open slots.`;
}

export function bookingMessage(name: string, service: string, when: string) {
  return `Hi ${firstName(name)}, your ${service} at ${SALON} is confirmed for ${when}. See you then! Reply here if you need to reschedule.`;
}

export function invoiceMessage(name: string, invoiceNo: string, service: string, amount: number, paid: boolean) {
  return `Hi ${firstName(name)}, thank you for visiting ${SALON}! Invoice ${invoiceNo}: ${service}, ${rupees(amount)}${paid ? " (paid)" : " (due)"}. See you again soon.`;
}
