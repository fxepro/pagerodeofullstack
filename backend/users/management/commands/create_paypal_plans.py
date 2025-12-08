"""
Django management command to create PayPal products and billing plans.

Usage:
    python manage.py create_paypal_plans
"""

import os
import requests
import base64
from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    help = 'Create PayPal products and billing plans for all subscription tiers'

    def __init__(self):
        super().__init__()
        self.paypal_client_id = os.getenv('PAYPAL_CLIENT_ID')
        self.paypal_client_secret = os.getenv('PAYPAL_CLIENT_SECRET')
        self.paypal_mode = os.getenv('PAYPAL_MODE', 'sandbox')
        
        if self.paypal_mode == 'sandbox':
            self.base_url = 'https://api-m.sandbox.paypal.com'
        else:
            self.base_url = 'https://api-m.paypal.com'
        
        self.access_token = None

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be created without actually creating',
        )

    def get_access_token(self):
        """Get PayPal OAuth access token"""
        url = f'{self.base_url}/v1/oauth2/token'
        
        auth_string = f'{self.paypal_client_id}:{self.paypal_client_secret}'
        auth_bytes = auth_string.encode('ascii')
        auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
        
        headers = {
            'Authorization': f'Basic {auth_b64}',
            'Content-Type': 'application/x-www-form-urlencoded',
        }
        
        data = 'grant_type=client_credentials'
        
        response = requests.post(url, headers=headers, data=data)
        
        if response.status_code == 200:
            self.access_token = response.json()['access_token']
            self.stdout.write(self.style.SUCCESS('✓ Successfully obtained access token'))
            return True
        else:
            self.stdout.write(self.style.ERROR(f'✗ Failed to get access token: {response.text}'))
            return False

    def create_product(self, dry_run=False):
        """Create PayPal product"""
        url = f'{self.base_url}/v1/catalogs/products'
        
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
        }
        
        payload = {
            "name": "Pagerodeo SaaS",
            "description": "Website monitoring, auditing, and analytics platform",
            "type": "SERVICE",
            "category": "SOFTWARE",
            "image_url": "https://pagerodeo.com/logo.png",  # Update with actual logo URL
            "home_url": "https://pagerodeo.com"  # Update with actual URL
        }
        
        if dry_run:
            self.stdout.write(self.style.WARNING('\n[DRY RUN] Would create product:'))
            self.stdout.write(f'  Name: {payload["name"]}')
            self.stdout.write(f'  Type: {payload["type"]}')
            return None
        
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code == 201:
            product = response.json()
            self.stdout.write(self.style.SUCCESS(f'✓ Created product: {product["id"]}'))
            return product['id']
        elif response.status_code == 409:
            # Product might already exist, try to find it
            self.stdout.write(self.style.WARNING('Product may already exist, continuing...'))
            return 'PROD-EXISTS'  # Placeholder
        else:
            self.stdout.write(self.style.ERROR(f'✗ Failed to create product: {response.text}'))
            return None

    def create_billing_plan(self, product_id, plan_name, monthly_price, annual_price, dry_run=False):
        """Create monthly and annual billing plans for a subscription tier"""
        plans_created = []
        
        # Monthly plan
        monthly_plan = {
            "product_id": product_id,
            "name": f"{plan_name} - Monthly",
            "description": f"{plan_name} subscription billed monthly",
            "status": "ACTIVE",
            "billing_cycles": [
                {
                    "frequency": {
                        "interval_unit": "MONTH",
                        "interval_count": 1
                    },
                    "tenure_type": "REGULAR",
                    "sequence": 1,
                    "total_cycles": 0,  # 0 = infinite
                    "pricing_scheme": {
                        "fixed_price": {
                            "value": str(monthly_price),
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
        
        # Annual plan (with 10% discount)
        annual_discount = monthly_price * 12 * 0.1
        annual_price_calculated = (monthly_price * 12) - annual_discount
        
        annual_plan = {
            "product_id": product_id,
            "name": f"{plan_name} - Annual",
            "description": f"{plan_name} subscription billed annually (10% discount)",
            "status": "ACTIVE",
            "billing_cycles": [
                {
                    "frequency": {
                        "interval_unit": "YEAR",
                        "interval_count": 1
                    },
                    "tenure_type": "REGULAR",
                    "sequence": 1,
                    "total_cycles": 0,  # 0 = infinite
                    "pricing_scheme": {
                        "fixed_price": {
                            "value": str(round(annual_price_calculated, 2)),
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
        
        url = f'{self.base_url}/v1/billing/plans'
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
        }
        
        for plan_type, plan_data in [('Monthly', monthly_plan), ('Annual', annual_plan)]:
            if dry_run:
                self.stdout.write(self.style.WARNING(f'\n[DRY RUN] Would create {plan_type} plan:'))
                self.stdout.write(f'  Name: {plan_data["name"]}')
                self.stdout.write(f'  Price: ${plan_data["billing_cycles"][0]["pricing_scheme"]["fixed_price"]["value"]} USD')
                continue
            
            response = requests.post(url, headers=headers, json=plan_data)
            
            if response.status_code == 201:
                plan = response.json()
                plan_id = plan['id']
                plans_created.append({
                    'type': plan_type.lower(),
                    'plan_id': plan_id,
                    'price': plan_data['billing_cycles'][0]['pricing_scheme']['fixed_price']['value']
                })
                self.stdout.write(self.style.SUCCESS(
                    f'✓ Created {plan_type} plan: {plan_id} (${plan_data["billing_cycles"][0]["pricing_scheme"]["fixed_price"]["value"]}/{"mo" if plan_type == "Monthly" else "yr"})'
                ))
            else:
                self.stdout.write(self.style.ERROR(
                    f'✗ Failed to create {plan_type} plan: {response.text}'
                ))
        
        return plans_created

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if not self.paypal_client_id or not self.paypal_client_secret:
            self.stdout.write(self.style.ERROR(
                '✗ PayPal credentials not found. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in your .env file.'
            ))
            return
        
        self.stdout.write(self.style.SUCCESS(f'\n🚀 Creating PayPal plans ({self.paypal_mode.upper()} mode)\n'))
        
        if dry_run:
            self.stdout.write(self.style.WARNING('⚠️  DRY RUN MODE - No changes will be made\n'))
        
        # Get access token
        if not self.get_access_token():
            return
        
        # Create product
        self.stdout.write('\n📦 Creating product...')
        product_id = self.create_product(dry_run=dry_run)
        
        if not product_id and not dry_run:
            self.stdout.write(self.style.ERROR('Cannot proceed without product ID'))
            return
        
        # Define subscription tiers
        subscription_tiers = [
            {'name': 'Analyst', 'monthly': 29.99, 'annual': 29.99},
            {'name': 'Auditor', 'monthly': 99.00, 'annual': 99.00},
            {'name': 'Manager', 'monthly': 249.00, 'annual': 249.00},
            {'name': 'Director', 'monthly': 499.00, 'annual': 499.00},
            {'name': 'Executive', 'monthly': 999.00, 'annual': 999.00},
        ]
        
        # Create billing plans for each tier
        self.stdout.write('\n📋 Creating billing plans...\n')
        all_plans = {}
        
        for tier in subscription_tiers:
            self.stdout.write(f'\n{tier["name"]} Plan:')
            plans = self.create_billing_plan(
                product_id if product_id != 'PROD-EXISTS' else 'PROD-PLACEHOLDER',
                tier['name'],
                tier['monthly'],
                tier['annual'],
                dry_run=dry_run
            )
            
            if plans:
                all_plans[tier['name']] = plans
        
        # Summary
        if not dry_run:
            self.stdout.write(self.style.SUCCESS('\n\n✅ Summary:'))
            self.stdout.write(f'  Product ID: {product_id}')
            self.stdout.write(f'  Plans created: {sum(len(plans) for plans in all_plans.values())}')
            
            self.stdout.write('\n📝 Plan IDs (save these for your .env or database):')
            for tier_name, plans in all_plans.items():
                for plan in plans:
                    self.stdout.write(f'  {tier_name} ({plan["type"]}): {plan["plan_id"]}')
        
        self.stdout.write(self.style.SUCCESS('\n✨ Done!\n'))

