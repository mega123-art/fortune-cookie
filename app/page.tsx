import { type Metadata } from "next"
import CookiePage from "@/components/CookiePage"
import { fortunes } from "@/data/fortunes"

interface Props {
  searchParams: Promise<{ id?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { id } = await searchParams
  const fortune = id ? fortunes.find((f) => f.id === Number(id)) : undefined
  if (!fortune) {
    const defaultParams = new URLSearchParams({
      fortune: "Crack open a fortune cookie to reveal your message from the universe.",
      numbers: "7 · 14 · 21",
      emoji: "✨",
    })
    const defaultImage = `/api/og?${defaultParams.toString()}`
    return {
      openGraph: {
        images: [defaultImage],
      },
      twitter: {
        images: [defaultImage],
      },
    }
  }

  const ogParams = new URLSearchParams({
    fortune: fortune.text,
    numbers: fortune.luckyNumbers.join(" · "),
    emoji: fortune.luckyEmoji,
  })

  const title = `🥠 "${fortune.text}"`
  const description = "The IQ Fortune Cookie has spoken. Crack yours open."

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [`/api/og?${ogParams.toString()}`],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/api/og?${ogParams.toString()}`],
    },
  }
}

export default function Home() {
  return <CookiePage />
}
