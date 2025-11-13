"""
Django admin configuration for monitoring dashboard
"""
from django.contrib import admin
from django.urls import path
from django.shortcuts import render
from django.utils.html import format_html
from django.urls import reverse
from django.http import JsonResponse
from pathlib import Path as PathLib
from core.monitoring import job_monitor, theme_monitor

# Get logs directory
BASE_DIR = PathLib(__file__).resolve().parent.parent
LOGS_DIR = BASE_DIR / 'logs'


class MonitoringAdminSite(admin.AdminSite):
    """Custom admin site with monitoring dashboard"""
    site_header = 'PageRodeo Admin'
    site_title = 'PageRodeo Admin'
    index_title = 'Welcome to PageRodeo Administration'


# Create custom admin site instance (optional - can use default)
# admin_site = MonitoringAdminSite(name='admin')


def monitoring_dashboard(request):
    """Admin dashboard view for monitoring"""
    # Get system status
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
            file_size_mb = file_size / (1024 * 1024)
            log_files_status[log_type] = {
                'exists': True,
                'size_mb': round(file_size_mb, 2),
                'filename': filename,
            }
        else:
            log_files_status[log_type] = {
                'exists': False,
                'size_mb': 0,
                'filename': filename,
            }
    
    # Format running jobs for display
    running_jobs_list = []
    for job_id, job in running_jobs.items():
        start_time = job.get('start_time', 0)
        if isinstance(start_time, (int, float)):
            from datetime import datetime
            try:
                start_time_dt = datetime.fromtimestamp(start_time)
                start_time_str = start_time_dt.strftime('%Y-%m-%d %H:%M:%S')
            except:
                start_time_str = str(start_time)
        else:
            start_time_str = str(start_time)
        
        running_jobs_list.append({
            'job_id': job.get('job_id', job_id),
            'job_type': job.get('job_type', ''),
            'start_time': start_time_str,
        })
    
    # Format failed jobs for display
    failed_jobs_list = []
    for job in failed_jobs[:10]:
        duration = job.get('duration', 0)
        if isinstance(duration, (int, float)):
            duration_str = f"{duration:.2f}s"
        else:
            duration_str = str(duration)
        
        failed_jobs_list.append({
            'job_id': job.get('job_id', ''),
            'job_type': job.get('job_type', ''),
            'error': job.get('error', ''),
            'duration': duration_str,
        })
    
    context = {
        **admin.site.each_context(request),
        'title': 'Monitoring Dashboard',
        'running_jobs': len(running_jobs),
        'failed_jobs_24h': len(failed_jobs),
        'theme_degraded': is_degraded,
        'log_files': log_files_status,
        'running_jobs_list': running_jobs_list,
        'failed_jobs_list': failed_jobs_list,
    }
    
    return render(request, 'admin/monitoring_dashboard.html', context)


def view_logs_admin(request, log_type='app'):
    """Admin view for viewing logs"""
    lines = int(request.GET.get('lines', 100))
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
        from django.contrib import messages
        messages.error(request, f'Invalid log type: {log_type}')
        return admin.site.index(request)
    
    log_file = LOGS_DIR / log_files[log_type]
    
    log_lines = []
    total_lines = 0
    if log_file.exists():
        try:
            with open(log_file, 'r', encoding='utf-8') as f:
                all_lines = f.readlines()
                total_lines = len(all_lines)
                log_lines = all_lines[-lines:] if len(all_lines) > lines else all_lines
        except Exception as e:
            from django.contrib import messages
            messages.error(request, f'Failed to read log file: {str(e)}')
    
    context = {
        **admin.site.each_context(request),
        'title': f'View Logs: {log_files[log_type]}',
        'log_type': log_type,
        'log_file': log_files[log_type],
        'log_lines': log_lines,
        'total_lines': total_lines,
        'returned_lines': len(log_lines),
        'lines_requested': lines,
        'available_log_types': list(log_files.keys()),
    }
    
    return render(request, 'admin/view_logs.html', context)


def get_logs_api(request, log_type='app'):
    """API endpoint for getting logs (for AJAX)"""
    if not request.user.is_staff:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    lines = int(request.GET.get('lines', 100))
    lines = min(lines, 1000)
    
    log_files = {
        'app': 'app.log',
        'error': 'error.log',
        'requests': 'requests.log',
        'jobs': 'jobs.log',
        'performance': 'performance.log',
    }
    
    if log_type not in log_files:
        return JsonResponse({'error': 'Invalid log type'}, status=400)
    
    log_file = LOGS_DIR / log_files[log_type]
    
    if not log_file.exists():
        return JsonResponse({'error': 'Log file not found'}, status=404)
    
    try:
        with open(log_file, 'r', encoding='utf-8') as f:
            all_lines = f.readlines()
            recent_lines = all_lines[-lines:] if len(all_lines) > lines else all_lines
        
        return JsonResponse({
            'log_type': log_type,
            'log_file': log_files[log_type],
            'total_lines': len(all_lines),
            'returned_lines': len(recent_lines),
            'lines': recent_lines,
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def get_status_api(request):
    """API endpoint for getting system status (for AJAX)"""
    if not request.user.is_staff:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    running_jobs = job_monitor.get_running_jobs()
    
    from datetime import datetime, timedelta
    since = datetime.now() - timedelta(hours=24)
    failed_jobs = job_monitor.get_failed_jobs(since=since)
    
    is_degraded = theme_monitor.check_degradation(threshold=5, window_minutes=60)
    
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
    
    return JsonResponse({
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
                for job in failed_jobs[:10]
            ],
        },
    })


# Store original get_urls method
_original_get_urls = admin.site.get_urls


# Override admin site get_urls to add monitoring URLs
def get_admin_urls():
    """Get admin URLs with monitoring dashboard"""
    # Get original URLs
    urls = _original_get_urls()
    
    # Add monitoring URLs at the beginning (BEFORE catch-all pattern)
    monitoring_urls = [
        path('monitoring/', admin.site.admin_view(monitoring_dashboard), name='monitoring_dashboard'),
        path('monitoring/logs/<str:log_type>/', admin.site.admin_view(view_logs_admin), name='view_logs_admin'),
        path('monitoring/api/logs/<str:log_type>/', admin.site.admin_view(get_logs_api), name='get_logs_api'),
        path('monitoring/api/status/', admin.site.admin_view(get_status_api), name='get_status_api'),
    ]
    
    # Debug: Print when URLs are being generated
    import sys
    if 'runserver' in sys.argv or 'test' in sys.argv:
        print(f"[Admin URLs] Adding {len(monitoring_urls)} monitoring URLs")
        for url in monitoring_urls:
            print(f"  - {url.pattern}")
    
    # Return monitoring URLs first, then original URLs
    # This ensures monitoring URLs are matched before Django's catch-all pattern
    return monitoring_urls + urls


# Override admin site get_urls
admin.site.get_urls = get_admin_urls
print("[Admin] Custom admin URLs override registered")

