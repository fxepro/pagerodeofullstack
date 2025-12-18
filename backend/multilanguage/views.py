from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.core.management import call_command
from io import StringIO
from .models import PageTranslationStatus
from .serializers import PageTranslationStatusSerializer


class PageTranslationStatusViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing page translation status
    """
    queryset = PageTranslationStatus.objects.all()
    serializer_class = PageTranslationStatusSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = PageTranslationStatus.objects.all()
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by page type
        page_type = self.request.query_params.get('page_type', None)
        if page_type:
            queryset = queryset.filter(page_type=page_type)
        
        # Search
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(page_route__icontains=search) |
                Q(component_path__icontains=search)
            )
        
        return queryset.order_by('page_type', 'page_route')
    
    @action(detail=True, methods=['post'])
    def mark_complete(self, request, pk=None):
        """
        Mark a page as translation complete (implemented)
        """
        page = self.get_object()
        page.status = 'implemented'
        page.updated_by = request.user
        page.save()
        
        serializer = self.get_serializer(page)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def scan_pages(self, request):
        """
        Scan the codebase for new pages and add them to the database
        """
        try:
            # Import here to avoid circular imports
            from .management.commands.scan_pages import scan_pages_for_translation
            
            new_pages, updated_pages = scan_pages_for_translation()
            
            return Response({
                'success': True,
                'message': f'Scan complete. Found {new_pages} new pages, updated {updated_pages} existing pages.',
                'new_pages': new_pages,
                'updated_pages': updated_pages,
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """
        Update the status of a page
        """
        page = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in dict(PageTranslationStatus.STATUS_CHOICES):
            return Response({
                'error': f'Invalid status. Must be one of: {", ".join([s[0] for s in PageTranslationStatus.STATUS_CHOICES])}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        page.status = new_status
        page.updated_by = request.user
        if 'notes' in request.data:
            page.notes = request.data['notes']
        page.save()
        
        serializer = self.get_serializer(page)
        return Response(serializer.data)
