import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    console.log(`[Sitemap API] Request for ${url}`)

    // Extract domain from URL for test mode
    const urlObj = new URL(url)
    const domain = urlObj.hostname

    // TEST MODE: Special domains to simulate errors
    if (domain.startsWith('test-')) {
      const errorType = domain.replace('test-', '').replace(/\..+$/, '')
      console.log(`[Sitemap API] TEST MODE: Simulating ${errorType} error`)
      
      switch (errorType) {
        case '403':
        case 'forbidden':
          return NextResponse.json(
            { error: 'Access forbidden. The server blocked this request.' },
            { status: 403 }
          )
        case '404':
        case 'notfound':
          return NextResponse.json(
            { error: 'Resource not found' },
            { status: 404 }
          )
        case '429':
        case 'ratelimit':
          return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            { status: 429 }
          )
        case '500':
        case 'server':
          return NextResponse.json(
            { error: 'Internal server error occurred' },
            { status: 500 }
          )
        case '401':
        case 'auth':
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          )
        case '408':
        case 'timeout':
          return NextResponse.json(
            { error: 'Request timeout' },
            { status: 408 }
          )
        case 'network':
          throw new Error('ECONNREFUSED: Connection refused')
        case 'ssl':
          throw new Error('SSL certificate validation failed')
        case 'parse':
          return new Response('{ invalid json', {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
      }
    }

    // Forward to Django backend
    // In production, use absolute URL to avoid routing loops
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 
                     (process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : 'http://127.0.0.1:8000')
    const backendUrl = `${API_BASE}/api/sitemap/`

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: `Backend error (${response.status})` 
      }))
      return NextResponse.json(
        { error: errorData.error || 'Sitemap generation failed' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('[Sitemap API] Error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate sitemap',
        details: 'Make sure the Django backend is running on port 8000'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 
                   (process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : 'http://127.0.0.1:8000')
  return NextResponse.json({
    message: 'Sitemap API is running',
    backend: `${API_BASE}/api/sitemap/`,
    timestamp: new Date().toISOString()
  })
}

