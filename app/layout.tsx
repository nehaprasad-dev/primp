import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Primp · Tropical Salon",
  description: "Enquiry-to-invoice CRM for Tropical Salon, Pant Nagar, Ghatkopar East",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <nav className="topbar">
            <Link href="/" className="brand">
              Primp<span>.</span>
              <small>Tropical Salon · Ghatkopar East</small>
            </Link>
            <Link className="link" href="/">Dashboard</Link>
            <Link className="link" href="/leads">Leads</Link>
            <Link className="link" href="/bookings">Bookings</Link>
            <Link className="link" href="/invoices">Invoices</Link>
            <Link className="link" href="/enquiry">Enquiry form ↗</Link>
          </nav>
          {children}
        </div>
      </body>
    </html>
  );
}
