"""
Utility functions for security scan execution
"""

import logging
from django.utils import timezone
from .models import SecurityScan, SecurityFinding
from .tools.http_headers import check_http_security_headers
from .tools.ssl_checker import check_ssl_tls
from .tools import discover_dns_subdomains, run_zap_scan, run_nmap_scan, run_amass_scan

logger = logging.getLogger(__name__)


def execute_security_scan(scan_id):
    """
    Execute a security scan using the appropriate tool.
    
    Args:
        scan_id: ID of the SecurityScan to execute
    """
    try:
        scan = SecurityScan.objects.get(id=scan_id)
        
        # Update status to running
        scan.status = 'running'
        scan.started_at = timezone.now()
        scan.save()
        
        logger.info(f"[SecurityScan] Starting scan {scan_id}: {scan.scan_type} on {scan.target_url}")
        
        findings_data = []
        
        # Execute scan based on type
        if scan.scan_type == 'headers_check':
            result = check_http_security_headers(scan.target_url)
            findings_data = result.get('findings', [])
            
        elif scan.scan_type == 'ssl_check':
            result = check_ssl_tls(scan.target_url)
            findings_data = result.get('findings', [])
            
        elif scan.scan_type == 'dns_discovery':
            # Use amass for enhanced DNS discovery (fallback to basic if not available)
            scan_config = scan.scan_config or {}
            result = run_amass_scan(scan.target_url, scan_config=scan_config)
            if not result.get('success') and 'AMASS_NOT_FOUND' in result.get('error', ''):
                # Fallback to basic DNS discovery
                logger.info(f"[SecurityScan] Amass not found, using basic DNS discovery for {scan_id}")
                result = discover_dns_subdomains(scan.target_url)
            findings_data = result.get('findings', [])
            
        elif scan.scan_type == 'dast':
            # Use OWASP ZAP for DAST scanning
            scan_config = scan.scan_config or {}
            scan_type = scan_config.get('scan_type', 'baseline')  # 'baseline' or 'full'
            zap_path = scan_config.get('zap_path', None)
            result = run_zap_scan(scan.target_url, scan_type=scan_type, zap_path=zap_path)
            
            # Check if scan failed
            if not result.get('success', True):
                error_msg = result.get('error_message', result.get('error', 'Unknown error'))
                logger.error(f"[SecurityScan] ZAP scan failed: {error_msg}")
                findings_data = result.get('findings', [])
                # If no findings were returned but there's an error, create an error finding
                if not findings_data and error_msg:
                    findings_data = [{
                        'title': f'ZAP Scan Error: {result.get("error", "Unknown")}',
                        'description': error_msg,
                        'severity': 'informational',
                        'affected_url': scan.target_url,
                        'remediation': 'Check ZAP configuration and ensure it is running. Start ZAP with: .\\scripts\\start-zap.ps1'
                    }]
            else:
                findings_data = result.get('findings', [])
                # Log if scan completed but found nothing (this is normal for some sites)
                if not findings_data:
                    logger.info(f"[SecurityScan] ZAP scan completed but found no security issues on {scan.target_url}")
            
        elif scan.scan_type == 'port_scan':
            # Use Nmap for port scanning
            scan_config = scan.scan_config or {}
            scan_options = scan_config.get('scan_options', None)
            result = run_nmap_scan(scan.target_url, scan_options=scan_options)
            findings_data = result.get('findings', [])
            
        else:
            logger.warning(f"[SecurityScan] Unknown scan type: {scan.scan_type}")
            findings_data = [{
                'title': f'Scan Type Not Implemented: {scan.scan_type}',
                'description': f'Scan type {scan.scan_type} is not yet implemented.',
                'severity': 'informational',
                'affected_url': scan.target_url
            }]
        
        # Create SecurityFinding records
        for finding_data in findings_data:
            SecurityFinding.objects.create(
                scan=scan,
                title=finding_data.get('title', 'Security Finding'),
                description=finding_data.get('description', ''),
                severity=finding_data.get('severity', 'medium'),
                status='new',
                affected_url=finding_data.get('affected_url', scan.target_url),
                evidence=finding_data.get('evidence', {}),
                remediation=finding_data.get('remediation', '')
            )
        
        # Update status to completed
        scan.status = 'completed'
        scan.completed_at = timezone.now()
        scan.save()
        
        logger.info(f"[SecurityScan] Completed scan {scan_id} with {len(findings_data)} findings")
        
        return scan
        
    except SecurityScan.DoesNotExist:
        logger.error(f"[SecurityScan] Scan {scan_id} not found")
        raise
    except Exception as e:
        logger.error(f"[SecurityScan] Error executing scan {scan_id}: {str(e)}")
        if 'scan' in locals():
            scan.status = 'failed'
            scan.save()
        raise

