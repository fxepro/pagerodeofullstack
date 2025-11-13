// AI Metrics Collection Middleware
// This utility helps collect metrics from AI API calls automatically

interface AIMetricsData {
  provider: string
  model: string
  requestId?: string
  responseTime: number
  status: 'success' | 'error' | 'timeout'
  errorMessage?: string
  inputTokens?: number
  outputTokens?: number
  requestSize?: number
  responseSize?: number
  requestLatency?: number
  inferenceTime?: number
  totalLatency?: number
}

// Collect metrics from an AI API call
export async function collectAIMetrics<T>(
  apiCall: () => Promise<T>,
  metricsData: Omit<AIMetricsData, 'responseTime' | 'status'>
): Promise<T> {
  const startTime = performance.now()
  let status: 'success' | 'error' | 'timeout' = 'success'
  let errorMessage: string | undefined
  
  try {
    const result = await apiCall()
    const responseTime = performance.now() - startTime
    
    // Send metrics to collection endpoint
    await sendMetricsToAPI({
      ...metricsData,
      responseTime: Math.round(responseTime),
      status,
      requestSize: metricsData.requestSize || 0,
      responseSize: metricsData.responseSize || 0
    })
    
    return result
    
  } catch (error) {
    const responseTime = performance.now() - startTime
    status = 'error'
    errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Send error metrics to collection endpoint
    await sendMetricsToAPI({
      ...metricsData,
      responseTime: Math.round(responseTime),
      status,
      errorMessage,
      requestSize: metricsData.requestSize || 0,
      responseSize: 0
    })
    
    throw error
  }
}

// Send metrics to the collection API
async function sendMetricsToAPI(metrics: AIMetricsData): Promise<void> {
  try {
    // Skip metrics collection for now to avoid server-side fetch issues
    console.log('[AI Metrics] Skipping metrics collection to avoid fetch issues')
    return
    
    await fetch('/api/ai-health/metrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metrics)
    })
  } catch (error) {
    // Don't throw errors for metrics collection failures
    console.warn('[AI Metrics] Failed to send metrics:', error)
  }
}

// Extract token usage from different AI provider responses
export function extractTokenUsage(provider: string, response: any): { inputTokens: number, outputTokens: number } {
  switch (provider.toLowerCase()) {
    case 'gemini':
      const usage = response.usageMetadata
      return {
        inputTokens: usage?.promptTokenCount || 0,
        outputTokens: usage?.candidatesTokenCount || 0
      }
      
    case 'openai':
      const openaiUsage = response.usage
      return {
        inputTokens: openaiUsage?.prompt_tokens || 0,
        outputTokens: openaiUsage?.completion_tokens || 0
      }
      
    case 'anthropic':
      const anthropicUsage = response.usage
      return {
        inputTokens: anthropicUsage?.input_tokens || 0,
        outputTokens: anthropicUsage?.output_tokens || 0
      }
      
    default:
      return { inputTokens: 0, outputTokens: 0 }
  }
}

// Helper to estimate token count from text (rough approximation)
export function estimateTokenCount(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4)
}

// Wrapper for Gemini API calls with metrics collection
export async function callGeminiWithMetrics(
  prompt: string,
  model: string = 'gemini-1.5-pro'
): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('Gemini API key not configured')
  }
  
  const inputTokens = estimateTokenCount(prompt)
  const requestSize = new Blob([JSON.stringify({ prompt })]).size
  
  return collectAIMetrics(
    async () => {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 2048 }
          })
        }
      )
      
      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`)
      }
      
      return await response.json()
    },
    {
      provider: 'gemini',
      model,
      inputTokens,
      requestSize,
      requestId: `gemini_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  )
}

// Wrapper for OpenAI API calls with metrics collection
export async function callOpenAIWithMetrics(
  messages: Array<{ role: string, content: string }>,
  model: string = 'gpt-3.5-turbo'
): Promise<any> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OpenAI API key not configured')
  }
  
  const inputTokens = messages.reduce((sum, msg) => sum + estimateTokenCount(msg.content), 0)
  const requestSize = new Blob([JSON.stringify({ messages, model })]).size
  
  return collectAIMetrics(
    async () => {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 2048
        })
      })
      
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }
      
      return await response.json()
    },
    {
      provider: 'openai',
      model,
      inputTokens,
      requestSize,
      requestId: `openai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  )
}

// Wrapper for Anthropic API calls with metrics collection
export async function callAnthropicWithMetrics(
  messages: Array<{ role: string, content: string }>,
  model: string = 'claude-3-haiku-20240307'
): Promise<any> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('Anthropic API key not configured')
  }
  
  const inputTokens = messages.reduce((sum, msg) => sum + estimateTokenCount(msg.content), 0)
  const requestSize = new Blob([JSON.stringify({ messages, model })]).size
  
  return collectAIMetrics(
    async () => {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model,
          max_tokens: 2048,
          messages
        })
      })
      
      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`)
      }
      
      return await response.json()
    },
    {
      provider: 'anthropic',
      model,
      inputTokens,
      requestSize,
      requestId: `anthropic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  )
}
