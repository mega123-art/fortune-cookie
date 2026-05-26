import { BrowserProvider } from "ethers"
import { MONAD, FORTUNE_PRICE_WEI, FORTUNE_HALF_PRICE_WEI } from "./monad"

export type WalletType = "metamask" | "phantom"

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
      on: (event: string, handler: (...args: unknown[]) => void) => void
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void
      isMetaMask?: boolean
      isPhantom?: boolean
    }
    phantom?: {
      ethereum?: {
        request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
        on: (event: string, handler: (...args: unknown[]) => void) => void
        removeListener: (event: string, handler: (...args: unknown[]) => void) => void
        isPhantom?: boolean
      }
    }
  }
}

export function detectWallets(): { metamask: boolean; phantom: boolean } {
  if (typeof window === "undefined") return { metamask: false, phantom: false }
  const phantomDedicated = !!window.phantom?.ethereum
  const phantomViaEthereum = !!(window.ethereum?.isPhantom)
  const metamask = !!(window.ethereum?.isMetaMask) && !phantomViaEthereum
  return {
    metamask,
    phantom: phantomDedicated || phantomViaEthereum,
  }
}

export function getProviderForWallet(type: WalletType): BrowserProvider {
  if (type === "phantom") {
    const provider = window.phantom?.ethereum ?? (window.ethereum?.isPhantom ? window.ethereum : null)
    if (!provider) throw new Error("Phantom wallet not found. Install Phantom.")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new BrowserProvider(provider as any)
  }
  if (!window.ethereum) throw new Error("No wallet detected. Install MetaMask.")
  return new BrowserProvider(window.ethereum)
}

export async function ensureMonad(provider: BrowserProvider): Promise<void> {
  const net = await provider.getNetwork()
  if (Number(net.chainId) === MONAD.chainId) return
  try {
    await provider.send("wallet_switchEthereumChain", [{ chainId: MONAD.chainIdHex }])
  } catch {
    await provider.send("wallet_addEthereumChain", [
      {
        chainId: MONAD.chainIdHex,
        chainName: MONAD.name,
        rpcUrls: [MONAD.rpcUrl],
        nativeCurrency: MONAD.currency,
        blockExplorerUrls: [MONAD.explorerUrl],
      },
    ])
  }
}

export async function connectWallet(type: WalletType = "metamask"): Promise<string> {
  const provider = getProviderForWallet(type)
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
