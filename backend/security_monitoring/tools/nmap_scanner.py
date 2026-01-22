"""
Nmap Port Scanner Integration
Uses python-nmap for port and service discovery
"""

import logging
import socket
from typing import Dict, List
from urllib.parse import urlparse
from django.conf import settings
import os

logger = logging.getLogger(__name__)

# Try to import python-nmap
try:
    import nmap
    NMAP_AVAILABLE = True
except ImportError:
    NMAP_AVAILABLE = False
    logger.warning("python-nmap not installed. Nmap scanning will not be available.")


def get_nmap_path():
    """Get nmap executable path from settings, environment, or tools directory"""
    # Check settings first
    if hasattr(settings, 'NMAP_PATH') and settings.NMAP_PATH:
        return settings.NMAP_PATH
    
    # Check environment variable
    env_path = os.environ.get('NMAP_PATH')
    if env_path and os.path.exists(env_path):
        return env_path
    
    # Check project tools directory
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    tools_dir = os.path.join(project_root, 'tools', 'nmap')
    
    # Try different possible locations
    possible_paths = [
        os.path.join(tools_dir, 'nmap.exe'),  # Windows
        os.path.join(tools_dir, 'nmap'),       # Linux/Mac
        os.path.join(tools_dir, 'nmap-7.95', 'nmap.exe'),  # Windows with version
        os.path.join(tools_dir, 'nmap-7.95', 'nmap'),      # Linux/Mac with version
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            logger.info(f"[Nmap] Using nmap at: {path}")
            return path
    
    # Fallback to 'nmap' (assumes it's in PATH)
    logger.warning("[Nmap] Nmap executable not found in tools directory, using 'nmap' from PATH")
    return 'nmap'


def run_nmap_scan(target_url: str, scan_options: str = None) -> Dict:
    """
    Run nmap port scan on target
    
    Args:
        target_url: Target URL or hostname
        scan_options: Custom nmap options (optional)
        
    Returns:
        Dict with scan results and findings
    """
    findings = []
    
    if not NMAP_AVAILABLE:
        return {
            'success': False,
            'target': target_url,
            'error': 'NMAP_UNAVAILABLE',
            'error_message': 'python-nmap not installed. Install with: pip install python-nmap',
            'findings': [{
                'title': 'Nmap Not Available',
                'description': 'python-nmap library not installed',
                'severity': 'informational',
                'affected_url': target_url,
                'remediation': 'Install python-nmap: pip install python-nmap'
            }]
        }
    
    try:
        # Parse target
        parsed = urlparse(target_url if '://' in target_url else f'https://{target_url}')
        hostname = parsed.hostname or target_url
        
        # Resolve hostname to IP
        try:
            ip_address = socket.gethostbyname(hostname)
        except socket.gaierror:
            return {
                'success': False,
                'target': target_url,
                'error': 'DNS_RESOLUTION_FAILED',
                'error_message': f'Could not resolve hostname: {hostname}',
                'findings': [{
                    'title': 'DNS Resolution Failed',
                    'description': f'Could not resolve {hostname} to an IP address',
                    'severity': 'medium',
                    'affected_url': target_url,
                    'remediation': 'Check DNS configuration and hostname'
                }]
            }
        
        logger.info(f"[Nmap] Scanning {hostname} ({ip_address})")
        
        # Get nmap executable path
        nmap_path = get_nmap_path()
        
        # If nmap is in tools directory, add it to PATH temporarily
        original_path = os.environ.get('PATH', '')
        path_modified = False
        if nmap_path != 'nmap' and os.path.exists(nmap_path):
            # Add the directory containing nmap to PATH
            nmap_dir = os.path.dirname(nmap_path)
            if nmap_dir not in original_path:
                path_separator = ';' if os.name == 'nt' else ':'
                os.environ['PATH'] = f"{nmap_dir}{path_separator}{original_path}"
                path_modified = True
                logger.info(f"[Nmap] Added {nmap_dir} to PATH")
        
        try:
            # Initialize nmap scanner - python-nmap will find nmap in PATH
            # If we have a custom path, we can also try to set it directly
            if nmap_path != 'nmap' and os.path.exists(nmap_path):
                # Try to set the nmap path directly if python-nmap supports it
                try:
                    nm = nmap.PortScanner()
                    # Set the nmap path if the library supports it
                    if hasattr(nm, 'nmap_path'):
                        nm.nmap_path = nmap_path
                    elif hasattr(nm, '_nmap_path'):
                        nm._nmap_path = nmap_path
                except Exception as e:
                    logger.warning(f"[Nmap] Could not set custom path, using PATH: {str(e)}")
                    nm = nmap.PortScanner()
            else:
                nm = nmap.PortScanner()
            
            # Default scan options: -Pn (skip ping), -sV (version detection), --open (only open ports)
            scan_opts = scan_options or '-Pn -sV --open'
            
            # Run scan
            nm.scan(hostname, arguments=scan_opts)
            
            if hostname not in nm.all_hosts():
                return {
                    'success': False,
                    'target': target_url,
                    'error': 'NMAP_SCAN_FAILED',
                    'error_message': 'Nmap scan did not return results for target',
                    'findings': []
                }
            
                # Process results
            open_ports = []
            services = []
            risky_ports = {
            21: 'FTP',
            22: 'SSH',
            23: 'Telnet',
            25: 'SMTP',
            80: 'HTTP',
            135: 'RPC',
            139: 'NetBIOS',
            445: 'SMB',
            1433: 'MSSQL',
            3306: 'MySQL',
            3389: 'RDP',
            5432: 'PostgreSQL',
            5900: 'VNC',
            8080: 'HTTP-Proxy',
            8443: 'HTTPS-Alt'
        }
        
            for host in nm.all_hosts():
                for proto in nm[host].all_protocols():
                    ports = nm[host][proto].keys()
                    for port in ports:
                        port_info = nm[host][proto][port]
                        state = port_info['state']
                        
                        if state == 'open':
                            service_name = port_info.get('name', 'unknown')
                            product = port_info.get('product', '')
                            version = port_info.get('version', '')
                            service_info = f"{service_name}"
                            if product:
                                service_info += f" ({product}"
                                if version:
                                    service_info += f" {version}"
                                service_info += ")"
                            
                            open_ports.append({
                                'port': port,
                                'protocol': proto,
                                'service': service_name,
                                'product': product,
                                'version': version,
                                'info': service_info
                            })
                            
                            services.append(service_info)
                            
                            # Check for risky ports
                            if port in risky_ports:
                                findings.append({
                                    'title': f'Risky Port Open: {risky_ports[port]} ({port})',
                                    'description': f'Port {port} ({risky_ports[port]}) is open and accessible. This service may pose security risks if not properly secured.',
                                    'severity': 'high' if port in [22, 3389, 1433, 3306, 5432] else 'medium',
                                    'affected_url': f"{hostname}:{port}",
                                    'evidence': {
                                        'port': port,
                                        'protocol': proto,
                                        'service': service_name,
                                        'product': product,
                                        'version': version
                                    },
                                    'remediation': f'Secure or disable {risky_ports[port]} service on port {port}. Use firewall rules to restrict access if needed.'
                                })
                            
                            # Check for outdated/banner information
                            if version and any(v in version.lower() for v in ['old', 'deprecated', 'legacy']):
                                findings.append({
                                    'title': f'Potentially Outdated Service: {service_name}',
                                    'description': f'Service {service_name} on port {port} may be using an outdated version: {version}',
                                    'severity': 'medium',
                                    'affected_url': f"{hostname}:{port}",
                                    'evidence': {
                                        'port': port,
                                        'service': service_name,
                                        'version': version
                                    },
                                    'remediation': 'Update service to latest secure version'
                                })
            
            # Summary
            summary = {
                'hostname': hostname,
                'ip_address': ip_address,
                'open_ports_count': len(open_ports),
                'services_count': len(set(services)),
                'risky_ports_count': len([p for p in open_ports if p['port'] in risky_ports])
            }
            
            return {
                'success': True,
                'target': target_url,
                'hostname': hostname,
                'ip_address': ip_address,
                'open_ports': open_ports,
                'findings': findings,
                'summary': summary
            }
        
        finally:
            # Restore original PATH after all operations complete
            if path_modified:
                os.environ['PATH'] = original_path
                logger.info(f"[Nmap] Restored original PATH")
        
    except nmap.PortScannerError as e:
        logger.error(f"[Nmap] PortScanner error: {str(e)}")
        return {
            'success': False,
            'target': target_url,
            'error': 'NMAP_ERROR',
            'error_message': str(e),
            'findings': [{
                'title': 'Nmap Scan Error',
                'description': f'Nmap scan failed: {str(e)}',
                'severity': 'informational',
                'affected_url': target_url,
                'remediation': 'Check nmap installation and permissions'
            }]
        }
    except Exception as e:
        logger.error(f"[Nmap] Error scanning {target_url}: {str(e)}")
        return {
            'success': False,
            'target': target_url,
            'error': 'UNKNOWN_ERROR',
            'error_message': str(e),
            'findings': []
        }

