"""
Django management command to run monitoring checks manually (without Celery).

Usage:
    python manage.py run_monitoring_check
    python manage.py run_monitoring_check --sites-only
    python manage.py run_monitoring_check --pages-only
"""

from django.core.management.base import BaseCommand
from monitoring.tasks import check_monitored_sites, check_discovered_pages


class Command(BaseCommand):
    help = 'Run monitoring checks manually (useful when Celery is not running)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--sites-only',
            action='store_true',
            help='Only check monitored sites',
        )
        parser.add_argument(
            '--pages-only',
            action='store_true',
            help='Only check discovered pages',
        )

    def handle(self, *args, **options):
        sites_only = options['sites_only']
        pages_only = options['pages_only']
        
        if pages_only:
            # Only check pages
            self.stdout.write('Running page checks...')
            result = check_discovered_pages()
            if isinstance(result, dict) and result.get('status') == 'success':
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✅ Pages checked: {result.get("pages_checked", 0)} '
                        f'(OK: {result.get("pages_ok", 0)}, Errors: {result.get("pages_error", 0)})'
                    )
                )
            else:
                self.stdout.write(self.style.SUCCESS('✅ Page checks completed'))
        
        elif sites_only:
            # Only check sites
            self.stdout.write('Running site checks...')
            result = check_monitored_sites()
            if isinstance(result, dict) and result.get('status') == 'success':
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✅ Sites checked: {result.get("sites_checked", 0)} '
                        f'(Up: {result.get("sites_up", 0)}, Down: {result.get("sites_down", 0)})'
                    )
                )
                if result.get('incidents_created', 0) > 0:
                    self.stdout.write(
                        self.style.WARNING(f'⚠️  {result.get("incidents_created", 0)} new incidents created')
                    )
                if result.get('incidents_resolved', 0) > 0:
                    self.stdout.write(
                        self.style.SUCCESS(f'✅ {result.get("incidents_resolved", 0)} incidents resolved')
                    )
            else:
                self.stdout.write(self.style.SUCCESS('✅ Site checks completed'))
        
        else:
            # Check both
            self.stdout.write('Running site checks...')
            result = check_monitored_sites()
            if isinstance(result, dict) and result.get('status') == 'success':
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✅ Sites checked: {result.get("sites_checked", 0)} '
                        f'(Up: {result.get("sites_up", 0)}, Down: {result.get("sites_down", 0)})'
                    )
                )
            else:
                self.stdout.write(self.style.SUCCESS('✅ Site checks completed'))
            
            self.stdout.write('')
            self.stdout.write('Running page checks...')
            result = check_discovered_pages()
            if isinstance(result, dict) and result.get('status') == 'success':
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✅ Pages checked: {result.get("pages_checked", 0)} '
                        f'(OK: {result.get("pages_ok", 0)}, Errors: {result.get("pages_error", 0)})'
                    )
                )
            else:
                self.stdout.write(self.style.SUCCESS('✅ Page checks completed'))
        
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('✅ All checks completed!'))

