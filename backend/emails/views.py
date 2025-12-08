from django.shortcuts import render, get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from .models import EmailCapture, UpdateSignup, Feedback
from .serializers import FeedbackSerializer, FeedbackCreateSerializer, FeedbackUpdateSerializer
import logging

logger = logging.getLogger(__name__)

def get_client_ip(request):
    """Get the client's IP address from the request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

@api_view(['POST'])
@permission_classes([AllowAny])
def send_contact_email(request):
    """Handle contact form submissions - send to pagerodeo25@gmail.com"""
    try:
        data = request.data
        name = data.get('name', '')
        email = data.get('email', '')
        subject = data.get('subject', '')
        message = data.get('message', '')
        
        # Validate required fields
        if not all([name, email, subject, message]):
            return Response({
                'error': 'All fields are required'
            }, status=400)
        
        # Get client IP address
        ip_address = get_client_ip(request)
        
        # Save to database
        EmailCapture.objects.create(
            email=email,
            form_type='contact',
            metadata={
                'name': name,
                'subject': subject,
                'message': message
            },
            ip_address=ip_address
        )
        
        # Create email content for admin
        email_subject = f"PageRodeo Contact Form: {subject}"
        email_body = f"""
New contact form submission from PageRodeo:

Name: {name}
Email: {email}
Subject: {subject}

Message:
{message}

---
Sent from PageRodeo Contact Form
        """.strip()
        
        # Send email to your Gmail inbox
        send_mail(
            subject=email_subject,
            message=email_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=['pagerodeo25@gmail.com'],
            fail_silently=False,
        )
        
        logger.info(f"Contact email sent successfully from {email}")
        
        return Response({
            'success': True,
            'message': 'Message sent successfully'
        })
        
    except Exception as e:
        logger.error(f"Error sending contact email: {str(e)}")
        return Response({
            'error': 'Failed to send message',
            'details': str(e)
        }, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def send_feedback_email(request):
    """Handle feedback form submissions - send to pagerodeo25@gmail.com"""
    try:
        data = request.data
        rating = data.get('rating', 0)
        great_work = data.get('greatWork', '')
        could_be_better = data.get('couldBeBetter', '')
        remove_and_relish = data.get('removeAndRelish', '')
        user_email = data.get('userEmail', None)  # Optional email from authenticated users
        
        # Get client IP address
        ip_address = get_client_ip(request)
        
        # Save to new Feedback model
        feedback = Feedback.objects.create(
            user_email=user_email,
            rating=rating,
            great_work=great_work,
            could_be_better=could_be_better,
            remove_and_relish=remove_and_relish,
            ip_address=ip_address,
            status='new'
        )
        
        # Also save to EmailCapture for backward compatibility
        EmailCapture.objects.create(
            email=user_email or 'feedback@no-email.com',
            form_type='feedback',
            metadata={
                'rating': rating,
                'great_work': great_work,
                'could_be_better': could_be_better,
                'remove_and_relish': remove_and_relish,
                'feedback_id': feedback.id
            },
            ip_address=ip_address
        )
        
        # Create email content for admin
        email_subject = f"PageRodeo Feedback - Rating: {rating}/5"
        email_body = f"""
New feedback submission from PageRodeo:

Rating: {rating}/5 stars

What's working great:
{great_work}

What could be better:
{could_be_better}

What to remove and relish:
{remove_and_relish}

---
Sent from PageRodeo Feedback Form
        """.strip()
        
        # Send email to your Gmail inbox
        send_mail(
            subject=email_subject,
            message=email_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=['pagerodeo25@gmail.com'],
            fail_silently=False,
        )
        
        logger.info(f"Feedback email sent successfully with rating {rating}")
        
        return Response({
            'success': True,
            'message': 'Feedback submitted successfully'
        })
        
    except Exception as e:
        logger.error(f"Error sending feedback email: {str(e)}")
        return Response({
            'error': 'Failed to submit feedback',
            'details': str(e)
        }, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def send_consultation_email(request):
    """Handle consultation form submissions - send to pagerodeo25@gmail.com"""
    try:
        data = request.data
        
        # Get client IP address
        ip_address = get_client_ip(request)
        
        # Save to database
        EmailCapture.objects.create(
            email=data.get('email', 'consultation@no-email.com'),
            form_type='consultation',
            metadata={
                'name': data.get('name', ''),
                'company': data.get('company', ''),
                'phone': data.get('phone', ''),
                'service': data.get('service', ''),
                'budget': data.get('budget', ''),
                'timeline': data.get('timeline', ''),
                'priority': data.get('priority', ''),
                'current_tools': data.get('currentTools', ''),
                'goals': data.get('goals', ''),
                'message': data.get('message', ''),
                'issues': data.get('issues', [])
            },
            ip_address=ip_address
        )
        
        # Create email content for admin
        email_subject = "PageRodeo Consultation Request"
        email_body = f"""
New consultation request from PageRodeo:

Name: {data.get('name', 'N/A')}
Email: {data.get('email', 'N/A')}
Company: {data.get('company', 'N/A')}
Phone: {data.get('phone', 'N/A')}
Service: {data.get('service', 'N/A')}
Budget: {data.get('budget', 'N/A')}
Timeline: {data.get('timeline', 'N/A')}
Priority: {data.get('priority', 'N/A')}

Current Tools: {data.get('currentTools', 'N/A')}
Goals: {data.get('goals', 'N/A')}

Message:
{data.get('message', 'N/A')}

Issues Selected: {', '.join(data.get('issues', []))}

---
Sent from PageRodeo Consultation Form
        """.strip()
        
        # Send email to your Gmail inbox
        send_mail(
            subject=email_subject,
            message=email_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=['pagerodeo25@gmail.com'],
            fail_silently=False,
        )
        
        logger.info(f"Consultation email sent successfully from {data.get('email', 'unknown')}")
        
        return Response({
            'success': True,
            'message': 'Consultation request submitted successfully'
        })
        
    except Exception as e:
        logger.error(f"Error sending consultation email: {str(e)}")
        return Response({
            'error': 'Failed to submit consultation request',
            'details': str(e)
        }, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def send_demo_request(request):
    """Handle demo request form submissions - send to pagerodeo25@gmail.com"""
    try:
        data = request.data
        
        # Validate required fields
        required_fields = ['name', 'email', 'role', 'useCase']
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            return Response({
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }, status=400)
        
        # Get client IP address
        ip_address = get_client_ip(request)
        
        # Save to database
        EmailCapture.objects.create(
            email=data.get('email', ''),
            form_type='demo_request',
            metadata={
                'name': data.get('name', ''),
                'company': data.get('company', ''),
                'role': data.get('role', ''),
                'useCase': data.get('useCase', ''),
                'message': data.get('message', ''),
                'user_id': data.get('user_id'),
                'username': data.get('username'),
            },
            ip_address=ip_address
        )
        
        # Create email content for admin
        email_subject = "PageRodeo Demo Request"
        email_body = f"""
New demo request from PageRodeo:

Name: {data.get('name', 'N/A')}
Email: {data.get('email', 'N/A')}
Company: {data.get('company', 'N/A')}
Role: {data.get('role', 'N/A')}
Use Case: {data.get('useCase', 'N/A')}

Additional Information:
{data.get('message', 'N/A')}

User Account: {data.get('username', 'Not logged in')} (ID: {data.get('user_id', 'N/A')})

---
Sent from PageRodeo Demo Request Form
        """.strip()
        
        # Send email to your Gmail inbox
        send_mail(
            subject=email_subject,
            message=email_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=['pagerodeo25@gmail.com'],
            fail_silently=False,
        )
        
        logger.info(f"Demo request email sent successfully from {data.get('email', 'unknown')}")
        
        return Response({
            'success': True,
            'message': 'Demo request submitted successfully'
        })
        
    except Exception as e:
        logger.error(f"Error sending demo request email: {str(e)}")
        return Response({
            'error': 'Failed to submit demo request',
            'details': str(e)
        }, status=500)

def send_demo_credentials_email(user_email, user_name, plan_name):
    """
    Send demo account credentials to a user who requested demo access during signup.
    
    Args:
        user_email: Email address of the user who requested demo
        user_name: Name of the user
        plan_name: One of 'analyst', 'auditor', 'manager', 'director', 'executive'
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        from django.core.cache import cache
        from users.demo_utils import get_or_create_demo_account, reset_demo_password, DEMO_ACCOUNTS
        
        if plan_name not in DEMO_ACCOUNTS:
            logger.error(f"Invalid plan name for demo: {plan_name}")
            return False
        
        config = DEMO_ACCOUNTS[plan_name]
        
        # Ensure demo account exists
        demo_user, _ = get_or_create_demo_account(plan_name)
        
        # Get password from cache (stored when reset via cron/manual command)
        # Cache key: demo_password_{plan_name}
        # Cache expires in 48 hours (172800 seconds)
        cache_key = f"demo_password_{plan_name}"
        demo_password = cache.get(cache_key)
        
        # If password not in cache (expired or never set), reset it
        if not demo_password:
            demo_password = reset_demo_password(plan_name)
            # Store in cache for 48 hours (172800 seconds)
            cache.set(cache_key, demo_password, 172800)
            logger.info(f"Reset and cached password for {plan_name} demo account")
        else:
            logger.info(f"Using cached password for {plan_name} demo account")
        
        # Plan display names
        plan_display_names = {
            'analyst': 'Analyst',
            'auditor': 'Auditor',
            'manager': 'Manager',
            'director': 'Director',
            'executive': 'Executive',
        }
        
        plan_display = plan_display_names.get(plan_name, plan_name.title())
        
        # Plan-specific features (simplified)
        plan_features = {
            'analyst': [
                'Build & Code Tracking',
                'Deeper Monitoring Analytics',
                'Essential Integrations (Slack, Telegram, Email, SMS)',
                'Developer-focused insights',
            ],
            'auditor': [
                'Comprehensive Site Audit',
                'Ongoing Monitoring',
                'Actionable recommendations',
                'Basic downtime alerts',
            ],
            'manager': [
                'Advanced AI Analysis',
                'Intelligent AI-Powered Insights',
                'High-frequency monitoring',
                'Predictive performance scoring',
            ],
            'director': [
                'Full Security Testing & Scanning',
                'Automated Site Maintenance Tools',
                'Complete SaaS Monitoring',
                'UI Testing / Automated Interface Testing',
            ],
            'executive': [
                'Full SEO Monitoring',
                'Comprehensive Analytics & Reporting',
                'Multi-layer monitoring',
                'AI-driven performance modeling',
            ],
        }
        
        features = plan_features.get(plan_name, [])
        
        # Create email content
        email_subject = f"Your PageRodeo {plan_display} Demo Account Access"
        
        email_body = f"""Hi {user_name},

Thank you for signing up! As requested, here are your demo account credentials for the {plan_display} plan:

Demo Account Username: {config['username']}
Demo Account Password: {demo_password}

Login URL: {settings.FRONTEND_URL or 'https://yourdomain.com'}/workspace/login

IMPORTANT: This password resets automatically every 48 hours for security reasons.

What you'll see in the {plan_display} demo:
- Pre-loaded sample monitoring data
- Example websites being monitored
- Performance reports and analytics
- All features available in the {plan_display} plan:
{chr(10).join(f'  • {feature}' for feature in features)}

To get started:
1. Go to the login page: {settings.FRONTEND_URL or 'https://yourdomain.com'}/workspace/login
2. Enter the demo credentials above
3. Explore all {plan_display} features with sample data

Ready to upgrade? Visit {settings.FRONTEND_URL or 'https://yourdomain.com'}/upgrade

Need help? Contact us at support@pagerodeo.com

Best regards,
The PageRodeo Team
        """.strip()
        
        # Send email
        send_mail(
            subject=email_subject,
            message=email_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
            fail_silently=False,
        )
        
        logger.info(f"Demo credentials email sent successfully to {user_email} for {plan_name} plan")
        return True
        
    except Exception as e:
        logger.error(f"Error sending demo credentials email to {user_email}: {str(e)}", exc_info=True)
        return False


@api_view(['POST'])
@permission_classes([AllowAny])
def send_update_signup(request):
    """Handle update signup form submissions - send to pagerodeo25@gmail.com with role info"""
    try:
        data = request.data
        email = data.get('email', '')
        role = data.get('role', '')
        
        # Validate required fields
        if not all([email, role]):
            return Response({
                'error': 'Email and role are required'
            }, status=400)
        
        # Get client IP address
        ip_address = get_client_ip(request)
        
        # Save to both database tables
        # 1. Save to EmailCapture for general tracking
        EmailCapture.objects.create(
            email=email,
            form_type='update_signup',
            metadata={
                'role': role,
                'source': 'upgrade_page'
            },
            ip_address=ip_address
        )
        
        # 2. Save to UpdateSignup for role-specific tracking
        UpdateSignup.objects.create(
            email=email,
            role=role,
            source='upgrade_page',
            ip_address=ip_address
        )
        
        # Create email content for admin
        email_subject = f"PageRodeo Update Signup: {role}"
        email_body = f"""
New update signup from PageRodeo:

Email: {email}
Role Interest: {role}
Source: Upgrade Page - Coming Soon Section

This user wants to be notified when {role} features are released.

---
Sent from PageRodeo Update Signup Form
        """.strip()
        
        # Send email to your Gmail inbox
        send_mail(
            subject=email_subject,
            message=email_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=['pagerodeo25@gmail.com'],
            fail_silently=False,
        )
        
        logger.info(f"Update signup email sent successfully from {email} for {role}")
        
        return Response({
            'success': True,
            'message': 'Successfully subscribed for updates'
        })
        
    except Exception as e:
        logger.error(f"Error sending update signup email: {str(e)}")
        return Response({
            'error': 'Failed to subscribe for updates',
            'details': str(e)
        }, status=500)


# Admin Feedback Management Views

@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_feedback(request):
    """List all feedback entries (admin only)"""
    try:
        # Get query parameters for filtering
        status_filter = request.query_params.get('status', None)
        rating_filter = request.query_params.get('rating', None)
        search = request.query_params.get('search', None)
        
        queryset = Feedback.objects.all()
        
        # Apply filters
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if rating_filter:
            queryset = queryset.filter(rating=int(rating_filter))
        
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(user_email__icontains=search) |
                Q(great_work__icontains=search) |
                Q(could_be_better__icontains=search) |
                Q(remove_and_relish__icontains=search)
            )
        
        serializer = FeedbackSerializer(queryset, many=True)
        return Response(serializer.data)
    
    except Exception as e:
        logger.error(f"Error listing feedback: {str(e)}")
        return Response({
            'error': 'Failed to retrieve feedback',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_feedback(request, feedback_id):
    """Get a single feedback entry (admin only)"""
    try:
        feedback = get_object_or_404(Feedback, id=feedback_id)
        serializer = FeedbackSerializer(feedback)
        return Response(serializer.data)
    
    except Exception as e:
        logger.error(f"Error retrieving feedback {feedback_id}: {str(e)}")
        return Response({
            'error': 'Failed to retrieve feedback',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PATCH', 'PUT'])
@permission_classes([IsAdminUser])
def update_feedback(request, feedback_id):
    """Update feedback status and admin notes (admin only)"""
    try:
        feedback = get_object_or_404(Feedback, id=feedback_id)
        serializer = FeedbackUpdateSerializer(feedback, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            # Return updated feedback with full details
            updated_serializer = FeedbackSerializer(feedback)
            return Response(updated_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Error updating feedback {feedback_id}: {str(e)}")
        return Response({
            'error': 'Failed to update feedback',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def delete_feedback(request, feedback_id):
    """Delete a feedback entry (admin only)"""
    try:
        feedback = get_object_or_404(Feedback, id=feedback_id)
        feedback.delete()
        return Response({
            'success': True,
            'message': 'Feedback deleted successfully'
        })
    
    except Exception as e:
        logger.error(f"Error deleting feedback {feedback_id}: {str(e)}")
        return Response({
            'error': 'Failed to delete feedback',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def feedback_stats(request):
    """Get feedback statistics (admin only)"""
    try:
        total = Feedback.objects.count()
        new_count = Feedback.objects.filter(status='new').count()
        reviewed_count = Feedback.objects.filter(status='reviewed').count()
        responded_count = Feedback.objects.filter(status='responded').count()
        
        # Calculate average rating
        from django.db.models import Avg
        avg_rating = Feedback.objects.aggregate(Avg('rating'))['rating__avg'] or 0
        
        # Calculate response rate (responded / total)
        response_rate = (responded_count / total * 100) if total > 0 else 0
        
        return Response({
            'total': total,
            'new': new_count,
            'reviewed': reviewed_count,
            'responded': responded_count,
            'average_rating': round(avg_rating, 1),
            'response_rate': round(response_rate, 1)
        })
    
    except Exception as e:
        logger.error(f"Error getting feedback stats: {str(e)}")
        return Response({
            'error': 'Failed to retrieve feedback statistics',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
