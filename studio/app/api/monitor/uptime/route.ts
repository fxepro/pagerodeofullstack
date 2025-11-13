import { NextRequest, NextResponse } from 'next/server'

// Mock uptime data store (in production, this would be a database)
const uptimeData = new Map<string, any>()

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get('url')
  const days = parseInt(searchParams.get('days') || '30')

  if (!url) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    )
  }

  // Generate mock uptime data for the specified period
  const generateMockData = (daysBack: number) => {
    const data = []
    const now = new Date()
    
    for (let i = daysBack - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const uptime = Math.random() > 0.02 ? 100 : Math.random() * 50 + 50
      const incidents = uptime < 100 ? 1 : 0
      
      data.push({
        date: date.toISOString().split('T')[0],
        uptime: Math.round(uptime * 100) / 100,
        incidents,
        responseTime: 150 + Math.random() * 300,
        checks: 2880 // checks per day (every 30 seconds)
      })
    }
    
    return data
  }

  const mockData = generateMockData(days)
  
  // Calculate summary statistics
  const totalUptime = mockData.reduce((sum, day) => sum + day.uptime, 0) / mockData.length
  const totalIncidents = mockData.reduce((sum, day) => sum + day.incidents, 0)
  const avgResponseTime = mockData.reduce((sum, day) => sum + day.responseTime, 0) / mockData.length

  return NextResponse.json({
    url,
    period: `${days} days`,
    summary: {
      uptime: Math.round(totalUptime * 100) / 100,
      incidents: totalIncidents,
      avgResponseTime: Math.round(avgResponseTime),
      totalChecks: mockData.length * 2880
    },
    daily: mockData,
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  try {
    const { url, status, responseTime } = await request.json()

    if (!url || !status) {
      return NextResponse.json(
        { error: 'URL and status are required' },
        { status: 400 }
      )
    }

    // Store uptime data point (in production, this would go to a database)
    const key = `${url}-${new Date().toISOString().split('T')[0]}`
    const existing = uptimeData.get(key) || { checks: 0, upChecks: 0, totalResponseTime: 0 }
    
    existing.checks += 1
    if (status === 'up') {
      existing.upChecks += 1
    }
    if (responseTime) {
      existing.totalResponseTime += responseTime
    }
    
    uptimeData.set(key, existing)

    return NextResponse.json({
      success: true,
      message: 'Uptime data recorded',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Uptime API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
