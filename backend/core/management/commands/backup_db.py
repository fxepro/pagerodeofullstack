"""
Django management command for database backup
"""
from django.core.management.base import BaseCommand
from django.conf import settings
import subprocess
import os
from pathlib import Path
from datetime import datetime


class Command(BaseCommand):
    help = 'Backup the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--backup-dir',
            type=str,
            default='./backups',
            help='Directory to store backups'
        )
        parser.add_argument(
            '--format',
            type=str,
            choices=['custom', 'sql', 'tar'],
            default='custom',
            help='Backup format (default: custom)'
        )

    def handle(self, *args, **options):
        backup_dir = options['backup_dir']
        backup_format = options['format']
        
        # Create backup directory if it doesn't exist
        Path(backup_dir).mkdir(parents=True, exist_ok=True)
        
        # Get database settings
        db_settings = settings.DATABASES['default']
        db_name = db_settings['NAME']
        db_user = db_settings['USER']
        db_host = db_settings['HOST']
        db_port = db_settings['PORT']
        db_password = db_settings['PASSWORD']
        
        # Generate backup filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        if backup_format == 'custom':
            backup_file = os.path.join(backup_dir, f'backup_{timestamp}.dump')
            format_flag = '-Fc'
        elif backup_format == 'sql':
            backup_file = os.path.join(backup_dir, f'backup_{timestamp}.sql')
            format_flag = '-Fp'
        else:  # tar
            backup_file = os.path.join(backup_dir, f'backup_{timestamp}.tar')
            format_flag = '-Ft'
        
        # Set PGPASSWORD environment variable
        env = os.environ.copy()
        env['PGPASSWORD'] = db_password
        
        # Run pg_dump
        try:
            self.stdout.write(f'Starting database backup...')
            self.stdout.write(f'Database: {db_name}')
            self.stdout.write(f'Host: {db_host}:{db_port}')
            self.stdout.write(f'Backup file: {backup_file}')
            
            cmd = [
                'pg_dump',
                '-h', db_host,
                '-p', str(db_port),
                '-U', db_user,
                '-d', db_name,
                format_flag,
                '-f', backup_file
            ]
            
            result = subprocess.run(
                cmd,
                env=env,
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                # Get backup file size
                backup_size = os.path.getsize(backup_file) / (1024 * 1024)  # MB
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✅ Backup completed successfully: {backup_file}'
                    )
                )
                self.stdout.write(f'Backup size: {backup_size:.2f} MB')
            else:
                self.stderr.write(
                    self.style.ERROR(f'❌ Backup failed: {result.stderr}')
                )
                return
        
        except Exception as e:
            self.stderr.write(
                self.style.ERROR(f'❌ Error during backup: {e}')
            )
            return
        
        # Clean up old backups (keep last 30 days)
        self.stdout.write('Cleaning up old backups (keeping last 30 days)...')
        try:
            from datetime import timedelta
            cutoff_date = datetime.now() - timedelta(days=30)
            
            backup_path = Path(backup_dir)
            for backup_file in backup_path.glob('backup_*.*'):
                if backup_file.stat().st_mtime < cutoff_date.timestamp():
                    backup_file.unlink()
                    self.stdout.write(f'Deleted old backup: {backup_file.name}')
            
            self.stdout.write(self.style.SUCCESS('✅ Cleanup completed'))
        except Exception as e:
            self.stderr.write(
                self.style.WARNING(f'Warning: Could not clean up old backups: {e}')
            )

