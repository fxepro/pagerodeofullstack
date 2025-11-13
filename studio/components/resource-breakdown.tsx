"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface Resource {
  name: string
  type: string
  size: number
  startTime: number
  duration: number
  status: number
}

interface ResourceBreakdownProps {
  resources: Resource[]
}

export function ResourceBreakdown({ resources }: ResourceBreakdownProps) {
  const totalSize = resources.reduce((sum, r) => sum + r.size, 0)

  // Group resources by type
  const resourcesByType = resources.reduce(
    (acc, resource) => {
      if (!acc[resource.type]) {
        acc[resource.type] = { count: 0, size: 0, resources: [] }
      }
      acc[resource.type].count++
      acc[resource.type].size += resource.size
      acc[resource.type].resources.push(resource)
      return acc
    },
    {} as Record<string, { count: number; size: number; resources: Resource[] }>,
  )

  const getTypeColor = (type: string) => {
    const colors = {
      document: "text-palette-primary",
      stylesheet: "text-palette-accent-1",
      script: "text-palette-primary",
      image: "text-palette-primary",
      font: "text-purple-800",
      xhr: "text-palette-accent-1",
    }
    return colors[type as keyof typeof colors] || "text-palette-primary"
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Resource Type Summary */}
      <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-palette-accent-3 border-b border-palette-accent-2 p-6">
          <CardTitle className="text-lg font-bold text-purple-800">Resource Types</CardTitle>
          <CardDescription className="font-medium text-palette-primary">Breakdown by resource type</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          {Object.entries(resourcesByType).map(([type, data]) => (
            <div key={type} className="space-y-3 p-4 bg-palette-accent-3 rounded-lg border border-palette-accent-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={`${getTypeColor(type)} font-semibold border-2 border-palette-accent-2 bg-white`}>
                    {type.toUpperCase()}
                  </Badge>
                  <span className="text-sm font-medium text-slate-700">{data.count} files</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{data.size.toFixed(1)} KB</span>
              </div>
              <Progress value={(data.size / totalSize) * 100} className="h-3 bg-palette-accent-2 [&>div]:bg-palette-accent-1" />
              <p className="text-xs font-medium text-slate-600">
                {((data.size / totalSize) * 100).toFixed(1)}% of total size
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Largest Resources */}
      <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-palette-accent-3 border-b border-palette-accent-2 p-6">
          <CardTitle className="text-lg font-bold text-purple-800">Largest Resources</CardTitle>
          <CardDescription className="font-medium text-palette-primary">Resources with the biggest impact on load time</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="border border-palette-accent-2 rounded-lg overflow-hidden bg-white">
            {resources
              .sort((a, b) => b.size - a.size)
              .slice(0, 8)
              .map((resource, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-4 ${
                    index !== 7 ? "border-b border-palette-accent-2" : ""
                  } hover:bg-palette-accent-3 transition-colors`}
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-sm font-semibold text-slate-900 truncate" title={resource.name}>
                      {resource.name}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant="outline" className="text-xs font-semibold border-2 border-palette-accent-2 text-palette-primary bg-white">
                        {resource.type.toUpperCase()}
                      </Badge>
                      <span className="text-xs font-medium text-slate-600 bg-palette-accent-3 px-2 py-1 rounded">
                        {resource.duration.toFixed(0)}ms
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{resource.size.toFixed(1)} KB</p>
                    <p className="text-xs font-medium text-slate-600 bg-palette-accent-3 px-2 py-1 rounded mt-1">
                      {((resource.size / totalSize) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
