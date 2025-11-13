import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url, device } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    if (!['desktop', 'mobile', 'tablet'].includes(device)) {
      return NextResponse.json(
        { error: 'Invalid device type' },
        { status: 400 }
      );
    }

    // Normalize URL
    const targetUrl = url.startsWith('http') ? url : `https://${url}`;

    // Get PageSpeed API key
    const apiKey = process.env.PAGESPEED_API_KEY;
    
    if (!apiKey || apiKey === 'NO_KEY') {
      return NextResponse.json(
        { error: 'PageSpeed API key not configured. Add PAGESPEED_API_KEY to .env.local' },
        { status: 500 }
      );
    }

    // Map device to PageSpeed strategy
    // Note: PageSpeed API only supports 'desktop' and 'mobile'
    // For tablet, we'll use mobile strategy as it's closer to tablet behavior
    const strategy = device === 'desktop' ? 'desktop' : 'mobile';

    // Build PageSpeed Insights API URL
    const pageSpeedUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&key=${apiKey}&category=performance&category=accessibility&strategy=${strategy}`;

    console.log(`[pagerodeo] Testing ${device} (${strategy} strategy) for:`, targetUrl);

    const response = await fetch(pageSpeedUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[pagerodeo] PageSpeed API error:', errorText);
      throw new Error(`PageSpeed API error: ${response.status}`);
    }

    const pageSpeedData = await response.json();
    const lighthouseResult = pageSpeedData.lighthouseResult;
    const audits = lighthouseResult.audits;

    // Extract performance score
    const performanceScore = Math.round((lighthouseResult.categories.performance?.score || 0) * 100);

    // Extract Core Web Vitals (in milliseconds from API)
    const metrics = {
      lcp: (audits['largest-contentful-paint']?.numericValue || 0) / 1000, // Convert to seconds
      fid: audits['max-potential-fid']?.numericValue || 0, // Already in ms
      cls: audits['cumulative-layout-shift']?.numericValue || 0,
      tti: (audits['interactive']?.numericValue || 0) / 1000, // Convert to seconds
      tbt: audits['total-blocking-time']?.numericValue || 0, // Already in ms
    };

    // Extract page info
    const networkRequests = audits['network-requests']?.details?.items || [];
    const totalBytes = networkRequests.reduce((sum: number, item: any) => sum + (item.transferSize || 0), 0);
    const pageSize = totalBytes / (1024 * 1024); // Convert to MB

    // Extract issues
    const issues: string[] = [];

    if (device === 'mobile' || device === 'tablet') {
      // Mobile/Tablet-specific audits
      if (audits['tap-targets'] && audits['tap-targets'].score !== null && audits['tap-targets'].score < 1) {
        issues.push('Touch targets are too small or too close together');
      }
      if (audits['font-size'] && audits['font-size'].score !== null && audits['font-size'].score < 1) {
        issues.push('Text is too small to read on mobile devices');
      }
      if (audits['viewport'] && audits['viewport'].score !== null && audits['viewport'].score < 1) {
        issues.push('Viewport not configured for mobile devices');
      }
      if (audits['uses-responsive-images'] && audits['uses-responsive-images'].score !== null && audits['uses-responsive-images'].score < 1) {
        const savings = audits['uses-responsive-images']?.details?.overallSavingsBytes;
        if (savings && savings > 100000) {
          issues.push(`Images not optimized for mobile (potential ${Math.round(savings / 1024)}KB savings)`);
        }
      }
    }

    // General performance issues
    if (audits['render-blocking-resources'] && audits['render-blocking-resources'].score !== null && audits['render-blocking-resources'].score < 1) {
      issues.push('Render-blocking resources detected');
    }
    if (audits['unused-javascript'] && audits['unused-javascript'].score !== null && audits['unused-javascript'].score < 1) {
      issues.push('Unused JavaScript detected');
    }
    if (audits['unused-css-rules'] && audits['unused-css-rules'].score !== null && audits['unused-css-rules'].score < 1) {
      issues.push('Unused CSS detected');
    }

    // Extract recommendations
    const recommendations: Array<{
      priority: 'high' | 'medium' | 'low';
      message: string;
      savings?: string;
    }> = [];

    // High priority recommendations
    if (audits['offscreen-images'] && audits['offscreen-images'].score !== null && audits['offscreen-images'].score < 1) {
      const savings = audits['offscreen-images']?.details?.overallSavingsBytes;
      recommendations.push({
        priority: 'high',
        message: 'Defer offscreen images (lazy loading)',
        savings: savings ? `${Math.round(savings / 1024)}KB` : undefined
      });
    }

    if ((device === 'mobile' || device === 'tablet') && audits['uses-responsive-images'] && audits['uses-responsive-images'].score !== null && audits['uses-responsive-images'].score < 1) {
      const savings = audits['uses-responsive-images']?.details?.overallSavingsBytes;
      recommendations.push({
        priority: 'high',
        message: 'Properly size images for mobile devices',
        savings: savings ? `${Math.round(savings / 1024)}KB` : undefined
      });
    }

    if (audits['modern-image-formats'] && audits['modern-image-formats'].score !== null && audits['modern-image-formats'].score < 1) {
      const savings = audits['modern-image-formats']?.details?.overallSavingsBytes;
      recommendations.push({
        priority: 'high',
        message: 'Serve images in modern formats (WebP, AVIF)',
        savings: savings ? `${Math.round(savings / 1024)}KB` : undefined
      });
    }

    // Medium priority
    if (audits['unused-javascript'] && audits['unused-javascript'].score !== null && audits['unused-javascript'].score < 1) {
      const savings = audits['unused-javascript']?.details?.overallSavingsBytes;
      recommendations.push({
        priority: 'medium',
        message: 'Remove unused JavaScript',
        savings: savings ? `${Math.round(savings / 1024)}KB` : undefined
      });
    }

    if (audits['unminified-javascript'] && audits['unminified-javascript'].score !== null && audits['unminified-javascript'].score < 1) {
      const savings = audits['unminified-javascript']?.details?.overallSavingsBytes;
      recommendations.push({
        priority: 'medium',
        message: 'Minify JavaScript files',
        savings: savings ? `${Math.round(savings / 1024)}KB` : undefined
      });
    }

    // Get load time (Speed Index)
    const loadTime = (audits['speed-index']?.numericValue || 0) / 1000;

    console.log(`[pagerodeo] ${device} test complete - Score: ${performanceScore}`);

    return NextResponse.json({
      device,
      performanceScore,
      metrics,
      pageSize,
      requests: networkRequests.length,
      loadTime,
      issues,
      recommendations: recommendations.slice(0, 5)
    });

  } catch (error) {
    console.error('[pagerodeo] Device testing error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Testing failed',
        details: 'Failed to run device performance test. Please try again.'
      },
      { status: 500 }
    );
  }
}

