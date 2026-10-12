import { createClient } from "@/lib/supabase/server";

/**
 * Returns the signed-in user if their email is listed in ADMIN_EMAILS,
 * otherwise null. Use this at the top of every admin page and API route.
 */
export async function getAdminUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!user?.email || !allowed.includes(user.email.toLowerCase())) return null;
  return user;
}
