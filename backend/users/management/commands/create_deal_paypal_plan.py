"""
Django management command to create PayPal billing plan for a promotional deal.

Usage:
    python manage.py create_deal_paypal_plan <deal_slug>
    
Example:
    python manage.py create_deal_paypal_plan analyst-annual-2025
"""

import os
import sys
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from users.models import PromotionalDeal, SubscriptionPlan
from users.paypal_service import PayPalService
import json


class Command(BaseCommand):
    help = 'Create PayPal billing plan for a promotional deal'

    def add_arguments(self, parser):
        parser.add_argument(
            'deal_slug',
            type=str,
            help='Slug of the promotional deal'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be created without actually creating it'
        )

    def handle(self, *args, **options):
        deal_slug = options['deal_slug']
        dry_run = options['dry_run']

        try:
            deal = PromotionalDeal.objects.select_related('base_plan').get(slug=deal_slug)
        except PromotionalDeal.DoesNotExist:
            raise CommandError(f'Deal with slug "{deal_slug}" not found')

        self.stdout.write(self.style.SUCCESS(f'\nFound deal: {deal.name}'))
        self.stdout.write(f'  Base Plan: {deal.base_plan.display_name}')
        self.stdout.write(f'  Deal Price: ${deal.deal_price}')
        self.stdout.write(f'  Billing Period: {deal.billing_period}')
        self.stdout.write(f'  Discount: {deal.discount_percentage}%')

        if deal.paypal_plan_id:
            self.stdout.write(self.style.WARNING(f'\n⚠ Deal already has PayPal plan ID: {deal.paypal_plan_id}'))
            response = input('Do you want to create a new plan? (yes/no): ')
            if response.lower() != 'yes':
                self.stdout.write(self.style.SUCCESS('Cancelled.'))
                return

        # Get PayPal product ID (use deal's product ID or base plan's product ID)
        product_id = deal.paypal_product_id or deal.base_plan.paypal_product_id
        
        if not product_id:
            self.stdout.write(self.style.ERROR('\n❌ No PayPal product ID found.'))
            self.stdout.write('   Please set paypal_product_id on the deal or base plan first.')
            return

        self.stdout.write(f'\nUsing PayPal Product ID: {product_id}')

        # Determine billing cycle
        if deal.billing_period == 'monthly':
            interval_unit = 'MONTH'
            interval_count = 1
        else:  # annual
            interval_unit = 'YEAR'
            interval_count = 1

        # Build plan payload
        plan_name = f"{deal.base_plan.display_name} - {deal.name}"
        plan_description = f"{deal.base_plan.display_name} Plan - {deal.billing_period.capitalize()} - {deal.discount_percentage}% Off"

        payload = {
            "product_id": product_id,
            "name": plan_name,
            "description": plan_description,
            "billing_cycles": [
                {
                    "frequency": {
                        "interval_unit": interval_unit,
                        "interval_count": interval_count
                    },
                    "tenure_type": "REGULAR",
                    "sequence": 1,
                    "total_cycles": 0,  # Infinite cycles
                    "pricing_scheme": {
                        "fixed_price": {
                            "value": str(deal.deal_price),
                            "currency_code": "USD"
                        }
                    }
                }
            ],
            "payment_preferences": {
                "auto_bill_outstanding": True,
                "setup_fee": {
                    "value": "0",
                    "currency_code": "USD"
                },
                "setup_fee_failure_action": "CONTINUE",
                "payment_failure_threshold": 3
            },
            "taxes": {
                "percentage": "0",
                "inclusive": False
            }
        }

        if dry_run:
            self.stdout.write(self.style.WARNING('\n🔍 DRY RUN - Would create PayPal plan:'))
            self.stdout.write(json.dumps(payload, indent=2))
            return

        # Create PayPal plan
        self.stdout.write('\n📤 Creating PayPal billing plan...')
        
        paypal_service = PayPalService()
        access_token = paypal_service.get_access_token()
        
        if not access_token:
            raise CommandError('Failed to get PayPal access token. Check your credentials.')

        mode = os.getenv('PAYPAL_MODE', 'sandbox')
        base_url = 'https://api-m.sandbox.paypal.com' if mode == 'sandbox' else 'https://api-m.paypal.com'
        url = f'{base_url}/v1/billing/plans'

        import requests
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
        }

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            
            plan_data = response.json()
            plan_id = plan_data.get('id')
            
            self.stdout.write(self.style.SUCCESS(f'\n✅ PayPal plan created successfully!'))
            self.stdout.write(f'   Plan ID: {plan_id}')
            self.stdout.write(f'   Status: {plan_data.get("status")}')
            
            # Update deal with PayPal plan ID
            deal.paypal_plan_id = plan_id
            if not deal.paypal_product_id:
                deal.paypal_product_id = product_id
            deal.save()
            
            self.stdout.write(self.style.SUCCESS(f'\n✅ Deal updated with PayPal plan ID'))
            self.stdout.write(f'   Deal: {deal.name}')
            self.stdout.write(f'   PayPal Plan ID: {deal.paypal_plan_id}')
            
        except requests.exceptions.RequestException as e:
            error_msg = str(e)
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_data = e.response.json()
                    error_msg = error_data.get('message', str(e))
                    if 'details' in error_data:
                        details = error_data['details']
                        if isinstance(details, list) and len(details) > 0:
                            error_msg += f"\n   Details: {details[0].get('description', '')}"
                except:
                    error_msg = e.response.text
            raise CommandError(f'Failed to create PayPal plan: {error_msg}')

