import { Suspense } from "react"
import { AIHealthMain } from "@/components/ai-health-main"
import { Skeleton } from "@/components/ui/skeleton"

function AIHealthLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <Skeleton className="h-12 w-96 mx-auto" />
        <Skeleton className="h-6 w-64 mx-auto" />
        <Skeleton className="h-32 w-full max-w-2xl mx-auto" />
        <div className="grid md:grid-cols-4 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    </div>
  )
}

export default function AIHealthPage() {
  return (
    <Suspense fallback={<AIHealthLoading />}>
      <AIHealthMain />
    </Suspense>
  )
}
