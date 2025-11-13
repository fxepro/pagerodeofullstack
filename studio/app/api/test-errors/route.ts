import { NextRequest, NextResponse } from 'next/server'

/**
 * Test endpoint to simulate different error types
 * Usage: POST /api/test-errors with { errorType: "dns" | "timeout" | "forbidden" | "notfound" | "ratelimit" | "server" | "auth" }
 */
export async function POST(request: NextRequest) {
  try {
    const { errorType, domain = "test-domain.com" } = await request.json()

    console.log(`[Test Errors] Simulating ${errorType} error for ${domain}`)

    switch (errorType) {
      case 'dns':
        // DNS error - domain cannot be resolved
        return NextResponse.json({
          success: false,
          code: 'DNS_NOT_FOUND',
          message: `Domain ${domain} cannot be resolved.`,
          domain
        }, { status: 200 })

      case 'timeout':
        // Simulate timeout
        await new Promise(resolve => setTimeout(resolve, 100))
        return NextResponse.json(
          { error: 'Request timeout' },
          { status: 408 }
        )

      case 'forbidden':
        // 403 Forbidden
        return NextResponse.json(
          { error: 'Access forbidden. The server blocked this request.' },
          { status: 403 }
        )

      case 'notfound':
        // 404 Not Found
        return NextResponse.json(
          { error: 'Resource not found' },
          { status: 404 }
        )

      case 'ratelimit':
        // 429 Rate Limited
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429, headers: { 'Retry-After': '60' } }
        )

      case 'server':
        // 500 Server Error
        return NextResponse.json(
          { error: 'Internal server error occurred' },
          { status: 500 }
        )

      case 'auth':
        // 401 Unauthorized
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )

      case 'network':
        // Simulate network error by throwing
        throw new Error('ECONNREFUSED: Connection refused')

      case 'ssl':
        // SSL certificate error
        throw new Error('SSL certificate validation failed')

      case 'parse':
        // Parse error - return invalid JSON
        return new Response('{ invalid json', {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })

      default:
        return NextResponse.json(
          { error: 'Unknown error type. Use: dns, timeout, forbidden, notfound, ratelimit, server, auth, network, ssl, parse' },
          { status: 400 }
        )
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Error Testing API',
    usage: 'POST with { errorType: "dns" | "timeout" | "forbidden" | "notfound" | "ratelimit" | "server" | "auth" | "network" | "ssl" | "parse" }',
    examples: [
      { errorType: 'dns', description: 'Domain not found' },
      { errorType: 'timeout', description: 'Request timeout' },
      { errorType: 'forbidden', description: '403 Forbidden' },
      { errorType: 'notfound', description: '404 Not Found' },
      { errorType: 'ratelimit', description: '429 Too Many Requests' },
      { errorType: 'server', description: '500 Server Error' },
      { errorType: 'auth', description: '401 Unauthorized' },
      { errorType: 'network', description: 'Network connection error' },
      { errorType: 'ssl', description: 'SSL certificate error' },
      { errorType: 'parse', description: 'JSON parse error' }
    ]
  })
}
