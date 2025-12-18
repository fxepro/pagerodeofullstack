"""
Import payment provider IDs from CSV file.

Usage:
    python manage.py import_payment_ids_from_csv docs/Financials/Pricing Plans.csv
"""

import csv
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from financials.models import SubscriptionPlan


class Command(BaseCommand):
    help = 'Import payment provider IDs from CSV file'

    def add_arguments(self, parser):
        parser.add_argument(
            'csv_file',
            type=str,
            help='Path to CSV file (relative to project root)',
        )

    def handle(self, *args, **options):
        csv_file = options['csv_file']
        
        # Get absolute path
        if not os.path.isabs(csv_file):
            # Assume relative to project root (parent of backend)
            # This file is at: backend/financials/management/commands/import_payment_ids_from_csv.py
            # Go up 4 levels to get to project root
            current_dir = os.path.dirname(os.path.abspath(__file__))
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(current_dir))))
            csv_file = os.path.join(project_root, csv_file)
        
        if not os.path.exists(csv_file):
            self.stdout.write(self.style.ERROR(f'CSV file not found: {csv_file}'))
            return
        
        self.stdout.write(self.style.SUCCESS(f'Reading CSV file: {csv_file}\n'))
        
        updated_count = 0
        not_found_count = 0
        
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                plan_name = row.get('plan_name', '').strip()
                
                if not plan_name:
                    continue
                
                # Try exact match first
                plan = None
                try:
                    plan = SubscriptionPlan.objects.get(plan_name=plan_name)
                except SubscriptionPlan.DoesNotExist:
                    # Try removing " Plan" suffix
                    if plan_name.endswith(' Plan'):
                        try:
                            plan = SubscriptionPlan.objects.get(plan_name=plan_name[:-5])
                        except SubscriptionPlan.DoesNotExist:
                            pass
                    # Try case-insensitive match
                    if not plan:
                        try:
                            plan = SubscriptionPlan.objects.get(plan_name__iexact=plan_name)
                        except (SubscriptionPlan.DoesNotExist, SubscriptionPlan.MultipleObjectsReturned):
                            pass
                
                # Prepare all plan data from CSV
                display_name = row.get('display_name', plan_name).strip() or plan_name
                description = row.get('description', '').strip()
                
                # Parse prices
                try:
                    price_monthly = float(row.get('price_monthly', '0').strip() or '0')
                except (ValueError, AttributeError):
                    price_monthly = 0
                
                try:
                    price_yearly = float(row.get('price_yearly', '0').strip() or '0')
                except (ValueError, AttributeError):
                    price_yearly = 0
                
                # Parse boolean fields
                is_active = row.get('is_active', '').strip().lower() in ('true', '1', 'yes', 't')
                is_featured = row.get('is_featured', '').strip().lower() in ('true', '1', 'yes', 't')
                
                # Parse display_order
                try:
                    display_order = int(row.get('display_order', '0').strip() or '0')
                except (ValueError, AttributeError):
                    display_order = 0
                
                role = row.get('role', '').strip()
                
                # Payment provider IDs
                paypal_plan_id_monthly = row.get('paypal_plan_id_monthly', '').strip()
                paypal_plan_id_annual = row.get('paypal_plan_id_annual', '').strip()
                paypal_product_id = row.get('paypal_product_id', '').strip()
                stripe_plan_id_monthly = row.get('stripe_plan_id_monthly', '').strip()
                stripe_plan_id_annual = row.get('stripe_plan_id_annual', '').strip()
                coinbase_plan_id_monthly = row.get('coinbase_plan_id_monthly', '').strip()
                coinbase_plan_id_annual = row.get('coinbase_plan_id_annual', '').strip()
                
                # Create or update plan
                if not plan:
                    # Create new plan
                    plan, created = SubscriptionPlan.objects.update_or_create(
                        plan_name=plan_name,
                        defaults={
                            'display_name': display_name,
                            'description': description,
                            'price_monthly': price_monthly,
                            'price_yearly': price_yearly,
                            'paypal_plan_id_monthly': paypal_plan_id_monthly or '',
                            'paypal_plan_id_annual': paypal_plan_id_annual or '',
                            'paypal_product_id': paypal_product_id or '',
                            'stripe_plan_id_monthly': stripe_plan_id_monthly or '',
                            'stripe_plan_id_annual': stripe_plan_id_annual or '',
                            'coinbase_plan_id_monthly': coinbase_plan_id_monthly or '',
                            'coinbase_plan_id_annual': coinbase_plan_id_annual or '',
                            'is_active': is_active if row.get('is_active') else True,  # Default to True if not specified
                            'is_featured': is_featured,
                            'role': role,
                            'display_order': display_order,
                        }
                    )
                    if created:
                        self.stdout.write(self.style.SUCCESS(f'✓ Created: {plan_name}'))
                        updated_count += 1
                    else:
                        self.stdout.write(self.style.WARNING(f'↻ Updated: {plan_name}'))
                        updated_count += 1
                else:
                    # Update existing plan
                    plan.display_name = display_name
                    plan.description = description
                    plan.price_monthly = price_monthly
                    plan.price_yearly = price_yearly
                    
                    if paypal_plan_id_monthly:
                        plan.paypal_plan_id_monthly = paypal_plan_id_monthly
                    if paypal_plan_id_annual:
                        plan.paypal_plan_id_annual = paypal_plan_id_annual
                    if paypal_product_id:
                        plan.paypal_product_id = paypal_product_id
                    if stripe_plan_id_monthly:
                        plan.stripe_plan_id_monthly = stripe_plan_id_monthly
                    if stripe_plan_id_annual:
                        plan.stripe_plan_id_annual = stripe_plan_id_annual
                    if coinbase_plan_id_monthly:
                        plan.coinbase_plan_id_monthly = coinbase_plan_id_monthly
                    if coinbase_plan_id_annual:
                        plan.coinbase_plan_id_annual = coinbase_plan_id_annual
                    
                    if row.get('is_active'):
                        plan.is_active = is_active
                    if row.get('is_featured'):
                        plan.is_featured = is_featured
                    if role:
                        plan.role = role
                    if row.get('display_order'):
                        plan.display_order = display_order
                    
                    plan.save()
                    self.stdout.write(self.style.SUCCESS(f'✓ Updated: {plan.plan_name}'))
                    updated_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'\n✅ Summary:'))
        self.stdout.write(f'  Updated: {updated_count}')
        self.stdout.write(f'  Not found: {not_found_count}')
        self.stdout.write(self.style.SUCCESS('\n✨ Done!\n'))

