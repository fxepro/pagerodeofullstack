"""
Parsing functions to extract data from API analysis full_results JSON
"""

from .models import APIAnalysis


def parse_api_data(api_analysis: APIAnalysis) -> None:
    """
    Parse data from APIAnalysis.full_results and populate table columns.
    
    Args:
        api_analysis: APIAnalysis instance to parse data for
    """
    full_results = api_analysis.full_results
    
    if not full_results:
        print("[ParseAPI] No full_results to parse")
        return
    
    if not isinstance(full_results, dict):
        print(f"[ParseAPI] full_results is not a dict: {type(full_results)}")
        return
    
    print(f"[ParseAPI] Parsing API data for APIAnalysis {api_analysis.id}")
    
    update_fields = []
    
    # Extract endpoints
    if 'endpoints' in full_results:
        endpoints = full_results['endpoints']
        if isinstance(endpoints, list) and api_analysis.endpoints != endpoints:
            api_analysis.endpoints = endpoints
            update_fields.append('endpoints')
    
    # Extract summary statistics
    if 'total_endpoints' in full_results and api_analysis.total_endpoints != full_results['total_endpoints']:
        api_analysis.total_endpoints = full_results.get('total_endpoints')
        update_fields.append('total_endpoints')
    
    if 'endpoints_by_method' in full_results:
        endpoints_by_method = full_results['endpoints_by_method']
        if isinstance(endpoints_by_method, dict) and api_analysis.endpoints_by_method != endpoints_by_method:
            api_analysis.endpoints_by_method = endpoints_by_method
            update_fields.append('endpoints_by_method')
    
    if 'endpoints_by_status' in full_results:
        endpoints_by_status = full_results['endpoints_by_status']
        if isinstance(endpoints_by_status, dict) and api_analysis.endpoints_by_status != endpoints_by_status:
            api_analysis.endpoints_by_status = endpoints_by_status
            update_fields.append('endpoints_by_status')
    
    if 'api_health_score' in full_results and api_analysis.api_health_score != full_results['api_health_score']:
        api_analysis.api_health_score = full_results.get('api_health_score')
        update_fields.append('api_health_score')
    
    if 'issues' in full_results:
        issues = full_results['issues']
        if isinstance(issues, list) and api_analysis.issues != issues:
            api_analysis.issues = issues
            update_fields.append('issues')
    
    if 'recommendations' in full_results:
        recommendations = full_results['recommendations']
        if isinstance(recommendations, list) and api_analysis.recommendations != recommendations:
            api_analysis.recommendations = recommendations
            update_fields.append('recommendations')
    
    if 'response_types' in full_results:
        response_types = full_results['response_types']
        if isinstance(response_types, list) and api_analysis.response_types != response_types:
            api_analysis.response_types = response_types
            update_fields.append('response_types')
    
    if 'auth_methods' in full_results:
        auth_methods = full_results['auth_methods']
        if isinstance(auth_methods, list) and api_analysis.auth_methods != auth_methods:
            api_analysis.auth_methods = auth_methods
            update_fields.append('auth_methods')
    
    if 'requires_auth' in full_results and api_analysis.requires_auth != full_results['requires_auth']:
        api_analysis.requires_auth = full_results.get('requires_auth')
        update_fields.append('requires_auth')
    
    if update_fields:
        api_analysis.save(update_fields=update_fields)
        print(f"[ParseAPI] [OK] Updated {len(update_fields)} fields: {', '.join(update_fields)}")
    else:
        print("[ParseAPI] [OK] No fields to update (data already parsed or missing)")

