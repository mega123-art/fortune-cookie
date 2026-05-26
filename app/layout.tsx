import type { Metadata, Viewport } from "next"
import { Fredoka, Nunito, VT323 } from "next/font/google"
import "./globals.css"

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "600"],
})

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

const vt323 = VT323({
  variable: "--font-vt323",
  subsets: ["latin"],
  weight: "400",
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://fortune-cookie-plum.vercel.app"

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: "Fortune Cookie — Crack Your Destiny",
  description:
    "Click to crack open a fortune cookie and reveal your message from the universe. With on-chain inscriptions on Monad.",
  openGraph: {
    title: "Fortune Cookie — Crack Your Destiny",
    description: "Your fortune awaits.",
    images: ["/api/og?fortune=Crack+open+a+fortune+cookie+to+reveal+your+message+from+the+universe.&numbers=7+·+14+·+21&emoji=✨"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fortune Cookie — Crack Your Destiny",
    description: "Your fortune awaits.",
    images: ["/api/og?fortune=Crack+open+a+fortune+cookie+to+reveal+your+message+from+the+universe.&numbers=7+·+14+·+21&emoji=✨"],
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1A1033",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fredoka.variable} ${nunito.variable} ${vt323.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
