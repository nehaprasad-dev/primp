import type { Metadata } from "next";
import Link from "next/link";
import { salonName } from "@/lib/salon";
import "./globals.css";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return {
    title: `Primp · ${salonName()}`,
    description: "Enquiry-to-invoice CRM for Mumbai salons",
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <nav className="topbar">
            <Link href="/" className="brand">
              Primp<span>.</span>
              <small>{salonName()}</small>
            </Link>
            <Link className="link" href="/">Dashboard</Link>
            <Link className="link" href="/leads">Leads</Link>
            <Link className="link" href="/bookings">Bookings</Link>
            <Link className="link" href="/invoices">Invoices</Link>
            <Link className="link" href="/services">Services</Link>
            <Link className="link" href="/settings">Salon setup</Link>
            <Link className="link" href="/enquiry">Enquiry form ↗</Link>
          </nav>
          {children}
        </div>
      </body>
    </html>
  );
}
