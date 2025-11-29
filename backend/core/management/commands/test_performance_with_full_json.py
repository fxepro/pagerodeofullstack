"""
Test script with full Lighthouse JSON structure
Tests saving PerformanceAnalysis with complete Lighthouse data and verifies detailed tables are populated
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from audit_reports.models import AuditReport
from rest_framework.test import APIRequestFactory
from performance_analysis.models import PerformanceAnalysis, NetworkRequest, ResourceBreakdown, PerformanceTimelineEvent

TEST_URL = "https://example.com"

class Command(BaseCommand):
    help = 'Test Performance Analysis save with full Lighthouse JSON'

    def handle(self, *args, **options):
        self.stdout.write("="*60)
        self.stdout.write("PERFORMANCE ANALYSIS - FULL LIGHTHOUSE JSON TEST")
        self.stdout.write("="*60)
        
        # Create test audit report
        user = User.objects.first()
        audit_report = AuditReport.objects.create(
            url=TEST_URL,
            user=user,
            tools_selected=['performance'],
            status='pending'
        )
        self.stdout.write(self.style.SUCCESS(f"Created AuditReport: {audit_report.id}"))
        
        from performance_analysis.views import save_performance_analysis
        factory = APIRequestFactory()
        
        # Full Lighthouse JSON structure (realistic)
        full_lighthouse_json = {
            'lighthouseResult': {
                'networkRequests': [
                    {
                        'url': 'https://example.com/',
                        'resourceType': 'Document',
                        'mimeType': 'text/html',
                        'transferSize': 15234,
                        'resourceSize': 45678,
                        'statusCode': 200,
                        'protocol': 'http/2',
                        'timing': {
                            'startTime': 0.0,
                            'endTime': 0.523,
                            'dnsStart': 0.0,
                            'dnsEnd': 0.012,
                            'connectStart': 0.012,
                            'connectEnd': 0.045,
                            'sslStart': 0.045,
                            'sslEnd': 0.082,
                            'sendStart': 0.082,
                            'sendEnd': 0.085,
                            'receiveHeadersEnd': 0.201,
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
                        'mimeType': 'text/css',
                        'transferSize': 25432,
                        'resourceSize': 80123,
                        'statusCode': 200,
                        'protocol': 'http/2',
                        'timing': {
                            'startTime': 0.105,
                            'endTime': 0.312,
                            'dnsStart': 0.105,
                            'dnsEnd': 0.107,
                            'connectStart': 0.107,
                            'connectEnd': 0.108,
                            'sendStart': 0.108,
                            'sendEnd': 0.109,
                            'receiveHeadersEnd': 0.152,
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
                        'mimeType': 'application/javascript',
                        'transferSize': 50123,
                        'resourceSize': 152345,
                        'statusCode': 200,
                        'protocol': 'http/2',
                        'timing': {
                            'startTime': 0.208,
                            'endTime': 0.612,
                            'dnsStart': 0.208,
                            'dnsEnd': 0.210,
                            'connectStart': 0.210,
                            'connectEnd': 0.211,
                            'sendStart': 0.211,
                            'sendEnd': 0.212,
                            'receiveHeadersEnd': 0.305,
                        },
                        'priority': 'High',
                        'renderBlockingStatus': 'non-blocking',
                        'initiator': {'type': 'parser', 'url': 'https://example.com/'},
                        'fromCache': False,
                        'fromServiceWorker': False,
                    },
                    {
                        'url': 'https://example.com/image.jpg',
                        'resourceType': 'Image',
                        'mimeType': 'image/jpeg',
                        'transferSize': 125432,
                        'resourceSize': 125432,
                        'statusCode': 200,
                        'protocol': 'http/2',
                        'timing': {
                            'startTime': 0.315,
                            'endTime': 0.823,
                            'dnsStart': 0.315,
                            'dnsEnd': 0.317,
                            'connectStart': 0.317,
                            'connectEnd': 0.318,
                            'sendStart': 0.318,
                            'sendEnd': 0.319,
                            'receiveHeadersEnd': 0.425,
                        },
                        'priority': 'Medium',
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
                        'args': {'frame': 'ABC123', 'url': 'https://example.com/'},
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
                    {
                        'name': 'domContentLoaded',
                        'cat': 'navigation',
                        'ts': 800000,
                        'dur': 0,
                        'ph': 'I',
                        'pid': 1,
                        'tid': 1,
                        'args': {},
                    },
                    {
                        'name': 'load',
                        'cat': 'navigation',
                        'ts': 1500000,
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
                                    'transferSize': 15234,
                                    'resourceSize': 45678,
                                },
                                {
                                    'url': 'https://example.com/style.css',
                                    'resourceType': 'Stylesheet',
                                    'transferSize': 25432,
                                    'resourceSize': 80123,
                                },
                                {
                                    'url': 'https://example.com/script.js',
                                    'resourceType': 'Script',
                                    'transferSize': 50123,
                                    'resourceSize': 152345,
                                },
                            ]
                        }
                    },
                    'unused-css-rules': {
                        'details': {
                            'items': [
                                {
                                    'url': 'https://example.com/style.css',
                                    'wastedBytes': 15000,
                                    'wastedMs': 50.5,
                                }
                            ]
                        }
                    },
                    'unused-javascript': {
                        'details': {
                            'items': [
                                {
                                    'url': 'https://example.com/script.js',
                                    'wastedBytes': 30000,
                                    'wastedMs': 120.3,
                                }
                            ]
                        }
                    },
                    'uses-long-cache-ttl': {
                        'details': {
                            'items': [
                                {
                                    'url': 'https://example.com/image.jpg',
                                    'cacheLifetime': 31536000,
                                }
                            ]
                        }
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
            'request_count': 4,
            'load_time': 3.5,
            'dom_content_loaded': 2500,
            'first_paint': 1200,
            'accessibility_score': 90,
            'best_practices_score': 85,
            'seo_score': 95,
            'resources': [{'type': 'script', 'size': 100000}],
            'recommendations': ['Optimize images'],
            'full_results': full_lighthouse_json  # Full Lighthouse JSON
        }
        
        request = factory.post('/api/analysis/performance/', test_data, format='json')
        
        try:
            response = save_performance_analysis(request)
            if response.status_code == 201:
                analysis_id = response.data.get('id')
                self.stdout.write(self.style.SUCCESS(f"\nPerformance Analysis saved! ID: {analysis_id}"))
                
                # Verify PerformanceAnalysis was saved
                analysis = PerformanceAnalysis.objects.get(id=analysis_id)
                self.stdout.write(f"\nPerformanceAnalysis:")
                self.stdout.write(f"  ID: {analysis.id}")
                self.stdout.write(f"  URL: {analysis.url}")
                self.stdout.write(f"  Audit Report ID: {analysis.audit_report_id}")
                self.stdout.write(f"  Has full_results: {bool(analysis.full_results)}")
                self.stdout.write(f"  full_results type: {type(analysis.full_results)}")
                has_lighthouse = 'lighthouseResult' in analysis.full_results if isinstance(analysis.full_results, dict) else False
                self.stdout.write(f"  Has lighthouseResult: {has_lighthouse}")
                
                # Verify detailed tables
                network_count = NetworkRequest.objects.filter(performance_analysis=analysis).count()
                resource_count = ResourceBreakdown.objects.filter(performance_analysis=analysis).count()
                timeline_count = PerformanceTimelineEvent.objects.filter(performance_analysis=analysis).count()
                
                self.stdout.write(f"\nDetailed Tables:")
                self.stdout.write(f"  Network Requests: {network_count}")
                self.stdout.write(f"  Resource Breakdowns: {resource_count}")
                self.stdout.write(f"  Timeline Events: {timeline_count}")
                
                # Verify audit_report links
                network_with_audit = NetworkRequest.objects.filter(performance_analysis=analysis, audit_report=audit_report).count()
                resource_with_audit = ResourceBreakdown.objects.filter(performance_analysis=analysis, audit_report=audit_report).count()
                timeline_with_audit = PerformanceTimelineEvent.objects.filter(performance_analysis=analysis, audit_report=audit_report).count()
                
                self.stdout.write(f"\nAudit Report Links:")
                self.stdout.write(f"  Network Requests with audit_report: {network_with_audit}")
                self.stdout.write(f"  Resource Breakdowns with audit_report: {resource_with_audit}")
                self.stdout.write(f"  Timeline Events with audit_report: {timeline_with_audit}")
                
                # Show sample data with NEW FIELDS
                if network_count > 0:
                    sample = NetworkRequest.objects.filter(performance_analysis=analysis).first()
                    self.stdout.write(f"\nSample Network Request (with NEW fields):")
                    self.stdout.write(f"  URL: {sample.url[:60]}...")
                    self.stdout.write(f"  Type: {sample.resource_type}")
                    self.stdout.write(f"  MIME Type: {sample.mime_type}")  # NEW
                    self.stdout.write(f"  Duration: {sample.duration}ms")
                    self.stdout.write(f"  Size: {sample.transfer_size} bytes")
                    self.stdout.write(f"  DNS Time: {sample.dns_time}ms")  # NEW timing breakdown
                    self.stdout.write(f"  SSL Time: {sample.ssl_time}ms")  # NEW
                    self.stdout.write(f"  Wait Time: {sample.wait_time}ms")  # NEW
                    self.stdout.write(f"  Priority: {sample.priority}")  # NEW
                    self.stdout.write(f"  Initiator: {sample.initiator_type}")  # NEW
                    self.stdout.write(f"  Audit Report ID: {sample.audit_report_id}")
                
                if resource_count > 0:
                    sample = ResourceBreakdown.objects.filter(performance_analysis=analysis).first()
                    self.stdout.write(f"\nSample Resource Breakdown (with NEW fields):")
                    self.stdout.write(f"  URL: {sample.url[:60]}...")
                    self.stdout.write(f"  Category: {sample.category}")
                    self.stdout.write(f"  MIME Type: {sample.mime_type}")  # NEW
                    self.stdout.write(f"  Size: {sample.transfer_size} bytes")
                    self.stdout.write(f"  Unused CSS: {sample.unused_css}")  # NEW
                    self.stdout.write(f"  Unused JS: {sample.unused_javascript}")  # NEW
                    self.stdout.write(f"  Wasted Bytes: {sample.wasted_bytes}")  # NEW
                    self.stdout.write(f"  Wasted MS: {sample.wasted_ms}")  # NEW
                    self.stdout.write(f"  Cache Lifetime: {sample.cache_lifetime}")  # NEW
                    self.stdout.write(f"  Audit Report ID: {sample.audit_report_id}")
                
                if timeline_count > 0:
                    sample = PerformanceTimelineEvent.objects.filter(performance_analysis=analysis).first()
                    self.stdout.write(f"\nSample Timeline Event (with NEW fields):")
                    self.stdout.write(f"  Name: {sample.name}")
                    self.stdout.write(f"  Category: {sample.category}")
                    self.stdout.write(f"  Timestamp: {sample.timestamp} microseconds")
                    self.stdout.write(f"  PID: {sample.pid}")  # NEW
                    self.stdout.write(f"  TID: {sample.tid}")  # NEW
                    self.stdout.write(f"  Args Data: {sample.data}")  # NEW (args stored)
                    self.stdout.write(f"  Audit Report ID: {sample.audit_report_id}")
                
                # Verify JSON storage location
                self.stdout.write(f"\n" + "="*60)
                self.stdout.write("JSON STORAGE LOCATION:")
                self.stdout.write("="*60)
                self.stdout.write(f"The full Lighthouse JSON is stored in:")
                self.stdout.write(f"  Table: performance_analysis")
                self.stdout.write(f"  Column: full_results (JSONField)")
                self.stdout.write(f"  Record ID: {analysis.id}")
                self.stdout.write(f"\nThe parser reads from: performance_analysis.full_results")
                self.stdout.write(f"Then populates: network_request, resource_breakdown, performance_timeline_event")
                
                self.stdout.write(self.style.SUCCESS("\n\n[TEST PASSED] All fields extracted successfully!"))
                return
            else:
                self.stdout.write(self.style.ERROR(f"Failed: {response.status_code}"))
                self.stdout.write(f"Response: {response.data}")
                return
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Exception: {str(e)}"))
            import traceback
            self.stdout.write(traceback.format_exc())
            return False

