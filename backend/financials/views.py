"""
Financial API Views
User financial profile endpoints (payment methods, subscriptions, billing)
"""

import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from .models import PaymentMethod, UserSubscription, BillingTransaction
from .serializers import (
    PaymentMethodSerializer,
    UserSubscriptionSerializer,
    BillingTransactionSerializer,
)

logger = logging.getLogger(__name__)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def payment_methods(request):
    """List or create payment methods for the authenticated user"""
    if request.method == 'GET':
        try:
            methods = PaymentMethod.objects.filter(user=request.user).order_by('-is_default', '-created_at')
            serializer = PaymentMethodSerializer(methods, many=True)
            return Response(serializer.data)
        except Exception as e:
            # Handle case where new fields don't exist in database yet (migration not run)
            # Try to query only existing fields
            try:
                from django.db import connection
                # Get only basic fields that definitely exist
                methods = PaymentMethod.objects.filter(user=request.user).only(
                    'id', 'nickname', 'method_type', 'brand', 'last4', 
                    'exp_month', 'exp_year', 'bank_name', 'account_type', 
                    'is_default', 'created_at'
                ).order_by('-is_default', '-created_at')
                serializer = PaymentMethodSerializer(methods, many=True)
                return Response(serializer.data)
            except Exception as inner_e:
                # If that also fails, return empty list
                logger.error(f"Error loading payment methods: {str(inner_e)}", exc_info=True)
                return Response([], status=status.HTTP_200_OK)

    data = request.data.copy()
    method_type = data.get('method_type')

    if method_type not in dict(PaymentMethod.METHOD_CHOICES):
        return Response({'error': 'Invalid payment method type'}, status=status.HTTP_400_BAD_REQUEST)

    if method_type == 'card':
        required_fields = ['cardholder_name', 'card_number', 'exp_month', 'exp_year']
        for field in required_fields:
            if not data.get(field):
                return Response({'error': f'{field} is required for card payment method'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate card number (16 digits)
        card_number = data.get('card_number', '').replace(' ', '').replace('-', '')
        if len(card_number) != 16 or not card_number.isdigit():
            return Response({'error': 'Invalid card number'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Extract last 4 digits for display
        data['last4'] = card_number[-4:]
        
        # Determine card brand from first digit
        first_digit = card_number[0]
        if first_digit == '4':
            data['brand'] = 'Visa'
        elif first_digit == '5':
            data['brand'] = 'Mastercard'
        elif first_digit == '3':
            data['brand'] = 'American Express'
        else:
            data['brand'] = 'Unknown'
    
    elif method_type == 'ach':
        required_fields = ['bank_name', 'account_type', 'account_number', 'routing_number']
        for field in required_fields:
            if not data.get(field):
                return Response({'error': f'{field} is required for ACH payment method'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate routing number (9 digits)
        routing_number = data.get('routing_number', '').replace(' ', '').replace('-', '')
        if len(routing_number) != 9 or not routing_number.isdigit():
            return Response({'error': 'Invalid routing number'}, status=status.HTTP_400_BAD_REQUEST)
        data['routing_number'] = routing_number

    # Set user
    data['user'] = request.user.id

    # If this is set as default, unset other defaults
    if data.get('is_default', False):
        PaymentMethod.objects.filter(user=request.user, is_default=True).update(is_default=False)

    serializer = PaymentMethodSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def payment_method_detail(request, method_id):
    """Get, update, or delete a specific payment method"""
    method = get_object_or_404(PaymentMethod, id=method_id, user=request.user)

    if request.method == 'GET':
        serializer = PaymentMethodSerializer(method)
        return Response(serializer.data)

    elif request.method == 'PUT':
        data = request.data.copy()
        
        # If setting as default, unset other defaults
        if data.get('is_default', False):
            PaymentMethod.objects.filter(user=request.user, is_default=True).update(is_default=False)
        
        serializer = PaymentMethodSerializer(method, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        method.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def user_subscriptions(request):
    """List or create subscriptions for the authenticated user"""
    if request.method == 'GET':
        subscriptions = UserSubscription.objects.filter(user=request.user).order_by('-created_at')
        serializer = UserSubscriptionSerializer(subscriptions, many=True)
        return Response(serializer.data)

    # POST - Create new subscription
    data = request.data.copy()
    data['user'] = request.user.id
    serializer = UserSubscriptionSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def subscription_detail(request, subscription_id):
    """Get, update, or delete a specific subscription"""
    subscription = get_object_or_404(UserSubscription, id=subscription_id, user=request.user)

    if request.method == 'GET':
        serializer = UserSubscriptionSerializer(subscription)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = UserSubscriptionSerializer(subscription, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        subscription.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def billing_history(request):
    """Get billing transaction history for the authenticated user"""
    transactions = BillingTransaction.objects.filter(user=request.user).order_by('-created_at')
    serializer = BillingTransactionSerializer(transactions, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def billing_summary(request):
    """Get billing summary for the authenticated user"""
    transactions = BillingTransaction.objects.filter(user=request.user)
    
    total_paid = sum(t.amount for t in transactions.filter(status='paid'))
    total_pending = sum(t.amount for t in transactions.filter(status='pending'))
    total_failed = sum(t.amount for t in transactions.filter(status='failed'))
    
    active_subscriptions = UserSubscription.objects.filter(
        user=request.user,
        status='active'
    ).count()
    
    return Response({
        'total_paid': float(total_paid),
        'total_pending': float(total_pending),
        'total_failed': float(total_failed),
        'active_subscriptions': active_subscriptions,
        'transaction_count': transactions.count(),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def billing_transaction_detail(request, transaction_id):
    """Get details of a specific billing transaction"""
    transaction = get_object_or_404(BillingTransaction, id=transaction_id, user=request.user)
    serializer = BillingTransactionSerializer(transaction)
    return Response(serializer.data)
