from django.urls import path
from .views import (
    user_info, list_users, create_user, get_user,
    update_user, delete_user, assign_role, user_stats, register_user,
    update_own_profile, change_password, corporate_profile,
    user_settings, monitored_site_list,
    monitored_site_detail
)
from .role_views import (
    list_roles, get_role, create_role, update_role, delete_role,
    list_permissions, get_role_permissions, update_role_permissions
)
from .permission_views import (
    check_permissions, user_permissions, get_navigation,
    get_sidebar_matrix, update_sidebar_matrix
)
from .sitemap_views import generate_sitemap, fetch_sitemap_xml
from .views import (
    send_verification_email_endpoint, verify_email, 
    resend_verification_email, verification_status, check_verification_status_by_email,
    get_user_verification_code, setup_2fa, verify_and_enable_2fa, disable_2fa,
    generate_backup_codes_2fa, verify_2fa_login, get_2fa_status
)

urlpatterns = [
    # Existing endpoints
    path('api/user-info/', user_info, name='user_info'),
    path('api/register/', register_user, name='register_user'),
    # Email verification endpoints
    path('api/auth/send-verification/', send_verification_email_endpoint, name='send_verification_email'),
    path('api/auth/verify-email/', verify_email, name='verify_email'),
    path('api/auth/resend-verification/', resend_verification_email, name='resend_verification'),
    path('api/auth/verification-status/', verification_status, name='verification_status'),
    path('api/auth/check-verification-status/', check_verification_status_by_email, name='check_verification_status_by_email'),
    path('api/users/<int:user_id>/verification-code/', get_user_verification_code, name='get_user_verification_code'),
    # Two-factor authentication endpoints
    path('api/auth/2fa/setup/', setup_2fa, name='setup_2fa'),
    path('api/auth/2fa/verify-enable/', verify_and_enable_2fa, name='verify_and_enable_2fa'),
    path('api/auth/2fa/disable/', disable_2fa, name='disable_2fa'),
    path('api/auth/2fa/generate-backup-codes/', generate_backup_codes_2fa, name='generate_backup_codes_2fa'),
    path('api/auth/2fa/verify-login/', verify_2fa_login, name='verify_2fa_login'),
    path('api/auth/2fa/status/', get_2fa_status, name='get_2fa_status'),
    path('api/profile/update/', update_own_profile, name='update_own_profile'),
    path('api/profile/change-password/', change_password, name='change_password'),
    path('api/profile/corporate/', corporate_profile, name='corporate_profile'),
    path('api/user/settings/', user_settings, name='user_settings'),
    path('api/monitor/sites/', monitored_site_list, name='monitored_site_list'),
    path('api/monitor/sites/<int:site_id>/', monitored_site_detail, name='monitored_site_detail'),
    path('api/sitemap/', generate_sitemap, name='generate_sitemap'),
    path('api/sitemap-xml/', fetch_sitemap_xml, name='fetch_sitemap_xml'),
    
    # New user management endpoints
    path('api/users/', list_users, name='list_users'),
    path('api/users/create/', create_user, name='create_user'),
    path('api/users/<int:user_id>/', get_user, name='get_user'),
    path('api/users/<int:user_id>/update/', update_user, name='update_user'),
    path('api/users/<int:user_id>/delete/', delete_user, name='delete_user'),
    path('api/users/<int:user_id>/role/', assign_role, name='assign_role'),
    path('api/users/stats/', user_stats, name='user_stats'),
    
    # Role management endpoints
    path('api/roles/', list_roles, name='list_roles'),
    path('api/roles/create/', create_role, name='create_role'),
    path('api/roles/<int:role_id>/', get_role, name='get_role'),
    path('api/roles/<int:role_id>/update/', update_role, name='update_role'),
    path('api/roles/<int:role_id>/delete/', delete_role, name='delete_role'),
    path('api/roles/<int:role_id>/permissions/', get_role_permissions, name='get_role_permissions'),
    path('api/roles/<int:role_id>/permissions/update/', update_role_permissions, name='update_role_permissions'),
    path('api/permissions/', list_permissions, name='list_permissions'),
    
    # Permission checking endpoints
    path('api/permissions/check/', check_permissions, name='check_permissions'),
    path('api/permissions/user/', user_permissions, name='user_permissions'),
    path('api/navigation/', get_navigation, name='get_navigation'),
    
    
    # Sidebar matrix endpoints
    path('api/roles/sidebar-matrix/', get_sidebar_matrix, name='get_sidebar_matrix'),
    path('api/roles/sidebar-matrix/update/', update_sidebar_matrix, name='update_sidebar_matrix'),
]
