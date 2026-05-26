import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Fortune Cookie — Crack Your Destiny on Monad"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(ellipse at 50% 40%, #3D1F7A 0%, #1A1033 50%, #0D0821 100%)",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle glow orb */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 600,
            height: 300,
            borderRadius: "50%",
            background: "rgba(167,139,250,0.08)",
            filter: "blur(80px)",
          }}
        />

        {/* Cookie emoji */}
        <div style={{ fontSize: 100, marginBottom: 32, lineHeight: 1 }}>🥠</div>

        {/* Headline */}
        <div
          style={{
            fontSize: 62,
            fontWeight: 700,
            color: "#FFF5E4",
            letterSpacing: "-1px",
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          Fortune Cookie
        </div>

        {/* Subtext */}
        <div
          style={{
            fontSize: 28,
            color: "rgba(196,181,253,0.75)",
            marginBottom: 48,
            textAlign: "center",
            letterSpacing: "0.02em",
          }}
        >
          Crack open your destiny. On-chain on Monad.
        </div>

        {/* Divider */}
        <div
          style={{
            width: 120,
            height: 2,
            background: "rgba(255,215,0,0.5)",
            borderRadius: 1,
            marginBottom: 32,
          }}
        />

        {/* CTA pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 36px",
            borderRadius: 999,
            background: "rgba(255,215,0,0.12)",
            border: "1px solid rgba(255,215,0,0.35)",
            color: "#FFD700",
            fontSize: 22,
            fontWeight: 600,
          }}
        >
          🔮 Your fortune awaits
        </div>

        {/* Bottom branding */}
        <div
          style={{
            position: "absolute",
            bottom: 28,
            right: 44,
            color: "rgba(196,181,253,0.35)",
            fontSize: 18,
          }}
        >
          Built on Monad
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
