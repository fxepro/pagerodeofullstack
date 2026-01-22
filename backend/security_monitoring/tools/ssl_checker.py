"""
SSL/TLS Configuration Checker
Checks SSL certificate validity, cipher suites, and TLS configuration
"""

import ssl
import socket
import logging
from datetime import datetime
from typing import Dict
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


def check_ssl_tls(url: str, timeout: int = 10) -> Dict:
    """
    Check SSL/TLS configuration for a given URL
    
    Args:
        url: Target URL to check
        timeout: Connection timeout in seconds
        
    Returns:
        Dict with SSL/TLS findings and recommendations
    """
    findings = []
    
    try:
        parsed = urlparse(url)
        hostname = parsed.hostname or url
        port = parsed.port or 443
        
        # Create SSL context
        context = ssl.create_default_context()
        
        # Connect and get certificate
        with socket.create_connection((hostname, port), timeout=timeout) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()
                cipher = ssock.cipher()
                version = ssock.version()
                
                # Check certificate expiration
                not_after = datetime.strptime(cert['notAfter'], '%b %d %H:%M:%S %Y %Z')
                days_until_expiry = (not_after - datetime.now()).days
                
                if days_until_expiry < 0:
                    findings.append({
                        'title': 'SSL Certificate Expired',
                        'description': f'SSL certificate expired {abs(days_until_expiry)} days ago',
                        'severity': 'critical',
                        'affected_url': url,
                        'evidence': {
                            'expiry_date': cert['notAfter'],
                            'days_expired': abs(days_until_expiry)
                        },
                        'remediation': 'Renew SSL certificate immediately'
                    })
                elif days_until_expiry < 30:
                    findings.append({
                        'title': 'SSL Certificate Expiring Soon',
                        'description': f'SSL certificate expires in {days_until_expiry} days',
                        'severity': 'high',
                        'affected_url': url,
                        'evidence': {
                            'expiry_date': cert['notAfter'],
                            'days_until_expiry': days_until_expiry
                        },
                        'remediation': 'Renew SSL certificate before expiration'
                    })
                
                # Check TLS version
                if version in ['TLSv1', 'TLSv1.1']:
                    findings.append({
                        'title': 'Weak TLS Version',
                        'description': f'Server uses {version}, which is deprecated and insecure',
                        'severity': 'high',
                        'affected_url': url,
                        'evidence': {'tls_version': version},
                        'remediation': 'Upgrade to TLS 1.2 or higher'
                    })
                elif version == 'TLSv1.2':
                    findings.append({
                        'title': 'TLS 1.2 in Use',
                        'description': 'Server uses TLS 1.2. Consider upgrading to TLS 1.3 for better security',
                        'severity': 'low',
                        'affected_url': url,
                        'evidence': {'tls_version': version},
                        'remediation': 'Upgrade to TLS 1.3 if possible'
                    })
                
                # Check cipher suite
                if cipher:
                    cipher_name = cipher[0]
                    # Check for weak ciphers
                    weak_ciphers = ['RC4', 'DES', 'MD5', 'SHA1', 'NULL', 'EXPORT']
                    if any(weak in cipher_name for weak in weak_ciphers):
                        findings.append({
                            'title': 'Weak Cipher Suite',
                            'description': f'Server uses weak cipher: {cipher_name}',
                            'severity': 'high',
                            'affected_url': url,
                            'evidence': {'cipher': cipher_name},
                            'remediation': 'Disable weak cipher suites and use strong modern ciphers'
                        })
                
                # Certificate details
                cert_info = {
                    'subject': dict(x[0] for x in cert.get('subject', [])),
                    'issuer': dict(x[0] for x in cert.get('issuer', [])),
                    'version': cert.get('version'),
                    'serialNumber': cert.get('serialNumber'),
                    'notBefore': cert.get('notBefore'),
                    'notAfter': cert.get('notAfter'),
                    'tls_version': version,
                    'cipher': cipher[0] if cipher else None,
                    'days_until_expiry': days_until_expiry
                }
                
                return {
                    'success': True,
                    'url': url,
                    'hostname': hostname,
                    'port': port,
                    'certificate': cert_info,
                    'findings': findings,
                    'summary': {
                        'tls_version': version,
                        'cipher_suite': cipher[0] if cipher else None,
                        'certificate_valid': days_until_expiry > 0,
                        'days_until_expiry': days_until_expiry,
                        'total_findings': len(findings),
                        'critical_findings': len([f for f in findings if f['severity'] == 'critical']),
                        'high_findings': len([f for f in findings if f['severity'] == 'high'])
                    }
                }
                
    except socket.timeout:
        logger.error(f"Timeout checking SSL for {url}")
        return {
            'success': False,
            'url': url,
            'error': 'TIMEOUT',
            'error_message': f'Connection timed out after {timeout} seconds',
            'findings': [{
                'title': 'SSL Connection Timeout',
                'description': f'Unable to establish SSL connection to {url}',
                'severity': 'medium',
                'affected_url': url
            }]
        }
    except ssl.SSLError as e:
        logger.error(f"SSL error checking {url}: {str(e)}")
        findings.append({
            'title': 'SSL/TLS Error',
            'description': f'SSL error: {str(e)}',
            'severity': 'high',
            'affected_url': url,
            'evidence': {'error': str(e)},
            'remediation': 'Fix SSL/TLS configuration'
        })
        return {
            'success': False,
            'url': url,
            'error': 'SSL_ERROR',
            'error_message': str(e),
            'findings': findings
        }
    except Exception as e:
        logger.error(f"Error checking SSL for {url}: {str(e)}")
        return {
            'success': False,
            'url': url,
            'error': 'UNKNOWN_ERROR',
            'error_message': str(e),
            'findings': []
        }

