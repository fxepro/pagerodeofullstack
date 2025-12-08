from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid
import random
import string

class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('director', 'Director'),
        ('manager', 'Manager'),
        ('analyst', 'Analyst'),
        ('viewer', 'Viewer'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='viewer')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(null=True, blank=True)
    login_count = models.IntegerField(default=0)
    
    # Email verification fields
    email_verified = models.BooleanField(default=False, help_text='Whether the user has verified their email address')
    email_verification_token = models.CharField(max_length=255, null=True, blank=True, help_text='Hashed token for email verification')
    email_verification_code = models.CharField(max_length=255, null=True, blank=True, help_text='Plain text verification code for fallback retrieval')
    email_verification_sent_at = models.DateTimeField(null=True, blank=True, help_text='When the verification email was sent')
    
    # Two-Factor Authentication fields
    two_factor_enabled = models.BooleanField(default=False, help_text='Whether the user has enabled 2FA')
    two_factor_secret = models.CharField(max_length=255, null=True, blank=True, help_text='Encrypted TOTP secret for 2FA')
    two_factor_backup_codes = models.JSONField(default=list, blank=True, help_text='Encrypted backup codes for 2FA recovery')
    
    # User settings (stored as JSON for flexibility)
    user_settings = models.JSONField(default=dict, blank=True, help_text='User preferences and settings')
    
    # Personal information fields
    phone = models.CharField(max_length=50, blank=True, help_text='Personal phone number')
    bio = models.TextField(blank=True, help_text='User biography or description')
    avatar_url = models.URLField(blank=True, help_text='URL to user avatar image')
    date_of_birth = models.DateField(null=True, blank=True, help_text='Date of birth')
    timezone = models.CharField(max_length=50, default='UTC', help_text='User timezone')
    locale = models.CharField(max_length=10, default='en-US', help_text='User locale preference')
    
    def __str__(self):
        return f"{self.user.username} - {self.role}"
    
    def generate_human_readable_code(self):
        """Generate a human-readable verification code (e.g., ABC-123-XYZ)"""
        # Generate 3 uppercase letters, 3 digits, 3 uppercase letters
        part1 = ''.join(random.choices(string.ascii_uppercase, k=3))
        part2 = ''.join(random.choices(string.digits, k=3))
        part3 = ''.join(random.choices(string.ascii_uppercase, k=3))
        return f"{part1}-{part2}-{part3}"
    
    def generate_verification_code(self):
        """Generate a new human-readable verification code"""
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            # Generate human-readable code
            code = self.generate_human_readable_code()
            
            # Store code and timestamp
            self.email_verification_code = code
            self.email_verification_sent_at = timezone.now()
            # Clear old token field (for backward compatibility)
            self.email_verification_token = None
            
            # Save with explicit update_fields
            self.save(update_fields=['email_verification_code', 'email_verification_token', 'email_verification_sent_at'])
            
            # Verify the save worked
            self.refresh_from_db()
            if not self.email_verification_code:
                logger.error(f"Failed to save verification code for user {self.user.email}")
                raise ValueError("Failed to save verification code")
            
            logger.info(f"Generated verification code for user {self.user.email}: {code}")
            return code
        except Exception as e:
            logger.error(f"Error generating verification code for user {self.user.email}: {str(e)}", exc_info=True)
            raise
    
    def verify_token(self, token):
        """Verify a token against the stored hash"""
        from django.contrib.auth.hashers import check_password
        if not self.email_verification_token:
            return False
        return check_password(token, self.email_verification_token)
    
    def verify_code(self, code):
        """Verify a human-readable code (case-insensitive, ignores dashes and spaces)"""
        if not self.email_verification_code:
            return False
        # Normalize both codes: remove dashes, spaces and convert to uppercase
        stored_code = self.email_verification_code.replace('-', '').replace(' ', '').upper()
        provided_code = (code or '').replace('-', '').replace(' ', '').upper()
        return stored_code == provided_code
    
    def is_code_expired(self):
        """Check if verification code has expired (24 hours)"""
        if not self.email_verification_sent_at:
            return True
        from datetime import timedelta
        return timezone.now() - self.email_verification_sent_at > timedelta(hours=24)
    
    def is_token_expired(self):
        """Alias for backward compatibility"""
        return self.is_code_expired()
    
    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"

class UserActivity(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    action = models.CharField(max_length=100)
    description = models.TextField()
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.action} at {self.timestamp}"
    
    class Meta:
        verbose_name = "User Activity"
        verbose_name_plural = "User Activities"
        ordering = ['-timestamp']


class UserCorporateProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='corporate_profile')
    company_name = models.CharField(max_length=255, blank=True)
    job_title = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    website = models.URLField(blank=True)
    tax_id = models.CharField(max_length=100, blank=True)
    address_line1 = models.CharField(max_length=255, blank=True)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} Corporate Profile"


class PaymentMethod(models.Model):
    METHOD_CHOICES = (
        ('card', 'Credit/Debit Card'),
        ('ach', 'Bank Transfer (ACH)'),
    )

    ACCOUNT_TYPE_CHOICES = (
        ('checking', 'Checking'),
        ('savings', 'Savings'),
        ('business', 'Business'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payment_methods')
    nickname = models.CharField(max_length=100, blank=True)
    method_type = models.CharField(max_length=10, choices=METHOD_CHOICES)
    
    # Card fields
    cardholder_name = models.CharField(max_length=255, blank=True, help_text='Cardholder name for credit/debit cards')
    card_number = models.CharField(max_length=16, blank=True, help_text='Full 16-digit card number (encrypted in production)')
    brand = models.CharField(max_length=50, blank=True, help_text='Card brand (Visa, Mastercard, etc.)')
    last4 = models.CharField(max_length=4, blank=True, help_text='Last 4 digits for display purposes')
    exp_month = models.PositiveSmallIntegerField(null=True, blank=True)
    exp_year = models.PositiveSmallIntegerField(null=True, blank=True)
    # Billing address for card
    billing_address_line1 = models.CharField(max_length=255, blank=True)
    billing_address_line2 = models.CharField(max_length=255, blank=True)
    billing_city = models.CharField(max_length=100, blank=True)
    billing_state = models.CharField(max_length=100, blank=True)
    billing_postal_code = models.CharField(max_length=20, blank=True)
    billing_country = models.CharField(max_length=100, blank=True)
    
    # ACH fields
    bank_name = models.CharField(max_length=100, blank=True)
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPE_CHOICES, blank=True)
    account_number = models.CharField(max_length=50, blank=True, help_text='Full account number (encrypted in production)')
    routing_number = models.CharField(max_length=9, blank=True, help_text='Full 9-digit routing number')
    # Bank address for ACH
    bank_address_line1 = models.CharField(max_length=255, blank=True)
    bank_address_line2 = models.CharField(max_length=255, blank=True)
    bank_city = models.CharField(max_length=100, blank=True)
    bank_state = models.CharField(max_length=100, blank=True)
    bank_postal_code = models.CharField(max_length=20, blank=True)
    bank_country = models.CharField(max_length=100, blank=True)
    
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_default', '-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.method_type} - {self.last4 or 'XXXX'}"


class UserSubscription(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
    )

    BILLING_PERIOD_CHOICES = (
        ('monthly', 'Monthly'),
        ('annual', 'Annual'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscriptions')
    plan_name = models.CharField(max_length=100)
    role = models.CharField(max_length=100, blank=True)
    price_monthly = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text='Monthly price in USD')
    price_yearly = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text='Yearly price in USD')
    billing_period = models.CharField(max_length=10, choices=BILLING_PERIOD_CHOICES, default='monthly', help_text='Monthly or Annual billing')
    discount_code = models.CharField(max_length=20, blank=True, help_text='Promotional discount code applied to this subscription')
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_recurring = models.BooleanField(default=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    notes = models.TextField(blank=True)
    
    # PayPal-specific fields
    paypal_subscription_id = models.CharField(
        max_length=255, 
        unique=True, 
        blank=True, 
        null=True,
        help_text='PayPal subscription ID (I-XXXXX)'
    )
    paypal_plan_id = models.CharField(
        max_length=255, 
        blank=True, 
        null=True,
        help_text='PayPal billing plan ID (P-XXXXX)'
    )
    paypal_product_id = models.CharField(
        max_length=255, 
        blank=True, 
        null=True,
        help_text='PayPal product ID (PROD-XXXXX)'
    )
    next_billing_date = models.DateTimeField(
        null=True, 
        blank=True,
        help_text='Next billing date from PayPal'
    )
    paypal_status = models.CharField(
        max_length=50, 
        blank=True, 
        null=True,
        help_text='PayPal subscription status (ACTIVE, CANCELLED, etc.)'
    )
    cancelled_at = models.DateTimeField(
        null=True, 
        blank=True,
        help_text='When the subscription was cancelled'
    )
    cancellation_reason = models.TextField(
        blank=True,
        help_text='Reason for cancellation'
    )
    
    # Promotional deal tracking
    promotional_deal = models.ForeignKey(
        'PromotionalDeal',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='subscriptions',
        help_text='Promotional deal used for this subscription'
    )
    deal_redeemed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='When the promotional deal was redeemed'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['paypal_subscription_id']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['paypal_status']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.plan_name}"


class BillingTransaction(models.Model):
    STATUS_CHOICES = (
        ('paid', 'Paid'),
        ('pending', 'Pending'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='billing_transactions')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='USD')
    description = models.CharField(max_length=255, blank=True)
    invoice_id = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    metadata = models.JSONField(blank=True, null=True)
    
    # Payment provider fields
    payment_provider = models.CharField(
        max_length=50, 
        default='paypal',
        choices=[
            ('paypal', 'PayPal'),
            ('stripe', 'Stripe'),
            ('coinbase', 'Coinbase'),
        ],
        help_text='Payment provider used'
    )
    
    # PayPal-specific fields
    paypal_transaction_id = models.CharField(
        max_length=255, 
        unique=True, 
        blank=True, 
        null=True,
        help_text='PayPal transaction ID'
    )
    paypal_sale_id = models.CharField(
        max_length=255, 
        blank=True, 
        null=True,
        help_text='PayPal sale ID'
    )
    paypal_payment_id = models.CharField(
        max_length=255, 
        blank=True, 
        null=True,
        help_text='PayPal payment ID'
    )
    
    # Link to subscription
    subscription = models.ForeignKey(
        'UserSubscription',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions',
        help_text='Associated subscription if this is a recurring payment'
    )
    
    # Additional metadata
    transaction_type = models.CharField(
        max_length=50,
        choices=[
            ('subscription', 'Subscription Payment'),
            ('one_time', 'One-time Payment'),
            ('refund', 'Refund'),
            ('chargeback', 'Chargeback'),
        ],
        default='subscription',
        help_text='Type of transaction'
    )
    processed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='When the transaction was processed by the payment provider'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['paypal_transaction_id']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['subscription']),
            models.Index(fields=['payment_provider']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.amount} {self.currency}"


class MonitoredSite(models.Model):
    STATUS_CHOICES = (
        ('checking', 'Checking'),
        ('up', 'Up'),
        ('down', 'Down'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='monitored_sites')
    url = models.CharField(max_length=255)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='checking')
    uptime = models.FloatField(default=100.0)
    last_check = models.DateTimeField(null=True, blank=True)
    response_time = models.IntegerField(default=0)
    status_duration = models.CharField(max_length=255, blank=True)
    check_interval = models.IntegerField(default=5)
    ssl_valid = models.BooleanField(null=True, blank=True)
    ssl_expires_in = models.IntegerField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('user', 'url')

    def __str__(self):
        return f"{self.user.username} - {self.url}"


class PaymentProviderConfig(models.Model):
    """Store payment provider credentials and configuration"""
    PROVIDER_CHOICES = (
        ('paypal', 'PayPal'),
        ('stripe', 'Stripe'),
        ('coinbase', 'Coinbase'),
    )
    
    # Basic info
    provider = models.CharField(
        max_length=50, 
        choices=PROVIDER_CHOICES,
        unique=True,
        help_text='Payment provider name'
    )
    
    # Credentials (encrypted in production)
    client_id = models.CharField(
        max_length=255, 
        blank=True,
        help_text='Client ID / Public Key'
    )
    client_secret = models.CharField(
        max_length=255, 
        blank=True,
        help_text='Client Secret / Private Key (encrypted)'
    )
    
    # Webhook configuration
    webhook_id = models.CharField(
        max_length=255, 
        blank=True,
        help_text='Webhook ID from provider'
    )
    webhook_url = models.URLField(
        blank=True,
        help_text='Webhook URL configured in provider dashboard'
    )
    webhook_secret = models.CharField(
        max_length=255,
        blank=True,
        help_text='Webhook secret for signature verification'
    )
    
    # Status flags
    is_active = models.BooleanField(
        default=False,
        help_text='Whether this provider is active and enabled'
    )
    is_live = models.BooleanField(
        default=False,
        help_text='True for live/production, False for sandbox/test'
    )
    
    # Additional config (JSON)
    config = models.JSONField(
        default=dict,
        blank=True,
        help_text='Additional provider-specific configuration'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_sync_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Last time data was synced from provider'
    )
    
    class Meta:
        verbose_name = 'Payment Provider Config'
        verbose_name_plural = 'Payment Provider Configs'
        ordering = ['provider']
        indexes = [
            models.Index(fields=['provider']),
        ]
    
    def __str__(self):
        mode = 'Live' if self.is_live else 'Sandbox'
        status = 'Active' if self.is_active else 'Inactive'
        return f"{self.get_provider_display()} - {mode} - {status}"


class SubscriptionPlan(models.Model):
    """Map internal plan names to payment provider plan IDs"""
    # Plan identification
    plan_name = models.CharField(
        max_length=100,
        unique=True,
        help_text='Internal plan name (Analyst, Auditor, Manager, etc.)'
    )
    display_name = models.CharField(
        max_length=100,
        help_text='Display name for the plan'
    )
    description = models.TextField(
        blank=True,
        help_text='Plan description'
    )
    
    # Pricing
    price_monthly = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text='Monthly price in USD'
    )
    price_yearly = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text='Yearly price in USD (with discount applied)'
    )
    
    # PayPal Plan IDs
    paypal_plan_id_monthly = models.CharField(
        max_length=255,
        blank=True,
        help_text='PayPal billing plan ID for monthly billing (P-XXXXX)'
    )
    paypal_plan_id_annual = models.CharField(
        max_length=255,
        blank=True,
        help_text='PayPal billing plan ID for annual billing (P-XXXXX)'
    )
    paypal_product_id = models.CharField(
        max_length=255,
        blank=True,
        help_text='PayPal product ID (PROD-XXXXX)'
    )
    
    # Future: Stripe/Coinbase plan IDs
    stripe_plan_id_monthly = models.CharField(
        max_length=255,
        blank=True,
        help_text='Stripe plan ID for monthly billing'
    )
    stripe_plan_id_annual = models.CharField(
        max_length=255,
        blank=True,
        help_text='Stripe plan ID for annual billing'
    )
    coinbase_plan_id_monthly = models.CharField(
        max_length=255,
        blank=True,
        help_text='Coinbase plan ID for monthly billing'
    )
    coinbase_plan_id_annual = models.CharField(
        max_length=255,
        blank=True,
        help_text='Coinbase plan ID for annual billing'
    )
    
    # Status
    is_active = models.BooleanField(
        default=True,
        help_text='Whether this plan is currently available'
    )
    is_featured = models.BooleanField(
        default=False,
        help_text='Whether to highlight this plan (e.g., "Most Popular")'
    )
    
    # Role mapping
    role = models.CharField(
        max_length=100,
        blank=True,
        help_text='Associated user role (viewer, analyst, manager, etc.)'
    )
    
    # Ordering
    display_order = models.IntegerField(
        default=0,
        help_text='Order in which to display plans (lower = first)'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Subscription Plan'
        verbose_name_plural = 'Subscription Plans'
        ordering = ['display_order', 'price_monthly']
        indexes = [
            models.Index(fields=['plan_name']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.plan_name} - ${self.price_monthly}/mo"
    
    def get_paypal_plan_id(self, billing_period='monthly'):
        """Get PayPal plan ID for the given billing period"""
        if billing_period == 'monthly':
            return self.paypal_plan_id_monthly
        return self.paypal_plan_id_annual
    
    def get_stripe_plan_id(self, billing_period='monthly'):
        """Get Stripe plan ID for the given billing period"""
        if billing_period == 'monthly':
            return self.stripe_plan_id_monthly
        return self.stripe_plan_id_annual
    
    def get_coinbase_plan_id(self, billing_period='monthly'):
        """Get Coinbase plan ID for the given billing period"""
        if billing_period == 'monthly':
            return self.coinbase_plan_id_monthly
        return self.coinbase_plan_id_annual
    
    def get_plan_id_by_provider(self, provider='paypal', billing_period='monthly'):
        """Get plan ID for the specified payment provider and billing period"""
        if provider == 'paypal':
            return self.get_paypal_plan_id(billing_period)
        elif provider == 'stripe':
            return self.get_stripe_plan_id(billing_period)
        elif provider == 'coinbase':
            return self.get_coinbase_plan_id(billing_period)
        return None


class BillingAddress(models.Model):
    """Store billing address and contact information for subscriptions and transactions"""
    # Link to user
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='billing_addresses',
        help_text='User who owns this billing address'
    )
    
    # Link to subscription (if this is the billing address for a subscription)
    subscription = models.ForeignKey(
        'UserSubscription',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='billing_addresses',
        help_text='Associated subscription if this is the subscription billing address'
    )
    
    # Contact Information
    first_name = models.CharField(
        max_length=100,
        help_text='Billing contact first name'
    )
    last_name = models.CharField(
        max_length=100,
        help_text='Billing contact last name'
    )
    email = models.EmailField(
        help_text='Billing contact email address'
    )
    phone = models.CharField(
        max_length=50,
        blank=True,
        help_text='Billing contact phone number'
    )
    company_name = models.CharField(
        max_length=255,
        blank=True,
        help_text='Company name (if business billing)'
    )
    tax_id = models.CharField(
        max_length=100,
        blank=True,
        help_text='Tax ID / VAT number (if applicable)'
    )
    
    # Address Information
    address_line1 = models.CharField(
        max_length=255,
        help_text='Street address line 1'
    )
    address_line2 = models.CharField(
        max_length=255,
        blank=True,
        help_text='Street address line 2 (apartment, suite, etc.)'
    )
    city = models.CharField(
        max_length=100,
        help_text='City'
    )
    state = models.CharField(
        max_length=100,
        blank=True,
        help_text='State / Province / Region'
    )
    postal_code = models.CharField(
        max_length=20,
        help_text='Postal / ZIP code'
    )
    country = models.CharField(
        max_length=100,
        help_text='Country (ISO country code recommended)'
    )
    
    # Payment Provider Information
    payment_provider = models.CharField(
        max_length=50,
        choices=[
            ('paypal', 'PayPal'),
            ('stripe', 'Stripe'),
            ('coinbase', 'Coinbase'),
        ],
        default='paypal',
        help_text='Payment provider this address came from'
    )
    provider_address_id = models.CharField(
        max_length=255,
        blank=True,
        help_text='Address ID from payment provider (if available)'
    )
    
    # Status
    is_default = models.BooleanField(
        default=False,
        help_text='Whether this is the default billing address for the user'
    )
    is_active = models.BooleanField(
        default=True,
        help_text='Whether this address is currently active'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_used_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Last time this address was used for a transaction'
    )
    
    class Meta:
        verbose_name = 'Billing Address'
        verbose_name_plural = 'Billing Addresses'
        ordering = ['-is_default', '-last_used_at', '-created_at']
        indexes = [
            models.Index(fields=['user', 'is_default']),
            models.Index(fields=['subscription']),
            models.Index(fields=['payment_provider']),
        ]
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.city}, {self.country}"
    
    def get_full_name(self):
        """Get full name"""
        return f"{self.first_name} {self.last_name}".strip()
    
    def get_full_address(self):
        """Get formatted full address"""
        parts = [
            self.address_line1,
            self.address_line2,
            f"{self.city}, {self.state} {self.postal_code}".strip(),
            self.country
        ]
        return ", ".join([p for p in parts if p])


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
        'SubscriptionPlan',
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
        from django.utils import timezone
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