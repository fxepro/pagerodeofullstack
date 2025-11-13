from django.core.management.base import BaseCommand
from site_settings.models import ThemePalette, SiteConfig


class Command(BaseCommand):
    help = 'Setup default theme palettes'

    def handle(self, *args, **options):
        self.stdout.write('Setting up default theme palettes...')
        
        # Create the new Blue palette from user's requirement
        blue_palette, created = ThemePalette.objects.get_or_create(
            name='Ocean Blue',
            defaults={
                'description': 'Professional blue theme with ocean-inspired accents',
                'primary_color': '#0086ad',
                'secondary_color': '#005582',
                'accent_1': '#00c2c7',
                'accent_2': '#97ebdb',
                'accent_3': '#daf8e3',
                'is_active': False,
                'is_system': True,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'✓ Created palette: {blue_palette.name}'))
        else:
            self.stdout.write(self.style.WARNING(f'○ Palette already exists: {blue_palette.name}'))
        
        # Create default purple palette (current design)
        purple_palette, created = ThemePalette.objects.get_or_create(
            name='Purple Professional',
            defaults={
                'description': 'Current purple-based professional theme',
                'primary_color': '#9333ea',
                'secondary_color': '#7c3aed',
                'accent_1': '#a855f7',
                'accent_2': '#c084fc',
                'accent_3': '#e9d5ff',
                'is_active': True,  # Set as active by default
                'is_system': True,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'✓ Created palette: {purple_palette.name}'))
            # Set as active if it's the first palette
            if not ThemePalette.objects.filter(is_active=True).exists():
                purple_palette.is_active = True
                purple_palette.save()
                self.stdout.write(self.style.SUCCESS(f'  ⚡ Activated: {purple_palette.name}'))
        else:
            self.stdout.write(self.style.WARNING(f'○ Palette already exists: {purple_palette.name}'))
        
        # Create a green palette option
        green_palette, created = ThemePalette.objects.get_or_create(
            name='Forest Green',
            defaults={
                'description': 'Nature-inspired green theme',
                'primary_color': '#059669',
                'secondary_color': '#047857',
                'accent_1': '#10b981',
                'accent_2': '#6ee7b7',
                'accent_3': '#d1fae5',
                'is_active': False,
                'is_system': True,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'✓ Created palette: {green_palette.name}'))
        else:
            self.stdout.write(self.style.WARNING(f'○ Palette already exists: {green_palette.name}'))
        
        # Create a slate/neutral palette
        slate_palette, created = ThemePalette.objects.get_or_create(
            name='Professional Slate',
            defaults={
                'description': 'Neutral slate theme for corporate environments',
                'primary_color': '#475569',
                'secondary_color': '#334155',
                'accent_1': '#64748b',
                'accent_2': '#94a3b8',
                'accent_3': '#e2e8f0',
                'is_active': False,
                'is_system': True,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'✓ Created palette: {slate_palette.name}'))
        else:
            self.stdout.write(self.style.WARNING(f'○ Palette already exists: {slate_palette.name}'))
        
        # Ensure site config exists and points to active palette
        config = SiteConfig.get_config()
        active_palette = ThemePalette.objects.filter(is_active=True).first()
        if active_palette:
            config.active_palette = active_palette
            config.save()
            self.stdout.write(self.style.SUCCESS(f'\n✓ Site config updated with active palette: {active_palette.name}'))
        
        self.stdout.write(self.style.SUCCESS('\n✅ Default palette setup complete!'))
        self.stdout.write(self.style.SUCCESS(f'Total palettes: {ThemePalette.objects.count()}'))
        self.stdout.write(self.style.SUCCESS(f'Active palette: {active_palette.name if active_palette else "None"}'))

