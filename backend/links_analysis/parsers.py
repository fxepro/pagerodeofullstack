"""
Parsing functions to extract data from Links analysis full_results JSON
"""

from .models import LinksAnalysis


def parse_links_data(links_analysis: LinksAnalysis) -> None:
    """
    Parse data from LinksAnalysis.full_results and populate table columns.
    
    Args:
        links_analysis: LinksAnalysis instance to parse data for
    """
    full_results = links_analysis.full_results
    
    if not full_results:
        print("[ParseLinks] No full_results to parse")
        return
    
    if not isinstance(full_results, dict):
        print(f"[ParseLinks] full_results is not a dict: {type(full_results)}")
        return
    
    print(f"[ParseLinks] Parsing Links data for LinksAnalysis {links_analysis.id}")
    print(f"[ParseLinks] full_results keys: {list(full_results.keys())[:20] if isinstance(full_results, dict) else 'Not a dict'}")
    
    update_fields = []
    
    # Helper function to get value with camelCase/snake_case fallback
    def get_value(key_snake, key_camel=None):
        if key_camel is None:
            # Convert snake_case to camelCase
            key_camel = ''.join(word.capitalize() if i > 0 else word for i, word in enumerate(key_snake.split('_')))
            key_camel = key_camel[0].lower() + key_camel[1:] if key_camel else key_camel
        return full_results.get(key_snake) or full_results.get(key_camel)
    
    # Extract links array (check both 'links' and 'discoveredLinks')
    links = get_value('links', 'discoveredLinks')
    if links and isinstance(links, list) and links_analysis.links != links:
        links_analysis.links = links
        update_fields.append('links')
    
    # Extract summary statistics
    total_links = get_value('total_links', 'totalLinks')
    if total_links is not None and links_analysis.total_links != total_links:
        links_analysis.total_links = total_links
        update_fields.append('total_links')
    
    internal_links = get_value('internal_links', 'internalLinks')
    if internal_links is not None and links_analysis.internal_links != internal_links:
        links_analysis.internal_links = internal_links
        update_fields.append('internal_links')
    
    external_links = get_value('external_links', 'externalLinks')
    if external_links is not None and links_analysis.external_links != external_links:
        links_analysis.external_links = external_links
        update_fields.append('external_links')
    
    broken_links = get_value('broken_links', 'brokenLinks')
    if broken_links is not None and links_analysis.broken_links != broken_links:
        links_analysis.broken_links = broken_links
        update_fields.append('broken_links')
    
    redirect_links = get_value('redirect_links', 'redirectLinks')
    if redirect_links is not None and links_analysis.redirect_links != redirect_links:
        links_analysis.redirect_links = redirect_links
        update_fields.append('redirect_links')
    
    links_by_status = get_value('links_by_status', 'linksByStatus')
    if links_by_status and isinstance(links_by_status, dict) and links_analysis.links_by_status != links_by_status:
        links_analysis.links_by_status = links_by_status
        update_fields.append('links_by_status')
    
    links_health_score = get_value('links_health_score', 'healthScore') or get_value('links_health_score', 'linksHealthScore')
    if links_health_score is not None and links_analysis.links_health_score != links_health_score:
        links_analysis.links_health_score = links_health_score
        update_fields.append('links_health_score')
    
    issues = get_value('issues')
    if issues and isinstance(issues, list) and links_analysis.issues != issues:
        links_analysis.issues = issues
        update_fields.append('issues')
    
    recommendations = get_value('recommendations')
    if recommendations and isinstance(recommendations, list) and links_analysis.recommendations != recommendations:
        links_analysis.recommendations = recommendations
        update_fields.append('recommendations')
    
    broken_links_list = get_value('broken_links_list', 'brokenLinksList')
    if broken_links_list and isinstance(broken_links_list, list) and links_analysis.broken_links_list != broken_links_list:
        links_analysis.broken_links_list = broken_links_list
        update_fields.append('broken_links_list')
    
    # Extract response time statistics
    avg_response_time = get_value('avg_response_time', 'avgResponseTime')
    if avg_response_time is not None and links_analysis.avg_response_time != avg_response_time:
        links_analysis.avg_response_time = avg_response_time
        update_fields.append('avg_response_time')
    
    min_response_time = get_value('min_response_time', 'minResponseTime')
    if min_response_time is not None and links_analysis.min_response_time != min_response_time:
        links_analysis.min_response_time = min_response_time
        update_fields.append('min_response_time')
    
    max_response_time = get_value('max_response_time', 'maxResponseTime')
    if max_response_time is not None and links_analysis.max_response_time != max_response_time:
        links_analysis.max_response_time = max_response_time
        update_fields.append('max_response_time')
    
    if update_fields:
        links_analysis.save(update_fields=update_fields)
        print(f"[ParseLinks] [OK] Updated {len(update_fields)} fields: {', '.join(update_fields)}")
    else:
        print("[ParseLinks] [OK] No fields to update (data already parsed or missing)")

