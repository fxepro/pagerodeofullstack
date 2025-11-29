"""
Django management command to test all analysis save endpoints.

Usage:
    python manage.py test_analysis_save
    python manage.py test_analysis_save --dns-only
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from audit_reports.models import AuditReport
from rest_framework.test import APIRequestFactory

TEST_URL = "https://example.com"

class Command(BaseCommand):
    help = 'Test all analysis save endpoints'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dns-only',
            action='store_true',
            help='Test only DNS analysis',
        )

    def handle(self, *args, **options):
        self.stdout.write("="*60)
        self.stdout.write("ANALYSIS SAVE ENDPOINT TEST SUITE")
        self.stdout.write("="*60)
        
        # Create test audit report
        user = User.objects.first()
        audit_report = AuditReport.objects.create(
            url=TEST_URL,
            user=user,
            tools_selected=['dns', 'performance', 'ssl', 'sitemap', 'api', 'links', 'typography'],
            status='running'
        )
        self.stdout.write(self.style.SUCCESS(f"Created AuditReport: {audit_report.id}"))
        
        if options['dns_only']:
            self.test_dns(audit_report)
        else:
            self.test_dns(audit_report)
            self.test_performance(audit_report)
            self.test_ssl(audit_report)
            self.test_sitemap(audit_report)
            self.test_api(audit_report)
            self.test_links(audit_report)
            self.test_typography(audit_report)
        
        # Verify (skip if migrations not run yet)
        try:
            self.verify_audit_report(audit_report)
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"Verification skipped (migrations may need to be run): {str(e)}"))

    def test_dns(self, audit_report):
        self.stdout.write("\n" + "="*60)
        self.stdout.write("TESTING: DNS Analysis")
        self.stdout.write("="*60)
        
        from dns_analysis.views import save_dns_analysis
        factory = APIRequestFactory()
        
        test_data = {
            'url': TEST_URL,
            'audit_report_id': str(audit_report.id),
            'a_records': ['192.0.2.1', '192.0.2.2'],
            'aaaa_records': ['2001:db8::1'],
            'mx_records': [{'priority': 10, 'host': 'mail.example.com'}],
            'txt_records': ['v=spf1 include:_spf.example.com ~all'],
            'cname_records': ['www.example.com'],
            'ns_records': ['ns1.example.com', 'ns2.example.com'],
            'soa_record': {'mname': 'ns1.example.com', 'rname': 'admin.example.com', 'serial': 2024010101},
            'response_time_ms': 45.2,
            'dns_server': '8.8.8.8',
            'dns_server_ip': '8.8.8.8',
            'dns_health_score': 95,
            'issues': [],
            'recommendations': ['Consider adding IPv6 records'],
            'full_results': {'test': 'data'}
        }
        
        request = factory.post('/api/analysis/dns/', test_data, format='json')
        
        try:
            response = save_dns_analysis(request)
            if response.status_code == 201:
                data = response.data
                self.stdout.write(self.style.SUCCESS(f"DNS Analysis saved! ID: {data.get('id')}"))
                
                # Verify in database
                from dns_analysis.models import DNSAnalysis
                analysis = DNSAnalysis.objects.get(id=data['id'])
                self.stdout.write(f"  - URL: {analysis.url}")
                self.stdout.write(f"  - Audit Report ID: {analysis.audit_report_id}")
                self.stdout.write(f"  - A Records: {len(analysis.a_records)}")
                self.stdout.write(f"  - Health Score: {analysis.dns_health_score}")
                return True
            else:
                self.stdout.write(self.style.ERROR(f"Failed: {response.status_code}"))
                self.stdout.write(f"Error: {response.data}")
                return False
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Exception: {str(e)}"))
            import traceback
            self.stdout.write(traceback.format_exc())
            return False

    def test_performance(self, audit_report):
        self.stdout.write("\n" + "="*60)
        self.stdout.write("TESTING: Performance Analysis")
        self.stdout.write("="*60)
        
        from performance_analysis.views import save_performance_analysis
        from performance_analysis.models import PerformanceAnalysis, NetworkRequest, ResourceBreakdown, PerformanceTimelineEvent
        factory = APIRequestFactory()
        
        # Create realistic Lighthouse JSON structure
        lighthouse_result = {
            'networkRequests': [
                {
                    'url': 'https://example.com/',
                    'resourceType': 'Document',
                    'transferSize': 15000,
                    'resourceSize': 45000,
                    'statusCode': 200,
                    'protocol': 'http/2',
                    'timing': {
                        'startTime': 0,
                        'endTime': 0.5,
                        'dnsStart': 0,
                        'dnsEnd': 0.01,
                        'connectStart': 0.01,
                        'connectEnd': 0.05,
                        'sslStart': 0.05,
                        'sslEnd': 0.08,
                        'sendStart': 0.08,
                        'sendEnd': 0.09,
                        'receiveHeadersEnd': 0.2,
                    },
                    'priority': 'VeryHigh',
                    'renderBlockingStatus': 'blocking',
                    'initiator': {'type': 'parser', 'url': ''},
                    'fromCache': False,
                    'fromServiceWorker': False,
                },
                {
                    'url': 'https://example.com/style.css',
                    'resourceType': 'Stylesheet',
                    'transferSize': 25000,
                    'resourceSize': 80000,
                    'statusCode': 200,
                    'protocol': 'http/2',
                    'timing': {
                        'startTime': 0.1,
                        'endTime': 0.3,
                        'dnsStart': 0.1,
                        'dnsEnd': 0.11,
                        'connectStart': 0.11,
                        'connectEnd': 0.12,
                        'sendStart': 0.12,
                        'sendEnd': 0.13,
                        'receiveHeadersEnd': 0.15,
                    },
                    'priority': 'High',
                    'renderBlockingStatus': 'blocking',
                    'initiator': {'type': 'parser', 'url': 'https://example.com/'},
                    'fromCache': False,
                    'fromServiceWorker': False,
                },
                {
                    'url': 'https://example.com/script.js',
                    'resourceType': 'Script',
                    'transferSize': 50000,
                    'resourceSize': 150000,
                    'statusCode': 200,
                    'protocol': 'http/2',
                    'timing': {
                        'startTime': 0.2,
                        'endTime': 0.6,
                        'dnsStart': 0.2,
                        'dnsEnd': 0.21,
                        'connectStart': 0.21,
                        'connectEnd': 0.22,
                        'sendStart': 0.22,
                        'sendEnd': 0.23,
                        'receiveHeadersEnd': 0.3,
                    },
                    'priority': 'High',
                    'renderBlockingStatus': 'non-blocking',
                    'initiator': {'type': 'parser', 'url': 'https://example.com/'},
                    'fromCache': False,
                    'fromServiceWorker': False,
                },
            ],
            'traceEvents': [
                {
                    'name': 'navigationStart',
                    'cat': 'navigation',
                    'ts': 0,
                    'dur': 0,
                    'ph': 'B',
                    'pid': 1,
                    'tid': 1,
                    'args': {},
                },
                {
                    'name': 'firstPaint',
                    'cat': 'paint',
                    'ts': 500000,
                    'dur': 0,
                    'ph': 'I',
                    'pid': 1,
                    'tid': 1,
                    'args': {},
                },
                {
                    'name': 'firstContentfulPaint',
                    'cat': 'paint',
                    'ts': 600000,
                    'dur': 0,
                    'ph': 'I',
                    'pid': 1,
                    'tid': 1,
                    'args': {},
                },
                {
                    'name': 'largestContentfulPaint',
                    'cat': 'paint',
                    'ts': 1200000,
                    'dur': 0,
                    'ph': 'I',
                    'pid': 1,
                    'tid': 1,
                    'args': {},
                },
            ],
            'audits': {
                'network-requests': {
                    'details': {
                        'items': [
                            {
                                'url': 'https://example.com/',
                                'resourceType': 'Document',
                                'transferSize': 15000,
                                'resourceSize': 45000,
                            },
                            {
                                'url': 'https://example.com/style.css',
                                'resourceType': 'Stylesheet',
                                'transferSize': 25000,
                                'resourceSize': 80000,
                            },
                        ]
                    }
                }
            }
        }
        
        test_data = {
            'url': TEST_URL,
            'audit_report_id': str(audit_report.id),
            'device': 'desktop',
            'performance_score': 85,
            'lcp': 2.5,
            'fid': 50,
            'cls': 0.1,
            'tti': 3.2,
            'tbt': 200,
            'fcp': 1.8,
            'speed_index': 2.1,
            'page_size_mb': 2.5,
            'request_count': 45,
            'load_time': 3.5,
            'dom_content_loaded': 2500,
            'first_paint': 1200,
            'accessibility_score': 90,
            'best_practices_score': 85,
            'seo_score': 95,
            'resources': [{'type': 'script', 'size': 100000}],
            'recommendations': ['Optimize images'],
            'full_results': {'lighthouseResult': lighthouse_result}
        }
        
        request = factory.post('/api/analysis/performance/', test_data, format='json')
        
        try:
            response = save_performance_analysis(request)
            if response.status_code == 201:
                analysis_id = response.data.get('id')
                self.stdout.write(self.style.SUCCESS(f"Performance Analysis saved! ID: {analysis_id}"))
                
                # Verify detailed tables were populated
                analysis = PerformanceAnalysis.objects.get(id=analysis_id)
                
                network_count = NetworkRequest.objects.filter(performance_analysis=analysis).count()
                resource_count = ResourceBreakdown.objects.filter(performance_analysis=analysis).count()
                timeline_count = PerformanceTimelineEvent.objects.filter(performance_analysis=analysis).count()
                
                self.stdout.write(f"\nDetailed Tables Verification:")
                self.stdout.write(f"  Network Requests: {network_count}")
                self.stdout.write(f"  Resource Breakdowns: {resource_count}")
                self.stdout.write(f"  Timeline Events: {timeline_count}")
                
                if network_count > 0:
                    self.stdout.write(self.style.SUCCESS(f"  [OK] Network Requests populated"))
                else:
                    self.stdout.write(self.style.WARNING(f"  [WARN] Network Requests empty"))
                
                if resource_count > 0:
                    self.stdout.write(self.style.SUCCESS(f"  [OK] Resource Breakdowns populated"))
                else:
                    self.stdout.write(self.style.WARNING(f"  [WARN] Resource Breakdowns empty"))
                
                if timeline_count > 0:
                    self.stdout.write(self.style.SUCCESS(f"  [OK] Timeline Events populated"))
                else:
                    self.stdout.write(self.style.WARNING(f"  [WARN] Timeline Events empty"))
                
                # Show sample data
                if network_count > 0:
                    sample_request = NetworkRequest.objects.filter(performance_analysis=analysis).first()
                    self.stdout.write(f"\n  Sample Network Request:")
                    self.stdout.write(f"    URL: {sample_request.url[:50]}...")
                    self.stdout.write(f"    Type: {sample_request.resource_type}")
                    self.stdout.write(f"    Duration: {sample_request.duration}ms")
                    self.stdout.write(f"    Size: {sample_request.transfer_size} bytes")
                
                return True
            else:
                self.stdout.write(self.style.ERROR(f"Failed: {response.status_code}"))
                return False
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Exception: {str(e)}"))
            import traceback
            self.stdout.write(traceback.format_exc())
            return False

    def test_ssl(self, audit_report):
        self.stdout.write("\n" + "="*60)
        self.stdout.write("TESTING: SSL Analysis")
        self.stdout.write("="*60)
        
        from ssl_analysis.views import save_ssl_analysis
        factory = APIRequestFactory()
        
        test_data = {
            'url': TEST_URL,
            'audit_report_id': str(audit_report.id),
            'is_valid': True,
            'expires_at': '2025-12-31T23:59:59Z',
            'days_until_expiry': 365,
            'issuer': 'Lets Encrypt',
            'subject': 'CN=example.com',
            'serial_number': '1234567890',
            'root_ca_valid': True,
            'intermediate_valid': True,
            'certificate_valid': True,
            'protocol': 'TLS 1.3',
            'cipher_suite': 'TLS_AES_256_GCM_SHA384',
            'certificate_chain': [],
            'san_domains': ['example.com', 'www.example.com'],
            'ssl_health_score': 100,
            'issues': [],
            'recommendations': [],
            'full_results': {'test': 'data'}
        }
        
        request = factory.post('/api/analysis/ssl/', test_data, format='json')
        
        try:
            response = save_ssl_analysis(request)
            if response.status_code == 201:
                self.stdout.write(self.style.SUCCESS(f"SSL Analysis saved! ID: {response.data.get('id')}"))
                return True
            else:
                self.stdout.write(self.style.ERROR(f"Failed: {response.status_code}"))
                return False
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Exception: {str(e)}"))
            return False

    def test_sitemap(self, audit_report):
        self.stdout.write("\n" + "="*60)
        self.stdout.write("TESTING: Sitemap Analysis")
        self.stdout.write("="*60)
        
        from sitemap_analysis.views import save_sitemap_analysis
        factory = APIRequestFactory()
        
        test_data = {
            'url': TEST_URL,
            'audit_report_id': str(audit_report.id),
            'sitemap_found': True,
            'sitemap_url': f'{TEST_URL}/sitemap.xml',
            'sitemap_type': 'XML',
            'total_urls': 100,
            'last_modified': '2024-01-01T00:00:00Z',
            'change_frequency': 'weekly',
            'priority': 0.8,
            'urls': [f'{TEST_URL}/page1', f'{TEST_URL}/page2'],
            'is_sitemap_index': False,
            'sitemap_index_urls': [],
            'issues': [],
            'recommendations': [],
            'health_score': 90,
            'full_results': {'test': 'data'}
        }
        
        request = factory.post('/api/analysis/sitemap/', test_data, format='json')
        
        try:
            response = save_sitemap_analysis(request)
            if response.status_code == 201:
                self.stdout.write(self.style.SUCCESS(f"Sitemap Analysis saved! ID: {response.data.get('id')}"))
                return True
            else:
                self.stdout.write(self.style.ERROR(f"Failed: {response.status_code}"))
                return False
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Exception: {str(e)}"))
            return False

    def test_api(self, audit_report):
        self.stdout.write("\n" + "="*60)
        self.stdout.write("TESTING: API Analysis")
        self.stdout.write("="*60)
        
        from api_analysis.views import save_api_analysis
        factory = APIRequestFactory()
        
        test_data = {
            'url': TEST_URL,
            'audit_report_id': str(audit_report.id),
            'endpoints': [
                {'url': f'{TEST_URL}/api/v1/users', 'method': 'GET', 'status_code': 200},
                {'url': f'{TEST_URL}/api/v1/posts', 'method': 'GET', 'status_code': 200}
            ],
            'total_endpoints': 2,
            'endpoints_by_method': {'GET': 2},
            'endpoints_by_status': {200: 2},
            'api_health_score': 95,
            'issues': [],
            'recommendations': [],
            'response_types': ['JSON'],
            'auth_methods': ['Bearer'],
            'requires_auth': True,
            'full_results': {'test': 'data'}
        }
        
        request = factory.post('/api/analysis/api/', test_data, format='json')
        
        try:
            response = save_api_analysis(request)
            if response.status_code == 201:
                self.stdout.write(self.style.SUCCESS(f"API Analysis saved! ID: {response.data.get('id')}"))
                return True
            else:
                self.stdout.write(self.style.ERROR(f"Failed: {response.status_code}"))
                return False
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Exception: {str(e)}"))
            return False

    def test_links(self, audit_report):
        self.stdout.write("\n" + "="*60)
        self.stdout.write("TESTING: Links Analysis")
        self.stdout.write("="*60)
        
        from links_analysis.views import save_links_analysis
        factory = APIRequestFactory()
        
        test_data = {
            'url': TEST_URL,
            'audit_report_id': str(audit_report.id),
            'links': [
                {'url': f'{TEST_URL}/page1', 'status': 200, 'is_internal': True, 'response_time': 100},
                {'url': f'{TEST_URL}/page2', 'status': 404, 'is_internal': True, 'response_time': 50},
                {'url': 'https://external.com', 'status': 200, 'is_external': True, 'response_time': 200}
            ],
            'total_links': 3,
            'internal_links': 2,
            'external_links': 1,
            'broken_links': 1,
            'redirect_links': 0,
            'links_by_status': {200: 2, 404: 1},
            'links_health_score': 67,
            'issues': ['1 broken link found'],
            'recommendations': ['Fix broken links'],
            'broken_links_list': [{'url': f'{TEST_URL}/page2', 'status': 404}],
            'avg_response_time': 116.67,
            'min_response_time': 50,
            'max_response_time': 200,
            'full_results': {'test': 'data'}
        }
        
        request = factory.post('/api/analysis/links/', test_data, format='json')
        
        try:
            response = save_links_analysis(request)
            if response.status_code == 201:
                self.stdout.write(self.style.SUCCESS(f"Links Analysis saved! ID: {response.data.get('id')}"))
                return True
            else:
                self.stdout.write(self.style.ERROR(f"Failed: {response.status_code}"))
                return False
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Exception: {str(e)}"))
            return False

    def test_typography(self, audit_report):
        self.stdout.write("\n" + "="*60)
        self.stdout.write("TESTING: Typography Analysis")
        self.stdout.write("="*60)
        
        from typography_analysis.views import save_typography_analysis
        factory = APIRequestFactory()
        
        test_data = {
            'url': TEST_URL,
            'audit_report_id': str(audit_report.id),
            'fonts_used': ['Arial', 'Helvetica', 'Times New Roman'],
            'font_sizes': ['16px', '14px', '18px', '12px'],
            'font_weights': ['400', '700', '300'],
            'line_heights': ['1.5', '1.6', '1.4'],
            'font_families': ['Arial', 'Helvetica'],
            'total_fonts': 3,
            'total_font_sizes': 4,
            'min_font_size': 12,
            'max_font_size': 18,
            'avg_font_size': 15,
            'issues': ['Too many fonts (3)'],
            'recommendations': ['Limit to 2 font families'],
            'health_score': 75,
            'accessibility_issues': ['Small text found'],
            'full_results': {'test': 'data'}
        }
        
        request = factory.post('/api/analysis/typography/', test_data, format='json')
        
        try:
            response = save_typography_analysis(request)
            if response.status_code == 201:
                self.stdout.write(self.style.SUCCESS(f"Typography Analysis saved! ID: {response.data.get('id')}"))
                return True
            else:
                self.stdout.write(self.style.ERROR(f"Failed: {response.status_code}"))
                return False
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Exception: {str(e)}"))
            return False

    def verify_audit_report(self, audit_report):
        self.stdout.write("\n" + "="*60)
        self.stdout.write("VERIFICATION: Audit Report Data")
        self.stdout.write("="*60)
        
        audit_report.refresh_from_db()
        
        self.stdout.write(f"\nAudit Report ID: {audit_report.id}")
        self.stdout.write(f"URL: {audit_report.url}")
        
        checks = [
            ('Performance', audit_report.performance_analyses.count()),
            ('SSL', audit_report.ssl_analyses.count()),
            ('DNS', audit_report.dns_analyses.count()),
            ('Sitemap', audit_report.sitemap_analyses.count()),
            ('API', audit_report.api_analyses.count()),
            ('Links', audit_report.links_analyses.count()),
            ('Typography', audit_report.typography_analyses.count()),
        ]
        
        self.stdout.write("\nLinked Analyses:")
        for name, count in checks:
            if count > 0:
                self.stdout.write(self.style.SUCCESS(f"  {name}: {count}"))
            else:
                self.stdout.write(self.style.WARNING(f"  {name}: {count}"))

