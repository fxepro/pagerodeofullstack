from django.shortcuts import get_object_or_404
from urllib.parse import urlparse
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.db.models import Q
from django.utils import timezone
from core.rate_limiting import rate_limit_register, rate_limit_api
from site_settings.models import SiteConfig
from .email_verification import send_verification_email
from .two_factor import (
    generate_secret, generate_qr_code, verify_totp,
    generate_backup_codes, encrypt_secret, decrypt_secret,
    encrypt_backup_codes, verify_backup_code
)
import logging

logger = logging.getLogger(__name__)
from .models import (
    UserProfile,
    UserActivity,
    UserCorporateProfile,
    PaymentMethod,
    UserSubscription,
    BillingTransaction,
    MonitoredSite,
)
from .serializers import (
    UserSerializer,
    UserProfileSerializer,
    UserActivitySerializer,
    UserCorporateProfileSerializer,
    PaymentMethodSerializer,
    UserSubscriptionSerializer,
    BillingTransactionSerializer,
    MonitoredSiteSerializer,
    MonitoredSiteUpdateSerializer,
)
import json
from rest_framework_simplejwt.tokens import RefreshToken

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_info(request):
    user = request.user
    
    # Use is_superuser as the primary role check for admin
    if user.is_superuser:
        role = 'admin'
        # Get or create profile for admin users too
        try:
            profile = user.profile
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=user, role='admin')
    else:
        # Get role from UserProfile for non-superusers
        try:
            profile = user.profile
            role = profile.role
        except UserProfile.DoesNotExist:
            # Create profile with viewer role for new users
            profile = UserProfile.objects.create(user=user, role='viewer')
            role = 'viewer'
    
    return Response({
        'username': user.username,
        'email': user.email or '',  # Return empty string if email is None
        'first_name': user.first_name or '',
        'last_name': user.last_name or '',
        'role': role,
        'is_active': profile.is_active,
        'roles': [role],  # Keep for compatibility
    })

@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_users(request):
    """List all users with filtering and search"""
    search = request.GET.get('search', '')
    role = request.GET.get('role', '')
    
    users = User.objects.all()
    
    if search:
        users = users.filter(
            Q(username__icontains=search) |
            Q(email__icontains=search) |
            Q(first_name__icontains=search) |
            Q(last_name__icontains=search)
        )
    
    if role:
        if role == 'admin':
            users = users.filter(is_superuser=True)
        else:
            users = users.filter(is_superuser=False, profile__role=role)
    
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def create_user(request):
    """Create a new user (Admin only)"""
    data = request.data
    
    # Create user
    user = User.objects.create_user(
        username=data['username'],
        email=data['email'],
        password=data['password'],
        first_name=data.get('first_name', ''),
        last_name=data.get('last_name', '')
    )
    
    # Create profile
    UserProfile.objects.create(
        user=user,
        role=data.get('role', 'viewer'),
        is_active=data.get('is_active', True)
    )
    
    serializer = UserSerializer(user)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@rate_limit_register
def register_user(request):
    """Public user registration endpoint (rate limited: 3 registrations per hour per IP)"""
    data = request.data
    
    # Validate required fields
    required_fields = ['username', 'email', 'password', 'first_name', 'last_name']
    for field in required_fields:
        if not data.get(field):
            return Response({'error': f'{field} is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if username already exists
    if User.objects.filter(username=data['username']).exists():
        return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if email already exists
    if User.objects.filter(email=data['email']).exists():
        return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Create user
        user = User.objects.create_user(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            first_name=data['first_name'],
            last_name=data['last_name']
        )
        
        # Create profile with selected role (default to viewer if not provided)
        profile = UserProfile.objects.create(
            user=user,
            role=data.get('role', 'viewer'),
            is_active=True,
            email_verified=False  # Default to unverified
        )
        
        # Check if email verification is enabled in site settings
        site_config = SiteConfig.get_config()
        email_verification_enabled = site_config.enable_email_verification if site_config else False
        
        # If email verification is enabled, send verification email
        if email_verification_enabled:
            try:
                token = profile.generate_verification_token()
                email_sent = send_verification_email(user, token)
                if not email_sent:
                    logger.warning(f"Failed to send verification email to {user.email}, but user was created")
            except Exception as e:
                logger.error(f"Error sending verification email to {user.email}: {str(e)}", exc_info=True)
                # Don't fail registration if email sending fails
                email_sent = False
        
        serializer = UserSerializer(user)
        response_data = serializer.data
        response_data['email_verified'] = profile.email_verified
        return Response(response_data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        # Log the actual error for debugging
        logger.error(f"Registration failed: {str(e)}", exc_info=True)
        
        # Return more helpful error message
        error_message = str(e) if settings.DEBUG else 'Registration failed. Please try again.'
        return Response({'error': error_message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user(request, user_id):
    """Get user details"""
    try:
        user = User.objects.get(id=user_id)
        serializer = UserSerializer(user)
        return Response(serializer.data)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['PUT'])
@permission_classes([IsAdminUser])
def update_user(request, user_id):
    """Update user information"""
    try:
        user = User.objects.get(id=user_id)
        profile = user.profile
        
        # Update user fields
        user.username = request.data.get('username', user.username)
        user.email = request.data.get('email', user.email)
        user.first_name = request.data.get('first_name', user.first_name)
        user.last_name = request.data.get('last_name', user.last_name)
        user.save()
        
        # Update profile fields
        profile.role = request.data.get('role', profile.role)
        profile.is_active = request.data.get('is_active', profile.is_active)
        profile.save()
        
        serializer = UserSerializer(user)
        return Response(serializer.data)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def delete_user(request, user_id):
    """Delete a user"""
    try:
        user = User.objects.get(id=user_id)
        user.delete()
        return Response({'message': 'User deleted successfully'})
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def assign_role(request, user_id):
    """Assign role to user"""
    try:
        user = User.objects.get(id=user_id)
        profile = user.profile
        profile.role = request.data['role']
        profile.save()
        
        return Response({'message': f'Role updated to {profile.role}'})
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def user_stats(request):
    """Get user statistics"""
    total_users = User.objects.count()
    active_users = User.objects.filter(profile__is_active=True).count()
    admin_users = User.objects.filter(is_superuser=True).count()
    
    role_distribution = {
        'admin': User.objects.filter(is_superuser=True).count(),
        'viewer': User.objects.filter(is_superuser=False, profile__role='viewer').count(),
        'analyst': User.objects.filter(is_superuser=False, profile__role='analyst').count(),
        'manager': User.objects.filter(is_superuser=False, profile__role='manager').count(),
        'director': User.objects.filter(is_superuser=False, profile__role='director').count(),
    }
    
    return Response({
        'total_users': total_users,
        'active_users': active_users,
        'admin_users': admin_users,
        'role_distribution': role_distribution
    })

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_own_profile(request):
    """Update current user's own profile information"""
    user = request.user
    
    # Update user fields
    if 'email' in request.data:
        user.email = request.data['email']
    if 'first_name' in request.data:
        user.first_name = request.data['first_name']
    if 'last_name' in request.data:
        user.last_name = request.data['last_name']
    
    user.save()
    
    # Return updated user info
    serializer = UserSerializer(user)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Change current user's password"""
    user = request.user
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    
    if not old_password or not new_password:
        return Response(
            {'error': 'Both old_password and new_password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verify old password
    if not user.check_password(old_password):
        return Response(
            {'error': 'Current password is incorrect'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate new password
    if len(new_password) < 8:
        return Response(
            {'error': 'New password must be at least 8 characters long'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Set new password
    user.set_password(new_password)
    user.save()
    
    return Response({'message': 'Password changed successfully'})


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def corporate_profile(request):
    """Retrieve or update the authenticated user's corporate profile"""
    profile, _ = UserCorporateProfile.objects.get_or_create(user=request.user)

    if request.method == 'GET':
        serializer = UserCorporateProfileSerializer(profile)
        return Response(serializer.data)

    serializer = UserCorporateProfileSerializer(profile, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def payment_methods(request):
    """List or create payment methods for the authenticated user"""
    if request.method == 'GET':
        methods = PaymentMethod.objects.filter(user=request.user).order_by('-is_default', '-created_at')
        serializer = PaymentMethodSerializer(methods, many=True)
        return Response(serializer.data)

    data = request.data.copy()
    method_type = data.get('method_type')

    if method_type not in dict(PaymentMethod.METHOD_CHOICES):
        return Response({'error': 'Invalid payment method type'}, status=status.HTTP_400_BAD_REQUEST)

    if method_type == 'card':
        required_fields = ['brand', 'last4', 'exp_month', 'exp_year']
    else:
        required_fields = ['bank_name', 'account_type', 'last4']

    for field in required_fields:
        if not data.get(field):
            return Response({'error': f'{field} is required for {method_type} payment method'}, status=status.HTTP_400_BAD_REQUEST)

    exp_month = data.get('exp_month')
    exp_year = data.get('exp_year')

    if method_type == 'card':
        try:
            exp_month = int(exp_month)
            exp_year = int(exp_year)
        except (TypeError, ValueError):
            return Response({'error': 'exp_month and exp_year must be numbers'}, status=status.HTTP_400_BAD_REQUEST)
        if exp_month < 1 or exp_month > 12:
            return Response({'error': 'exp_month must be between 1 and 12'}, status=status.HTTP_400_BAD_REQUEST)
        if exp_year < 2000:
            return Response({'error': 'exp_year must be a valid year'}, status=status.HTTP_400_BAD_REQUEST)
    else:
        exp_month = None
        exp_year = None

    payment_method = PaymentMethod.objects.create(
        user=request.user,
        nickname=data.get('nickname', ''),
        method_type=method_type,
        brand=data.get('brand', ''),
        last4=data.get('last4', '')[-4:],
        exp_month=exp_month,
        exp_year=exp_year,
        bank_name=data.get('bank_name', ''),
        account_type=data.get('account_type', ''),
        routing_last4=data.get('routing_last4', '')[-4:],
        is_default=bool(data.get('is_default')),    
    )

    # Ensure only one default method
    if payment_method.is_default:
        PaymentMethod.objects.filter(user=request.user).exclude(id=payment_method.id).update(is_default=False)
    elif not PaymentMethod.objects.filter(user=request.user).exclude(id=payment_method.id).filter(is_default=True).exists():
        payment_method.is_default = True
        payment_method.save(update_fields=['is_default'])

    serializer = PaymentMethodSerializer(payment_method)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def payment_method_detail(request, method_id):
    payment_method = get_object_or_404(PaymentMethod, id=method_id, user=request.user)

    if request.method == 'DELETE':
        payment_method.delete()
        # Ensure another default exists
        if not PaymentMethod.objects.filter(user=request.user, is_default=True).exists():
            next_method = PaymentMethod.objects.filter(user=request.user).order_by('-created_at').first()
            if next_method:
                next_method.is_default = True
                next_method.save(update_fields=['is_default'])
        return Response({'message': 'Payment method deleted'})

    # PATCH - update
    data = request.data
    updated = []

    if 'nickname' in data:
        payment_method.nickname = data['nickname']
        updated.append('nickname')

    if 'is_default' in data:
        is_default = bool(data['is_default'])
        payment_method.is_default = is_default
        updated.append('is_default')
        if is_default:
            PaymentMethod.objects.filter(user=request.user).exclude(id=payment_method.id).update(is_default=False)

    payment_method.save(update_fields=updated or None)
    serializer = PaymentMethodSerializer(payment_method)
    return Response(serializer.data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def user_subscriptions(request):
    if request.method == 'GET':
        subs = UserSubscription.objects.filter(user=request.user).order_by('-created_at')
        serializer = UserSubscriptionSerializer(subs, many=True)
        return Response(serializer.data)

    serializer = UserSubscriptionSerializer(data=request.data)
    if serializer.is_valid():
        subscription = serializer.save(user=request.user)
        return Response(UserSubscriptionSerializer(subscription).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def subscription_detail(request, subscription_id):
    subscription = get_object_or_404(UserSubscription, id=subscription_id, user=request.user)

    if request.method == 'DELETE':
        subscription.status = 'cancelled'
        subscription.is_recurring = False
        subscription.save(update_fields=['status', 'is_recurring'])
        return Response({'message': 'Subscription cancelled'})

    data = request.data
    if 'is_recurring' in data:
        subscription.is_recurring = bool(data['is_recurring'])
    if 'end_date' in data:
        subscription.end_date = data['end_date'] or None
    if 'notes' in data:
        subscription.notes = data['notes']
    subscription.save()
    return Response(UserSubscriptionSerializer(subscription).data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def billing_history(request):
    if request.method == 'GET':
        transactions = BillingTransaction.objects.filter(user=request.user).order_by('-created_at')
        serializer = BillingTransactionSerializer(transactions, many=True)
        return Response(serializer.data)

    serializer = BillingTransactionSerializer(data=request.data)
    if serializer.is_valid():
        transaction = serializer.save(user=request.user, status='paid')
        return Response(BillingTransactionSerializer(transaction).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def _normalize_url(raw_url: str) -> str:
    if not raw_url:
        return ''
    url = raw_url.strip()
    if not url.startswith(('http://', 'https://')):
        url = 'http://' + url
    parsed = urlparse(url)
    netloc = parsed.netloc or parsed.path
    netloc = netloc.lower().strip()
    if netloc.startswith('www.'):
        netloc = netloc[4:]
    return netloc.rstrip('/')


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def monitored_site_list(request):
    if request.method == 'GET':
        sites = MonitoredSite.objects.filter(user=request.user).order_by('created_at')
        serializer = MonitoredSiteSerializer(sites, many=True)
        return Response(serializer.data)

    url = request.data.get('url', '')
    normalized_url = _normalize_url(url)

    if not normalized_url:
        return Response({'error': 'Enter a valid URL.'}, status=status.HTTP_400_BAD_REQUEST)

    if MonitoredSite.objects.filter(user=request.user, url=normalized_url).exists():
        return Response({'error': 'This site is already being monitored.'}, status=status.HTTP_400_BAD_REQUEST)

    site = MonitoredSite.objects.create(
        user=request.user,
        url=normalized_url,
        status='checking',
        status_duration='Just added'
    )

    serializer = MonitoredSiteSerializer(site)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def monitored_site_detail(request, site_id):
    site = get_object_or_404(MonitoredSite, id=site_id, user=request.user)

    if request.method == 'GET':
        serializer = MonitoredSiteSerializer(site)
        return Response(serializer.data)

    if request.method == 'DELETE':
        site.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = MonitoredSiteUpdateSerializer(site, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(MonitoredSiteSerializer(site).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==================== EMAIL VERIFICATION ENDPOINTS ====================

@api_view(['POST'])
@permission_classes([AllowAny])
@rate_limit_api
def send_verification_email_endpoint(request):
    """Send verification email to user (Public endpoint, rate limited)"""
    email = request.data.get('email')
    
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Don't reveal if email exists for security
        return Response({'message': 'If the email exists, a verification email has been sent.'}, status=status.HTTP_200_OK)
    
    # Check if already verified
    try:
        profile = user.profile
        if profile.email_verified:
            return Response({'message': 'Email is already verified'}, status=status.HTTP_400_BAD_REQUEST)
    except UserProfile.DoesNotExist:
        profile = UserProfile.objects.create(user=user, role='viewer', email_verified=False)
    
    # Generate new token and send email
    try:
        token = profile.generate_verification_token()
        email_sent = send_verification_email(user, token)
        # Build verification link for optional debug surface
        frontend_url = getattr(settings, 'FRONTEND_URL', None) or getattr(settings, 'NEXT_PUBLIC_APP_URL', None) or 'http://localhost:3000'
        if frontend_url == 'http://localhost:8000':
            frontend_url = 'http://localhost:3000'
        verification_link = f"{frontend_url.rstrip('/')}/verify-email?token={token}"
        
        if email_sent:
            payload = {'message': 'Verification email sent successfully'}
            if getattr(settings, 'DEBUG', False):
                payload.update({'token': token, 'verification_link': verification_link})
            return Response(payload, status=status.HTTP_200_OK)
        else:
            payload = {'error': 'Failed to send verification email'}
            if getattr(settings, 'DEBUG', False):
                payload.update({'token': token, 'verification_link': verification_link})
            return Response(payload, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        logger.error(f"Error sending verification email: {str(e)}", exc_info=True)
        err_msg = str(e) if getattr(settings, 'DEBUG', False) else 'Failed to send verification email'
        return Response({'error': err_msg}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
@rate_limit_api
def verify_email(request):
    """Verify email with token (Public endpoint, rate limited)"""
    token = request.data.get('token')
    
    if not token:
        return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Find user with matching token
    profiles = UserProfile.objects.filter(email_verification_token__isnull=False)
    verified_profile = None
    
    for profile in profiles:
        if profile.verify_token(token):
            # Check if token is expired
            if profile.is_token_expired():
                return Response({'error': 'Verification link has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if already verified
            if profile.email_verified:
                return Response({'message': 'Email is already verified'}, status=status.HTTP_400_BAD_REQUEST)
            
            verified_profile = profile
            break
    
    if not verified_profile:
        return Response({'error': 'Invalid verification token'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Mark as verified and clear token
    verified_profile.email_verified = True
    verified_profile.email_verification_token = None
    verified_profile.email_verification_sent_at = None
    verified_profile.save()
    
    # Generate JWT tokens
    refresh = RefreshToken.for_user(verified_profile.user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)
    
    return Response({
        'message': 'Email verified successfully',
        'email_verified': True,
        'access_token': access_token,
        'refresh_token': refresh_token
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
@rate_limit_api
def resend_verification_email(request):
    """Resend verification email.
    If `email` is provided, send for that user (public). If not provided, requires authenticated user and uses their email.
    In DEBUG, returns the token and verification_link to aid testing.
    """
    email = (request.data.get('email') or '').strip()

    user = None
    if email:
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Do not reveal existence; respond as if sent
            return Response({'message': 'If the email exists, a verification email has been sent.'}, status=status.HTTP_200_OK)
    else:
        # No email provided; fall back to authenticated user
        if not request.user or not request.user.is_authenticated:
            return Response({'error': 'Authentication or email is required'}, status=status.HTTP_400_BAD_REQUEST)
        user = request.user

    # Ensure profile exists
    try:
        profile = user.profile
    except UserProfile.DoesNotExist:
        profile = UserProfile.objects.create(user=user, role='viewer', email_verified=False)

    # If already verified, no need to send
    if profile.email_verified:
        return Response({'message': 'Email is already verified'}, status=status.HTTP_400_BAD_REQUEST)

    # Generate new token and attempt send
    try:
        token = profile.generate_verification_token()
        email_sent = send_verification_email(user, token)
        # Build verification link (for debug)
        frontend_url = getattr(settings, 'FRONTEND_URL', None) or getattr(settings, 'NEXT_PUBLIC_APP_URL', None) or 'http://localhost:3000'
        if frontend_url == 'http://localhost:8000':
            frontend_url = 'http://localhost:3000'
        verification_link = f"{frontend_url.rstrip('/')}/verify-email?token={token}"

        if email_sent:
            payload = {'message': 'Verification email sent successfully'}
            if getattr(settings, 'DEBUG', False):
                payload.update({'token': token, 'verification_link': verification_link})
            return Response(payload, status=status.HTTP_200_OK)
        else:
            payload = {'error': 'Failed to send verification email'}
            if getattr(settings, 'DEBUG', False):
                payload.update({'token': token, 'verification_link': verification_link})
            return Response(payload, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        logger.error(f"Error resending verification email: {str(e)}", exc_info=True)
        err_msg = str(e) if getattr(settings, 'DEBUG', False) else 'Failed to send verification email'
        return Response({'error': err_msg}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verification_status(request):
    """Check email verification status for authenticated user"""
    try:
        profile = request.user.profile
        return Response({
            'email_verified': profile.email_verified,
            'email': request.user.email
        }, status=status.HTTP_200_OK)
    except UserProfile.DoesNotExist:
        return Response({
            'email_verified': False,
            'email': request.user.email
        }, status=status.HTTP_200_OK)


# ==================== TWO-FACTOR AUTHENTICATION ENDPOINTS ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@rate_limit_api
def setup_2fa(request):
    """Initialize 2FA setup for authenticated user (Rate limited)"""
    user = request.user
    
    try:
        profile = user.profile
    except UserProfile.DoesNotExist:
        profile = UserProfile.objects.create(user=user, role='viewer')
    
    # Check if 2FA is already enabled
    if profile.two_factor_enabled:
        return Response({'error': '2FA is already enabled'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if site-wide 2FA is enabled
    site_config = SiteConfig.get_config()
    if not site_config.enable_two_factor:
        return Response({'error': 'Two-factor authentication is not enabled for this site'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # Generate secret and provisioning URI
        secret, provisioning_uri = generate_secret(user.username)
        
        # Encrypt and store secret (don't enable yet - user needs to verify first)
        encrypted_secret = encrypt_secret(secret)
        profile.two_factor_secret = encrypted_secret
        profile.save()
        
        # Generate QR code
        qr_code = generate_qr_code(provisioning_uri)
        
        return Response({
            'secret': secret,  # Return plain secret for initial setup
            'provisioning_uri': provisioning_uri,
            'qr_code': qr_code,
            'message': 'Scan the QR code with your authenticator app and verify to enable 2FA'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error setting up 2FA: {str(e)}", exc_info=True)
        return Response({'error': 'Failed to setup 2FA'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@rate_limit_api
def verify_and_enable_2fa(request):
    """Verify TOTP token and enable 2FA for authenticated user (Rate limited)"""
    user = request.user
    token = request.data.get('token')
    
    if not token:
        return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        profile = user.profile
    except UserProfile.DoesNotExist:
        return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if not profile.two_factor_secret:
        return Response({'error': '2FA not initialized. Please setup 2FA first.'}, status=status.HTTP_400_BAD_REQUEST)
    
    if profile.two_factor_enabled:
        return Response({'error': '2FA is already enabled'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Decrypt secret and verify token
    secret = decrypt_secret(profile.two_factor_secret)
    if not verify_totp(secret, token):
        return Response({'error': 'Invalid token. Please try again.'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Token is valid - enable 2FA and generate backup codes
    backup_codes = generate_backup_codes(count=10)
    encrypted_backup_codes = encrypt_backup_codes(backup_codes)
    
    profile.two_factor_enabled = True
    profile.two_factor_backup_codes = encrypted_backup_codes
    profile.save()
    
    return Response({
        'message': '2FA enabled successfully',
        'backup_codes': backup_codes,  # Return plain codes only once - user should save them
        'two_factor_enabled': True
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@rate_limit_api
def disable_2fa(request):
    """Disable 2FA for authenticated user (Rate limited)"""
    user = request.user
    password = request.data.get('password')  # Require password confirmation
    
    if not password:
        return Response({'error': 'Password is required to disable 2FA'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Verify password
    if not user.check_password(password):
        return Response({'error': 'Invalid password'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        profile = user.profile
    except UserProfile.DoesNotExist:
        return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if not profile.two_factor_enabled:
        return Response({'error': '2FA is not enabled'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Disable 2FA and clear secrets
    profile.two_factor_enabled = False
    profile.two_factor_secret = None
    profile.two_factor_backup_codes = []
    profile.save()
    
    return Response({
        'message': '2FA disabled successfully',
        'two_factor_enabled': False
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@rate_limit_api
def generate_backup_codes_2fa(request):
    """Generate new backup codes for 2FA (Rate limited)"""
    user = request.user
    password = request.data.get('password')  # Require password confirmation
    
    if not password:
        return Response({'error': 'Password is required to generate new backup codes'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Verify password
    if not user.check_password(password):
        return Response({'error': 'Invalid password'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        profile = user.profile
    except UserProfile.DoesNotExist:
        return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if not profile.two_factor_enabled:
        return Response({'error': '2FA is not enabled'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Generate new backup codes (replace old ones)
    backup_codes = generate_backup_codes(count=10)
    encrypted_backup_codes = encrypt_backup_codes(backup_codes)
    
    profile.two_factor_backup_codes = encrypted_backup_codes
    profile.save()
    
    return Response({
        'message': 'New backup codes generated successfully',
        'backup_codes': backup_codes  # Return plain codes only once
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
@rate_limit_api
def verify_2fa_login(request):
    """
    Verify 2FA token during login (Public endpoint, rate limited)
    This is called after initial username/password authentication
    """
    username = request.data.get('username')
    token = request.data.get('token')
    backup_code = request.data.get('backup_code')  # Alternative to TOTP token
    
    if not username:
        return Response({'error': 'Username is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    if not token and not backup_code:
        return Response({'error': 'Token or backup code is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        profile = user.profile
    except UserProfile.DoesNotExist:
        return Response({'error': '2FA not enabled'}, status=status.HTTP_400_BAD_REQUEST)
    
    if not profile.two_factor_enabled:
        return Response({'error': '2FA not enabled'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Verify token or backup code
    verified = False
    
    if token:
        # Verify TOTP token
        secret = decrypt_secret(profile.two_factor_secret)
        verified = verify_totp(secret, token)
    elif backup_code:
        # Verify backup code
        is_valid, updated_codes = verify_backup_code(profile.two_factor_backup_codes, backup_code)
        if is_valid:
            verified = True
            # Update backup codes list (remove used code)
            profile.two_factor_backup_codes = updated_codes
            profile.save()
    
    if not verified:
        return Response({'error': 'Invalid token or backup code'}, status=status.HTTP_400_BAD_REQUEST)
    
    # 2FA verified - proceed with normal login
    # Return success (actual JWT token generation happens in login flow)
    return Response({
        'message': '2FA verified successfully',
        'verified': True
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_2fa_status(request):
    """Get 2FA status for authenticated user"""
    try:
        profile = request.user.profile
        return Response({
            'two_factor_enabled': profile.two_factor_enabled,
            'backup_codes_count': len(profile.two_factor_backup_codes) if profile.two_factor_backup_codes else 0
        }, status=status.HTTP_200_OK)
    except UserProfile.DoesNotExist:
        return Response({
            'two_factor_enabled': False,
            'backup_codes_count': 0
        }, status=status.HTTP_200_OK)