/**
 * Utility functions to save analysis results to normalized database tables
 */

import { getApiBaseUrl, getDjangoApiUrl } from './api-config';

export type AnalysisType = 
  | 'performance' 
  | 'monitor' 
  | 'ssl' 
  | 'dns' 
  | 'sitemap' 
  | 'api' 
  | 'links' 
  | 'typography';

/**
 * Transform performance analysis data to match database schema
 */
function transformPerformanceData(data: any, url: string): any {
  // Ensure required fields are never null/undefined
  const performanceScore = data.performanceScore ?? data.performance_score ?? 0;
  const lcp = data.coreWebVitals?.lcp ?? data.lcp ?? 0;
  const fid = data.coreWebVitals?.fid ?? data.fid ?? 0;
  const cls = data.coreWebVitals?.cls ?? data.cls ?? 0;
  
  return {
    url: url.startsWith('http') ? url : `https://${url}`,
    device: data.device || 'desktop',
    performance_score: typeof performanceScore === 'number' ? performanceScore : 0,
    lcp: typeof lcp === 'number' ? lcp : 0,
    fid: typeof fid === 'number' ? fid : 0,
    cls: typeof cls === 'number' ? cls : 0,
    tti: data.tti ?? data.timeToInteractive ?? null,
    tbt: data.tbt ?? data.totalBlockingTime ?? null,
    fcp: data.fcp ?? data.firstContentfulPaint ?? null,
    speed_index: data.speedIndex ?? data.speed_index ?? null,
    page_size_mb: data.pageSize ? (data.pageSize / 1024) : (data.page_size_mb ?? null),
    request_count: data.requests ?? data.request_count ?? null,
    load_time: data.loadTime ?? data.load_time ?? null,
    dom_content_loaded: data.timeline?.domContentLoaded ?? data.dom_content_loaded ?? null,
    first_paint: data.timeline?.firstPaint ?? data.first_paint ?? null,
    accessibility_score: data.lighthouseResults?.accessibility ?? data.accessibility_score ?? null,
    best_practices_score: data.lighthouseResults?.bestPractices ?? data.best_practices_score ?? null,
    seo_score: data.lighthouseResults?.seo ?? data.seo_score ?? null,
    // resources field should be EMPTY or minimal summary - detailed data goes to network_request table
    resources: [],  // Don't store detailed resources here - they go to network_request table
    recommendations: data.recommendations ?? [],
    // Use fullResults if available (from PageSpeed API), otherwise use data
    full_results: data.fullResults ?? data.full_results ?? data ?? {}
  };
}

/**
 * Transform SSL analysis data to match database schema
 */
function transformSSLData(data: any, url: string): any {
  return {
    url: url.startsWith('http') ? url : `https://${url}`,
    is_valid: data.isValid !== undefined ? data.isValid : data.is_valid,
    expires_at: data.expiresAt || data.expires_at,
    days_until_expiry: data.daysUntilExpiry || data.days_until_expiry,
    issuer: data.issuer || '',
    subject: data.subject || '',
    serial_number: data.serialNumber || data.serial_number || '',
    root_ca_valid: data.rootCAValid !== undefined ? data.rootCAValid : (data.root_ca_valid !== undefined ? data.root_ca_valid : true),
    intermediate_valid: data.intermediateValid !== undefined ? data.intermediateValid : (data.intermediate_valid !== undefined ? data.intermediate_valid : true),
    certificate_valid: data.certificateValid !== undefined ? data.certificateValid : (data.certificate_valid !== undefined ? data.certificate_valid : true),
    protocol: data.protocol || '',
    cipher_suite: data.cipherSuite || data.cipher_suite || '',
    certificate_chain: data.certificateChain || data.certificate_chain || [],
    san_domains: data.sanDomains || data.san_domains || [],
    ssl_health_score: data.healthScore || data.ssl_health_score,
    issues: data.issues || [],
    recommendations: data.recommendations || [],
    full_results: data
  };
}

/**
 * Transform DNS analysis data to match database schema
 */
function transformDNSData(data: any, url: string): any {
  return {
    url: url.startsWith('http') ? url : `https://${url}`,
    a_records: data.aRecords || data.a_records || [],
    aaaa_records: data.aaaaRecords || data.aaaa_records || [],
    mx_records: data.mxRecords || data.mx_records || [],
    txt_records: data.txtRecords || data.txt_records || [],
    cname_records: data.cnameRecords || data.cname_records || [],
    ns_records: data.nsRecords || data.ns_records || [],
    soa_record: data.soaRecord || data.soa_record || {},
    ptr_records: data.ptrRecords || data.ptr_records || [],
    srv_records: data.srvRecords || data.srv_records || [],
    response_time_ms: data.responseTime || data.response_time_ms,
    dns_server: data.dnsServer || data.dns_server || '',
    dns_server_ip: data.dnsServerIP || data.dns_server_ip,
    dns_health_score: data.healthScore || data.dns_health_score,
    issues: data.issues || [],
    recommendations: data.recommendations || [],
    full_results: data
  };
}

/**
 * Transform sitemap analysis data to match database schema
 */
function transformSitemapData(data: any, url: string): any {
  return {
    url: url.startsWith('http') ? url : `https://${url}`,
    sitemap_found: data.sitemapFound !== undefined ? data.sitemapFound : data.sitemap_found,
    sitemap_url: data.sitemapUrl || data.sitemap_url || '',
    sitemap_type: data.sitemapType || data.sitemap_type || '',
    total_urls: data.totalUrls || data.total_urls,
    last_modified: data.lastModified || data.last_modified,
    change_frequency: data.changeFrequency || data.change_frequency || '',
    priority: data.priority,
    urls: data.urls || [],
    is_sitemap_index: data.isSitemapIndex !== undefined ? data.isSitemapIndex : data.is_sitemap_index,
    sitemap_index_urls: data.sitemapIndexUrls || data.sitemap_index_urls || [],
    issues: data.issues || [],
    recommendations: data.recommendations || [],
    health_score: data.healthScore || data.health_score,
    full_results: data
  };
}

/**
 * Transform API analysis data to match database schema
 */
function transformAPIData(data: any, url: string): any {
  return {
    url: url.startsWith('http') ? url : `https://${url}`,
    endpoints: data.endpoints || data.discoveredEndpoints || [],
    total_endpoints: data.totalEndpoints || data.total_endpoints,
    endpoints_by_method: data.endpointsByMethod || data.endpoints_by_method || {},
    endpoints_by_status: data.endpointsByStatus || data.endpoints_by_status || {},
    api_health_score: data.healthScore || data.api_health_score,
    issues: data.issues || [],
    recommendations: data.recommendations || [],
    response_types: data.responseTypes || data.response_types || [],
    auth_methods: data.authMethods || data.auth_methods || [],
    requires_auth: data.requiresAuth !== undefined ? data.requiresAuth : data.requires_auth,
    full_results: data
  };
}

/**
 * Transform links analysis data to match database schema
 */
function transformLinksData(data: any, url: string): any {
  // Ensure links is always an array
  let links = data.links || data.discoveredLinks || [];
  if (!Array.isArray(links)) {
    console.warn('[TransformLinks] links is not an array:', typeof links, links);
    links = [];
  }
  
  return {
    url: url.startsWith('http') ? url : `https://${url}`,
    links: links, // Always ensure it's an array
    total_links: data.totalLinks || data.total_links || links.length,
    internal_links: data.internalLinks || data.internal_links,
    external_links: data.externalLinks || data.external_links,
    broken_links: data.brokenLinks || data.broken_links || 0,
    redirect_links: data.redirectLinks || data.redirect_links,
    links_by_status: data.linksByStatus || data.links_by_status || {},
    links_health_score: data.healthScore || data.links_health_score,
    issues: Array.isArray(data.issues) ? data.issues : [],
    recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
    broken_links_list: Array.isArray(data.brokenLinksList) ? data.brokenLinksList : (Array.isArray(data.broken_links_list) ? data.broken_links_list : []),
    avg_response_time: data.avgResponseTime || data.avg_response_time,
    min_response_time: data.minResponseTime || data.min_response_time,
    max_response_time: data.maxResponseTime || data.max_response_time,
    full_results: data
  };
}

/**
 * Transform monitor analysis data to match database schema
 */
function transformMonitorData(data: any, url: string): any {
  // Extract SSL info from nested structure
  const sslInfo = data.ssl || {};
  const headers = data.headers || {};
  
  return {
    url: url.startsWith('http') ? url : `https://${url}`,
    status: data.status || 'down',
    statusCode: data.statusCode || null,
    responseTime: data.responseTime || data.response_time || 0,
    // SSL fields (flat structure for backend)
    ssl: {
      valid: sslInfo.valid || null,
      expiresIn: sslInfo.expiresIn || sslInfo.expires_in || null,
      issuer: sslInfo.issuer || '',
    },
    // Headers (flat structure for backend)
    headers: {
      server: headers.server || '',
      contentType: headers.contentType || headers.content_type || '',
    },
    error: data.error || data.error_message || '',
    uptimePercentage: data.uptimePercentage || data.uptime_percentage || null,
    totalChecks: data.totalChecks || data.total_checks || null,
    successfulChecks: data.successfulChecks || data.successful_checks || null,
    failedChecks: data.failedChecks || data.failed_checks || null,
    avgResponseTime: data.avgResponseTime || data.avg_response_time || null,
    minResponseTime: data.minResponseTime || data.min_response_time || null,
    maxResponseTime: data.maxResponseTime || data.max_response_time || null,
    healthScore: data.healthScore || data.health_score || null,
    issues: Array.isArray(data.issues) ? data.issues : [],
    recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
    full_results: data
  };
}

/**
 * Transform typography analysis data to match database schema
 */
function transformTypographyData(data: any, url: string): any {
  return {
    url: url.startsWith('http') ? url : `https://${url}`,
    fonts_used: data.fontsUsed || data.fonts_used || [],
    font_sizes: data.fontSizes || data.font_sizes || [],
    font_weights: data.fontWeights || data.font_weights || [],
    line_heights: data.lineHeights || data.line_heights || [],
    font_families: data.fontFamilies || data.font_families || [],
    total_fonts: data.totalFonts || data.total_fonts,
    total_font_sizes: data.totalFontSizes || data.total_font_sizes,
    min_font_size: data.minFontSize || data.min_font_size,
    max_font_size: data.maxFontSize || data.max_font_size,
    avg_font_size: data.avgFontSize || data.avg_font_size,
    issues: data.issues || [],
    recommendations: data.recommendations || [],
    health_score: data.healthScore || data.health_score,
    accessibility_issues: data.accessibilityIssues || data.accessibility_issues || [],
    full_results: data
  };
}

/**
 * Save analysis result to normalized database table
 */
export async function saveAnalysisToDatabase(
  type: AnalysisType,
  data: any,
  auditReportId: string | null,
  url: string,
  token?: string | null
): Promise<boolean> {
  const endpointMap: Record<AnalysisType, string> = {
    performance: '/api/analysis/performance/',
    ssl: '/api/analysis/ssl/',
    dns: '/api/analysis/dns/',
    sitemap: '/api/analysis/sitemap/',
    api: '/api/analysis/api/',
    links: '/api/analysis/links/',
    typography: '/api/analysis/typography/',
    monitor: '/api/analysis/monitor/',
  };

  const endpoint = endpointMap[type];
  if (!endpoint) {
    console.log(`[SaveAnalysis] Skipping ${type} - no endpoint defined`);
    return false;
  }

  // Transform data based on type
  let transformedData: any;
  switch (type) {
    case 'performance':
      transformedData = transformPerformanceData(data, url);
      break;
    case 'ssl':
      transformedData = transformSSLData(data, url);
      break;
    case 'dns':
      transformedData = transformDNSData(data, url);
      break;
    case 'sitemap':
      transformedData = transformSitemapData(data, url);
      break;
    case 'api':
      transformedData = transformAPIData(data, url);
      break;
    case 'links':
      transformedData = transformLinksData(data, url);
      break;
    case 'typography':
      transformedData = transformTypographyData(data, url);
      break;
    case 'monitor':
      transformedData = transformMonitorData(data, url);
      break;
    default:
      console.warn(`[SaveAnalysis] Unknown analysis type: ${type}`);
      return false;
  }

  // CRITICAL: Always use the URL parameter passed in, never trust URL from data
  // This ensures we save data for the correct URL even if cached/old data has a different URL
  const finalUrl = url.startsWith('http') ? url : `https://${url}`;
  transformedData.url = finalUrl;
  
  // Add audit_report_id
  transformedData.audit_report_id = auditReportId;

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Debug: Log what we're sending
    console.log(`[SaveAnalysis] Saving ${type} analysis:`, {
      endpoint,
      finalUrl: transformedData.url,
      audit_report_id: transformedData.audit_report_id,
      inputUrl: url,
      dataUrl: data?.url || data?.domain || 'none',
      hasData: !!transformedData
    });

    // Use getDjangoApiUrl to ensure correct Django backend URL
    const fullUrl = getDjangoApiUrl(endpoint);
    
    console.log(`[SaveAnalysis] ========================================`);
    console.log(`[SaveAnalysis] SENDING REQUEST TO BACKEND`);
    console.log(`[SaveAnalysis] ========================================`);
    console.log(`[SaveAnalysis] Endpoint: ${fullUrl}`);
    console.log(`[SaveAnalysis] Type: ${type}`);
    console.log(`[SaveAnalysis] URL: ${url}`);
    console.log(`[SaveAnalysis] audit_report_id: ${auditReportId}`);
    console.log(`[SaveAnalysis] Request payload keys:`, Object.keys(transformedData));
    console.log(`[SaveAnalysis] Has full_results: ${!!transformedData.full_results}`);
    if (transformedData.full_results) {
      console.log(`[SaveAnalysis] full_results type:`, typeof transformedData.full_results);
      console.log(`[SaveAnalysis] Has lighthouseResult:`, 'lighthouseResult' in (transformedData.full_results || {}));
    }
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(transformedData),
    });

    console.log(`[SaveAnalysis] Response status: ${response.status} ${response.statusText}`);
    console.log(`[SaveAnalysis] ========================================`);

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ [SaveAnalysis] ${type} analysis saved to database (ID: ${result.id})`);
      return true;
    } else {
      // Get error text - try text first, then JSON
      let errorText = '';
      let errorData: any = {};
      
      try {
        // Clone response to read it multiple times if needed
        const responseClone = response.clone();
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          try {
            errorData = await response.json();
            errorText = JSON.stringify(errorData);
          } catch (jsonError) {
            // If JSON parsing fails, try text
            errorText = await responseClone.text();
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { error: errorText || 'Empty error response', jsonParseError: String(jsonError) };
            }
          }
        } else {
          errorText = await response.text();
          // Try to parse as JSON even if content-type doesn't say so
          try {
            if (errorText) {
              errorData = JSON.parse(errorText);
            } else {
              errorData = { error: 'Empty response body' };
            }
          } catch {
            errorData = { error: errorText || 'Empty error response' };
          }
        }
      } catch (parseError) {
        console.error(`[SaveAnalysis] Failed to parse error response:`, parseError);
        errorText = 'Could not read error response';
        errorData = { 
          error: errorText, 
          parseError: String(parseError),
          status: response.status,
          statusText: response.statusText
        };
      }
      
      // Enhanced error logging - ensure we always have some data
      const errorInfo: any = {
        status: response.status,
        statusText: response.statusText,
        error: errorData && Object.keys(errorData).length > 0 ? errorData : { error: 'Unknown error - empty response' },
        errorText: errorText ? errorText.substring(0, 500) : 'No error text available',
        url: fullUrl,
        endpoint: endpoint,
        payloadKeys: Object.keys(transformedData),
        auditReportId: transformedData.audit_report_id || 'NOT PROVIDED',
        urlInPayload: transformedData.url || 'NOT PROVIDED',
        hasFullResults: !!transformedData.full_results,
      };
      
      // For links, show the structure
      if (type === 'links') {
        errorInfo.linksType = typeof transformedData.links;
        errorInfo.linksIsArray = Array.isArray(transformedData.links);
        errorInfo.linksLength = Array.isArray(transformedData.links) ? transformedData.links.length : 'N/A';
        errorInfo.linksSample = Array.isArray(transformedData.links) && transformedData.links.length > 0 
          ? transformedData.links[0] 
          : 'empty';
        errorInfo.linksValue = Array.isArray(transformedData.links) 
          ? `Array with ${transformedData.links.length} items`
          : String(transformedData.links).substring(0, 200);
        errorInfo.fullResultsKeys = transformedData.full_results && typeof transformedData.full_results === 'object'
          ? Object.keys(transformedData.full_results).slice(0, 10)
          : 'N/A';
      }
      
      console.error(`❌ [SaveAnalysis] Failed to save ${type} analysis:`, JSON.stringify(errorInfo, null, 2));
      return false;
    }
  } catch (error) {
    console.error(`❌ [SaveAnalysis] Exception saving ${type} analysis:`, error);
    if (error instanceof Error) {
      console.error(`[SaveAnalysis] Error message: ${error.message}`);
      console.error(`[SaveAnalysis] Error stack:`, error.stack);
    } else {
      console.error(`[SaveAnalysis] Unknown error type:`, typeof error, error);
    }
    // Don't re-throw - return false to indicate failure
    return false;
  }
}

