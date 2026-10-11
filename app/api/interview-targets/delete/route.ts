import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ targetId: z.string().uuid() });

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
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { error } = await supabase
    .from("interview_targets")
    .delete()
    .eq("id", parsed.data.targetId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Could not remove" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
