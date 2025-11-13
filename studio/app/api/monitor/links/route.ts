import { NextRequest, NextResponse } from 'next/server'

interface LinkResult {
  url: string
  statusCode: number
  responseTime: number
  status: 'success' | 'error' | 'redirect'
  error?: string
  title?: string
  isInternal: boolean
}

interface LinkTestResult {
  baseUrl: string
  totalLinks: number
  testedLinks: number
  results: LinkResult[]
  summary: {
    success: number
    errors: number
    redirects: number
    avgResponseTime: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url, includeExternal = false, maxLinks = 50 } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    let baseUrl: URL
    try {
      baseUrl = new URL(url.startsWith('http') ? url : `https://${url}`)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    console.log(`[pagerodeo] Starting link crawl for: ${baseUrl.toString()}`)

    // Step 1: Fetch the homepage
    const startTime = Date.now()
    let homepageContent: string
    
    try {
      const response = await fetch(baseUrl.toString(), {
        headers: {
          'User-Agent': 'PageRodeo-LinkCrawler/1.0'
        },
        signal: AbortSignal.timeout(15000), // 15 second timeout
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch homepage: ${response.status} ${response.statusText}`)
      }

      homepageContent = await response.text()
    } catch (error) {
      return NextResponse.json({
        error: 'Failed to fetch homepage',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }

    // Step 2: Parse HTML and extract links using regex (simpler approach)
    let links: string[] = []
    try {
      // Use regex to find href attributes in anchor tags
      const hrefRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi
      const linkSet = new Set<string>()
      let match

      while ((match = hrefRegex.exec(homepageContent)) !== null) {
        const href = match[1]
        if (!href) continue

        try {
          let fullUrl: string
          
          // Handle different types of URLs
          if (href.startsWith('http://') || href.startsWith('https://')) {
            // Absolute URL
            fullUrl = href
          } else if (href.startsWith('//')) {
            // Protocol-relative URL
            fullUrl = baseUrl.protocol + href
          } else if (href.startsWith('/')) {
            // Root-relative URL
            fullUrl = `${baseUrl.protocol}//${baseUrl.host}${href}`
          } else if (href.startsWith('#')) {
            // Skip anchor links
            continue
          } else if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
            // Skip non-HTTP protocols
            continue
          } else {
            // Relative URL
            const baseUrlWithoutPath = `${baseUrl.protocol}//${baseUrl.host}${baseUrl.pathname.endsWith('/') ? baseUrl.pathname : baseUrl.pathname + '/'}`
            fullUrl = new URL(href, baseUrlWithoutPath).toString()
          }

          const linkUrl = new URL(fullUrl)
          
          // Filter based on includeExternal setting
          if (!includeExternal && linkUrl.host !== baseUrl.host) {
            continue
          }

          // Remove fragments
          linkUrl.hash = ''
          linkSet.add(linkUrl.toString())
          
        } catch (error) {
          // Skip invalid URLs
          console.log(`[pagerodeo] Skipping invalid URL: ${href}`)
        }
      }

      links = Array.from(linkSet).slice(0, maxLinks)
    } catch (error) {
      return NextResponse.json({
        error: 'Failed to parse homepage HTML',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }

    console.log(`[pagerodeo] Found ${links.length} unique links to test`)

    // Step 3: Test each link
    const results: LinkResult[] = []
    const testPromises = links.map(async (linkUrl) => {
      const linkStartTime = Date.now()
      
      try {
        const response = await fetch(linkUrl, {
          method: 'HEAD', // Use HEAD to avoid downloading full content
          headers: {
            'User-Agent': 'PageRodeo-LinkTester/1.0'
          },
          signal: AbortSignal.timeout(10000), // 10 second timeout per link
        })

        const responseTime = Date.now() - linkStartTime
        const linkUrlObj = new URL(linkUrl)
        const isInternal = linkUrlObj.host === baseUrl.host

        let status: 'success' | 'error' | 'redirect'
        if (response.status >= 200 && response.status < 300) {
          status = 'success'
        } else if (response.status >= 300 && response.status < 400) {
          status = 'redirect'
        } else {
          status = 'error'
        }

        return {
          url: linkUrl,
          statusCode: response.status,
          responseTime,
          status,
          isInternal
        }
      } catch (error) {
        const responseTime = Date.now() - linkStartTime
        const linkUrlObj = new URL(linkUrl)
        const isInternal = linkUrlObj.host === baseUrl.host

        return {
          url: linkUrl,
          statusCode: 0,
          responseTime,
          status: 'error' as const,
          error: error instanceof Error ? error.message : 'Unknown error',
          isInternal
        }
      }
    })

    // Execute all tests concurrently with some rate limiting
    const batchSize = 10 // Test 10 links at a time
    for (let i = 0; i < testPromises.length; i += batchSize) {
      const batch = testPromises.slice(i, i + batchSize)
      const batchResults = await Promise.all(batch)
      results.push(...batchResults)
    }

    // Step 4: Calculate summary statistics
    const summary = {
      success: results.filter(r => r.status === 'success').length,
      errors: results.filter(r => r.status === 'error').length,
      redirects: results.filter(r => r.status === 'redirect').length,
      avgResponseTime: Math.round(results.reduce((sum, r) => sum + r.responseTime, 0) / results.length)
    }

    const totalTime = Date.now() - startTime
    console.log(`[pagerodeo] Link crawl completed in ${totalTime}ms. Tested ${results.length} links.`)

    const result: LinkTestResult = {
      baseUrl: baseUrl.toString(),
      totalLinks: links.length,
      testedLinks: results.length,
      results: results.sort((a, b) => a.statusCode - b.statusCode), // Sort by status code
      summary
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Link crawler API error:', error)
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
    message: 'Link Crawler API',
    description: 'Crawls a website homepage and tests all first-level links',
    endpoints: {
      'POST /api/monitor/links': {
        description: 'Crawl homepage and test links',
        parameters: {
          url: 'Website URL to crawl',
          includeExternal: 'Include external links (default: false)',
          maxLinks: 'Maximum links to test (default: 50)'
        }
      }
    }
  })
}
