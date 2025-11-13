"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Globe, Zap, Loader2, AlertCircle } from "lucide-react"

export function UrlInputForm() {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const validateUrl = (inputUrl: string): boolean => {
    try {
      const urlObj = new URL(inputUrl)
      return urlObj.protocol === "http:" || urlObj.protocol === "https:"
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!url.trim()) {
      setError("Please enter a URL")
      return
    }

    // Add protocol if missing
    let formattedUrl = url.trim()
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`
    }

    if (!validateUrl(formattedUrl)) {
      setError("Please enter a valid URL")
      return
    }

    setIsLoading(true)

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Navigate to results page with URL parameter
      const encodedUrl = encodeURIComponent(formattedUrl)
      router.push(`/results?url=${encodedUrl}`)
    } catch (err) {
      setError("Failed to analyze website. Please try again.")
      setIsLoading(false)
    }
  }

  const handleExampleClick = (exampleUrl: string) => {
    setUrl(exampleUrl)
    setError("")
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3 w-full">
          <Input
            id="url"
            type="text"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 h-14 text-lg px-6 bg-white/90 border-white/40 focus:border-white focus:ring-white/30"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            className="px-8 h-14 bg-gradient-to-r from-palette-primary to-palette-primary-hover hover:from-purple-700 hover:to-palette-secondary text-white border-0 text-lg font-semibold shadow-lg" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5 mr-2" />
                Analyze
              </>
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </form>
    </div>
  )
}
