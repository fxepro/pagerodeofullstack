"""
Promotional Deal API Views
"""

import logging
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from .models import PromotionalDeal, UserSubscription
from .paypal_service import PayPalService
from .paypal_views import confirm_paypal_subscription

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])
def list_active_deals(request):
    """List all active promotional deals (public endpoint)"""
    try:
        now = timezone.now()
        deals = PromotionalDeal.objects.filter(
            is_active=True,
            start_date__lte=now,
            end_date__gte=now
        ).select_related('base_plan').order_by('-display_priority', '-discount_percentage', '-start_date')
        
        # Filter by validity
        valid_deals = [deal for deal in deals if deal.is_valid()]
        
        deals_data = []
        for deal in valid_deals:
            deals_data.append({
                'id': deal.id,
                'name': deal.name,
                'slug': deal.slug,
                'description': deal.description,
                'base_plan': {
                    'name': deal.base_plan.plan_name,
                    'display_name': deal.base_plan.display_name,
                },
                'discount_percentage': float(deal.discount_percentage),
                'original_price': float(deal.original_price),
                'deal_price': float(deal.deal_price),
                'billing_period': deal.billing_period,
                'start_date': deal.start_date.isoformat(),
                'end_date': deal.end_date.isoformat(),
                'badge_text': deal.badge_text,
                'featured': deal.featured,
                'max_redemptions': deal.max_redemptions,
                'current_redemptions': deal.current_redemptions,
                'is_valid': deal.is_valid(),
            })
        
        return Response({
            'deals': deals_data,
            'count': len(deals_data)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error listing active deals: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Failed to fetch deals'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def get_deal_by_slug(request, slug):
    """Get deal details by slug (public endpoint)"""
    try:
        deal = get_object_or_404(PromotionalDeal, slug=slug, is_active=True)
        
        if not deal.is_valid():
            return Response(
                {'error': 'Deal is not currently valid'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        deal_data = {
            'id': deal.id,
            'name': deal.name,
            'slug': deal.slug,
            'description': deal.description,
            'base_plan': {
                'name': deal.base_plan.plan_name,
                'display_name': deal.base_plan.display_name,
                'description': deal.base_plan.description,
            },
            'discount_percentage': float(deal.discount_percentage),
            'original_price': float(deal.original_price),
            'deal_price': float(deal.deal_price),
            'billing_period': deal.billing_period,
            'start_date': deal.start_date.isoformat(),
            'end_date': deal.end_date.isoformat(),
            'badge_text': deal.badge_text,
            'featured': deal.featured,
            'max_redemptions': deal.max_redemptions,
            'current_redemptions': deal.current_redemptions,
            'is_valid': deal.is_valid(),
        }
        
        return Response(deal_data, status=status.HTTP_200_OK)
        
    except PromotionalDeal.DoesNotExist:
        return Response(
            {'error': 'Deal not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error getting deal by slug: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Failed to fetch deal'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def get_featured_deal(request):
    """Get the currently featured deal for homepage banner"""
    try:
        now = timezone.now()
        featured_deal = PromotionalDeal.objects.filter(
            featured=True,
            is_active=True,
            start_date__lte=now,
            end_date__gte=now
        ).select_related('base_plan').order_by('-display_priority', '-discount_percentage', '-start_date').first()
        
        if not featured_deal or not featured_deal.is_valid():
            return Response({
                'deal': None,
                'has_deal': False
            }, status=status.HTTP_200_OK)
        
        deal_data = {
            'id': featured_deal.id,
            'name': featured_deal.name,
            'slug': featured_deal.slug,
            'description': featured_deal.description,
            'base_plan': {
                'name': featured_deal.base_plan.plan_name,
                'display_name': featured_deal.base_plan.display_name,
            },
            'discount_percentage': float(featured_deal.discount_percentage),
            'original_price': float(featured_deal.original_price),
            'deal_price': float(featured_deal.deal_price),
            'billing_period': featured_deal.billing_period,
            'start_date': featured_deal.start_date.isoformat(),
            'end_date': featured_deal.end_date.isoformat(),
            'badge_text': featured_deal.badge_text,
            'max_redemptions': featured_deal.max_redemptions,
            'current_redemptions': featured_deal.current_redemptions,
        }
        
        return Response({
            'deal': deal_data,
            'has_deal': True
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting featured deal: {str(e)}", exc_info=True)
        return Response({
            'deal': None,
            'has_deal': False
        }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_deal_subscription(request):
    """Create a PayPal subscription for a promotional deal"""
    try:
        deal_slug = request.data.get('deal_slug')
        
        if not deal_slug:
            return Response(
                {'error': 'deal_slug is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get deal
        try:
            deal = PromotionalDeal.objects.select_related('base_plan').get(slug=deal_slug, is_active=True)
        except PromotionalDeal.DoesNotExist:
            return Response(
                {'error': f'Deal "{deal_slug}" not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Validate deal
        if not deal.is_valid():
            return Response(
                {'error': 'Deal is expired or no longer available'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check PayPal plan ID
        if not deal.paypal_plan_id:
            return Response(
                {'error': 'PayPal plan not configured for this deal'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Build return URLs
        base_url = request.build_absolute_uri('/').rstrip('/')
        return_url = f"{base_url}/checkout/success"
        cancel_url = f"{base_url}/checkout?deal={deal_slug}&canceled=true"
        
        # Create subscription in PayPal
        paypal_service = PayPalService()
        paypal_response = paypal_service.create_subscription(
            plan_id=deal.paypal_plan_id,
            return_url=return_url,
            cancel_url=cancel_url
        )
        
        if not paypal_response:
            return Response(
                {'error': 'Failed to create PayPal subscription'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        subscription_id = paypal_response.get('id')
        links = paypal_response.get('links', [])
        approval_url = None
        
        for link in links:
            if link.get('rel') == 'approve':
                approval_url = link.get('href')
                break
        
        if not approval_url:
            return Response(
                {'error': 'No approval URL in PayPal response'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Create subscription record in database (pending status)
        price_monthly = deal.deal_price if deal.billing_period == 'monthly' else deal.base_plan.price_monthly
        price_yearly = deal.deal_price if deal.billing_period == 'annual' else deal.base_plan.price_yearly
        
        subscription = UserSubscription.objects.create(
            user=request.user,
            plan_name=deal.base_plan.plan_name,
            role=deal.base_plan.role or '',
            price_monthly=price_monthly,
            price_yearly=price_yearly,
            billing_period=deal.billing_period,
            start_date=timezone.now().date(),
            is_recurring=True,
            status='pending',
            paypal_subscription_id=subscription_id,
            paypal_plan_id=deal.paypal_plan_id,
            paypal_product_id=deal.paypal_product_id or deal.base_plan.paypal_product_id,
            paypal_status='APPROVAL_PENDING',
            promotional_deal=deal,
            deal_redeemed_at=timezone.now()
        )
        
        return Response({
            'subscriptionID': subscription_id,
            'approval_url': approval_url,
            'subscription_id': subscription.id,
            'deal_slug': deal_slug,
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Error creating deal subscription: {str(e)}", exc_info=True)
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_deal_subscription(request):
    """Confirm a deal subscription after user approval (reuses regular confirm logic)"""
    try:
        subscription_id = request.data.get('subscriptionID')
        deal_slug = request.data.get('deal_slug')
        
        if not subscription_id:
            return Response(
                {'error': 'subscriptionID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get subscription from database
        try:
            subscription = UserSubscription.objects.select_related('promotional_deal').get(
                paypal_subscription_id=subscription_id,
                user=request.user
            )
        except UserSubscription.DoesNotExist:
            return Response(
                {'error': 'Subscription not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Confirm subscription (reuse existing logic)
        # We'll modify the confirm endpoint to handle deals
        from .paypal_views import confirm_paypal_subscription as confirm_subscription
        
        # Create a mock request object with the subscription data
        confirm_request = type('obj', (object,), {
            'data': {
                'subscriptionID': subscription_id,
                'plan_name': subscription.plan_name,
            },
            'user': request.user
        })()
        
        # Call the confirm endpoint logic
        paypal_service = PayPalService()
        paypal_subscription = paypal_service.get_subscription(subscription_id)
        
        if not paypal_subscription:
            return Response(
                {'error': 'Failed to get subscription details from PayPal'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Update subscription status
        from datetime import timedelta
        paypal_status = paypal_subscription.get('status', '')
        subscription.paypal_status = paypal_status
        
        if paypal_status == 'ACTIVE':
            subscription.status = 'active'
            if subscription.billing_period == 'monthly':
                subscription.end_date = (timezone.now() + timedelta(days=30)).date()
            else:
                subscription.end_date = (timezone.now() + timedelta(days=365)).date()
            
            # Increment deal redemption count
            if subscription.promotional_deal:
                subscription.promotional_deal.current_redemptions += 1
                subscription.promotional_deal.save()
        
        # Update billing schedule info
        billing_info = paypal_subscription.get('billing_info', {})
        next_billing_time = billing_info.get('next_billing_time')
        if next_billing_time:
            try:
                from datetime import datetime
                subscription.next_billing_date = datetime.fromisoformat(
                    next_billing_time.replace('Z', '+00:00')
                )
            except:
                pass
        
        subscription.save()
        
        return Response({
            'success': True,
            'subscription_id': subscription.paypal_subscription_id,
            'plan_name': subscription.plan_name,
            'status': subscription.status,
            'deal_slug': subscription.promotional_deal.slug if subscription.promotional_deal else None,
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error confirming deal subscription: {str(e)}", exc_info=True)
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

