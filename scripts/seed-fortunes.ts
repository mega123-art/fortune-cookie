/**
 * Bulk-write all 50 starter fortunes to IQDB on Monad Testnet.
 * Run once after init-table:
 *   ADMIN_PRIVATE_KEY=0x... npm run seed-fortunes
 */
import iqlabs from "@iqlabs-official/ethereum-sdk"
import { Wallet, JsonRpcProvider } from "ethers"
import { fortunes } from "../data/fortunes"

const DB_ROOT_ID = "fortune-cookie"
const TABLE_NAME = "fortunes"

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  const pk = process.env.ADMIN_PRIVATE_KEY
  if (!pk) throw new Error("Set ADMIN_PRIVATE_KEY env var")

  iqlabs.setNetwork("monad")
  const provider = new JsonRpcProvider("https://rpc.monad.xyz")
  const signer = new Wallet(pk, provider)
  const address = await signer.getAddress()
  console.log("Seeder:", address)
  console.log(`Seeding ${fortunes.length} fortunes into "${DB_ROOT_ID}/${TABLE_NAME}"…\n`)

  let success = 0
  let failed = 0

  for (const f of fortunes) {
    const row = {
      id: String(f.id),
      text: f.text,
      luckyNumbers: JSON.stringify(f.luckyNumbers),
      luckyColor: f.luckyColor,
      category: f.category,
      author: "anonymous",
      timestamp: Date.now(),
    }

    try {
      process.stdout.write(`  [${f.id.toString().padStart(2, "0")}] ${f.text.slice(0, 50)}… `)
      const txHash = await iqlabs.writer.writeRow(
        signer,
        DB_ROOT_ID,
        TABLE_NAME,
        JSON.stringify(row)
      )
      await provider.waitForTransaction(txHash)
      console.log(`✓ ${txHash.slice(0, 12)}…`)
      success++
      await sleep(500)  // avoid nonce collisions
    } catch (err) {
      console.error(`✗ ${err instanceof Error ? err.message : err}`)
      failed++
      await sleep(1000)
    }
  }

  console.log(`\nDone. ${success} written, ${failed} failed.`)
  if (failed > 0) process.exit(1)
}

main().catch((err) => { console.error(err); process.exit(1) })
