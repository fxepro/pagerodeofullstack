import { type NextRequest, NextResponse } from "next/server"
import { callGeminiWithMetrics } from "@/lib/ai-metrics-collector"

// Resource type for performance data
interface Resource {
  name: string
  type: string
  size: number
  duration: number
}

// You'll need to set up your Gemini API key in .env.local
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

export async function POST(request: NextRequest) {
  try {
    console.log("[AI Question] Environment check - GEMINI_API_KEY exists:", !!GEMINI_API_KEY)
    
    if (!GEMINI_API_KEY) {
      console.error("[AI Question] No Gemini API key found in environment variables")
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      )
    }

    const { question, performanceData, context } = await request.json()

    if (!question || !performanceData) {
      return NextResponse.json(
        { error: "Question and performance data are required" },
        { status: 400 }
      )
    }

    console.log("[AI Question] Processing question:", question.substring(0, 50) + "...")

    // Create context-aware prompt for the AI
    const prompt = `You are a web performance expert. A user has asked: "${question}"

Here is the current performance data for ${performanceData.url}:

Performance Metrics:
- Load Time: ${performanceData.loadTime.toFixed(1)}s
- Total Size: ${performanceData.totalSize.toFixed(1)} KB
- Total Requests: ${performanceData.totalRequests}

Core Web Vitals:
- First Paint: ${performanceData.timeline.firstPaint}ms
- First Contentful Paint: ${performanceData.timeline.firstContentfulPaint}ms
- Largest Contentful Paint: ${performanceData.timeline.largestContentfulPaint}ms
- DOM Content Loaded: ${performanceData.timeline.domContentLoaded}ms
- Load Complete: ${performanceData.timeline.loadComplete}ms

Resource Breakdown:
${(performanceData.resources as Resource[]).map((r) => `- ${r.name} (${r.type}): ${r.size.toFixed(1)}KB, ${r.duration}ms`).join('\n')}

Previous AI Analysis Context:
${context ? `Grade: ${context.grade}, Summary: ${context.summary}` : 'No previous analysis available'}

Please provide a helpful, specific answer to the user's question. Focus on:
1. Direct answer to their question
2. Specific insights based on their performance data
3. Actionable recommendations if applicable
4. Professional but friendly tone

Keep your response under 300 words and focus on being helpful and specific to their data.`

    console.log("[AI Question] Calling Gemini API with metrics collection...")

    // Call Gemini API with metrics collection
    const geminiResponse = await callGeminiWithMetrics(prompt, 'gemini-1.5-flash')
    console.log("[AI Question] Gemini API response received")
    
    if (!geminiResponse.candidates || !geminiResponse.candidates[0]?.content?.parts?.[0]?.text) {
      console.error("[AI Question] Invalid Gemini response structure:", geminiResponse)
      throw new Error("Invalid response from Gemini API")
    }

    const aiAnswer = geminiResponse.candidates[0].content.parts[0].text
    console.log("[AI Question] AI answer length:", aiAnswer.length)

    console.log("[AI Question] Question answered successfully")
    return NextResponse.json({ answer: aiAnswer })

  } catch (error) {
    console.error("[AI Question] Question processing error:", error)
    
    return NextResponse.json(
      {
        error: "AI question processing failed",
        details: error instanceof Error ? error.message : "Unknown error",
        fallback: "AI is currently unavailable. Please try again later."
      },
      { status: 500 }
    )
  }
}
