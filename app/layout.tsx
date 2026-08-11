import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
