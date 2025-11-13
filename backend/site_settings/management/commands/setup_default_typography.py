from django.core.management.base import BaseCommand
from site_settings.models import TypographyPreset, SiteConfig


class Command(BaseCommand):
    help = 'Setup default typography presets'

    def handle(self, *args, **options):
        self.stdout.write('Setting up default typography presets...')
        
        # Preset 1: Compact (smaller fonts for dense layouts)
        compact, created = TypographyPreset.objects.get_or_create(
            name='Compact',
            defaults={
                'description': 'Smaller fonts for information-dense interfaces',
                'body_font': 'Roboto, sans-serif',
                'heading_font': 'Roboto, sans-serif',
                'font_size_base': '14px',
                'font_size_h1': '40px',
                'font_size_h2': '32px',
                'font_size_h3': '26px',
                'font_size_h4': '20px',
                'font_size_h5': '18px',
                'font_size_h6': '16px',
                'line_height_base': '1.5',
                'is_active': False,
                'is_system': True,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'✓ Created preset: {compact.name}'))
        else:
            self.stdout.write(self.style.WARNING(f'○ Preset already exists: {compact.name}'))
        
        # Preset 2: Comfortable (default, balanced sizing)
        comfortable, created = TypographyPreset.objects.get_or_create(
            name='Comfortable',
            defaults={
                'description': 'Balanced typography for optimal readability',
                'body_font': 'Open Sans, sans-serif',
                'heading_font': 'Montserrat, sans-serif',
                'font_size_base': '16px',
                'font_size_h1': '48px',
                'font_size_h2': '36px',
                'font_size_h3': '30px',
                'font_size_h4': '24px',
                'font_size_h5': '20px',
                'font_size_h6': '18px',
                'line_height_base': '1.6',
                'is_active': True,  # Set as default active
                'is_system': True,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'✓ Created preset: {comfortable.name}'))
            # Set as active if it's the first preset
            if not TypographyPreset.objects.filter(is_active=True).exclude(pk=comfortable.pk).exists():
                comfortable.is_active = True
                comfortable.save()
                self.stdout.write(self.style.SUCCESS(f'  ⚡ Activated: {comfortable.name}'))
        else:
            self.stdout.write(self.style.WARNING(f'○ Preset already exists: {comfortable.name}'))
        
        # Preset 3: Large (bigger fonts for accessibility)
        large, created = TypographyPreset.objects.get_or_create(
            name='Large',
            defaults={
                'description': 'Larger fonts for better accessibility and readability',
                'body_font': 'Noto Sans, sans-serif',
                'heading_font': 'Poppins, sans-serif',
                'font_size_base': '18px',
                'font_size_h1': '56px',
                'font_size_h2': '42px',
                'font_size_h3': '34px',
                'font_size_h4': '28px',
                'font_size_h5': '22px',
                'font_size_h6': '20px',
                'line_height_base': '1.7',
                'is_active': False,
                'is_system': True,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'✓ Created preset: {large.name}'))
        else:
            self.stdout.write(self.style.WARNING(f'○ Preset already exists: {large.name}'))
        
        # Preset 4: Editorial (serif fonts for reading-heavy content)
        editorial, created = TypographyPreset.objects.get_or_create(
            name='Editorial',
            defaults={
                'description': 'Serif fonts for elegant, reading-focused experiences',
                'body_font': 'Lora, serif',
                'heading_font': 'Playfair Display, serif',
                'font_size_base': '17px',
                'font_size_h1': '52px',
                'font_size_h2': '38px',
                'font_size_h3': '32px',
                'font_size_h4': '26px',
                'font_size_h5': '21px',
                'font_size_h6': '19px',
                'line_height_base': '1.7',
                'is_active': False,
                'is_system': True,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'✓ Created preset: {editorial.name}'))
        else:
            self.stdout.write(self.style.WARNING(f'○ Preset already exists: {editorial.name}'))
        
        # Ensure site config exists and points to active typography
        config = SiteConfig.get_config()
        active_typography = TypographyPreset.objects.filter(is_active=True).first()
        if active_typography:
            config.active_typography = active_typography
            config.save()
            self.stdout.write(self.style.SUCCESS(f'\n✓ Site config updated with active typography: {active_typography.name}'))
        
        self.stdout.write(self.style.SUCCESS('\n✅ Default typography presets setup complete!'))
        self.stdout.write(self.style.SUCCESS(f'Total presets: {TypographyPreset.objects.count()}'))
        self.stdout.write(self.style.SUCCESS(f'Active preset: {active_typography.name if active_typography else "None"}'))

