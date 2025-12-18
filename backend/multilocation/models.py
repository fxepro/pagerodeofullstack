from django.db import models


class Location(models.Model):
    """AWS Lightsail region locations for PageSpeed/Lighthouse runners"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('pending', 'Pending'),
        ('error', 'Error'),
    ]
    
    name = models.CharField(max_length=255, help_text='Location name (e.g., US East (N. Virginia))')
    region_code = models.CharField(max_length=50, unique=True, help_text='AWS region code (e.g., us-east-1)')
    region_id = models.CharField(max_length=50, help_text='Region identifier')
    country = models.CharField(max_length=100, help_text='Country name')
    continent = models.CharField(max_length=50, help_text='Continent name')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', help_text='Location status')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['continent', 'country', 'name']
        verbose_name = 'Location'
        verbose_name_plural = 'Locations'
        indexes = [
            models.Index(fields=['region_code']),
            models.Index(fields=['status']),
            models.Index(fields=['continent']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.region_code})"


class RunnerHealth(models.Model):
    """Health monitoring data for Lighthouse Runner instances"""
    STATUS_CHOICES = [
        ('ok', 'OK'),
        ('warning', 'Warning'),
        ('down', 'Down'),
    ]
    
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='runner_health', help_text='Associated location')
    runner_id = models.CharField(max_length=255, unique=True, help_text='Internal runner identifier (e.g., runner-usw1-001)')
    region = models.CharField(max_length=50, help_text='AWS region code (e.g., us-west-1)')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='down', help_text='Overall health status')
    can_accept_jobs = models.BooleanField(default=False, help_text='Can this runner run Lighthouse now?')
    cpu_load = models.FloatField(null=True, blank=True, help_text='CPU load average')
    memory_used_mb = models.IntegerField(null=True, blank=True, help_text='Memory used in MB')
    memory_total_mb = models.IntegerField(null=True, blank=True, help_text='Total memory in MB')
    disk_free_mb = models.IntegerField(null=True, blank=True, help_text='Available disk space in MB')
    latency_ms = models.IntegerField(null=True, blank=True, help_text='Response time to orchestrator in milliseconds')
    current_jobs_running = models.IntegerField(default=0, help_text='Number of current jobs running')
    last_lighthouse_run_sec = models.IntegerField(null=True, blank=True, help_text='Seconds since last successful Lighthouse job')
    updated_at = models.DateTimeField(auto_now=True, help_text='Last health check timestamp')
    
    class Meta:
        ordering = ['-updated_at']
        verbose_name = 'Runner Health'
        verbose_name_plural = 'Runner Health Records'
        indexes = [
            models.Index(fields=['runner_id']),
            models.Index(fields=['status']),
            models.Index(fields=['can_accept_jobs']),
            models.Index(fields=['location', 'status']),
            models.Index(fields=['updated_at']),
        ]
    
    def __str__(self):
        return f"{self.runner_id} - {self.status}"
