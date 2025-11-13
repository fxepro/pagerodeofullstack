import { Suspense } from "react"
import { MonitorContent } from "@/components/monitor-content"
import { Skeleton } from "@/components/ui/skeleton"

function MonitorLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <Skeleton className="h-12 w-96" />
        <Skeleton className="h-6 w-64" />
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
}

export default function MonitorPage() {
  return (
    <Suspense fallback={<MonitorLoading />}>
      <MonitorContent />
    </Suspense>
  )
}

