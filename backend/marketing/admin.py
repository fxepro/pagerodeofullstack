from django.contrib import admin
from .models import PromotionalDeal


@admin.register(PromotionalDeal)
class PromotionalDealAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'slug', 'base_plan', 'discount_percentage', 'deal_price',
        'billing_period', 'start_date', 'end_date', 'is_active', 'featured',
        'current_redemptions', 'max_redemptions', 'display_priority'
    ]
    list_filter = ['is_active', 'featured', 'billing_period', 'start_date', 'end_date']
    search_fields = ['name', 'slug', 'description']
    readonly_fields = ['current_redemptions', 'created_at', 'updated_at']
    prepopulated_fields = {'slug': ('name',)}
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'description')
        }),
        ('Deal Configuration', {
            'fields': ('base_plan', 'discount_percentage', 'original_price', 'deal_price', 'billing_period')
        }),
        ('Payment Provider Integration', {
            'fields': (
                ('paypal_plan_id', 'paypal_product_id'),
                ('stripe_plan_id', 'stripe_product_id'),
                'coinbase_plan_id'
            ),
            'classes': ('collapse',)
        }),
        ('Timing', {
            'fields': ('start_date', 'end_date', 'is_active')
        }),
        ('Tracking', {
            'fields': ('max_redemptions', 'current_redemptions')
        }),
        ('Display', {
            'fields': ('badge_text', 'featured', 'display_priority')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

