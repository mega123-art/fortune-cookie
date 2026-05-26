/**
 * One-time admin setup: initialize DB root and create the fortunes table.
 * Run once:
 *   ADMIN_PRIVATE_KEY=0x... npm run init-table
 */
import iqlabs from "@iqlabs-official/ethereum-sdk"
import { Wallet, JsonRpcProvider } from "ethers"

const DB_ROOT_ID = "fortune-cookie"
const TABLE_NAME = "fortunes"

async function main() {
  const pk = process.env.ADMIN_PRIVATE_KEY
  if (!pk) throw new Error("Set ADMIN_PRIVATE_KEY env var")

  iqlabs.setNetwork("monad")
  const provider = new JsonRpcProvider("https://rpc.monad.xyz")
  const signer = new Wallet(pk, provider)
  const address = await signer.getAddress()
  console.log("Admin:", address)
  const balance = await provider.getBalance(address)
  console.log("Balance:", Number(balance) / 1e18, "MON")

  try {
    console.log(`Initializing DB root "${DB_ROOT_ID}"…`)
    const rootTx = await iqlabs.writer.initializeDbRoot(signer, DB_ROOT_ID)
    console.log("DB root tx:", rootTx)
    await provider.waitForTransaction(rootTx)
  } catch {
    console.log("DB root already exists, skipping.")
  }

  try {
    console.log(`Creating table "${TABLE_NAME}"…`)
    const tableTx = await iqlabs.writer.createTable(
      signer,
      DB_ROOT_ID,
      TABLE_NAME,
      ["id", "text", "luckyNumbers", "luckyColor", "category", "author", "timestamp"],
      "timestamp"
    )
    console.log("Table tx:", tableTx)
    await provider.waitForTransaction(tableTx)
    console.log("Table created.")
  } catch {
    console.log("Table already exists, skipping.")
  }

  console.log("Done — fortune-cookie IQDB is ready.")
}

main().catch((err) => { console.error(err); process.exit(1) })
