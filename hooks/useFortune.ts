"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { type Fortune, fortunes as localFortunes } from "@/data/fortunes"
import { getRandomFortune, onChainSyncing } from "@/lib/fortuneCache"
import { type FortuneRow } from "@/lib/sdk"

const categoryEmoji: Record<string, string> = {
  wisdom:     "🌿",
  humor:      "😄",
  motivation: "🔥",
  mystery:    "🌌",
}

function adaptRow(row: FortuneRow): Fortune {
  const nums = (() => {
    try { return JSON.parse(row.luckyNumbers) as number[] }
    catch { return [7, 14, 21] }
  })()
  return {
    id: typeof row.id === "number" ? row.id : parseInt(row.id, 10) || Math.random() * 9999 | 0,
    text: row.text,
    luckyNumbers: nums,
    luckyColor: row.luckyColor || "Gold",
    luckyEmoji: categoryEmoji[row.category] ?? "✨",
    category: row.category,
    author: row.author,
  }
}

export function useFortune() {
  const [current, setCurrent] = useState<Fortune | null>(null)
  const seenIds = useRef<Set<string>>(new Set())
  // Poll onChainSyncing flag until on-chain load finishes
  const [syncing, setSyncing] = useState(onChainSyncing)

  useEffect(() => {
    if (!onChainSyncing) return
    const id = setInterval(() => {
      if (!onChainSyncing) {
        setSyncing(false)
        clearInterval(id)
      }
    }, 300)
    return () => clearInterval(id)
  }, [])

  const pickFortune = useCallback(async (): Promise<Fortune> => {
    try {
      const row = await getRandomFortune()
      const adapted = adaptRow(row)
      setCurrent(adapted)
      return adapted
    } catch {
      const unseen = localFortunes.filter((f) => !seenIds.current.has(String(f.id)))
      const pool = unseen.length > 0 ? unseen : localFortunes
      const pick = pool[Math.floor(Math.random() * pool.length)]
      seenIds.current.add(String(pick.id))
      if (seenIds.current.size >= localFortunes.length) seenIds.current.clear()
      setCurrent(pick)
      return pick
    }
  }, [])

  return { current, pickFortune, syncing }
}
