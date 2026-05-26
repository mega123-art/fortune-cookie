import { ImageResponse } from "next/og"

export const size = { width: 64, height: 64 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 64,
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        <svg
          width="56"
          height="56"
          viewBox="0 0 56 56"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="top" cx="38%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#FFC55A" />
              <stop offset="100%" stopColor="#C96000" />
            </radialGradient>
            <radialGradient id="bot" cx="38%" cy="70%" r="65%">
              <stop offset="0%" stopColor="#FFB030" />
              <stop offset="100%" stopColor="#A04C00" />
            </radialGradient>
          </defs>

          {/* Top half */}
          <path
            d="M8,28 Q9,8 28,16 Q47,8 48,28 Q38,23 28,26 Q18,23 8,28Z"
            fill="url(#top)"
          />
          {/* Bottom half */}
          <path
            d="M8,28 Q9,47 28,40 Q47,47 48,28 Q38,33 28,30 Q18,33 8,28Z"
            fill="url(#bot)"
          />
          {/* Center crease shadow */}
          <path
            d="M8,28 Q18,23 28,26 Q38,23 48,28 Q38,33 28,30 Q18,33 8,28Z"
            fill="rgba(100,40,0,0.35)"
          />
          {/* Paper slip */}
          <rect x="19" y="25.5" width="18" height="5" rx="1" fill="#FFF5DC" />
          {/* Paper lines */}
          <line x1="22" y1="27.3" x2="35" y2="27.3" stroke="#C8B090" strokeWidth="0.8" />
          <line x1="22" y1="29" x2="35" y2="29" stroke="#C8B090" strokeWidth="0.8" />
          {/* Specular highlight */}
          <path
            d="M14,20 Q20,14 27,17"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    { ...size }
  )
}
