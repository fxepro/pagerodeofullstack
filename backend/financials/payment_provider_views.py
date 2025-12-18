"""
Payment Provider Configuration API Views

Handles getting and updating payment provider configurations (PayPal, Stripe, Coinbase).
"""

import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db.models import Sum, Count, Q

from .models import PaymentProviderConfig, BillingTransaction

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def get_payment_providers(request):
    """Get all payment provider configurations with statistics"""
    providers = PaymentProviderConfig.objects.all()
    
    provider_data = []
    for provider in providers:
        # Get statistics for this provider
        transactions = BillingTransaction.objects.filter(payment_provider=provider.provider)
        transactions_count = transactions.count()
        revenue = transactions.filter(status='paid').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        provider_data.append({
            'id': provider.provider,
            'name': provider.get_provider_display(),
            'status': 'connected' if provider.is_active else 'disconnected',
            'is_active': provider.is_active,
            'is_live': provider.is_live,
            'client_id': provider.client_id if provider.client_id else None,  # Only show if exists
            'webhook_url': provider.webhook_url,
            'last_sync': provider.last_sync_at.isoformat() if provider.last_sync_at else None,
            'transactions_count': transactions_count,
            'revenue': float(revenue),
            'created_at': provider.created_at.isoformat(),
            'updated_at': provider.updated_at.isoformat(),
        })
    
    # Ensure all providers exist in response (even if not configured)
    provider_ids = {p['id'] for p in provider_data}
    all_providers = ['stripe', 'coinbase', 'paypal']
    
    for provider_id in all_providers:
        if provider_id not in provider_ids:
            # For Stripe, check environment variables
            if provider_id == 'stripe':
                import os
                stripe_secret_key = os.getenv('STRIPE_SECRET_KEY')
                stripe_publishable_key = os.getenv('STRIPE_PUBLISHABLE_KEY') or os.getenv('STRIPE_PUBLIC_KEY')
                is_configured = bool(stripe_secret_key and stripe_publishable_key)
                
                provider_data.append({
                    'id': provider_id,
                    'name': provider_id.capitalize(),
                    'status': 'connected' if is_configured else 'disconnected',
                    'is_active': is_configured,
                    'is_live': os.getenv('STRIPE_MODE', 'test') == 'live',
                    'client_id': stripe_publishable_key[:20] + '...' if stripe_publishable_key else None,
                    'webhook_url': None,
                    'last_sync': None,
                    'transactions_count': 0,
                    'revenue': 0,
                })
            else:
                provider_data.append({
                    'id': provider_id,
                    'name': provider_id.capitalize(),
                    'status': 'disconnected',
                    'is_active': False,
                    'is_live': False,
                    'client_id': None,
                    'webhook_url': None,
                    'last_sync': None,
                    'transactions_count': 0,
                    'revenue': 0,
                })
    
    return Response(provider_data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def get_payment_provider(request, provider_id):
    """Get specific payment provider configuration"""
    try:
        provider = PaymentProviderConfig.objects.get(provider=provider_id)
        
        # Get statistics
        transactions = BillingTransaction.objects.filter(payment_provider=provider.provider)
        transactions_count = transactions.count()
        revenue = transactions.filter(status='paid').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        return Response({
            'id': provider.provider,
            'name': provider.get_provider_display(),
            'status': 'connected' if provider.is_active else 'disconnected',
            'is_active': provider.is_active,
            'is_live': provider.is_live,
            'client_id': provider.client_id,
            'client_secret': '***' if provider.client_secret else None,  # Mask secret
            'webhook_id': provider.webhook_id,
            'webhook_url': provider.webhook_url,
            'webhook_secret': '***' if provider.webhook_secret else None,  # Mask secret
            'config': provider.config,
            'last_sync': provider.last_sync_at.isoformat() if provider.last_sync_at else None,
            'transactions_count': transactions_count,
            'revenue': float(revenue),
            'created_at': provider.created_at.isoformat(),
            'updated_at': provider.updated_at.isoformat(),
        }, status=status.HTTP_200_OK)
        
    except PaymentProviderConfig.DoesNotExist:
        return Response({
            'id': provider_id,
            'name': provider_id.capitalize(),
            'status': 'disconnected',
            'is_active': False,
            'is_live': False,
            'transactions_count': 0,
            'revenue': 0,
        }, status=status.HTTP_200_OK)


@api_view(['POST', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated, IsAdminUser])
def update_payment_provider(request, provider_id):
    """Create or update payment provider configuration"""
    try:
        provider, created = PaymentProviderConfig.objects.get_or_create(
            provider=provider_id,
            defaults={
                'is_active': False,
                'is_live': False,
            }
        )
        
        # Update fields
        if 'client_id' in request.data:
            provider.client_id = request.data['client_id']
        if 'client_secret' in request.data:
            provider.client_secret = request.data['client_secret']
        if 'webhook_id' in request.data:
            provider.webhook_id = request.data['webhook_id']
        if 'webhook_url' in request.data:
            provider.webhook_url = request.data['webhook_url']
        if 'webhook_secret' in request.data:
            provider.webhook_secret = request.data['webhook_secret']
        if 'is_active' in request.data:
            provider.is_active = request.data['is_active']
        if 'is_live' in request.data:
            provider.is_live = request.data['is_live']
        if 'config' in request.data:
            provider.config = request.data['config']
        
        provider.save()
        
        # Get updated statistics
        transactions = BillingTransaction.objects.filter(payment_provider=provider.provider)
        transactions_count = transactions.count()
        revenue = transactions.filter(status='paid').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        return Response({
            'id': provider.provider,
            'name': provider.get_provider_display(),
            'status': 'connected' if provider.is_active else 'disconnected',
            'is_active': provider.is_active,
            'is_live': provider.is_live,
            'client_id': provider.client_id,
            'webhook_url': provider.webhook_url,
            'last_sync': provider.last_sync_at.isoformat() if provider.last_sync_at else None,
            'transactions_count': transactions_count,
            'revenue': float(revenue),
            'message': 'Provider configuration updated successfully' if not created else 'Provider configuration created successfully',
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error updating payment provider {provider_id}: {str(e)}", exc_info=True)
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def test_payment_provider(request, provider_id):
    """Test payment provider connection"""
    try:
        provider = PaymentProviderConfig.objects.get(provider=provider_id)
        
        if not provider.is_active:
            return Response(
                {'error': 'Provider is not active'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Test connection based on provider
        if provider_id == 'coinbase':
            from .coinbase_service import CoinbaseService
            service = CoinbaseService()
            # Test by getting headers (validates API key exists)
            headers = service.get_headers()
            if not headers or 'X-CC-Api-Key' not in headers:
                return Response(
                    {'error': 'Coinbase API key not configured'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # Update last sync
            provider.last_sync_at = timezone.now()
            provider.save()
            return Response({
                'success': True,
                'message': 'Coinbase connection test successful'
            })
        
        elif provider_id == 'paypal':
            from .paypal_service import PayPalService
            service = PayPalService()
            token = service.get_access_token()
            if not token:
                return Response(
                    {'error': 'PayPal credentials invalid or connection failed'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            provider.last_sync_at = timezone.now()
            provider.save()
            return Response({
                'success': True,
                'message': 'PayPal connection test successful'
            })
        
        elif provider_id == 'stripe':
            # Test Stripe connection
            import os
            stripe_secret_key = os.getenv('STRIPE_SECRET_KEY')
            if not stripe_secret_key:
                return Response({
                    'success': False,
                    'error': 'Stripe secret key not configured in environment variables'
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
            try:
                import stripe
                stripe.api_key = stripe_secret_key
                # Test API connection by retrieving account info
                account = stripe.Account.retrieve()
                provider.last_sync_at = timezone.now()
                provider.save()
                return Response({
                    'success': True,
                    'message': 'Stripe connection test successful',
                    'account_id': account.id
                })
            except Exception as e:
                logger.error(f"Stripe connection test failed: {str(e)}", exc_info=True)
                return Response({
                    'success': False,
                    'error': f'Stripe connection test failed: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(
            {'error': 'Unknown provider'},
            status=status.HTTP_400_BAD_REQUEST
        )
        
    except PaymentProviderConfig.DoesNotExist:
        return Response(
            {'error': 'Provider configuration not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error testing payment provider {provider_id}: {str(e)}", exc_info=True)
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

