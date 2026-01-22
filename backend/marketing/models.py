from django.db import models
from django.utils import timezone


class PromotionalDeal(models.Model):
    """Promotional deals for subscription plans"""
    # Basic Info
    name = models.CharField(
        max_length=200,
        help_text='Deal name (e.g., "Black Friday 2025")'
    )
    slug = models.SlugField(
        unique=True,
        help_text='URL-friendly identifier'
    )
    description = models.TextField(
        blank=True,
        help_text='Deal description'
    )
    
    # Deal Configuration
    base_plan = models.ForeignKey(
        'financials.SubscriptionPlan',
        on_delete=models.CASCADE,
        related_name='promotional_deals',
        help_text='Base subscription plan this deal applies to'
    )
    discount_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text='Discount percentage (e.g., 44.00 for 44% off)'
    )
    original_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text='Original price before discount'
    )
    deal_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text='Deal price (e.g., 199.00 for $199/year)'
    )
    billing_period = models.CharField(
        max_length=20,
        choices=[
            ('monthly', 'Monthly'),
            ('annual', 'Annual'),
        ],
        help_text='Billing period for this deal'
    )
    
    # Payment Provider Integration
    # PayPal
    paypal_plan_id = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text='PayPal billing plan ID for this deal (P-XXXXX)'
    )
    paypal_product_id = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text='PayPal product ID (PROD-XXXXX)'
    )
    
    # Stripe
    stripe_plan_id = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text='Stripe price/plan ID for this deal'
    )
    stripe_product_id = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text='Stripe product ID'
    )
    
    # Coinbase
    coinbase_plan_id = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text='Coinbase plan ID for this deal'
    )
    
    # Timing
    start_date = models.DateTimeField(
        help_text='When the deal becomes active'
    )
    end_date = models.DateTimeField(
        help_text='When the deal expires'
    )
    is_active = models.BooleanField(
        default=True,
        help_text='Whether this deal is currently active'
    )
    
    # Tracking
    max_redemptions = models.IntegerField(
        null=True,
        blank=True,
        help_text='Maximum number of redemptions (null = unlimited)'
    )
    current_redemptions = models.IntegerField(
        default=0,
        help_text='Current number of redemptions'
    )
    
    # Display
    badge_text = models.CharField(
        max_length=50,
        default="LIMITED TIME DEAL",
        help_text='Badge text to display (e.g., "LIMITED TIME DEAL")'
    )
    featured = models.BooleanField(
        default=False,
        help_text='Show on homepage banner'
    )
    display_priority = models.IntegerField(
        default=0,
        help_text='Display priority (higher = shown first)'
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Promotional Deal'
        verbose_name_plural = 'Promotional Deals'
        ordering = ['-start_date']
        indexes = [
            models.Index(fields=['slug', 'is_active']),
            models.Index(fields=['start_date', 'end_date']),
            models.Index(fields=['featured', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.base_plan.display_name}"
    
    def is_valid(self):
        """Check if deal is currently valid"""
        now = timezone.now()
        return (
            self.is_active and
            self.start_date <= now <= self.end_date and
            (self.max_redemptions is None or self.current_redemptions < self.max_redemptions)
        )
    
    def get_plan_id(self, provider='paypal'):
        """Get plan ID for the specified payment provider"""
        if provider == 'paypal':
            return self.paypal_plan_id
        elif provider == 'stripe':
            return self.stripe_plan_id
        elif provider == 'coinbase':
            return self.coinbase_plan_id
        return None
    
    def has_provider_plan(self, provider='paypal'):
        """Check if deal has a plan ID configured for the specified provider"""
        plan_id = self.get_plan_id(provider)
        return plan_id is not None and plan_id.strip() != ''

