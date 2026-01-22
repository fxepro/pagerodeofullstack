from django.db import models
from django.contrib.auth.models import User


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
        'marketing.PromotionalDeal',
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


class CoinbaseCharge(models.Model):
    """
    Coinbase Commerce charge (payment request)
    Separate table for Coinbase transactions to enable independent reporting
    """
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('failed', 'Failed'),
        ('expired', 'Expired'),
        ('canceled', 'Canceled'),
        ('delayed', 'Delayed'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='coinbase_charges')
    subscription = models.ForeignKey(
        'UserSubscription', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='coinbase_charges'
    )
    
    # Coinbase identifiers
    charge_id = models.CharField(
        max_length=255, 
        unique=True, 
        help_text='Coinbase Commerce charge ID'
    )
    charge_code = models.CharField(
        max_length=255, 
        unique=True, 
        blank=True,
        null=True,
        help_text='Charge code for payment URL matching'
    )
    hosted_url = models.URLField(
        blank=True,
        help_text='Coinbase checkout URL'
    )
    
    # Charge details
    name = models.CharField(max_length=255, help_text='Charge name/description')
    description = models.TextField(blank=True, help_text='Detailed description')
    amount_usd = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text='Original USD amount requested'
    )
    currency = models.CharField(
        max_length=10, 
        default='USD',
        help_text='Base currency (usually USD)'
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending',
        help_text='Charge status from Coinbase'
    )
    pricing_type = models.CharField(
        max_length=20, 
        default='fixed_price',
        help_text='Pricing type: fixed_price or no_price'
    )
    
    # URLs
    redirect_url = models.URLField(
        blank=True,
        help_text='Where to redirect after successful payment'
    )
    cancel_url = models.URLField(
        blank=True,
        help_text='Where to redirect if payment is canceled'
    )
    
    # Metadata
    metadata = models.JSONField(
        default=dict, 
        blank=True,
        help_text='Additional metadata from charge creation'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(
        null=True, 
        blank=True,
        help_text='When the charge expires if not paid'
    )
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Coinbase Charge'
        verbose_name_plural = 'Coinbase Charges'
        indexes = [
            models.Index(fields=['charge_id']),
            models.Index(fields=['charge_code']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.charge_id} - {self.status}"


class CoinbaseTransaction(models.Model):
    """
    Actual crypto payment received from Coinbase Commerce
    Separate table for reporting and analytics
    """
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('failed', 'Failed'),
        ('delayed', 'Delayed'),
    )
    
    CRYPTO_CURRENCIES = (
        ('BTC', 'Bitcoin'),
        ('ETH', 'Ethereum'),
        ('USDC', 'USD Coin'),
        ('LTC', 'Litecoin'),
        ('DOGE', 'Dogecoin'),
        ('BCH', 'Bitcoin Cash'),
    )
    
    charge = models.ForeignKey(
        'CoinbaseCharge', 
        on_delete=models.CASCADE, 
        related_name='transactions',
        help_text='Associated charge'
    )
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='coinbase_transactions'
    )
    subscription = models.ForeignKey(
        'UserSubscription', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='coinbase_transactions'
    )
    
    # Transaction identifiers
    transaction_id = models.CharField(
        max_length=255, 
        unique=True,
        help_text='Coinbase transaction ID'
    )
    
    # Crypto details
    crypto_currency = models.CharField(
        max_length=10, 
        choices=CRYPTO_CURRENCIES,
        help_text='Cryptocurrency used for payment'
    )
    crypto_amount = models.DecimalField(
        max_digits=20, 
        decimal_places=8,
        help_text='Amount received in cryptocurrency'
    )
    amount_usd = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text='USD equivalent at time of payment'
    )
    exchange_rate = models.DecimalField(
        max_digits=20, 
        decimal_places=8, 
        null=True, 
        blank=True,
        help_text='Exchange rate used for conversion'
    )
    
    # Blockchain details
    network = models.CharField(
        max_length=50, 
        blank=True, 
        null=True,
        help_text='Blockchain network (mainnet, testnet)'
    )
    transaction_hash = models.CharField(
        max_length=255, 
        blank=True, 
        null=True,
        help_text='Blockchain transaction hash'
    )
    block_height = models.IntegerField(
        null=True, 
        blank=True,
        help_text='Block height when confirmed'
    )
    confirmations = models.IntegerField(
        default=0,
        help_text='Number of blockchain confirmations'
    )
    
    # Status
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending',
        help_text='Transaction status'
    )
    payment_method = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text='Wallet type or payment method used'
    )
    
    # Timeline and metadata
    timeline = models.JSONField(
        default=list, 
        blank=True,
        help_text='Full payment timeline from Coinbase API'
    )
    
    # Timestamps
    processed_at = models.DateTimeField(
        null=True, 
        blank=True,
        help_text='When payment was confirmed and processed'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Coinbase Transaction'
        verbose_name_plural = 'Coinbase Transactions'
        indexes = [
            models.Index(fields=['transaction_id']),
            models.Index(fields=['charge', 'status']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['crypto_currency']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.crypto_amount} {self.crypto_currency} - {self.status}"
    
    def get_crypto_display(self):
        """Format crypto amount with currency"""
        return f"{self.crypto_amount} {self.crypto_currency}"
    
    def is_confirmed(self):
        """Check if transaction is confirmed"""
        return self.status == 'confirmed' and self.processed_at is not None


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


# PromotionalDeal model moved to marketing app - see marketing/models.py
