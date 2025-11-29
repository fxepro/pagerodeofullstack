"""
API views for Admin API Monitoring
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import APIEndpoint, APICheck, APIAlert
from .utils import test_api_endpoint, discover_api_endpoints, extract_path_from_url, detect_context_from_url
from .serializers import APIEndpointSerializer, APICheckSerializer, APIAlertSerializer


@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def api_endpoints_list(request):
    """List all API endpoints or create a new one"""
    if request.method == 'GET':
        endpoints = APIEndpoint.objects.all().order_by('-created_at')
        serializer = APIEndpointSerializer(endpoints, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = APIEndpointSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAdminUser])
def api_endpoint_detail(request, pk):
    """Get, update, or delete a specific API endpoint"""
    try:
        endpoint = APIEndpoint.objects.get(pk=pk)
    except APIEndpoint.DoesNotExist:
        return Response({'error': 'Endpoint not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = APIEndpointSerializer(endpoint)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = APIEndpointSerializer(endpoint, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        endpoint.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def test_endpoint(request, pk):
    """Test a specific API endpoint"""
    try:
        endpoint = APIEndpoint.objects.get(pk=pk)
    except APIEndpoint.DoesNotExist:
        return Response({'error': 'Endpoint not found'}, status=status.HTTP_404_NOT_FOUND)
    
    check = test_api_endpoint(endpoint)
    serializer = APICheckSerializer(check)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def test_multiple_endpoints(request):
    """Test multiple API endpoints"""
    endpoint_ids = request.data.get('endpoint_ids', [])
    results = []
    
    for endpoint_id in endpoint_ids:
        try:
            endpoint = APIEndpoint.objects.get(pk=endpoint_id)
            check = test_api_endpoint(endpoint)
            results.append({
                'endpoint_id': endpoint_id,
                'check': APICheckSerializer(check).data
            })
        except APIEndpoint.DoesNotExist:
            results.append({
                'endpoint_id': endpoint_id,
                'error': 'Endpoint not found'
            })
    
    return Response({'results': results})


@api_view(['POST'])
@permission_classes([IsAdminUser])
def discover_apis(request):
    """Discover APIs from a base URL"""
    base_url = request.data.get('base_url')
    if not base_url:
        return Response({'error': 'base_url is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    discovered = discover_api_endpoints(base_url)
    created = 0
    
    for api in discovered:
        if api['found']:
            # Extract path for name (e.g., "api/token/refresh/")
            name = extract_path_from_url(api['url'])
            endpoint, created_flag = APIEndpoint.objects.get_or_create(
                url=api['url'],
                method=api['method'],
                defaults={
                    'name': name,
                    'expected_status_code': api['status_code'],
                    'is_active': True
                }
            )
            if created_flag:
                created += 1
    
    return Response({
        'discovered': len([a for a in discovered if a['found']]),
        'created': created,
        'results': discovered
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def api_checks_list(request):
    """List API checks, optionally filtered by endpoint"""
    endpoint_id = request.query_params.get('endpoint_id')
    limit = int(request.query_params.get('limit', 50))
    
    checks = APICheck.objects.all().order_by('-checked_at')
    if endpoint_id:
        checks = checks.filter(endpoint_id=endpoint_id)
    
    checks = checks[:limit]
    serializer = APICheckSerializer(checks, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def api_alerts_list(request):
    """List API alerts, optionally filtered by resolved status"""
    is_resolved = request.query_params.get('is_resolved')
    limit = int(request.query_params.get('limit', 50))
    
    alerts = APIAlert.objects.all().order_by('-created_at')
    if is_resolved is not None:
        alerts = alerts.filter(is_resolved=is_resolved.lower() == 'true')
    
    alerts = alerts[:limit]
    serializer = APIAlertSerializer(alerts, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def resolve_alert(request, pk):
    """Mark an alert as resolved"""
    try:
        alert = APIAlert.objects.get(pk=pk)
    except APIAlert.DoesNotExist:
        return Response({'error': 'Alert not found'}, status=status.HTTP_404_NOT_FOUND)
    
    alert.is_resolved = True
    alert.resolved_at = timezone.now()
    alert.save()
    
    serializer = APIAlertSerializer(alert)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def api_monitoring_stats(request):
    """Get overall API monitoring statistics"""
    total_endpoints = APIEndpoint.objects.count()
    active_endpoints = APIEndpoint.objects.filter(is_active=True).count()
    
    recent_checks = APICheck.objects.filter(
        checked_at__gte=timezone.now() - timezone.timedelta(hours=24)
    )
    successful_checks = recent_checks.filter(is_success=True).count()
    failed_checks = recent_checks.filter(is_success=False).count()
    
    active_alerts = APIAlert.objects.filter(is_resolved=False).count()
    
    # Get latest check for each endpoint
    endpoints_with_status = []
    for endpoint in APIEndpoint.objects.filter(is_active=True):
        last_check = endpoint.checks.order_by('-checked_at').first()
        endpoints_with_status.append({
            'id': endpoint.id,
            'name': endpoint.name,
            'url': endpoint.url,
            'last_check': APICheckSerializer(last_check).data if last_check else None
        })
    
    return Response({
        'total_endpoints': total_endpoints,
        'active_endpoints': active_endpoints,
        'recent_checks_24h': {
            'total': recent_checks.count(),
            'successful': successful_checks,
            'failed': failed_checks,
            'success_rate': (successful_checks / recent_checks.count() * 100) if recent_checks.count() > 0 else 0
        },
        'active_alerts': active_alerts,
        'endpoints': endpoints_with_status
    })

