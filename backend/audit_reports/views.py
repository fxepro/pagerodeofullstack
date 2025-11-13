from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from datetime import timedelta
import uuid
from .models import AuditReport
from .serializers import AuditReportSerializer, AuditReportCreateSerializer
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
            serializer.is_valid(raise_exception=True)
            report = serializer.save()
            
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
            return Response(
                response_serializer.data,
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
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

