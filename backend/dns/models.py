from django.db import models

class DNSServerConfig(models.Model):
    name = models.CharField(max_length=100, help_text="Provider name (e.g., Google DNS)")
    server_ip = models.GenericIPAddressField(help_text="DNS server IP address")
    is_active = models.BooleanField(default=True, help_text="Enable/disable this DNS server")
    order = models.IntegerField(default=0, help_text="Display order (lower numbers first)")
    location = models.CharField(max_length=100, blank=True, help_text="Geographic location")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'dns_server_config'
        ordering = ['order', 'name']
        verbose_name = 'DNS Server'
        verbose_name_plural = 'DNS Servers'

    def __str__(self):
        status = "Active" if self.is_active else "Inactive"
        return f"{self.name} ({self.server_ip}) - {status}"

