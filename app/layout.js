import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "PGGY — PG Hostel Management Platform",
  description:
    "Manage your PG tenants, automate rent collection, and send WhatsApp reminders. Built for Indian PG & hostel owners.",
  keywords: ["PG management", "hostel management", "rent reminder", "WhatsApp", "tenant management"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} h-full w-full`}>
      <body className="min-h-full w-full flex flex-col font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
