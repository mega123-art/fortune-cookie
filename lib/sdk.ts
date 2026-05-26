import iqlabs from "@iqlabs-official/ethereum-sdk"
import { type Signer } from "ethers"

export const DB_ROOT_ID = "fortune-cookie"
export const TABLE_NAME = "fortunes"

export interface FortuneRow {
  id: string
  text: string
  luckyNumbers: string   // JSON stringified number[]
  luckyColor: string
  category: "wisdom" | "humor" | "motivation" | "mystery"
  author: string         // wallet address or "anonymous"
  timestamp: number
}

let sdkReady = false
export function initSdk() {
  if (sdkReady) return
  const envChainId = process.env.NEXT_PUBLIC_CHAIN_ID
    ? parseInt(process.env.NEXT_PUBLIC_CHAIN_ID, 10)
    : 143
  iqlabs.setNetwork(envChainId === 10143 ? "monadTestnet" : "monad")
  const rpc = process.env.NEXT_PUBLIC_MONAD_RPC_URL
  if (rpc) iqlabs.setRpcUrl(rpc)
  sdkReady = true
}

export async function fetchFortunes(limit = 200): Promise<Array<{ txHash: string; data: FortuneRow }>> {
  initSdk()
  const rows = await iqlabs.reader.readTableRows(DB_ROOT_ID, TABLE_NAME, { limit })
  return rows
    .filter((r) => r.data && typeof (r.data as FortuneRow).text === "string")
    .map((r) => ({ txHash: r.txHash, data: r.data as FortuneRow }))
}

export async function writeFortune(
  signer: Signer,
  row: FortuneRow,
  onProgress?: (pct: number) => void
): Promise<string> {
  initSdk()
  return iqlabs.writer.writeRow(signer, DB_ROOT_ID, TABLE_NAME, JSON.stringify(row), onProgress)
}
