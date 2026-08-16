"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Question {
  id: string;
  text: string;
  interviewerName?: string | null;
  panelPersona?: string | null;
}

interface TranscriptEntry {
  speaker: "interviewer" | "candidate";
  text: string;
  interviewerName?: string | null;
  panelPersona?: string | null;
}

type CameraState = "requesting" | "granted" | "denied" | "unsupported" | "off";

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
    initialQuestion
      ? [
          {
            speaker: "interviewer",
            text: initialQuestion.text,
            interviewerName: initialQuestion.interviewerName,
            panelPersona: initialQuestion.panelPersona,
          },
        ]
      : []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [muted, setMuted] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [ending, setEnding] = useState(false);

  // ---------- Camera state ----------
  const [cameraState, setCameraState] = useState<CameraState>("requesting");
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // ---------- Camera + mic setup ----------
  async function setupCamera(deviceIds?: { video?: string; audio?: string }) {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState("unsupported");
      return;
    }
    setCameraState("requesting");
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());

      const stream = await navigator.mediaDevices.getUserMedia({
        video: deviceIds?.video ? { deviceId: { exact: deviceIds.video } } : true,
        audio: deviceIds?.audio ? { deviceId: { exact: deviceIds.audio } } : true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraState("granted");

      const devices = await navigator.mediaDevices.enumerateDevices();
      setVideoDevices(devices.filter((d) => d.kind === "videoinput"));
      setAudioDevices(devices.filter((d) => d.kind === "audioinput"));
    } catch (e: any) {
      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
        setCameraState("denied");
      } else if (e.name === "NotFoundError") {
        setCameraState("unsupported");
      } else {
        setCameraState("denied");
      }
    }
  }

  // Switches only ONE track (video or audio) without tearing down the
  // other — avoids the camera visibly flickering off when only the mic
  // is being changed, or vice versa.
  async function switchDevice(kind: "video" | "audio", deviceId: string) {
    if (!navigator.mediaDevices?.getUserMedia || !streamRef.current) return;
    try {
      const constraints =
        kind === "video"
          ? { video: deviceId ? { deviceId: { exact: deviceId } } : true }
          : { audio: deviceId ? { deviceId: { exact: deviceId } } : true };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      const newTrack =
        kind === "video" ? newStream.getVideoTracks()[0] : newStream.getAudioTracks()[0];
      if (!newTrack) return;

      const oldTrack =
        kind === "video"
          ? streamRef.current.getVideoTracks()[0]
          : streamRef.current.getAudioTracks()[0];

      if (oldTrack) {
        streamRef.current.removeTrack(oldTrack);
        oldTrack.stop();
      }
      streamRef.current.addTrack(newTrack);

      // Keep the enabled/disabled state consistent with the toggle buttons.
      newTrack.enabled = kind === "video" ? cameraOn : micOn;

      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
    } catch {
      // If switching fails, leave the existing track in place rather than
      // losing the whole stream.
    }
  }

  useEffect(() => {
    setupCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleCamera() {
    if (!streamRef.current) return;
    const next = !cameraOn;
    streamRef.current.getVideoTracks().forEach((t) => (t.enabled = next));
    setCameraOn(next);
  }

  function toggleMic() {
    if (!streamRef.current) return;
    const next = !micOn;
    streamRef.current.getAudioTracks().forEach((t) => (t.enabled = next));
    setMicOn(next);
  }

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

  // ---------- Browser text-to-speech: speak each new interviewer question, animate the avatar while speaking ----------
  useEffect(() => {
    if (!question || muted) return;
    if (!("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(question.text);
    utterance.rate = 1;
    utterance.onstart = () => setAiSpeaking(true);
    utterance.onend = () => setAiSpeaking(false);
    utterance.onerror = () => setAiSpeaking(false);
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
        setQuestion({
          id: data.question.id,
          text: data.question.text,
          interviewerName: data.question.interviewerName,
          panelPersona: data.question.panelPersona,
        });
        setTranscript((prev) => [
          ...prev,
          {
            speaker: "interviewer",
            text: data.question.text,
            interviewerName: data.question.interviewerName,
            panelPersona: data.question.panelPersona,
          },
        ]);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function endInterviewEarly() {
    setEnding(true);
    try {
      await fetch("/api/interview/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId }),
      });
      streamRef.current?.getTracks().forEach((t) => t.stop());
      router.push("/dashboard");
    } catch {
      router.push("/dashboard");
    }
  }

  if (complete) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display text-2xl font-medium">You did it.</h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          You just completed a realistic interview built around this role
          and company.
        </p>
        <button
          onClick={() => router.push(`/interview/${interviewId}/report`)}
          className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          See what we noticed
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-8">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <p className="text-xs text-muted-foreground">Your interview</p>
          <p className="text-sm font-medium">
            {roleTitle} @ {companyName}
          </p>
        </div>
        <button
          onClick={() => setShowEndConfirm(true)}
          className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary"
        >
          End interview
        </button>
      </div>

      {/* ---------- Video panels: AI avatar + candidate camera ---------- */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {/* AI avatar panel */}
        <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-border bg-gradient-to-b from-secondary/60 to-secondary/20">
          <div className="relative flex flex-col items-center">
            {/* Breathing glow behind the avatar while speaking */}
            <div
              className={`absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-xl transition-transform duration-700 ${
                aiSpeaking ? "scale-125" : "scale-90"
              }`}
            />

            {/* Illustrated silhouette avatar */}
            <svg
              width="88"
              height="88"
              viewBox="0 0 88 88"
              className="relative"
            >
              <circle cx="44" cy="44" r="43" fill="var(--avatar-ring, #E8E2D6)" opacity="0.5" />
              <circle cx="44" cy="34" r="15" fill="#2C4A3E" />
              <path
                d="M14 78c2-18 14-28 30-28s28 10 30 28"
                fill="#2C4A3E"
              />
            </svg>

            {/* Speaking waveform bars */}
            <div className="mt-2 flex h-4 items-end gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`w-0.5 rounded-full bg-accent transition-all duration-300 ${
                    aiSpeaking ? "animate-pulse" : ""
                  }`}
                  style={{
                    height: aiSpeaking ? `${6 + (i % 3) * 4}px` : "3px",
                    animationDelay: `${i * 100}ms`,
                  }}
                />
              ))}
            </div>

            <p className="mt-2 text-xs font-medium text-muted-foreground">
              {question?.interviewerName
                ? `${question.interviewerName}${
                    question.panelPersona ? ` · ${question.panelPersona}` : ""
                  }`
                : "Interviewer"}
            </p>
            {aiSpeaking && (
              <p className="mt-0.5 text-[10px] text-accent">Speaking…</p>
            )}
          </div>
          <button
            onClick={() => setMuted((m) => !m)}
            className="absolute bottom-2 right-2 rounded-lg bg-background/80 px-2 py-1 text-[10px] text-muted-foreground hover:bg-background"
          >
            {muted ? "Unmute" : "Mute"}
          </button>
        </div>

        {/* Candidate camera panel */}
        <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary/40">
          {cameraState === "granted" && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-cover ${cameraOn ? "" : "hidden"}`}
            />
          )}
          {cameraState === "granted" && !cameraOn && (
            <p className="text-xs text-muted-foreground">Camera is off</p>
          )}
          {cameraState === "requesting" && (
            <p className="text-xs text-muted-foreground">
              Asking for camera access…
            </p>
          )}
          {cameraState === "denied" && (
            <p className="max-w-[80%] text-center text-xs text-muted-foreground">
              Camera/mic access was denied. You can still do the interview by
              typing or using voice input below — just allow access in your
              browser settings if you&apos;d like video.
            </p>
          )}
          {cameraState === "unsupported" && (
            <p className="max-w-[80%] text-center text-xs text-muted-foreground">
              No camera detected, or your browser doesn&apos;t support video.
              Text and voice input still work fine below.
            </p>
          )}
          <p className="absolute left-2 top-2 rounded-lg bg-background/80 px-2 py-1 text-[10px] text-muted-foreground">
            You
          </p>
          {cameraState === "granted" && (
            <div className="absolute bottom-2 right-2 flex gap-1">
              <button
                onClick={toggleCamera}
                className="rounded-lg bg-background/80 px-2 py-1 text-[10px] text-muted-foreground hover:bg-background"
              >
                {cameraOn ? "Camera off" : "Camera on"}
              </button>
              <button
                onClick={toggleMic}
                className="rounded-lg bg-background/80 px-2 py-1 text-[10px] text-muted-foreground hover:bg-background"
              >
                {micOn ? "Mic off" : "Mic on"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ---------- Device selection (only shown once permission granted and multiple devices exist) ---------- */}
      {cameraState === "granted" && (videoDevices.length > 1 || audioDevices.length > 1) && (
        <div className="mt-2 flex gap-3 text-xs">
          {videoDevices.length > 1 && (
            <select
              value={selectedVideoDevice}
              onChange={(e) => {
                setSelectedVideoDevice(e.target.value);
                switchDevice("video", e.target.value);
              }}
              className="rounded-lg border border-border bg-transparent px-2 py-1"
            >
              <option value="">Default camera</option>
              {videoDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || "Camera"}
                </option>
              ))}
            </select>
          )}
          {audioDevices.length > 1 && (
            <select
              value={selectedAudioDevice}
              onChange={(e) => {
                setSelectedAudioDevice(e.target.value);
                switchDevice("audio", e.target.value);
              }}
              className="rounded-lg border border-border bg-transparent px-2 py-1"
            >
              <option value="">Default microphone</option>
              {audioDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || "Microphone"}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* ---------- Transcript ---------- */}
      <div className="mt-4 flex-1 space-y-4 overflow-y-auto">
        {transcript.map((t, i) => (
          <div
            key={i}
            className={`flex flex-col ${t.speaker === "candidate" ? "items-end" : "items-start"}`}
          >
            {t.speaker === "interviewer" && t.interviewerName && (
              <p className="mb-1 px-1 text-xs font-medium text-muted-foreground">
                {t.interviewerName}
                {t.panelPersona ? ` · ${t.panelPersona}` : ""}
              </p>
            )}
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

      {/* ---------- End interview confirmation ---------- */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-sm rounded-xl bg-background p-6 shadow-lg">
            <p className="font-medium">End this interview early?</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Your progress so far will be saved, but this session won&apos;t
              count as a completed interview for your report.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-secondary"
              >
                Keep going
              </button>
              <button
                onClick={endInterviewEarly}
                disabled={ending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {ending ? "Ending…" : "End interview"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
