"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ArrowRight, CheckCircle, WarningCircle, Spinner } from "@phosphor-icons/react"
import { payForFortune, type WalletType } from "@/lib/wallet"
import { FORTUNE_PRICE_DISPLAY, TREASURY_ADDRESS, MONAD } from "@/lib/monad"
import WalletPicker from "./WalletPicker"

type PayState = "pick" | "paying" | "confirmed" | "error"

interface PaymentGateProps {
  open: boolean
  authorAddress?: string    // wallet address of fortune author, for 50/50 split
  onClose: () => void
  onPaid: () => void
}

function isValidAddress(addr: string | undefined): boolean {
  return !!addr && addr !== "anonymous" && /^0x[0-9a-fA-F]{40}$/.test(addr)
}

function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export default function PaymentGate({ open, authorAddress, onClose, onPaid }: PaymentGateProps) {
  const [payState, setPayState] = useState<PayState>("pick")
  const [txHash, setTxHash] = useState<string | null>(null)
  const [authorTxHash, setAuthorTxHash] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState("")

  const hasAuthor = isValidAddress(authorAddress)

  async function handleWalletSelect(type: WalletType) {
    setPayState("paying")
    setErrorMsg("")
    try {
      const result = await payForFortune(TREASURY_ADDRESS, authorAddress, type)
      setTxHash(result.treasuryTxHash)
      setAuthorTxHash(result.authorTxHash ?? null)
      setPayState("confirmed")
      setTimeout(() => {
        onPaid()
        setPayState("pick")
        setTxHash(null)
        setAuthorTxHash(null)
      }, 1600)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Transaction failed"
      setErrorMsg(msg.includes("user rejected") ? "Transaction cancelled." : msg.slice(0, 80))
      setPayState("error")
    }
  }

  function handleClose() {
    if (payState === "paying") return
    setPayState("pick")
    setTxHash(null)
    setAuthorTxHash(null)
    setErrorMsg("")
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="payment-gate-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(10,6,30,0.82)", backdropFilter: "blur(12px)" }}
        >
          <motion.div
            key="payment-gate-card"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-3xl p-7 flex flex-col gap-5"
            style={{
              background: "linear-gradient(145deg, #1E1245 0%, #160E38 100%)",
              border: "1px solid rgba(167,139,250,0.22)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            {/* Close */}
            {payState !== "paying" && (
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-1.5 rounded-full opacity-50 hover:opacity-100 transition-opacity"
                style={{ color: "#C4B5FD" }}
              >
                <X size={16} weight="bold" />
              </button>
            )}

            {/* Header */}
            <div className="flex flex-col items-center gap-3 text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: "rgba(255,159,67,0.12)",
                  border: "1px solid rgba(255,159,67,0.3)",
                  fontSize: 28,
                }}
              >
                🥠
              </div>
              <div>
                <h2
                  className="text-xl font-bold"
                  style={{ fontFamily: "var(--font-fredoka)", color: "#FFF5E4" }}
                >
                  Unlock Your Fortune
                </h2>
                <p
                  className="text-sm mt-1"
                  style={{ fontFamily: "var(--font-nunito)", color: "rgba(196,181,253,0.7)" }}
                >
                  Your first fortune was free. Each one after is {FORTUNE_PRICE_DISPLAY}.
                </p>
              </div>
            </div>

            {/* Payment split breakdown */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(255,215,0,0.15)" }}
            >
              {hasAuthor ? (
                <>
                  <div
                    className="flex items-center justify-between px-4 py-2.5"
                    style={{ background: "rgba(255,215,0,0.05)" }}
                  >
                    <span style={{ fontFamily: "var(--font-nunito)", color: "rgba(196,181,253,0.7)", fontSize: "0.75rem" }}>
                      Fortune author ({shortAddr(authorAddress!)})
                    </span>
                    <span style={{ fontFamily: "var(--font-fredoka)", color: "#FFD700", fontWeight: 700 }}>
                      5 MON
                    </span>
                  </div>
                  <div
                    className="flex items-center justify-between px-4 py-2.5"
                    style={{
                      background: "rgba(255,215,0,0.03)",
                      borderTop: "1px solid rgba(255,215,0,0.1)",
                    }}
                  >
                    <span style={{ fontFamily: "var(--font-nunito)", color: "rgba(196,181,253,0.7)", fontSize: "0.75rem" }}>
                      Treasury
                    </span>
                    <span style={{ fontFamily: "var(--font-fredoka)", color: "#FFD700", fontWeight: 700 }}>
                      5 MON
                    </span>
                  </div>
                  <div
                    className="flex items-center justify-between px-4 py-2 border-t"
                    style={{
                      background: "rgba(255,215,0,0.07)",
                      borderColor: "rgba(255,215,0,0.2)",
                    }}
                  >
                    <span style={{ fontFamily: "var(--font-nunito)", color: "rgba(196,181,253,0.9)", fontSize: "0.8rem", fontWeight: 600 }}>
                      Total
                    </span>
                    <span style={{ fontFamily: "var(--font-fredoka)", color: "#FFD700", fontSize: "1.1rem", fontWeight: 700 }}>
                      {FORTUNE_PRICE_DISPLAY}
                    </span>
                  </div>
                </>
              ) : (
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ background: "rgba(255,215,0,0.05)" }}
                >
                  <span style={{ fontFamily: "var(--font-nunito)", color: "rgba(196,181,253,0.8)", fontSize: "0.8rem" }}>
                    Fortune price
                  </span>
                  <span style={{ fontFamily: "var(--font-fredoka)", color: "#FFD700", fontSize: "1.1rem", fontWeight: 700 }}>
                    {FORTUNE_PRICE_DISPLAY}
                  </span>
                </div>
              )}
            </div>

            {hasAuthor && payState === "pick" && (
              <p
                className="text-xs text-center -mt-2"
                style={{ fontFamily: "var(--font-nunito)", color: "rgba(196,181,253,0.45)" }}
              >
                This will require 2 wallet confirmations
              </p>
            )}

            {/* State machine */}
            <AnimatePresence mode="wait">
              {payState === "pick" && (
                <motion.div key="pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <WalletPicker onSelect={handleWalletSelect} label="Pay with" />
                </motion.div>
              )}

              {payState === "paying" && (
                <motion.div
                  key="paying"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-bold"
                  style={{
                    fontFamily: "var(--font-nunito)",
                    background: "rgba(255,159,67,0.12)",
                    border: "1px solid rgba(255,159,67,0.3)",
                    color: "#FF9F43",
                    minHeight: 48,
                  }}
                >
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <Spinner size={16} weight="bold" />
                  </motion.div>
                  Confirm in wallet…
                </motion.div>
              )}

              {payState === "confirmed" && (
                <motion.div
                  key="confirmed"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col gap-2"
                >
                  <div
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-bold"
                    style={{
                      fontFamily: "var(--font-nunito)",
                      background: "rgba(74,222,128,0.12)",
                      border: "1px solid rgba(74,222,128,0.3)",
                      color: "#4ADE80",
                      minHeight: 48,
                    }}
                  >
                    <CheckCircle size={18} weight="bold" />
                    Paid — cracking cookie…
                  </div>
                  <div className="flex flex-col gap-1">
                    {authorTxHash && (
                      <a
                        href={`${MONAD.explorerUrl}/tx/${authorTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-center text-xs underline"
                        style={{ fontFamily: "var(--font-nunito)", color: "rgba(167,139,250,0.55)" }}
                      >
                        Author payment tx →
                      </a>
                    )}
                    {txHash && (
                      <a
                        href={`${MONAD.explorerUrl}/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-center text-xs underline"
                        style={{ fontFamily: "var(--font-nunito)", color: "rgba(167,139,250,0.55)" }}
                      >
                        Treasury payment tx →
                      </a>
                    )}
                  </div>
                </motion.div>
              )}

              {payState === "error" && (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
                  <div
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs"
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.25)",
                      color: "#F87171",
                      fontFamily: "var(--font-nunito)",
                    }}
                  >
                    <WarningCircle size={14} weight="bold" />
                    {errorMsg || "Transaction failed."}
                  </div>
                  <motion.button
                    onClick={() => setPayState("pick")}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-bold"
                    style={{
                      fontFamily: "var(--font-nunito)",
                      background: "rgba(167,139,250,0.12)",
                      border: "1px solid rgba(167,139,250,0.3)",
                      color: "#C4B5FD",
                    }}
                  >
                    <ArrowRight size={14} weight="bold" />
                    Try again
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
