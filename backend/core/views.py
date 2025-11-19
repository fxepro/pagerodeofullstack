"""
Views for system monitoring and log viewing
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from pathlib import Path
import os
from django.conf import settings
from django.db import connection
from django.contrib.auth import authenticate
from users.models import UserProfile

# Get logs directory
BASE_DIR = Path(__file__).resolve().parent.parent
LOGS_DIR = BASE_DIR / 'logs'


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Simple health check endpoint for load balancers and monitoring tools.
    No authentication required.
    
    Returns:
        Simple health status response
    """
    try:
        # Check database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        return Response({
            'status': 'healthy',
            'service': 'PageRodeo Backend',
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'status': 'unhealthy',
            'service': 'PageRodeo Backend',
            'error': str(e),
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom token serializer that includes email_verified status"""
    
    def validate(self, attrs):
        # Authenticate user with username/password only
        authenticate_kwargs = {
            self.username_field: attrs[self.username_field],
            'password': attrs['password'],
        }
        
        user = authenticate(**authenticate_kwargs)
        
        if not user:
            raise AuthenticationFailed('No active account found with the given credentials')
        
        self.user = user
        
        # Generate JWT tokens (standard flow)
        refresh = self.get_token(self.user)
        
        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
        
        # Get email_verified status directly from database
        # Use get() with default to avoid exceptions and ensure we read actual DB value
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            # Direct database query to get the actual value
            profile = UserProfile.objects.filter(user=self.user).first()
            if profile:
                # Profile exists - use the actual database value
                data['email_verified'] = profile.email_verified
                logger.debug(f"User {self.user.username}: email_verified={profile.email_verified} from database")
            else:
                # No profile exists - for old accounts, default to True for backward compatibility
                data['email_verified'] = True
                logger.debug(f"User {self.user.username}: No profile found, defaulting email_verified=True")
        except Exception as e:
            # If anything goes wrong, log the error but default to True for backward compatibility
            logger.error(f"Error accessing UserProfile for {self.user.username}: {str(e)}", exc_info=True)
            data['email_verified'] = True
        
        # 2FA is not implemented - always return False
        data['two_factor_enabled'] = False
        
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom token obtain view that includes email_verified status"""
    serializer_class = CustomTokenObtainPairSerializer


@api_view(['GET'])
@permission_classes([IsAdminUser])
def view_logs(request, log_type='app'):
    """
    View recent log entries from a specific log file
    
    Args:
        log_type: Type of log file (app, error, requests, jobs, performance)
        lines: Number of lines to return (default: 100, max: 1000)
    
    Returns:
        Recent log entries from the specified log file
    """
    lines = int(request.query_params.get('lines', 100))
    lines = min(lines, 1000)  # Max 1000 lines
    
    # Map log types to file names
    log_files = {
        'app': 'app.log',
        'error': 'error.log',
        'requests': 'requests.log',
        'jobs': 'jobs.log',
        'performance': 'performance.log',
    }
    
    if log_type not in log_files:
        return Response(
            {'error': f'Invalid log type. Valid types: {", ".join(log_files.keys())}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    log_file = LOGS_DIR / log_files[log_type]
    
    if not log_file.exists():
        return Response(
            {'error': f'Log file not found: {log_files[log_type]}'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        # Read last N lines from log file
        with open(log_file, 'r', encoding='utf-8') as f:
            all_lines = f.readlines()
            recent_lines = all_lines[-lines:] if len(all_lines) > lines else all_lines
        
        return Response({
            'log_type': log_type,
            'log_file': log_files[log_type],
            'total_lines': len(all_lines),
            'returned_lines': len(recent_lines),
            'lines': recent_lines,
        })
    except Exception as e:
        return Response(
            {'error': f'Failed to read log file: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def log_files_list(request):
    """
    List available log files with their sizes
    
    Returns:
        List of available log files with metadata
    """
    log_files = {
        'app': 'app.log',
        'error': 'error.log',
        'requests': 'requests.log',
        'jobs': 'jobs.log',
        'performance': 'performance.log',
    }
    
    files_info = []
    for log_type, filename in log_files.items():
        log_file = LOGS_DIR / filename
        if log_file.exists():
            file_size = log_file.stat().st_size
            file_size_mb = file_size / (1024 * 1024)
            files_info.append({
                'type': log_type,
                'filename': filename,
                'size_bytes': file_size,
                'size_mb': round(file_size_mb, 2),
                'exists': True,
            })
        else:
            files_info.append({
                'type': log_type,
                'filename': filename,
                'size_bytes': 0,
                'size_mb': 0,
                'exists': False,
            })
    
    return Response({
        'log_files': files_info,
        'logs_directory': str(LOGS_DIR),
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def system_status(request):
    """
    Get system status including monitoring metrics
    
    Returns:
        System status with monitoring metrics
    """
    from core.monitoring import job_monitor, theme_monitor
    
    # Get running jobs
    running_jobs = job_monitor.get_running_jobs()
    
    # Get failed jobs (last 24 hours)
    from datetime import datetime, timedelta
    since = datetime.now() - timedelta(hours=24)
    failed_jobs = job_monitor.get_failed_jobs(since=since)
    
    # Check theme degradation
    is_degraded = theme_monitor.check_degradation(threshold=5, window_minutes=60)
    
    # Get log files status
    log_files = {
        'app': 'app.log',
        'error': 'error.log',
        'requests': 'requests.log',
        'jobs': 'jobs.log',
        'performance': 'performance.log',
    }
    
    log_files_status = {}
    for log_type, filename in log_files.items():
        log_file = LOGS_DIR / filename
        if log_file.exists():
            file_size = log_file.stat().st_size
            log_files_status[log_type] = {
                'exists': True,
                'size_mb': round(file_size / (1024 * 1024), 2),
            }
        else:
            log_files_status[log_type] = {
                'exists': False,
                'size_mb': 0,
            }
    
    return Response({
        'status': 'healthy',
        'monitoring': {
            'running_jobs': len(running_jobs),
            'failed_jobs_24h': len(failed_jobs),
            'theme_degraded': is_degraded,
            'log_files': log_files_status,
        },
        'jobs': {
            'running': list(running_jobs.values()),
            'failed_recent': [
                {
                    'job_id': job['job_id'],
                    'job_type': job['job_type'],
                    'error': job.get('error', ''),
                    'duration': job.get('duration', 0),
                }
                for job in failed_jobs[:10]  # Last 10 failed jobs
            ],
        },
    })

