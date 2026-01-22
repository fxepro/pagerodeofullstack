# Generated manually - PromotionalDeal moved from financials to marketing app

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('financials', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='PromotionalDeal',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(help_text='Deal name (e.g., "Black Friday 2025")', max_length=200)),
                ('slug', models.SlugField(help_text='URL-friendly identifier', unique=True)),
                ('description', models.TextField(blank=True, help_text='Deal description')),
                ('discount_percentage', models.DecimalField(decimal_places=2, help_text='Discount percentage (e.g., 44.00 for 44% off)', max_digits=5)),
                ('original_price', models.DecimalField(decimal_places=2, help_text='Original price before discount', max_digits=10)),
                ('deal_price', models.DecimalField(decimal_places=2, help_text='Deal price (e.g., 199.00 for $199/year)', max_digits=10)),
                ('billing_period', models.CharField(choices=[('monthly', 'Monthly'), ('annual', 'Annual')], help_text='Billing period for this deal', max_length=20)),
                ('paypal_plan_id', models.CharField(blank=True, help_text='PayPal billing plan ID for this deal (P-XXXXX)', max_length=200, null=True)),
                ('paypal_product_id', models.CharField(blank=True, help_text='PayPal product ID (PROD-XXXXX)', max_length=200, null=True)),
                ('stripe_plan_id', models.CharField(blank=True, help_text='Stripe price/plan ID for this deal', max_length=200, null=True)),
                ('stripe_product_id', models.CharField(blank=True, help_text='Stripe product ID', max_length=200, null=True)),
                ('coinbase_plan_id', models.CharField(blank=True, help_text='Coinbase plan ID for this deal', max_length=200, null=True)),
                ('start_date', models.DateTimeField(help_text='When the deal becomes active')),
                ('end_date', models.DateTimeField(help_text='When the deal expires')),
                ('is_active', models.BooleanField(default=True, help_text='Whether this deal is currently active')),
                ('max_redemptions', models.IntegerField(blank=True, help_text='Maximum number of redemptions (null = unlimited)', null=True)),
                ('current_redemptions', models.IntegerField(default=0, help_text='Current number of redemptions')),
                ('badge_text', models.CharField(default='LIMITED TIME DEAL', help_text='Badge text to display (e.g., "LIMITED TIME DEAL")', max_length=50)),
                ('featured', models.BooleanField(default=False, help_text='Show on homepage banner')),
                ('display_priority', models.IntegerField(default=0, help_text='Display priority (higher = shown first)')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('base_plan', models.ForeignKey(help_text='Base subscription plan this deal applies to', on_delete=django.db.models.deletion.CASCADE, related_name='promotional_deals', to='financials.subscriptionplan')),
            ],
            options={
                'verbose_name': 'Promotional Deal',
                'verbose_name_plural': 'Promotional Deals',
                'ordering': ['-start_date'],
            },
        ),
        migrations.AddIndex(
            model_name='promotionaldeal',
            index=models.Index(fields=['slug', 'is_active'], name='marketing_p_slug_is_a_idx'),
        ),
        migrations.AddIndex(
            model_name='promotionaldeal',
            index=models.Index(fields=['start_date', 'end_date'], name='marketing_p_start_d_idx'),
        ),
        migrations.AddIndex(
            model_name='promotionaldeal',
            index=models.Index(fields=['featured', 'is_active'], name='marketing_p_feature_idx'),
        ),
    ]

