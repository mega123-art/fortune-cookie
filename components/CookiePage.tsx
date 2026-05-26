"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowCounterClockwise, PenNib } from "@phosphor-icons/react"

import Sparkles from "./Sparkles"
import FortuneCookie, { type CookieState } from "./FortuneCookie"
import FortuneSlip from "./FortuneSlip"
import Confetti from "./Confetti"
import ShareButton from "./ShareButton"
import SoundToggle, { useSoundEngine } from "./SoundToggle"
import WalletConnect from "./WalletConnect"
import SubmitFortuneModal from "./SubmitFortuneModal"
import PaymentGate from "./PaymentGate"

import { useFortune } from "@/hooks/useFortune"
import { useHistory } from "@/hooks/useHistory"

const categoryStyle: Record<string, { bg: string; color: string }> = {
  wisdom:     { bg: "rgba(167,139,250,0.18)", color: "#C4B5FD" },
  humor:      { bg: "rgba(255,159,67,0.18)",  color: "#FF9F43" },
  motivation: { bg: "rgba(255,215,0,0.18)",   color: "#FFD700" },
  mystery:    { bg: "rgba(45,27,94,0.6)",      color: "#A78BFA" },
}

const stagger = {
  container: {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
  },
  item: {
    hidden: { opacity: 0, y: 20, scale: 0.96 },
    show:   { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 280, damping: 24 } },
  },
}

export default function CookiePage() {
  const [cookieState, setCookieState] = useState<CookieState>("idle")
  const [confettiBurst, setConfettiBurst] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [category, setCategory] = useState<string>("")
  const [submitOpen, setSubmitOpen] = useState(false)
  const [paymentGateOpen, setPaymentGateOpen] = useState(false)
  const [pendingFortune, setPendingFortune] = useState<import("@/data/fortunes").Fortune | null>(null)
  const [mounted, setMounted] = useState(false)
  const fortuneCount = useRef(0)

  useEffect(() => {
    setMounted(true)
    fortuneCount.current = parseInt(localStorage.getItem("fortune_reveal_count") ?? "0", 10)
  }, [])

  const { current: fortune, pickFortune, syncing } = useFortune()
  const { addEntry } = useHistory()
  const { playCrack, playChime } = useSoundEngine(soundEnabled)

  const doCrack = useCallback((picked: import("@/data/fortunes").Fortune) => {
    setCookieState("cracking")
    playCrack()
    setCategory(picked.category)

    setTimeout(() => {
      setCookieState("open")
      setConfettiBurst(true)
      playChime()
      setTimeout(() => setConfettiBurst(false), 100)
    }, 820)
  }, [playCrack, playChime])

  const handleCookieClick = useCallback(async () => {
    if (cookieState !== "idle") return

    const picked = await pickFortune()

    if (fortuneCount.current > 0) {
      // not first fortune — pre-pick done, show payment gate
      setPendingFortune(picked)
      setPaymentGateOpen(true)
      return
    }

    doCrack(picked)
  }, [cookieState, doCrack, pickFortune])

  const handlePaymentSuccess = useCallback(() => {
    setPaymentGateOpen(false)
    if (pendingFortune) {
      doCrack(pendingFortune)
      setPendingFortune(null)
    }
  }, [doCrack, pendingFortune])

  const handleFortuneReady = useCallback(() => {
    setCookieState("read")
    if (fortune) {
      addEntry(fortune)
      fortuneCount.current += 1
      localStorage.setItem("fortune_reveal_count", String(fortuneCount.current))
    }
  }, [fortune, addEntry])

  const handleReset = useCallback(() => {
    setCookieState("idle")
    setConfettiBurst(false)
    setCategory("")
  }, [])

  return (
    <main
      className="relative flex flex-col items-center justify-center min-h-[100dvh] px-4 py-8 overflow-hidden"
      aria-label="Fortune Cookie App"
    >
      <Sparkles />
      <Confetti trigger={confettiBurst} />

      {/* Top-right controls */}
      <div className="fixed top-5 right-5 z-20 flex items-center gap-2">
        <SoundToggle enabled={soundEnabled} onToggle={setSoundEnabled} />
      </div>

      {/* Write-your-own button — top-left */}
      <motion.button
        onClick={() => setSubmitOpen(true)}
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: mounted ? 1 : 0, x: mounted ? 0 : -12 }}
        transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.3 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.94 }}
        className="fixed top-5 left-5 z-20 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A78BFA]/60"
        style={{
          fontFamily: "var(--font-nunito)",
          background: "rgba(167,139,250,0.12)",
          border: "1px solid rgba(167,139,250,0.28)",
          color: "#C4B5FD",
          backdropFilter: "blur(8px)",
          minHeight: 36,
        }}
        aria-label="Write your own fortune"
      >
        <PenNib size={12} weight="bold" />
        Write yours
      </motion.button>

      {/* On-chain syncing indicator */}
      <AnimatePresence>
        {syncing && cookieState === "idle" && (
          <motion.div
            key="syncing"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4 }}
            className="fixed top-5 left-1/2 z-20 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
            style={{
              fontFamily: "var(--font-nunito)",
              background: "rgba(45,27,94,0.5)",
              border: "1px solid rgba(167,139,250,0.2)",
              color: "rgba(196,181,253,0.7)",
              backdropFilter: "blur(8px)",
            }}
          >
            <span
              style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "#A78BFA",
                display: "inline-block",
                animation: "pulse 1.2s ease-in-out infinite",
              }}
            />
            Syncing on-chain fortunes
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category badge */}
      <AnimatePresence>
        {category && (cookieState === "open" || cookieState === "read") && (
          <motion.div
            key="category"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed top-5 left-1/2 z-20 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs uppercase tracking-widest font-semibold"
            style={{
              fontFamily: "var(--font-nunito)",
              background: categoryStyle[category]?.bg ?? "rgba(167,139,250,0.18)",
              color: categoryStyle[category]?.color ?? "#C4B5FD",
              border: `1px solid ${categoryStyle[category]?.color ?? "#C4B5FD"}44`,
              backdropFilter: "blur(8px)",
            }}
          >
            {category}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content — staggered entrance on mount */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-8 w-full max-w-md"
        variants={stagger.container}
        initial="hidden"
        animate={mounted ? "show" : "hidden"}
      >

        {/* Title */}
        <AnimatePresence>
          {cookieState === "idle" && (
            <motion.h1
              key="title"
              variants={stagger.item}
              exit={{ opacity: 0, y: -12 }}
              className="text-4xl md:text-5xl tracking-tight text-center leading-none"
              style={{ fontFamily: "var(--font-fredoka)", color: "#FFF5E4", fontWeight: 600 }}
            >
              Fortune Cookie
            </motion.h1>
          )}
        </AnimatePresence>

        {/* Cookie */}
        <motion.div
          variants={stagger.item}
          className="relative"
          style={{ display: "inline-block" }}
        >
          <div
            className={cookieState === "idle" ? "animate-float" : ""}
            style={{
              filter: cookieState === "idle" ? "drop-shadow(0 0 28px #FF9F43aa)" : "none",
              transition: "filter 0.3s",
            }}
          >
            <FortuneCookie state={cookieState} onClick={handleCookieClick} />
          </div>
          {/* Lock badge — shows when payment required */}
          <AnimatePresence>
            {mounted && fortuneCount.current > 0 && cookieState === "idle" && (
              <motion.div
                key="lock-badge"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ type: "spring", stiffness: 340, damping: 22 }}
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold pointer-events-none"
                style={{
                  fontFamily: "var(--font-nunito)",
                  background: "rgba(255,215,0,0.15)",
                  border: "1px solid rgba(255,215,0,0.4)",
                  color: "#FFD700",
                  backdropFilter: "blur(6px)",
                  whiteSpace: "nowrap",
                }}
              >
                🔒 0.001 MON
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Hint text */}
        <AnimatePresence>
          {cookieState === "idle" && (
            <motion.p
              key="hint"
              variants={stagger.item}
              exit={{ opacity: 0 }}
              className="animate-text-pulse text-center text-sm"
              style={{ fontFamily: "var(--font-nunito)", color: "#C4B5FD", letterSpacing: "0.04em" }}
            >
              Click to reveal your fortune
            </motion.p>
          )}
          {cookieState === "cracking" && (
            <motion.p
              key="cracking"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-sm"
              style={{ fontFamily: "var(--font-nunito)", color: "#FF9F43" }}
            >
              The universe is deciding…
            </motion.p>
          )}
        </AnimatePresence>

        {/* Fortune slip */}
        <AnimatePresence mode="wait">
          {(cookieState === "open" || cookieState === "read") && fortune && (
            <motion.div
              key={fortune.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className={cookieState === "read" ? "animate-float-slip w-full" : "w-full"}
            >
              <FortuneSlip
                fortune={fortune}
                active={cookieState === "open" || cookieState === "read"}
                onDone={handleFortuneReady}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        <AnimatePresence>
          {cookieState === "read" && fortune && (
            <motion.div
              key="actions"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ type: "spring", stiffness: 300, damping: 28, delay: 0.1 }}
              className="flex flex-col items-center gap-4 w-full"
            >
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <motion.button
                  onClick={handleReset}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96, y: 1 }}
                  className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF9F43]/60"
                  style={{
                    fontFamily: "var(--font-nunito)",
                    background: "linear-gradient(135deg, #FF9F43, #E8820A)",
                    color: "#1A1033",
                    boxShadow: "0 0 20px rgba(255,159,67,0.35)",
                    minHeight: 44,
                  }}
                >
                  <ArrowCounterClockwise weight="bold" size={16} />
                  Get Another
                </motion.button>
                <ShareButton fortune={fortune} />
              </div>
              <WalletConnect fortune={fortune} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <PaymentGate
        open={paymentGateOpen}
        authorAddress={pendingFortune?.author}
        onClose={() => { setPaymentGateOpen(false); setPendingFortune(null) }}
        onPaid={handlePaymentSuccess}
      />

      <SubmitFortuneModal
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        onSubmitted={() => {
          setSubmitOpen(false)
          setConfettiBurst(true)
          setTimeout(() => setConfettiBurst(false), 100)
        }}
      />

      <footer
        className="fixed bottom-3 left-0 right-0 text-center z-10"
        style={{
          fontFamily: "var(--font-nunito)",
          fontSize: "0.7rem",
          color: "rgba(196,181,253,0.4)",
        }}
      >
        Built on{" "}
        <a
          href="https://faucet.monad.xyz"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "rgba(167,139,250,0.6)", textDecoration: "underline" }}
        >
          Monad Testnet
        </a>
        {" "}— Get free MON at the{" "}
        <a
          href="https://faucet.monad.xyz"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "rgba(167,139,250,0.6)", textDecoration: "underline" }}
        >
          faucet
        </a>
      </footer>
    </main>
  )
}
