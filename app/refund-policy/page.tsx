import type { Metadata } from "next";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "Refund and Cancellation Policy — Truepanel",
  description:
    "How cancellations, refunds and delivery work for Truepanel paid plans.",
};

const CONTACT_EMAIL = "thesurajtirole@gmail.com";
const UPDATED = "23 October 2026";
const REFUND_WINDOW_DAYS = 7;

export default function RefundPolicyPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-6 py-14">
        <h1 className="font-display text-3xl font-medium">
          Refund and Cancellation Policy
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated {UPDATED}
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-medium">Cancelling your plan</h2>
            <p className="mt-2 text-muted-foreground">
              You can cancel a paid plan at any time. Your plan stays active
              until the end of the period you have already paid for, and it
              will not renew after that. You will not be charged again once
              you cancel.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium">Refunds</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                If you are not satisfied with your first purchase of a paid
                plan, email us within {REFUND_WINDOW_DAYS} days of paying and
                we will refund it in full.
              </li>
              <li>
                Renewal payments are refundable within {REFUND_WINDOW_DAYS} days
                if you have not used the paid features since renewing.
              </li>
              <li>
                If you were charged twice or charged in error, we will refund
                the extra charge in full.
              </li>
              <li>
                Outside these cases, payments for a period that has already
                started are not refundable.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium">How refunds are paid</h2>
            <p className="mt-2 text-muted-foreground">
              Approved refunds go back to the original payment method (UPI,
              card or net banking). They are normally processed within 5 to 7
              business days of approval; your bank may take a few more days to
              show the credit.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium">Delivery</h2>
            <p className="mt-2 text-muted-foreground">
              Truepanel is a digital service. There is nothing to ship. Paid
              features are available in your account as soon as your payment is
              confirmed.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium">How to ask for a refund</h2>
            <p className="mt-2 text-muted-foreground">
              Email{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
                {CONTACT_EMAIL}
              </a>{" "}
              from the address on your account, with the date and amount of
              the payment. We reply within 2 business days.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
