import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rzp, verifyPaymentSignature } from "@/lib/billing/razorpay";
import { activatePlan } from "@/lib/billing/apply";

const schema = z.object({
  razorpay_payment_id: z.string().min(1),
  razorpay_subscription_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const p = parsed.data;

  if (!verifyPaymentSignature(p.razorpay_payment_id, p.razorpay_subscription_id, p.razorpay_signature)) {
    return NextResponse.json({ error: "Payment could not be verified." }, { status: 400 });
  }

  try {
    const sub = await rzp(`/subscriptions/${p.razorpay_subscription_id}`, "GET");
    const notes = sub.notes ?? {};
    if (notes.user_id !== user.id || !notes.plan_id) {
      return NextResponse.json({ error: "This payment belongs to another account." }, { status: 403 });
    }
    if (!["authenticated", "active"].includes(sub.status)) {
      return NextResponse.json({ error: "Payment is not complete yet." }, { status: 409 });
    }

    await activatePlan(createAdminClient(), {
      userId: user.id,
      planId: notes.plan_id,
      razorpaySubscriptionId: sub.id,
      currentEnd: sub.current_end ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Could not confirm payment." }, { status: 502 });
  }
}
