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
  logo: string
  logoSize: number
}[] = [
  {
    type: "metamask",
    label: "MetaMask",
    color: "#E8830A",
    bg: "rgba(232,131,10,0.1)",
    border: "rgba(232,131,10,0.3)",
    logo: "/wallets/metamask.svg",
    logoSize: 26,
  },
  {
    type: "phantom",
    label: "Phantom",
    color: "#AB9FF2",
    bg: "rgba(171,159,242,0.1)",
    border: "rgba(171,159,242,0.3)",
    logo: "/wallets/phantom.svg",
    logoSize: 24,
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
        {WALLETS.map(({ type, label: name, color, bg, border, logo, logoSize }) => {
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logo}
                alt={name}
                width={logoSize}
                height={logoSize}
                style={{ flexShrink: 0, display: "block" }}
              />
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
