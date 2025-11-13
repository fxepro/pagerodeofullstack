import { Suspense } from "react"
import { DetailedResultsContent } from "@/components/detailed-results-content"
import { Skeleton } from "@/components/ui/skeleton"

function DetailedResultsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3">
      <div className="bg-gradient-to-r from-palette-primary to-palette-primary-hover text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <Skeleton className="h-6 w-64 bg-palette-accent-1 mx-auto mb-6" />
            <Skeleton className="h-8 w-80 bg-palette-accent-2 mx-auto mb-4" />
            <Skeleton className="h-4 w-96 bg-palette-accent-1 mx-auto" />
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  )
}

export default function DetailedResultsPage() {
  return (
    <Suspense fallback={<DetailedResultsLoading />}>
      <DetailedResultsContent />
    </Suspense>
  )
}
