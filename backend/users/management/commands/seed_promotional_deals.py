"""
Django management command to seed initial promotional deals.

Usage:
    python manage.py seed_promotional_deals
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from users.models import PromotionalDeal, SubscriptionPlan


class Command(BaseCommand):
    help = 'Seed initial promotional deals'

    def add_arguments(self, parser):
        parser.add_argument(
            '--update',
            action='store_true',
            help='Update existing deals instead of skipping'
        )

    def handle(self, *args, **options):
        update = options['update']
        
        # Get Analyst plan (base plan for the homepage deal)
        try:
            analyst_plan = SubscriptionPlan.objects.get(plan_name='Analyst')
        except SubscriptionPlan.DoesNotExist:
            self.stdout.write(self.style.ERROR('❌ Analyst plan not found. Please seed subscription plans first.'))
            return

        # Calculate prices
        # Homepage shows: $199/year (44% savings from $359.88)
        # Regular Analyst annual: $29.99/month * 12 = $359.88/year
        original_price = 359.88
        deal_price = 199.00
        discount_percentage = round(((original_price - deal_price) / original_price) * 100, 2)

        # Deal dates: Dec 1, 2025 - Dec 31, 2025
        start_date = timezone.make_aware(timezone.datetime(2025, 12, 1))
        end_date = timezone.make_aware(timezone.datetime(2025, 12, 31, 23, 59, 59))

        deal_data = {
            'name': 'Analyst Annual - Year End 2025',
            'slug': 'analyst-annual-2025',
            'description': 'Get the Analyst Plan at an incredible 44% discount when you subscribe annually. Perfect for teams who want advanced monitoring and insights.',
            'base_plan': analyst_plan,
            'discount_percentage': discount_percentage,
            'original_price': original_price,
            'deal_price': deal_price,
            'billing_period': 'annual',
            'start_date': start_date,
            'end_date': end_date,
            'is_active': True,
            'featured': True,
            'display_priority': 10,
            'badge_text': 'LIMITED TIME DEAL',
        }

        deal, created = PromotionalDeal.objects.get_or_create(
            slug=deal_data['slug'],
            defaults=deal_data
        )

        if created:
            self.stdout.write(self.style.SUCCESS(f'✅ Created deal: {deal.name}'))
        elif update:
            for key, value in deal_data.items():
                setattr(deal, key, value)
            deal.save()
            self.stdout.write(self.style.SUCCESS(f'✅ Updated deal: {deal.name}'))
        else:
            self.stdout.write(self.style.WARNING(f'⚠ Deal already exists: {deal.name} (use --update to modify)'))

        self.stdout.write(f'\nDeal Details:')
        self.stdout.write(f'  Name: {deal.name}')
        self.stdout.write(f'  Slug: {deal.slug}')
        self.stdout.write(f'  Base Plan: {deal.base_plan.display_name}')
        self.stdout.write(f'  Original Price: ${deal.original_price}')
        self.stdout.write(f'  Deal Price: ${deal.deal_price}')
        self.stdout.write(f'  Discount: {deal.discount_percentage}%')
        self.stdout.write(f'  Billing Period: {deal.billing_period}')
        self.stdout.write(f'  Featured: {deal.featured}')
        self.stdout.write(f'  Valid: {deal.start_date.date()} to {deal.end_date.date()}')
        
        if not deal.paypal_plan_id:
            self.stdout.write(self.style.WARNING(f'\n⚠ PayPal plan not created yet.'))
            self.stdout.write(f'   Run: python manage.py create_deal_paypal_plan {deal.slug}')

