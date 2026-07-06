import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "RankBoost.eu — SEO Autopilot for small businesses";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #f5f3ff 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #3b82f6, #7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              color: "white",
            }}
          >
            ↑
          </div>
          <span style={{ fontSize: "48px", fontWeight: 700, color: "#0f172a" }}>
            Rank<span style={{ color: "#2563eb" }}>Boost</span>.eu
          </span>
        </div>
        <p style={{ fontSize: "36px", color: "#334155", maxWidth: "900px", lineHeight: 1.4 }}>
          SEO Autopilot for small businesses
        </p>
        <p style={{ fontSize: "24px", color: "#64748b", marginTop: "16px" }}>
          Google + AI search visibility · Review Mode first
        </p>
      </div>
    ),
    { ...size }
  );
}
