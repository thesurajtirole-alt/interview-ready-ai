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
  keywords: [
    "AI interview coach",
    "AI mock interview",
    "interview preparation",
    "interview practice",
    "personalized interview preparation",
    "AI interview training",
    "mock interview practice",
    "job interview simulator",
  ],
  openGraph: {
    title: "InterviewReady AI — Your interview isn't a test. It's a skill you can train.",
    description:
      "An AI interview coach that researches your company, role, and panel, runs a realistic mock interview, and builds a personalized training plan.",
    type: "website",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "name": "InterviewReady AI",
      "url": "https://interview-ready-ai-sooty.vercel.app",
      "description":
        "An AI interview coach that researches your company, role, and panel, runs a realistic mock interview, and builds a personalized training plan.",
    },
    {
      "@type": "SoftwareApplication",
      "name": "InterviewReady AI",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "description":
        "AI interview preparation platform: company and panel research, realistic mock interviews with voice and video, evidence-based feedback, personalized training, and readiness tracking.",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
      },
    },
    {
      "@type": "WebSite",
      "name": "InterviewReady AI",
      "url": "https://interview-ready-ai-sooty.vercel.app",
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={fraunces.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
