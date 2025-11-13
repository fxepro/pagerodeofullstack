"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Brain, Lightbulb, AlertTriangle, CheckCircle, Target, MessageSquare, Loader2, Sparkles, Bot } from "lucide-react"

interface Resource {
  name: string
  type: string
  size: number
  startTime: number
  duration: number
  status: number
}

interface PerformanceData {
  url: string
  resources: Resource[]
  timeline: {
    domContentLoaded: number
    loadComplete: number
    firstPaint: number
    firstContentfulPaint: number
    largestContentfulPaint: number
  }
  totalSize: number
  totalRequests: number
  loadTime: number
}

interface LLMFeedbackProps {
  url: string
  performanceData: PerformanceData
}

// Real AI integration using Gemini API
async function getAIInsights(data: PerformanceData) {
  try {
    const prompt = `You are a web performance expert. Analyze this website performance data and provide insights:

URL: ${data.url}
Load Time: ${data.loadTime.toFixed(1)}s
Total Size: ${data.totalSize.toFixed(1)} KB
Total Requests: ${data.totalRequests}

Core Web Vitals:
- First Paint: ${data.timeline.firstPaint}ms
- First Contentful Paint: ${data.timeline.firstContentfulPaint}ms
- Largest Contentful Paint: ${data.timeline.largestContentfulPaint}ms
- DOM Content Loaded: ${data.timeline.domContentLoaded}ms
- Load Complete: ${data.timeline.loadComplete}ms

Resource Breakdown:
${data.resources.map(r => `- ${r.name} (${r.type}): ${r.size.toFixed(1)}KB, ${r.duration}ms`).join('\n')}

Provide:
1. Overall performance grade (A-F) with reasoning
2. 3-5 key findings with impact assessment
3. 3-5 actionable recommendations with estimated improvements
4. Performance insights summary

Format as JSON with keys: grade, reasoning, findings, recommendations, summary`

    // Call Gemini API (you'll need to set up API key)
    const response = await fetch('/api/ai-analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, performanceData: data })
    })

    if (!response.ok) {
      throw new Error('AI analysis failed')
    }

    const aiResponse = await response.json()
    return aiResponse
  } catch (error) {
    console.error('AI analysis error:', error)
    // Fallback to rule-based analysis if AI fails
    return generateFallbackInsights(data)
  }
}

// Fallback analysis when AI is unavailable
function generateFallbackInsights(data: PerformanceData) {
  let score = 100
  if (data.timeline.largestContentfulPaint > 2500) score -= 20
  if (data.timeline.firstContentfulPaint > 1800) score -= 15
  if (data.loadTime > 3000) score -= 15

  const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F"

  return {
    grade,
    reasoning: `Performance score: ${score}/100 based on Core Web Vitals and load time analysis`,
    findings: [
      {
        type: data.timeline.largestContentfulPaint > 2500 ? "critical" : "info",
        title: "Largest Contentful Paint",
        description: `${data.timeline.largestContentfulPaint}ms ${data.timeline.largestContentfulPaint > 2500 ? '(exceeds 2.5s target)' : '(within target)'}`,
        impact: data.timeline.largestContentfulPaint > 2500 ? "High" : "Low"
      }
    ],
    recommendations: [
      {
        priority: "medium",
        title: "Performance Analysis",
        description: "This is a fallback analysis. Enable AI integration for detailed insights.",
        estimatedImprovement: "Enable AI for better recommendations"
      }
    ],
    summary: "Fallback analysis provided. AI integration recommended for comprehensive insights."
  }
}

export function LLMFeedback({ url, performanceData }: LLMFeedbackProps) {
  const [insights, setInsights] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [customQuestion, setCustomQuestion] = useState("")
  const [isAsking, setIsAsking] = useState(false)
  const [customAnswer, setCustomAnswer] = useState("")
  const [aiEnabled, setAiEnabled] = useState(false)

    // Load AI insights on component mount
  useEffect(() => {
    const loadAIInsights = async () => {
      setLoading(true)
      try {
        // AI fetch commented out temporarily during development
        // console.log('[AI] Starting to load AI insights...')
        // const aiInsights = await getAIInsights(performanceData)
        // console.log('[AI] AI insights loaded successfully:', aiInsights)
        // setInsights(aiInsights)
        // setAiEnabled(true)
        
        // Use fallback for now
        console.log('[AI] Using fallback insights (AI commented out)')
        const fallback = generateFallbackInsights(performanceData)
        setInsights(fallback)
        setAiEnabled(false)
      } catch (error) {
        console.error('Failed to load AI insights:', error)
        const fallback = generateFallbackInsights(performanceData)
        console.log('[AI] Using fallback insights:', fallback)
        setInsights(fallback)
        setAiEnabled(false)
      } finally {
        setLoading(false)
      }
    }
    
    loadAIInsights()
  }, [performanceData])

  const handleAskQuestion = async () => {
    if (!customQuestion.trim()) return

    setIsAsking(true)
    
    try {
      // Send question to AI for real-time analysis
      const response = await fetch('/api/ai-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: customQuestion, 
          performanceData: performanceData,
          context: insights 
        })
      })

      console.log('[AI] Question API response status:', response.status)
      console.log('[AI] Question API response ok:', response.ok)

      if (response.ok) {
        const aiAnswer = await response.json()
        console.log('[AI] Question API response data:', aiAnswer)
        setCustomAnswer(aiAnswer.answer)
      } else {
        const errorData = await response.text()
        console.error('[AI] Question API error response:', errorData)
        throw new Error(`AI question failed: ${response.status} - ${errorData}`)
      }
    } catch (error) {
      console.error('AI question error:', error)
      setCustomAnswer("AI analysis is currently unavailable. Please try again later.")
    } finally {
      setIsAsking(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50 dark:bg-red-900/20"
      case "medium":
        return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20"
      case "low":
        return "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-900/20"
    }
  }

  const getImpactIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      default:
        return <Lightbulb className="h-5 w-5 text-blue-600" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              AI Performance Analysis
            </CardTitle>
            <CardDescription>Analyzing performance data with AI...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>AI is analyzing your performance data...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!insights) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Failed to load AI insights. Please try refreshing the page.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* AI Performance Assessment */}
      <Card className="bg-white/90 backdrop-blur-sm border-palette-accent-2 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-palette-primary">
            <Bot className="h-5 w-5 text-palette-primary" />
            AI Performance Assessment
            {aiEnabled ? (
              <Badge className="bg-green-100 text-green-700 border-green-200">AI Powered</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">Fallback</Badge>
            )}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {aiEnabled 
              ? "AI-powered analysis using Gemini" 
              : "Fallback analysis (AI integration recommended)"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 border-2 border-palette-accent-2">
              <span className="text-2xl font-bold text-palette-primary">{insights.grade}</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2 text-gray-800">AI Performance Grade</h3>
              <p className="text-gray-600">{insights.reasoning}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Key Findings */}
      <Card className="bg-white/90 backdrop-blur-sm border-palette-accent-2 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-palette-primary">
            <Target className="h-5 w-5 text-palette-primary" />
            AI Key Findings
          </CardTitle>
          <CardDescription className="text-gray-600">AI-detected performance insights</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.findings?.map((finding: any, index: number) => (
            <Alert key={index}>
              {getImpactIcon(finding.type)}
              <div className="ml-2">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{finding.title}</h4>
                  {finding.impact && (
                    <Badge variant="outline" className="text-xs">
                      {finding.impact} Impact
                    </Badge>
                  )}
                </div>
                <AlertDescription>{finding.description}</AlertDescription>
              </div>
            </Alert>
          ))}
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card className="bg-white/90 backdrop-blur-sm border-palette-accent-2 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-palette-primary">
            <Sparkles className="h-5 w-5 text-palette-primary" />
            AI-Powered Recommendations
          </CardTitle>
          <CardDescription className="text-gray-600">AI-generated optimization strategies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {insights.recommendations?.map((rec: any, index: number) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-start gap-4">
                {rec.priority && (
                  <div className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                    {rec.priority.toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-semibold mb-2">{rec.title}</h4>
                  <p className="text-muted-foreground mb-3">{rec.description}</p>
                  {rec.estimatedImprovement && (
                    <div className="text-sm">
                      <span className="font-medium text-accent">Expected Improvement:</span>
                      <p className="text-muted-foreground">{rec.estimatedImprovement}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* AI Summary */}
      {insights.summary && (
        <Card className="bg-white/90 backdrop-blur-sm border-palette-accent-2 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-palette-primary">
              <Brain className="h-5 w-5 text-palette-primary" />
              AI Analysis Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{insights.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Ask AI Assistant - Coming in Next Release */}
      {/*
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Ask AI Assistant
          </CardTitle>
          <CardDescription>
            {aiEnabled 
              ? "Get real-time AI insights about your performance" 
              : "AI integration required for this feature"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question">Your Question</Label>
            <Textarea
              id="question"
              placeholder="e.g., What should I prioritize first to improve my load time?"
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              className="min-h-[80px]"
              disabled={!aiEnabled}
            />
          </div>
          <Button 
            onClick={handleAskQuestion} 
            disabled={isAsking || !customQuestion.trim() || !aiEnabled}
          >
            {isAsking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                AI Analyzing...
              </>
            ) : (
              <>
                <Bot className="h-4 w-4 mr-2" />
                Ask AI
              </>
              )}
          </Button>

          {!aiEnabled && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                AI integration is required for real-time questions. Please check your API configuration.
              </AlertDescription>
            </Alert>
          )}

          {customAnswer && (
            <Alert>
              <Bot className="h-4 w-4" />
              <div className="ml-2">
                <h4 className="font-medium mb-1">AI Assistant Response</h4>
                <AlertDescription>{customAnswer}</AlertDescription>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>
      */}
    </div>
  )
}
