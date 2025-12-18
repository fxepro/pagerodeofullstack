"""
Coinbase Commerce Payment API Views

Handles Coinbase charge creation, confirmation, and webhooks.
"""

import json
import logging
from decimal import Decimal
from datetime import timedelta
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone

from .models import UserSubscription, SubscriptionPlan, BillingAddress, CoinbaseCharge, CoinbaseTransaction
from .coinbase_service import CoinbaseService

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_coinbase_charge(request):
    """Create a Coinbase Commerce charge for subscription payment"""
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
        
        # Get price
        price = subscription_plan.price_monthly if billing_period == 'monthly' else subscription_plan.price_yearly
        if not price:
            return Response(
                {'error': f'Price not configured for {plan_name} ({billing_period})'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if Coinbase is configured
        import os
        coinbase_api_key = os.getenv('COINBASE_API_KEY')
        if not coinbase_api_key:
            logger.error("Coinbase API key not configured in environment variables")
            return Response(
                {
                    'error': 'Coinbase Commerce is not configured. Please set COINBASE_API_KEY in your environment variables.',
                    'details': 'Contact your administrator to configure Coinbase Commerce integration.'
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        # Create charge in Coinbase Commerce
        coinbase_service = CoinbaseService()
        
        charge_name = f"{plan_name} Subscription ({billing_period.capitalize()})"
        charge_description = f"Payment for {plan_name} subscription - {billing_period} billing"
        
        # Build return URLs
        base_url = request.build_absolute_uri('/').rstrip('/')
        return_url = f"{base_url}/checkout/success?provider=coinbase"
        cancel_url = f"{base_url}/checkout?plan={plan_name}&canceled=true"
        
        metadata = {
            'user_id': str(request.user.id),
            'username': request.user.username,
            'plan_name': plan_name,
            'billing_period': billing_period,
            'return_url': return_url
        }
        
        try:
            charge = coinbase_service.create_charge(
                amount=str(price),
                currency='USD',
                name=charge_name,
                description=charge_description,
                metadata=metadata,
                redirect_url=return_url,
                cancel_url=cancel_url
            )
        except Exception as e:
            logger.error(f"Error creating Coinbase charge: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Failed to create Coinbase charge: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        if not charge:
            logger.error("Coinbase charge creation returned None - check API key configuration or Coinbase API status")
            return Response(
                {
                    'error': 'Failed to create Coinbase charge. This may be due to:',
                    'details': [
                        'Invalid or missing API key',
                        'Coinbase API is temporarily unavailable',
                        'Network connectivity issues'
                    ],
                    'suggestion': 'Please try again later or contact support if the issue persists.'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        charge_id = charge.get('id')
        charge_code = charge.get('code')
        hosted_url = charge.get('hosted_url')
        expires_at_str = charge.get('expires_at')
        
        # Validate required fields
        if not charge_id:
            logger.error("Coinbase charge response missing 'id' field")
            return Response(
                {'error': 'Invalid response from Coinbase API: missing charge ID'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        if not hosted_url:
            logger.error("Coinbase charge response missing 'hosted_url' field")
            return Response(
                {'error': 'Invalid response from Coinbase API: missing hosted URL'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Parse expires_at if provided
        expires_at = None
        if expires_at_str:
            try:
                from datetime import datetime
                # Try ISO format first
                expires_at = datetime.fromisoformat(expires_at_str.replace('Z', '+00:00'))
            except:
                try:
                    # Fallback to dateutil if available
                    from dateutil import parser
                    expires_at = parser.parse(expires_at_str)
                except:
                    pass
        
        # Create subscription record (pending)
        try:
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
            )
        except Exception as e:
            logger.error(f"Error creating subscription: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Failed to create subscription: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Create Coinbase charge record
        try:
            coinbase_charge = CoinbaseCharge.objects.create(
                user=request.user,
                subscription=subscription,
                charge_id=charge_id,
                charge_code=charge_code or '',
                hosted_url=hosted_url,
                name=charge_name,
                description=charge_description,
                amount_usd=price,
                currency='USD',
                status='pending',
                pricing_type='fixed_price',
                redirect_url=return_url,
                cancel_url=cancel_url,
                metadata=metadata,
                expires_at=expires_at,
            )
        except Exception as e:
            logger.error(f"Error creating CoinbaseCharge: {str(e)}", exc_info=True)
            # Clean up subscription if charge creation fails
            subscription.delete()
            return Response(
                {'error': f'Failed to save charge to database: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response({
            'charge_id': charge_id,
            'charge_code': charge_code,
            'hosted_url': hosted_url,
            'charge_db_id': coinbase_charge.id,
            'subscription_id': subscription.id,
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Error creating Coinbase charge: {str(e)}", exc_info=True)
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_coinbase_charge(request):
    """Confirm a Coinbase charge after payment"""
    try:
        charge_id = request.data.get('charge_id')
        
        if not charge_id:
            return Response(
                {'error': 'charge_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get charge from database
        try:
            coinbase_charge = CoinbaseCharge.objects.get(
                charge_id=charge_id,
                user=request.user
            )
        except CoinbaseCharge.DoesNotExist:
            return Response(
                {'error': 'Charge not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get charge details from Coinbase
        coinbase_service = CoinbaseService()
        charge = coinbase_service.get_charge(charge_id)
        
        if not charge:
            return Response(
                {'error': 'Failed to get charge details from Coinbase'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Update charge status from Coinbase
        charge_status = charge.get('timeline', [{}])[-1].get('status', '') if charge.get('timeline') else charge.get('status', 'pending')
        
        # Map Coinbase status to our status
        status_mapping = {
            'NEW': 'pending',
            'PENDING': 'pending',
            'COMPLETED': 'confirmed',
            'EXPIRED': 'expired',
            'CANCELED': 'canceled',
            'UNRESOLVED': 'delayed',
            'RESOLVED': 'confirmed',
        }
        
        coinbase_charge.status = status_mapping.get(charge_status.upper(), 'pending')
        coinbase_charge.save()
        
        # Check if there are any transactions for this charge
        transactions = coinbase_charge.transactions.filter(status='confirmed')
        
        if transactions.exists():
            # Payment confirmed - activate subscription
            if coinbase_charge.subscription:
                subscription = coinbase_charge.subscription
                subscription.status = 'active'
                if subscription.billing_period == 'monthly':
                    subscription.end_date = (timezone.now() + timedelta(days=30)).date()
                else:
                    subscription.end_date = (timezone.now() + timedelta(days=365)).date()
                subscription.save()
        
        return Response({
            'success': True,
            'charge_id': charge_id,
            'status': coinbase_charge.status,
            'subscription_id': coinbase_charge.subscription.id if coinbase_charge.subscription else None,
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error confirming Coinbase charge: {str(e)}", exc_info=True)
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@csrf_exempt
@require_http_methods(["POST"])
def coinbase_webhook(request):
    """Handle Coinbase Commerce webhook events"""
    try:
        # Get request body and signature
        body = request.body.decode('utf-8')
        signature = request.headers.get('X-CC-Webhook-Signature', '')
        
        if not signature:
            logger.warning("Missing Coinbase webhook signature")
            return JsonResponse({'error': 'Missing signature'}, status=401)
        
        # Verify webhook signature
        coinbase_service = CoinbaseService()
        if not coinbase_service.verify_webhook_signature(body, signature):
            logger.warning("Coinbase webhook signature verification failed")
            return JsonResponse({'error': 'Invalid signature'}, status=401)
        
        # Parse webhook event
        event_data = json.loads(body)
        event_type = event_data.get('type')
        charge_data = event_data.get('data', {})
        charge_id = charge_data.get('id')
        
        if not charge_id:
            logger.warning("No charge ID in webhook event")
            return JsonResponse({'error': 'Invalid webhook data'}, status=400)
        
        # Get charge from database
        try:
            coinbase_charge = CoinbaseCharge.objects.get(charge_id=charge_id)
        except CoinbaseCharge.DoesNotExist:
            logger.warning(f"Charge {charge_id} not found in database")
            return JsonResponse({'error': 'Charge not found'}, status=404)
        
        # Handle different event types
        if event_type == 'charge:confirmed':
            # Payment confirmed - create transaction record
            timeline = charge_data.get('timeline', [])
            
            # Find the payment transaction in timeline
            payment_data = None
            for event in timeline:
                if event.get('status') == 'COMPLETED' and event.get('payment'):
                    payment_data = event.get('payment', {})
                    break
            
            if payment_data:
                # Extract crypto payment details
                local_amount = payment_data.get('value', {})
                crypto_currency = local_amount.get('currency', '')
                crypto_amount = local_amount.get('amount', '0')
                
                # Get USD amount from charge
                amount_usd = coinbase_charge.amount_usd
                
                # Calculate exchange rate if possible
                exchange_rate = None
                if crypto_amount and amount_usd:
                    try:
                        from decimal import Decimal
                        exchange_rate = Decimal(str(amount_usd)) / Decimal(str(crypto_amount))
                    except:
                        pass
                
                # Extract blockchain details
                network = payment_data.get('network', '')
                transaction_hash = payment_data.get('transaction_id', '')
                
                # Create or update transaction
                transaction, created = CoinbaseTransaction.objects.update_or_create(
                    transaction_id=payment_data.get('transaction_id', charge_id),
                    defaults={
                        'charge': coinbase_charge,
                        'user': coinbase_charge.user,
                        'subscription': coinbase_charge.subscription,
                        'crypto_currency': crypto_currency,
                        'crypto_amount': crypto_amount,
                        'amount_usd': amount_usd,
                        'exchange_rate': exchange_rate,
                        'network': network,
                        'transaction_hash': transaction_hash,
                        'status': 'confirmed',
                        'timeline': timeline,
                        'processed_at': timezone.now(),
                    }
                )
                
                # Update charge status
                coinbase_charge.status = 'confirmed'
                coinbase_charge.save()
                
                # Activate subscription
                if coinbase_charge.subscription:
                    subscription = coinbase_charge.subscription
                    subscription.status = 'active'
                    if subscription.billing_period == 'monthly':
                        subscription.end_date = (timezone.now() + timedelta(days=30)).date()
                    else:
                        subscription.end_date = (timezone.now() + timedelta(days=365)).date()
                    subscription.save()
                
                logger.info(f"Charge {charge_id} confirmed - Transaction {transaction.transaction_id} created")
            else:
                # No payment data yet, just update charge status
                coinbase_charge.status = 'confirmed'
                coinbase_charge.save()
                logger.info(f"Charge {charge_id} confirmed (no payment data yet)")
            
        elif event_type == 'charge:failed':
            coinbase_charge.status = 'failed'
            coinbase_charge.save()
            logger.warning(f"Charge {charge_id} failed")
            
        elif event_type == 'charge:delayed':
            coinbase_charge.status = 'delayed'
            coinbase_charge.save()
            logger.warning(f"Charge {charge_id} delayed")
            
        elif event_type == 'charge:pending':
            coinbase_charge.status = 'pending'
            coinbase_charge.save()
            logger.info(f"Charge {charge_id} is pending")
            
        elif event_type == 'charge:expired':
            coinbase_charge.status = 'expired'
            coinbase_charge.save()
            logger.info(f"Charge {charge_id} expired")
            
        elif event_type == 'charge:canceled':
            coinbase_charge.status = 'canceled'
            coinbase_charge.save()
            logger.info(f"Charge {charge_id} canceled")
        
        return JsonResponse({'status': 'success'}, status=200)
        
    except json.JSONDecodeError:
        logger.error("Invalid JSON in webhook payload")
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        logger.error(f"Error processing Coinbase webhook: {str(e)}", exc_info=True)
        return JsonResponse({'error': str(e)}, status=500)

