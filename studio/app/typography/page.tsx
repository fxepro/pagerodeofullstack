import { Suspense } from "react"
import { TypographyMain } from "@/components/typography-main"

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-palette-primary mx-auto mb-4"></div>
        <p className="text-slate-600">Loading...</p>
      </div>
    </div>
  )
}

export default function TypographyPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TypographyMain />
    </Suspense>
  )
}

