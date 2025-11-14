import { NextRequest, NextResponse } from 'next/server'
import { UptimeKumaClient, createMonitorFromUrl } from '@/lib/uptime-kuma'

// Environment variables for Uptime Kuma configuration
const UPTIME_KUMA_URL = process.env.UPTIME_KUMA_URL || 'http://localhost:3001'
const UPTIME_KUMA_USERNAME = process.env.UPTIME_KUMA_USERNAME
const UPTIME_KUMA_PASSWORD = process.env.UPTIME_KUMA_PASSWORD
const UPTIME_KUMA_API_KEY = process.env.UPTIME_KUMA_API_KEY

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, action, monitorId, period } = body

    if (!url && action !== 'status' && action !== 'uptime') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Initialize Uptime Kuma client
    const kumaClient = new UptimeKumaClient({
      baseUrl: UPTIME_KUMA_URL,
      username: UPTIME_KUMA_USERNAME,
      password: UPTIME_KUMA_PASSWORD,
      apiKey: UPTIME_KUMA_API_KEY
    })

    switch (action) {
      case 'add': {
        // Login if using username/password
        if (UPTIME_KUMA_USERNAME && UPTIME_KUMA_PASSWORD) {
          await kumaClient.login()
        }

        // Create monitor
        const monitor = createMonitorFromUrl(url)
        const newMonitorId = await kumaClient.addMonitor(monitor)

        return NextResponse.json({
          success: true,
          monitorId: newMonitorId,
          message: `Monitor created for ${url}`,
          monitor
        })
      }

      case 'status': {
        if (!monitorId) {
          return NextResponse.json(
            { error: 'Monitor ID is required for status check' },
            { status: 400 }
          )
        }

        const status = await kumaClient.getMonitorStatus(monitorId)
        return NextResponse.json({
          success: true,
          status
        })
      }

      case 'uptime': {
        if (!monitorId) {
          return NextResponse.json(
            { error: 'Monitor ID is required for uptime stats' },
            { status: 400 }
          )
        }

        const uptimeStats = await kumaClient.getUptimeStats(monitorId, period)
        return NextResponse.json({
          success: true,
          stats: uptimeStats
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: add, status, or uptime' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Uptime Kuma API error:', error)
    
    // Check if Uptime Kuma is not available
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      return NextResponse.json({
        error: 'Uptime Kuma instance not available',
        message: 'Please ensure Uptime Kuma is running and accessible',
        kumaUrl: UPTIME_KUMA_URL
      }, { status: 503 })
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Uptime Kuma integration API',
    endpoints: {
      'POST /api/monitor/uptime-kuma': {
        add: 'Add new monitor',
        status: 'Get monitor status', 
        uptime: 'Get uptime statistics'
      }
    },
    config: {
      kumaUrl: UPTIME_KUMA_URL,
      hasAuth: !!(UPTIME_KUMA_USERNAME || UPTIME_KUMA_API_KEY)
    }
  })
}
