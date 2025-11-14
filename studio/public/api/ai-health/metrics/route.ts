import { type NextRequest, NextResponse } from "next/server"

// AI Metrics Types
interface AIMetrics {
  id: string
  timestamp: string
  provider: string
  model: string
  requestId: string
  
  // API Health Metrics
  responseTime: number
  status: 'success' | 'error' | 'timeout'
  errorMessage?: string
  
  // Token Usage
  tokenUsage: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
    cost: number
  }
  
  // Request Details
  requestSize: number
  responseSize: number
  userAgent?: string
  ipAddress?: string
  
  // Performance Metrics
  latency: {
    requestLatency: number
    inferenceTime: number
    totalLatency: number
  }
  
  // Quality Metrics (for future implementation)
  quality?: {
    accuracy?: number
    relevance?: number
    completeness?: number
  }
}

// In-memory storage for metrics (in production, use a database)
let metricsStore: AIMetrics[] = []
let metricsStats = {
  totalRequests: 0,
  successRequests: 0,
  errorRequests: 0,
  totalTokens: 0,
  totalCost: 0,
  averageResponseTime: 0
}

// Token pricing types
type ModelPricing = {
  input: number
  output: number
}

type PricingRecord = Record<string, ModelPricing>

type TokenPricing = {
  gemini: PricingRecord
  openai: PricingRecord
  anthropic: PricingRecord
}

// Token pricing per provider (in USD per 1K tokens)
const TOKEN_PRICING: TokenPricing = {
  gemini: {
    'gemini-1.5-flash': { input: 0.000075, output: 0.0003 },
    'gemini-1.5-pro': { input: 0.00125, output: 0.005 }
  } as PricingRecord,
  openai: {
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 }
  } as PricingRecord,
  anthropic: {
    'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
    'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
    'claude-3-opus-20240229': { input: 0.015, output: 0.075 }
  } as PricingRecord
}

// Calculate cost based on provider, model, and token usage
function calculateCost(provider: string, model: string, inputTokens: number, outputTokens: number): number {
  const pricing = TOKEN_PRICING[provider.toLowerCase() as keyof TokenPricing]
  if (!pricing) return 0
  
  const modelPricing = pricing[model] as ModelPricing | undefined
  if (!modelPricing) return 0
  
  const inputCost = (inputTokens / 1000) * modelPricing.input
  const outputCost = (outputTokens / 1000) * modelPricing.output
  
  return Math.round((inputCost + outputCost) * 100) / 100 // Round to 2 decimal places
}

// Store metrics
export async function POST(request: NextRequest) {
  try {
    const metricsData = await request.json()
    
    // Validate required fields
    if (!metricsData.provider || !metricsData.model) {
      return NextResponse.json(
        { error: "Provider and model are required" },
        { status: 400 }
      )
    }
    
    // Generate unique ID and timestamp
    const id = `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const timestamp = new Date().toISOString()
    
    // Calculate cost
    const inputTokens = metricsData.inputTokens || 0
    const outputTokens = metricsData.outputTokens || 0
    const totalTokens = inputTokens + outputTokens
    const cost = calculateCost(metricsData.provider, metricsData.model, inputTokens, outputTokens)
    
    // Create metrics object
    const metrics: AIMetrics = {
      id,
      timestamp,
      provider: metricsData.provider,
      model: metricsData.model,
      requestId: metricsData.requestId || id,
      responseTime: metricsData.responseTime || 0,
      status: metricsData.status || 'success',
      errorMessage: metricsData.errorMessage,
      tokenUsage: {
        inputTokens,
        outputTokens,
        totalTokens,
        cost
      },
      requestSize: metricsData.requestSize || 0,
      responseSize: metricsData.responseSize || 0,
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown',
      latency: {
        requestLatency: metricsData.requestLatency || 0,
        inferenceTime: metricsData.inferenceTime || 0,
        totalLatency: metricsData.totalLatency || metricsData.responseTime || 0
      }
    }
    
    // Store metrics
    metricsStore.push(metrics)
    
    // Update stats
    metricsStats.totalRequests++
    if (metrics.status === 'success') {
      metricsStats.successRequests++
    } else {
      metricsStats.errorRequests++
    }
    metricsStats.totalTokens += totalTokens
    metricsStats.totalCost += cost
    
    // Calculate average response time
    const successfulRequests = metricsStore.filter(m => m.status === 'success')
    if (successfulRequests.length > 0) {
      metricsStats.averageResponseTime = Math.round(
        successfulRequests.reduce((sum, m) => sum + m.responseTime, 0) / successfulRequests.length
      )
    }
    
    // Keep only last 1000 metrics in memory (in production, use database)
    if (metricsStore.length > 1000) {
      metricsStore = metricsStore.slice(-1000)
    }
    
    console.log("[AI Metrics] Stored metrics:", {
      id,
      provider: metrics.provider,
      model: metrics.model,
      status: metrics.status,
      responseTime: metrics.responseTime,
      tokens: totalTokens,
      cost
    })
    
    return NextResponse.json({ 
      success: true, 
      id,
      message: "Metrics stored successfully" 
    })
    
  } catch (error) {
    console.error("[AI Metrics] Failed to store metrics:", error)
    
    return NextResponse.json(
      { error: "Failed to store metrics", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// Get real-time metrics
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const timeRange = url.searchParams.get('timeRange') || '1h' // 1h, 24h, 7d
    const provider = url.searchParams.get('provider') // Filter by provider
    const model = url.searchParams.get('model') // Filter by model
    
    // Calculate time range
    const now = new Date()
    let startTime: Date
    
    switch (timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      default:
        startTime = new Date(now.getTime() - 60 * 60 * 1000) // Default to 1 hour
    }
    
    // Filter metrics by time range
    let filteredMetrics = metricsStore.filter(m => 
      new Date(m.timestamp) >= startTime
    )
    
    // Filter by provider if specified
    if (provider) {
      filteredMetrics = filteredMetrics.filter(m => 
        m.provider.toLowerCase() === provider.toLowerCase()
      )
    }
    
    // Filter by model if specified
    if (model) {
      filteredMetrics = filteredMetrics.filter(m => 
        m.model.toLowerCase() === model.toLowerCase()
      )
    }
    
    // Calculate aggregated metrics
    const totalRequests = filteredMetrics.length
    const successRequests = filteredMetrics.filter(m => m.status === 'success').length
    const errorRequests = filteredMetrics.filter(m => m.status === 'error').length
    const successRate = totalRequests > 0 ? Math.round((successRequests / totalRequests) * 100) : 0
    
    const totalTokens = filteredMetrics.reduce((sum, m) => sum + m.tokenUsage.totalTokens, 0)
    const totalCost = filteredMetrics.reduce((sum, m) => sum + m.tokenUsage.cost, 0)
    
    const responseTimes = filteredMetrics.filter(m => m.status === 'success').map(m => m.responseTime)
    const averageResponseTime = responseTimes.length > 0 ? 
      Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length) : 0
    
    const p95ResponseTime = responseTimes.length > 0 ? 
      Math.round(responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)]) : 0
    
    // Group by provider
    const providerStats = filteredMetrics.reduce((acc, metric) => {
      const key = `${metric.provider}-${metric.model}`
      if (!acc[key]) {
        acc[key] = {
          provider: metric.provider,
          model: metric.model,
          requests: 0,
          successRequests: 0,
          errorRequests: 0,
          totalTokens: 0,
          totalCost: 0,
          averageResponseTime: 0
        }
      }
      
      acc[key].requests++
      if (metric.status === 'success') {
        acc[key].successRequests++
      } else {
        acc[key].errorRequests++
      }
      acc[key].totalTokens += metric.tokenUsage.totalTokens
      acc[key].totalCost += metric.tokenUsage.cost
      
      return acc
    }, {} as Record<string, any>)
    
    // Calculate average response time for each provider
    Object.values(providerStats).forEach((stats: any) => {
      const providerMetrics = filteredMetrics.filter(m => 
        m.provider === stats.provider && m.model === stats.model && m.status === 'success'
      )
      if (providerMetrics.length > 0) {
        stats.averageResponseTime = Math.round(
          providerMetrics.reduce((sum, m) => sum + m.responseTime, 0) / providerMetrics.length
        )
      }
    })
    
    const metrics = {
      timeRange,
      totalRequests,
      successRequests,
      errorRequests,
      successRate,
      totalTokens,
      totalCost,
      averageResponseTime,
      p95ResponseTime,
      providerStats: Object.values(providerStats),
      recentMetrics: filteredMetrics.slice(-50), // Last 50 metrics
      lastUpdated: new Date().toISOString()
    }
    
    console.log("[AI Metrics] Retrieved metrics:", {
      timeRange,
      totalRequests,
      successRate,
      averageResponseTime,
      providers: Object.keys(providerStats).length
    })
    
    return NextResponse.json(metrics)
    
  } catch (error) {
    console.error("[AI Metrics] Failed to retrieve metrics:", error)
    
    return NextResponse.json(
      { error: "Failed to retrieve metrics", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
