import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'

export async function POST(request: NextRequest) {
  let domain: string | undefined;
  try {
    const body = await request.json();
    domain = body.domain;

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      )
    }

    console.log(`[pagerodeo] Typography analysis for ${domain}`)

    let browser
    let page
    
    try {
      // Check if Puppeteer is available
      if (!puppeteer) {
        throw new Error('Puppeteer module not found. Please install: npm install puppeteer');
      }
      
      browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      }).catch((launchError) => {
        console.error('[pagerodeo] Puppeteer launch error:', launchError);
        throw new Error(`Failed to launch browser: ${launchError.message}. Puppeteer may not be installed or Chrome dependencies are missing.`);
      });
      
      page = await browser.newPage()

      // Track font requests
      const fontRequests: any[] = []
      
      page.on('response', async (response) => {
        const url = response.url()
        if (url.match(/\.(woff2|woff|ttf|otf|eot)$/i)) {
          try {
            const headers = response.headers()
            fontRequests.push({
              url,
              format: url.split('.').pop()?.toLowerCase(),
              contentLength: headers['content-length'] ? parseInt(headers['content-length']) : 0
            })
          } catch (error) {
            // Ignore errors for individual font requests
          }
        }
      })

      // Navigate to page with better error handling
      const startTime = Date.now()
      try {
        await page.goto(`https://${domain}`, { 
          waitUntil: 'networkidle0',
          timeout: 30000 
        })
      } catch (gotoError: any) {
        await browser.close()
        
        // Handle specific navigation errors
        if (gotoError.message.includes('ERR_NAME_NOT_RESOLVED')) {
          return NextResponse.json(
            { 
              error: `Domain "${domain}" cannot be resolved. Please check the domain name exists and is spelled correctly.`,
              errorCode: 'DNS_NOT_FOUND',
              retryable: false
            },
            { status: 400 }
          )
        }
        if (gotoError.message.includes('timeout') || gotoError.message.includes('Navigation timeout')) {
          return NextResponse.json(
            { 
              error: 'Navigation timeout. The page took too long to load.',
              errorCode: 'TIMEOUT',
              retryable: true
            },
            { status: 408 }
          )
        }
        throw gotoError // Re-throw other errors
      }
      const loadTime = Date.now() - startTime

    // Extract font and typography data
    const analysis = await page.evaluate(() => {
      const fonts = new Map<string, any>()
      const typography: any = {
        h1: { size: 'N/A', lineHeight: 'N/A', fontFamily: 'N/A', fontWeight: 'N/A', count: 0 },
        h2: { size: 'N/A', lineHeight: 'N/A', fontFamily: 'N/A', fontWeight: 'N/A', count: 0 },
        h3: { size: 'N/A', lineHeight: 'N/A', fontFamily: 'N/A', fontWeight: 'N/A', count: 0 },
        h4: { size: 'N/A', lineHeight: 'N/A', fontFamily: 'N/A', fontWeight: 'N/A', count: 0 },
        h5: { size: 'N/A', lineHeight: 'N/A', fontFamily: 'N/A', fontWeight: 'N/A', count: 0 },
        h6: { size: 'N/A', lineHeight: 'N/A', fontFamily: 'N/A', fontWeight: 'N/A', count: 0 },
        body: { size: 'N/A', lineHeight: 'N/A', fontFamily: 'N/A', fontWeight: 'N/A', count: 0 },
        small: { size: 'N/A', lineHeight: 'N/A', fontFamily: 'N/A', fontWeight: 'N/A', count: 0 }
      }

      // Collect fonts from all elements
      document.querySelectorAll('*').forEach(el => {
        const styles = window.getComputedStyle(el)
        const fontFamily = styles.fontFamily.split(',')[0].replace(/['"]/g, '').trim()
        const fontSize = styles.fontSize
        const fontWeight = styles.fontWeight
        const lineHeight = styles.lineHeight
        
        if (!fonts.has(fontFamily)) {
          fonts.set(fontFamily, {
            family: fontFamily,
            weights: new Set<string>(),
            usedOn: new Set<string>()
          })
        }

        const font = fonts.get(fontFamily)
        font.weights.add(fontWeight)
        font.usedOn.add(el.tagName.toLowerCase())
      })

      // Analyze typography hierarchy
      const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
      headings.forEach(tag => {
        const elements = document.querySelectorAll(tag)
        if (elements.length > 0) {
          const firstEl = elements[0]
          const styles = window.getComputedStyle(firstEl)
          typography[tag] = {
            size: styles.fontSize,
            lineHeight: (parseFloat(styles.lineHeight) / parseFloat(styles.fontSize)).toFixed(2),
            fontFamily: styles.fontFamily.split(',')[0].replace(/['"]/g, '').trim(),
            fontWeight: styles.fontWeight,
            count: elements.length
          }
        }
      })

      // Body text
      const bodyElements = document.querySelectorAll('p, div')
      if (bodyElements.length > 0) {
        const bodyEl = bodyElements[0]
        const styles = window.getComputedStyle(bodyEl)
        typography.body = {
          size: styles.fontSize,
          lineHeight: (parseFloat(styles.lineHeight) / parseFloat(styles.fontSize)).toFixed(2),
          fontFamily: styles.fontFamily.split(',')[0].replace(/['"]/g, '').trim(),
          fontWeight: styles.fontWeight,
          count: bodyElements.length
        }
      }

      // Small text
      const smallElements = document.querySelectorAll('small, .text-sm, .text-xs')
      if (smallElements.length > 0) {
        const smallEl = smallElements[0]
        const styles = window.getComputedStyle(smallEl)
        typography.small = {
          size: styles.fontSize,
          lineHeight: (parseFloat(styles.lineHeight) / parseFloat(styles.fontSize)).toFixed(2),
          fontFamily: styles.fontFamily.split(',')[0].replace(/['"]/g, '').trim(),
          fontWeight: styles.fontWeight,
          count: smallElements.length
        }
      }

      // Check for Google Fonts
      const googleFontsLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]')
      const hasGoogleFonts = googleFontsLinks.length > 0

      // Convert fonts Map to array
      const fontsArray: { family: string; weights: string[]; usedOn: string[] }[] = Array.from(fonts.entries()).map(([family, data]) => ({
        family,
        weights: Array.from(data.weights) as string[],
        usedOn: Array.from(data.usedOn) as string[]
      }))

      return {
        fonts: fontsArray,
        typography,
        hasGoogleFonts
      }
    })

    await browser.close()

    // Process fonts and detect source
    const processedFonts = (analysis.fonts as { family: string; weights: string[]; usedOn: string[] }[]).map((font) => {
      // Detect if Google Font
      const isGoogleFont = font.family.match(/Roboto|Open Sans|Lato|Montserrat|Raleway|Poppins|Inter|Nunito/i)
      const isSystemFont = font.family.match(/Arial|Helvetica|Times|Georgia|Verdana|system-ui|sans-serif|serif/i)
      
      // Ensure weights is string[]
      const weights = Array.isArray(font.weights) ? font.weights as string[] : []
      
      return {
        family: font.family,
        source: isGoogleFont ? 'google' as const : isSystemFont ? 'system' as const : 'custom' as const,
        variants: weights.map((weight) => ({
          weight: parseInt(String(weight)) || 400,
          style: 'normal' as const,
          size: 0, // Will be populated from fontRequests
          format: 'woff2'
        })),
        usedOn: font.usedOn,
        settings: {
          display: 'swap',
          preload: false,
          fallback: 'sans-serif'
        }
      }
    })

    // Calculate summary
    const googleFonts = processedFonts.filter(f => f.source === 'google').length
    const customFonts = processedFonts.filter(f => f.source === 'custom').length
    const systemFonts = processedFonts.filter(f => f.source === 'system').length
    const totalVariants = processedFonts.reduce((sum, f) => sum + f.variants.length, 0)
    const totalSize = fontRequests.reduce((sum, r) => sum + r.contentLength, 0) / 1024 // Convert to KB

    // Calculate readability score
    const bodySize = parseInt(analysis.typography.body.size) || 16
    const bodyLineHeight = parseFloat(analysis.typography.body.lineHeight) || 1.5

    const readabilityScore = {
      fontSize: bodySize >= 16 ? 25 : bodySize >= 14 ? 15 : 10,
      lineHeight: bodyLineHeight >= 1.4 && bodyLineHeight <= 1.8 ? 30 : 20,
      contrast: 15, // Placeholder - would need actual contrast calculation
      hierarchy: 20  // Placeholder - would need actual hierarchy analysis
    }

    const overallReadability = Object.values(readabilityScore).reduce((sum, val) => sum + val, 0)

    // Generate issues and recommendations
    const issues: any[] = []
    const recommendations: any[] = []

    if (processedFonts.length > 4) {
      issues.push({
        severity: 'warning',
        category: 'performance',
        message: 'Too many font families loaded',
        impact: `${processedFonts.length} font families may impact performance`
      })
      recommendations.push({
        priority: 'high',
        category: 'performance',
        title: 'Reduce font families',
        description: 'Limit to 2-3 font families for better performance',
        savings: `~${Math.round(totalSize * 0.3)}KB`
      })
    }

    if (bodySize < 16) {
      issues.push({
        severity: 'warning',
        category: 'readability',
        message: 'Body text size below recommended minimum',
        impact: 'May reduce readability, especially on mobile devices'
      })
      recommendations.push({
        priority: 'medium',
        category: 'readability',
        title: 'Increase body text size',
        description: 'Use at least 16px for body text to improve readability'
      })
    }

    if (bodyLineHeight < 1.4 || bodyLineHeight > 1.8) {
      recommendations.push({
        priority: 'medium',
        category: 'readability',
        title: 'Optimize line height',
        description: 'Use line-height between 1.4 and 1.8 for optimal readability'
      })
    }

    // Calculate overall score
    const performanceScore = Math.max(0, 100 - (totalSize / 10)) // Penalize large sizes
    const overallScore = Math.round((performanceScore + overallReadability) / 2)

    const result = {
      domain,
      timestamp: new Date().toISOString(),
      summary: {
        totalFamilies: processedFonts.length,
        totalVariants,
        totalSize: Math.round(totalSize),
        googleFonts,
        customFonts,
        systemFonts,
        loadTime: Math.round(loadTime),
        overallScore
      },
      fonts: processedFonts,
      typography: analysis.typography,
      performance: {
        totalSize: Math.round(totalSize),
        totalRequests: fontRequests.length,
        loadTime: Math.round(loadTime),
        renderBlocking: 0,
        strategy: {
          display: 'swap',
          preloaded: 0,
          async: fontRequests.length
        },
        score: Math.round(performanceScore)
      },
      readability: {
        overallScore,
        breakdown: readabilityScore,
        strengths: [
          bodySize >= 16 ? 'Body text size meets accessibility standards' : null,
          bodyLineHeight >= 1.4 && bodyLineHeight <= 1.8 ? 'Line height is optimized for readability' : null,
        ].filter(Boolean),
        issues: [
          bodySize < 16 ? 'Body text size is below 16px' : null,
          bodyLineHeight < 1.4 ? 'Line height is too tight' : null,
          bodyLineHeight > 1.8 ? 'Line height is too loose' : null,
        ].filter(Boolean)
      },
      issues,
      recommendations
    }

    console.log(`[pagerodeo] Typography analysis complete:`, JSON.stringify(result, null, 2))
    
    await browser.close()
    return NextResponse.json(result)

    } catch (analyzeError) {
      if (browser) {
        await browser.close()
      }
      throw analyzeError
    }

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[pagerodeo] Typography analysis error:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    
    // Check for specific error types
    let errorMessage = 'Failed to analyze typography';
    let errorDetails = err.message || 'Unknown error';
    let retryable = false;
    let errorCode = 'ANALYSIS_FAILED';
    
    // Check if Puppeteer is available
    if (err.message.includes('Cannot find module') || err.message.includes('puppeteer') || err.message.includes('Failed to launch browser')) {
      errorMessage = 'Puppeteer is not installed or configured';
      errorDetails = 'Typography analysis requires Puppeteer and Chrome/Chromium. On production, ensure Puppeteer dependencies are installed.';
      retryable = false;
      errorCode = 'PUPPETEER_NOT_FOUND';
    } else if (err.message.includes('timeout') || err.message.includes('Navigation timeout')) {
      errorMessage = 'Analysis timed out';
      errorDetails = 'The page took too long to load. Please try again or check if the website is accessible.';
      retryable = true;
      errorCode = 'TIMEOUT';
    } else if (err.message.includes('ERR_NAME_NOT_RESOLVED') || err.message.includes('ENOTFOUND')) {
      errorMessage = 'Domain not found';
      errorDetails = domain 
        ? `The domain "${domain}" cannot be resolved. Please check the domain name is correct.`
        : 'The domain cannot be resolved. Please check the domain name is correct.';
      retryable = false;
      errorCode = 'DNS_NOT_FOUND';
    } else if (err.message.includes('ECONNREFUSED') || err.message.includes('Connection refused')) {
      errorMessage = 'Connection refused';
      errorDetails = 'Unable to connect to the website. The server may be down or blocking requests.';
      retryable = true;
      errorCode = 'CONNECTION_REFUSED';
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        retryable: retryable,
        errorCode: errorCode,
        // Include full error in development
        ...(process.env.NODE_ENV === 'development' && { 
          fullError: err.message,
          stack: err.stack 
        })
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Typography Analyzer API is running',
    timestamp: new Date().toISOString()
  })
}

