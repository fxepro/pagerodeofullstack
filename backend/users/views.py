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
    try:
        user = request.user
        
        # Get user profile if it exists - don't create during login/info fetch
        # Profiles are only created during registration
        profile = None
        try:
            profile = user.profile
        except UserProfile.DoesNotExist:
            # No profile exists - that's okay, use defaults
            profile = None
        except Exception as e:
            # If anything goes wrong accessing profile, log and continue
            logger.warning(f"Error accessing UserProfile for {user.username}: {str(e)}", exc_info=True)
            profile = None
        
        # Use is_superuser as the primary role check for admin
        if user.is_superuser:
            role = 'admin'
        else:
            # Get role from UserProfile for non-superusers, default to viewer
            role = profile.role if profile else 'viewer'
        
        response_data = {
            'username': user.username,
            'email': user.email or '',  # Return empty string if email is None
            'first_name': user.first_name or '',
            'last_name': user.last_name or '',
            'role': role,
            'is_active': profile.is_active if profile else user.is_active,
            'roles': [role],  # Keep for compatibility
        }
        
        # Add profile personal info if profile exists
        if profile:
            response_data.update({
                'phone': profile.phone or '',
                'bio': profile.bio or '',
                'avatar_url': profile.avatar_url or '',
                'date_of_birth': profile.date_of_birth.isoformat() if profile.date_of_birth else None,
                'timezone': profile.timezone or 'UTC',
                'locale': profile.locale or 'en-US',
            })
        else:
            # Default values if no profile
            response_data.update({
                'phone': '',
                'bio': '',
                'avatar_url': '',
                'date_of_birth': None,
                'timezone': 'UTC',
                'locale': 'en-US',
            })
        
        return Response(response_data)
    except Exception as e:
        # Log the full error with stack trace
        logger.error(f"Error in user_info endpoint: {str(e)}", exc_info=True)
        # Return a safe error response
        return Response({
            'error': 'Failed to retrieve user information',
            'detail': str(e) if settings.DEBUG else 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
            logger.warning(f"Registration failed: missing required field '{field}'. Data received: {list(data.keys())}")
            return Response({'error': f'{field} is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if username already exists
    if User.objects.filter(username=data['username']).exists():
        logger.warning(f"Registration failed: username '{data['username']}' already exists")
        return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if email already exists
    if User.objects.filter(email=data['email']).exists():
        logger.warning(f"Registration failed: email '{data['email']}' already exists")
        return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Create user - this should commit immediately
        try:
            user = User.objects.create_user(
                username=data['username'],
                email=data['email'],
                password=data['password'],
                first_name=data['first_name'],
                last_name=data['last_name']
            )
            logger.info(f"User created successfully: {user.username} ({user.email})")
        except Exception as user_error:
            logger.error(f"Failed to create user: {str(user_error)}", exc_info=True)
            raise
        
        # Create profile with selected role (default to viewer if not provided)
        try:
            profile = UserProfile.objects.create(
                user=user,
                role=data.get('role', 'viewer'),
                is_active=True,
                email_verified=False  # Default to unverified
            )
            logger.info(f"Profile created successfully for user: {user.username}")
        except Exception as profile_error:
            logger.error(f"Failed to create profile for user {user.username}: {str(profile_error)}", exc_info=True)
            # Delete user if profile creation fails
            user.delete()
            raise
        
        # Check if email verification is enabled in site settings
        site_config = SiteConfig.get_config()
        email_verification_enabled = site_config.enable_email_verification if site_config else False
        
        # Always generate verification code/token (even if email verification is disabled)
        # This provides an emergency fallback code that can be used manually
        verification_token = None
        try:
            # Ensure profile is saved before generating token
            if not profile.pk:
                profile.save()
            
            # Refresh to ensure we have the latest state
            profile.refresh_from_db()
            
            try:
                code = profile.generate_verification_code()
                verification_code = code  # Store for response
                
                # Verify code was generated
                profile.refresh_from_db()
                if not profile.email_verification_code:
                    logger.error(f"Code generation failed for user {user.email} - code field is still null")
                else:
                    # Only send email if email verification is enabled
                    if email_verification_enabled:
                        email_sent = send_verification_email(user, code)
                        if not email_sent:
                            logger.warning(f"Failed to send verification email to {user.email}, but user was created")
                    else:
                        logger.info(f"Verification code generated for {user.email} but email not sent (verification disabled)")
            except Exception as token_error:
                logger.error(f"Error generating verification token for user {user.email}: {str(token_error)}", exc_info=True)
                # Don't fail registration if token generation fails
                # User and profile are already created, so registration should succeed
        except Exception as e:
            logger.error(f"Error in email verification flow for user {user.email}: {str(e)}", exc_info=True)
            # Don't fail registration if email sending fails
            # User and profile are already created, so registration should succeed
        
        serializer = UserSerializer(user)
        response_data = serializer.data
        response_data['email_verified'] = profile.email_verified
        # Code is stored in database - admin can retrieve it for customer support
        # DO NOT return code in registration response
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
    try:
        user = request.user
        
        # Get or create user profile
        profile, _ = UserProfile.objects.get_or_create(user=user)
        
        # Update user fields
        if 'email' in request.data:
            user.email = request.data['email']
        if 'first_name' in request.data:
            user.first_name = request.data['first_name']
        if 'last_name' in request.data:
            user.last_name = request.data['last_name']
        
        user.save()
        
        # Update profile fields - handle cases where fields might not exist yet (before migration)
        profile_fields = ['phone', 'bio', 'avatar_url', 'date_of_birth', 'timezone', 'locale']
        updated_profile_fields = []
        
        for field in profile_fields:
            if field in request.data:
                try:
                    # Check if field exists in the model
                    if not hasattr(profile, field):
                        # Field doesn't exist yet (migration not run), skip it
                        logger.warning(f"Field {field} does not exist in UserProfile model yet. Skipping update.")
                        continue
                    
                    if field == 'date_of_birth':
                        # Handle date field
                        date_value = request.data[field]
                        if date_value:
                            from django.utils.dateparse import parse_date
                            parsed_date = parse_date(date_value) if isinstance(date_value, str) else date_value
                            if parsed_date:
                                setattr(profile, field, parsed_date)
                            else:
                                setattr(profile, field, None)
                        else:
                            setattr(profile, field, None)
                    else:
                        setattr(profile, field, request.data[field] or '')
                    updated_profile_fields.append(field)
                except Exception as e:
                    logger.warning(f"Error updating field {field}: {str(e)}", exc_info=True)
                    # Continue with other fields even if one fails
        
        if updated_profile_fields:
            try:
                profile.save(update_fields=updated_profile_fields)
            except Exception as e:
                logger.error(f"Error saving profile: {str(e)}", exc_info=True)
                # Try saving without update_fields as fallback
                profile.save()
        
        # Return updated user info in the same format as user_info endpoint
        role = 'admin' if user.is_superuser else (profile.role if profile else 'viewer')
        response_data = {
            'username': user.username,
            'email': user.email or '',
            'first_name': user.first_name or '',
            'last_name': user.last_name or '',
            'role': role,
            'is_active': profile.is_active if profile else user.is_active,
        }
        
        # Add profile personal info if profile exists and fields are available
        if profile:
            try:
                response_data.update({
                    'phone': getattr(profile, 'phone', '') or '',
                    'bio': getattr(profile, 'bio', '') or '',
                    'avatar_url': getattr(profile, 'avatar_url', '') or '',
                    'date_of_birth': profile.date_of_birth.isoformat() if hasattr(profile, 'date_of_birth') and profile.date_of_birth else None,
                    'timezone': getattr(profile, 'timezone', 'UTC') or 'UTC',
                    'locale': getattr(profile, 'locale', 'en-US') or 'en-US',
                })
            except Exception as e:
                logger.warning(f"Error getting profile fields: {str(e)}", exc_info=True)
                # Use defaults if there's an error
                response_data.update({
                    'phone': '',
                    'bio': '',
                    'avatar_url': '',
                    'date_of_birth': None,
                    'timezone': 'UTC',
                    'locale': 'en-US',
                })
        else:
            response_data.update({
                'phone': '',
                'bio': '',
                'avatar_url': '',
                'date_of_birth': None,
                'timezone': 'UTC',
                'locale': 'en-US',
            })
        
        return Response(response_data)
    except Exception as e:
        logger.error(f"Error in update_own_profile: {str(e)}", exc_info=True)
        return Response({
            'error': 'Failed to update profile',
            'detail': str(e) if settings.DEBUG else 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
            return Response({'error': 'Card number must be exactly 16 digits'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Extract last4 from card number
        last4 = card_number[-4:]
        
        # Validate expiration
        try:
            exp_month = int(data.get('exp_month'))
            exp_year = int(data.get('exp_year'))
        except (TypeError, ValueError):
            return Response({'error': 'exp_month and exp_year must be numbers'}, status=status.HTTP_400_BAD_REQUEST)
        if exp_month < 1 or exp_month > 12:
            return Response({'error': 'exp_month must be between 1 and 12'}, status=status.HTTP_400_BAD_REQUEST)
        if exp_year < 2000:
            return Response({'error': 'exp_year must be a valid year'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Set ACH fields to empty
        account_number = ''
        routing_number = ''
        bank_name = ''
        account_type = ''
    else:
        # ACH validation
        required_fields = ['bank_name', 'account_number', 'routing_number']
        for field in required_fields:
            if not data.get(field):
                return Response({'error': f'{field} is required for ACH payment method'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate routing number (9 digits)
        routing_number = data.get('routing_number', '').replace(' ', '').replace('-', '')
        if len(routing_number) != 9 or not routing_number.isdigit():
            return Response({'error': 'Routing number must be exactly 9 digits'}, status=status.HTTP_400_BAD_REQUEST)
        
        account_number = data.get('account_number', '').replace(' ', '').replace('-', '')
        bank_name = data.get('bank_name', '')
        account_type = data.get('account_type', '')
        
        # Extract last4 from account number for display
        last4 = account_number[-4:] if len(account_number) >= 4 else ''
        
        # Set card fields to empty
        cardholder_name = ''
        card_number = ''
        exp_month = None
        exp_year = None

    payment_method = PaymentMethod.objects.create(
        user=request.user,
        nickname=data.get('nickname', ''),
        method_type=method_type,
        # Card fields
        cardholder_name=data.get('cardholder_name', ''),
        card_number=card_number,
        brand=data.get('brand', ''),
        last4=last4,
        exp_month=exp_month,
        exp_year=exp_year,
        billing_address_line1=data.get('billing_address_line1', ''),
        billing_address_line2=data.get('billing_address_line2', ''),
        billing_city=data.get('billing_city', ''),
        billing_state=data.get('billing_state', ''),
        billing_postal_code=data.get('billing_postal_code', ''),
        billing_country=data.get('billing_country', ''),
        # ACH fields
        bank_name=bank_name,
        account_type=account_type,
        account_number=account_number,
        routing_number=routing_number,
        bank_address_line1=data.get('bank_address_line1', ''),
        bank_address_line2=data.get('bank_address_line2', ''),
        bank_city=data.get('bank_city', ''),
        bank_state=data.get('bank_state', ''),
        bank_postal_code=data.get('bank_postal_code', ''),
        bank_country=data.get('bank_country', ''),
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
        try:
            subs = UserSubscription.objects.filter(user=request.user).order_by('-created_at')
            serializer = UserSubscriptionSerializer(subs, many=True)
            return Response(serializer.data)
        except Exception as e:
            # Handle case where new fields don't exist in database yet (migration not run)
            # Try to query only existing fields
            try:
                subs = UserSubscription.objects.filter(user=request.user).only(
                    'id', 'plan_name', 'role', 'start_date', 'end_date',
                    'is_recurring', 'status', 'notes', 'created_at', 'updated_at'
                ).order_by('-created_at')
                serializer = UserSubscriptionSerializer(subs, many=True)
                return Response(serializer.data)
            except Exception as inner_e:
                # If that also fails, return empty list
                logger.error(f"Error loading subscriptions: {str(inner_e)}", exc_info=True)
                return Response([], status=status.HTTP_200_OK)

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
    """List or create billing transactions for the authenticated user"""
    if request.method == 'GET':
        # Support filtering by status and date range
        transactions = BillingTransaction.objects.filter(user=request.user)
        
        # Filter by status if provided
        status_filter = request.query_params.get('status')
        if status_filter:
            transactions = transactions.filter(status=status_filter)
        
        # Filter by date range if provided
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        if start_date:
            from django.utils.dateparse import parse_date
            parsed_start = parse_date(start_date)
            if parsed_start:
                transactions = transactions.filter(created_at__gte=parsed_start)
        if end_date:
            from django.utils.dateparse import parse_date
            parsed_end = parse_date(end_date)
            if parsed_end:
                transactions = transactions.filter(created_at__lte=parsed_end)
        
        transactions = transactions.order_by('-created_at')
        serializer = BillingTransactionSerializer(transactions, many=True)
        return Response(serializer.data)

    # POST - Create new transaction
    data = request.data.copy()
    # Allow status to be set, default to 'pending' if not provided
    if 'status' not in data:
        data['status'] = 'pending'
    
    serializer = BillingTransactionSerializer(data=data)
    if serializer.is_valid():
        transaction = serializer.save(user=request.user)
        return Response(BillingTransactionSerializer(transaction).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def billing_summary(request):
    """Get financial summary for the authenticated user"""
    from django.db.models import Sum, Count, Q
    from decimal import Decimal
    
    user = request.user
    
    # Get all transactions
    transactions = BillingTransaction.objects.filter(user=user)
    
    # Calculate totals by status
    total_paid = transactions.filter(status='paid').aggregate(
        total=Sum('amount')
    )['total'] or Decimal('0.00')
    
    total_pending = transactions.filter(status='pending').aggregate(
        total=Sum('amount')
    )['total'] or Decimal('0.00')
    
    total_failed = transactions.filter(status='failed').aggregate(
        total=Sum('amount')
    )['total'] or Decimal('0.00')
    
    total_refunded = transactions.filter(status='refunded').aggregate(
        total=Sum('amount')
    )['total'] or Decimal('0.00')
    
    # Count transactions by status
    transaction_counts = transactions.values('status').annotate(count=Count('id'))
    status_counts = {item['status']: item['count'] for item in transaction_counts}
    
    # Get active subscriptions
    active_subs = UserSubscription.objects.filter(
        user=user,
        status='active'
    ).count()
    
    # Get default payment method
    default_payment = PaymentMethod.objects.filter(
        user=user,
        is_default=True
    ).first()
    
    default_payment_data = None
    if default_payment:
        default_payment_data = PaymentMethodSerializer(default_payment).data
    
    return Response({
        'total_paid': str(total_paid),
        'total_pending': str(total_pending),
        'total_failed': str(total_failed),
        'total_refunded': str(total_refunded),
        'net_revenue': str(total_paid - total_refunded),
        'transaction_counts': status_counts,
        'total_transactions': transactions.count(),
        'active_subscriptions': active_subs,
        'default_payment_method': default_payment_data,
    })


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def billing_transaction_detail(request, transaction_id):
    """Update or delete a specific billing transaction"""
    transaction = get_object_or_404(BillingTransaction, id=transaction_id, user=request.user)
    
    if request.method == 'DELETE':
        transaction.delete()
        return Response({'message': 'Transaction deleted'}, status=status.HTTP_200_OK)
    
    # PATCH - Update transaction
    data = request.data
    updated_fields = []
    
    # Only allow updating certain fields
    allowed_fields = ['status', 'description', 'invoice_id', 'metadata']
    for field in allowed_fields:
        if field in data:
            if field == 'metadata' and isinstance(data[field], dict):
                # Merge metadata if it's a dict
                current_metadata = transaction.metadata or {}
                transaction.metadata = {**current_metadata, **data[field]}
            else:
                setattr(transaction, field, data[field])
            updated_fields.append(field)
    
    if updated_fields:
        transaction.save(update_fields=updated_fields)
    
    serializer = BillingTransactionSerializer(transaction)
    return Response(serializer.data)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_settings(request):
    """Get or update user settings"""
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    
    if request.method == 'GET':
        # Return user settings with defaults
        default_settings = {
            'homepageCheckInterval': 5,
            'internalPagesCheckInterval': 1,
            'enableEmailNotifications': True,
            'enableSmsNotifications': False,
            'autoRunAudit': False,
            'auditDepth': 3,
            'timezone': 'UTC',
            'dateFormat': 'YYYY-MM-DD',
            'itemsPerPage': 25,
        }
        user_settings = profile.user_settings if profile.user_settings else {}
        # Merge defaults with user settings
        merged_settings = {**default_settings, **user_settings}
        return Response(merged_settings, status=status.HTTP_200_OK)
    
    # PUT - Update user settings
    if not isinstance(request.data, dict):
        return Response({'error': 'Settings must be a JSON object'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Merge existing settings with new settings
    current_settings = profile.user_settings if profile.user_settings else {}
    updated_settings = {**current_settings, **request.data}
    
    # Validate settings values
    if 'homepageCheckInterval' in updated_settings:
        interval = updated_settings['homepageCheckInterval']
        if not isinstance(interval, int) or interval < 1 or interval > 60:
            return Response({'error': 'homepageCheckInterval must be between 1 and 60'}, status=status.HTTP_400_BAD_REQUEST)
    
    if 'internalPagesCheckInterval' in updated_settings:
        interval = updated_settings['internalPagesCheckInterval']
        if not isinstance(interval, int) or interval < 1 or interval > 24:
            return Response({'error': 'internalPagesCheckInterval must be between 1 and 24'}, status=status.HTTP_400_BAD_REQUEST)
    
    if 'auditDepth' in updated_settings:
        depth = updated_settings['auditDepth']
        if not isinstance(depth, int) or depth < 1 or depth > 10:
            return Response({'error': 'auditDepth must be between 1 and 10'}, status=status.HTTP_400_BAD_REQUEST)
    
    if 'itemsPerPage' in updated_settings:
        items = updated_settings['itemsPerPage']
        if not isinstance(items, int) or items < 10 or items > 100:
            return Response({'error': 'itemsPerPage must be between 10 and 100'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Save settings
    profile.user_settings = updated_settings
    profile.save()
    
    return Response(updated_settings, status=status.HTTP_200_OK)


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

    # Get user's check interval from settings (default: 5 minutes)
    from users.models import UserProfile
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    user_settings = profile.user_settings if profile.user_settings else {}
    check_interval = user_settings.get('homepageCheckInterval', 5)

    site = MonitoredSite.objects.create(
        user=request.user,
        url=normalized_url,
        status='checking',
        status_duration='Just added',
        check_interval=check_interval
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
        # Simple delete - get_object_or_404 already verified ownership
        try:
            site.delete()
        except Exception as e:
            # If cascade delete fails due to missing related tables, delete directly via SQL
            from django.db import connection
            if 'does not exist' in str(e) or 'relation' in str(e).lower():
                with connection.cursor() as cursor:
                    cursor.execute("DELETE FROM users_monitoredsite WHERE id = %s", [site.id])
            else:
                raise
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
        # Ensure profile is saved before generating token
        if not profile.pk:
            profile.save()
        
        # Verify profile exists in database
        profile.refresh_from_db()
        
        code = profile.generate_verification_code()
        
        # Verify code was generated
        profile.refresh_from_db()
        if not profile.email_verification_code:
            logger.error(f"Code generation failed for user {user.email} - code field is still null")
            return Response({'error': 'Failed to generate verification code'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        email_sent = send_verification_email(user, code)
        # Build verification link for optional debug surface (same logic as email_verification.py)
        frontend_url = getattr(settings, 'FRONTEND_URL', None) or getattr(settings, 'NEXT_PUBLIC_APP_URL', None)
        if not frontend_url:
            frontend_url = 'http://localhost:3000' if getattr(settings, 'DEBUG', False) else 'https://pagerodeo.com'
        if frontend_url == 'http://localhost:8000':
            frontend_url = 'http://localhost:3000' if getattr(settings, 'DEBUG', False) else 'https://pagerodeo.com'
        verification_link = f"{frontend_url.rstrip('/')}/verify-email?code={code}"
        
        if email_sent:
            payload = {'message': 'Verification email sent successfully'}
            if getattr(settings, 'DEBUG', False):
                payload.update({'code': code, 'verification_link': verification_link})
            return Response(payload, status=status.HTTP_200_OK)
        else:
            # Email failed - return code as emergency fallback
            payload = {
                'error': 'Failed to send verification email',
                'code': code,
                'message': 'Use the verification code below to verify your email manually'
            }
            if getattr(settings, 'DEBUG', False):
                payload.update({'verification_link': verification_link})
            return Response(payload, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        logger.error(f"Error sending verification email: {str(e)}", exc_info=True)
        err_msg = str(e) if getattr(settings, 'DEBUG', False) else 'Failed to send verification email'
        return Response({'error': err_msg}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
@rate_limit_api
def verify_email(request):
    """Verify email with human-readable code (Public endpoint, rate limited)"""
    code = request.data.get('code', '').strip()
    
    if not code:
        return Response({'error': 'Verification code is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    logger.info(f"Verification attempt - code: {code[:10]}...")
    
    # Find user with matching code
    profiles = UserProfile.objects.filter(email_verification_code__isnull=False)
    verified_profile = None
    
    for profile in profiles:
        if profile.verify_code(code):
            logger.info(f"Code verified successfully for user {profile.user.email}")
            verified_profile = profile
            break
    
    if not verified_profile:
        logger.warning(f"Verification failed - no matching code found")
        
        # Check if email is provided and already verified
        email = request.data.get('email', '').strip()
        if email:
            try:
                user = User.objects.get(email=email)
                profile = user.profile
                if profile.email_verified:
                    return Response({
                        'message': 'Email is already verified. Please log in with your username and password.',
                        'email_verified': True
                    }, status=status.HTTP_200_OK)
            except (User.DoesNotExist, UserProfile.DoesNotExist, AttributeError):
                pass
        
        # Code not found - might be already used (cleared after verification) or invalid
        # Check if there are recently verified profiles (within last hour) - code might have been used
        from django.utils import timezone
        from datetime import timedelta
        recently_verified = UserProfile.objects.filter(
            email_verified=True,
            email_verification_sent_at__gte=timezone.now() - timedelta(hours=1)
        ).exists()
        
        if recently_verified:
            # Code was likely already used - suggest email is already verified
            return Response({
                'message': 'Email is already verified. Please log in with your username and password.',
                'email_verified': True
            }, status=status.HTTP_200_OK)
        
        # Code not found - invalid or expired
        return Response({
            'error': 'Invalid verification code. Please check the code and try again, or request a new verification email.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if code is expired
    if verified_profile.is_code_expired():
        return Response({'error': 'Verification code has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if already verified
    if verified_profile.email_verified:
        return Response({'message': 'Email is already verified'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Mark as verified and clear code
    verified_profile.email_verified = True
    verified_profile.email_verification_code = None
    verified_profile.email_verification_token = None
    verified_profile.email_verification_sent_at = None
    verified_profile.save()
    
    # Return success - user must log in with username/password
    return Response({
        'message': 'Email verified successfully. Please log in with your username and password.',
        'email_verified': True
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
        # Ensure profile is saved before generating token
        if not profile.pk:
            profile.save()
        
        # Verify profile exists in database
        profile.refresh_from_db()
        
        code = profile.generate_verification_code()
        
        # Verify code was generated
        profile.refresh_from_db()
        if not profile.email_verification_code:
            logger.error(f"Code generation failed for user {user.email} - code field is still null")
            return Response({'error': 'Failed to generate verification code'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        email_sent = send_verification_email(user, code)
        # Build verification link (for debug) - same logic as email_verification.py
        frontend_url = getattr(settings, 'FRONTEND_URL', None) or getattr(settings, 'NEXT_PUBLIC_APP_URL', None)
        if not frontend_url:
            frontend_url = 'http://localhost:3000' if getattr(settings, 'DEBUG', False) else 'https://pagerodeo.com'
        if frontend_url == 'http://localhost:8000':
            frontend_url = 'http://localhost:3000' if getattr(settings, 'DEBUG', False) else 'https://pagerodeo.com'
        verification_link = f"{frontend_url.rstrip('/')}/verify-email?code={code}"

        if email_sent:
            payload = {'message': 'Verification email sent successfully'}
            if getattr(settings, 'DEBUG', False):
                payload.update({'code': code, 'verification_link': verification_link})
            return Response(payload, status=status.HTTP_200_OK)
        else:
            # Email failed - return code as emergency fallback
            payload = {
                'error': 'Failed to send verification email',
                'code': code,
                'message': 'Use the verification code below to verify your email manually'
            }
            if getattr(settings, 'DEBUG', False):
                payload.update({'verification_link': verification_link})
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


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_user_verification_code(request, user_id):
    """Get verification code for a specific user (Admin only - for customer support)"""
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    try:
        profile = user.profile
    except UserProfile.DoesNotExist:
        return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Check if already verified
    if profile.email_verified:
        return Response({
            'message': 'Email is already verified', 
            'email_verified': True,
            'email': user.email
        }, status=status.HTTP_200_OK)
    
    # Check if verification code exists
    if not profile.email_verification_code:
        return Response({
            'error': 'No verification code found. User should request a new verification email.',
            'code': None,
            'email': user.email
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Check if token is expired
    if profile.is_token_expired():
        return Response({
            'error': 'Verification code has expired. User should request a new verification email.',
            'code': None,
            'expired': True,
            'email': user.email,
            'sent_at': profile.email_verification_sent_at
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Return the code (admin only - for customer support)
    from datetime import timedelta
    return Response({
        'code': profile.email_verification_code,
        'email': user.email,
        'username': user.username,
        'sent_at': profile.email_verification_sent_at,
        'expires_at': profile.email_verification_sent_at + timedelta(hours=24) if profile.email_verification_sent_at else None
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