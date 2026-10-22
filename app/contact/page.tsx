import type { Metadata } from "next";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "Contact — Truepanel",
  description: "How to reach the Truepanel team.",
};

const CONTACT_EMAIL = "thesurajtirole@gmail.com";
// Fill these in if your payment provider asks for them; empty values are hidden.
const PHONE = "";
const ADDRESS = "";

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-6 py-14">
        <h1 className="font-display text-3xl font-medium">Contact us</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Questions, problems with your account, billing or refunds — we are
          happy to help.
        </p>

        <dl className="mt-8 space-y-6 text-sm">
          <div>
            <dt className="font-medium">Email</dt>
            <dd className="mt-1 text-muted-foreground">
              <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
                {CONTACT_EMAIL}
              </a>
              <br />
              We reply within 2 business days.
            </dd>
          </div>
          {PHONE && (
            <div>
              <dt className="font-medium">Phone</dt>
              <dd className="mt-1 text-muted-foreground">{PHONE}</dd>
            </div>
          )}
          {ADDRESS && (
            <div>
              <dt className="font-medium">Address</dt>
              <dd className="mt-1 whitespace-pre-line text-muted-foreground">
                {ADDRESS}
              </dd>
            </div>
          )}
          <div>
            <dt className="font-medium">Your data</dt>
            <dd className="mt-1 text-muted-foreground">
              You can delete your account and data yourself in{" "}
              <a href="/settings" className="underline">
                Settings
              </a>
              . See our{" "}
              <a href="/privacy" className="underline">
                Privacy Policy
              </a>{" "}
              and{" "}
              <a href="/refund-policy" className="underline">
                Refund Policy
              </a>
              .
            </dd>
          </div>
        </dl>
      </main>
    </>
  );
}
