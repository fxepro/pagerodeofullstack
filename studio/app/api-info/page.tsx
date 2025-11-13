import { Suspense } from "react"
import { ApiInfoMain } from "@/components/api-info-main"
import { Skeleton } from "@/components/ui/skeleton"

function ApiInfoLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <Skeleton className="h-12 w-96 mx-auto" />
        <Skeleton className="h-6 w-64 mx-auto" />
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  )
}

export default function ApiInfoPage() {
  return (
    <Suspense fallback={<ApiInfoLoading />}>
      <ApiInfoMain />
    </Suspense>
  )
}
