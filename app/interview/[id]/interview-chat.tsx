"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Question {
  id: string;
  text: string;
}

interface TranscriptEntry {
  speaker: "interviewer" | "candidate";
  text: string;
}

export function InterviewChat({
  interviewId,
  companyName,
  roleTitle,
  initialQuestion,
}: {
  interviewId: string;
  companyName: string;
  roleTitle: string;
  initialQuestion: Question | null;
}) {
  const router = useRouter();
  const [question, setQuestion] = useState<Question | null>(initialQuestion);
  const [answer, setAnswer] = useState("");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>(
    initialQuestion ? [{ speaker: "interviewer", text: initialQuestion.text }] : []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [muted, setMuted] = useState(false);

  const recognitionRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // ---------- Browser speech-to-text setup ----------
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }
    setSpeechSupported(true);

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript;
        }
      }
      if (finalText) {
        setAnswer((prev) => (prev ? prev + " " + finalText : finalText));
      }
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
  }, []);

  function toggleListening() {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  }

  // ---------- Browser text-to-speech: speak each new interviewer question ----------
  useEffect(() => {
    if (!question || muted) return;
    if (!("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(question.text);
    utterance.rate = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  async function submitAnswer() {
    if (!question || !answer.trim()) return;
    setLoading(true);
    setError(null);

    const answerText = answer.trim();
    setTranscript((prev) => [...prev, { speaker: "candidate", text: answerText }]);
    setAnswer("");

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
    }

    try {
      const res = await fetch("/api/interview/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewId,
          questionId: question.id,
          answerText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");

      if (data.complete) {
        setComplete(true);
        setQuestion(null);
      } else {
        setQuestion({ id: data.question.id, text: data.question.text });
        setTranscript((prev) => [
          ...prev,
          { speaker: "interviewer", text: data.question.text },
        ]);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (complete) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display text-2xl font-medium">You did it.</h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          You just completed a realistic interview built around this role
          and company. Your full report (strengths, growth areas, evidence)
          is built in a later phase.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Back to dashboard
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-10">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <p className="text-xs text-muted-foreground">Your interview</p>
          <p className="text-sm font-medium">
            {roleTitle} @ {companyName}
          </p>
        </div>
        <button
          onClick={() => setMuted((m) => !m)}
          className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary"
        >
          {muted ? "Unmute AI voice" : "Mute AI voice"}
        </button>
      </div>

      <div className="mt-6 flex-1 space-y-4 overflow-y-auto">
        {transcript.map((t, i) => (
          <div
            key={i}
            className={`flex ${t.speaker === "candidate" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                t.speaker === "candidate"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary"
              }`}
            >
              {t.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl bg-secondary px-4 py-2.5 text-sm text-muted-foreground">
              …
            </div>
          </div>
        )}
        <div ref={transcriptEndRef} />
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex items-end gap-2 border-t border-border pt-4">
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submitAnswer();
            }
          }}
          rows={2}
          placeholder="Type your answer, or use the mic…"
          className="flex-1 resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        {speechSupported && (
          <button
            onClick={toggleListening}
            className={`rounded-lg border px-3 py-2.5 text-sm transition ${
              listening
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-muted-foreground hover:bg-secondary"
            }`}
            title={listening ? "Stop listening" : "Start voice input"}
          >
            {listening ? "● Listening" : "🎙"}
          </button>
        )}
        <button
          onClick={submitAnswer}
          disabled={loading || !answer.trim()}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </main>
  );
}
