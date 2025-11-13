"""
Monitoring utilities for background jobs, palette/theme degradation, and alerts
"""
import logging
import time
from typing import Dict, Optional, Any
from datetime import datetime, timedelta

# Get loggers
job_logger = logging.getLogger('pagerodeo.jobs')
theme_logger = logging.getLogger('pagerodeo.theme')

# PostHog integration for alerting
try:
    from core.posthog_config import capture_event
except ImportError:
    capture_event = lambda *args, **kwargs: None


class BackgroundJobMonitor:
    """
    Monitor background jobs (audit pipeline, PDF generation, etc.)
    Tracks job execution, failures, and performance metrics
    """
    
    def __init__(self):
        self.jobs = {}
        self.job_history = []
    
    def start_job(self, job_id: str, job_type: str, metadata: Optional[Dict[str, Any]] = None):
        """
        Start monitoring a background job
        
        Args:
            job_id: Unique identifier for the job
            job_type: Type of job (e.g., 'audit_pipeline', 'pdf_generation')
            metadata: Additional metadata about the job
        """
        self.jobs[job_id] = {
            'job_id': job_id,
            'job_type': job_type,
            'start_time': time.time(),
            'status': 'running',
            'metadata': metadata or {},
        }
        
        job_logger.info(
            f'Job started: {job_id} ({job_type})',
            extra={
                'job_id': job_id,
                'job_type': job_type,
                'metadata': metadata or {},
            }
        )
        
        # Track job start in PostHog
        capture_event(
            distinct_id='system',
            event='background_job_started',
            properties={
                'job_id': job_id,
                'job_type': job_type,
                'metadata': metadata or {},
            }
        )
    
    def complete_job(self, job_id: str, result: Optional[Dict[str, Any]] = None):
        """
        Mark a job as completed
        
        Args:
            job_id: Unique identifier for the job
            result: Job result data
        """
        if job_id not in self.jobs:
            job_logger.warning(f'Job not found: {job_id}')
            return
        
        job = self.jobs[job_id]
        duration = time.time() - job['start_time']
        
        job['status'] = 'completed'
        job['end_time'] = time.time()
        job['duration'] = duration
        job['result'] = result or {}
        
        job_logger.info(
            f'Job completed: {job_id} ({job["job_type"]}) in {duration:.2f}s',
            extra={
                'job_id': job_id,
                'job_type': job['job_type'],
                'duration': duration,
                'result': result or {},
            }
        )
        
        # Track job completion in PostHog
        capture_event(
            distinct_id='system',
            event='background_job_completed',
            properties={
                'job_id': job_id,
                'job_type': job['job_type'],
                'duration_ms': round(duration * 1000, 2),
                'result': result or {},
            }
        )
        
        # Move to history
        self.job_history.append(job)
        del self.jobs[job_id]
    
    def fail_job(self, job_id: str, error: Exception, error_message: Optional[str] = None):
        """
        Mark a job as failed
        
        Args:
            job_id: Unique identifier for the job
            error: Exception that caused the failure
            error_message: Additional error message
        """
        if job_id not in self.jobs:
            job_logger.warning(f'Job not found: {job_id}')
            return
        
        job = self.jobs[job_id]
        duration = time.time() - job['start_time']
        
        job['status'] = 'failed'
        job['end_time'] = time.time()
        job['duration'] = duration
        job['error'] = str(error)
        job['error_message'] = error_message
        
        job_logger.error(
            f'Job failed: {job_id} ({job["job_type"]}) after {duration:.2f}s: {error}',
            extra={
                'job_id': job_id,
                'job_type': job['job_type'],
                'duration': duration,
                'error': str(error),
                'error_message': error_message,
            }
        )
        
        # Alert on job failure via PostHog
        capture_event(
            distinct_id='system',
            event='background_job_failed',
            properties={
                'job_id': job_id,
                'job_type': job['job_type'],
                'duration_ms': round(duration * 1000, 2),
                'error': str(error),
                'error_message': error_message,
                'metadata': job.get('metadata', {}),
            }
        )
        
        # Move to history
        self.job_history.append(job)
        del self.jobs[job_id]
    
    def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get current status of a job"""
        return self.jobs.get(job_id)
    
    def get_running_jobs(self) -> Dict[str, Dict[str, Any]]:
        """Get all currently running jobs"""
        return {job_id: job for job_id, job in self.jobs.items() if job['status'] == 'running'}
    
    def get_failed_jobs(self, since: Optional[datetime] = None) -> list:
        """Get all failed jobs, optionally filtered by time"""
        failed_jobs = [job for job in self.job_history if job['status'] == 'failed']
        
        if since:
            cutoff_time = since.timestamp()
            failed_jobs = [job for job in failed_jobs if job.get('end_time', 0) >= cutoff_time]
        
        return failed_jobs


class ThemeDegradationMonitor:
    """
    Monitor palette/theme system for degradation and failures
    Alerts on theme loading failures, palette activation errors, etc.
    """
    
    def __init__(self):
        self.theme_events = []
        self.failure_count = 0
        self.last_failure_time = None
    
    def log_theme_load(self, palette_id: str, success: bool, error: Optional[str] = None):
        """
        Log theme/palette load event
        
        Args:
            palette_id: Identifier of the palette
            success: Whether the load was successful
            error: Error message if load failed
        """
        event = {
            'palette_id': palette_id,
            'success': success,
            'error': error,
            'timestamp': time.time(),
        }
        
        self.theme_events.append(event)
        
        if success:
            theme_logger.info(
                f'Theme loaded successfully: {palette_id}',
                extra=event
            )
        else:
            self.failure_count += 1
            self.last_failure_time = time.time()
            
            theme_logger.error(
                f'Theme load failed: {palette_id}: {error}',
                extra=event
            )
            
            # Alert on theme degradation via PostHog
            capture_event(
                distinct_id='system',
                event='theme_degradation',
                properties={
                    'palette_id': palette_id,
                    'error': error,
                    'failure_count': self.failure_count,
                }
            )
    
    def log_palette_activation(self, palette_id: str, success: bool, error: Optional[str] = None):
        """
        Log palette activation event
        
        Args:
            palette_id: Identifier of the palette
            success: Whether activation was successful
            error: Error message if activation failed
        """
        event = {
            'palette_id': palette_id,
            'event_type': 'activation',
            'success': success,
            'error': error,
            'timestamp': time.time(),
        }
        
        self.theme_events.append(event)
        
        if success:
            theme_logger.info(
                f'Palette activated successfully: {palette_id}',
                extra=event
            )
        else:
            self.failure_count += 1
            self.last_failure_time = time.time()
            
            theme_logger.error(
                f'Palette activation failed: {palette_id}: {error}',
                extra=event
            )
            
            # Alert on palette activation failure via PostHog
            capture_event(
                distinct_id='system',
                event='palette_activation_failed',
                properties={
                    'palette_id': palette_id,
                    'error': error,
                    'failure_count': self.failure_count,
                }
            )
    
    def check_degradation(self, threshold: int = 5, window_minutes: int = 60) -> bool:
        """
        Check if theme system is degraded
        
        Args:
            threshold: Number of failures to trigger degradation alert
            window_minutes: Time window in minutes to check for failures
            
        Returns:
            True if degraded, False otherwise
        """
        cutoff_time = time.time() - (window_minutes * 60)
        recent_failures = [
            event for event in self.theme_events
            if not event.get('success', True) and event.get('timestamp', 0) >= cutoff_time
        ]
        
        if len(recent_failures) >= threshold:
            theme_logger.warning(
                f'Theme system degraded: {len(recent_failures)} failures in last {window_minutes} minutes',
                extra={
                    'failure_count': len(recent_failures),
                    'window_minutes': window_minutes,
                }
            )
            
            # Alert on theme degradation via PostHog
            capture_event(
                distinct_id='system',
                event='theme_system_degraded',
                properties={
                    'failure_count': len(recent_failures),
                    'window_minutes': window_minutes,
                    'threshold': threshold,
                }
            )
            
            return True
        
        return False


# Global instances
job_monitor = BackgroundJobMonitor()
theme_monitor = ThemeDegradationMonitor()

