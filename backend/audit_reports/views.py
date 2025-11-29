from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from datetime import timedelta
import uuid
from .models import AuditReport
from .serializers import (
    AuditReportSerializer, 
    AuditReportCreateSerializer,
    PerformanceAnalysisSerializer,
    SSLAnalysisSerializer,
    DNSAnalysisSerializer,
    SitemapAnalysisSerializer,
    APIAnalysisSerializer,
    LinksAnalysisSerializer,
    TypographyAnalysisSerializer
)
# Import monitoring utilities
from core.monitoring import job_monitor


class AuditReportViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing audit reports.
    Users can only see their own reports.
    """
    permission_classes = [AllowAny]  # TODO: Change back to IsAuthenticated after fixing auth
    serializer_class = AuditReportSerializer
    
    def get_queryset(self):
        """Filter reports to current user only"""
        # If user is authenticated, filter by user, otherwise return all (for testing)
        if self.request.user and self.request.user.is_authenticated:
            return AuditReport.objects.filter(user=self.request.user)
        return AuditReport.objects.all()
    
    def get_serializer_class(self):
        """Use different serializer for create action"""
        if self.action == 'create':
            return AuditReportCreateSerializer
        return AuditReportSerializer
    
    def create(self, request, *args, **kwargs):
        """
        Create a new audit report.
        PDF generation will be triggered by the Next.js frontend.
        """
        print("="*60)
        print("[CreateAuditReport] REQUEST RECEIVED")
        print("="*60)
        print(f"[CreateAuditReport] Method: {request.method}")
        print(f"[CreateAuditReport] Data keys: {list(request.data.keys()) if hasattr(request.data, 'keys') else 'N/A'}")
        print(f"[CreateAuditReport] URL: {request.data.get('url', 'NOT PROVIDED')}")
        print(f"[CreateAuditReport] Tools selected: {request.data.get('tools_selected', 'NOT PROVIDED')}")
        print(f"[CreateAuditReport] User authenticated: {request.user.is_authenticated if hasattr(request, 'user') else 'N/A'}")
        print(f"[CreateAuditReport] User: {request.user.username if hasattr(request, 'user') and request.user.is_authenticated else 'Anonymous'}")
        
        # Start monitoring the audit pipeline job
        job_id = str(uuid.uuid4())
        job_monitor.start_job(
            job_id=job_id,
            job_type='audit_pipeline',
            metadata={
                'user_id': request.user.id if request.user.is_authenticated else None,
                'url': request.data.get('url', ''),
            }
        )
        
        try:
            serializer = self.get_serializer(data=request.data)
            print(f"[CreateAuditReport] Serializer created, validating...")
            serializer.is_valid(raise_exception=True)
            print(f"[CreateAuditReport] Serializer is valid")
            
            # Set user from request (required field)
            # The serializer doesn't include 'user', so we must set it here
            if request.user and request.user.is_authenticated:
                print(f"[CreateAuditReport] Saving with authenticated user: {request.user.username}")
                report = serializer.save(user=request.user)
            else:
                # For unauthenticated requests, get or create a system user
                from django.contrib.auth.models import User
                print(f"[CreateAuditReport] Saving with system user (anonymous)")
                system_user, created = User.objects.get_or_create(
                    username='system',
                    defaults={
                        'email': 'system@localhost',
                        'is_active': True
                    }
                )
                if created:
                    print(f"[CreateAuditReport] Created system user")
                else:
                    print(f"[CreateAuditReport] Using existing system user")
                report = serializer.save(user=system_user)
            
            print(f"[CreateAuditReport] AuditReport created: ID={report.id}")
            print(f"[CreateAuditReport] URL={report.url}")
            print(f"[CreateAuditReport] Tools={report.tools_selected}")
            print(f"[CreateAuditReport] Status={report.status}")
            
            # Store job_id in report metadata (if you have a metadata field)
            # For now, we'll track it separately
            
            # Note: PDF generation is handled by Next.js API route
            # The frontend will call /api/generate-pdf/{id} after creating the report
            
            # Complete the job monitoring
            job_monitor.complete_job(
                job_id=job_id,
                result={
                    'report_id': report.id,
                    'status': report.status,
                }
            )
            
            # Return the created report
            response_serializer = AuditReportSerializer(report)
            response_data = response_serializer.data
            print(f"[CreateAuditReport] Response data keys: {list(response_data.keys())}")
            print(f"[CreateAuditReport] Response ID: {response_data.get('id')}")
            print("="*60)
            
            return Response(
                response_data,
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"[CreateAuditReport] ========================================")
            print(f"[CreateAuditReport] ERROR: {str(e)}")
            print(f"[CreateAuditReport] ========================================")
            print(f"[CreateAuditReport] Traceback: {error_trace}")
            print(f"[CreateAuditReport] ========================================")
            
            # Fail the job monitoring
            job_monitor.fail_job(
                job_id=job_id,
                error=e,
                error_message=str(e)
            )
            raise
    
    @action(detail=True, methods=['post'])
    def retry(self, request, pk=None):
        """
        Retry failed PDF generation for a specific report.
        """
        report = self.get_object()
        
        if report.status != 'failed':
            return Response(
                {'error': 'Can only retry failed reports'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Reset status and clear error
        report.status = 'pending'
        report.error_message = None
        report.completed_at = None
        report.save()
        
        # Note: PDF generation will be triggered by Next.js API route
        
        serializer = self.get_serializer(report)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get statistics about user's reports.
        """
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'pending': queryset.filter(status='pending').count(),
            'generating': queryset.filter(status='generating').count(),
            'ready': queryset.filter(status='ready').count(),
            'failed': queryset.filter(status='failed').count(),
        }
        
        return Response(stats)
    
    @action(detail=False, methods=['post'])
    def cleanup_old(self, request):
        """
        Delete reports older than 30 days.
        Users can manually trigger cleanup of their own reports.
        """
        cutoff_date = timezone.now() - timedelta(days=30)
        old_reports = self.get_queryset().filter(created_at__lt=cutoff_date)
        
        # Delete associated PDF files
        deleted_count = 0
        for report in old_reports:
            if report.pdf_url:
                # File deletion will be handled by the delete signal
                pass
            deleted_count += 1
        
        old_reports.delete()
        
        return Response({
            'message': f'Deleted {deleted_count} old reports',
            'deleted_count': deleted_count
        })


@api_view(['GET'])
@permission_classes([AllowAny])
def get_audit_analyses(request, audit_report_id):
    """
    Retrieve all analyses for an audit report.
    Returns all analysis data in a format ready for PDF generation.
    """
    try:
        audit_report = AuditReport.objects.prefetch_related(
            'performance_analyses',
            'ssl_analyses',
            'dns_analyses',
            'sitemap_analyses',
            'api_analyses',
            'links_analyses',
            'typography_analyses'
        ).get(id=audit_report_id)
        
        return Response({
            'audit_report': {
                'id': str(audit_report.id),
                'url': audit_report.url,
                'tools_selected': audit_report.tools_selected,
                'created_at': audit_report.created_at.isoformat(),
                'status': audit_report.status,
            },
            'analyses': {
                'performance': PerformanceAnalysisSerializer(audit_report.performance_analyses.all(), many=True).data,
                'ssl': SSLAnalysisSerializer(audit_report.ssl_analyses.all(), many=True).data,
                'dns': DNSAnalysisSerializer(audit_report.dns_analyses.all(), many=True).data,
                'sitemap': SitemapAnalysisSerializer(audit_report.sitemap_analyses.all(), many=True).data,
                'api': APIAnalysisSerializer(audit_report.api_analyses.all(), many=True).data,
                'links': LinksAnalysisSerializer(audit_report.links_analyses.all(), many=True).data,
                'typography': TypographyAnalysisSerializer(audit_report.typography_analyses.all(), many=True).data,
            }
        }, status=status.HTTP_200_OK)
        
    except AuditReport.DoesNotExist:
        return Response({
            'error': 'Audit report not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

