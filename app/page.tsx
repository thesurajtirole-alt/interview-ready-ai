"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <motion.section
      id={id}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      variants={fadeUp}
      className={className}
    >
      {children}
    </motion.section>
  );
}

export default function Home() {
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  const faqs = [
    {
      q: "Is this going to judge me?",
      a: "No. There's no pass/fail language anywhere in this product. You'll get evidence-based observations — what happened and why it matters — never a grade on who you are.",
    },
    {
      q: "What does the research actually look at?",
      a: "Only publicly available professional information: things like a company's own site, public LinkedIn pages, and public talks or articles. We never look for private, personal, or contact information.",
    },
    {
      q: "Do you record my interview?",
      a: "Recording is optional. If you allow it, it's stored privately and you can delete it — along with any interview, resume, or research data — at any time.",
    },
    {
      q: "Is my data used to train AI models?",
      a: "No. Your resume, interviews, and recordings are yours. They aren't used for model training.",
    },
  ];

  return (
    <main className="overflow-x-hidden">
      {/* ---------- HERO ---------- */}
      <section className="relative flex min-h-[92vh] flex-col items-center justify-center px-6 text-center">
        {/* Signature element: a slow breathing pulse, echoing "take a breath" */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.45, 0.25] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="h-[420px] w-[420px] rounded-full bg-primary/10 blur-2xl sm:h-[560px] sm:w-[560px]"
          />
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute h-[260px] w-[260px] rounded-full bg-accent/20 blur-xl sm:h-[340px] sm:w-[340px]"
          />
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="relative mb-5 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground"
        >
          InterviewReady AI
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="relative max-w-3xl font-display text-5xl font-medium leading-[1.1] tracking-tight sm:text-6xl md:text-7xl"
        >
          Your interview isn&apos;t a test.
          <br />
          <span className="italic text-primary">It&apos;s a skill</span> you can train.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="relative mt-7 max-w-xl text-lg text-muted-foreground"
        >
          Meet your AI interview coach. We&apos;ll understand the company, the
          role, and the people you&apos;re meeting — and help you walk in
          feeling prepared, not judged.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="relative mt-10 flex flex-col gap-3 sm:flex-row"
        >
          <a
            href="/signup"
            className="rounded-lg bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            Prepare for my interview
          </a>
          <a
            href="#how-it-works"
            className="rounded-lg border border-border px-7 py-3.5 text-sm font-medium transition hover:bg-secondary"
          >
            See how it works
          </a>
        </motion.div>
      </section>

      {/* ---------- EMOTIONAL REASSURANCE ---------- */}
      <Section className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="font-display text-2xl italic leading-relaxed text-foreground sm:text-3xl">
          &ldquo;No shame. No judgment. Just improvement.&rdquo;
        </p>
        <p className="mt-6 text-muted-foreground">
          Most interview prep tools tell you what you did wrong. This one
          figures out what&apos;s actually holding you back, trains that one
          thing, and proves — with real evidence — that you&apos;ve gotten
          better.
        </p>
      </Section>

      {/* ---------- HOW IT WORKS ---------- */}
      <Section id="how-it-works" className="border-t border-border px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-3xl font-medium sm:text-4xl">
            How it works
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                n: "01",
                title: "We understand your interview",
                body: "Tell us the company, the role, and who you're meeting — we research what's publicly known about all three.",
              },
              {
                n: "02",
                title: "You run a realistic interview",
                body: "A natural, voice-based mock interview that follows up on your answers the way a real panel would.",
              },
              {
                n: "03",
                title: "We find what's holding you back",
                body: "Evidence-based growth areas, not vague scores — specific, observable patterns across your answers.",
              },
              {
                n: "04",
                title: "You train, retest, and improve",
                body: "Short focused drills on exactly what matters, then a retest that shows the improvement in numbers.",
              },
            ].map((step) => (
              <div key={step.n}>
                <span className="font-display text-sm text-accent">
                  {step.n}
                </span>
                <h3 className="mt-3 font-display text-lg font-medium">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ---------- COMPANY + PANEL INTELLIGENCE ---------- */}
      <Section className="border-t border-border px-6 py-24">
        <div className="mx-auto grid max-w-5xl gap-16 sm:grid-cols-2">
          <div>
            <h3 className="font-display text-2xl font-medium">
              We research the company and role
            </h3>
            <p className="mt-4 text-muted-foreground">
              Public company information, the job description, and likely
              interview themes — organized into a brief before you ever
              start practicing.
            </p>
          </div>
          <div>
            <h3 className="font-display text-2xl font-medium">
              And, if you know them, your panel
            </h3>
            <p className="mt-4 text-muted-foreground">
              Based only on public professional information — never
              speculation about what someone privately thinks. Every claim
              is labeled confirmed, strong indication, or possible.
            </p>
          </div>
        </div>
      </Section>

      {/* ---------- GROWTH AREAS PREVIEW ---------- */}
      <Section className="border-t border-border bg-secondary/40 px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h3 className="font-display text-2xl font-medium sm:text-3xl">
            Here&apos;s what we noticed —<br />not a score you have to defend
          </h3>
          <div className="mx-auto mt-10 max-w-md rounded-xl border border-border bg-card p-6 text-left shadow-sm">
            <p className="text-sm font-medium text-accent">Growth area</p>
            <p className="mt-1 font-display text-lg font-medium">
              Answer structure
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Observed: your main point tended to arrive after your example,
              not before it.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              This doesn&apos;t mean your thinking is unclear — it means the
              structure isn&apos;t carrying it yet. Answer → Reason → Example
              → Result usually fixes this fast.
            </p>
          </div>
        </div>
      </Section>

      {/* ---------- PRIVACY ---------- */}
      <Section className="border-t border-border px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h3 className="font-display text-2xl font-medium">
            Your interview data is private
          </h3>
          <p className="mt-4 text-muted-foreground">
            You can delete your resume, any interview, any recording, any
            research data, or your account entirely, at any time. Nothing
            you share here is used to train AI models.
          </p>
        </div>
      </Section>

      {/* ---------- FAQ ---------- */}
      <Section className="border-t border-border px-6 py-24">
        <div className="mx-auto max-w-2xl">
          <h3 className="font-display text-2xl font-medium">Questions</h3>
          <div className="mt-8 divide-y divide-border">
            {faqs.map((item, i) => (
              <div key={item.q} className="py-5">
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="flex w-full items-center justify-between text-left"
                  aria-expanded={faqOpen === i}
                >
                  <span className="font-medium">{item.q}</span>
                  <span className="ml-4 text-muted-foreground">
                    {faqOpen === i ? "–" : "+"}
                  </span>
                </button>
                {faqOpen === i && (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ---------- FINAL CTA ---------- */}
      <Section className="border-t border-border px-6 py-28 text-center">
        <h3 className="font-display text-3xl font-medium sm:text-4xl">
          You&apos;re allowed to get better at this.
        </h3>
        <a
          href="/signup"
          className="mt-8 inline-block rounded-lg bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
        >
          Prepare for my interview
        </a>
        <div className="mt-4">
          <a
            href="/demo"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Or see a demo first →
          </a>
        </div>
      </Section>

      {/* ---------- FOOTER ---------- */}
      <footer className="border-t border-border px-6 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <p>InterviewReady AI</p>
          <div className="flex gap-6">
            <a href="/privacy" className="hover:text-foreground">
              Privacy
            </a>
            <a href="/login" className="hover:text-foreground">
              Log in
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
