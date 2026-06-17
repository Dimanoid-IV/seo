import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "RankBoost.eu — SEO services in Estonia and Europe";
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
          background: "linear-gradient(135deg, #050816 0%, #1e1b4b 50%, #0c4a6e 100%)",
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
          <span style={{ fontSize: "48px", fontWeight: 700, color: "white" }}>
            Rank<span style={{ color: "#60a5fa" }}>Boost</span>.eu
          </span>
        </div>
        <p style={{ fontSize: "36px", color: "#94a3b8", maxWidth: "900px", lineHeight: 1.4 }}>
          SEO services in Estonia &amp; Europe
        </p>
        <p style={{ fontSize: "24px", color: "#64748b", marginTop: "16px" }}>
          Technical SEO · Local SEO · Content · Multilingual
        </p>
      </div>
    ),
    { ...size }
  );
}
