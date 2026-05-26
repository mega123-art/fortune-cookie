import { BrowserProvider } from "ethers"
import { MONAD, FORTUNE_PRICE_WEI, FORTUNE_HALF_PRICE_WEI } from "./monad"

export type WalletType = "metamask" | "phantom"

type EIP1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  on: (event: string, handler: (...args: unknown[]) => void) => void
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void
  isMetaMask?: boolean
  isPhantom?: boolean
}

declare global {
  interface Window {
    ethereum?: EIP1193Provider & { providers?: EIP1193Provider[] }
    phantom?: { ethereum?: EIP1193Provider }
  }
}

export function detectWallets(): { metamask: boolean; phantom: boolean } {
  if (typeof window === "undefined") return { metamask: false, phantom: false }
  // EIP-5749: when multiple wallets coexist, each injects into window.ethereum.providers
  if (window.ethereum?.providers?.length) {
    return {
      metamask: window.ethereum.providers.some(p => p.isMetaMask && !p.isPhantom),
      phantom: !!window.phantom?.ethereum || window.ethereum.providers.some(p => p.isPhantom),
    }
  }
  const phantomDedicated = !!window.phantom?.ethereum
  const phantomViaEthereum = !!(window.ethereum?.isPhantom)
  return {
    metamask: !!(window.ethereum?.isMetaMask) && !phantomViaEthereum,
    phantom: phantomDedicated || phantomViaEthereum,
  }
}

function getRawProvider(type: WalletType): EIP1193Provider {
  if (type === "metamask") {
    // Prefer the specific MetaMask entry in the multi-wallet providers array
    if (window.ethereum?.providers?.length) {
      const mm = window.ethereum.providers.find(p => p.isMetaMask && !p.isPhantom)
      if (mm) return mm
    }
    if (window.ethereum?.isMetaMask) return window.ethereum
    throw new Error("MetaMask not found. Install MetaMask.")
  }
  // phantom
  const p = window.phantom?.ethereum ?? (window.ethereum?.isPhantom ? window.ethereum : null)
  if (!p) throw new Error("Phantom not found. Install Phantom.")
  return p
}

export function getProviderForWallet(type: WalletType): BrowserProvider {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new BrowserProvider(getRawProvider(type) as any)
}

export async function ensureMonad(provider: BrowserProvider): Promise<void> {
  const net = await provider.getNetwork()
  if (Number(net.chainId) === MONAD.chainId) return

  const chainParams = {
    chainId: MONAD.chainIdHex,
    chainName: MONAD.name,
    rpcUrls: [MONAD.rpcUrl],
    nativeCurrency: MONAD.currency,
    blockExplorerUrls: [MONAD.explorerUrl],
  }

  try {
    await provider.send("wallet_switchEthereumChain", [{ chainId: MONAD.chainIdHex }])
  } catch (switchErr: unknown) {
    // 4902 = chain not added yet
    const code = (switchErr as { code?: number })?.code
    if (code !== 4902) throw switchErr
    await provider.send("wallet_addEthereumChain", [chainParams])
    // After adding, switch to it explicitly
    await provider.send("wallet_switchEthereumChain", [{ chainId: MONAD.chainIdHex }])
  }

  // Verify switch succeeded
  const net2 = await provider.getNetwork()
  if (Number(net2.chainId) !== MONAD.chainId) {
    throw new Error("Please switch to Monad network in your wallet.")
  }
}

export async function connectWallet(type: WalletType = "metamask"): Promise<string> {
  const provider = getProviderForWallet(type)
  await provider.send("eth_requestAccounts", [])
  await ensureMonad(provider)
  const signer = await provider.getSigner()
  return signer.address
}

export interface PayResult {
  treasuryTxHash: string
  authorTxHash?: string
}

function isValidAddress(addr: string | undefined): boolean {
  return !!addr && addr !== "anonymous" && /^0x[0-9a-fA-F]{40}$/.test(addr)
}

export async function payForFortune(
  treasuryAddress: string,
  authorAddress: string | undefined,
  type: WalletType = "metamask"
): Promise<PayResult> {
  const provider = getProviderForWallet(type)
  await provider.send("eth_requestAccounts", [])
  await ensureMonad(provider)
  const signer = await provider.getSigner()

  if (isValidAddress(authorAddress)) {
    const authorTx = await signer.sendTransaction({
      to: authorAddress!,
      value: FORTUNE_HALF_PRICE_WEI,
    })
    await authorTx.wait()

    const treasuryTx = await signer.sendTransaction({
      to: treasuryAddress,
      value: FORTUNE_HALF_PRICE_WEI,
    })
    await treasuryTx.wait()

    return { treasuryTxHash: treasuryTx.hash, authorTxHash: authorTx.hash }
  }

  const tx = await signer.sendTransaction({
    to: treasuryAddress,
    value: FORTUNE_PRICE_WEI,
  })
  await tx.wait()
  return { treasuryTxHash: tx.hash }
}

export async function inscribeFortuneOnChain(
  fortuneId: number,
  fortuneText: string,
  type: WalletType = "metamask"
): Promise<string> {
  const provider = getProviderForWallet(type)
  await provider.send("eth_requestAccounts", [])
  await ensureMonad(provider)
  const signer = await provider.getSigner()

  const data =
    "0x" +
    Buffer.from(JSON.stringify({ fortuneId, text: fortuneText.slice(0, 80) })).toString("hex")

  const tx = await signer.sendTransaction({
    to: await signer.getAddress(),
    value: BigInt(0),
    data,
  })

  return tx.hash
}
