"""
API Views for Affiliates
Affiliate management, referral tracking, commission calculation, and payout processing
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Sum, Avg
from django.utils import timezone
from datetime import timedelta
from users.permission_classes import HasFeaturePermission
from users.permission_utils import has_permission

from .models import Affiliate, Referral, Commission, AffiliatePayout
from .serializers import (
    AffiliateSerializer, ReferralSerializer, CommissionSerializer,
    AffiliatePayoutSerializer, AffiliateStatsSerializer
)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def affiliates_list(request):
    """
    List all affiliates (admin) or own affiliate (affiliate user)
    Create new affiliate account (authenticated users only)
    """
    if request.method == 'GET':
        # Admin can see all, affiliates can only see their own
        if has_permission(request.user, 'affiliates.view'):
            queryset = Affiliate.objects.all()
        elif hasattr(request.user, 'affiliate'):
            queryset = Affiliate.objects.filter(user=request.user)
        else:
            return Response(
                {'error': 'You do not have permission to view affiliates.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Apply filters
        status_filter = request.GET.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        search = request.GET.get('search')
        if search:
            queryset = queryset.filter(
                Q(user__username__icontains=search) |
                Q(user__email__icontains=search) |
                Q(affiliate_code__icontains=search) |
                Q(company_name__icontains=search)
            )
        
        serializer = AffiliateSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Check permission to create
        if not has_permission(request.user, 'affiliates.add'):
            return Response(
                {'error': 'You do not have permission to create affiliates.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        data = request.data.copy()
        # Set user to current user if not provided
        if 'user_id' not in data:
            data['user_id'] = request.user.id
        
        serializer = AffiliateSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            affiliate = serializer.save()
            return Response(
                AffiliateSerializer(affiliate, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def affiliate_apply(request):
    """
    Public endpoint for affiliate applications (sign-up)
    Allows unauthenticated users to apply to become affiliates
    """
    from django.contrib.auth.models import User
    
    data = request.data.copy()
    
    # Validate required fields
    required_fields = ['email', 'contact_email', 'company_name']
    missing_fields = [field for field in required_fields if not data.get(field)]
    if missing_fields:
        return Response(
            {'error': f'Missing required fields: {", ".join(missing_fields)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if user exists with this email
    email = data.get('email')
    try:
        user = User.objects.get(email=email)
        # If user exists, check if they already have an affiliate account
        if hasattr(user, 'affiliate'):
            return Response(
                {'error': 'An affiliate account already exists for this email address.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        user_id = user.id
    except User.DoesNotExist:
        # Create a new user account
        username = data.get('username') or email.split('@')[0]
        # Ensure username is unique
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
        
        user = User.objects.create_user(
            username=username,
            email=email,
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', ''),
            is_active=True  # User can login immediately
        )
        user_id = user.id
    
    # Set user_id and status to pending
    data['user_id'] = user_id
    data['status'] = 'pending'  # All applications start as pending
    
    # Store application notes if provided (from 'notes' field in form)
    if 'notes' in data and data.get('notes'):
        data['application_notes'] = data.get('notes', '')
    
    serializer = AffiliateSerializer(data=data, context={'request': request})
    if serializer.is_valid():
        affiliate = serializer.save()
        return Response(
            {
                'message': 'Your affiliate application has been submitted successfully. You will be notified once it is reviewed.',
                'affiliate': AffiliateSerializer(affiliate, context={'request': request}).data
            },
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def affiliate_detail(request, pk):
    """Get, update, or delete a specific affiliate"""
    try:
        affiliate = Affiliate.objects.get(pk=pk)
    except Affiliate.DoesNotExist:
        return Response({'error': 'Affiliate not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Permission check: admin can access any, affiliate can only access their own
    if not has_permission(request.user, 'affiliates.view'):
        if not hasattr(request.user, 'affiliate') or request.user.affiliate.id != affiliate.id:
            return Response(
                {'error': 'You do not have permission to access this affiliate.'},
                status=status.HTTP_403_FORBIDDEN
            )
    
    if request.method == 'GET':
        serializer = AffiliateSerializer(affiliate, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'PATCH':
        if not has_permission(request.user, 'affiliates.change'):
            if not hasattr(request.user, 'affiliate') or request.user.affiliate.id != affiliate.id:
                return Response(
                    {'error': 'You do not have permission to edit this affiliate.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        serializer = AffiliateSerializer(affiliate, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        if not has_permission(request.user, 'affiliates.delete'):
            return Response(
                {'error': 'You do not have permission to delete affiliates.'},
                status=status.HTTP_403_FORBIDDEN
            )
        affiliate.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated, HasFeaturePermission('affiliates.approve')])
def approve_affiliate(request, pk):
    """Approve an affiliate account (admin only)"""
    try:
        affiliate = Affiliate.objects.get(pk=pk)
    except Affiliate.DoesNotExist:
        return Response({'error': 'Affiliate not found'}, status=status.HTTP_404_NOT_FOUND)
    
    affiliate.status = 'active'
    affiliate.approved_at = timezone.now()
    affiliate.approved_by = request.user
    affiliate.save()
    
    serializer = AffiliateSerializer(affiliate, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, HasFeaturePermission('affiliates.suspend')])
def suspend_affiliate(request, pk):
    """Suspend an affiliate account (admin only)"""
    try:
        affiliate = Affiliate.objects.get(pk=pk)
    except Affiliate.DoesNotExist:
        return Response({'error': 'Affiliate not found'}, status=status.HTTP_404_NOT_FOUND)
    
    affiliate.status = 'suspended'
    affiliate.save()
    
    serializer = AffiliateSerializer(affiliate, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, HasFeaturePermission('affiliates.approve')])
def reject_affiliate(request, pk):
    """Reject a pending affiliate application"""
    try:
        affiliate = Affiliate.objects.get(pk=pk)
    except Affiliate.DoesNotExist:
        return Response({'error': 'Affiliate not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if affiliate.status != 'pending':
        return Response(
            {'error': f'Can only reject pending applications. Current status: {affiliate.status}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get rejection reason from request
    rejection_reason = request.data.get('reason', 'Application rejected by administrator')
    
    # Update status to inactive and store rejection details
    affiliate.status = 'inactive'
    affiliate.rejection_reason = rejection_reason
    affiliate.rejected_at = timezone.now()
    affiliate.rejected_by = request.user
    # Also add to notes for historical record
    if hasattr(affiliate, 'notes'):
        current_notes = affiliate.notes or ''
        affiliate.notes = f"{current_notes}\n\nRejected on {timezone.now().strftime('%Y-%m-%d %H:%M:%S')} by {request.user.username}: {rejection_reason}".strip()
    affiliate.save()
    
    return Response(
        {'message': 'Affiliate application rejected', 'affiliate': AffiliateSerializer(affiliate, context={'request': request}).data},
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_affiliate_code(request):
    """Generate a unique affiliate code"""
    from .models import generate_affiliate_code
    code = generate_affiliate_code()
    return Response({'affiliate_code': code})


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def referrals_list(request):
    """List referrals or create a new referral"""
    if request.method == 'GET':
        # Admin can see all, affiliates can only see their own
        if has_permission(request.user, 'affiliates.view'):
            queryset = Referral.objects.all()
        elif hasattr(request.user, 'affiliate'):
            queryset = Referral.objects.filter(affiliate__user=request.user)
        else:
            return Response(
                {'error': 'You do not have permission to view referrals.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Apply filters
        status_filter = request.GET.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        affiliate_id = request.GET.get('affiliate_id')
        if affiliate_id:
            queryset = queryset.filter(affiliate_id=affiliate_id)
        
        serializer = ReferralSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Public endpoint for tracking referrals (can be AllowAny)
        data = request.data.copy()
        serializer = ReferralSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            referral = serializer.save()
            return Response(
                ReferralSerializer(referral, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def track_referral(request):
    """Public endpoint to track a referral (from ?ref=CODE parameter)"""
    referral_code = request.GET.get('ref', '')
    if not referral_code:
        return Response({'error': 'Referral code required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        affiliate = Affiliate.objects.get(affiliate_code=referral_code, status='active')
    except Affiliate.DoesNotExist:
        return Response({'error': 'Invalid referral code'}, status=status.HTTP_404_NOT_FOUND)
    
    # Create referral record
    referral = Referral.objects.create(
        affiliate=affiliate,
        referral_code=referral_code,
        ip_address=request.META.get('REMOTE_ADDR'),
        user_agent=request.META.get('HTTP_USER_AGENT', ''),
        referrer_url=request.META.get('HTTP_REFERER', ''),
        landing_page=request.build_absolute_uri(),
        utm_source=request.GET.get('utm_source', ''),
        utm_medium=request.GET.get('utm_medium', ''),
        utm_campaign=request.GET.get('utm_campaign', ''),
        cookie_expires_at=timezone.now() + timedelta(days=30)
    )
    
    # Update affiliate stats
    affiliate.total_referrals += 1
    affiliate.save(update_fields=['total_referrals'])
    
    serializer = ReferralSerializer(referral, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def commissions_list(request):
    """List commissions"""
    # Admin can see all, affiliates can only see their own
    if has_permission(request.user, 'commissions.view'):
        queryset = Commission.objects.all()
    elif hasattr(request.user, 'affiliate'):
        queryset = Commission.objects.filter(affiliate__user=request.user)
    else:
        return Response(
            {'error': 'You do not have permission to view commissions.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Apply filters
    status_filter = request.GET.get('status')
    if status_filter:
        queryset = queryset.filter(status=status_filter)
    
    affiliate_id = request.GET.get('affiliate_id')
    if affiliate_id:
        queryset = queryset.filter(affiliate_id=affiliate_id)
    
    serializer = CommissionSerializer(queryset, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, HasFeaturePermission('commissions.approve')])
def approve_commission(request, pk):
    """Approve a commission (admin only)"""
    try:
        commission = Commission.objects.get(pk=pk)
    except Commission.DoesNotExist:
        return Response({'error': 'Commission not found'}, status=status.HTTP_404_NOT_FOUND)
    
    commission.status = 'approved'
    commission.approved_at = timezone.now()
    commission.approved_by = request.user
    
    # Update affiliate stats
    affiliate = commission.affiliate
    affiliate.total_commission_pending -= commission.commission_amount
    affiliate.total_commission_earned += commission.commission_amount
    affiliate.current_year_earnings += commission.commission_amount
    affiliate.save()
    
    commission.save()
    
    serializer = CommissionSerializer(commission, context={'request': request})
    return Response(serializer.data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def payouts_list(request):
    """List payouts or create a new payout request"""
    if request.method == 'GET':
        # Admin can see all, affiliates can only see their own
        if has_permission(request.user, 'payouts.view'):
            queryset = AffiliatePayout.objects.all()
        elif hasattr(request.user, 'affiliate'):
            queryset = AffiliatePayout.objects.filter(affiliate__user=request.user)
        else:
            return Response(
                {'error': 'You do not have permission to view payouts.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Apply filters
        status_filter = request.GET.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        serializer = AffiliatePayoutSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Affiliates can request payouts
        if not hasattr(request.user, 'affiliate'):
            return Response(
                {'error': 'You are not an affiliate.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        affiliate = request.user.affiliate
        if not affiliate.can_request_payout():
            return Response(
                {'error': f'Minimum payout threshold not met. You need ${affiliate.payout_threshold}.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create payout from pending commissions
        pending_commissions = Commission.objects.filter(
            affiliate=affiliate,
            status='approved',
            payout__isnull=True
        )
        
        if not pending_commissions.exists():
            return Response(
                {'error': 'No pending commissions available for payout.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        total_amount = pending_commissions.aggregate(Sum('commission_amount'))['commission_amount__sum'] or 0
        
        payout = AffiliatePayout.objects.create(
            affiliate=affiliate,
            total_amount=total_amount,
            currency='USD',
            payout_method=affiliate.payout_method,
            period_start=timezone.now() - timedelta(days=30),  # Last 30 days
            period_end=timezone.now(),
            status='pending'
        )
        
        # Link commissions to payout
        pending_commissions.update(payout=payout)
        
        serializer = AffiliatePayoutSerializer(payout, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated, HasFeaturePermission('payouts.process')])
def process_payout(request, pk):
    """Process a payout (admin only)"""
    try:
        payout = AffiliatePayout.objects.get(pk=pk)
    except AffiliatePayout.DoesNotExist:
        return Response({'error': 'Payout not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if payout.status != 'pending':
        return Response(
            {'error': f'Payout is already {payout.status}.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Update payout status
    payout.status = 'processing'
    payout.processed_by = request.user
    payout.save()
    
    # TODO: Integrate with payment provider (PayPal, Stripe, etc.)
    # For now, just mark as paid
    payout.status = 'paid'
    payout.paid_at = timezone.now()
    payout.save()
    
    # Update affiliate stats
    affiliate = payout.affiliate
    affiliate.total_commission_paid += payout.total_amount
    affiliate.save()
    
    # Update commission statuses
    payout.commissions.update(status='paid', paid_at=timezone.now())
    
    serializer = AffiliatePayoutSerializer(payout, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, HasFeaturePermission('affiliates.view')])
def affiliate_stats(request):
    """Get overall affiliate statistics (admin only)"""
    total_affiliates = Affiliate.objects.count()
    active_affiliates = Affiliate.objects.filter(status='active').count()
    pending_affiliates = Affiliate.objects.filter(status='pending').count()
    
    total_referrals = Referral.objects.count()
    total_conversions = Referral.objects.filter(status='converted').count()
    conversion_rate = (total_conversions / total_referrals * 100) if total_referrals > 0 else 0
    
    total_commissions_earned = Commission.objects.aggregate(
        Sum('commission_amount')
    )['commission_amount__sum'] or 0
    
    total_commissions_paid = AffiliatePayout.objects.filter(status='paid').aggregate(
        Sum('total_amount')
    )['total_amount__sum'] or 0
    
    total_commissions_pending = Commission.objects.filter(status='approved', payout__isnull=True).aggregate(
        Sum('commission_amount')
    )['commission_amount__sum'] or 0
    
    pending_payouts = AffiliatePayout.objects.filter(status='pending')
    pending_payouts_count = pending_payouts.count()
    pending_payouts_amount = pending_payouts.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
    
    stats = {
        'total_affiliates': total_affiliates,
        'active_affiliates': active_affiliates,
        'pending_affiliates': pending_affiliates,
        'total_referrals': total_referrals,
        'total_conversions': total_conversions,
        'conversion_rate': round(conversion_rate, 2),
        'total_commissions_earned': float(total_commissions_earned),
        'total_commissions_paid': float(total_commissions_paid),
        'total_commissions_pending': float(total_commissions_pending),
        'pending_payouts_count': pending_payouts_count,
        'pending_payouts_amount': float(pending_payouts_amount),
    }
    
    serializer = AffiliateStatsSerializer(stats)
    return Response(serializer.data)
