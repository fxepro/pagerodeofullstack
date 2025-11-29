"""
Main dispatcher for parsing Lighthouse data.

Orchestrates all parsing operations in the correct order.
"""

from ..models import PerformanceAnalysis
from .base_normalizer import normalize_lighthouse_json
from .category_parser import parse_category_scores
from .config_parser import parse_config_environment
from .audit_parser import parse_audit_details
from .network_parser import parse_network_requests
from .resource_parser import parse_resource_breakdown
from .timeline_parser import parse_timeline_events
from .timeline_parser import parse_timeline_events


def parse_detailed_data(performance_analysis: PerformanceAnalysis) -> None:
    """
    Parse all detailed data from PerformanceAnalysis.full_results and populate related tables.
    
    This function orchestrates the parsing of:
    - Category scores (Performance, SEO, Accessibility, Best Practices)
    - Config and environment data
    - Audit details (all individual Lighthouse audits)
    - Network requests (waterfall chart data)
    - Resource breakdown (resource categorization)
    - Timeline events (performance timeline)
    
    Args:
        performance_analysis: PerformanceAnalysis instance to parse data for
    """
    full_results = performance_analysis.full_results
    
    print(f"[ParseDetailedData] Starting parse for PerformanceAnalysis {performance_analysis.id}")
    print(f"[ParseDetailedData] Has full_results: {bool(full_results)}")
    print(f"[ParseDetailedData] full_results type: {type(full_results)}")
    
    if not full_results:
        print("[ParseDetailedData] No full_results to parse")
        return
    
    # Normalize the JSON structure (handles string conversion and lighthouseResult extraction)
    lighthouse_result = normalize_lighthouse_json(full_results)
    if not lighthouse_result:
        print("[ParseDetailedData] Failed to normalize full_results")
        return
    
    print(f"[ParseDetailedData] Normalized lighthouse_result keys: {list(lighthouse_result.keys())[:20] if isinstance(lighthouse_result, dict) else 'Not a dict'}")
    if isinstance(lighthouse_result, dict) and 'audits' in lighthouse_result:
        audits = lighthouse_result['audits']
        print(f"[ParseDetailedData] audits keys (first 10): {list(audits.keys())[:10] if isinstance(audits, dict) else 'Not a dict'}")
    
    # Track results for each parser
    category_scores_ok = False
    config_env_ok = False
    audit_details_ok = False
    network_count = 0
    resource_count = 0
    timeline_count = 0
    
    # Parse category scores (Performance, SEO, Accessibility, Best Practices)
    try:
        parse_category_scores(performance_analysis, lighthouse_result)
        category_scores_ok = True
        print(f"[ParseDetailedData] [OK] Category scores parsed")
    except Exception as e:
        print(f"[ParseDetailedData] [ERROR] Failed to parse category scores: {e}")
        import traceback
        traceback.print_exc()
    
    # Parse config and environment data
    try:
        parse_config_environment(performance_analysis, lighthouse_result)
        config_env_ok = True
        print(f"[ParseDetailedData] [OK] Config/environment parsed")
    except Exception as e:
        print(f"[ParseDetailedData] [ERROR] Failed to parse config/environment: {e}")
        import traceback
        traceback.print_exc()
    
    # Parse all audit details
    try:
        parse_audit_details(performance_analysis, lighthouse_result)
        audit_details_ok = True
        print(f"[ParseDetailedData] [OK] Audit details parsed")
    except Exception as e:
        print(f"[ParseDetailedData] [ERROR] Failed to parse audit details: {e}")
        import traceback
        traceback.print_exc()
    
    # Parse network requests (waterfall chart data)
    try:
        network_requests = parse_network_requests(performance_analysis, full_results)
        network_count = len(network_requests)
        print(f"[ParseDetailedData] [OK] Created {network_count} NetworkRequest records (waterfall data)")
    except Exception as e:
        print(f"[ParseDetailedData] [ERROR] Failed to parse network requests: {e}")
        import traceback
        traceback.print_exc()
    
    # Parse resource breakdown (resource categorization)
    try:
        resource_breakdowns = parse_resource_breakdown(performance_analysis, full_results)
        resource_count = len(resource_breakdowns)
        print(f"[ParseDetailedData] [OK] Created {resource_count} ResourceBreakdown records")
    except Exception as e:
        print(f"[ParseDetailedData] [ERROR] Failed to parse resource breakdown: {e}")
        import traceback
        traceback.print_exc()
    
    # Parse timeline events (performance timeline)
    try:
        timeline_events = parse_timeline_events(performance_analysis, full_results)
        timeline_count = len(timeline_events)
        print(f"[ParseDetailedData] [OK] Created {timeline_count} PerformanceTimelineEvent records")
    except Exception as e:
        print(f"[ParseDetailedData] [ERROR] Failed to parse timeline events: {e}")
        import traceback
        traceback.print_exc()
    
    # Verify data went to correct tables
    print(f"[ParseDetailedData] ========================================")
    print(f"[ParseDetailedData] VERIFICATION:")
    print(f"[ParseDetailedData]   Category scores: {'[OK]' if category_scores_ok else '[FAILED]'}")
    print(f"[ParseDetailedData]   Config/Environment: {'[OK]' if config_env_ok else '[FAILED]'}")
    print(f"[ParseDetailedData]   Audit details: {'[OK]' if audit_details_ok else '[FAILED]'}")
    print(f"[ParseDetailedData]   Raw JSON archive: [OK] (in full_results)")
    print(f"[ParseDetailedData]   network_request table: {network_count} records")
    print(f"[ParseDetailedData]   resource_breakdown table: {resource_count} records")
    print(f"[ParseDetailedData]   performance_timeline_event table: {timeline_count} records")
    print(f"[ParseDetailedData] ========================================")
    
    print(f"[ParseDetailedData] Parsing completed for PerformanceAnalysis {performance_analysis.id}")

