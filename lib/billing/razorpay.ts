import crypto from "crypto";

const API = "https://api.razorpay.com/v1";

export function paymentsEnabled(): boolean {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

function creds() {
  const id = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!id || !secret) throw new Error("Payments are not configured yet.");
  return { id, secret };
}

export function razorpayKeyId(): string {
  return creds().id;
}

/** Minimal Razorpay REST helper (no SDK needed). */
export async function rzp(
  path: string,
  method: "GET" | "POST",
  body?: unknown
): Promise<any> {
  const { id, secret } = creds();
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error?.description ?? `Razorpay error ${res.status}`);
  }
  return json;
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

/** Verifies the signature Checkout returns after a successful subscription payment. */
export function verifyPaymentSignature(
  paymentId: string,
  subscriptionId: string,
  signature: string
): boolean {
  const { secret } = creds();
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${paymentId}|${subscriptionId}`)
    .digest("hex");
  return safeEqual(expected, signature);
}

/** Verifies the X-Razorpay-Signature header on webhook requests. */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  webhookSecret: string
): boolean {
  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");
  return safeEqual(expected, signature);
}
