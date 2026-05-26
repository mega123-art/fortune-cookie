"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ArrowSquareOut, Sparkle } from "@phosphor-icons/react"
import { type Signer } from "ethers"
import { writeFortune, type FortuneRow } from "@/lib/sdk"
import { upsertFortune } from "@/lib/fortuneCache"
import { getProviderForWallet, ensureMonadTestnet, type WalletType } from "@/lib/wallet"
import { MONAD_TESTNET } from "@/lib/monad"
import WalletPicker from "./WalletPicker"

type SubmitStatus = "pick" | "connecting" | "writing" | "done" | "error"
type Category = "wisdom" | "humor" | "motivation" | "mystery"

const CATEGORIES: Category[] = ["wisdom", "humor", "motivation", "mystery"]

interface Props {
  open: boolean
  onClose: () => void
  onSubmitted?: () => void
}

export default function SubmitFortuneModal({ open, onClose, onSubmitted }: Props) {
  const [text, setText] = useState("")
  const [category, setCategory] = useState<Category>("wisdom")
  const [status, setStatus] = useState<SubmitStatus>("pick")
  const [txHash, setTxHash] = useState("")
  const [error, setError] = useState("")
  const [progress, setProgress] = useState(0)

  const remaining = 100 - text.length

  const handleWalletSelect = useCallback(async (type: WalletType) => {
    if (!text.trim() || text.length > 100) return

    setStatus("connecting")
    setError("")
    setProgress(0)

    let signer: Signer
    try {
      const provider = getProviderForWallet(type)
      await ensureMonadTestnet(provider)
      signer = await provider.getSigner()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Wallet connection failed")
      setStatus("error")
      return
    }

    setStatus("writing")
    const address = await (signer as Signer & { getAddress(): Promise<string> }).getAddress()

    const row: FortuneRow = {
      id: `${address.slice(2, 10)}-${Date.now()}`,
      text: text.trim(),
      luckyNumbers: JSON.stringify(
        Array.from({ length: 4 }, () => Math.floor(Math.random() * 99) + 1)
      ),
      luckyColor: "Gold",
      category,
      author: address,
      timestamp: Date.now(),
    }

    try {
      const hash = await writeFortune(signer, row, (pct) => setProgress(Math.round(pct)))
      upsertFortune(hash, row)
      setTxHash(hash)
      setStatus("done")
      onSubmitted?.()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Transaction failed")
      setStatus("error")
    }
  }, [text, category, onSubmitted])

  const handleClose = () => {
    if (status === "writing" || status === "connecting") return
    setText("")
    setCategory("wisdom")
    setStatus("pick")
    setTxHash("")
    setError("")
    setProgress(0)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50"
            style={{ background: "rgba(13,8,33,0.8)", backdropFilter: "blur(6px)" }}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ pointerEvents: "none" }}
          >
            <div
              className="w-full max-w-md rounded-2xl p-6"
              style={{
                background: "#2D1B5E",
                border: "1px solid rgba(167,139,250,0.25)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
                pointerEvents: "auto",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h2
                  className="text-xl font-semibold flex items-center gap-2"
                  style={{ fontFamily: "var(--font-fredoka)", color: "#FFF5E4" }}
                >
                  <Sparkle size={18} weight="fill" color="#FFD700" />
                  Write Your Fortune
                </h2>
                <button
                  onClick={handleClose}
                  disabled={status === "writing" || status === "connecting"}
                  className="w-8 h-8 flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A78BFA] disabled:opacity-40"
                  style={{ color: "#C4B5FD", background: "rgba(167,139,250,0.1)" }}
                  aria-label="Close modal"
                >
                  <X size={16} />
                </button>
              </div>

              {status !== "done" ? (
                <>
                  {/* Text input */}
                  <div className="mb-4">
                    <label
                      htmlFor="fortune-text"
                      className="block text-xs uppercase tracking-widest mb-2"
                      style={{ fontFamily: "var(--font-nunito)", color: "#C4B5FD" }}
                    >
                      Your Fortune
                    </label>
                    <textarea
                      id="fortune-text"
                      value={text}
                      onChange={(e) => setText(e.target.value.slice(0, 100))}
                      placeholder="Wisdom comes to those who wait… and eat cookies."
                      rows={3}
                      className="w-full resize-none rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A78BFA]/60"
                      style={{
                        fontFamily: "var(--font-nunito)",
                        background: "rgba(26,16,51,0.6)",
                        border: "1px solid rgba(167,139,250,0.25)",
                        color: "#FFF5E4",
                        caretColor: "#A78BFA",
                      }}
                      disabled={status !== "pick" && status !== "error"}
                    />
                    <div
                      className="text-right text-xs mt-1"
                      style={{
                        fontFamily: "var(--font-vt323)",
                        color: remaining < 20 ? "#FF9F43" : "#C4B5FD88",
                        fontSize: "0.9rem",
                      }}
                    >
                      {remaining} chars left
                    </div>
                  </div>

                  {/* Category */}
                  <div className="mb-5">
                    <label
                      className="block text-xs uppercase tracking-widest mb-2"
                      style={{ fontFamily: "var(--font-nunito)", color: "#C4B5FD" }}
                    >
                      Category
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {CATEGORIES.map((c) => (
                        <button
                          key={c}
                          onClick={() => setCategory(c)}
                          disabled={status !== "pick" && status !== "error"}
                          className="py-2 px-3 rounded-xl text-xs font-semibold capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A78BFA] disabled:opacity-40"
                          style={{
                            fontFamily: "var(--font-nunito)",
                            background:
                              category === c
                                ? "rgba(167,139,250,0.25)"
                                : "rgba(26,16,51,0.4)",
                            border:
                              category === c
                                ? "1px solid rgba(167,139,250,0.5)"
                                : "1px solid rgba(167,139,250,0.12)",
                            color: category === c ? "#C4B5FD" : "#7A6B9A",
                          }}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <AnimatePresence>
                    {status === "writing" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4"
                      >
                        <div
                          className="h-1.5 rounded-full overflow-hidden"
                          style={{ background: "rgba(167,139,250,0.15)" }}
                        >
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: "linear-gradient(90deg, #A78BFA, #FFD700)" }}
                            initial={{ width: "0%" }}
                            animate={{ width: `${progress}%` }}
                            transition={{ ease: "easeOut" }}
                          />
                        </div>
                        <p
                          className="text-xs text-center mt-1"
                          style={{ fontFamily: "var(--font-nunito)", color: "#C4B5FD" }}
                        >
                          Inscribing on Monad… {progress}%
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Error */}
                  {status === "error" && (
                    <p
                      className="text-xs mb-4 text-center"
                      style={{ color: "#FC8181", fontFamily: "var(--font-nunito)" }}
                    >
                      {error}
                    </p>
                  )}

                  {/* Submit — wallet picker or loading state */}
                  {(status === "pick" || status === "error") ? (
                    <div style={{ opacity: !text.trim() || text.length > 100 ? 0.4 : 1, pointerEvents: !text.trim() || text.length > 100 ? "none" : "auto" }}>
                      <WalletPicker onSelect={handleWalletSelect} label="Immortalize with" />
                    </div>
                  ) : (
                    <div
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
                      style={{
                        fontFamily: "var(--font-nunito)",
                        background: "rgba(255,159,67,0.12)",
                        border: "1px solid rgba(255,159,67,0.3)",
                        color: "#FF9F43",
                        minHeight: 44,
                      }}
                    >
                      <span className="animate-spin inline-block w-3 h-3 border-2 border-[#FF9F43] border-t-transparent rounded-full" />
                      {status === "connecting" ? "Connecting wallet…" : "Writing to chain…"}
                    </div>
                  )}
                </>
              ) : (
                /* Success state */
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-4 py-4 text-center"
                >
                  <div
                    className="text-5xl"
                    style={{ fontFamily: "var(--font-vt323)" }}
                    aria-hidden
                  >
                    🥠
                  </div>
                  <p
                    className="text-base font-semibold"
                    style={{ fontFamily: "var(--font-fredoka)", color: "#FFF5E4" }}
                  >
                    Your fortune is now immortal on Monad
                  </p>
                  <p
                    className="text-sm italic px-4"
                    style={{ fontFamily: "var(--font-nunito)", color: "#C4B5FD" }}
                  >
                    &ldquo;{text}&rdquo;
                  </p>
                  {txHash && (
                    <a
                      href={`${MONAD_TESTNET.explorerUrl}/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs underline underline-offset-2 focus-visible:outline-none"
                      style={{ color: "#A78BFA", fontFamily: "var(--font-nunito)" }}
                    >
                      <ArrowSquareOut size={12} />
                      {txHash.slice(0, 12)}…{txHash.slice(-8)}
                    </a>
                  )}
                  <button
                    onClick={handleClose}
                    className="mt-2 px-6 py-2.5 rounded-full text-sm font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF9F43]/60"
                    style={{
                      fontFamily: "var(--font-nunito)",
                      background: "linear-gradient(135deg, #FF9F43, #E8820A)",
                      color: "#1A1033",
                      minHeight: 44,
                      fontWeight: 700,
                    }}
                  >
                    Close
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
