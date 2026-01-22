"""
OWASP ZAP Scanner Integration
Uses ZAP API for DAST (Dynamic Application Security Testing)
"""

import logging
import time
import subprocess
import os
from typing import Dict, List
from urllib.parse import urlparse
from django.conf import settings

logger = logging.getLogger(__name__)

# Try to import ZAP API client
try:
    from zapv2 import ZAPv2
    ZAP_AVAILABLE = True
    
    # Monkey-patch _request_api to allow localhost URLs and replace http://zap/ with actual API URL
    # The ZAPv2 client hardcodes http://zap/ validation, but we need localhost support
    _original_request_api = ZAPv2._request_api
    import requests
    def _patched_request_api(self, url, query=None):
        """Patched version that allows localhost URLs and replaces http://zap/ with configured URL"""
        # Replace http://zap/ with the actual base URL if it's set to localhost
        if url.startswith('http://zap/'):
            # Get the actual base URL from the instance
            actual_base = getattr(self, 'base', 'http://zap/JSON/')
            if actual_base.startswith('http://localhost') or actual_base.startswith('http://127.0.0.1'):
                # Replace http://zap/ with the actual base (without /JSON/)
                base_url = actual_base.replace('/JSON/', '')
                url = url.replace('http://zap/', base_url + '/')
        
        # Allow both http://zap/ and http://localhost:*/ URLs
        if not (url.startswith('http://zap/') or url.startswith('http://localhost') or url.startswith('http://127.0.0.1')):
            raise ValueError('A non ZAP API url was specified ' + url)
        
        # Replicate the original logic but with localhost support
        # Create a new session (original method does this)
        self.session = requests.Session()
        # Get API key from private attribute
        apikey = getattr(self, '_ZAPv2__apikey', None)
        if apikey is not None:
            self.session.headers['X-ZAP-API-Key'] = apikey
        
        query = query or {}
        if apikey is not None:
            # Add the apikey to get params for backwards compatibility
            if not query.get('apikey'):
                query['apikey'] = apikey
        
        # Get proxies from private attribute
        proxies = getattr(self, '_ZAPv2__proxies', None)
        return self.session.get(url, params=query, proxies=proxies, verify=False)
    ZAPv2._request_api = _patched_request_api
except ImportError:
    ZAP_AVAILABLE = False
    logger.warning("python-owasp-zap-v2.4 not installed. ZAP scanning will not be available.")


def get_zap_api_url():
    """Get ZAP API URL from settings or environment"""
    return getattr(settings, 'ZAP_API_URL', os.environ.get('ZAP_API_URL', 'http://localhost:8080'))


def get_zap_api_key():
    """Get ZAP API key from settings or environment"""
    return getattr(settings, 'ZAP_API_KEY', os.environ.get('ZAP_API_KEY', None))


def ensure_zap_running(zap_path=None, timeout=30):
    """
    Ensure ZAP is running in daemon mode
    
    Args:
        zap_path: Path to ZAP executable (optional)
        timeout: Timeout in seconds to wait for ZAP to start
    
    Returns:
        bool: True if ZAP is running, False otherwise
    """
    if not ZAP_AVAILABLE:
        return False
    
    try:
        # Initialize ZAP client - don't pass apikey if None
        api_key = get_zap_api_key()
        api_url = get_zap_api_url()
        
        # Only pass apikey if it's set (ZAP allows localhost without API key by default)
        if api_key:
            zap = ZAPv2(apikey=api_key)
        else:
            zap = ZAPv2()
        
        # Set the correct base URL (ZAPv2 defaults to http://zap/JSON/)
        zap.base = f"{api_url}/JSON/"
        
        # Test connection
        version = zap.core.version
        logger.info(f"ZAP is running, version: {version}")
        return True
    except Exception as e:
        logger.warning(f"ZAP API not accessible: {str(e)}")
        
        # Try to start ZAP if path is provided
        if zap_path:
            try:
                logger.info(f"Attempting to start ZAP from {zap_path}")
                
                # Prepare environment with JAVA_HOME if set
                env = os.environ.copy()
                java_home = os.environ.get('JAVA_HOME')
                if java_home:
                    env['JAVA_HOME'] = java_home
                    logger.info(f"Using JAVA_HOME: {java_home}")
                
                # Start ZAP process
                subprocess.Popen(
                    [zap_path, '-daemon', '-host', '0.0.0.0', '-port', '8080'],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    env=env
                )
                # Wait for ZAP to start
                api_key = get_zap_api_key()
                api_url = get_zap_api_url()
                
                for _ in range(timeout):
                    time.sleep(1)
                    try:
                        if api_key:
                            zap = ZAPv2(apikey=api_key)
                        else:
                            zap = ZAPv2()
                        # Set the correct base URL
                        zap.base = f"{api_url}/JSON/"
                        zap.core.version
                        logger.info("ZAP started successfully")
                        return True
                    except:
                        continue
            except Exception as start_error:
                logger.error(f"Failed to start ZAP: {str(start_error)}")
        
        return False


def run_zap_scan(target_url: str, scan_type: str = 'baseline', zap_path: str = None) -> Dict:
    """
    Run OWASP ZAP scan on target URL
    
    Args:
        target_url: Target URL to scan
        scan_type: 'baseline' or 'full' scan
        zap_path: Path to ZAP executable (optional, for auto-start)
        
    Returns:
        Dict with scan results and findings
    """
    findings = []
    
    if not ZAP_AVAILABLE:
        return {
            'success': False,
            'url': target_url,
            'error': 'ZAP_UNAVAILABLE',
            'error_message': 'python-owasp-zap-v2.4 not installed. Install with: pip install python-owasp-zap-v2.4',
            'findings': [{
                'title': 'ZAP Not Available',
                'description': 'OWASP ZAP Python client not installed',
                'severity': 'informational',
                'affected_url': target_url,
                'remediation': 'Install python-owasp-zap-v2.4: pip install python-owasp-zap-v2.4'
            }]
        }
    
    try:
        # Ensure ZAP is running
        if not ensure_zap_running(zap_path):
            return {
                'success': False,
                'url': target_url,
                'error': 'ZAP_NOT_RUNNING',
                'error_message': 'ZAP daemon is not running. Start ZAP with: zap.sh -daemon -host 0.0.0.0 -port 8080',
                'findings': [{
                    'title': 'ZAP Not Running',
                    'description': 'OWASP ZAP daemon is not running. Start it before running scans.',
                    'severity': 'informational',
                    'affected_url': target_url,
                    'remediation': 'Start ZAP: zap.sh -daemon -host 0.0.0.0 -port 8080'
                }]
            }
        
        # Initialize ZAP client
        # ZAP allows connections without API key from localhost by default
        api_key = get_zap_api_key()
        api_url = get_zap_api_url()
        
        # Only pass apikey if it's set
        if api_key:
            zap = ZAPv2(apikey=api_key)
        else:
            zap = ZAPv2()
        
        # Set the correct base URL (ZAPv2 defaults to http://zap/JSON/)
        zap.base = f"{api_url}/JSON/"
        
        # Parse URL
        parsed = urlparse(target_url)
        target = f"{parsed.scheme}://{parsed.netloc}"
        
        logger.info(f"[ZAP] Starting {scan_type} scan on {target}")
        
        # Spider the target
        logger.info("[ZAP] Spidering target...")
        spider_id = zap.spider.scan(target)
        while int(zap.spider.status(spider_id)) < 100:
            time.sleep(2)
        logger.info("[ZAP] Spider completed")
        
        # Wait for passive scanning
        time.sleep(5)
        
        # Run active scan if full scan
        if scan_type == 'full':
            logger.info("[ZAP] Running active scan...")
            ascan_id = zap.ascan.scan(target)
            while int(zap.ascan.status(ascan_id)) < 100:
                time.sleep(5)
            logger.info("[ZAP] Active scan completed")
        
        # Get alerts
        try:
            alerts = zap.core.alerts(baseurl=target)
            logger.info(f"[ZAP] Retrieved {len(alerts)} alerts from ZAP")
        except Exception as e:
            logger.error(f"[ZAP] Error retrieving alerts: {str(e)}")
            # Try to get alerts without baseurl filter
            try:
                alerts = zap.core.alerts()
                logger.info(f"[ZAP] Retrieved {len(alerts)} alerts (without baseurl filter)")
            except Exception as e2:
                logger.error(f"[ZAP] Error retrieving alerts without filter: {str(e2)}")
                alerts = []
        
        # Convert alerts to findings
        severity_map = {
            'High': 'high',
            'Medium': 'medium',
            'Low': 'low',
            'Informational': 'informational'
        }
        
        for alert in alerts:
            findings.append({
                'title': alert.get('name', 'Security Issue'),
                'description': alert.get('description', ''),
                'severity': severity_map.get(alert.get('risk', 'Informational'), 'informational'),
                'affected_url': alert.get('url', target_url),
                'evidence': {
                    'alert_id': alert.get('id'),
                    'risk': alert.get('risk'),
                    'confidence': alert.get('confidence'),
                    'cweid': alert.get('cweid'),
                    'wascid': alert.get('wascid'),
                    'solution': alert.get('solution', ''),
                    'reference': alert.get('reference', '')
                },
                'remediation': alert.get('solution', 'Review and fix the security issue')
            })
        
        # Get summary
        summary = {
            'total_alerts': len(alerts),
            'high': len([a for a in alerts if a.get('risk') == 'High']),
            'medium': len([a for a in alerts if a.get('risk') == 'Medium']),
            'low': len([a for a in alerts if a.get('risk') == 'Low']),
            'informational': len([a for a in alerts if a.get('risk') == 'Informational'])
        }
        
        logger.info(f"[ZAP] Scan completed: {len(findings)} findings, summary: {summary}")
        
        return {
            'success': True,
            'url': target_url,
            'target': target,
            'scan_type': scan_type,
            'findings': findings,
            'summary': summary
        }
        
    except Exception as e:
        logger.error(f"[ZAP] Error scanning {target_url}: {str(e)}")
        return {
            'success': False,
            'url': target_url,
            'error': 'ZAP_SCAN_ERROR',
            'error_message': str(e),
            'findings': [{
                'title': 'ZAP Scan Error',
                'description': f'Error during ZAP scan: {str(e)}',
                'severity': 'informational',
                'affected_url': target_url,
                'remediation': 'Check ZAP configuration and ensure it is running'
            }]
        }

