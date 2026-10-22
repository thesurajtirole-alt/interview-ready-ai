import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Truepanel — AI interview coach";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#faf8f4",
          color: "#1f2a26",
        }}
      >
        <div style={{ display: "flex", fontSize: 96, fontWeight: 600 }}>
          <span>True</span>
          <span style={{ color: "#2f5d4c" }}>panel</span>
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 48,
            lineHeight: 1.25,
            maxWidth: 940,
          }}
        >
          Your interview isn&apos;t a test. It&apos;s a skill you can train.
        </div>
        <div style={{ marginTop: 36, fontSize: 28, color: "#5b6b64" }}>
          AI mock interviews · company and panel research · personal training plans
        </div>
      </div>
    ),
    { ...size }
  );
}
