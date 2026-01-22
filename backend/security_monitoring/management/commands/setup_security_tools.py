"""
Django management command to seed security tools
"""

from django.core.management.base import BaseCommand
from security_monitoring.models import SecurityTool


class Command(BaseCommand):
    help = 'Setup initial security tools configuration'

    def handle(self, *args, **options):
        tools = [
            {
                'name': 'Google PageSpeed Insights',
                'tool_type': 'api',
                'category': 'site_audit',
                'status': 'not_installed',
                'description': 'Google PageSpeed Insights API for website performance analysis and optimization recommendations',
                'installation_instructions': 'Get API key from https://developers.google.com/speed/docs/insights/v5/get-started',
                'command_template': '',
                'executable_path': '',
                'api_url': 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed',
                'supported_scan_types': [],
                'documentation_url': 'https://developers.google.com/speed/docs/insights/v5/about',
                'is_active': False,
            },
            {
                'name': 'HTTP Security Headers Checker',
                'tool_type': 'builtin',
                'category': 'site_audit',
                'status': 'available',
                'description': 'Built-in Python tool that checks for HTTP security headers (HSTS, CSP, X-Frame-Options, etc.)',
                'installation_instructions': 'No installation required - uses Python requests library',
                'command_template': '',
                'executable_path': '',
                'supported_scan_types': ['headers_check'],
                'documentation_url': 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers',
                'is_active': True,
            },
            {
                'name': 'SSL/TLS Checker',
                'tool_type': 'builtin',
                'category': 'site_audit',
                'status': 'available',
                'description': 'Built-in Python tool that checks SSL certificate validity, TLS version, and cipher suites',
                'installation_instructions': 'No installation required - uses Python ssl and socket libraries',
                'command_template': '',
                'executable_path': '',
                'supported_scan_types': ['ssl_check'],
                'documentation_url': 'https://www.ssl.com/article/ssl-tls-version-guide/',
                'is_active': True,
            },
            {
                'name': 'DNS Discovery (Basic)',
                'tool_type': 'builtin',
                'category': 'security',
                'status': 'available',
                'description': 'Basic DNS subdomain discovery using Python socket and dnspython',
                'installation_instructions': 'Install dnspython: pip install dnspython',
                'command_template': '',
                'executable_path': '',
                'supported_scan_types': ['dns_discovery'],
                'documentation_url': 'https://dnspython.readthedocs.io/',
                'is_active': True,
            },
            {
                'name': 'OWASP ZAP',
                'tool_type': 'external',
                'category': 'security',
                'status': 'not_installed',
                'description': 'OWASP ZAP (Zed Attack Proxy) is a free, open-source security testing tool for finding vulnerabilities in web applications',
                'installation_instructions': 'Download from https://www.zaproxy.org/download/. For Docker: docker pull owasp/zap2docker-stable',
                'command_template': 'zap-cli quick-scan --self-contained --start-options \'-config api.disablekey=true\' {target_url}',
                'executable_path': '',
                'supported_scan_types': ['dast'],
                'documentation_url': 'https://www.zaproxy.org/docs/',
                'is_active': False,
            },
            {
                'name': 'Nmap',
                'tool_type': 'external',
                'category': 'security',
                'status': 'not_installed',
                'description': 'Network Mapper - a free and open source utility for network discovery and security auditing',
                'installation_instructions': 'Windows: Download from https://nmap.org/download.html. Linux: apt-get install nmap. Mac: brew install nmap',
                'command_template': 'nmap -sV -sC -oX - {target_url}',
                'executable_path': '',
                'supported_scan_types': ['port_scan', 'vulnerability_scan'],
                'documentation_url': 'https://nmap.org/docs.html',
                'is_active': False,
            },
            {
                'name': 'amass',
                'tool_type': 'external',
                'category': 'security',
                'status': 'not_installed',
                'description': 'OWASP Amass - In-depth Attack Surface Mapping and Asset Discovery',
                'installation_instructions': 'Download from https://github.com/owasp-amass/amass/releases. Or: go install -v github.com/owasp-amass/amass/v4/...@master',
                'command_template': 'amass enum -d {domain} -o -',
                'executable_path': '',
                'supported_scan_types': ['dns_discovery'],
                'documentation_url': 'https://github.com/owasp-amass/amass',
                'is_active': False,
            },
            {
                'name': 'Nikto',
                'tool_type': 'external',
                'category': 'security',
                'status': 'not_installed',
                'description': 'Nikto web server scanner - scans web servers for dangerous files, misconfigurations, and outdated software',
                'installation_instructions': 'Download from https://github.com/sullo/nikto. Or: apt-get install nikto',
                'command_template': 'nikto -h {target_url} -Format xml -o -',
                'executable_path': '',
                'supported_scan_types': ['misconfiguration_scan'],
                'documentation_url': 'https://github.com/sullo/nikto',
                'is_active': False,
            },
            {
                'name': 'sqlmap',
                'tool_type': 'external',
                'category': 'security',
                'status': 'not_installed',
                'description': 'Automatic SQL injection and database takeover tool',
                'installation_instructions': 'Download from https://github.com/sqlmapproject/sqlmap. Or: pip install sqlmap',
                'command_template': 'sqlmap -u {target_url} --batch --level=1 --risk=1',
                'executable_path': '',
                'supported_scan_types': ['sql_injection'],
                'documentation_url': 'https://github.com/sqlmapproject/sqlmap',
                'is_active': False,
            },
            {
                'name': 'Qualys SSL Labs API',
                'tool_type': 'api',
                'category': 'security',
                'status': 'not_installed',
                'description': 'SSL Labs API for comprehensive SSL/TLS testing',
                'installation_instructions': 'No installation required. Uses public API at https://api.ssllabs.com/api/v3/',
                'command_template': '',
                'executable_path': '',
                'api_url': 'https://api.ssllabs.com/api/v3/',
                'supported_scan_types': ['ssl_check'],
                'documentation_url': 'https://www.ssllabs.com/ssltest/',
                'is_active': False,
            },
        ]
        
        created = 0
        updated = 0
        
        for tool_data in tools:
            tool, created_flag = SecurityTool.objects.update_or_create(
                name=tool_data['name'],
                defaults=tool_data
            )
            if created_flag:
                created += 1
                self.stdout.write(self.style.SUCCESS(f'Created tool: {tool.name}'))
            else:
                updated += 1
                self.stdout.write(self.style.SUCCESS(f'Updated tool: {tool.name}'))
        
        self.stdout.write(self.style.SUCCESS(f'\nSuccessfully processed {len(tools)} tools: {created} created, {updated} updated'))

