"""
Management command to cleanup old log files
Run this periodically (e.g., via cron) to remove logs older than retention period
"""
from django.core.management.base import BaseCommand
from core.logging_config import cleanup_old_logs


class Command(BaseCommand):
    help = 'Cleanup old log files based on retention policy'

    def handle(self, *args, **options):
        """Cleanup old log files"""
        self.stdout.write('Starting log cleanup...')
        cleanup_old_logs()
        self.stdout.write(self.style.SUCCESS('Log cleanup completed successfully'))

