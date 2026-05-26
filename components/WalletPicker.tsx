"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { detectWallets, type WalletType } from "@/lib/wallet"

interface Props {
  onSelect: (type: WalletType) => void
  disabled?: boolean
  label?: string
}

const WALLETS: {
  type: WalletType
  label: string
  color: string
  bg: string
  border: string
  // inline SVG path for the logo mark
  svg: React.ReactNode
}[] = [
  {
    type: "metamask",
    label: "MetaMask",
    color: "#E8830A",
    bg: "rgba(232,131,10,0.1)",
    border: "rgba(232,131,10,0.3)",
    svg: (
      <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
        <polygon points="16,3 28,8 28,20 16,29 4,20 4,8" fill="#E2761B" stroke="#E2761B" strokeWidth="0.5"/>
        <polygon points="16,3 22,14 16,12" fill="#E4761B" stroke="none"/>
        <polygon points="16,3 10,14 16,12" fill="#E4761B" stroke="none"/>
        <polygon points="10,14 16,12 13,19" fill="#D7C1B3" stroke="none"/>
        <polygon points="22,14 19,19 16,12" fill="#D7C1B3" stroke="none"/>
        <polygon points="13,19 16,12 16,22" fill="#233447" stroke="none"/>
        <polygon points="19,19 16,22 16,12" fill="#233447" stroke="none"/>
        <polygon points="13,19 16,22 11,23" fill="#CD6116" stroke="none"/>
        <polygon points="19,19 21,23 16,22" fill="#CD6116" stroke="none"/>
        <polygon points="11,23 16,22 13,27" fill="#E4751F" stroke="none"/>
        <polygon points="21,23 19,27 16,22" fill="#E4751F" stroke="none"/>
        <polygon points="13,27 16,22 16,29" fill="#F6851B" stroke="none"/>
        <polygon points="19,27 16,29 16,22" fill="#F6851B" stroke="none"/>
      </svg>
    ),
  },
  {
    type: "phantom",
    label: "Phantom",
    color: "#AB9FF2",
    bg: "rgba(171,159,242,0.1)",
    border: "rgba(171,159,242,0.3)",
    svg: (
      <svg width="20" height="20" viewBox="0 0 128 128" fill="none">
        <rect width="128" height="128" rx="26" fill="#551BF9"/>
        <path d="M110.5 64C110.5 89.5 89.5 110.5 64 110.5C38.5 110.5 17.5 89.5 17.5 64C17.5 38.5 38.5 17.5 64 17.5C89.5 17.5 110.5 38.5 110.5 64Z" fill="#551BF9"/>
        <path d="M21 64C21 40.8 39.8 22 63 22H65C88.2 22 107 40.8 107 64C107 74 103.4 83.2 97.2 90.2C93.8 94 89 96 84 96H80C76 96 72.4 93.8 70.4 90.4L68 86C66.4 83.2 63.6 81.6 60.6 81.6C55.6 81.6 51.6 85.8 51.6 91C51.6 93.8 50 96 47.4 96H44C31.2 89.4 21 77.8 21 64Z" fill="white"/>
        <ellipse cx="50" cy="59" rx="7" ry="8.5" fill="#551BF9"/>
        <ellipse cx="78" cy="59" rx="7" ry="8.5" fill="#551BF9"/>
        <ellipse cx="47.5" cy="57.5" rx="3" ry="3.5" fill="white"/>
        <ellipse cx="75.5" cy="57.5" rx="3" ry="3.5" fill="white"/>
      </svg>
    ),
  },
]

export default function WalletPicker({ onSelect, disabled, label = "Choose wallet" }: Props) {
  const [available, setAvailable] = useState({ metamask: false, phantom: false })

  useEffect(() => {
    setAvailable(detectWallets())
  }, [])

  const noneAvailable = !available.metamask && !available.phantom

  if (noneAvailable) {
    return (
      <div
        className="w-full px-4 py-3 rounded-xl text-xs text-center"
        style={{
          fontFamily: "var(--font-nunito)",
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.2)",
          color: "#F87171",
        }}
      >
        No wallet detected. Install{" "}
        <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="underline">MetaMask</a>
        {" "}or{" "}
        <a href="https://phantom.com" target="_blank" rel="noopener noreferrer" className="underline">Phantom</a>.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <p
        className="text-xs uppercase tracking-widest mb-1"
        style={{ fontFamily: "var(--font-nunito)", color: "rgba(196,181,253,0.6)" }}
      >
        {label}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {WALLETS.map(({ type, label: name, color, bg, border, svg }) => {
          const isAvailable = available[type]
          return (
            <motion.button
              key={type}
              onClick={() => !disabled && isAvailable && onSelect(type)}
              disabled={disabled || !isAvailable}
              whileHover={isAvailable && !disabled ? { scale: 1.03 } : {}}
              whileTap={isAvailable && !disabled ? { scale: 0.97 } : {}}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-30"
              style={{
                fontFamily: "var(--font-nunito)",
                background: bg,
                border: `1px solid ${border}`,
                color,
                cursor: isAvailable && !disabled ? "pointer" : "not-allowed",
              }}
            >
              <span className="flex-shrink-0">{svg}</span>
              <span className="text-left leading-tight">
                {name}
                {!isAvailable && (
                  <span className="block opacity-50" style={{ fontSize: "0.62rem" }}>
                    Not installed
                  </span>
                )}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
