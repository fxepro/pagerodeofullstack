import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Normalize the URL
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`
    
    // Step 1: Fetch the webpage to discover links
    let response
    try {
      response = await fetch(normalizedUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })
    } catch (fetchError: any) {
      // Handle DNS and network errors immediately - don't retry
      if (fetchError.cause?.code === 'ENOTFOUND') {
        return NextResponse.json(
          { 
            error: `Domain "${url}" cannot be resolved. Please check the domain name exists and is spelled correctly.`,
            errorCode: 'DNS_NOT_FOUND',
            retryable: false
          },
          { status: 400 }
        )
      }
      if (fetchError.name === 'AbortError' || fetchError.message.includes('timeout')) {
        return NextResponse.json(
          { 
            error: 'Request timeout. The server took too long to respond.',
            errorCode: 'TIMEOUT',
            retryable: true
          },
          { status: 408 }
        )
      }
      throw fetchError // Re-throw other errors
    }

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: `HTTP ${response.status}: ${response.statusText}`,
          errorCode: 'HTTP_ERROR',
          retryable: response.status >= 500
        },
        { status: response.status }
      )
    }

    const html = await response.text()
    
    // Parse HTML to extract links
    const links: string[] = []
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi
    let match

    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1]
      try {
        let absoluteUrl: string
        
        if (href.startsWith('http://') || href.startsWith('https://')) {
          absoluteUrl = href
        } else if (href.startsWith('//')) {
          absoluteUrl = `https:${href}`
        } else if (href.startsWith('/')) {
          const urlObj = new URL(normalizedUrl)
          absoluteUrl = `${urlObj.protocol}//${urlObj.host}${href}`
        } else {
          const urlObj = new URL(normalizedUrl)
          absoluteUrl = `${urlObj.protocol}//${urlObj.host}/${href}`
        }
        
        // Filter out common non-page URLs
        if (!absoluteUrl.includes('#') && 
            !absoluteUrl.includes('mailto:') && 
            !absoluteUrl.includes('tel:') &&
            !absoluteUrl.includes('javascript:') &&
            !absoluteUrl.includes('.pdf') &&
            !absoluteUrl.includes('.jpg') &&
            !absoluteUrl.includes('.png') &&
            !absoluteUrl.includes('.gif') &&
            !absoluteUrl.includes('.css') &&
            !absoluteUrl.includes('.js')) {
          links.push(absoluteUrl)
        }
      } catch (error) {
        console.warn(`Invalid URL: ${href}`)
      }
    }

    // Remove duplicates
    const uniqueLinks = [...new Set(links)]

    if (uniqueLinks.length === 0) {
      return NextResponse.json({ 
        links: [],
        results: [],
        message: 'No links found to check'
      })
    }

    // Step 2: Check each link status
    const results = []
    const domainObj = new URL(normalizedUrl)
    const baseDomain = `${domainObj.protocol}//${domainObj.host}`

    for (const link of uniqueLinks) {
      try {
        const startTime = Date.now()
        
        // Try HEAD first, then GET if HEAD fails
        let linkResponse = await fetch(link, {
          method: 'HEAD',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        })

        // If HEAD fails, try GET to get more information
        if (!linkResponse.ok && linkResponse.status >= 400) {
          try {
            linkResponse = await fetch(link, {
              method: 'GET',
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
              }
            })
          } catch (getError) {
            // Keep the original HEAD response if GET also fails
          }
        }

        const responseTime = Date.now() - startTime
        const isInternal = link.startsWith(baseDomain)

        // Enhanced error information
        let errorDetails = undefined
        if (!linkResponse.ok) {
          const statusText = linkResponse.statusText || getStatusText(linkResponse.status)
          errorDetails = `${linkResponse.status} ${statusText}`
          
          // Add troubleshooting suggestions based on status code
          switch (linkResponse.status) {
            case 404:
              errorDetails += ' - Page not found. Check if URL is correct or page was moved.'
              break
            case 403:
              errorDetails += ' - Access forbidden. Server refuses to serve the content.'
              break
            case 500:
              errorDetails += ' - Internal server error. Website server is having issues.'
              break
            case 503:
              errorDetails += ' - Service unavailable. Server is temporarily overloaded.'
              break
            case 301:
            case 302:
              errorDetails += ' - Redirect detected. Link may need to be updated.'
              break
          }
        }

        results.push({
          url: link,
          status: linkResponse.status,
          statusText: linkResponse.statusText || getStatusText(linkResponse.status),
          responseTime,
          isInternal,
          error: errorDetails
        })
      } catch (error) {
        const isInternal = link.startsWith(baseDomain)
        let errorMessage = 'Network Error'
        
        if (error instanceof Error) {
          if (error.message.includes('fetch')) {
            errorMessage = 'Failed to fetch - Check if URL is accessible and server is running'
          } else if (error.message.includes('timeout')) {
            errorMessage = 'Request timeout - Server is too slow or unresponsive'
          } else if (error.message.includes('DNS')) {
            errorMessage = 'DNS Error - Domain name cannot be resolved'
          } else {
            errorMessage = error.message
          }
        }

        results.push({
          url: link,
          status: 0,
          statusText: 'Network Error',
          responseTime: 0,
          isInternal,
          error: errorMessage
        })
      }
    }

    // Helper function to get status text for common codes
    function getStatusText(status: number): string {
      const statusTexts: { [key: number]: string } = {
        200: 'OK',
        301: 'Moved Permanently',
        302: 'Found',
        304: 'Not Modified',
        400: 'Bad Request',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Not Found',
        500: 'Internal Server Error',
        502: 'Bad Gateway',
        503: 'Service Unavailable',
        504: 'Gateway Timeout'
      }
      return statusTexts[status] || 'Unknown Status'
    }

    return NextResponse.json({
      links: uniqueLinks,
      results: results,
      message: `Found ${uniqueLinks.length} links. Checked ${results.length} links.`
    })

  } catch (error) {
    console.error('Error in links API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
