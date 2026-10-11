import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ confirmation: z.literal("DELETE") });

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
      { error: "Type DELETE to confirm" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Remove the user's uploaded resume files.
  const { data: files } = await admin.storage
    .from("resumes")
    .list(user.id, { limit: 1000 });
  if (files && files.length > 0) {
    await admin.storage
      .from("resumes")
      .remove(files.map((f) => `${user.id}/${f.name}`));
  }

  // Deleting the auth user cascades through every table (on delete cascade).
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json(
      { error: "Could not delete account. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
