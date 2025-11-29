"""
Parsing functions to extract data from Sitemap analysis full_results JSON
"""

from .models import SitemapAnalysis
from datetime import datetime


def parse_sitemap_data(sitemap_analysis: SitemapAnalysis) -> None:
    """
    Parse data from SitemapAnalysis.full_results and populate table columns.
    
    Args:
        sitemap_analysis: SitemapAnalysis instance to parse data for
    """
    full_results = sitemap_analysis.full_results
    
    if not full_results:
        print("[ParseSitemap] No full_results to parse")
        return
    
    if not isinstance(full_results, dict):
        print(f"[ParseSitemap] full_results is not a dict: {type(full_results)}")
        return
    
    print(f"[ParseSitemap] Parsing Sitemap data for SitemapAnalysis {sitemap_analysis.id}")
    print(f"[ParseSitemap] full_results type: {type(full_results)}")
    if isinstance(full_results, dict):
        print(f"[ParseSitemap] full_results keys: {list(full_results.keys())[:30]}")
        # Show sample values for debugging
        for key in list(full_results.keys())[:10]:
            value = full_results[key]
            print(f"[ParseSitemap]   {key}: {type(value).__name__} = {str(value)[:100]}")
    else:
        print(f"[ParseSitemap] full_results is not a dict: {full_results}")
    
    update_fields = []
    
    # Helper function to get value with camelCase/snake_case fallback
    def get_value(key_snake, key_camel=None):
        if key_camel is None:
            # Convert snake_case to camelCase
            key_camel = ''.join(word.capitalize() if i > 0 else word for i, word in enumerate(key_snake.split('_')))
            key_camel = key_camel[0].lower() + key_camel[1:] if key_camel else key_camel
        value = full_results.get(key_snake) or full_results.get(key_camel)
        if value is not None:
            print(f"[ParseSitemap] Found {key_snake} (or {key_camel}): {type(value).__name__} = {str(value)[:50]}")
        return value
    
    # Extract basic sitemap info (handle both camelCase and snake_case)
    sitemap_found = get_value('sitemap_found', 'sitemapFound')
    if sitemap_found is not None and sitemap_analysis.sitemap_found != sitemap_found:
        sitemap_analysis.sitemap_found = sitemap_found
        update_fields.append('sitemap_found')
    
    sitemap_url = get_value('sitemap_url', 'sitemapUrl')
    if sitemap_url and sitemap_analysis.sitemap_url != sitemap_url:
        sitemap_analysis.sitemap_url = sitemap_url
        update_fields.append('sitemap_url')
    
    sitemap_type = get_value('sitemap_type', 'sitemapType')
    if sitemap_type and sitemap_analysis.sitemap_type != sitemap_type:
        sitemap_analysis.sitemap_type = sitemap_type
        update_fields.append('sitemap_type')
    
    total_urls = get_value('total_urls', 'totalUrls')
    if total_urls is not None and sitemap_analysis.total_urls != total_urls:
        sitemap_analysis.total_urls = total_urls
        update_fields.append('total_urls')
    
    last_modified = get_value('last_modified', 'lastModified')
    if last_modified:
        if isinstance(last_modified, str):
            try:
                last_modified = datetime.fromisoformat(last_modified.replace('Z', '+00:00'))
            except:
                last_modified = None
        if last_modified and sitemap_analysis.last_modified != last_modified:
            sitemap_analysis.last_modified = last_modified
            update_fields.append('last_modified')
    
    change_frequency = get_value('change_frequency', 'changeFrequency')
    if change_frequency and sitemap_analysis.change_frequency != change_frequency:
        sitemap_analysis.change_frequency = change_frequency
        update_fields.append('change_frequency')
    
    priority = get_value('priority')
    if priority is not None and sitemap_analysis.priority != priority:
        sitemap_analysis.priority = priority
        update_fields.append('priority')
    
    urls = get_value('urls')
    if urls and isinstance(urls, list) and sitemap_analysis.urls != urls:
        sitemap_analysis.urls = urls
        update_fields.append('urls')
    
    is_sitemap_index = get_value('is_sitemap_index', 'isSitemapIndex')
    if is_sitemap_index is not None and sitemap_analysis.is_sitemap_index != is_sitemap_index:
        sitemap_analysis.is_sitemap_index = is_sitemap_index
        update_fields.append('is_sitemap_index')
    
    sitemap_index_urls = get_value('sitemap_index_urls', 'sitemapIndexUrls')
    if sitemap_index_urls and isinstance(sitemap_index_urls, list) and sitemap_analysis.sitemap_index_urls != sitemap_index_urls:
        sitemap_analysis.sitemap_index_urls = sitemap_index_urls
        update_fields.append('sitemap_index_urls')
    
    health_score = get_value('health_score', 'healthScore')
    if health_score is not None and sitemap_analysis.health_score != health_score:
        sitemap_analysis.health_score = health_score
        update_fields.append('health_score')
    
    issues = get_value('issues')
    if issues and isinstance(issues, list) and sitemap_analysis.issues != issues:
        sitemap_analysis.issues = issues
        update_fields.append('issues')
    
    recommendations = get_value('recommendations')
    if recommendations and isinstance(recommendations, list) and sitemap_analysis.recommendations != recommendations:
        sitemap_analysis.recommendations = recommendations
        update_fields.append('recommendations')
    
    if update_fields:
        sitemap_analysis.save(update_fields=update_fields)
        print(f"[ParseSitemap] [OK] Updated {len(update_fields)} fields: {', '.join(update_fields)}")
    else:
        print("[ParseSitemap] [WARNING] No fields to update")
        print("[ParseSitemap] Current model values:")
        print(f"  sitemap_found: {sitemap_analysis.sitemap_found}")
        print(f"  sitemap_url: {sitemap_analysis.sitemap_url[:50] if sitemap_analysis.sitemap_url else None}")
        print(f"  total_urls: {sitemap_analysis.total_urls}")
        print(f"  health_score: {sitemap_analysis.health_score}")
        print("[ParseSitemap] This might mean:")
        print("  1. Data was already set correctly from view")
        print("  2. Data is missing from full_results")
        print("  3. Data format doesn't match expected keys")

