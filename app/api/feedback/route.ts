import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  message: z.string().trim().min(1).max(2000),
  rating: z.number().int().min(1).max(5).nullable().optional(),
});

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please write a short message (up to 2000 characters)." },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("feedback").insert({
    user_id: user.id,
    message: parsed.data.message,
    rating: parsed.data.rating ?? null,
  });
  if (error) {
    return NextResponse.json({ error: "Could not send feedback" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
