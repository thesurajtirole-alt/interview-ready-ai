# Interview Engine

## The stage plan

The interview blueprint (`lib/ai/interview-blueprint.ts`) produces stage
percentages (e.g. opening 10%, technical 40%, behavioral 20%...).
`lib/interview/stage-plan.ts` converts these into a concrete question
count per stage against a fixed total budget (currently 8 questions),
rounding each stage to at least 1 question. `currentStage()` walks the
plan and returns whichever stage hasn't hit its target count yet, or
`null` when every stage is done — that's what triggers `status:
"completed"` on the `interviews` row.

This means the interview is **not a fixed question script** — the same
blueprint could produce a slightly different number of questions per
stage depending on rounding, and the actual questions are generated live
by Gemini each time, referencing the real conversation so far.

## Panel simulation

`lib/interview/panel-persona.ts` handles three things:

1. **`inferPanelPersona(roleTitle)`** — simple keyword matching (no AI
   call) on the role title entered during onboarding, categorizing each
   panel member as `engineering_manager`, `technical_lead`, `hr`, or
   `other`. Set once, at onboarding save time.
2. **`STAGE_PERSONA_PREFERENCE`** — a lookup table saying which persona
   should lead each stage (e.g. `technical` prefers `technical_lead`,
   `behavioral` prefers `hr`), with fallbacks if the preferred persona
   isn't among the candidate's actual panel.
3. **`pickInterviewerForStage(members, stage)`** — applies the preference
   order against the real panel members for this interview.

When the picked interviewer's name differs from who asked the *previous*
question, `isPersonaChange` is set to `true`, which tells the question
generation prompt to have that panel member briefly introduce themselves
before asking — this is what produces lines like *"I'm Raj, the Technical
Lead here, and I'd love to hear more about..."*

If the candidate never added named panel members, everything still works
— `pickInterviewerForStage` just returns `null`, and the AI presents as a
generic unnamed interviewer.

## Camera / video

`app/interview/[id]/interview-chat.tsx` uses raw `getUserMedia` (no
WebRTC/video-call infrastructure needed, since the "other side" is an AI,
not a human) — the candidate's own camera feed is shown locally, next to
an illustrated SVG avatar representing the AI, animated (breathing glow +
waveform bars) while `speechSynthesis` is actively speaking.

**A real bug worth knowing about if you touch this code:** the `<video>`
element only renders once `cameraState === "granted"`. Assigning the
`MediaStream` to `videoRef.current.srcObject` *inside* the same function
that calls `setCameraState("granted")` can race — React hasn't
re-rendered yet, so the video element doesn't exist and the ref is
`null`. Fixed with a dedicated `useEffect` keyed on `cameraState` that
re-attaches the stream once the element actually exists. If you refactor
this component, keep that effect.

Device switching (the camera/mic dropdowns) uses `switchDevice()`, which
replaces only the specific track that changed via
`stream.removeTrack`/`addTrack`, rather than tearing down and
re-requesting the entire stream — the naive approach caused a visible
flicker where the camera would drop out while only the microphone was
being switched.

## Voice input/output

Both are browser-native, no external STT/TTS provider:
- **Input**: `webkitSpeechRecognition` / `SpeechRecognition`, continuous
  mode, appends final transcripts to the answer textarea as the
  candidate speaks.
- **Output**: `speechSynthesis`, triggered whenever a new question
  arrives, with `onstart`/`onend` driving the avatar's "Speaking..."
  indicator.

Both degrade gracefully — `speechSupported` gates whether the mic button
even renders, and TTS is skipped entirely if `"speechSynthesis" in
window` is false or the candidate has muted the AI voice.

## Ending an interview early

`/api/interview/end` marks the interview `status: "abandoned"` rather
than `"completed"` — it won't count as a genuine practice session for
readiness scoring, but the transcript/answers so far are preserved, not
deleted.
