from django.contrib import admin
from .models import DNSServerConfig

@admin.register(DNSServerConfig)
class DNSServerConfigAdmin(admin.ModelAdmin):
    list_display = ['name', 'server_ip', 'is_active', 'order', 'location']
    list_editable = ['is_active', 'order']
    list_filter = ['is_active']
    search_fields = ['name', 'server_ip', 'location']
    ordering = ['order', 'name']

