"use client"
import React from "react"
import { Badge } from "@/components/ui/badge"

interface Resource {
  name: string
  type: string
  size: number
  startTime: number
  duration: number
  status: number
}

interface Timeline {
  domContentLoaded: number
  loadComplete: number
  firstPaint: number
  firstContentfulPaint: number
  largestContentfulPaint: number
}

interface WaterfallChartProps {
  resources: Resource[]
  timeline: Timeline
}

const getResourceColor = (type: string) => {
  const colors = {
    document: "bg-palette-accent-1",      // Main document - purple theme
    stylesheet: "bg-green-500",     // CSS - keep green (standard)
    script: "bg-yellow-500",        // JavaScript - keep yellow (standard)
    image: "bg-blue-500",          // Images - blue 
    font: "bg-pink-500",           // Fonts - keep pink
    xhr: "bg-orange-500",          // AJAX/XHR - keep orange
    other: "bg-slate-500",         // Other - neutral gray
  }
  return colors[type as keyof typeof colors] || colors.other
}

const getResourceTypeLabel = (type: string) => {
  const labels = {
    document: "HTML",
    stylesheet: "CSS",
    script: "JS",
    image: "IMG",
    font: "FONT",
    xhr: "XHR",
    other: "OTHER",
  }
  return labels[type as keyof typeof labels] || "OTHER"
}

export function WaterfallChart({ resources, timeline }: WaterfallChartProps) {
  // Convert milliseconds to seconds for better scaling
  const maxTimeMs = Math.max(...resources.map((r) => r.startTime + r.duration), timeline.loadComplete)
  const maxTime = maxTimeMs / 1000 // Convert to seconds
  
  // Dynamic timeline width based on data duration, but with reasonable min/max bounds
  const baseWidth = Math.max(400, Math.min(800, maxTime * 200)) // 200px per second, 400-800px range
  const timelineWidth = baseWidth
  const scale = timelineWidth / maxTime // Scale to fit timeline

  // Generate time markers based on duration
  const markerInterval = maxTime <= 2 ? 0.5 : maxTime <= 5 ? 1 : 2
  const timeMarkers: number[] = []
  for (let i = 0; i <= Math.ceil(maxTime); i += markerInterval) {
    timeMarkers.push(i)
  }

  return (
    <div className="space-y-4">
      {/* Timeline Header with Time Markers */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <div className="bg-slate-100 border-b px-4 py-3">
          <div className="flex items-center gap-4 text-sm font-semibold text-slate-700">
            <div className="w-80">Resource</div>
            <div className="w-24">Type</div>
            <div className="w-24 text-right">Size</div>
            <div className="w-20 text-right">Status</div>
            <div className="w-28 text-right">Load Time</div>
            <div style={{ width: `${timelineWidth}px` }} className="relative">
              <div className="text-center">Timeline (seconds)</div>
              {/* Time markers */}
              <div className="absolute top-6 left-0 right-0 h-6 flex">
                {timeMarkers.map((time, index) => (
                  <div
                    key={index}
                    className="absolute text-xs text-slate-500 -translate-x-1/2"
                    style={{ left: `${(time / maxTime) * 100}%` }}
                  >
                    {time}s
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Performance Markers Row */}
        <div className="bg-slate-50 border-b px-4 py-2">
          <div className="flex items-center gap-4">
            <div className="w-80 text-sm font-medium text-slate-600">Performance Markers</div>
            <div className="w-24"></div>
            <div className="w-24"></div>
            <div className="w-20"></div>
            <div className="w-28"></div>
            <div 
              className="relative h-8 bg-white border rounded"
              style={{ width: `${timelineWidth}px` }}
            >
              {/* Grid lines */}
              {timeMarkers.map((time, index) => (
                <div
                  key={index}
                  className="absolute top-0 bottom-0 w-px bg-slate-200"
                  style={{ left: `${(time / maxTime) * 100}%` }}
                />
              ))}
              
              {/* Performance markers */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-blue-500 rounded-sm"
                style={{ left: `${(timeline.firstPaint / 1000 / maxTime) * 100}%` }}
                title="First Paint"
              />
              <div
                className="absolute top-0 bottom-0 w-1 bg-green-500 rounded-sm"
                style={{ left: `${(timeline.firstContentfulPaint / 1000 / maxTime) * 100}%` }}
                title="First Contentful Paint"
              />
              <div
                className="absolute top-0 bottom-0 w-1 bg-orange-500 rounded-sm"
                style={{ left: `${(timeline.largestContentfulPaint / 1000 / maxTime) * 100}%` }}
                title="Largest Contentful Paint"
              />
              <div
                className="absolute top-0 bottom-0 w-1 bg-palette-accent-1 rounded-sm"
                style={{ left: `${(timeline.domContentLoaded / 1000 / maxTime) * 100}%` }}
                title="DOM Content Loaded"
              />
            </div>
          </div>
        </div>

        {/* Resource Waterfall */}
        <div className="divide-y divide-slate-200">
          {resources.map((resource, index) => (
            <div key={index} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors">
              <div className="w-80 text-sm font-medium text-slate-900 truncate" title={resource.name}>
                {resource.name}
              </div>
              <Badge variant="outline" className="w-24 text-xs font-semibold">
                {getResourceTypeLabel(resource.type)}
              </Badge>
              <div className="w-24 text-xs font-semibold text-slate-700 text-right">{resource.size.toFixed(1)} KB</div>
              <div className="w-20 text-xs font-medium text-slate-600 text-right">
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    resource.status >= 200 && resource.status < 300
                      ? "bg-green-100 text-green-800"
                      : resource.status >= 400
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {resource.status}
                </span>
              </div>
              <div className="w-28 text-xs font-semibold text-palette-primary text-right">{(resource.duration / 1000).toFixed(2)}s</div>
              <div 
                className="relative h-8 bg-slate-50 border rounded overflow-hidden"
                style={{ width: `${timelineWidth}px` }}
              >
                {/* Grid lines */}
                {timeMarkers.map((time, gridIndex) => (
                  <div
                    key={gridIndex}
                    className="absolute top-0 bottom-0 w-px bg-slate-100"
                    style={{ left: `${(time / maxTime) * 100}%` }}
                  />
                ))}
                
                {/* Resource bar */}
                <div
                  className={`absolute top-0 bottom-0 ${getResourceColor(resource.type)} opacity-90`}
                  style={{
                    left: `${(resource.startTime / 1000 / maxTime) * 100}%`,
                    width: `${Math.max((resource.duration / 1000 / maxTime) * 100, 1)}%`,
                  }}
                  title={`${resource.name} - Start: ${(resource.startTime / 1000).toFixed(2)}s, Duration: ${(resource.duration / 1000).toFixed(2)}s`}
                >
                  {/* Add a subtle pattern to make bars more visible */}
                  <div className="absolute inset-0 bg-white/10 border-r border-white/20"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-slate-50 border rounded-lg p-4">
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Performance Markers</h4>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-blue-600 rounded border"></div>
            <span className="font-medium text-slate-700">First Paint (FP)</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-green-600 rounded border"></div>
            <span className="font-medium text-slate-700">First Contentful Paint (FCP)</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-orange-600 rounded border"></div>
            <span className="font-medium text-slate-700">Largest Contentful Paint (LCP)</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-palette-primary rounded border"></div>
            <span className="font-medium text-slate-700">DOM Content Loaded (DCL)</span>
          </div>
        </div>
      </div>
    </div>
  )
}