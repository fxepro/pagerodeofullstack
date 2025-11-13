import { type NextRequest, NextResponse } from "next/server"

// AI Health Status Types
interface AIProviderStatus {
  name: string
  status: 'healthy' | 'degraded' | 'down' | 'unknown'
  responseTime: number
  lastChecked: string
  errorRate: number
  uptime: number
  model: string
  apiKey: boolean
}

interface AIHealthStatus {
  overall: 'healthy' | 'degraded' | 'down'
  providers: AIProviderStatus[]
  lastUpdated: string
  totalRequests: number
  successRate: number
  averageResponseTime: number
}

// Check AI provider health
async function checkProviderHealth(provider: string, apiKey: string, model: string): Promise<AIProviderStatus> {
  const startTime = performance.now()
  
  try {
    let testPrompt = "Test connection"
    let apiUrl = ""
    let headers: Record<string, string> = {}
    
    // Configure based on provider
    switch (provider.toLowerCase()) {
      case 'gemini':
        apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
        headers = { "Content-Type": "application/json" }
        testPrompt = JSON.stringify({
          contents: [{ parts: [{ text: "Test connection" }] }],
          generationConfig: { maxOutputTokens: 10 }
        })
        break
        
      case 'openai':
        apiUrl = "https://api.openai.com/v1/chat/completions"
        headers = { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        }
        testPrompt = JSON.stringify({
          model: model,
          messages: [{ role: "user", content: "Test connection" }],
          max_tokens: 10
        })
        break
        
      case 'anthropic':
        apiUrl = "https://api.anthropic.com/v1/messages"
        headers = { 
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01"
        }
        testPrompt = JSON.stringify({
          model: model,
          max_tokens: 10,
          messages: [{ role: "user", content: "Test connection" }]
        })
        break
        
      default:
        throw new Error(`Unsupported AI provider: ${provider}`)
    }
    
    // Make test request
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: testPrompt,
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })
    
    const responseTime = performance.now() - startTime
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`)
    }
    
    return {
      name: provider,
      status: responseTime < 2000 ? 'healthy' : 'degraded',
      responseTime: Math.round(responseTime),
      lastChecked: new Date().toISOString(),
      errorRate: 0,
      uptime: 99.9,
      model: model,
      apiKey: true
    }
    
  } catch (error) {
    const responseTime = performance.now() - startTime
    
    return {
      name: provider,
      status: 'down',
      responseTime: Math.round(responseTime),
      lastChecked: new Date().toISOString(),
      errorRate: 100,
      uptime: 0,
      model: model,
      apiKey: !!apiKey
    }
  }
}

// Get overall AI health status
export async function GET(request: NextRequest) {
  try {
    console.log("[AI Health] Checking AI system health...")
    
    // Get configured AI providers from environment
    const providers: Array<{name: string, apiKey: string, model: string}> = []
    
    // Check for Gemini
    if (process.env.GEMINI_API_KEY) {
      providers.push({
        name: 'gemini',
        apiKey: process.env.GEMINI_API_KEY,
        model: 'gemini-1.5-pro'
      })
    }
    
    // Check for OpenAI
    if (process.env.OPENAI_API_KEY) {
      providers.push({
        name: 'openai',
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
      })
    }
    
    // Check for Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
      providers.push({
        name: 'anthropic',
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307'
      })
    }
    
    if (providers.length === 0) {
      return NextResponse.json({
        overall: 'down',
        providers: [],
        lastUpdated: new Date().toISOString(),
        totalRequests: 0,
        successRate: 0,
        averageResponseTime: 0,
        error: "No AI providers configured"
      })
    }
    
    // Check health of all providers
    const providerStatuses = await Promise.all(
      providers.map(provider => 
        checkProviderHealth(provider.name, provider.apiKey, provider.model)
      )
    )
    
    // Calculate overall status
    const healthyProviders = providerStatuses.filter(p => p.status === 'healthy').length
    const totalProviders = providerStatuses.length
    const averageResponseTime = providerStatuses.reduce((sum, p) => sum + p.responseTime, 0) / totalProviders
    const successRate = providerStatuses.reduce((sum, p) => sum + (100 - p.errorRate), 0) / totalProviders
    
    let overallStatus: 'healthy' | 'degraded' | 'down'
    if (healthyProviders === totalProviders) {
      overallStatus = 'healthy'
    } else if (healthyProviders > 0) {
      overallStatus = 'degraded'
    } else {
      overallStatus = 'down'
    }
    
    const healthStatus: AIHealthStatus = {
      overall: overallStatus,
      providers: providerStatuses,
      lastUpdated: new Date().toISOString(),
      totalRequests: 0, // This would come from metrics collection
      successRate: Math.round(successRate),
      averageResponseTime: Math.round(averageResponseTime)
    }
    
    console.log("[AI Health] Health check completed:", {
      overall: overallStatus,
      providers: providerStatuses.length,
      averageResponseTime: Math.round(averageResponseTime)
    })
    
    return NextResponse.json(healthStatus)
    
  } catch (error) {
    console.error("[AI Health] Health check failed:", error)
    
    return NextResponse.json({
      overall: 'down',
      providers: [],
      lastUpdated: new Date().toISOString(),
      totalRequests: 0,
      successRate: 0,
      averageResponseTime: 0,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
