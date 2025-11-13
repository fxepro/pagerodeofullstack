import { Suspense } from "react"
import { ResultsContent } from "@/components/results-content"

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-palette-primary mx-auto mb-4"></div>
        <p className="text-slate-600">Loading analysis results...</p>
      </div>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResultsContent />
    </Suspense>
  )
}
