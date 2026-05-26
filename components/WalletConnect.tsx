"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowSquareOut, Warning } from "@phosphor-icons/react"
import { connectWallet, inscribeFortuneOnChain, type WalletType } from "@/lib/wallet"
import { MONAD } from "@/lib/monad"
import { type Fortune } from "@/data/fortunes"
import WalletPicker from "./WalletPicker"

interface Props {
  fortune: Fortune | null
}

type WalletStatus = "pick" | "connecting" | "connected" | "inscribing" | "inscribed" | "error"
// "pick" and "error" both show the wallet picker; "connecting" is transient

export default function WalletConnect({ fortune }: Props) {
  const [status, setStatus] = useState<WalletStatus>("pick")
  const [address, setAddress] = useState<string>("")
  const [walletType, setWalletType] = useState<WalletType>("metamask")
  const [txHash, setTxHash] = useState<string>("")
  const [error, setError] = useState<string>("")

  const handleWalletSelect = useCallback(async (type: WalletType) => {
    setWalletType(type)
    setStatus("connecting")
    setError("")
    try {
      const addr = await connectWallet(type)
      setAddress(addr)
      setStatus("connected")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Connection failed")
      setStatus("error")
    }
  }, [])

  const handleInscribe = useCallback(async () => {
    if (!fortune) return
    setStatus("inscribing")
    setError("")
    try {
      const hash = await inscribeFortuneOnChain(fortune.id, fortune.text, walletType)
      setTxHash(hash)
      setStatus("inscribed")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Transaction failed")
      setStatus("error")
    }
  }, [fortune, walletType])

  const shortAddr = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ""

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-xs">
      {/* Wrong chain banner */}
      <AnimatePresence>
        {status === "error" && error.toLowerCase().includes("switch") && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full px-4 py-2 rounded-lg text-xs flex items-center gap-2"
            style={{
              background: "rgba(251,191,36,0.12)",
              border: "1px solid rgba(251,191,36,0.3)",
              color: "#FCD34D",
              fontFamily: "var(--font-nunito)",
            }}
          >
            <Warning size={14} />
            Switch to Monad in your wallet
          </motion.div>
        )}
      </AnimatePresence>

      {status === "pick" || status === "error" ? (
        <div className="w-full">
          <WalletPicker
            onSelect={handleWalletSelect}
            label="Inscribe with"
          />
          {status === "error" && !error.toLowerCase().includes("switch") && (
            <p className="text-xs text-center mt-2" style={{ color: "#FC8181", fontFamily: "var(--font-nunito)" }}>
              {error}
            </p>
          )}
        </div>
      ) : status === "connecting" ? (
        <div
          className="text-xs flex items-center gap-2"
          style={{ color: "#C4B5FD", fontFamily: "var(--font-nunito)" }}
        >
          <span className="animate-spin inline-block w-3 h-3 border-2 border-[#A78BFA] border-t-transparent rounded-full" />
          Connecting…
        </div>
      ) : status === "connected" && fortune ? (
        <motion.button
          onClick={handleInscribe}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97, y: 1 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A78BFA]/60"
          style={{
            fontFamily: "var(--font-nunito)",
            background: "rgba(45,27,94,0.6)",
            border: "1px solid rgba(167,139,250,0.3)",
            color: "#C4B5FD",
            minHeight: 44,
          }}
        >
          Inscribe on Monad ({shortAddr})
        </motion.button>
      ) : status === "inscribing" ? (
        <div
          className="text-xs flex items-center gap-2"
          style={{ color: "#C4B5FD", fontFamily: "var(--font-nunito)" }}
        >
          <span className="animate-spin inline-block w-3 h-3 border-2 border-[#A78BFA] border-t-transparent rounded-full" />
          Inscribing on Monad…
        </div>
      ) : status === "inscribed" ? (
        <motion.a
          href={`${MONAD.explorerUrl}/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1.5 text-xs underline underline-offset-2 focus-visible:outline-none"
          style={{ color: "#A78BFA", fontFamily: "var(--font-nunito)" }}
        >
          <ArrowSquareOut size={12} />
          Inscribed on Monad: {txHash.slice(0, 10)}…{txHash.slice(-6)}
        </motion.a>
      ) : null}
    </div>
  )
}
