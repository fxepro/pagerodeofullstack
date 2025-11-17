"""
Django management command to verify email for all existing users.
This is useful for migrating users created before email verification was implemented.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from users.models import UserProfile


class Command(BaseCommand):
    help = 'Set email_verified=True for all existing users (migration script)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be updated without making changes',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force update even if email_verified is already True',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        force = options['force']
        
        # Get all users
        users = User.objects.all()
        total_users = users.count()
        
        self.stdout.write(f'Found {total_users} users in database')
        
        updated_count = 0
        already_verified_count = 0
        no_profile_count = 0
        
        for user in users:
            try:
                profile = user.profile
            except UserProfile.DoesNotExist:
                # Create profile if it doesn't exist
                if not dry_run:
                    profile = UserProfile.objects.create(
                        user=user,
                        role='viewer',
                        email_verified=False
                    )
                    self.stdout.write(f'Created profile for user: {user.username}')
                else:
                    self.stdout.write(f'Would create profile for user: {user.username}')
                    no_profile_count += 1
                    continue
            
            # Check if already verified
            if profile.email_verified and not force:
                already_verified_count += 1
                continue
            
            # Update email_verified
            if not dry_run:
                profile.email_verified = True
                profile.save(update_fields=['email_verified'])
                updated_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Verified email for: {user.username} ({user.email})')
                )
            else:
                updated_count += 1
                self.stdout.write(
                    f'Would verify email for: {user.username} ({user.email})'
                )
        
        # Summary
        self.stdout.write('\n' + '='*60)
        self.stdout.write('SUMMARY:')
        self.stdout.write(f'  Total users: {total_users}')
        if not dry_run:
            self.stdout.write(
                self.style.SUCCESS(f'  ✓ Updated: {updated_count} users')
            )
        else:
            self.stdout.write(f'  Would update: {updated_count} users')
        self.stdout.write(f'  Already verified: {already_verified_count} users')
        if no_profile_count > 0:
            self.stdout.write(f'  No profile (would create): {no_profile_count} users')
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('\nThis was a dry run. Use without --dry-run to apply changes.')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS('\n✓ All existing users have been verified!')
            )

