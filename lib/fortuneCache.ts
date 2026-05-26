import { fetchFortunes, type FortuneRow } from "./sdk"
import { fortunes as localFortunes } from "@/data/fortunes"

interface Cache {
  rows: FortuneRow[]
  seenHashes: Set<string>
  lastRefresh: number
  ready: boolean
}

const REFRESH_INTERVAL_MS = 60_000

// Seed local fortunes immediately so cache is usable before RPC resolves
const cache: Cache = {
  rows: localToFortuneRow(),
  seenHashes: new Set(),
  lastRefresh: 0,
  ready: true,
}

// Track on-chain sync separately so UI can show syncing state
export let onChainSyncing = true

let initPromise: Promise<void> | null = null

function localToFortuneRow(): FortuneRow[] {
  return localFortunes.map((f) => ({
    id: String(f.id),
    text: f.text,
    luckyNumbers: JSON.stringify(f.luckyNumbers),
    luckyColor: f.luckyColor,
    category: f.category,
    author: "anonymous",
    timestamp: 0,
  }))
}

function merge(txHash: string, data: FortuneRow): boolean {
  if (cache.seenHashes.has(txHash)) return false
  cache.seenHashes.add(txHash)
  cache.rows.push(data)
  return true
}

async function load() {
  try {
    const rows = await fetchFortunes(200)
    for (const { txHash, data } of rows) merge(txHash, data)
    cache.rows.sort((a, b) => b.timestamp - a.timestamp)
    cache.lastRefresh = Date.now()
    console.log(`[fortuneCache] loaded ${cache.rows.length} on-chain fortunes`)
  } catch (err) {
    console.warn("[fortuneCache] fetch failed, using local fallback:", err)
  } finally {
    onChainSyncing = false
  }
}

// Start loading on-chain fortunes immediately on module init (non-blocking)
initPromise = load()

export async function getCache(): Promise<Cache> {
  // refresh every 60s after initial load
  if (cache.lastRefresh > 0 && Date.now() - cache.lastRefresh > REFRESH_INTERVAL_MS) {
    load().catch(() => {})
  }
  return cache
}

export async function getRandomFortune(): Promise<FortuneRow> {
  const c = await getCache()
  const pool = c.rows.length > 0 ? c.rows : localToFortuneRow()
  return pool[Math.floor(Math.random() * pool.length)]
}

export function upsertFortune(txHash: string, row: FortuneRow) {
  merge(txHash, row)
}
