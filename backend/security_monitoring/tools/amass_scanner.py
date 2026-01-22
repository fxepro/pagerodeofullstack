"""
Amass DNS/Subdomain Discovery Integration
Uses subprocess to call amass binary for subdomain enumeration
"""

import logging
import subprocess
import json
import os
from typing import Dict, List
from urllib.parse import urlparse
from django.conf import settings

logger = logging.getLogger(__name__)


def get_amass_path():
    """Get amass executable path from settings or environment"""
    return getattr(settings, 'AMASS_PATH', os.environ.get('AMASS_PATH', 'amass'))


def run_amass_scan(target_url: str, scan_config: dict = None) -> Dict:
    """
    Run amass DNS/subdomain discovery scan
    
    Args:
        target_url: Target URL or domain
        scan_config: Additional configuration (optional)
        
    Returns:
        Dict with scan results and findings
    """
    findings = []
    
    try:
        # Parse target to get domain
        parsed = urlparse(target_url if '://' in target_url else f'https://{target_url}')
        domain = parsed.hostname or target_url
        
        # Remove www. prefix if present
        if domain.startswith('www.'):
            domain = domain[4:]
        
        logger.info(f"[Amass] Discovering subdomains for {domain}")
        
        # Get amass path
        amass_path = get_amass_path()
        
        # Check if amass is available
        try:
            result = subprocess.run(
                [amass_path, 'enum', '-version'],
                capture_output=True,
                text=True,
                timeout=5
            )
        except FileNotFoundError:
            return {
                'success': False,
                'domain': domain,
                'error': 'AMASS_NOT_FOUND',
                'error_message': f'amass executable not found at: {amass_path}',
                'findings': [{
                    'title': 'Amass Not Installed',
                    'description': f'amass executable not found. Install amass and ensure it is in PATH or set AMASS_PATH environment variable.',
                    'severity': 'informational',
                    'affected_url': target_url,
                    'remediation': 'Install amass: choco install amass (Windows) or download from GitHub releases'
                }]
            }
        
        # Run amass enum
        # Use -json flag to get JSON output
        cmd = [amass_path, 'enum', '-d', domain, '-json', '-o', '-']
        
        # Add additional options from config
        if scan_config:
            if scan_config.get('passive', False):
                cmd.append('-passive')
            if scan_config.get('active', False):
                cmd.append('-active')
            if scan_config.get('brute', False):
                cmd.append('-brute')
        
        logger.info(f"[Amass] Running command: {' '.join(cmd)}")
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )
        
        if result.returncode != 0:
            return {
                'success': False,
                'domain': domain,
                'error': 'AMASS_SCAN_FAILED',
                'error_message': result.stderr or 'Amass scan failed',
                'findings': [{
                    'title': 'Amass Scan Failed',
                    'description': f'Amass scan failed: {result.stderr}',
                    'severity': 'informational',
                    'affected_url': target_url,
                    'remediation': 'Check amass installation and network connectivity'
                }]
            }
        
        # Parse JSON output
        subdomains = []
        if result.stdout:
            for line in result.stdout.strip().split('\n'):
                if line.strip():
                    try:
                        data = json.loads(line)
                        if 'name' in data:
                            subdomains.append(data['name'])
                    except json.JSONDecodeError:
                        continue
        
        # Remove duplicates and sort
        subdomains = sorted(list(set(subdomains)))
        
        # Create findings for discovered subdomains
        if len(subdomains) > 0:
            findings.append({
                'title': f'Discovered {len(subdomains)} Subdomains',
                'description': f'Amass discovered {len(subdomains)} unique subdomains for {domain}',
                'severity': 'informational',
                'affected_url': domain,
                'evidence': {
                    'subdomains': subdomains[:50],  # Limit to first 50 for evidence
                    'total_count': len(subdomains)
                },
                'remediation': 'Review discovered subdomains for security implications. Ensure all subdomains are properly secured.'
            })
            
            # Check for common risky subdomains
            risky_subdomains = ['admin', 'test', 'staging', 'dev', 'backup', 'old', 'legacy']
            found_risky = [s for s in subdomains if any(risky in s.lower() for risky in risky_subdomains)]
            
            if found_risky:
                findings.append({
                    'title': f'Potentially Risky Subdomains Found',
                    'description': f'Found {len(found_risky)} subdomains with potentially risky names: {", ".join(found_risky[:10])}',
                    'severity': 'medium',
                    'affected_url': domain,
                    'evidence': {
                        'risky_subdomains': found_risky
                    },
                    'remediation': 'Review and secure or remove risky subdomains. Ensure they are not exposing sensitive information.'
                })
        else:
            findings.append({
                'title': 'No Subdomains Discovered',
                'description': f'Amass did not discover any subdomains for {domain}',
                'severity': 'informational',
                'affected_url': target_url,
                'remediation': 'This may indicate good security practices, or amass may need additional configuration for deeper scanning.'
            })
        
        return {
            'success': True,
            'domain': domain,
            'target_url': target_url,
            'subdomains': subdomains,
            'findings': findings,
            'summary': {
                'total_subdomains': len(subdomains),
                'risky_subdomains': len(found_risky) if 'found_risky' in locals() else 0
            }
        }
        
    except subprocess.TimeoutExpired:
        logger.error(f"[Amass] Scan timeout for {target_url}")
        return {
            'success': False,
            'domain': domain if 'domain' in locals() else target_url,
            'error': 'AMASS_TIMEOUT',
            'error_message': 'Amass scan timed out after 5 minutes',
            'findings': [{
                'title': 'Amass Scan Timeout',
                'description': 'Amass scan exceeded timeout limit. The domain may have many subdomains or network issues.',
                'severity': 'informational',
                'affected_url': target_url,
                'remediation': 'Try running amass with passive mode or increase timeout'
            }]
        }
    except Exception as e:
        logger.error(f"[Amass] Error scanning {target_url}: {str(e)}")
        return {
            'success': False,
            'domain': domain if 'domain' in locals() else target_url,
            'error': 'UNKNOWN_ERROR',
            'error_message': str(e),
            'findings': []
        }

