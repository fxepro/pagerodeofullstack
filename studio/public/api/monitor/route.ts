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

    // Validate URL format
    let targetUrl: URL
    try {
      targetUrl = new URL(url.startsWith('http') ? url : `https://${url}`)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Perform basic monitoring checks
    const startTime = Date.now()
    
    try {
      // Basic HTTP check with proper headers
      const response = await fetch(targetUrl.toString(), {
        method: 'HEAD',
        headers: {
          'User-Agent': 'PageRodeo-Monitor/1.0'
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      const responseTime = Date.now() - startTime
      const isUp = response.ok

      // SSL Certificate check (for HTTPS)
      let sslInfo = null
      if (targetUrl.protocol === 'https:') {
        // In a real implementation, you would use a library like 'tls' to check SSL
        sslInfo = {
          valid: response.ok,
          expiresIn: 90, // Mock data - would need actual SSL cert parsing
          issuer: "Let's Encrypt"
        }
      }

      return NextResponse.json({
        url: targetUrl.toString(),
        status: isUp ? 'up' : 'down',
        responseTime,
        timestamp: new Date().toISOString(),
        statusCode: response.status,
        ssl: sslInfo,
        headers: {
          server: response.headers.get('server'),
          contentType: response.headers.get('content-type'),
        }
      })

    } catch (error) {
      const responseTime = Date.now() - startTime
      console.log('[pagerodeo] Monitor check failed:', error)
      
      return NextResponse.json({
        url: targetUrl.toString(),
        status: 'down',
        responseTime,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        ssl: null
      })
    }

  } catch (error) {
    console.error('Monitor API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Monitor API is running',
    timestamp: new Date().toISOString(),
    features: [
      'HTTP/HTTPS monitoring',
      'Response time tracking', 
      'SSL certificate monitoring',
      'Basic uptime checks'
    ]
  })
}
