from rest_framework import serializers
from .models import PromotionalDeal


class PromotionalDealSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromotionalDeal
        fields = [
            'id', 'name', 'slug', 'description', 'base_plan', 'discount_percentage',
            'original_price', 'deal_price', 'billing_period', 'paypal_plan_id',
            'paypal_product_id', 'stripe_plan_id', 'stripe_product_id', 'coinbase_plan_id',
            'start_date', 'end_date', 'is_active', 'max_redemptions', 'current_redemptions',
            'badge_text', 'featured', 'display_priority', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'current_redemptions', 'created_at', 'updated_at']

