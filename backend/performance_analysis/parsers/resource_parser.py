"""
Resource breakdown parser for Lighthouse data.

Extracts resource categorization and optimization opportunities.
"""

from typing import List
from ..models import ResourceBreakdown
from .base_normalizer import normalize_lighthouse_json


def parse_resource_breakdown(performance_analysis, lighthouse_data):
    """
    Parse resource breakdown from Lighthouse data.
    
    Args:
        performance_analysis: PerformanceAnalysis instance
        lighthouse_data: Raw Lighthouse JSON data
        
    Returns:
        List of created ResourceBreakdown objects
    """
    if not lighthouse_data:
        return []
    
    # Normalize the JSON structure
    lighthouse_result = normalize_lighthouse_json(lighthouse_data)
    if not lighthouse_result or not isinstance(lighthouse_result, dict):
        print("[ParseResourceBreakdown] Failed to normalize lighthouse_data or result is not a dict")
        return []
    
    audits = lighthouse_result.get('audits', {})
    
    # Get audit_report from performance_analysis for direct linking
    audit_report = performance_analysis.audit_report
    
    # Get resource data from various audits
    resource_breakdowns = []
    
    # DEBUG: Log structure
    print(f"[ParseResourceBreakdown] lighthouse_result keys: {list(lighthouse_result.keys())[:20] if isinstance(lighthouse_result, dict) else 'Not a dict'}")
    
    # Parse from network requests - try multiple locations
    network_requests_data = lighthouse_result.get('networkRequests', [])
    print(f"[ParseResourceBreakdown] Checked lighthouseResult.networkRequests: {len(network_requests_data) if network_requests_data else 0} found")
    
    # If not found, try in audits
    if not network_requests_data:
        audits = lighthouse_result.get('audits', {})
        network_audit = audits.get('network-requests', {})
        if network_audit:
            details = network_audit.get('details', {})
            network_requests_data = details.get('items', [])
            print(f"[ParseResourceBreakdown] Found in audits['network-requests']['details']['items']: {len(network_requests_data)}")
    
    if not network_requests_data:
        print("[ParseResourceBreakdown] No network requests data found - cannot create resource breakdowns")
        return []
    
    print(f"[ParseResourceBreakdown] Processing {len(network_requests_data)} network requests for resource breakdown")
    
    # Build lookup maps from audits for optimization flags
    # These audits have details.items[] with url matching
    unused_css_map = {}  # url -> {wastedBytes, wastedMs}
    unused_js_map = {}  # url -> {wastedBytes, wastedMs}
    unminified_css_map = {}  # url -> True
    unminified_js_map = {}  # url -> True
    inefficient_images_map = {}  # url -> {wastedBytes}
    cache_lifetime_map = {}  # url -> cacheLifetime
    
    # Extract from unused-css audit
    unused_css_audit = audits.get('unused-css-rules', {}) or audits.get('unused-css', {})
    if unused_css_audit and isinstance(unused_css_audit.get('details'), dict):
        items = unused_css_audit['details'].get('items', [])
        for item in items:
            item_url = item.get('url', '')
            if item_url:
                unused_css_map[item_url] = {
                    'wastedBytes': item.get('wastedBytes'),
                    'wastedMs': item.get('wastedMs')
                }
    
    # Extract from unused-javascript audit
    unused_js_audit = audits.get('unused-javascript', {})
    if unused_js_audit and isinstance(unused_js_audit.get('details'), dict):
        items = unused_js_audit['details'].get('items', [])
        for item in items:
            item_url = item.get('url', '')
            if item_url:
                unused_js_map[item_url] = {
                    'wastedBytes': item.get('wastedBytes'),
                    'wastedMs': item.get('wastedMs')
                }
    
    # Extract from unminified-css audit
    unminified_css_audit = audits.get('unminified-css', {})
    if unminified_css_audit and isinstance(unminified_css_audit.get('details'), dict):
        items = unminified_css_audit['details'].get('items', [])
        for item in items:
            item_url = item.get('url', '')
            if item_url:
                unminified_css_map[item_url] = True
    
    # Extract from unminified-javascript audit
    unminified_js_audit = audits.get('unminified-javascript', {})
    if unminified_js_audit and isinstance(unminified_js_audit.get('details'), dict):
        items = unminified_js_audit['details'].get('items', [])
        for item in items:
            item_url = item.get('url', '')
            if item_url:
                unminified_js_map[item_url] = True
    
    # Extract from uses-optimized-images or modern-image-formats audit
    inefficient_images_audit = audits.get('uses-optimized-images', {}) or audits.get('modern-image-formats', {})
    if inefficient_images_audit and isinstance(inefficient_images_audit.get('details'), dict):
        items = inefficient_images_audit['details'].get('items', [])
        for item in items:
            item_url = item.get('url', '')
            if item_url:
                inefficient_images_map[item_url] = {
                    'wastedBytes': item.get('wastedBytes')
                }
    
    # Extract from uses-long-cache-ttl audit
    cache_audit = audits.get('uses-long-cache-ttl', {})
    if cache_audit and isinstance(cache_audit.get('details'), dict):
        items = cache_audit['details'].get('items', [])
        for item in items:
            item_url = item.get('url', '')
            if item_url:
                cache_lifetime_map[item_url] = item.get('cacheLifetime', item.get('cacheTTL'))
    
    for idx, request in enumerate(network_requests_data):
        try:
            url = request.get('url', '')
            resource_type = request.get('resourceType', 'other')
            
            # Map resource type to category
            category_map = {
                'Document': 'document',
                'Script': 'script',
                'Stylesheet': 'stylesheet',
                'Image': 'image',
                'Font': 'font',
                'Media': 'media',
            }
            category = category_map.get(resource_type, 'other')
            
            # Size: networkRequests[].transferSize -> transfer_size
            transfer_size = request.get('transferSize', 0)
            # Size: networkRequests[].resourceSize -> resource_size
            resource_size = request.get('resourceSize', 0)
            # Size: Calculated -> gzip_savings
            gzip_savings = resource_size - transfer_size if resource_size > transfer_size else None
            
            # Performance Impact: networkRequests[].renderBlockingStatus -> render_blocking
            render_blocking = request.get('renderBlockingStatus') == 'blocking'
            
            # Optimization flags from audits (matched by URL)
            unused_css_data = unused_css_map.get(url, {})
            unused_js_data = unused_js_map.get(url, {})
            inefficient_image_data = inefficient_images_map.get(url, {})
            
            # Performance Impact: From unused-css audit -> unused_css
            unused_css = url in unused_css_map
            # Performance Impact: From unused-javascript audit -> unused_javascript
            unused_javascript = url in unused_js_map
            # Optimization: From unminified-css/js audits -> can_minify
            can_minify = url in unminified_css_map or url in unminified_js_map
            # Optimization: Check if resource can be compressed (gzip_savings > 0 means already compressed)
            can_compress = gzip_savings is None or gzip_savings <= 0
            # Optimization: From uses-long-cache-ttl audit -> can_cache
            can_cache = url in cache_lifetime_map
            
            # Optimization metrics: From audits -> wasted_bytes, wasted_ms
            wasted_bytes = unused_css_data.get('wastedBytes') or unused_js_data.get('wastedBytes') or inefficient_image_data.get('wastedBytes')
            wasted_ms = unused_css_data.get('wastedMs') or unused_js_data.get('wastedMs')
            # Optimization: From uses-long-cache-ttl audit -> cache_lifetime
            cache_lifetime = cache_lifetime_map.get(url)
            
            # Load time: Calculate from timing
            timing = request.get('timing', {})
            start_time = request.get('startTime') or timing.get('startTime', 0)
            end_time = request.get('endTime') or timing.get('endTime', 0)
            load_time = (end_time - start_time) * 1000 if (start_time and end_time) else None  # Convert to ms
            
            breakdown = ResourceBreakdown.objects.create(
                performance_analysis=performance_analysis,
                audit_report=audit_report,  # Direct link to audit report
                # Basic Info: networkRequests[].url -> url
                url=url,
                # Basic Info: networkRequests[].resourceType -> resource_type
                resource_type=resource_type,
                # Basic Info: Mapped from resourceType -> category
                category=category,
                # Basic Info: networkRequests[].mimeType -> mime_type
                mime_type=request.get('mimeType'),
                # Size: networkRequests[].transferSize -> transfer_size
                transfer_size=transfer_size,
                # Size: networkRequests[].resourceSize -> resource_size
                resource_size=resource_size,
                # Size: Calculated -> gzip_savings
                gzip_savings=gzip_savings,
                # Performance Impact: From renderBlockingStatus -> render_blocking
                render_blocking=render_blocking,
                # Performance Impact: From unused-css audit -> unused_css
                unused_css=unused_css,
                # Performance Impact: From unused-javascript audit -> unused_javascript
                unused_javascript=unused_javascript,
                # Optimization: From unminified audits -> can_minify
                can_minify=can_minify,
                # Optimization: Calculated -> can_compress
                can_compress=can_compress,
                # Optimization: From uses-long-cache-ttl audit -> can_cache
                can_cache=can_cache,
                # Load time: Calculated from timing -> load_time
                load_time=load_time,
                # Optimization metrics: From audits -> wasted_bytes
                wasted_bytes=wasted_bytes,
                # Optimization metrics: From audits -> wasted_ms
                wasted_ms=wasted_ms,
                # Optimization: From uses-long-cache-ttl audit -> cache_lifetime
                cache_lifetime=cache_lifetime
            )
            resource_breakdowns.append(breakdown)
        except Exception as e:
            print(f"[ParseResourceBreakdown] Error parsing resource {idx}: {e}")
            import traceback
            print(f"[ParseResourceBreakdown] Request data: {str(request)[:200]}")
            print(traceback.format_exc())
            continue
    
    print(f"[ParseResourceBreakdown] [OK] Successfully created {len(resource_breakdowns)} ResourceBreakdown records")
    return resource_breakdowns

