import type { Metadata } from "next";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "Privacy Policy — Truepanel",
  description:
    "What Truepanel collects, which services process it, and how you can delete it.",
};

const CONTACT_EMAIL = "thesurajtirole@gmail.com";
const UPDATED = "12 October 2026";

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-6 py-14">
        <h1 className="font-display text-3xl font-medium">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated {UPDATED}
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-medium">What we collect</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Your email address and password (handled by Supabase Auth).</li>
              <li>
                Details you enter: company, role, job description, interview
                date, round and format, and the names or roles of panel members
                you choose to add.
              </li>
              <li>Your resume files and the text we extract from them.</li>
              <li>
                Your mock-interview answers, transcripts, reports, training
                attempts and readiness scores.
              </li>
              <li>
                Real-interview feedback and outcomes you choose to record.
              </li>
              <li>Profile, career preferences and skills you enter.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium">Camera and microphone</h2>
            <p className="mt-2 text-muted-foreground">
              The camera feed stays in your browser. We do not record or upload
              video or audio. If you use voice answers, your browser&apos;s
              speech-recognition feature converts speech to text. In Chrome and
              some other browsers, this is done by the browser vendor&apos;s
              servers, under their own privacy terms. Only the resulting text is
              sent to Truepanel.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium">AI and other services</h2>
            <p className="mt-2 text-muted-foreground">
              To work, Truepanel sends data to the following providers:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">
                  Google Gemini
                </span>{" "}
                receives your resume text, job description, research summaries
                and interview answers to generate questions, feedback and
                plans. On Google&apos;s free tier, submitted content may be used
                by Google to improve its products. Do not include information
                you would not want processed this way.
              </li>
              <li>
                <span className="font-medium text-foreground">Tavily</span>{" "}
                receives search queries containing company names, role titles
                and names of panel members you add, to find public web
                information.
              </li>
              <li>
                <span className="font-medium text-foreground">Supabase</span>{" "}
                stores your account, data and resume files.
              </li>
              <li>
                <span className="font-medium text-foreground">Vercel</span>{" "}
                hosts the application.
              </li>
              <li>
                <span className="font-medium text-foreground">Resend</span>{" "}
                sends account emails such as sign-up confirmation.
              </li>
            </ul>
            <p className="mt-2 text-muted-foreground">
              We do not sell your data and we do not show advertising.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium">Research about interviewers</h2>
            <p className="mt-2 text-muted-foreground">
              If you add a panel member, we search only for publicly available
              professional information and show the source of each finding.
              Please only enter people you are actually scheduled to meet. We
              do not search for private contact details or personal social
              media.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium">Who can see your data</h2>
            <p className="mt-2 text-muted-foreground">
              Your data is protected by database-level access rules, so other
              users cannot see it. The people who operate Truepanel can access
              the database for support and maintenance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium">Your control</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                Remove an interview target from your dashboard, and remove
                resumes from your profile.
              </li>
              <li>
                Delete your whole account from{" "}
                <a href="/settings" className="underline">
                  Settings
                </a>
                . This permanently removes your account, resume files and all
                related data.
              </li>
              <li>
                For anything else, email{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
                  {CONTACT_EMAIL}
                </a>
                .
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium">Cookies</h2>
            <p className="mt-2 text-muted-foreground">
              We use only the cookies needed to keep you signed in. We do not
              use advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium">Age</h2>
            <p className="mt-2 text-muted-foreground">
              Truepanel is for people aged 18 and over.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium">Changes</h2>
            <p className="mt-2 text-muted-foreground">
              If we change this policy we will update the date above.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
