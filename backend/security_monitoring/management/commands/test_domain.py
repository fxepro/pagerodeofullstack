"""
Management command to run all security tests on a domain
Usage: python manage.py test_domain https://www.example.com
"""

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from django.contrib.auth.models import User
from security_monitoring.models import SecurityScan, SecurityFinding
from security_monitoring.utils import execute_security_scan
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Run all available security tests on a domain'

    def add_arguments(self, parser):
        parser.add_argument(
            'domain',
            type=str,
            help='Domain or URL to test (e.g., https://www.example.com or www.example.com)'
        )
        parser.add_argument(
            '--user',
            type=str,
            default=None,
            help='Username to assign scans to (default: first superuser)'
        )
        parser.add_argument(
            '--skip-types',
            type=str,
            nargs='+',
            default=[],
            help='Scan types to skip (e.g., --skip-types vulnerability_scan cms_scan)'
        )
        parser.add_argument(
            '--only-types',
            type=str,
            nargs='+',
            default=[],
            help='Only run these scan types (e.g., --only-types headers_check ssl_check)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be run without actually executing'
        )

    def handle(self, *args, **options):
        domain = options['domain'].strip()
        
        # Normalize URL
        if not domain.startswith('http://') and not domain.startswith('https://'):
            domain = f'https://{domain}'
        
        self.stdout.write(self.style.SUCCESS(f'\n[TEST] Testing domain: {domain}\n'))
        
        # Get user
        user = None
        if options['user']:
            try:
                user = User.objects.get(username=options['user'])
            except User.DoesNotExist:
                raise CommandError(f'User "{options["user"]}" not found')
        else:
            # Get first superuser or first user
            user = User.objects.filter(is_superuser=True).first()
            if not user:
                user = User.objects.first()
            if not user:
                raise CommandError('No users found. Create a user first.')
        
        self.stdout.write(f'Using user: {user.username}')
        
        # Define all available scan types with their tools
        all_scan_types = {
            'headers_check': {
                'tool': 'securityheaders.io',
                'description': 'HTTP Security Headers & Basic Hardening Checks',
                'implemented': True
            },
            'ssl_check': {
                'tool': 'Qualys SSL Labs',
                'description': 'TLS / SSL Configuration & Cert Checks',
                'implemented': True
            },
            'dns_discovery': {
                'tool': 'amass',
                'description': 'DNS/Subdomain Discovery',
                'implemented': True
            },
            'dast': {
                'tool': 'OWASP ZAP',
                'description': 'DAST (Automated Web App Scanning)',
                'implemented': True,
                'config': {'scan_type': 'baseline'}  # Use baseline for faster testing
            },
            'port_scan': {
                'tool': 'Nmap',
                'description': 'Port & Service Discovery',
                'implemented': True
            },
            'vulnerability_scan': {
                'tool': 'Nessus',
                'description': 'External Network / Host Vulnerability Scan',
                'implemented': False
            },
            'misconfiguration_scan': {
                'tool': 'Nikto',
                'description': 'Web-server Misconfiguration Scan',
                'implemented': False
            },
            'cms_scan': {
                'tool': 'WPScan',
                'description': 'CMS / Platform-specific Remote Scans',
                'implemented': False
            },
            'sql_injection': {
                'tool': 'sqlmap',
                'description': 'SQL Injection / Targeted Exploit Checks',
                'implemented': False
            },
            'continuous_monitoring': {
                'tool': 'Detectify',
                'description': 'Automated External Monitoring / Continuous Scanning',
                'implemented': False
            },
            'manual_pentest': {
                'tool': 'Burp Suite',
                'description': 'Manual Pentest Tools (Proxy & Manual Testing)',
                'implemented': False
            },
        }
        
        # Filter scan types
        scan_types_to_run = {}
        
        if options['only_types']:
            # Only run specified types
            for scan_type in options['only_types']:
                if scan_type in all_scan_types:
                    scan_types_to_run[scan_type] = all_scan_types[scan_type]
                else:
                    self.stdout.write(self.style.WARNING(f'⚠️  Unknown scan type: {scan_type}'))
        else:
            # Run all except skipped
            for scan_type, info in all_scan_types.items():
                if scan_type not in options['skip_types']:
                    scan_types_to_run[scan_type] = info
        
        # Filter to only implemented types
        implemented_scans = {k: v for k, v in scan_types_to_run.items() if v.get('implemented', False)}
        unimplemented_scans = {k: v for k, v in scan_types_to_run.items() if not v.get('implemented', False)}
        
        if unimplemented_scans:
            self.stdout.write(self.style.WARNING(f'\n[WARN] Skipping {len(unimplemented_scans)} unimplemented scan types:'))
            for scan_type, info in unimplemented_scans.items():
                self.stdout.write(f'   - {scan_type}: {info["description"]}')
        
        if not implemented_scans:
            self.stdout.write(self.style.ERROR('\n[ERROR] No implemented scan types to run!'))
            return
        
        self.stdout.write(self.style.SUCCESS(f'\n[OK] Will run {len(implemented_scans)} scan types:\n'))
        for scan_type, info in implemented_scans.items():
            status = '[OK]' if info.get('implemented') else '[SKIP]'
            self.stdout.write(f'   {status} {scan_type}: {info["description"]} ({info["tool"]})')
        
        if options['dry_run']:
            self.stdout.write(self.style.WARNING('\n[DRY RUN] No scans will be created\n'))
            return
        
        # Check prerequisites for specific scans
        if 'dast' in implemented_scans:
            self.stdout.write('[CHECK] Checking ZAP availability...', ending=' ')
            try:
                from security_monitoring.tools.zap_scanner import ensure_zap_running
                if ensure_zap_running():
                    self.stdout.write(self.style.SUCCESS('[OK] ZAP is running'))
                else:
                    self.stdout.write(self.style.WARNING('[WARN] ZAP is not running'))
                    self.stdout.write(self.style.WARNING('   Start ZAP with: .\\scripts\\start-zap.ps1'))
                    self.stdout.write(self.style.WARNING('   Or skip DAST scan with: --skip-types dast'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'[ERROR] Error checking ZAP: {str(e)}'))
        
        if 'port_scan' in implemented_scans:
            self.stdout.write('[CHECK] Checking Nmap availability...', ending=' ')
            try:
                import nmap
                self.stdout.write(self.style.SUCCESS('[OK] Nmap is available'))
            except ImportError:
                self.stdout.write(self.style.WARNING('[WARN] python-nmap not installed'))
                self.stdout.write(self.style.WARNING('   Install with: pip install python-nmap'))
                self.stdout.write(self.style.WARNING('   Also ensure Nmap binary is installed'))
        
        # Create and execute scans
        self.stdout.write(self.style.SUCCESS('\n[RUN] Creating and executing scans...\n'))
        
        results = []
        
        for scan_type, info in implemented_scans.items():
            try:
                self.stdout.write(f'[CREATE] Creating {scan_type} scan...', ending=' ')
                
                # Get scan config if specified
                scan_config = info.get('config', {})
                
                # Create scan
                scan = SecurityScan.objects.create(
                    scan_type=scan_type,
                    target_url=domain,
                    tool_used=info['tool'],
                    scan_config=scan_config,
                    created_by=user,
                    status='pending'
                )
                
                self.stdout.write(self.style.SUCCESS('[OK] Created'))
                self.stdout.write(f'   [EXEC] Executing scan {scan.id}...', ending=' ')
                
                # Execute scan
                try:
                    execute_security_scan(scan.id)
                    scan.refresh_from_db()
                    
                    findings_count = scan.findings.count()
                    
                    if scan.status == 'completed':
                        if findings_count == 0:
                            self.stdout.write(self.style.SUCCESS(f'[OK] Completed (0 findings - no issues found)'))
                        else:
                            self.stdout.write(self.style.SUCCESS(f'[OK] Completed ({findings_count} findings)'))
                        results.append({
                            'scan_type': scan_type,
                            'status': 'completed',
                            'findings': findings_count,
                            'scan_id': scan.id
                        })
                    elif scan.status == 'failed':
                        self.stdout.write(self.style.ERROR(f'[FAIL] Failed'))
                        # Try to get error from last finding if available
                        last_finding = scan.findings.last()
                        if last_finding:
                            self.stdout.write(self.style.ERROR(f'   Error: {last_finding.title}'))
                        results.append({
                            'scan_type': scan_type,
                            'status': 'failed',
                            'findings': findings_count,
                            'scan_id': scan.id
                        })
                    else:
                        self.stdout.write(self.style.WARNING(f'[WARN] {scan.status} ({findings_count} findings)'))
                        results.append({
                            'scan_type': scan_type,
                            'status': scan.status,
                            'findings': findings_count,
                            'scan_id': scan.id
                        })
                except Exception as e:
                    import traceback
                    error_trace = traceback.format_exc()
                    self.stdout.write(self.style.ERROR(f'[ERROR] Error: {str(e)}'))
                    logger.error(f"[TestDomain] Error executing {scan_type} scan: {error_trace}")
                    results.append({
                        'scan_type': scan_type,
                        'status': 'error',
                        'error': str(e),
                        'scan_id': scan.id
                    })
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'[ERROR] Failed to create: {str(e)}'))
                results.append({
                    'scan_type': scan_type,
                    'status': 'error',
                    'error': str(e)
                })
        
        # Summary
        self.stdout.write(self.style.SUCCESS('\n' + '='*60))
        self.stdout.write(self.style.SUCCESS('[SUMMARY]'))
        self.stdout.write(self.style.SUCCESS('='*60 + '\n'))
        
        completed = sum(1 for r in results if r['status'] == 'completed')
        failed = sum(1 for r in results if r['status'] == 'failed')
        errors = sum(1 for r in results if r['status'] == 'error')
        total_findings = sum(r.get('findings', 0) for r in results)
        
        self.stdout.write(f'[OK] Completed: {completed}/{len(results)}')
        self.stdout.write(f'[FAIL] Failed: {failed}/{len(results)}')
        if errors > 0:
            self.stdout.write(f'[ERROR] Errors: {errors}/{len(results)}')
        self.stdout.write(f'[FINDINGS] Total Findings: {total_findings}\n')
        
        self.stdout.write('\n[SCAN DETAILS]:')
        for result in results:
            status_icon = '[OK]' if result['status'] == 'completed' else '[FAIL]' if result['status'] == 'failed' else '[WARN]'
            findings = result.get('findings', 0)
            scan_id = result.get('scan_id', 'N/A')
            self.stdout.write(f'   {status_icon} {result["scan_type"]}: {result["status"]} ({findings} findings, ID: {scan_id})')
            if 'error' in result:
                self.stdout.write(f'      Error: {result["error"]}')
        
        self.stdout.write(self.style.SUCCESS(f'\n[OK] All scans completed! View results in Security Monitoring dashboard.\n'))

