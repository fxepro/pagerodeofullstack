"""
Affiliates Models
Affiliate management, referral tracking, commission calculation, and payout processing
"""
from django.db import models
from django.contrib.auth.models import User
from django.utils.text import slugify
from django.utils import timezone
import secrets
import string


def generate_affiliate_code(length=8):
    """Generate a unique, human-readable affiliate code"""
    characters = string.ascii_uppercase + string.digits
    # Exclude confusing characters: 0, O, I, 1
    characters = characters.replace('0', '').replace('O', '').replace('I', '').replace('1', '')
    while True:
        code = ''.join(secrets.choice(characters) for _ in range(length))
        if not Affiliate.objects.filter(affiliate_code=code).exists():
            return code


class Affiliate(models.Model):
    """Affiliate account information and settings"""
    STATUS_CHOICES = (
        ('pending', 'Pending Approval'),
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('inactive', 'Inactive'),
    )
    
    TAX_ENTITY_CHOICES = (
        ('individual', 'Individual'),
        ('business', 'Business'),
    )
    
    TAX_ID_TYPE_CHOICES = (
        ('ssn', 'SSN (Social Security Number)'),
        ('ein', 'EIN (Employer Identification Number)'),
    )
    
    PAYOUT_METHOD_CHOICES = (
        ('paypal', 'PayPal'),
        ('stripe', 'Stripe'),
        ('bank_transfer', 'Bank Transfer'),
        ('check', 'Check'),
    )
    
    # User relationship (OneToOne - profile extension)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='affiliate')
    
    # Affiliate identification
    affiliate_code = models.CharField(max_length=50, unique=True, db_index=True, 
                                     help_text='Unique affiliate referral code')
    company_name = models.CharField(max_length=255, blank=True, 
                                   help_text='Company name (if business affiliate)')
    contact_email = models.EmailField(help_text='Primary contact email')
    contact_phone = models.CharField(max_length=50, blank=True)
    website = models.URLField(blank=True, help_text='Affiliate website or landing page')
    
    # Commission settings
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=20.00, 
                                         help_text='Commission percentage (e.g., 20.00 for 20%)')
    commission_type = models.CharField(max_length=20, choices=[
        ('percentage', 'Percentage'),
        ('fixed', 'Fixed Amount'),
    ], default='percentage')
    fixed_commission_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True,
                                                 help_text='Fixed commission amount (if commission_type is fixed)')
    
    # Status and metadata
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True, help_text='Admin notes about this affiliate')
    
    # Tracking statistics
    total_referrals = models.IntegerField(default=0, help_text='Total number of referrals')
    total_conversions = models.IntegerField(default=0, help_text='Total number of conversions')
    total_commission_earned = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_commission_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_commission_pending = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # Payment settings
    payout_threshold = models.DecimalField(max_digits=10, decimal_places=2, default=50.00,
                                          help_text='Minimum amount before payout')
    payout_method = models.CharField(max_length=50, choices=PAYOUT_METHOD_CHOICES, default='paypal')
    payout_email = models.EmailField(blank=True, help_text='Email for PayPal/Stripe payouts')
    bank_account_details = models.JSONField(default=dict, blank=True, 
                                           help_text='Encrypted bank account details (JSON)')
    
    # Tax Information (REQUIRED for payouts)
    tax_entity_type = models.CharField(max_length=20, choices=TAX_ENTITY_CHOICES, default='individual',
                                      help_text='Individual or Business entity')
    tax_id_type = models.CharField(max_length=10, choices=TAX_ID_TYPE_CHOICES, blank=True,
                                   help_text='SSN or EIN')
    tax_id_number = models.CharField(max_length=50, blank=True, 
                                    help_text='Encrypted SSN or EIN (store encrypted in production)')
    legal_name = models.CharField(max_length=255, blank=True,
                                 help_text='Full legal name or business name')
    
    # Tax Address (for tax forms)
    tax_address_line1 = models.CharField(max_length=255, blank=True)
    tax_address_line2 = models.CharField(max_length=255, blank=True)
    tax_city = models.CharField(max_length=100, blank=True)
    tax_state = models.CharField(max_length=100, blank=True)
    tax_postal_code = models.CharField(max_length=20, blank=True)
    tax_country = models.CharField(max_length=100, default='US')
    
    # W-9 Compliance
    w9_completed = models.BooleanField(default=False, help_text='W-9 form completed')
    w9_completed_at = models.DateTimeField(null=True, blank=True)
    w9_ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    # Annual earnings tracking (for 1099 threshold - $600 in US)
    current_year_earnings = models.DecimalField(max_digits=10, decimal_places=2, default=0.00,
                                               help_text='Earnings in current calendar year')
    last_1099_year = models.IntegerField(null=True, blank=True, help_text='Last year 1099 was issued')
    last_1099_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True,
                                          help_text='Amount reported on last 1099')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name='approved_affiliates')
    rejected_at = models.DateTimeField(null=True, blank=True, help_text='When the application was rejected')
    rejected_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='rejected_affiliates', help_text='Admin who rejected the application')
    rejection_reason = models.TextField(blank=True, help_text='Reason for rejection')
    application_notes = models.TextField(blank=True, help_text='Notes provided by applicant during sign-up')
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['affiliate_code']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['user']),
        ]
        verbose_name = "Affiliate"
        verbose_name_plural = "Affiliates"
    
    def __str__(self):
        return f"{self.user.username} - {self.affiliate_code}"
    
    def save(self, *args, **kwargs):
        # Auto-generate affiliate code if not provided
        if not self.affiliate_code:
            self.affiliate_code = generate_affiliate_code()
        super().save(*args, **kwargs)
    
    def get_referral_url(self, base_url='https://pagerodeo.com'):
        """Generate referral URL for this affiliate"""
        return f"{base_url}/register?ref={self.affiliate_code}"
    
    def can_request_payout(self):
        """Check if affiliate can request payout (meets threshold)"""
        return (self.status == 'active' and 
                self.total_commission_pending >= self.payout_threshold)


class Referral(models.Model):
    """Track individual referrals from affiliates"""
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('signed_up', 'Signed Up'),
        ('converted', 'Converted'),
        ('expired', 'Expired'),
        ('invalid', 'Invalid'),
    )
    
    affiliate = models.ForeignKey(Affiliate, on_delete=models.CASCADE, related_name='referrals')
    referral_code = models.CharField(max_length=50, db_index=True, 
                                     help_text='Referral code used (usually affiliate_code)')
    referred_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                     related_name='referrals',
                                     help_text='User who was referred (if signed up)')
    
    # Tracking information
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    referrer_url = models.URLField(blank=True, help_text='URL that referred the user')
    landing_page = models.URLField(blank=True, help_text='Landing page URL')
    
    # Conversion tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    signed_up_at = models.DateTimeField(null=True, blank=True)
    converted_at = models.DateTimeField(null=True, blank=True)
    conversion_subscription = models.ForeignKey('financials.UserSubscription', 
                                                on_delete=models.SET_NULL, null=True, blank=True,
                                                related_name='affiliate_referrals')
    
    # UTM/Cookie tracking
    utm_source = models.CharField(max_length=255, blank=True)
    utm_medium = models.CharField(max_length=255, blank=True)
    utm_campaign = models.CharField(max_length=255, blank=True)
    cookie_expires_at = models.DateTimeField(null=True, blank=True,
                                           help_text='When the referral cookie expires (typically 30 days)')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['affiliate', 'status']),
            models.Index(fields=['referral_code']),
            models.Index(fields=['referred_user', '-created_at']),
            models.Index(fields=['status', '-created_at']),
        ]
        verbose_name = "Referral"
        verbose_name_plural = "Referrals"
    
    def __str__(self):
        return f"{self.affiliate.affiliate_code} -> {self.referral_code}"


class Commission(models.Model):
    """Track commissions earned from conversions"""
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('paid', 'Paid'),
        ('cancelled', 'Cancelled'),
    )
    
    affiliate = models.ForeignKey(Affiliate, on_delete=models.CASCADE, related_name='commissions')
    referral = models.ForeignKey(Referral, on_delete=models.CASCADE, related_name='commissions')
    subscription = models.ForeignKey('financials.UserSubscription', on_delete=models.CASCADE,
                                    related_name='affiliate_commissions')
    
    # Commission calculation
    subscription_amount = models.DecimalField(max_digits=10, decimal_places=2,
                                             help_text='Amount of subscription that generated commission')
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2,
                                         help_text='Commission rate at time of conversion')
    commission_amount = models.DecimalField(max_digits=10, decimal_places=2,
                                          help_text='Calculated commission amount')
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Payout tracking
    payout = models.ForeignKey('AffiliatePayout', on_delete=models.SET_NULL, null=True, blank=True,
                              related_name='commissions')
    paid_at = models.DateTimeField(null=True, blank=True)
    
    # Notes
    notes = models.TextField(blank=True, help_text='Admin notes about this commission')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name='approved_commissions')
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['affiliate', 'status']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['subscription']),
        ]
        verbose_name = "Commission"
        verbose_name_plural = "Commissions"
    
    def __str__(self):
        return f"{self.affiliate.affiliate_code} - ${self.commission_amount} - {self.status}"


class AffiliatePayout(models.Model):
    """Track commission payouts to affiliates"""
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    )
    
    affiliate = models.ForeignKey(Affiliate, on_delete=models.CASCADE, related_name='payouts')
    
    # Amount
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='USD')
    
    # Payment details
    payout_method = models.CharField(max_length=50, help_text='PayPal, Stripe, Bank Transfer, etc.')
    payout_reference = models.CharField(max_length=255, blank=True, 
                                       help_text='Transaction ID or reference number from payment provider')
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    paid_at = models.DateTimeField(null=True, blank=True)
    
    # Period
    period_start = models.DateTimeField(help_text='Start of commission period')
    period_end = models.DateTimeField(help_text='End of commission period')
    
    # Notes
    notes = models.TextField(blank=True, help_text='Admin notes about this payout')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='processed_payouts')
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['affiliate', 'status']),
            models.Index(fields=['status', '-created_at']),
        ]
        verbose_name = "Affiliate Payout"
        verbose_name_plural = "Affiliate Payouts"
    
    def __str__(self):
        return f"{self.affiliate.affiliate_code} - ${self.total_amount} - {self.status}"
