"""
Security scanning tools integration
"""

from .http_headers import check_http_security_headers
from .ssl_checker import check_ssl_tls

# Import DNS discovery with error handling
try:
    from .dns_discovery import discover_dns_subdomains
    DNS_DISCOVERY_AVAILABLE = True
except ImportError:
    DNS_DISCOVERY_AVAILABLE = False
    # Create a fallback function
    def discover_dns_subdomains(domain: str):
        return {
            'success': False,
            'domain': domain,
            'error': 'DNS_DISCOVERY_UNAVAILABLE',
            'error_message': 'dnspython not installed. Install with: pip install dnspython',
            'findings': [{
                'title': 'DNS Discovery Unavailable',
                'description': 'dnspython library not installed. Install with: pip install dnspython',
                'severity': 'informational',
                'affected_url': domain,
                'remediation': 'Install dnspython: pip install dnspython'
            }]
        }

# Import OWASP ZAP scanner
try:
    from .zap_scanner import run_zap_scan
    ZAP_AVAILABLE = True
except ImportError:
    ZAP_AVAILABLE = False
    def run_zap_scan(target_url: str, scan_type: str = 'baseline', zap_path: str = None):
        return {
            'success': False,
            'url': target_url,
            'error': 'ZAP_UNAVAILABLE',
            'error_message': 'ZAP scanner not available',
            'findings': []
        }

# Import Nmap scanner
try:
    from .nmap_scanner import run_nmap_scan
    NMAP_AVAILABLE = True
except ImportError:
    NMAP_AVAILABLE = False
    def run_nmap_scan(target_url: str, scan_options: str = None):
        return {
            'success': False,
            'target': target_url,
            'error': 'NMAP_UNAVAILABLE',
            'error_message': 'Nmap scanner not available',
            'findings': []
        }

# Import Amass scanner
try:
    from .amass_scanner import run_amass_scan
    AMASS_AVAILABLE = True
except ImportError:
    AMASS_AVAILABLE = False
    def run_amass_scan(target_url: str, scan_config: dict = None):
        return {
            'success': False,
            'domain': target_url,
            'error': 'AMASS_UNAVAILABLE',
            'error_message': 'Amass scanner not available',
            'findings': []
        }

__all__ = [
    'check_http_security_headers',
    'check_ssl_tls',
    'discover_dns_subdomains',
    'run_zap_scan',
    'run_nmap_scan',
    'run_amass_scan',
]

