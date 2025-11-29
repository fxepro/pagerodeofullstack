"""
Admin interface for API monitoring
"""

from django.contrib import admin
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.utils.html import format_html
from .models import APIEndpoint, APICheck, APIAlert
from .utils import test_api_endpoint, discover_api_endpoints


@admin.register(APIEndpoint)
class APIEndpointAdmin(admin.ModelAdmin):
    list_display = ['name', 'url', 'method', 'expected_status_code', 'is_active', 'last_check_status', 'check_interval_minutes', 'created_at']
    list_filter = ['is_active', 'method', 'requires_auth']
    search_fields = ['name', 'url']
    readonly_fields = ['created_at', 'updated_at']
    actions = ['test_selected_apis', 'discover_apis']
    
    def discover_apis(self, request, queryset):
        """Discover APIs from base URL and create endpoints"""
        from django.contrib import messages
        from urllib.parse import urlparse
        
        if queryset.count() > 0:
            # Use first selected endpoint's base URL
            base_url = urlparse(queryset.first().url).scheme + '://' + urlparse(queryset.first().url).netloc
        else:
            messages.error(request, 'Please select an endpoint to discover APIs from its base URL')
            return
        
        discovered = discover_api_endpoints(base_url)
        created = 0
        
        for api in discovered:
            if api['found']:
                endpoint, created_flag = APIEndpoint.objects.get_or_create(
                    url=api['url'],
                    method=api['method'],
                    defaults={
                        'name': f"Discovered: {api['url']}",
                        'expected_status_code': api['status_code'],
                        'is_active': True
                    }
                )
                if created_flag:
                    created += 1
        
        messages.success(request, f'Discovered {len(discovered)} APIs, created {created} new endpoint(s)')
    discover_apis.short_description = 'Discover APIs from base URL'
    
    def last_check_status(self, obj):
        """Show last check status"""
        last_check = obj.checks.order_by('-checked_at').first()
        if last_check:
            if last_check.is_success:
                return format_html('<span style="color: green;">✅ {}ms</span>', int(last_check.response_time_ms))
            else:
                return format_html('<span style="color: red;">❌ {}</span>', last_check.status_code or 'Error')
        return format_html('<span style="color: gray;">Not checked</span>')
    last_check_status.short_description = 'Last Check'
    
    def test_selected_apis(self, request, queryset):
        """Test selected APIs"""
        for endpoint in queryset:
            test_api_endpoint(endpoint)
        self.message_user(request, f'Tested {queryset.count()} API(s)')
    test_selected_apis.short_description = 'Test selected APIs'
    
    def response_change(self, request, obj):
        """Add Test Now button"""
        if "_test_now" in request.POST:
            test_api_endpoint(obj)
            self.message_user(request, f'Tested {obj.name}')
            return HttpResponseRedirect(request.path)
        return super().response_change(request, obj)
    
    def changeform_view(self, request, object_id=None, form_url='', extra_context=None):
        extra_context = extra_context or {}
        extra_context['show_test_button'] = True
        return super().changeform_view(request, object_id, form_url, extra_context)
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'url', 'method', 'is_active')
        }),
        ('Monitoring Settings', {
            'fields': ('expected_status_code', 'timeout_seconds', 'check_interval_minutes')
        }),
        ('Authentication', {
            'fields': ('requires_auth', 'auth_token', 'headers')
        }),
        ('Request Body', {
            'fields': ('body',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(APICheck)
class APICheckAdmin(admin.ModelAdmin):
    list_display = ['endpoint', 'status_code', 'response_time_ms', 'is_success', 'checked_at']
    list_filter = ['is_success', 'checked_at', 'endpoint']
    search_fields = ['endpoint__name', 'endpoint__url', 'error_message']
    readonly_fields = ['endpoint', 'status_code', 'response_time_ms', 'is_success', 'response_body', 'error_message', 'checked_at']
    date_hierarchy = 'checked_at'
    
    def has_add_permission(self, request):
        return False  # Checks are created by monitoring system, not manually


@admin.register(APIAlert)
class APIAlertAdmin(admin.ModelAdmin):
    list_display = ['endpoint', 'alert_type', 'is_resolved', 'created_at', 'resolved_at']
    list_filter = ['is_resolved', 'alert_type', 'created_at']
    search_fields = ['endpoint__name', 'message']
    readonly_fields = ['endpoint', 'api_check', 'alert_type', 'message', 'created_at']
    date_hierarchy = 'created_at'
    
    actions = ['mark_resolved']
    
    def mark_resolved(self, request, queryset):
        from django.utils import timezone
        updated = queryset.filter(is_resolved=False).update(
            is_resolved=True,
            resolved_at=timezone.now()
        )
        self.message_user(request, f'{updated} alert(s) marked as resolved.')
    mark_resolved.short_description = 'Mark selected alerts as resolved'

