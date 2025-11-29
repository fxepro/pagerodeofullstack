"""
Django management command to clean up old monitoring data.

Usage:
    python manage.py cleanup_monitoring_data
    python manage.py cleanup_monitoring_data --days 30
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from monitoring.models import StatusCheck, LinkCheck, Incident


class Command(BaseCommand):
    help = 'Clean up old monitoring data (StatusCheck and LinkCheck records older than specified days)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Number of days to keep (default: 30)',
        )
        parser.add_argument(
            '--resolve-old-incidents',
            action='store_true',
            help='Resolve ongoing incidents older than 7 days',
        )

    def handle(self, *args, **options):
        days = options['days']
        resolve_incidents = options['resolve_old_incidents']
        
        cutoff_date = timezone.now() - timedelta(days=days)
        
        self.stdout.write(f"Cleaning up monitoring data older than {days} days (before {cutoff_date.date()})...")
        
        # Delete old StatusCheck records
        deleted_checks = StatusCheck.objects.filter(checked_at__lt=cutoff_date).count()
        if deleted_checks > 0:
            StatusCheck.objects.filter(checked_at__lt=cutoff_date).delete()
            self.stdout.write(
                self.style.SUCCESS(f'Deleted {deleted_checks} old StatusCheck records')
            )
        else:
            self.stdout.write('No old StatusCheck records to delete')
        
        # Delete old LinkCheck records
        deleted_link_checks = LinkCheck.objects.filter(checked_at__lt=cutoff_date).count()
        if deleted_link_checks > 0:
            LinkCheck.objects.filter(checked_at__lt=cutoff_date).delete()
            self.stdout.write(
                self.style.SUCCESS(f'Deleted {deleted_link_checks} old LinkCheck records')
            )
        else:
            self.stdout.write('No old LinkCheck records to delete')
        
        # Resolve old ongoing incidents (if requested)
        if resolve_incidents:
            old_cutoff = timezone.now() - timedelta(days=7)
            resolved_count = Incident.objects.filter(
                status='ongoing',
                started_at__lt=old_cutoff
            ).count()
            
            if resolved_count > 0:
                Incident.objects.filter(
                    status='ongoing',
                    started_at__lt=old_cutoff
                ).update(
                    status='resolved',
                    resolved_at=timezone.now()
                )
                self.stdout.write(
                    self.style.SUCCESS(f'Resolved {resolved_count} old ongoing incidents')
                )
            else:
                self.stdout.write('No old ongoing incidents to resolve')
        
        self.stdout.write(self.style.SUCCESS('Cleanup completed successfully!'))

