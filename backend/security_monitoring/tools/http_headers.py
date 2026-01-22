"""
HTTP Security Headers Checker
Checks for presence and configuration of security headers
"""

import requests
import logging
from typing import Dict, List
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

# Required security headers and their recommended values
SECURITY_HEADERS = {
    'Strict-Transport-Security': {
        'required': True,
        'recommended_value': 'max-age=31536000; includeSubDomains',
        'description': 'Enforces HTTPS connections and prevents downgrade attacks'
    },
    'X-Frame-Options': {
        'required': True,
        'recommended_value': 'DENY',
        'description': 'Prevents clickjacking attacks'
    },
    'X-Content-Type-Options': {
        'required': True,
        'recommended_value': 'nosniff',
        'description': 'Prevents MIME type sniffing'
    },
    'Content-Security-Policy': {
        'required': True,
        'recommended_value': "default-src 'self'",
        'description': 'Prevents XSS attacks by controlling resource loading'
    },
    'X-XSS-Protection': {
        'required': False,
        'recommended_value': '1; mode=block',
        'description': 'Legacy XSS protection (CSP is preferred)'
    },
    'Referrer-Policy': {
        'required': True,
        'recommended_value': 'strict-origin-when-cross-origin',
        'description': 'Controls referrer information sent with requests'
    },
    'Permissions-Policy': {
        'required': False,
        'recommended_value': 'geolocation=(), microphone=(), camera=()',
        'description': 'Controls browser features and APIs'
    }
}


def check_http_security_headers(url: str, timeout: int = 10) -> Dict:
    """
    Check HTTP security headers for a given URL
    
    Args:
        url: Target URL to check
        timeout: Request timeout in seconds
        
    Returns:
        Dict with findings and recommendations
    """
    findings = []
    headers_present = {}
    headers_missing = []
    headers_weak = []
    
    try:
        # Make request
        response = requests.get(url, timeout=timeout, allow_redirects=True, verify=True)
        response_headers = {k.lower(): v for k, v in response.headers.items()}
        
        # Check each security header
        for header_name, config in SECURITY_HEADERS.items():
            header_lower = header_name.lower()
            
            if header_lower in response_headers:
                value = response_headers[header_lower]
                headers_present[header_name] = value
                
                # Check if value is weak/misconfigured
                if config['required']:
                    if header_name == 'Strict-Transport-Security':
                        if 'max-age' not in value or int(value.split('max-age=')[1].split(';')[0]) < 31536000:
                            headers_weak.append({
                                'header': header_name,
                                'current_value': value,
                                'recommended': config['recommended_value'],
                                'issue': 'HSTS max-age should be at least 31536000 (1 year)'
                            })
                            findings.append({
                                'title': f'Weak {header_name} Configuration',
                                'description': f'{header_name} is present but configured weakly. {config["description"]}',
                                'severity': 'medium',
                                'affected_url': url,
                                'evidence': {
                                    'header': header_name,
                                    'current_value': value,
                                    'recommended_value': config['recommended_value']
                                },
                                'remediation': f'Update {header_name} to: {config["recommended_value"]}'
                            })
                    elif header_name == 'X-Frame-Options' and value.upper() not in ['DENY', 'SAMEORIGIN']:
                        headers_weak.append({
                            'header': header_name,
                            'current_value': value,
                            'recommended': config['recommended_value']
                        })
                        findings.append({
                            'title': f'Weak {header_name} Configuration',
                            'description': f'{header_name} should be set to DENY or SAMEORIGIN for better security',
                            'severity': 'medium',
                            'affected_url': url,
                            'evidence': {'header': header_name, 'current_value': value},
                            'remediation': f'Set {header_name} to: {config["recommended_value"]}'
                        })
            else:
                if config['required']:
                    headers_missing.append(header_name)
                    findings.append({
                        'title': f'Missing Security Header: {header_name}',
                        'description': f'{header_name} is not present. {config["description"]}',
                        'severity': 'high' if config['required'] else 'medium',
                        'affected_url': url,
                        'evidence': {'header': header_name, 'status': 'missing'},
                        'remediation': f'Add {header_name} header with value: {config["recommended_value"]}'
                    })
        
        # Summary
        total_headers = len(SECURITY_HEADERS)
        required_headers = len([h for h, c in SECURITY_HEADERS.items() if c['required']])
        missing_required = len([h for h in headers_missing if SECURITY_HEADERS[h]['required']])
        present_required = required_headers - missing_required
        
        return {
            'success': True,
            'url': url,
            'status_code': response.status_code,
            'headers_present': headers_present,
            'headers_missing': headers_missing,
            'headers_weak': headers_weak,
            'findings': findings,
            'summary': {
                'total_headers_checked': total_headers,
                'required_headers': required_headers,
                'present_required': present_required,
                'missing_required': missing_required,
                'weak_configurations': len(headers_weak),
                'security_score': round((present_required / required_headers) * 100, 1) if required_headers > 0 else 0
            }
        }
        
    except requests.exceptions.SSLError as e:
        logger.error(f"SSL error checking {url}: {str(e)}")
        findings.append({
            'title': 'SSL/TLS Error',
            'description': f'SSL certificate error: {str(e)}',
            'severity': 'high',
            'affected_url': url,
            'evidence': {'error': str(e)},
            'remediation': 'Fix SSL certificate configuration'
        })
        return {
            'success': False,
            'url': url,
            'error': 'SSL_ERROR',
            'error_message': str(e),
            'findings': findings
        }
    except requests.exceptions.Timeout:
        logger.error(f"Timeout checking {url}")
        return {
            'success': False,
            'url': url,
            'error': 'TIMEOUT',
            'error_message': f'Request timed out after {timeout} seconds',
            'findings': [{
                'title': 'Connection Timeout',
                'description': f'Unable to connect to {url} within {timeout} seconds',
                'severity': 'medium',
                'affected_url': url
            }]
        }
    except requests.exceptions.RequestException as e:
        logger.error(f"Error checking {url}: {str(e)}")
        return {
            'success': False,
            'url': url,
            'error': 'REQUEST_ERROR',
            'error_message': str(e),
            'findings': [{
                'title': 'Connection Error',
                'description': f'Unable to connect to {url}: {str(e)}',
                'severity': 'high',
                'affected_url': url
            }]
        }
    except Exception as e:
        logger.error(f"Unexpected error checking {url}: {str(e)}")
        return {
            'success': False,
            'url': url,
            'error': 'UNKNOWN_ERROR',
            'error_message': str(e),
            'findings': []
        }

