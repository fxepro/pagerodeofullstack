import { type NextRequest, NextResponse } from "next/server"
import { callGeminiWithMetrics, extractTokenUsage } from "@/lib/ai-metrics-collector"

// You'll need to set up your Gemini API key in .env.local
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent"

export async function POST(request: NextRequest) {
  try {
    console.log("[AI] Environment check - GEMINI_API_KEY exists:", !!GEMINI_API_KEY)
    console.log("[AI] Environment check - GEMINI_API_KEY length:", GEMINI_API_KEY?.length || 0)
    
    if (!GEMINI_API_KEY) {
      console.error("[AI] No Gemini API key found in environment variables")
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      )
    }

    const { prompt, performanceData } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      )
    }

    console.log("[AI] Starting Gemini analysis for:", performanceData.url)
    console.log("[AI] Using API key starting with:", GEMINI_API_KEY.substring(0, 10) + "...")

    // Prepare the prompt for Gemini
    const geminiPrompt = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    }

    console.log("[AI] Calling Gemini API with metrics collection...")
    
    // Call Gemini API with metrics collection
    const geminiResponse = await callGeminiWithMetrics(prompt, 'gemini-1.5-pro')
    console.log("[AI] Gemini API response received, parsing...")
    
    if (!geminiResponse.candidates || !geminiResponse.candidates[0]?.content?.parts?.[0]?.text) {
      console.error("[AI] Invalid Gemini response structure:", geminiResponse)
      throw new Error("Invalid response from Gemini API")
    }

    const aiText = geminiResponse.candidates[0].content.parts[0].text
    console.log("[AI] AI response text length:", aiText.length)
    
    // Try to parse JSON from AI response
    let aiInsights
    try {
      // Extract JSON from the response (AI might wrap it in markdown)
      const jsonMatch = aiText.match(/```json\s*([\s\S]*?)\s*```/) || 
                       aiText.match(/\{[\s\S]*\}/)
      
      if (jsonMatch) {
        aiInsights = JSON.parse(jsonMatch[1] || jsonMatch[0])
        console.log("[AI] Successfully parsed JSON response")
      } else {
        throw new Error("No JSON found in AI response")
      }
    } catch (parseError) {
      console.error("[AI] Failed to parse AI response as JSON:", parseError)
      console.error("[AI] Raw AI response:", aiText.substring(0, 500))
      // Fallback: create structured response from text
      aiInsights = {
        grade: "B",
        reasoning: "AI analysis completed but response format was unexpected",
        findings: [
          {
            type: "info",
            title: "AI Analysis",
            description: aiText.substring(0, 200) + "...",
            impact: "Medium"
          }
        ],
        recommendations: [
          {
            priority: "medium",
            title: "AI Recommendation",
            description: "AI provided analysis but in unexpected format. Consider re-running analysis.",
            estimatedImprovement: "Enable proper AI formatting"
          }
        ],
        summary: "AI analysis completed with formatting issues. Raw response available in findings."
      }
    }

    // Validate required fields
    if (!aiInsights.grade || !aiInsights.reasoning) {
      aiInsights = {
        grade: aiInsights.grade || "B",
        reasoning: aiInsights.reasoning || "AI analysis completed",
        findings: aiInsights.findings || [],
        recommendations: aiInsights.recommendations || [],
        summary: aiInsights.summary || "AI analysis completed successfully"
      }
    }

    console.log("[AI] Gemini analysis completed successfully")
    return NextResponse.json(aiInsights)

  } catch (error) {
    console.error("[AI] Analysis error:", error)
    
    return NextResponse.json(
      {
        error: "AI analysis failed",
        details: error instanceof Error ? error.message : "Unknown error",
        fallback: "Using fallback analysis instead"
      },
      { status: 500 }
    )
  }
}
