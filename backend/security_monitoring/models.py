"""
Security Monitoring Models
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class SecurityAudit(models.Model):
    """
    Groups multiple security scans for a single URL into a comprehensive audit
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    target_url = models.URLField(max_length=500)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='security_audits')
    
    # Summary statistics
    total_scans = models.IntegerField(default=0)
    completed_scans = models.IntegerField(default=0)
    failed_scans = models.IntegerField(default=0)
    total_findings = models.IntegerField(default=0)
    critical_findings = models.IntegerField(default=0)
    high_findings = models.IntegerField(default=0)
    medium_findings = models.IntegerField(default=0)
    low_findings = models.IntegerField(default=0)
    informational_findings = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Security Audit'
        verbose_name_plural = 'Security Audits'
    
    def __str__(self):
        return f"Security Audit: {self.target_url} ({self.status})"
    
    def update_statistics(self):
        """Update statistics from related scans and findings"""
        scans = self.scans.all()
        self.total_scans = scans.count()
        self.completed_scans = scans.filter(status='completed').count()
        self.failed_scans = scans.filter(status='failed').count()
        
        # Get all findings from scans in this audit
        findings = SecurityFinding.objects.filter(scan__audit=self)
        self.total_findings = findings.count()
        self.critical_findings = findings.filter(severity='critical').count()
        self.high_findings = findings.filter(severity='high').count()
        self.medium_findings = findings.filter(severity='medium').count()
        self.low_findings = findings.filter(severity='low').count()
        self.informational_findings = findings.filter(severity='informational').count()
        self.save(update_fields=[
            'total_scans', 'completed_scans', 'failed_scans',
            'total_findings', 'critical_findings', 'high_findings',
            'medium_findings', 'low_findings', 'informational_findings'
        ])


class SecurityScan(models.Model):
    SCAN_TYPES = [
        ('dns_discovery', 'DNS/Subdomain Discovery'),
        ('port_scan', 'Port & Service Discovery'),
        ('vulnerability_scan', 'External Network / Host Vulnerability Scan'),
        ('dast', 'DAST (Automated Web App Scanning)'),
        ('misconfiguration_scan', 'Web-server Misconfiguration Scan'),
        ('ssl_check', 'TLS / SSL Configuration & Cert Checks'),
        ('cms_scan', 'CMS / Platform-specific Remote Scans'),
        ('sql_injection', 'SQL Injection / Targeted Exploit Checks'),
        ('headers_check', 'HTTP Security Headers & Basic Hardening Checks'),
        ('continuous_monitoring', 'Automated External Monitoring / Continuous Scanning'),
        ('manual_pentest', 'Manual Pentest Tools (Proxy & Manual Testing)'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    scan_type = models.CharField(max_length=50, choices=SCAN_TYPES)
    target_url = models.URLField(max_length=500)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    scheduled_at = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    tool_used = models.CharField(max_length=100, blank=True)  # e.g., 'OWASP ZAP', 'Nmap', 'amass'
    scan_config = models.JSONField(default=dict)  # Tool-specific configuration
    audit = models.ForeignKey('SecurityAudit', on_delete=models.SET_NULL, null=True, blank=True, related_name='scans')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='security_scans')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Security Scan'
        verbose_name_plural = 'Security Scans'
        indexes = [
            models.Index(fields=['status', '-created_at'], name='sec_scan_status_idx'),
            models.Index(fields=['scan_type', '-created_at'], name='sec_scan_type_idx'),
            models.Index(fields=['target_url', '-created_at'], name='sec_scan_target_idx'),
        ]
    
    def __str__(self):
        return f"{self.get_scan_type_display()} - {self.target_url} ({self.status})"


class SecurityFinding(models.Model):
    SEVERITY_CHOICES = [
        ('critical', 'Critical'),
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
        ('informational', 'Informational'),
    ]
    
    STATUS_CHOICES = [
        ('new', 'New'),
        ('confirmed', 'Confirmed'),
        ('false_positive', 'False Positive'),
        ('mitigated', 'Mitigated'),
        ('resolved', 'Resolved'),
    ]
    
    scan = models.ForeignKey(SecurityScan, on_delete=models.CASCADE, related_name='findings')
    title = models.CharField(max_length=255)
    description = models.TextField()
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    cve_id = models.CharField(max_length=50, blank=True)  # CVE identifier if applicable
    cvss_score = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    affected_url = models.URLField(blank=True, max_length=500)
    evidence = models.JSONField(default=dict)  # Tool-specific evidence data
    remediation = models.TextField(blank=True)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_findings')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-severity', '-created_at']
        verbose_name = 'Security Finding'
        verbose_name_plural = 'Security Findings'
        indexes = [
            models.Index(fields=['severity', '-created_at'], name='sec_find_severity_idx'),
            models.Index(fields=['status', '-created_at'], name='sec_find_status_idx'),
            models.Index(fields=['scan', '-created_at'], name='sec_find_scan_idx'),
        ]
    
    def __str__(self):
        return f"{self.severity.upper()}: {self.title}"


class SecurityScanSchedule(models.Model):
    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('on_demand', 'On Demand'),
    ]
    
    scan_type = models.CharField(max_length=50, choices=SecurityScan.SCAN_TYPES)
    target_url = models.URLField(max_length=500)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    enabled = models.BooleanField(default=True)
    tool_used = models.CharField(max_length=100)
    scan_config = models.JSONField(default=dict)
    last_run = models.DateTimeField(null=True, blank=True)
    next_run = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='security_schedules')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Security Scan Schedule'
        verbose_name_plural = 'Security Scan Schedules'
    
    def __str__(self):
        return f"{self.get_scan_type_display()} - {self.target_url} ({self.frequency})"


class SecurityTool(models.Model):
    """
    Security tools configuration and documentation
    """
    TOOL_TYPES = [
        ('builtin', 'Built-in (Python)'),
        ('external', 'External Binary'),
        ('api', 'API Service'),
    ]
    
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('configured', 'Configured'),
        ('not_installed', 'Not Installed'),
        ('error', 'Error'),
    ]
    
    CATEGORY_CHOICES = [
        ('site_audit', 'Site Audit'),
        ('security', 'Security'),
        ('api', 'API'),
        ('performance', 'Performance'),
    ]
    
    name = models.CharField(max_length=100, unique=True)  # e.g., 'OWASP ZAP', 'Nmap'
    tool_type = models.CharField(max_length=20, choices=TOOL_TYPES)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='security', help_text='Tool category for organization')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_installed')
    description = models.TextField(help_text='Tool description and purpose')
    installation_instructions = models.TextField(help_text='How to install this tool')
    command_template = models.CharField(max_length=500, blank=True, help_text='Command template for execution')
    executable_path = models.CharField(max_length=500, blank=True, help_text='Path to executable (if external)')
    api_key = models.CharField(max_length=500, blank=True, help_text='API key (if API service)')
    api_url = models.URLField(blank=True, help_text='API endpoint URL (if API service)')
    configuration = models.JSONField(default=dict, help_text='Additional configuration')
    supported_scan_types = models.JSONField(default=list, help_text='List of scan types this tool supports')
    documentation_url = models.URLField(blank=True, help_text='Link to tool documentation')
    is_active = models.BooleanField(default=False, help_text='Is this tool active and ready to use?')
    last_tested = models.DateTimeField(null=True, blank=True)
    test_result = models.TextField(blank=True, help_text='Result of last test')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = 'Security Tool'
        verbose_name_plural = 'Security Tools'
    
    def __str__(self):
        return f"{self.name} ({self.get_status_display()})"
