/**
 * Gemini's structured JSON output is usually clean, but occasionally
 * produces small syntax quirks (a trailing comma before a closing
 * bracket, or a stray markdown fence despite responseMimeType). This
 * tries a few progressively more forgiving repairs before giving up.
 */
export function parseModelJson(raw: string): unknown {
  const attempts = [
    raw,
    raw.replace(/^```json\s*|```\s*$/g, "").trim(),
  ];

  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate);
    } catch {
      // try the next repair
    }
  }

  // Last resort: strip trailing commas before a closing ] or }
  const repaired = attempts[attempts.length - 1].replace(
    /,(\s*[}\]])/g,
    "$1"
  );

  try {
    return JSON.parse(repaired);
  } catch (e) {
    throw new Error(
      `Could not parse the AI's response as JSON, even after repair attempts: ${(e as Error).message}`
    );
  }
}
