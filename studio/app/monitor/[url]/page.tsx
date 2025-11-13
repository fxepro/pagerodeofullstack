import { Suspense } from "react"
import { MonitorReport } from "@/components/monitor-report"
import { Skeleton } from "@/components/ui/skeleton"

function MonitorReportLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid md:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  )
}

interface MonitorPageProps {
  params: Promise<{
    url: string
  }>
}

export default async function MonitorDetailPage({ params }: MonitorPageProps) {
  const { url } = await params
  const decodedUrl = decodeURIComponent(url)
  
  return (
    <Suspense fallback={<MonitorReportLoading />}>
      <MonitorReport url={decodedUrl} />
    </Suspense>
  )
}
