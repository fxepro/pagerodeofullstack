"""
Location and Runner Health API Views for Multi-Location Management
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from .models import Location, RunnerHealth
from .serializers import LocationSerializer, RunnerHealthSerializer
from users.permission_utils import has_permission
import logging

logger = logging.getLogger(__name__)


# Location Views
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def list_locations(request):
    """List all locations with optional filtering, or create a new location"""
    try:
        if request.method == 'POST':
            # Create new location
            if not has_permission(request.user, 'users.edit'):
                return Response(
                    {'error': 'You do not have permission to create locations.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            serializer = LocationSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # GET - List locations
        if not has_permission(request.user, 'users.view'):
            return Response(
                {'error': 'You do not have permission to view locations.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        search = request.GET.get('search', '')
        status_filter = request.GET.get('status', '')
        continent = request.GET.get('continent', '')
        
        locations = Location.objects.all()
        
        if search:
            locations = locations.filter(
                Q(name__icontains=search) |
                Q(region_code__icontains=search) |
                Q(country__icontains=search) |
                Q(continent__icontains=search)
            )
        
        if status_filter:
            locations = locations.filter(status=status_filter)
        
        if continent:
            locations = locations.filter(continent=continent)
        
        serializer = LocationSerializer(locations, many=True)
        return Response(serializer.data)
    except Exception as e:
        logger.error(f"Error in list_locations: {str(e)}", exc_info=True)
        return Response(
            {'error': f'An error occurred: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_location(request, location_id):
    """Get a specific location by ID"""
    if not has_permission(request.user, 'users.view'):
        return Response(
            {'error': 'You do not have permission to view locations.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        location = Location.objects.get(id=location_id)
        serializer = LocationSerializer(location)
        return Response(serializer.data)
    except Location.DoesNotExist:
        return Response(
            {'error': 'Location not found.'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def update_location(request, location_id):
    """Get, update, or delete an existing location"""
    try:
        location = Location.objects.get(id=location_id)
    except Location.DoesNotExist:
        return Response(
            {'error': 'Location not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        # Get location
        if not has_permission(request.user, 'users.view'):
            return Response(
                {'error': 'You do not have permission to view locations.'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = LocationSerializer(location)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        # Update location
        if not has_permission(request.user, 'users.edit'):
            return Response(
                {'error': 'You do not have permission to update locations.'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = LocationSerializer(location, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        # Delete location
        if not has_permission(request.user, 'users.edit'):
            return Response(
                {'error': 'You do not have permission to delete locations.'},
                status=status.HTTP_403_FORBIDDEN
            )
        location.delete()
        return Response({'message': 'Location deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)


# Runner Health Views
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def list_runner_health(request):
    """List all runner health records with optional filtering, or create a new record"""
    try:
        if request.method == 'POST':
            # Create new runner health record
            if not has_permission(request.user, 'users.edit'):
                return Response(
                    {'error': 'You do not have permission to create runner health records.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            serializer = RunnerHealthSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # GET - List runner health records
        if not has_permission(request.user, 'users.view'):
            return Response(
                {'error': 'You do not have permission to view runner health records.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        search = request.GET.get('search', '')
        status_filter = request.GET.get('status', '')
        location_id = request.GET.get('location_id', '')
        can_accept_jobs = request.GET.get('can_accept_jobs', '')
        
        runners = RunnerHealth.objects.select_related('location').all()
        
        if search:
            runners = runners.filter(
                Q(runner_id__icontains=search) |
                Q(region__icontains=search) |
                Q(location__name__icontains=search) |
                Q(location__region_code__icontains=search)
            )
        
        if status_filter:
            runners = runners.filter(status=status_filter)
        
        if location_id:
            runners = runners.filter(location_id=location_id)
        
        if can_accept_jobs.lower() == 'true':
            runners = runners.filter(can_accept_jobs=True)
        elif can_accept_jobs.lower() == 'false':
            runners = runners.filter(can_accept_jobs=False)
        
        serializer = RunnerHealthSerializer(runners, many=True)
        return Response(serializer.data)
    except Exception as e:
        logger.error(f"Error in list_runner_health: {str(e)}", exc_info=True)
        return Response(
            {'error': f'An error occurred: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_runner_health(request, runner_id):
    """Get a specific runner health record by runner_id"""
    if not has_permission(request.user, 'users.view'):
        return Response(
            {'error': 'You do not have permission to view runner health records.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        runner = RunnerHealth.objects.select_related('location').get(runner_id=runner_id)
        serializer = RunnerHealthSerializer(runner)
        return Response(serializer.data)
    except RunnerHealth.DoesNotExist:
        return Response(
            {'error': 'Runner health record not found.'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def update_runner_health(request, runner_id):
    """Get, update, or delete an existing runner health record"""
    try:
        runner = RunnerHealth.objects.select_related('location').get(runner_id=runner_id)
    except RunnerHealth.DoesNotExist:
        return Response(
            {'error': 'Runner health record not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        # Get runner health
        if not has_permission(request.user, 'users.view'):
            return Response(
                {'error': 'You do not have permission to view runner health records.'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = RunnerHealthSerializer(runner)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        # Update runner health
        if not has_permission(request.user, 'users.edit'):
            return Response(
                {'error': 'You do not have permission to update runner health records.'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = RunnerHealthSerializer(runner, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        # Delete runner health
        if not has_permission(request.user, 'users.edit'):
            return Response(
                {'error': 'You do not have permission to delete runner health records.'},
                status=status.HTTP_403_FORBIDDEN
            )
        runner.delete()
        return Response({'message': 'Runner health record deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)
