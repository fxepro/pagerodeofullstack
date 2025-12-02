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
    
    def generate_verification_token(self):
        """Generate a new verification token and human-readable code"""
        from django.contrib.auth.hashers import make_password
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            token = str(uuid.uuid4())
            # Generate human-readable code for emergency fallback
            human_code = self.generate_human_readable_code()
            
            # Store both hashed token (for verification) and human-readable code (for emergency fallback)
            hashed_token = make_password(token)
            self.email_verification_token = hashed_token
            self.email_verification_code = human_code  # Store human-readable code for emergency use
            self.email_verification_sent_at = timezone.now()
            
            # Save with explicit update_fields to ensure all fields are saved
            self.save(update_fields=['email_verification_token', 'email_verification_code', 'email_verification_sent_at'])
            
            # Verify the save worked
            self.refresh_from_db()
            if not self.email_verification_token:
                logger.error(f"Failed to save verification token for user {self.user.email}")
                raise ValueError("Failed to save verification token")
            
            logger.info(f"Generated verification token and code for user {self.user.email}")
            return token
        except Exception as e:
            logger.error(f"Error generating verification token for user {self.user.email}: {str(e)}", exc_info=True)
            raise
    
    def verify_token(self, token):
        """Verify a token against the stored hash"""
        from django.contrib.auth.hashers import check_password
        if not self.email_verification_token:
            return False
        return check_password(token, self.email_verification_token)
    
    def verify_code(self, code):
        """Verify a human-readable code (case-insensitive, ignores dashes)"""
        if not self.email_verification_code:
            return False
        # Normalize both codes: remove dashes and convert to uppercase
        stored_code = self.email_verification_code.replace('-', '').upper()
        provided_code = code.replace('-', '').upper()
        return stored_code == provided_code
    
    def is_token_expired(self):
        """Check if verification token has expired (24 hours)"""
        if not self.email_verification_sent_at:
            return True
        from datetime import timedelta
        return timezone.now() - self.email_verification_sent_at > timedelta(hours=24)
    
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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

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
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

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