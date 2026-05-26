const envChainId = process.env.NEXT_PUBLIC_CHAIN_ID
  ? parseInt(process.env.NEXT_PUBLIC_CHAIN_ID, 10)
  : 143

const isTestnet = envChainId === 10143

export const MONAD = {
  chainId: envChainId,
  chainIdHex: "0x" + envChainId.toString(16).toLowerCase(),
  name: isTestnet ? "Monad Testnet" : "Monad",
  rpcUrl: process.env.NEXT_PUBLIC_MONAD_RPC_URL ?? (isTestnet ? "https://testnet-rpc.monad.xyz" : "https://rpc.monad.xyz"),
  explorerUrl: isTestnet ? "https://testnet.monadexplorer.com" : "https://monadvision.com",
  currency: { name: "MON", symbol: "MON", decimals: 18 },
} as const

// 10 MON in wei
export const FORTUNE_PRICE_WEI = BigInt("10000000000000000000")
export const FORTUNE_HALF_PRICE_WEI = BigInt("5000000000000000000")
export const FORTUNE_PRICE_DISPLAY = "10 MON"

// Treasury wallet that receives fortune payments
export const TREASURY_ADDRESS =
  (process.env.NEXT_PUBLIC_TREASURY_ADDRESS as string) ??
  "0x76ce2c5F3C50e9074C4342BE37d7a90CAC30829c"
