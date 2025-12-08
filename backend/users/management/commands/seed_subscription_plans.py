"""
Django management command to seed SubscriptionPlan data with PayPal plan IDs.

Usage:
    python manage.py seed_subscription_plans
"""

from django.core.management.base import BaseCommand
from users.models import SubscriptionPlan


class Command(BaseCommand):
    help = 'Seed SubscriptionPlan data with PayPal plan IDs'

    def add_arguments(self, parser):
        parser.add_argument(
            '--update',
            action='store_true',
            help='Update existing plans instead of skipping',
        )

    def handle(self, *args, **options):
        update = options['update']
        
        # Plan data from PayPal plans .txt file
        plans_data = [
            {
                'plan_name': 'Analyst',
                'display_name': 'Analyst Plan',
                'description': 'Step into smart monitoring with deeper insights, code tracking, and intelligent alerts.',
                'price_monthly': 29.99,
                'price_yearly': 323.89,  # 10% discount
                'paypal_plan_id_monthly': 'P-90J5173550663440VNE3CKGA',
                'paypal_plan_id_annual': 'P-9HJ559783X3161025NE3CKGI',
                'paypal_product_id': 'PROD-2K385823KJ2173142',
                'role': 'analyst',
                'display_order': 1,
                'is_featured': True,  # Most Popular
            },
            {
                'plan_name': 'Auditor',
                'display_name': 'Auditor Plan',
                'description': 'The perfect entry point for anyone who wants fast, reliable insight into their website\'s health.',
                'price_monthly': 99.00,
                'price_yearly': 1069.20,
                'paypal_plan_id_monthly': 'P-1FX56866BW798500MNE3CKGY',
                'paypal_plan_id_annual': 'P-7S143393GH360840TNE3CKHA',
                'paypal_product_id': 'PROD-2K385823KJ2173142',
                'role': 'auditor',
                'display_order': 2,
                'is_featured': False,
            },
            {
                'plan_name': 'Manager',
                'display_name': 'Manager Plan',
                'description': 'A powerful, AI-enhanced monitoring suite built for growing teams and mission-critical systems.',
                'price_monthly': 249.00,
                'price_yearly': 2689.20,
                'paypal_plan_id_monthly': 'P-92W73791N0156521ENE3CKHI',
                'paypal_plan_id_annual': 'P-95P027388D961314TNE3CKHQ',
                'paypal_product_id': 'PROD-2K385823KJ2173142',
                'role': 'manager',
                'display_order': 3,
                'is_featured': False,
            },
            {
                'plan_name': 'Director',
                'display_name': 'Director Plan',
                'description': 'Enterprise-level capabilities for full-stack observability, security scanning, and automated quality assurance.',
                'price_monthly': 499.00,
                'price_yearly': 5389.20,
                'paypal_plan_id_monthly': 'P-2TX92673WN442754JNE3CKHY',
                'paypal_plan_id_annual': 'P-14170507Y2264125ANE3CKIA',
                'paypal_product_id': 'PROD-2K385823KJ2173142',
                'role': 'director',
                'display_order': 4,
                'is_featured': False,
            },
            {
                'plan_name': 'Executive',
                'display_name': 'Executive Plan',
                'description': 'The ultimate all-inclusive digital assurance suite — intelligence, automation, insights, and everything you need to run flawless systems at scale.',
                'price_monthly': 999.00,
                'price_yearly': 10789.20,
                'paypal_plan_id_monthly': 'P-1D8429113M8088841NE3CKII',
                'paypal_plan_id_annual': 'P-8KE57416EV316832ANE3CKIY',
                'paypal_product_id': 'PROD-2K385823KJ2173142',
                'role': 'admin',
                'display_order': 5,
                'is_featured': False,
            },
        ]
        
        self.stdout.write(self.style.SUCCESS('\n🌱 Seeding Subscription Plans...\n'))
        
        created_count = 0
        updated_count = 0
        skipped_count = 0
        
        for plan_data in plans_data:
            plan_name = plan_data['plan_name']
            
            try:
                plan, created = SubscriptionPlan.objects.update_or_create(
                    plan_name=plan_name,
                    defaults=plan_data
                )
                
                if created:
                    created_count += 1
                    self.stdout.write(self.style.SUCCESS(
                        f'✓ Created: {plan_name} - ${plan.price_monthly}/mo'
                    ))
                elif update:
                    updated_count += 1
                    self.stdout.write(self.style.WARNING(
                        f'↻ Updated: {plan_name} - ${plan.price_monthly}/mo'
                    ))
                else:
                    skipped_count += 1
                    self.stdout.write(self.style.NOTICE(
                        f'⊘ Skipped: {plan_name} (already exists, use --update to modify)'
                    ))
                    
            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f'✗ Error creating {plan_name}: {str(e)}'
                ))
        
        self.stdout.write(self.style.SUCCESS(f'\n✅ Summary:'))
        self.stdout.write(f'  Created: {created_count}')
        if update:
            self.stdout.write(f'  Updated: {updated_count}')
        else:
            self.stdout.write(f'  Skipped: {skipped_count}')
        self.stdout.write(self.style.SUCCESS('\n✨ Done!\n'))

