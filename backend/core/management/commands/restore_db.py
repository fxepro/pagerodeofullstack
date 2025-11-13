"""
Django management command for database restore
"""
from django.core.management.base import BaseCommand
from django.conf import settings
import subprocess
import os
from pathlib import Path


class Command(BaseCommand):
    help = 'Restore the database from backup'

    def add_arguments(self, parser):
        parser.add_argument(
            'backup_file',
            type=str,
            help='Path to backup file'
        )
        parser.add_argument(
            '--no-confirm',
            action='store_true',
            help='Skip confirmation prompt'
        )

    def handle(self, *args, **options):
        backup_file = options['backup_file']
        no_confirm = options['no_confirm']
        
        # Check if backup file exists
        if not os.path.exists(backup_file):
            self.stderr.write(
                self.style.ERROR(f'Error: Backup file not found: {backup_file}')
            )
            return
        
        # Get database settings
        db_settings = settings.DATABASES['default']
        db_name = db_settings['NAME']
        db_user = db_settings['USER']
        db_host = db_settings['HOST']
        db_port = db_settings['PORT']
        db_password = db_settings['PASSWORD']
        
        # Confirm restore
        if not no_confirm:
            self.stdout.write(
                self.style.WARNING(
                    '⚠️  WARNING: This will restore the database from backup!'
                )
            )
            self.stdout.write(f'Database: {db_name}')
            self.stdout.write(f'Host: {db_host}:{db_port}')
            self.stdout.write(f'Backup file: {backup_file}')
            self.stdout.write('')
            
            confirm = input('Are you sure you want to continue? (yes/no): ')
            if confirm.lower() != 'yes':
                self.stdout.write(self.style.WARNING('Restore cancelled.'))
                return
        
        # Set PGPASSWORD environment variable
        env = os.environ.copy()
        env['PGPASSWORD'] = db_password
        
        # Drop existing database connections
        self.stdout.write('Dropping existing database connections...')
        try:
            drop_conn_cmd = [
                'psql',
                '-h', db_host,
                '-p', str(db_port),
                '-U', db_user,
                '-d', 'postgres',
                '-c', f"SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '{db_name}' AND pid <> pg_backend_pid();"
            ]
            subprocess.run(
                drop_conn_cmd,
                env=env,
                capture_output=True,
                text=True
            )
        except Exception as e:
            self.stderr.write(
                self.style.WARNING(f'Warning: Could not drop connections: {e}')
            )
        
        # Determine backup format from file extension
        backup_ext = Path(backup_file).suffix
        if backup_ext == '.dump' or backup_ext == '.custom':
            format_flag = '-Fc'
        elif backup_ext == '.sql':
            format_flag = '-Fp'
        elif backup_ext == '.tar':
            format_flag = '-Ft'
        else:
            # Try to detect format
            format_flag = '-Fc'  # Default to custom format
        
        # Run pg_restore
        try:
            self.stdout.write('Restoring database from backup...')
            
            cmd = [
                'pg_restore',
                '-h', db_host,
                '-p', str(db_port),
                '-U', db_user,
                '-d', db_name,
                '--clean',
                '--if-exists',
                backup_file
            ]
            
            result = subprocess.run(
                cmd,
                env=env,
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✅ Database restored successfully from: {backup_file}'
                    )
                )
            else:
                self.stderr.write(
                    self.style.ERROR(f'❌ Restore failed: {result.stderr}')
                )
                return
        
        except Exception as e:
            self.stderr.write(
                self.style.ERROR(f'❌ Error during restore: {e}')
            )
            return

