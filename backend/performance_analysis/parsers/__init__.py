"""
Performance Analysis Parsers

Public API for parsing Lighthouse data.
"""

from .dispatcher import parse_detailed_data
from .base_normalizer import normalize_lighthouse_json

# Individual parsers (for advanced usage)
from .network_parser import parse_network_requests
from .resource_parser import parse_resource_breakdown
from .category_parser import parse_category_scores
from .config_parser import parse_config_environment
from .audit_parser import parse_audit_details
from .timeline_parser import parse_timeline_events

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

