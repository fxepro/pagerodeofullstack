"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, Zap } from "lucide-react"

interface Timeline {
  domContentLoaded: number
  loadComplete: number
  firstPaint: number
  firstContentfulPaint: number
  largestContentfulPaint: number
}

interface PerformanceTimelineProps {
  timeline: Timeline
}

export function PerformanceTimeline({ timeline }: PerformanceTimelineProps) {
  const events = [
    {
      name: "First Paint",
      time: timeline.firstPaint,
      description: "The first pixel is painted to the screen",
      icon: Zap,
      color: "text-blue-600",
    },
    {
      name: "First Contentful Paint",
      time: timeline.firstContentfulPaint,
      description: "The first content element is painted",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      name: "Largest Contentful Paint",
      time: timeline.largestContentfulPaint,
      description: "The largest content element is painted",
      icon: CheckCircle,
      color: "text-orange-600",
    },
    {
      name: "DOM Content Loaded",
      time: timeline.domContentLoaded,
      description: "HTML parsing is complete and DOM is ready",
      icon: CheckCircle,
      color: "text-palette-primary",
    },
    {
      name: "Load Complete",
      time: timeline.loadComplete,
      description: "All resources have finished loading",
      icon: CheckCircle,
      color: "text-accent",
    },
  ]

  const maxTime = Math.max(...events.map((e) => e.time))

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Timeline Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Loading Timeline</CardTitle>
          <CardDescription>Key performance milestones during page load</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.map((event, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className={`flex-shrink-0 ${event.color}`}>
                  <event.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium">{event.name}</h4>
                    <Badge variant="outline">{event.time}ms</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{event.description}</p>
                  <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${event.color.replace("text-", "bg-")} opacity-60`}
                      style={{ width: `${(event.time / maxTime) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
          <CardDescription>Analysis and recommendations based on timeline data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-accent/10 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">Good Performance</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your First Contentful Paint occurs within {timeline.firstContentfulPaint}ms, which is excellent for user
              experience.
            </p>
          </div>

          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Optimization Opportunity</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Consider optimizing resources that load after {timeline.largestContentfulPaint}ms to improve perceived
              performance.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Key Metrics</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Time to Interactive:</span>
                <span className="ml-1 font-medium">{timeline.domContentLoaded}ms</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total Load Time:</span>
                <span className="ml-1 font-medium">{timeline.loadComplete}ms</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
