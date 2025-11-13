from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

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
    
    def __str__(self):
        return f"{self.user.username} - {self.role}"
    
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
    brand = models.CharField(max_length=50, blank=True)
    last4 = models.CharField(max_length=4, blank=True)
    exp_month = models.PositiveSmallIntegerField(null=True, blank=True)
    exp_year = models.PositiveSmallIntegerField(null=True, blank=True)
    bank_name = models.CharField(max_length=100, blank=True)
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPE_CHOICES, blank=True)
    routing_last4 = models.CharField(max_length=4, blank=True)
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

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscriptions')
    plan_name = models.CharField(max_length=100)
    role = models.CharField(max_length=100, blank=True)
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