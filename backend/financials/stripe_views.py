"""
Stripe Payment API Views

Handles Stripe checkout session creation, subscription management, and webhooks.
"""

import json
import logging
from decimal import Decimal
from datetime import timedelta
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone

from .models import UserSubscription, BillingTransaction, SubscriptionPlan, BillingAddress
from .stripe_service import StripeService

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_stripe_checkout(request):
    """Create a Stripe Checkout session for subscription payment"""
    try:
        plan_name = request.data.get('plan_name')
        billing_period = request.data.get('billing_period', 'monthly')
        
        if not plan_name:
            return Response(
                {'error': 'plan_name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get subscription plan
        try:
            subscription_plan = SubscriptionPlan.objects.get(plan_name=plan_name, is_active=True)
        except SubscriptionPlan.DoesNotExist:
            return Response(
                {'error': f'Plan "{plan_name}" not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get Stripe price ID
        stripe_price_id = subscription_plan.get_stripe_plan_id(billing_period)
        if not stripe_price_id:
            return Response(
                {'error': f'Stripe price ID not configured for {plan_name} ({billing_period})'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if Stripe is configured
        import os
        stripe_secret_key = os.getenv('STRIPE_SECRET_KEY')
        if not stripe_secret_key:
            logger.error("Stripe secret key not configured in environment variables")
            return Response(
                {
                    'error': 'Stripe is not configured. Please set STRIPE_SECRET_KEY in your environment variables.',
                    'details': 'Contact your administrator to configure Stripe integration.'
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        # Build return URLs
        base_url = request.build_absolute_uri('/').rstrip('/')
        success_url = f"{base_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}&provider=stripe"
        cancel_url = f"{base_url}/checkout?plan={plan_name}&canceled=true"
        
        # Create checkout session in Stripe
        stripe_service = StripeService()
        
        metadata = {
            'user_id': str(request.user.id),
            'username': request.user.username,
            'plan_name': plan_name,
            'billing_period': billing_period,
        }
        
        try:
            checkout_session = stripe_service.create_checkout_session(
                price_id=stripe_price_id,
                customer_email=request.user.email,
                success_url=success_url,
                cancel_url=cancel_url,
                mode='subscription',
                metadata=metadata
            )
        except Exception as e:
            logger.error(f"Error creating Stripe checkout session: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to create Stripe checkout session', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        if not checkout_session:
            return Response(
                {'error': 'Failed to create Stripe checkout session'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Store session info in a pending transaction for tracking
        # The webhook will create the actual subscription
        try:
            BillingTransaction.objects.create(
                user=request.user,
                amount=subscription_plan.price_monthly if billing_period == 'monthly' else subscription_plan.price_yearly,
                currency='USD',
                payment_provider='stripe',
                transaction_type='subscription',
                status='pending',
                external_transaction_id=checkout_session.get('id'),
                metadata=json.dumps({
                    'plan_name': plan_name,
                    'billing_period': billing_period,
                    'stripe_session_id': checkout_session.get('id'),
                })
            )
        except Exception as e:
            logger.warning(f"Failed to create pending transaction record: {str(e)}")
        
        return Response({
            'checkout_session_id': checkout_session.get('id'),
            'url': checkout_session.get('url'),
            'message': 'Stripe checkout session created successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Unexpected error in create_stripe_checkout: {str(e)}", exc_info=True)
        return Response(
            {'error': 'An unexpected error occurred', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stripe_checkout_success(request):
    """Handle successful Stripe checkout return"""
    try:
        session_id = request.GET.get('session_id')
        
        if not session_id:
            return Response(
                {'error': 'session_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Retrieve checkout session from Stripe
        stripe_service = StripeService()
        session = stripe_service.get_checkout_session(session_id)
        
        if not session:
            return Response(
                {'error': 'Invalid checkout session'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if session belongs to current user
        metadata = session.get('metadata', {})
        if metadata.get('user_id') != str(request.user.id):
            return Response(
                {'error': 'Unauthorized access to checkout session'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # The webhook should have already processed the subscription
        # This endpoint just confirms the session was successful
        return Response({
            'success': True,
            'session_id': session_id,
            'message': 'Payment successful. Your subscription is being activated.'
        })
        
    except Exception as e:
        logger.error(f"Error in stripe_checkout_success: {str(e)}", exc_info=True)
        return Response(
            {'error': 'An unexpected error occurred', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@csrf_exempt
@require_http_methods(["POST"])
def stripe_webhook(request):
    """
    Handle Stripe webhook events
    
    This endpoint processes webhook events from Stripe:
    - checkout.session.completed: Payment successful
    - customer.subscription.created: Subscription created
    - customer.subscription.updated: Subscription updated
    - customer.subscription.deleted: Subscription canceled
    - invoice.payment_succeeded: Recurring payment succeeded
    - invoice.payment_failed: Recurring payment failed
    """
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    
    if not sig_header:
        logger.error("Stripe webhook missing signature header")
        return HttpResponse(status=400)
    
    stripe_service = StripeService()
    event = stripe_service.verify_webhook_signature(payload, sig_header)
    
    if not event:
        logger.error("Stripe webhook signature verification failed")
        return HttpResponse(status=400)
    
    event_type = event.get('type')
    event_data = event.get('data', {}).get('object', {})
    
    logger.info(f"Processing Stripe webhook event: {event_type}")
    
    try:
        if event_type == 'checkout.session.completed':
            # Payment successful, create subscription
            session = event_data
            metadata = session.get('metadata', {})
            user_id = metadata.get('user_id')
            plan_name = metadata.get('plan_name')
            billing_period = metadata.get('billing_period', 'monthly')
            subscription_id = session.get('subscription')
            customer_id = session.get('customer')
            
            if not user_id or not plan_name:
                logger.error(f"Missing metadata in checkout.session.completed: {metadata}")
                return HttpResponse(status=200)  # Return 200 to prevent retry
            
            try:
                from django.contrib.auth.models import User
                user = User.objects.get(id=int(user_id))
            except User.DoesNotExist:
                logger.error(f"User not found: {user_id}")
                return HttpResponse(status=200)
            
            # Get subscription plan
            try:
                subscription_plan = SubscriptionPlan.objects.get(plan_name=plan_name, is_active=True)
            except SubscriptionPlan.DoesNotExist:
                logger.error(f"Plan not found: {plan_name}")
                return HttpResponse(status=200)
            
            # Calculate subscription dates
            start_date = timezone.now()
            if billing_period == 'monthly':
                end_date = start_date + timedelta(days=30)
            else:  # annual
                end_date = start_date + timedelta(days=365)
            
            # Create or update subscription
            subscription, created = UserSubscription.objects.update_or_create(
                user=user,
                plan=subscription_plan,
                defaults={
                    'status': 'active',
                    'payment_provider': 'stripe',
                    'external_subscription_id': subscription_id,
                    'external_customer_id': customer_id,
                    'billing_period': billing_period,
                    'start_date': start_date,
                    'end_date': end_date,
                    'auto_renew': True,
                }
            )
            
            # Create billing transaction
            amount = subscription_plan.price_monthly if billing_period == 'monthly' else subscription_plan.price_yearly
            BillingTransaction.objects.create(
                user=user,
                subscription=subscription,
                amount=amount,
                currency='USD',
                payment_provider='stripe',
                transaction_type='subscription',
                status='completed',
                external_transaction_id=session.get('id'),
                processed_at=timezone.now(),
                metadata=json.dumps({
                    'stripe_session_id': session.get('id'),
                    'stripe_subscription_id': subscription_id,
                    'stripe_customer_id': customer_id,
                })
            )
            
            logger.info(f"Created subscription for user {user_id}: {subscription.id}")
        
        elif event_type == 'customer.subscription.updated':
            # Subscription updated (plan change, etc.)
            subscription_data = event_data
            subscription_id = subscription_data.get('id')
            
            try:
                subscription = UserSubscription.objects.get(external_subscription_id=subscription_id)
            except UserSubscription.DoesNotExist:
                logger.warning(f"Subscription not found: {subscription_id}")
                return HttpResponse(status=200)
            
            # Update subscription status
            stripe_status = subscription_data.get('status')
            if stripe_status == 'active':
                subscription.status = 'active'
            elif stripe_status == 'canceled':
                subscription.status = 'cancelled'
                subscription.auto_renew = False
            elif stripe_status == 'past_due':
                subscription.status = 'paused'
            
            subscription.save()
            logger.info(f"Updated subscription: {subscription_id}")
        
        elif event_type == 'customer.subscription.deleted':
            # Subscription canceled
            subscription_data = event_data
            subscription_id = subscription_data.get('id')
            
            try:
                subscription = UserSubscription.objects.get(external_subscription_id=subscription_id)
                subscription.status = 'cancelled'
                subscription.auto_renew = False
                subscription.save()
                logger.info(f"Cancelled subscription: {subscription_id}")
            except UserSubscription.DoesNotExist:
                logger.warning(f"Subscription not found: {subscription_id}")
        
        elif event_type == 'invoice.payment_succeeded':
            # Recurring payment succeeded
            invoice = event_data
            subscription_id = invoice.get('subscription')
            customer_id = invoice.get('customer')
            
            try:
                subscription = UserSubscription.objects.get(external_subscription_id=subscription_id)
            except UserSubscription.DoesNotExist:
                logger.warning(f"Subscription not found: {subscription_id}")
                return HttpResponse(status=200)
            
            # Create billing transaction
            amount = Decimal(str(invoice.get('amount_paid', 0))) / 100  # Stripe amounts are in cents
            BillingTransaction.objects.create(
                user=subscription.user,
                subscription=subscription,
                amount=amount,
                currency=invoice.get('currency', 'usd').upper(),
                payment_provider='stripe',
                transaction_type='recurring',
                status='completed',
                external_transaction_id=invoice.get('id'),
                processed_at=timezone.now(),
                metadata=json.dumps({
                    'stripe_invoice_id': invoice.get('id'),
                    'stripe_subscription_id': subscription_id,
                    'stripe_customer_id': customer_id,
                })
            )
            
            # Update subscription end date
            if subscription.billing_period == 'monthly':
                subscription.end_date = timezone.now() + timedelta(days=30)
            else:
                subscription.end_date = timezone.now() + timedelta(days=365)
            subscription.save()
            
            logger.info(f"Processed recurring payment for subscription: {subscription_id}")
        
        elif event_type == 'invoice.payment_failed':
            # Recurring payment failed
            invoice = event_data
            subscription_id = invoice.get('subscription')
            
            try:
                subscription = UserSubscription.objects.get(external_subscription_id=subscription_id)
                subscription.status = 'paused'
                subscription.save()
                
                # Create failed transaction record
                amount = Decimal(str(invoice.get('amount_due', 0))) / 100
                BillingTransaction.objects.create(
                    user=subscription.user,
                    subscription=subscription,
                    amount=amount,
                    currency=invoice.get('currency', 'usd').upper(),
                    payment_provider='stripe',
                    transaction_type='recurring',
                    status='failed',
                    external_transaction_id=invoice.get('id'),
                    metadata=json.dumps({
                        'stripe_invoice_id': invoice.get('id'),
                        'stripe_subscription_id': subscription_id,
                        'failure_reason': invoice.get('last_payment_error', {}).get('message', 'Unknown'),
                    })
                )
                
                logger.warning(f"Payment failed for subscription: {subscription_id}")
            except UserSubscription.DoesNotExist:
                logger.warning(f"Subscription not found: {subscription_id}")
        
        return HttpResponse(status=200)
        
    except Exception as e:
        logger.error(f"Error processing Stripe webhook event {event_type}: {str(e)}", exc_info=True)
        return HttpResponse(status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_stripe_subscription(request):
    """Cancel a Stripe subscription"""
    try:
        subscription_id = request.data.get('subscription_id')
        immediately = request.data.get('immediately', False)
        
        if not subscription_id:
            return Response(
                {'error': 'subscription_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get user's subscription
        try:
            subscription = UserSubscription.objects.get(
                user=request.user,
                external_subscription_id=subscription_id,
                payment_provider='stripe'
            )
        except UserSubscription.DoesNotExist:
            return Response(
                {'error': 'Subscription not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Cancel in Stripe
        stripe_service = StripeService()
        result = stripe_service.cancel_subscription(subscription_id, immediately=immediately)
        
        if not result:
            return Response(
                {'error': 'Failed to cancel subscription in Stripe'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Update local subscription
        if immediately:
            subscription.status = 'cancelled'
            subscription.auto_renew = False
        else:
            subscription.auto_renew = False
            # Status will be updated by webhook when period ends
        
        subscription.save()
        
        return Response({
            'success': True,
            'message': 'Subscription cancelled successfully',
            'cancelled_immediately': immediately
        })
        
    except Exception as e:
        logger.error(f"Error cancelling Stripe subscription: {str(e)}", exc_info=True)
        return Response(
            {'error': 'An unexpected error occurred', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_stripe_subscription(request, subscription_id):
    """Get Stripe subscription details"""
    try:
        # Verify subscription belongs to user
        try:
            subscription = UserSubscription.objects.get(
                user=request.user,
                external_subscription_id=subscription_id,
                payment_provider='stripe'
            )
        except UserSubscription.DoesNotExist:
            return Response(
                {'error': 'Subscription not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get from Stripe
        stripe_service = StripeService()
        stripe_subscription = stripe_service.get_subscription(subscription_id)
        
        if not stripe_subscription:
            return Response(
                {'error': 'Failed to retrieve subscription from Stripe'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response({
            'subscription': stripe_subscription,
            'local_subscription': {
                'id': subscription.id,
                'status': subscription.status,
                'plan_name': subscription.plan.plan_name,
                'billing_period': subscription.billing_period,
                'start_date': subscription.start_date,
                'end_date': subscription.end_date,
                'auto_renew': subscription.auto_renew,
            }
        })
        
    except Exception as e:
        logger.error(f"Error retrieving Stripe subscription: {str(e)}", exc_info=True)
        return Response(
            {'error': 'An unexpected error occurred', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_stripe_status(request):
    """Get Stripe connection status and configuration"""
    try:
        stripe_service = StripeService()
        
        is_configured = stripe_service.is_configured()
        mode = stripe_service.mode
        
        # Try to get account info to verify connection
        account_info = None
        if is_configured:
            try:
                import stripe
                account = stripe.Account.retrieve()
                account_info = {
                    'id': account.id,
                    'country': account.country,
                    'default_currency': account.default_currency,
                }
            except Exception as e:
                logger.warning(f"Could not retrieve Stripe account: {str(e)}")
        
        return Response({
            'configured': is_configured,
            'mode': mode,
            'account': account_info,
        })
        
    except Exception as e:
        logger.error(f"Error getting Stripe status: {str(e)}", exc_info=True)
        return Response(
            {'error': 'An unexpected error occurred', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_stripe_products(request):
    """Get all Stripe products and their prices"""
    try:
        stripe_service = StripeService()
        
        if not stripe_service.is_configured():
            return Response(
                {'error': 'Stripe is not configured'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        # Get products
        products = stripe_service.list_products()
        if products is None:
            return Response(
                {'error': 'Failed to fetch products from Stripe'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Get all prices
        prices = stripe_service.list_prices()
        if prices is None:
            return Response(
                {'error': 'Failed to fetch prices from Stripe'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Group prices by product
        prices_by_product = {}
        for price in prices:
            product_id = price.get('product')
            if product_id not in prices_by_product:
                prices_by_product[product_id] = []
            prices_by_product[product_id].append(price)
        
        # Combine products with their prices
        products_with_prices = []
        for product in products:
            product_id = product.get('id')
            product_prices = prices_by_product.get(product_id, [])
            
            products_with_prices.append({
                'id': product_id,
                'name': product.get('name'),
                'description': product.get('description'),
                'active': product.get('active'),
                'created': product.get('created'),
                'prices': product_prices,
            })
        
        return Response({
            'products': products_with_prices,
            'total_products': len(products_with_prices),
            'total_prices': len(prices),
        })
        
    except Exception as e:
        logger.error(f"Error getting Stripe products: {str(e)}", exc_info=True)
        return Response(
            {'error': 'An unexpected error occurred', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_subscription_plans_with_stripe(request):
    """Get all subscription plans with their Stripe price IDs"""
    try:
        plans = SubscriptionPlan.objects.filter(is_active=True).order_by('display_order', 'plan_name')
        
        plans_data = []
        for plan in plans:
            plans_data.append({
                'id': plan.id,
                'plan_name': plan.plan_name,
                'display_name': plan.display_name,
                'description': plan.description,
                'price_monthly': float(plan.price_monthly),
                'price_yearly': float(plan.price_yearly),
                'stripe_plan_id_monthly': plan.stripe_plan_id_monthly or '',
                'stripe_plan_id_annual': plan.stripe_plan_id_annual or '',
                'is_active': plan.is_active,
                'is_featured': plan.is_featured,
            })
        
        return Response({
            'plans': plans_data,
            'total': len(plans_data),
        })
        
    except Exception as e:
        logger.error(f"Error getting subscription plans: {str(e)}", exc_info=True)
        return Response(
            {'error': 'An unexpected error occurred', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

