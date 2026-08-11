import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "InterviewReady AI — Your interview isn't a test. It's a skill you can train.",
  description:
    "An AI interview coach that researches your company, role, and panel, runs a realistic mock interview, and builds a personalized training plan — with no shame, no judgment, just improvement.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={fraunces.variable}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
