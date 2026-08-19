import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";

export async function Header() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <a href={user ? "/dashboard" : "/"} className="font-display text-lg font-medium">
          InterviewReady <span className="text-primary">AI</span>
        </a>

        {user ? (
          <nav className="flex items-center gap-5 text-sm">
            <a href="/dashboard" className="text-muted-foreground hover:text-foreground">
              Dashboard
            </a>
            <a href="/training" className="text-muted-foreground hover:text-foreground">
              Training
            </a>
            <a href="/progress" className="text-muted-foreground hover:text-foreground">
              Progress
            </a>
            <a href="/profile" className="text-muted-foreground hover:text-foreground">
              Profile
            </a>
            <SignOutButton />
          </nav>
        ) : (
          <nav className="flex items-center gap-3 text-sm">
            <a href="/login" className="text-muted-foreground hover:text-foreground">
              Log in
            </a>
            <a
              href="/signup"
              className="rounded-lg bg-primary px-4 py-1.5 text-primary-foreground transition hover:opacity-90"
            >
              Sign up
            </a>
          </nav>
        )}
      </div>
    </header>
  );
}
