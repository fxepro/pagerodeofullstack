"""
PayPal Payment API Views

Handles PayPal subscription creation, confirmation, and webhooks.
"""

import json
import logging
from datetime import datetime, timedelta
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.utils import timezone

from .models import UserSubscription, BillingTransaction, SubscriptionPlan, BillingAddress
from .paypal_service import PayPalService

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_paypal_status(request):
    """Get PayPal connection status and configuration with detailed account info"""
    try:
        paypal_service = PayPalService()
        
        is_configured = paypal_service.is_configured()
        mode = paypal_service.mode
        
        # Try to get detailed account info
        account_info = None
        merchant_info = None
        if is_configured:
            # Get access token to verify connection
            access_token = paypal_service.get_access_token()
            if access_token:
                # Get account/user info
                account_data = paypal_service.get_account_info()
                if account_data:
                    account_info = {
                        'connected': True,
                        'mode': mode,
                        'user_id': account_data.get('user_id'),
                        'name': account_data.get('name'),
                        'email': account_data.get('emails', [{}])[0].get('value') if account_data.get('emails') else None,
                        'verified': account_data.get('verified_account', False),
                    }
                
                # Get merchant integrations info
                merchant_data = paypal_service.get_merchant_integrations()
                if merchant_data:
                    merchant_info = {
                        'client_id': merchant_data.get('client_id'),
                        'mode': merchant_data.get('mode'),
                        'account_id': merchant_data.get('account_info', {}).get('user_id'),
                    }
        
        return Response({
            'configured': is_configured,
            'mode': mode,
            'account': account_info,
            'merchant': merchant_info,
        })
        
    except Exception as e:
        logger.error(f"Error getting PayPal status: {str(e)}", exc_info=True)
        return Response(
            {'error': 'An unexpected error occurred', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_paypal_products(request):
    """Get all PayPal products and their billing plans"""
    try:
        paypal_service = PayPalService()
        
        if not paypal_service.is_configured():
            return Response(
                {'error': 'PayPal is not configured'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        # Get products
        products_response = paypal_service.list_products(page_size=50)
        if products_response is None:
            return Response(
                {'error': 'Failed to fetch products from PayPal'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # PayPal API returns products in different structures
        # Check if it's a list or dict with 'products' key
        if isinstance(products_response, list):
            products = products_response
        elif isinstance(products_response, dict):
            products = products_response.get('products', [])
            # Also check for 'items' key (some PayPal endpoints use this)
            if not products and 'items' in products_response:
                products = products_response.get('items', [])
        else:
            products = []
        
        # Get all plans
        plans_response = paypal_service.list_plans(page_size=50)
        if plans_response is None:
            return Response(
                {'error': 'Failed to fetch plans from PayPal'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # PayPal API returns plans in different structures
        if isinstance(plans_response, list):
            plans = plans_response
        elif isinstance(plans_response, dict):
            plans = plans_response.get('plans', [])
            # Also check for 'items' key
            if not plans and 'items' in plans_response:
                plans = plans_response.get('items', [])
        else:
            plans = []
        
        # Group plans by product
        plans_by_product = {}
        for plan in plans:
            if not isinstance(plan, dict):
                continue
            product_id = plan.get('product_id')
            if product_id:
                if product_id not in plans_by_product:
                    plans_by_product[product_id] = []
                plans_by_product[product_id].append(plan)
        
        # Combine products with their plans
        products_with_plans = []
        for product in products:
            if not isinstance(product, dict):
                continue
            product_id = product.get('id')
            if not product_id:
                continue
                
            product_plans = plans_by_product.get(product_id, [])
            
            products_with_plans.append({
                'id': product_id,
                'name': product.get('name', ''),
                'description': product.get('description', ''),
                'type': product.get('type', ''),
                'category': product.get('category', ''),
                'create_time': product.get('create_time', ''),
                'update_time': product.get('update_time', ''),
                'plans': product_plans,
            })
        
        return Response({
            'products': products_with_plans,
            'total_products': len(products_with_plans),
            'total_plans': len(plans),
        })
        
    except Exception as e:
        logger.error(f"Error getting PayPal products: {str(e)}", exc_info=True)
        return Response(
            {'error': 'An unexpected error occurred', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_subscription_plans_with_paypal(request):
    """Get all subscription plans with their PayPal plan IDs"""
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
                'paypal_plan_id_monthly': plan.paypal_plan_id_monthly or '',
                'paypal_plan_id_annual': plan.paypal_plan_id_annual or '',
                'paypal_product_id': plan.paypal_product_id or '',
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_paypal_integration_details(request):
    """Get detailed PayPal integration information including app name, payment methods, etc."""
    try:
        paypal_service = PayPalService()
        
        if not paypal_service.is_configured():
            return Response(
                {'error': 'PayPal is not configured'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        # Get account info
        account_info = paypal_service.get_account_info()
        
        # Get merchant integrations
        merchant_info = paypal_service.get_merchant_integrations()
        
        # Get recent transactions to analyze payment methods
        from datetime import datetime, timedelta
        end_date = datetime.utcnow().isoformat() + 'Z'
        start_date = (datetime.utcnow() - timedelta(days=30)).isoformat() + 'Z'
        
        transactions = paypal_service.list_transactions(
            start_date=start_date,
            end_date=end_date,
            page_size=10
        )
        
        # Analyze payment methods from transactions
        payment_methods_used = set()
        if transactions and 'transaction_details' in transactions:
            for tx in transactions.get('transaction_details', []):
                payment_method = tx.get('payment_method_type', 'UNKNOWN')
                payment_methods_used.add(payment_method)
        
        # Get app name from client ID (we'll use the client ID as identifier)
        app_name = f"PayPal App ({paypal_service.client_id[:8]}...)" if paypal_service.client_id else "Unknown"
        
        return Response({
            'app_name': app_name,
            'client_id': paypal_service.client_id,
            'mode': paypal_service.mode,
            'account': account_info,
            'merchant': merchant_info,
            'payment_methods_available': list(payment_methods_used) if payment_methods_used else ['PAYPAL', 'CARD'],
            'recent_transactions_count': len(transactions.get('transaction_details', [])) if transactions else 0,
        })
        
    except Exception as e:
        logger.error(f"Error getting PayPal integration details: {str(e)}", exc_info=True)
        return Response(
            {'error': 'An unexpected error occurred', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_paypal_subscription(request):
    """Create a PayPal subscription order"""
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
        
        # Get PayPal plan ID
        paypal_plan_id = subscription_plan.get_paypal_plan_id(billing_period)
        if not paypal_plan_id:
            return Response(
                {'error': f'PayPal plan ID not configured for {plan_name} ({billing_period})'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Build return URLs
        base_url = request.build_absolute_uri('/').rstrip('/')
        return_url = f"{base_url}/checkout/success"
        cancel_url = f"{base_url}/checkout?plan={plan_name}&canceled=true"
        
        # Create subscription in PayPal
        paypal_service = PayPalService()
        paypal_response = paypal_service.create_subscription(
            plan_id=paypal_plan_id,
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
        price = subscription_plan.price_monthly if billing_period == 'monthly' else subscription_plan.price_yearly
        
        subscription = UserSubscription.objects.create(
            user=request.user,
            plan_name=plan_name,
            role=subscription_plan.role or '',
            price_monthly=subscription_plan.price_monthly,
            price_yearly=subscription_plan.price_yearly,
            billing_period=billing_period,
            start_date=timezone.now().date(),
            is_recurring=True,
            status='pending',
            paypal_subscription_id=subscription_id,
            paypal_plan_id=paypal_plan_id,
            paypal_product_id=subscription_plan.paypal_product_id,
            paypal_status='APPROVAL_PENDING'
        )
        
        return Response({
            'subscriptionID': subscription_id,
            'approval_url': approval_url,
            'subscription_id': subscription.id,
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Error creating PayPal subscription: {str(e)}", exc_info=True)
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_paypal_subscription(request):
    """Confirm a PayPal subscription after user approval"""
    try:
        subscription_id = request.data.get('subscriptionID')
        plan_name = request.data.get('plan_name')
        
        if not subscription_id:
            return Response(
                {'error': 'subscriptionID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get subscription from database
        try:
            subscription = UserSubscription.objects.get(
                paypal_subscription_id=subscription_id,
                user=request.user
            )
        except UserSubscription.DoesNotExist:
            return Response(
                {'error': 'Subscription not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get subscription details from PayPal
        paypal_service = PayPalService()
        paypal_subscription = paypal_service.get_subscription(subscription_id)
        
        if not paypal_subscription:
            return Response(
                {'error': 'Failed to get subscription details from PayPal'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Update subscription status
        paypal_status = paypal_subscription.get('status', '')
        subscription.paypal_status = paypal_status
        
        if paypal_status == 'ACTIVE':
            subscription.status = 'active'
            # Calculate end date based on billing period
            if subscription.billing_period == 'monthly':
                subscription.end_date = (timezone.now() + timedelta(days=30)).date()
            else:
                subscription.end_date = (timezone.now() + timedelta(days=365)).date()
        
        # Update billing schedule info
        billing_info = paypal_subscription.get('billing_info', {})
        next_billing_time = billing_info.get('next_billing_time')
        if next_billing_time:
            try:
                subscription.next_billing_date = datetime.fromisoformat(
                    next_billing_time.replace('Z', '+00:00')
                )
            except:
                pass
        
        subscription.save()
        
        # Extract billing address if available
        payer_info = paypal_subscription.get('subscriber', {}).get('payer_info', {})
        if payer_info:
            try:
                billing_address, created = BillingAddress.objects.update_or_create(
                    user=request.user,
                    subscription=subscription,
                    defaults={
                        'first_name': payer_info.get('given_name', ''),
                        'last_name': payer_info.get('surname', ''),
                        'email': payer_info.get('email_address', request.user.email),
                        'address_line1': payer_info.get('address', {}).get('address_line_1', ''),
                        'address_line2': payer_info.get('address', {}).get('address_line_2', ''),
                        'city': payer_info.get('address', {}).get('admin_area_2', ''),
                        'state': payer_info.get('address', {}).get('admin_area_1', ''),
                        'postal_code': payer_info.get('address', {}).get('postal_code', ''),
                        'country': payer_info.get('address', {}).get('country_code', ''),
                        'payment_provider': 'paypal',
                        'is_default': True,
                        'is_active': True,
                        'last_used_at': timezone.now(),
                    }
                )
            except Exception as e:
                logger.warning(f"Failed to save billing address: {str(e)}")
        
        return Response({
            'success': True,
            'subscription_id': subscription.paypal_subscription_id,
            'plan_name': subscription.plan_name,
            'status': subscription.status,
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error confirming PayPal subscription: {str(e)}", exc_info=True)
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@csrf_exempt
@require_http_methods(["POST"])
def paypal_webhook(request):
    """Handle PayPal webhook events"""
    import os
    
    try:
        # Get webhook ID from environment
        webhook_id = os.getenv('PAYPAL_WEBHOOK_ID')
        if not webhook_id:
            logger.error("PAYPAL_WEBHOOK_ID not configured")
            return JsonResponse({'error': 'Webhook not configured'}, status=500)
        
        # Get request body
        body = request.body.decode('utf-8')
        headers = {k.upper().replace('-', '_'): v for k, v in request.headers.items()}
        
        # Verify webhook signature
        paypal_service = PayPalService()
        if not paypal_service.verify_webhook_signature(headers, body, webhook_id):
            logger.warning("PayPal webhook signature verification failed")
            return JsonResponse({'error': 'Invalid signature'}, status=401)
        
        # Parse webhook event
        event_data = json.loads(body)
        event_type = event_data.get('event_type')
        resource = event_data.get('resource', {})
        subscription_id = resource.get('id')
        
        if not subscription_id:
            logger.warning("No subscription ID in webhook event")
            return JsonResponse({'error': 'Invalid webhook data'}, status=400)
        
        # Get subscription from database
        try:
            subscription = UserSubscription.objects.get(paypal_subscription_id=subscription_id)
        except UserSubscription.DoesNotExist:
            logger.warning(f"Subscription {subscription_id} not found in database")
            return JsonResponse({'error': 'Subscription not found'}, status=404)
        
        # Handle different event types
        if event_type == 'BILLING.SUBSCRIPTION.ACTIVATED':
            subscription.status = 'active'
            subscription.paypal_status = 'ACTIVE'
            subscription.save()
            logger.info(f"Subscription {subscription_id} activated")
            
        elif event_type == 'BILLING.SUBSCRIPTION.CANCELLED':
            subscription.status = 'cancelled'
            subscription.paypal_status = 'CANCELLED'
            subscription.cancelled_at = timezone.now()
            subscription.save()
            logger.info(f"Subscription {subscription_id} cancelled")
            
        elif event_type == 'BILLING.SUBSCRIPTION.SUSPENDED':
            subscription.status = 'paused'
            subscription.paypal_status = 'SUSPENDED'
            subscription.save()
            logger.info(f"Subscription {subscription_id} suspended")
            
        elif event_type == 'BILLING.SUBSCRIPTION.EXPIRED':
            subscription.status = 'expired'
            subscription.paypal_status = 'EXPIRED'
            subscription.save()
            logger.info(f"Subscription {subscription_id} expired")
            
        elif event_type == 'PAYMENT.SALE.COMPLETED':
            # Create transaction record
            from decimal import Decimal
            amount_str = resource.get('amount', {}).get('total', '0')
            currency = resource.get('amount', {}).get('currency', 'USD')
            
            try:
                amount = Decimal(str(amount_str))
            except (ValueError, TypeError):
                amount = Decimal('0.00')
            
            BillingTransaction.objects.create(
                user=subscription.user,
                subscription=subscription,
                amount=amount,
                currency=currency,
                description=f"Subscription payment for {subscription.plan_name}",
                status='paid',
                payment_provider='paypal',
                paypal_transaction_id=resource.get('id', ''),
                paypal_sale_id=resource.get('id', ''),
                transaction_type='subscription',
                processed_at=timezone.now(),
            )
            logger.info(f"Payment completed for subscription {subscription_id}")
            
        elif event_type == 'PAYMENT.SALE.DENIED':
            # Record failed payment
            from decimal import Decimal
            amount_str = resource.get('amount', {}).get('total', '0')
            currency = resource.get('amount', {}).get('currency', 'USD')
            
            try:
                amount = Decimal(str(amount_str))
            except (ValueError, TypeError):
                amount = Decimal('0.00')
            
            BillingTransaction.objects.create(
                user=subscription.user,
                subscription=subscription,
                amount=amount,
                currency=currency,
                description=f"Failed payment for {subscription.plan_name}",
                status='failed',
                payment_provider='paypal',
                paypal_transaction_id=resource.get('id', ''),
                transaction_type='subscription',
                processed_at=timezone.now(),
            )
            logger.warning(f"Payment denied for subscription {subscription_id}")
        
        return JsonResponse({'status': 'success'}, status=200)
        
    except json.JSONDecodeError:
        logger.error("Invalid JSON in webhook payload")
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        logger.error(f"Error processing PayPal webhook: {str(e)}", exc_info=True)
        return JsonResponse({'error': str(e)}, status=500)

