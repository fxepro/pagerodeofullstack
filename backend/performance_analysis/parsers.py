"""
Parsing functions to extract detailed data from Lighthouse full_results JSON

This module maintains backward compatibility by re-exporting from the new
modular parsers package. The actual implementation has been moved to:
backend/performance_analysis/parsers/

For new code, import directly from parsers package:
    from performance_analysis.parsers import parse_detailed_data
"""

# Re-export all functions from the new modular parsers package
from .parsers import (
    parse_detailed_data,
    normalize_lighthouse_json,
    parse_network_requests,
    parse_resource_breakdown,
    parse_category_scores,
    parse_config_environment,
    parse_audit_details,
    parse_timeline_events,
)

__all__ = [
    'parse_detailed_data',
    'normalize_lighthouse_json',
    'parse_network_requests',
    'parse_resource_breakdown',
    'parse_category_scores',
    'parse_config_environment',
    'parse_audit_details',
    'parse_timeline_events',
]
